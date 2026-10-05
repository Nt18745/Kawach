import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  Unsubscribe
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { User, TrustedContact, EmergencySession, SafetyTimer, Journey, LocationPoint } from '../types/database';

/**
 * Firebase Firestore Service Layer for HER-SAFE / Kawach
 * Implements real-time listeners and database mutations strictly conforming to
 * the Firebase Skill requirements with structured FirestoreErrorInfo error handling.
 */
export const firebaseService = {
  // ==========================================
  // 1. User Profile Operations
  // ==========================================
  async getUserProfile(userId: string): Promise<User | null> {
    const path = `users/${userId}`;
    try {
      const snap = await getDoc(doc(db, 'users', userId));
      if (!snap.exists()) return null;
      return snap.data() as User;
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, path);
      return null;
    }
  },

  async saveUserProfile(user: Partial<User> & { id: string }): Promise<void> {
    const path = `users/${user.id}`;
    try {
      const existing = await getDoc(doc(db, 'users', user.id));
      const payload: Partial<User> = {
        ...user,
        updatedAt: new Date().toISOString(),
        ...(existing.exists() ? {} : { createdAt: new Date().toISOString() })
      };
      await setDoc(doc(db, 'users', user.id), payload, { merge: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  },

  subscribeUserProfile(userId: string, onUpdate: (user: User | null) => void): Unsubscribe {
    const path = `users/${userId}`;
    return onSnapshot(
      doc(db, 'users', userId),
      (snap) => {
        if (snap.exists()) {
          onUpdate(snap.data() as User);
        } else {
          onUpdate(null);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, path);
      }
    );
  },

  // ==========================================
  // 2. Trusted Contacts Operations
  // ==========================================
  async getContacts(userId: string): Promise<TrustedContact[]> {
    const path = `users/${userId}/contacts`;
    try {
      const snap = await getDocs(collection(db, 'users', userId, 'contacts'));
      const list: TrustedContact[] = [];
      snap.forEach((d) => list.push(d.data() as TrustedContact));
      return list;
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, path);
      return [];
    }
  },

  async saveContact(userId: string, contact: TrustedContact): Promise<void> {
    const path = `users/${userId}/contacts/${contact.id}`;
    try {
      await setDoc(doc(db, 'users', userId, 'contacts', contact.id), contact, { merge: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  },

  async deleteContact(userId: string, contactId: string): Promise<void> {
    const path = `users/${userId}/contacts/${contactId}`;
    try {
      await deleteDoc(doc(db, 'users', userId, 'contacts', contactId));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  },

  subscribeContacts(userId: string, onUpdate: (contacts: TrustedContact[]) => void): Unsubscribe {
    const path = `users/${userId}/contacts`;
    return onSnapshot(
      collection(db, 'users', userId, 'contacts'),
      (snap) => {
        const list: TrustedContact[] = [];
        snap.forEach((d) => list.push(d.data() as TrustedContact));
        onUpdate(list);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, path);
      }
    );
  },

  // ==========================================
  // 3. Emergency SOS Sessions Operations
  // ==========================================
  async createEmergencySession(session: EmergencySession, publicShare: {
    userName: string;
    userPhone: string;
    address?: string;
  }): Promise<void> {
    const sessionPath = `emergency_sessions/${session.id}`;
    const sharePath = `public_shares/${session.shareToken}`;
    try {
      // 1. Create emergency session in Firestore
      await setDoc(doc(db, 'emergency_sessions', session.id), session);

      // 2. Create initial location breadcrumb
      const updateId = `loc-${Date.now()}`;
      await setDoc(doc(db, 'emergency_sessions', session.id, 'location_updates', updateId), {
        id: updateId,
        sessionId: session.id,
        userId: session.userId,
        latitude: session.initialLocation.latitude,
        longitude: session.initialLocation.longitude,
        accuracy: session.initialLocation.accuracy,
        address: session.initialLocation.address || 'GPS Coordinate Recorded',
        timestamp: new Date().toISOString()
      });

      // 3. Create public ephemeral share record for emergency responders / trusted contacts
      await setDoc(doc(db, 'public_shares', session.shareToken), {
        shareToken: session.shareToken,
        sessionId: session.id,
        userId: session.userId,
        userName: publicShare.userName,
        userPhone: publicShare.userPhone,
        active: true,
        latitude: session.initialLocation.latitude,
        longitude: session.initialLocation.longitude,
        accuracy: session.initialLocation.accuracy,
        address: session.initialLocation.address || 'Active SOS Location',
        expiresAt: session.expiresAt,
        lastUpdated: new Date().toISOString()
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, sessionPath);
    }
  },

  async updateEmergencyLocation(
    sessionId: string,
    shareToken: string,
    location: LocationPoint,
    userId: string
  ): Promise<void> {
    const sessionPath = `emergency_sessions/${sessionId}`;
    const sharePath = `public_shares/${shareToken}`;
    try {
      // Update session last known location
      await updateDoc(doc(db, 'emergency_sessions', sessionId), {
        lastKnownLocation: location,
        locationUpdateCount: Date.now()
      });

      // Add breadcrumb
      const updateId = `loc-${Date.now()}`;
      await setDoc(doc(db, 'emergency_sessions', sessionId, 'location_updates', updateId), {
        id: updateId,
        sessionId,
        userId,
        latitude: location.latitude,
        longitude: location.longitude,
        accuracy: location.accuracy,
        address: location.address || '',
        timestamp: new Date().toISOString()
      });

      // Update public share
      await updateDoc(doc(db, 'public_shares', shareToken), {
        latitude: location.latitude,
        longitude: location.longitude,
        accuracy: location.accuracy,
        address: location.address || '',
        lastUpdated: new Date().toISOString()
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, sessionPath);
    }
  },

  async cancelEmergencySession(
    sessionId: string,
    shareToken: string,
    reason: string
  ): Promise<void> {
    const sessionPath = `emergency_sessions/${sessionId}`;
    const sharePath = `public_shares/${shareToken}`;
    try {
      const now = new Date().toISOString();
      await updateDoc(doc(db, 'emergency_sessions', sessionId), {
        status: 'cancelled',
        cancelledAt: now,
        cancellationReason: reason
      });

      // Revoke public share immediately
      await updateDoc(doc(db, 'public_shares', shareToken), {
        active: false,
        lastUpdated: now
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, sessionPath);
    }
  },

  subscribeActiveEmergencySession(userId: string, onUpdate: (session: EmergencySession | null) => void): Unsubscribe {
    const path = `emergency_sessions`;
    const q = query(
      collection(db, 'emergency_sessions'),
      where('userId', '==', userId),
      where('status', '==', 'active')
    );
    return onSnapshot(
      q,
      (snap) => {
        if (!snap.empty) {
          onUpdate(snap.docs[0].data() as EmergencySession);
        } else {
          onUpdate(null);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, path);
      }
    );
  },

  // ==========================================
  // 4. Public Ephemeral Location Share (Viewer)
  // ==========================================
  async getPublicShare(shareToken: string): Promise<any | null> {
    const path = `public_shares/${shareToken}`;
    try {
      const snap = await getDoc(doc(db, 'public_shares', shareToken));
      if (!snap.exists()) return null;
      return snap.data();
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, path);
      return null;
    }
  },

  subscribePublicShare(shareToken: string, onUpdate: (data: any | null) => void): Unsubscribe {
    const path = `public_shares/${shareToken}`;
    return onSnapshot(
      doc(db, 'public_shares', shareToken),
      (snap) => {
        if (snap.exists()) {
          onUpdate(snap.data());
        } else {
          onUpdate(null);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, path);
      }
    );
  },

  async createPublicShare(share: {
    shareToken: string;
    userId: string;
    userName: string;
    userPhone?: string;
    latitude: number;
    longitude: number;
    accuracy?: number;
    address?: string;
    batteryLevel?: number;
    speedKmh?: number;
    heading?: number;
    comment?: string;
    expiresAt: string;
  }): Promise<void> {
    try {
      await setDoc(doc(db, 'public_shares', share.shareToken), {
        ...share,
        active: true,
        createdAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString()
      }, { merge: true });
    } catch (err) {
      console.warn('Firestore createPublicShare note:', err);
    }
  },

  async updatePublicShareLocation(shareToken: string, payload: {
    latitude: number;
    longitude: number;
    accuracy?: number;
    address?: string;
    batteryLevel?: number;
    speedKmh?: number;
    heading?: number;
  }): Promise<void> {
    try {
      await updateDoc(doc(db, 'public_shares', shareToken), {
        ...payload,
        lastUpdated: new Date().toISOString()
      });
    } catch (err) {
      console.warn('Firestore updatePublicShareLocation note:', err);
    }
  },

  async revokePublicShare(shareToken: string): Promise<void> {
    try {
      await updateDoc(doc(db, 'public_shares', shareToken), {
        active: false,
        revokedAt: new Date().toISOString()
      });
    } catch (err) {
      console.warn('Firestore revokePublicShare note:', err);
    }
  },

  // ==========================================
  // 5. Safety Timer Operations
  // ==========================================
  async saveSafetyTimer(userId: string, timer: SafetyTimer): Promise<void> {
    const path = `users/${userId}/safety_timers/${timer.id}`;
    try {
      await setDoc(doc(db, 'users', userId, 'safety_timers', timer.id), timer, { merge: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  },

  async cancelSafetyTimer(userId: string, timerId: string): Promise<void> {
    const path = `users/${userId}/safety_timers/${timerId}`;
    try {
      await updateDoc(doc(db, 'users', userId, 'safety_timers', timerId), {
        status: 'cancelled'
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, path);
    }
  },

  subscribeActiveSafetyTimer(userId: string, onUpdate: (timer: SafetyTimer | null) => void): Unsubscribe {
    const path = `users/${userId}/safety_timers`;
    return onSnapshot(
      collection(db, 'users', userId, 'safety_timers'),
      (snap) => {
        let active: SafetyTimer | null = null;
        snap.forEach((d) => {
          const t = d.data() as SafetyTimer;
          if (t.status === 'running' || (t.status as any) === 'active') {
            active = t;
          }
        });
        onUpdate(active);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, path);
      }
    );
  },

  // ==========================================
  // 6. Safe Journey Operations
  // ==========================================
  async saveJourney(userId: string, journey: Journey): Promise<void> {
    const path = `users/${userId}/journeys/${journey.id}`;
    try {
      await setDoc(doc(db, 'users', userId, 'journeys', journey.id), journey, { merge: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  },

  async endJourney(userId: string, journeyId: string, status: any = 'arrived_safe'): Promise<void> {
    const path = `users/${userId}/journeys/${journeyId}`;
    try {
      await updateDoc(doc(db, 'users', userId, 'journeys', journeyId), {
        status,
        completedAt: new Date().toISOString()
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, path);
    }
  },

  subscribeActiveJourney(userId: string, onUpdate: (journey: Journey | null) => void): Unsubscribe {
    const path = `users/${userId}/journeys`;
    return onSnapshot(
      collection(db, 'users', userId, 'journeys'),
      (snap) => {
        let active: Journey | null = null;
        snap.forEach((d) => {
          const j = d.data() as Journey;
          if (j.status === 'in_progress' || (j.status as any) === 'active') {
            active = j;
          }
        });
        onUpdate(active);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, path);
      }
    );
  }
};
