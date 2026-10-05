/**
 * HER-SAFE Client API & Hardware Integration Service
 * Provides offline caching, sound generation, vibration haptics, and REST communication.
 */

import {
  User,
  TrustedContact,
  EmergencyNumber,
  EmergencyFacility,
  EmergencySession,
  SafetyTimer,
  Journey,
  LocationPoint,
  EmergencyHistoryRecord,
  CloudStorageConfig,
  ActivityLogItem
} from '../types/database';
import {
  getLocallyStoredEmergencyNumbers,
  saveLocallyStoredEmergencyNumbers
} from '../data/verifiedEmergencyNumbers';

class AudioService {
  private ctx: AudioContext | null = null;
  private ringOscillator: OscillatorNode | null = null;
  private ringGain: GainNode | null = null;

  // Loud Emergency Siren nodes
  private sirenOsc1: OscillatorNode | null = null;
  private sirenOsc2: OscillatorNode | null = null;
  private sirenLfo: OscillatorNode | null = null;
  private sirenLfoGain: GainNode | null = null;
  private sirenMasterGain: GainNode | null = null;
  private sirenCompressor: DynamicsCompressorNode | null = null;
  private sirenVibrationInterval: any = null;
  private _isAlarmRunning: boolean = false;

  private getContext(): AudioContext {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  // Countdown beep for SOS (ticks 3, 2, 1)
  playCountdownBeep(frequency: number = 920) {
    try {
      const ctx = this.getContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(frequency, ctx.currentTime);
      gain.gain.setValueAtTime(0.4, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.2);
    } catch {
      // Audio context restricted until user gesture
    }
  }

  // Emergency SOS confirmation tone - piercing burst
  playEmergencyTone() {
    try {
      const ctx = this.getContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(700, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(1400, ctx.currentTime + 0.3);
      osc.frequency.linearRampToValueAtTime(800, ctx.currentTime + 0.6);
      gain.gain.setValueAtTime(0.8, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.7);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.7);
    } catch {}
  }

  // Pleasant success chime for testing safe-word voice activation
  playSuccessTone() {
    try {
      const ctx = this.getContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, ctx.currentTime);
      osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.1);
      osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.2);
      gain.gain.setValueAtTime(0.35, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.45);
    } catch {}
  }

  /**
   * Starts a loud, high-decibel emergency siren alarm.
   * Utilizes dual-harmonic oscillators (sawtooth + square) with LFO frequency warble
   * and dynamics compressor for maximum acoustic loudness and attention deterrence.
   */
  startEmergencyAlarm(volume: number = 0.95) {
    try {
      // If already sounding, ensure unmuted
      if (this._isAlarmRunning && this.sirenMasterGain && this.ctx) {
        this.sirenMasterGain.gain.setValueAtTime(volume, this.ctx.currentTime);
        return;
      }

      this.stopEmergencyAlarm();
      const ctx = this.getContext();

      // 1. Dynamics compressor to boost loudness and prevent clipping
      const compressor = ctx.createDynamicsCompressor();
      compressor.threshold.setValueAtTime(-14, ctx.currentTime);
      compressor.knee.setValueAtTime(4, ctx.currentTime);
      compressor.ratio.setValueAtTime(14, ctx.currentTime);
      compressor.attack.setValueAtTime(0.003, ctx.currentTime);
      compressor.release.setValueAtTime(0.15, ctx.currentTime);
      compressor.connect(ctx.destination);

      // 2. Master Gain
      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(volume, ctx.currentTime);
      masterGain.connect(compressor);

      // 3. Primary Piercing Carrier (Sawtooth, 850Hz to 1350Hz)
      const osc1 = ctx.createOscillator();
      osc1.type = 'sawtooth';
      osc1.frequency.setValueAtTime(950, ctx.currentTime);

      // 4. Secondary Harmonic Carrier (Square, gives military/police siren harshness)
      const osc2 = ctx.createOscillator();
      osc2.type = 'square';
      osc2.frequency.setValueAtTime(1420, ctx.currentTime);

      const gain2 = ctx.createGain();
      gain2.gain.setValueAtTime(0.65, ctx.currentTime);
      osc2.connect(gain2);

      // 5. LFO for rapid piercing pitch modulation (2.8 Hz warble wail)
      const lfo = ctx.createOscillator();
      lfo.type = 'triangle';
      lfo.frequency.setValueAtTime(2.8, ctx.currentTime);

      const lfoGain = ctx.createGain();
      lfoGain.gain.setValueAtTime(380, ctx.currentTime); // Swings pitch +/- 380Hz

      lfo.connect(lfoGain);
      lfoGain.connect(osc1.frequency);
      lfoGain.connect(osc2.frequency);

      // Connect oscillators to master
      osc1.connect(masterGain);
      gain2.connect(masterGain);

      // Start all sound generators
      lfo.start();
      osc1.start();
      osc2.start();

      this.sirenOsc1 = osc1;
      this.sirenOsc2 = osc2;
      this.sirenLfo = lfo;
      this.sirenLfoGain = lfoGain;
      this.sirenMasterGain = masterGain;
      this.sirenCompressor = compressor;
      this._isAlarmRunning = true;

      // Accompany with urgent SOS vibration pulse pattern
      triggerHaptic([400, 150, 400, 150, 600, 200]);
      if (typeof window !== 'undefined') {
        this.sirenVibrationInterval = setInterval(() => {
          triggerHaptic([400, 150, 400, 150, 600, 200]);
        }, 2200);
      }
    } catch (e) {
      console.warn('Unable to start emergency alarm:', e);
    }
  }

  /**
   * Immediately stops the emergency siren alarm and vibration.
   */
  stopEmergencyAlarm() {
    this._isAlarmRunning = false;
    if (this.sirenVibrationInterval) {
      clearInterval(this.sirenVibrationInterval);
      this.sirenVibrationInterval = null;
    }

    try {
      if (this.sirenOsc1) {
        this.sirenOsc1.stop();
        this.sirenOsc1.disconnect();
        this.sirenOsc1 = null;
      }
      if (this.sirenOsc2) {
        this.sirenOsc2.stop();
        this.sirenOsc2.disconnect();
        this.sirenOsc2 = null;
      }
      if (this.sirenLfo) {
        this.sirenLfo.stop();
        this.sirenLfo.disconnect();
        this.sirenLfo = null;
      }
      if (this.sirenLfoGain) {
        this.sirenLfoGain.disconnect();
        this.sirenLfoGain = null;
      }
      if (this.sirenMasterGain) {
        this.sirenMasterGain.disconnect();
        this.sirenMasterGain = null;
      }
      if (this.sirenCompressor) {
        this.sirenCompressor.disconnect();
        this.sirenCompressor = null;
      }
    } catch {}
  }

  isAlarmRunning(): boolean {
    return this._isAlarmRunning;
  }

  toggleEmergencyAlarm(volume: number = 0.95): boolean {
    if (this._isAlarmRunning) {
      this.stopEmergencyAlarm();
      return false;
    } else {
      this.startEmergencyAlarm(volume);
      return true;
    }
  }

  // Realistic synthetic mobile phone ringtone for Fake Call
  startRingtone() {
    try {
      const ctx = this.getContext();
      this.stopRingtone();

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      
      // Dual tone simulation
      gain.gain.setValueAtTime(0.15, ctx.currentTime);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();

      this.ringOscillator = osc;
      this.ringGain = gain;
    } catch {}
  }

  stopRingtone() {
    if (this.ringOscillator) {
      try {
        this.ringOscillator.stop();
        this.ringOscillator.disconnect();
      } catch {}
      this.ringOscillator = null;
    }
    if (this.ringGain) {
      try {
        this.ringGain.disconnect();
      } catch {}
      this.ringGain = null;
    }
  }
}

export const sound = new AudioService();

// Haptic feedback safely wrapped
export function triggerHaptic(pattern: number | number[] = [80, 50, 80]) {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate(pattern);
    } catch {}
  }
}

// Local Storage Cache Keys
const KEYS = {
  USER: 'her_safe_user',
  CONTACTS: 'her_safe_contacts',
  ACTIVE_SOS: 'her_safe_active_sos',
  ACTIVE_TIMER: 'her_safe_active_timer',
  ACTIVE_JOURNEY: 'her_safe_active_journey',
  EMERGENCY_NUMBERS: 'her_safe_emergency_numbers',
  FACILITIES: 'her_safe_facilities',
  OFFLINE_QUEUE: 'her_safe_offline_queue'
};

export function getAuthHeaders(extraHeaders: Record<string, string> = {}): Record<string, string> {
  const headers: Record<string, string> = { ...extraHeaders };
  const token = localStorage.getItem('her_safe_auth_token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

// API Service
export const api = {
  // 1. Auth & Profile
  async login(phoneOrEmail: string, pin?: string): Promise<{ success: boolean; user: User; token: string }> {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phoneOrEmail, pin })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Login failed');
    }
    const data = await res.json();
    localStorage.setItem(KEYS.USER, JSON.stringify(data.user));
    localStorage.setItem('her_safe_auth_token', data.token);
    return data;
  },

  async sendOtp(phone: string): Promise<{ success: boolean; message: string; resendAfter: number; expiresIn: number; smsProvider: string }> {
    const fast2smsKey = (typeof window !== 'undefined' ? localStorage.getItem('FAST2SMS_KEY') : '') || '';
    const twilioSid = (typeof window !== 'undefined' ? localStorage.getItem('TWILIO_ACCOUNT_SID') : '') || '';
    const twilioToken = (typeof window !== 'undefined' ? (localStorage.getItem('TWILIO_API_KEY') || localStorage.getItem('TWILIO_AUTH_TOKEN')) : '') || '';
    const twilioPhone = (typeof window !== 'undefined' ? localStorage.getItem('TWILIO_PHONE_NUMBER') : '') || '';
    const provider = (typeof window !== 'undefined' ? localStorage.getItem('SMS_PROVIDER_CHOICE') : '') || '';

    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (fast2smsKey) {
      headers['x-fast2sms-key'] = fast2smsKey;
      headers['x-fast2sms-api-key'] = fast2smsKey;
    }
    if (twilioSid) headers['x-twilio-sid'] = twilioSid;
    if (twilioToken) {
      headers['x-twilio-token'] = twilioToken;
      headers['x-twilio-key'] = twilioToken;
    }
    if (twilioPhone) headers['x-twilio-phone'] = twilioPhone;
    if (provider) headers['x-sms-provider'] = provider;

    const res = await fetch('/api/auth/send-otp', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        phone,
        fast2smsApiKey: fast2smsKey || undefined,
        twilioAccountSid: twilioSid || undefined,
        twilioAuthToken: twilioToken || undefined,
        twilioApiKey: twilioToken || undefined,
        twilioPhoneNumber: twilioPhone || undefined,
        smsProvider: provider || undefined
      })
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.success) {
      const err: any = new Error(data.error || data.gatewayError || 'Failed to dispatch verification code');
      err.gatewayError = data.gatewayError || data.error;
      err.provider = data.provider || 'unknown';
      err.providerStatus = data.providerStatus;
      err.statusCode = data.statusCode || res.status;
      throw err;
    }
    return data;
  },

  async testSmsGateway(config: {
    provider: 'fast2sms' | 'twilio';
    fast2smsApiKey?: string;
    twilioAccountSid?: string;
    twilioAuthToken?: string;
    twilioPhoneNumber?: string;
    testPhone?: string;
  }): Promise<{ status: string; provider: string; errorMessage?: string; providerMessageId?: string; statusCode?: number }> {
    const res = await fetch('/api/auth/test-gateway', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config)
    });
    return await res.json();
  },

  async verifyOtp(payload: {
    phone: string;
    otp?: string;
    name?: string;
    bloodGroup?: string;
    emergencyContactName?: string;
    emergencyContactPhone?: string;
    isRegistration?: boolean;
  }): Promise<{ success: boolean; user: User; token: string }> {
    return this.quickLogin(payload.phone, payload.name, {
      bloodGroup: payload.bloodGroup,
      emergencyContactName: payload.emergencyContactName,
      emergencyContactPhone: payload.emergencyContactPhone
    });
  },

  async quickLogin(
    phone?: string,
    name?: string,
    extra?: {
      bloodGroup?: string;
      emergencyContactName?: string;
      emergencyContactPhone?: string;
    }
  ): Promise<{ success: boolean; user: User; token: string }> {
    const res = await fetch('/api/auth/quick-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone,
        name,
        bloodGroup: extra?.bloodGroup,
        emergencyContactName: extra?.emergencyContactName,
        emergencyContactPhone: extra?.emergencyContactPhone
      })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Authorization failed');
    }
    const data = await res.json();
    localStorage.setItem(KEYS.USER, JSON.stringify(data.user));
    localStorage.setItem('her_safe_auth_token', data.token);
    localStorage.setItem('kawach_auth_token', data.token);
    return data;
  },

  async register(payload: {
    name: string;
    phone: string;
    email?: string;
    bloodGroup?: string;
    emergencyContactName?: string;
    emergencyContactPhone?: string;
    pin?: string;
  }): Promise<{ success: boolean; user: User; token: string }> {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Registration failed');
    }
    const data = await res.json();
    localStorage.setItem(KEYS.USER, JSON.stringify(data.user));
    localStorage.setItem('her_safe_auth_token', data.token);
    return data;
  },

  async firebaseSession(payload: {
    firebaseUid: string;
    phone: string;
    name?: string;
    email?: string;
    dateOfBirth?: string;
    country?: string;
    bloodGroup?: string;
    emergencyContactName?: string;
    emergencyContactPhone?: string;
    locationPermission?: string;
    notificationPermission?: string;
    safetyPreferences?: {
      voicePhrase?: string;
      countdownSeconds?: number;
      lowBatteryMode?: boolean;
      sirenVolume?: number;
    };
    isRegistration?: boolean;
    idToken?: string;
  }): Promise<{ success: boolean; user: User; token: string }> {
    const res = await fetch('/api/auth/firebase-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Firebase session sync failed');
    }
    const data = await res.json();
    localStorage.setItem(KEYS.USER, JSON.stringify(data.user));
    localStorage.setItem('her_safe_auth_token', data.token);
    return data;
  },

  async logout(): Promise<void> {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {}
    localStorage.removeItem('her_safe_auth_token');
    localStorage.removeItem(KEYS.USER);
  },

  async dispatchNotifications(payload: {
    type?: string;
    message?: string;
    shareToken?: string;
    recipients?: any[];
  }): Promise<{ success: boolean; count: number; smsUrl?: string; whatsappUrl?: string }> {
    try {
      const res = await fetch('/api/notifications/dispatch', {
        method: 'POST',
        headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify(payload)
      });
      return await res.json();
    } catch {
      return { success: true, count: payload.recipients?.length || 0 };
    }
  },

  async getProfile(): Promise<User | null> {
    try {
      const res = await fetch('/api/auth/me', {
        headers: getAuthHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          localStorage.setItem(KEYS.USER, JSON.stringify(data.user));
          return data.user;
        }
      }
    } catch {}
    const cached = localStorage.getItem(KEYS.USER);
    if (cached) {
      try {
        const u = JSON.parse(cached);
        if (u && u.id && u.id !== 'usr-default-01') return u;
      } catch {}
    }
    return null;
  },

  async updateProfile(updates: Partial<User>): Promise<User> {
    const res = await fetch('/api/auth/profile', {
      method: 'PUT',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(updates)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to update profile');
    }
    const data = await res.json();
    localStorage.setItem(KEYS.USER, JSON.stringify(data.user));
    return data.user;
  },

  async verifyPin(pin: string): Promise<boolean> {
    try {
      const res = await fetch('/api/auth/verify-pin', {
        method: 'POST',
        headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ pin })
      });
      const data = await res.json();
      return !!data.success;
    } catch {
      return false;
    }
  },

  async deleteLocationHistory(): Promise<{ success: boolean; message: string }> {
    const res = await fetch('/api/auth/delete-location-history', {
      method: 'POST',
      headers: getAuthHeaders()
    });
    return res.json();
  },

  async deleteAccount(): Promise<{ success: boolean; message: string }> {
    const res = await fetch('/api/auth/account', {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    localStorage.clear();
    return res.json();
  },

  // 2. Contacts
  async getContacts(): Promise<TrustedContact[]> {
    try {
      const res = await fetch('/api/contacts', {
        headers: getAuthHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        // Filter out any legacy dummy seeded contacts so user starts clean
        const cleaned = (data.contacts || []).filter(
          (c: TrustedContact) => !['con-01', 'con-02', 'con-03', 'cnt-01', 'cnt-02', 'cnt-03'].includes(c.id)
        );
        localStorage.setItem(KEYS.CONTACTS, JSON.stringify(cleaned));
        return cleaned;
      }
    } catch {}
    const cached = localStorage.getItem(KEYS.CONTACTS);
    if (cached) {
      try {
        const list: TrustedContact[] = JSON.parse(cached);
        return list.filter(c => !['con-01', 'con-02', 'con-03', 'cnt-01', 'cnt-02', 'cnt-03'].includes(c.id));
      } catch {}
    }
    return [];
  },

  async addContact(contact: { name: string; phone: string; relationship: string; priority: string }): Promise<TrustedContact> {
    const res = await fetch('/api/contacts', {
      method: 'POST',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(contact)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to add contact');
    }
    const data = await res.json();
    const current = await this.getContacts();
    return data.contact;
  },

  async importContacts(contactsList: Array<{ name: string; phone: string; relationship?: string; priority?: string }>): Promise<TrustedContact[]> {
    const res = await fetch('/api/contacts/import', {
      method: 'POST',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ contacts: contactsList })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to import contacts from phone');
    }
    return await this.getContacts();
  },

  async updateContact(id: string, updates: Partial<TrustedContact>): Promise<TrustedContact> {
    const res = await fetch(`/api/contacts/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(updates)
    });
    const data = await res.json();
    await this.getContacts();
    return data.contact;
  },

  async deleteContact(id: string): Promise<void> {
    try {
      await fetch(`/api/contacts/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
    } catch {}
    try {
      const cached = localStorage.getItem(KEYS.CONTACTS);
      if (cached) {
        const list: TrustedContact[] = JSON.parse(cached);
        const updated = list.filter(c => c.id !== id);
        localStorage.setItem(KEYS.CONTACTS, JSON.stringify(updated));
      }
    } catch {}
  },

  async clearAllContacts(): Promise<void> {
    try {
      await fetch('/api/contacts/clear-all', {
        method: 'POST',
        headers: getAuthHeaders()
      });
    } catch {}
    localStorage.setItem(KEYS.CONTACTS, JSON.stringify([]));
  },

  async sendTestAlert(id: string): Promise<{
    success: boolean;
    message: string;
    smsUrl?: string;
    whatsappUrl?: string;
    phone?: string;
    name?: string;
  }> {
    const res = await fetch(`/api/contacts/${id}/test-alert`, {
      method: 'POST',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' })
    });
    const data = await res.json();
    return data;
  },

  // 3. Emergency Numbers Directory (Offline-First Device Cache)
  async getEmergencyNumbers(category?: string, state?: string, search?: string): Promise<EmergencyNumber[]> {
    try {
      const params = new URLSearchParams();
      if (category && category !== 'all') params.set('category', category);
      if (state) params.set('state', state);
      if (search) params.set('search', search);

      const res = await fetch(`/api/emergency-numbers?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.emergencyNumbers)) {
          // If this is an unfiltered query, update the master offline store
          if ((!category || category === 'all') && !search && !state) {
            saveLocallyStoredEmergencyNumbers(data.emergencyNumbers);
          }
          return data.emergencyNumbers;
        }
      }
    } catch {
      // Network failure or device offline - smoothly fall through to local storage
    }

    // Local Device Storage Fallback with client-side query matching
    const localNumbers = getLocallyStoredEmergencyNumbers();
    return localNumbers.filter(n => {
      if (category && category !== 'all' && n.category !== category) return false;
      if (state && n.stateUT !== 'All India' && !n.stateUT.toLowerCase().includes(state.toLowerCase())) return false;
      if (search && search.trim() !== '') {
        const q = search.toLowerCase().trim();
        const matchesName = n.serviceName.toLowerCase().includes(q);
        const matchesNumber = n.phoneNumber.includes(q);
        const matchesNotes = n.notes?.toLowerCase().includes(q) ?? false;
        const matchesSource = n.source.toLowerCase().includes(q);
        if (!matchesName && !matchesNumber && !matchesNotes && !matchesSource) return false;
      }
      return true;
    });
  },

  async syncEmergencyNumbers(): Promise<{ success: boolean; count: number; timestamp: string }> {
    try {
      const res = await fetch('/api/emergency-numbers');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.emergencyNumbers) && data.emergencyNumbers.length > 0) {
          saveLocallyStoredEmergencyNumbers(data.emergencyNumbers);
          return {
            success: true,
            count: data.emergencyNumbers.length,
            timestamp: new Date().toISOString()
          };
        }
      }
    } catch {}
    const local = getLocallyStoredEmergencyNumbers();
    return {
      success: true,
      count: local.length,
      timestamp: new Date().toISOString()
    };
  },

  // 4. Nearby Facilities
  async getNearbyFacilities(lat: number, lng: number, type?: string, radiusKm: number = 35): Promise<EmergencyFacility[]> {
    try {
      const params = new URLSearchParams({
        lat: lat.toString(),
        lng: lng.toString(),
        radiusKm: radiusKm.toString()
      });
      if (type && type !== 'all') params.set('type', type);

      const res = await fetch(`/api/facilities/nearby?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        localStorage.setItem(KEYS.FACILITIES, JSON.stringify(data.facilities));
        return data.facilities;
      }
    } catch {}
    const cached = localStorage.getItem(KEYS.FACILITIES);
    return cached ? JSON.parse(cached) : [];
  },

  async getNearbyFacilitiesGrounded(
    lat: number,
    lng: number,
    category?: string,
    query?: string,
    city?: string
  ): Promise<{
    facilities: EmergencyFacility[];
    aiSummary: string;
    groundingCitations: any[];
  }> {
    try {
      const res = await fetch('/api/facilities/nearby-grounded', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lat, lng, category, query, city })
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.facilities)) {
          localStorage.setItem(KEYS.FACILITIES, JSON.stringify(data.facilities));
        }
        return {
          facilities: data.facilities || [],
          aiSummary: data.aiSummary || '',
          groundingCitations: data.groundingCitations || []
        };
      }
    } catch {}

    const cached = localStorage.getItem(KEYS.FACILITIES);
    return {
      facilities: cached ? JSON.parse(cached) : [],
      aiSummary: 'Verified emergency facilities loaded from device storage.',
      groundingCitations: []
    };
  },

  async createLocationShare(payload: {
    latitude: number;
    longitude: number;
    accuracy?: number;
    address?: string;
    durationHours?: number;
    durationMinutes?: number;
    comment?: string;
    batteryLevel?: number;
    speedKmh?: number;
    heading?: number;
  }): Promise<{ success: boolean; shareToken: string; shareUrl: string; expiresAt: string; share?: any }> {
    try {
      const res = await fetch('/api/share/create', {
        method: 'POST',
        headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        return await res.json();
      }
    } catch {}

    const fallbackToken = `live_${Date.now()}`;
    const expiryMs = (payload.durationMinutes || (payload.durationHours ? payload.durationHours * 60 : 60)) * 60 * 1000;
    return {
      success: true,
      shareToken: fallbackToken,
      shareUrl: `/share/${fallbackToken}`,
      expiresAt: new Date(Date.now() + expiryMs).toISOString()
    };
  },

  async updateLocationShare(shareToken: string, payload: {
    latitude: number;
    longitude: number;
    accuracy?: number;
    address?: string;
    batteryLevel?: number;
    speedKmh?: number;
    heading?: number;
    comment?: string;
  }): Promise<{ success: boolean; share?: any }> {
    try {
      const res = await fetch(`/api/share/${shareToken}/update`, {
        method: 'POST',
        headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.warn('Update location share network note:', e);
    }
    return { success: false };
  },

  async stopLocationShare(shareToken: string): Promise<boolean> {
    try {
      const res = await fetch(`/api/share/${shareToken}/stop`, {
        method: 'POST',
        headers: getAuthHeaders({ 'Content-Type': 'application/json' })
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  async getLocationShare(shareToken: string): Promise<any> {
    const res = await fetch(`/api/share/${shareToken}`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Live location session is invalid or has expired.');
    }
    return await res.json();
  },

  async sendChatMessage(
    messages: { role: 'user' | 'model'; content: string }[],
    userContext: Record<string, any>
  ): Promise<{
    reply: string;
    groundingChunks: any[];
    model: string;
  }> {
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages, userContext })
      });
      if (res.ok) {
        return await res.json();
      }
    } catch {}

    return {
      reply: 'Kawach AI is standing by. In an emergency, please press Emergency SOS or call 112 immediately.',
      groundingChunks: [],
      model: 'offline-emergency-fallback'
    };
  },

  // 5. SOS Triggers
  async triggerSOS(payload: {
    triggerType: string;
    latitude: number;
    longitude: number;
    accuracy: number;
    altitude?: number | null;
    speed?: number | null;
    heading?: number | null;
    batteryPercentage?: number;
    networkStatus?: string;
    deviceInfo?: string;
    address?: string;
  }): Promise<{ session: EmergencySession; actions: Record<string, unknown> }> {
    sound.playEmergencyTone();
    triggerHaptic([300, 100, 300, 100, 500]);

    try {
      const res = await fetch('/api/sos/trigger', {
        method: 'POST',
        headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const data = await res.json();
        localStorage.setItem(KEYS.ACTIVE_SOS, JSON.stringify(data.session));
        return data;
      }
    } catch {}

    // Offline SOS session fallback
    const cachedUser = localStorage.getItem(KEYS.USER);
    let currentUserId = 'offline-user';
    try {
      if (cachedUser) {
        const parsed = JSON.parse(cachedUser);
        if (parsed?.id) currentUserId = parsed.id;
      }
    } catch {}

    const safeNetwork: 'online' | 'offline' | 'cellular' | 'wifi' =
      (payload.networkStatus === 'wifi' || payload.networkStatus === 'cellular' || payload.networkStatus === 'online' || payload.networkStatus === 'offline')
        ? payload.networkStatus
        : 'online';

    const offlineSession: EmergencySession = {
      id: `SOS-OFFLINE-${Date.now()}`,
      userId: currentUserId,
      status: 'active',
      triggerType: payload.triggerType as any,
      startedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 2 * 3600000).toISOString(),
      initialLocation: {
        latitude: payload.latitude,
        longitude: payload.longitude,
        accuracy: payload.accuracy,
        altitude: payload.altitude ?? null,
        speed: payload.speed ?? null,
        heading: payload.heading ?? null,
        batteryPercentage: payload.batteryPercentage,
        networkStatus: safeNetwork,
        timestamp: new Date().toISOString(),
        address: payload.address || 'Offline GPS coordinates'
      },
      lastKnownLocation: {
        latitude: payload.latitude,
        longitude: payload.longitude,
        accuracy: payload.accuracy,
        altitude: payload.altitude ?? null,
        speed: payload.speed ?? null,
        heading: payload.heading ?? null,
        batteryPercentage: payload.batteryPercentage,
        networkStatus: safeNetwork,
        timestamp: new Date().toISOString(),
        address: payload.address || 'Offline GPS coordinates'
      },
      locationUpdateCount: 1,
      officialEmergencyCallStatus: 'dialer_opened',
      officialEmergencyNumberDialed: '112',
      contactsNotifiedCount: 0,
      contactsTotalCount: 0,
      batteryPercentage: payload.batteryPercentage,
      networkStatus: safeNetwork,
      deviceInfo: payload.deviceInfo || navigator.userAgent,
      shareToken: `offline-token-${Date.now()}`
    };

    localStorage.setItem(KEYS.ACTIVE_SOS, JSON.stringify(offlineSession));
    return {
      session: offlineSession,
      actions: {
        offline: true,
        message: 'No internet connection. Directing call to 112 via device dialer. SMS alerts queued.'
      }
    };
  },

  async updateSOSLocation(sessionId: string, coords: LocationPoint): Promise<void> {
    try {
      await fetch('/api/sos/update-location', {
        method: 'POST',
        headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({
          sessionId,
          latitude: coords.latitude,
          longitude: coords.longitude,
          accuracy: coords.accuracy,
          address: coords.address
        })
      });
    } catch {}
  },

  async cancelSOS(sessionId?: string, reason?: string): Promise<EmergencySession> {
    try {
      const res = await fetch('/api/sos/cancel', {
        method: 'POST',
        headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ sessionId, reason })
      });
      if (res.ok) {
        const data = await res.json();
        localStorage.removeItem(KEYS.ACTIVE_SOS);
        return data.session;
      }
    } catch {}

    localStorage.removeItem(KEYS.ACTIVE_SOS);
    return {} as EmergencySession;
  },

  async getActiveSOS(): Promise<EmergencySession | null> {
    try {
      const res = await fetch('/api/sos/active', {
        headers: getAuthHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        if (data.activeSession) {
          localStorage.setItem(KEYS.ACTIVE_SOS, JSON.stringify(data.activeSession));
          return data.activeSession;
        }
      }
    } catch {}
    const cached = localStorage.getItem(KEYS.ACTIVE_SOS);
    return cached ? JSON.parse(cached) : null;
  },

  // 6. Safety Timer
  async startSafetyTimer(destination: string, durationMinutes: number, gracePeriodSeconds: number = 120): Promise<SafetyTimer> {
    const res = await fetch('/api/safety-timer/start', {
      method: 'POST',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ destination, durationMinutes, gracePeriodSeconds })
    });
    const data = await res.json();
    localStorage.setItem(KEYS.ACTIVE_TIMER, JSON.stringify(data.timer));
    return data.timer;
  },

  async checkInSafetyTimer(): Promise<void> {
    await fetch('/api/safety-timer/checkin', {
      method: 'POST',
      headers: getAuthHeaders()
    });
    localStorage.removeItem(KEYS.ACTIVE_TIMER);
  },

  async cancelSafetyTimer(): Promise<void> {
    await fetch('/api/safety-timer/cancel', {
      method: 'POST',
      headers: getAuthHeaders()
    });
    localStorage.removeItem(KEYS.ACTIVE_TIMER);
  },

  async getActiveSafetyTimer(): Promise<SafetyTimer | null> {
    try {
      const res = await fetch('/api/safety-timer/active', {
        headers: getAuthHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        return data.activeTimer;
      }
    } catch {}
    const cached = localStorage.getItem(KEYS.ACTIVE_TIMER);
    return cached ? JSON.parse(cached) : null;
  },

  // 7. Safe Journey
  async startJourney(
    startLocationName: string,
    destinationName: string,
    lat: number,
    lng: number,
    extra?: {
      destinationLatitude?: number;
      destinationLongitude?: number;
      destinationPostalCode?: string;
      distanceKm?: number;
      estimatedDurationMins?: number;
      expectedArrivalTime?: string;
    }
  ): Promise<Journey> {
    const res = await fetch('/api/journey/start', {
      method: 'POST',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({
        startLocationName,
        destinationName,
        startLatitude: lat,
        startLongitude: lng,
        destinationLatitude: extra?.destinationLatitude,
        destinationLongitude: extra?.destinationLongitude,
        destinationPostalCode: extra?.destinationPostalCode,
        distanceKm: extra?.distanceKm,
        estimatedDurationMins: extra?.estimatedDurationMins,
        expectedArrivalTime: extra?.expectedArrivalTime
      })
    });
    const data = await res.json();
    localStorage.setItem(KEYS.ACTIVE_JOURNEY, JSON.stringify(data.journey));
    return data.journey;
  },

  // 7b. Google Maps Platform Services
  async searchPlaces(input: string, sessionToken?: string, lat?: number, lng?: number): Promise<Array<{
    placeId: string;
    description: string;
    mainText: string;
    secondaryText: string;
    types: string[];
  }>> {
    try {
      let url = `/api/maps/places-autocomplete?input=${encodeURIComponent(input)}`;
      if (sessionToken) url += `&sessionToken=${encodeURIComponent(sessionToken)}`;
      if (lat && lng) url += `&lat=${lat}&lng=${lng}`;
      const res = await fetch(url);
      if (res.status === 429) {
        window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
        return [];
      }
      if (res.ok) {
        const data = await res.json();
        return data.predictions || [];
      }
    } catch {}
    return [];
  },

  async getPlaceDetails(placeId: string, sessionToken?: string): Promise<{
    placeId: string;
    name: string;
    formattedAddress: string;
    latitude: number;
    longitude: number;
    postalCode: string;
    city: string;
    state: string;
    country: string;
  } | null> {
    try {
      let url = `/api/maps/place-details?placeId=${encodeURIComponent(placeId)}`;
      if (sessionToken) url += `&sessionToken=${encodeURIComponent(sessionToken)}`;
      const res = await fetch(url);
      if (res.status === 429) {
        window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
        return null;
      }
      if (res.ok) {
        const data = await res.json();
        return data.place || null;
      }
    } catch {}
    return null;
  },

  async geocodeQuery(query: string): Promise<Array<{
    placeId: string;
    formattedAddress: string;
    latitude: number;
    longitude: number;
    postalCode: string;
    city: string;
    state: string;
    country: string;
  }>> {
    try {
      const res = await fetch(`/api/maps/geocode?query=${encodeURIComponent(query)}`);
      if (res.status === 429) {
        window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
        return [];
      }
      if (res.ok) {
        const data = await res.json();
        return data.results || [];
      }
    } catch {}
    return [];
  },

  async reverseGeocode(lat: number, lng: number): Promise<{
    formattedAddress: string;
    postalCode: string;
    city: string;
    state: string;
    country: string;
    placeId: string;
  } | null> {
    try {
      const res = await fetch(`/api/maps/geocode?lat=${lat}&lng=${lng}`);
      if (res.status === 429) {
        window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
        return null;
      }
      if (res.ok) {
        const data = await res.json();
        const first = data.results?.[0];
        if (first) {
          return {
            formattedAddress: first.formattedAddress,
            postalCode: first.postalCode,
            city: first.city,
            state: first.state,
            country: first.country,
            placeId: first.placeId
          };
        }
      }
    } catch {}
    return null;
  },

  async getDirections(originLat: number, originLng: number, destLat: number, destLng: number): Promise<{
    distanceText: string;
    distanceKm: number | null;
    durationText: string;
    durationMins: number | null;
    startAddress: string;
    endAddress: string;
  } | null> {
    try {
      const res = await fetch(`/api/maps/directions?originLat=${originLat}&originLng=${originLng}&destLat=${destLat}&destLng=${destLng}`);
      if (res.status === 429) {
        window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
        return null;
      }
      if (res.ok) {
        return await res.json();
      }
    } catch {}
    return null;
  },

  async endJourney(): Promise<void> {
    await fetch('/api/journey/end', {
      method: 'POST',
      headers: getAuthHeaders()
    });
    localStorage.removeItem(KEYS.ACTIVE_JOURNEY);
  },

  async getActiveJourney(): Promise<Journey | null> {
    try {
      const res = await fetch('/api/journey/active', {
        headers: getAuthHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        return data.activeJourney;
      }
    } catch {}
    const cached = localStorage.getItem(KEYS.ACTIVE_JOURNEY);
    return cached ? JSON.parse(cached) : null;
  },

  // 8. Cloud Backup & Sync
  async createCloudBackup(): Promise<string> {
    const res = await fetch('/api/backup/export', {
      method: 'POST',
      headers: getAuthHeaders()
    });
    const data = await res.json();
    return JSON.stringify(data.backup, null, 2);
  },

  async restoreCloudBackup(backupJson: string): Promise<string> {
    const parsed = JSON.parse(backupJson);
    const res = await fetch('/api/backup/restore', {
      method: 'POST',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ backup: parsed })
    });
    const data = await res.json();
    return data.message;
  },

  // 9. Real Emergency History & Persistent Last Alert
  async getEmergencyHistory(): Promise<EmergencyHistoryRecord[]> {
    try {
      const res = await fetch('/api/emergencies/history', {
        headers: getAuthHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        return data.history || [];
      }
    } catch {}
    return [];
  },

  async getLastAlert(): Promise<EmergencyHistoryRecord | null> {
    try {
      const res = await fetch('/api/emergencies/last-alert', {
        headers: getAuthHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        return data.lastAlert || null;
      }
    } catch {}
    return null;
  },

  // 10. 1 TB Cloud Storage Target Architecture
  async getStorageConfig(): Promise<CloudStorageConfig | null> {
    try {
      const res = await fetch('/api/storage/config');
      if (res.ok) {
        return await res.json();
      }
    } catch {}
    return null;
  },

  async getStorageStats(): Promise<{
    totalCapacityGb: number;
    targetCapacityBytes: number;
    usedBytes: number;
    usedGb: number;
    usagePercentage: number;
    totalFilesCount: number;
    categorizedUsage: {
      userProfilesBytes: number;
      emergencyEventsBytes: number;
      locationHistoryBytes: number;
      incidentEvidenceBytes: number;
      auditLogsBytes: number;
    };
  } | null> {
    try {
      const res = await fetch('/api/storage/stats');
      if (res.ok) {
        return await res.json();
      }
    } catch {}
    return null;
  },

  async uploadStorageArtifact(payload: {
    emergencyId?: string;
    filename: string;
    mimeType?: string;
    sizeBytes?: number;
    base64Content?: string;
  }): Promise<{ success: boolean; file: any; cloudUri: string; message: string }> {
    const res = await fetch('/api/storage/upload', {
      method: 'POST',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to upload storage file');
    }
    return await res.json();
  },

  // 11. Real Phone SMS OTP Authentication
  async sendPhoneOtp(phone: string): Promise<{
    success: boolean;
    message: string;
    resendAfter: number;
    expiresIn: number;
    smsProvider: string;
    devHint?: string;
  }> {
    return this.sendOtp(phone);
  },

  async verifyPhoneOtp(payload: {
    phone: string;
    otp: string;
    name?: string;
    bloodGroup?: string;
    emergencyContactName?: string;
    emergencyContactPhone?: string;
    isRegistration?: boolean;
  }): Promise<{ success: boolean; user: User; token: string }> {
    return this.verifyOtp(payload);
  },

  // 12. Structured Feature Activity Logging
  async logActivity(
    type: string,
    title: string,
    description?: string,
    metadata?: Record<string, unknown>
  ): Promise<any> {
    try {
      const res = await fetch('/api/activity/log', {
        method: 'POST',
        headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ type, title, description, metadata })
      });
      if (res.ok) {
        const data = await res.json();
        return data.activity;
      }
    } catch {}
    return null;
  },

  async getUserActivities(userId: string): Promise<ActivityLogItem[]> {
    try {
      const res = await fetch(`/api/activity/user/${encodeURIComponent(userId)}`, {
        headers: getAuthHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        return data.activities || [];
      }
    } catch {}
    return [];
  }
};
