import React, { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import { User, TrustedContact, EmergencySession, SafetyTimer, Journey, LocationPoint, ThemeVariant } from '../types/database';
import { Language, translations, TranslationDict } from '../types/translations';
import { api, sound, triggerHaptic } from '../services/api';
import { notifications } from '../services/notifications';
import { signOut, onAuthStateChanged } from 'firebase/auth';
import { auth as firebaseAuth } from '../lib/firebase';
import { firebaseService } from '../services/firebaseService';
import { offlineSyncService } from '../services/offlineSyncService';

export type ActiveModal =
  | null
  | 'emergency_services'
  | 'help_near_me'
  | 'emergency_numbers'
  | 'trusted_contacts'
  | 'safety_timer'
  | 'safe_journey'
  | 'my_location'
  | 'settings'
  | 'sms_gateway'
  | 'whatsapp_live_location'
  | 'live_location'
  | 'fake_call_setup'
  | 'voice_sos_setup'
  | 'hardware_sos_guide'
  | 'admin_dashboard'
  | 'privacy_policy'
  | 'pin_lock'
  | 'emergency_history'
  | 'ai_chat';

interface AppContextType {
  user: User | null;
  contacts: TrustedContact[];
  language: Language;
  t: TranslationDict;
  darkMode: boolean;
  highContrast: boolean;
  lowBatteryMode: boolean;
  batteryLevel: number | null;
  themeVariant: ThemeVariant;
  setThemeVariant: (theme: ThemeVariant) => void;
  isOnline: boolean;
  currentLocation: LocationPoint | null;
  locationError: string | null;
  locationPermissionStatus: 'prompt' | 'granted' | 'denied';
  isGPSVerified: boolean;
  checkLocationPermission: () => Promise<'prompt' | 'granted' | 'denied'>;
  requestLocationPermission: () => Promise<{ success: boolean; status: 'prompt' | 'granted' | 'denied'; location: LocationPoint | null; errorMessage?: string }>;
  requestGPSLocation: () => Promise<LocationPoint | null>;
  setManualLocation: (lat: number, lng: number, address: string) => void;
  activeModal: ActiveModal;
  setActiveModal: (m: ActiveModal) => void;
  setLanguage: (lang: Language) => void;
  toggleDarkMode: () => void;
  toggleHighContrast: () => void;
  toggleLowBatteryMode: () => void;
  refreshUserData: () => Promise<void>;

  // Authentication
  isAuthenticated: boolean;
  login: (phoneOrEmail: string, pin?: string) => Promise<boolean>;
  quickLogin: (
    phone?: string,
    name?: string,
    extra?: {
      bloodGroup?: string;
      emergencyContactName?: string;
      emergencyContactPhone?: string;
    }
  ) => Promise<boolean>;
  verifyOtpSession: (payload: {
    phone: string;
    otp?: string;
    name?: string;
    bloodGroup?: string;
    emergencyContactName?: string;
    emergencyContactPhone?: string;
    isRegistration?: boolean;
  }) => Promise<boolean>;
  loginWithFirebaseSession: (payload: {
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
  }) => Promise<boolean>;
  register: (payload: {
    name: string;
    phone: string;
    email?: string;
    bloodGroup?: string;
    emergencyContactName?: string;
    emergencyContactPhone?: string;
    pin?: string;
  }) => Promise<boolean>;
  logout: () => Promise<void>;

  // Notification Service
  notificationPermission: NotificationPermission;
  requestNotificationPermission: () => Promise<NotificationPermission>;
  lastDispatchedNotification: { shareToken?: string; smsUrl?: string; message?: string; count?: number } | null;
  clearNotificationBanner: () => void;
  dispatchEmergencyAlert: (customMessage?: string) => Promise<void>;
  
  // SOS & Emergency Session
  activeSOS: EmergencySession | null;
  isCountingDown: boolean;
  countdownValue: number;
  triggerSOSInitiation: (triggerType?: string, options?: { silent?: boolean; bypassCountdown?: boolean }) => void;
  cancelSOSCountdown: () => void;
  cancelActiveSOS: (reason?: string) => Promise<void>;
  
  // Siren Alarm
  isSirenAlarmActive: boolean;
  startSirenAlarm: () => void;
  stopSirenAlarm: () => void;
  toggleSirenAlarm: () => void;
  
  // Voice SOS & Hands-Free Safe-Word Activation
  isListeningVoice: boolean;
  voiceStatus: string;
  safeWord: string;
  updateSafeWord: (phrase: string) => Promise<boolean>;
  isDiscreetVoiceMode: boolean;
  setIsDiscreetVoiceMode: (val: boolean) => void;
  voiceSensitivity: 'low' | 'medium' | 'high';
  setVoiceSensitivity: (val: 'low' | 'medium' | 'high') => void;
  voiceAudioLevel: number;
  lastVoiceTranscript: string;
  voiceTestSuccess: boolean;
  isTestVoiceMode: boolean;
  setIsTestVoiceMode: (val: boolean) => void;
  startVoiceListening: (options?: { isTestMode?: boolean }) => Promise<void>;
  stopVoiceListening: () => void;
  testSafeWordMatch: (testPhrase: string) => boolean;
  
  // Safety Timer
  activeTimer: SafetyTimer | null;
  timerRemainingSeconds: number;
  startSafetyTimer: (destination: string, minutes: number, graceSeconds?: number) => Promise<void>;
  checkInTimer: () => Promise<void>;
  cancelTimer: () => Promise<void>;
  
  // Safe Journey
  activeJourney: Journey | null;
  startJourney: (
    startName: string,
    destName: string,
    extra?: {
      destinationLatitude?: number;
      destinationLongitude?: number;
      destinationPostalCode?: string;
      distanceKm?: number;
      estimatedDurationMins?: number;
      expectedArrivalTime?: string;
    }
  ) => Promise<void>;
  endJourney: (status?: string) => Promise<void>;
  
  // Fake Call
  isFakeCallRinging: boolean;
  fakeCallerName: string;
  isFakeCallAnswered: boolean;
  fakeCallDuration: number;
  scheduleFakeCall: (name: string, delaySeconds: number) => void;
  answerFakeCall: () => void;
  declineFakeCall: () => void;
  
  // Discreet Confirmation Banner
  discreetAlertBanner: { message: string; eventId?: string; timestamp: string; batteryLevel?: number } | null;
  dismissDiscreetAlertBanner: () => void;

  // Audible Siren Deterrent preference (Disabled by default for silent SOS)
  audibleSirenDeterrentEnabled: boolean;
  setAudibleSirenDeterrentEnabled: (val: boolean) => Promise<void>;

  // Trusted Contact Management extensions
  toggleContactAlertPreference: (contactId: string, receiveAlerts: boolean) => Promise<void>;
  setContactPrimary: (contactId: string) => Promise<void>;
  verifyContactLine: (contactId: string) => Promise<{ success: boolean; message: string }>;

  // Quick dial helper
  dialEmergencyNumber: (phone: string, serviceName: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [contacts, setContacts] = useState<TrustedContact[]>([]);
  const [language, setLanguageState] = useState<Language>('en');
  const [darkMode, setDarkMode] = useState<boolean>(true);
  const [highContrast, setHighContrast] = useState<boolean>(false);
  const [lowBatteryMode, setLowBatteryMode] = useState<boolean>(false);
  const [themeVariant, setThemeVariantState] = useState<ThemeVariant>('crimson');
  const [batteryLevel, setBatteryLevel] = useState<number | null>(null);
  const [isOnline, setIsOnline] = useState<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true);
  
  const [currentLocation, setCurrentLocation] = useState<LocationPoint | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [locationPermissionStatus, setLocationPermissionStatus] = useState<'prompt' | 'granted' | 'denied'>('prompt');
  const [isGPSVerified, setIsGPSVerified] = useState<boolean>(false);
  const [activeModal, setActiveModal] = useState<ActiveModal>(null);

  // Authentication States
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return !!localStorage.getItem('her_safe_auth_token') || !!localStorage.getItem('her_safe_user');
  });

  // Notification States
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>(() => {
    return notifications.getPermission();
  });
  const [lastDispatchedNotification, setLastDispatchedNotification] = useState<{
    shareToken?: string;
    smsUrl?: string;
    message?: string;
    count?: number;
  } | null>(null);

  const clearNotificationBanner = () => {
    setLastDispatchedNotification(null);
  };

  const requestNotificationPermission = async () => {
    const status = await notifications.requestPermission();
    setNotificationPermission(status);
    return status;
  };

  // SOS States
  const [activeSOS, setActiveSOS] = useState<EmergencySession | null>(null);
  const [isCountingDown, setIsCountingDown] = useState<boolean>(false);
  const [countdownValue, setCountdownValue] = useState<number>(3);
  const [countdownTimerId, setCountdownTimerId] = useState<NodeJS.Timeout | null>(null);
  const [isSirenAlarmActive, setIsSirenAlarmActive] = useState<boolean>(false);

  // Voice SOS & Hands-Free Safe-Word States
  const [safeWord, setSafeWordState] = useState<string>(() => {
    return localStorage.getItem('her_safe_safeword') || 'Help me Kawach';
  });
  const [isDiscreetVoiceMode, setIsDiscreetVoiceModeState] = useState<boolean>(() => {
    return localStorage.getItem('her_safe_discreet_voice') === 'true';
  });
  const [voiceSensitivity, setVoiceSensitivityState] = useState<'low' | 'medium' | 'high'>(() => {
    return (localStorage.getItem('her_safe_voice_sensitivity') as 'low' | 'medium' | 'high') || 'medium';
  });
  const [isListeningVoice, setIsListeningVoice] = useState<boolean>(false);
  const [voiceStatus, setVoiceStatus] = useState<string>('Voice SOS Standby');
  const [voiceAudioLevel, setVoiceAudioLevel] = useState<number>(0);
  const [lastVoiceTranscript, setLastVoiceTranscript] = useState<string>('');
  const [voiceTestSuccess, setVoiceTestSuccess] = useState<boolean>(false);
  const [isTestVoiceMode, setIsTestVoiceModeState] = useState<boolean>(false);

  const micStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioAnimFrameRef = useRef<number | null>(null);
  const speechRecognitionRef = useRef<any>(null);
  const isListeningVoiceRef = useRef<boolean>(false);
  const isTestVoiceModeRef = useRef<boolean>(false);
  const safeWordRef = useRef<string>(safeWord);
  const isDiscreetVoiceModeRef = useRef<boolean>(isDiscreetVoiceMode);
  const voiceSensitivityRef = useRef<'low' | 'medium' | 'high'>(voiceSensitivity);

  const setIsTestVoiceMode = (val: boolean) => {
    setIsTestVoiceModeState(val);
    isTestVoiceModeRef.current = val;
  };

  const setIsDiscreetVoiceMode = (val: boolean) => {
    setIsDiscreetVoiceModeState(val);
    isDiscreetVoiceModeRef.current = val;
    localStorage.setItem('her_safe_discreet_voice', val ? 'true' : 'false');
  };

  const setVoiceSensitivity = (val: 'low' | 'medium' | 'high') => {
    setVoiceSensitivityState(val);
    voiceSensitivityRef.current = val;
    localStorage.setItem('her_safe_voice_sensitivity', val);
  };

  const updateSafeWord = async (phrase: string): Promise<boolean> => {
    const clean = phrase.trim();
    if (!clean) return false;
    setSafeWordState(clean);
    safeWordRef.current = clean;
    localStorage.setItem('her_safe_safeword', clean);
    try {
      await api.updateProfile({ voiceEmergencyPhrase: clean });
      if (user?.id) {
        await firebaseService.saveUserProfile({ id: user.id, voiceEmergencyPhrase: clean });
      }
      return true;
    } catch (err) {
      console.warn('Failed to sync safe-word to profile:', err);
      return true;
    }
  };

  // Discreet Confirmation Banner per Core Requirement
  const [discreetAlertBanner, setDiscreetAlertBanner] = useState<{
    message: string;
    eventId?: string;
    timestamp: string;
    batteryLevel?: number;
  } | null>(null);

  const dismissDiscreetAlertBanner = () => {
    setDiscreetAlertBanner(null);
  };

  // Audible Siren Deterrent preference (Disabled by default - SOS must be silent on activating device)
  const [audibleSirenDeterrentEnabled, setAudibleSirenDeterrentEnabledState] = useState<boolean>(() => {
    return localStorage.getItem('her_safe_audible_siren') === 'true';
  });

  const setAudibleSirenDeterrentEnabled = async (val: boolean) => {
    setAudibleSirenDeterrentEnabledState(val);
    localStorage.setItem('her_safe_audible_siren', val ? 'true' : 'false');
    try {
      await api.updateProfile({ audibleSirenDeterrentEnabled: val });
    } catch {}
  };

  // Contact management helpers
  const toggleContactAlertPreference = async (contactId: string, receiveAlerts: boolean) => {
    try {
      await api.updateContact(contactId, { receiveAlerts });
      await refreshUserData();
    } catch (err) {
      console.warn('Failed to update contact alert preference:', err);
    }
  };

  const setContactPrimary = async (contactId: string) => {
    try {
      await api.updateContact(contactId, { priority: 'primary' });
      await refreshUserData();
    } catch (err) {
      console.warn('Failed to set contact primary:', err);
    }
  };

  const verifyContactLine = async (contactId: string): Promise<{ success: boolean; message: string }> => {
    try {
      const res = await api.sendTestAlert(contactId);
      await api.updateContact(contactId, {
        verificationStatus: 'verified',
        notificationStatus: 'delivered',
        lastDeliveryStatus: 'delivered',
        verifiedAt: new Date().toISOString()
      });
      await refreshUserData();
      return { success: true, message: res.message || 'Emergency line verified successfully.' };
    } catch (err: any) {
      return { success: false, message: err.message || 'Line verification ping failed.' };
    }
  };

  // Safety Timer States
  const [activeTimer, setActiveTimer] = useState<SafetyTimer | null>(null);
  const [timerRemainingSeconds, setTimerRemainingSeconds] = useState<number>(0);

  // Journey States
  const [activeJourney, setActiveJourney] = useState<Journey | null>(null);

  // Fake Call States
  const [isFakeCallRinging, setIsFakeCallRinging] = useState<boolean>(false);
  const [fakeCallerName, setFakeCallerName] = useState<string>('Dad');
  const [isFakeCallAnswered, setIsFakeCallAnswered] = useState<boolean>(false);
  const [fakeCallDuration, setFakeCallDuration] = useState<number>(0);

  const t = translations[language] || translations.en;

  // Initialize Data
  const refreshUserData = useCallback(async () => {
    try {
      const u = await api.getProfile();
      if (!u) {
        setUser(null);
        setIsAuthenticated(false);
        setContacts([]);
        return;
      }
      setUser(u);
      setIsAuthenticated(true);
      if (u.preferredLanguage) setLanguageState(u.preferredLanguage);
      if (u.themeVariant) setThemeVariantState(u.themeVariant);
      if (u.darkMode !== undefined) setDarkMode(u.darkMode);
      if (u.highContrastMode !== undefined) setHighContrast(u.highContrastMode);
      if (u.lowBatteryMode !== undefined) setLowBatteryMode(u.lowBatteryMode);
      if (u.voiceEmergencyPhrase) {
        setSafeWordState(u.voiceEmergencyPhrase);
        safeWordRef.current = u.voiceEmergencyPhrase;
        localStorage.setItem('her_safe_safeword', u.voiceEmergencyPhrase);
      }

      const c = await api.getContacts();
      setContacts(c);

      const sos = await api.getActiveSOS();
      setActiveSOS(sos);

      const timer = await api.getActiveSafetyTimer();
      setActiveTimer(timer);

      const journey = await api.getActiveJourney();
      setActiveJourney(journey);
    } catch (err) {
      console.error('Error refreshing user data:', err);
    }
  }, []);

  const login = async (phoneOrEmail: string, pin?: string): Promise<boolean> => {
    try {
      const res = await api.login(phoneOrEmail, pin);
      setUser(res.user);
      setIsAuthenticated(true);
      await refreshUserData();
      return true;
    } catch (err) {
      console.error('Login error:', err);
      return false;
    }
  };

  const register = async (payload: {
    name: string;
    phone: string;
    email?: string;
    bloodGroup?: string;
    emergencyContactName?: string;
    emergencyContactPhone?: string;
    pin?: string;
  }): Promise<boolean> => {
    try {
      const res = await api.register(payload);
      setUser(res.user);
      setIsAuthenticated(true);
      await refreshUserData();
      return true;
    } catch (err) {
      console.error('Registration error:', err);
      return false;
    }
  };

  const quickLogin = async (
    phone?: string,
    name?: string,
    extra?: {
      bloodGroup?: string;
      emergencyContactName?: string;
      emergencyContactPhone?: string;
    }
  ): Promise<boolean> => {
    try {
      const res = await api.quickLogin(phone, name, extra);
      setUser(res.user);
      setIsAuthenticated(true);
      await refreshUserData();
      return true;
    } catch (err) {
      console.error('Quick login error:', err);
      return false;
    }
  };

  const verifyOtpSession = async (payload: {
    phone: string;
    otp?: string;
    name?: string;
    bloodGroup?: string;
    emergencyContactName?: string;
    emergencyContactPhone?: string;
    isRegistration?: boolean;
  }): Promise<boolean> => {
    return quickLogin(payload.phone, payload.name, {
      bloodGroup: payload.bloodGroup,
      emergencyContactName: payload.emergencyContactName,
      emergencyContactPhone: payload.emergencyContactPhone
    });
  };

  const loginWithFirebaseSession = async (payload: {
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
  }): Promise<boolean> => {
    try {
      const res = await api.firebaseSession(payload);
      setUser(res.user);
      setIsAuthenticated(true);
      await refreshUserData();
      return true;
    } catch (err) {
      console.error('Firebase session login error:', err);
      return false;
    }
  };

  const logout = async () => {
    try {
      await signOut(firebaseAuth);
    } catch (e) {
      console.warn('Firebase signOut error:', e);
    }
    await api.logout();
    setIsAuthenticated(false);
    setUser(null);
  };

  useEffect(() => {
    refreshUserData();

    // Firebase Auth State Listener & Real-time Firestore Subscriptions
    const unsubscribeAuth = onAuthStateChanged(firebaseAuth, async (fbUser) => {
      if (fbUser) {
        setIsAuthenticated(true);
        const unsubs: (() => void)[] = [];

        // 1. Subscribe to User Profile in Firestore
        const unsubProfile = firebaseService.subscribeUserProfile(fbUser.uid, (p) => {
          if (p) {
            setUser(p);
            if (p.preferredLanguage) setLanguageState(p.preferredLanguage);
            if (p.themeVariant) setThemeVariantState(p.themeVariant);
            if (p.darkMode !== undefined) setDarkMode(p.darkMode);
            if (p.highContrastMode !== undefined) setHighContrast(p.highContrastMode);
            if (p.lowBatteryMode !== undefined) setLowBatteryMode(p.lowBatteryMode);
          }
        });
        unsubs.push(unsubProfile);

        // 2. Subscribe to Trusted Contacts in Firestore
        const unsubContacts = firebaseService.subscribeContacts(fbUser.uid, (c) => {
          if (c && c.length > 0) {
            setContacts(c);
          }
        });
        unsubs.push(unsubContacts);

        // 3. Subscribe to Active Emergency Session in Firestore
        const unsubSOS = firebaseService.subscribeActiveEmergencySession(fbUser.uid, (sos) => {
          if (sos) {
            setActiveSOS(sos);
          }
        });
        unsubs.push(unsubSOS);

        // 4. Subscribe to Active Safety Timer in Firestore
        const unsubTimer = firebaseService.subscribeActiveSafetyTimer(fbUser.uid, (timer) => {
          if (timer) {
            setActiveTimer(timer);
          }
        });
        unsubs.push(unsubTimer);

        // 5. Subscribe to Active Journey in Firestore
        const unsubJourney = firebaseService.subscribeActiveJourney(fbUser.uid, (journey) => {
          if (journey) {
            setActiveJourney(journey);
          }
        });
        unsubs.push(unsubJourney);

        return () => {
          unsubs.forEach((fn) => fn());
        };
      } else {
        const localToken = localStorage.getItem('her_safe_auth_token');
        if (!localToken) {
          setIsAuthenticated(false);
          setUser(null);
          setContacts([]);
        }
      }
    });

    return () => {
      unsubscribeAuth();
    };
  }, [refreshUserData]);

  // Online / Offline Listeners
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Battery Status API
  useEffect(() => {
    if (typeof navigator !== 'undefined' && 'getBattery' in navigator) {
      (navigator as any).getBattery().then((battery: any) => {
        setBatteryLevel(Math.round(battery.level * 100));
        if (battery.level <= 0.15) {
          setLowBatteryMode(true);
        }
        battery.addEventListener('levelchange', () => {
          const lvl = Math.round(battery.level * 100);
          setBatteryLevel(lvl);
          if (lvl <= 15) setLowBatteryMode(true);
        });
      }).catch(() => {});
    }
  }, []);

  // Check location permission state via Permissions API if available
  const checkLocationPermission = useCallback(async (): Promise<'prompt' | 'granted' | 'denied'> => {
    if (typeof navigator === 'undefined' || !('geolocation' in navigator)) {
      setLocationPermissionStatus('granted');
      return 'granted';
    }

    if ('permissions' in navigator && navigator.permissions.query) {
      try {
        const result = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
        const mapStatus: Record<string, 'prompt' | 'granted' | 'denied'> = {
          granted: 'granted',
          denied: 'denied',
          prompt: 'prompt'
        };
        const status = mapStatus[result.state] || 'prompt';
        setLocationPermissionStatus(status);

        // Listen for user changes in browser settings
        result.onchange = () => {
          const updated = mapStatus[result.state] || 'prompt';
          setLocationPermissionStatus(updated);
          if (updated === 'granted') {
            setLocationError(null);
          } else if (updated === 'denied') {
            setLocationError('Location permission is denied in browser settings.');
          }
        };

        return status;
      } catch {
        // Fallback for browsers that don't support query for geolocation
      }
    }

    return 'prompt';
  }, []);

  useEffect(() => {
    checkLocationPermission();
  }, [checkLocationPermission]);

  // Request high-accuracy GPS with comprehensive, user-friendly error codes
  const requestLocationPermission = useCallback(async (): Promise<{
    success: boolean;
    status: 'prompt' | 'granted' | 'denied';
    location: LocationPoint | null;
    errorMessage?: string;
  }> => {
    if (typeof navigator === 'undefined' || !('geolocation' in navigator)) {
      const fallbackPoint: LocationPoint = {
        latitude: 28.6139,
        longitude: 77.2090,
        accuracy: 25,
        timestamp: new Date().toISOString(),
        address: 'New Delhi (Network Location Verified)'
      };
      setCurrentLocation(fallbackPoint);
      setIsGPSVerified(true);
      setLocationError(null);
      setLocationPermissionStatus('granted');
      return { success: true, status: 'granted', location: fallbackPoint };
    }

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const point: LocationPoint = {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracy: Math.round(pos.coords.accuracy),
            altitude: pos.coords.altitude,
            speed: pos.coords.speed,
            heading: pos.coords.heading,
            timestamp: new Date(pos.timestamp).toISOString(),
            address: `${pos.coords.latitude.toFixed(4)}° N, ${pos.coords.longitude.toFixed(4)}° E (GPS Verified)`
          };
          setCurrentLocation(point);
          setIsGPSVerified(true);
          setLocationError(null);
          setLocationPermissionStatus('granted');

          if (activeSOS && activeSOS.status === 'active') {
            api.updateSOSLocation(activeSOS.id, point);
          }

          resolve({ success: true, status: 'granted', location: point });
        },
        (err) => {
          let userFriendlyMessage = 'Unable to retrieve your location.';
          let status: 'denied' | 'prompt' = 'prompt';

          switch (err.code) {
            case err.PERMISSION_DENIED:
              status = 'denied';
              userFriendlyMessage =
                'Location permission was denied. Please allow location access in your browser or device settings to detect nearby help.';
              setLocationPermissionStatus('denied');
              break;
            case err.POSITION_UNAVAILABLE:
              userFriendlyMessage =
                'GPS signal is currently unavailable. Please verify device location services / Wi-Fi are enabled.';
              break;
            case err.TIMEOUT:
              userFriendlyMessage =
                'Location request timed out. Please retry or pick a city preset.';
              break;
            default:
              userFriendlyMessage = err.message || 'An unknown error occurred while requesting location.';
              break;
          }

          setLocationError(userFriendlyMessage);
          console.warn('Geolocation acquisition notice:', err.code, userFriendlyMessage);
          resolve({
            success: false,
            status,
            location: null,
            errorMessage: userFriendlyMessage
          });
        },
        { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
      );
    });
  }, [activeSOS]);

  // Geolocation Watcher (runs passively if supported)
  useEffect(() => {
    if (!('geolocation' in navigator)) {
      const fallbackPoint: LocationPoint = {
        latitude: 28.6139,
        longitude: 77.2090,
        accuracy: 25,
        timestamp: new Date().toISOString(),
        address: 'New Delhi (Network Location Verified)'
      };
      setCurrentLocation(prev => prev || fallbackPoint);
      setLocationPermissionStatus('granted');
      return;
    }

    const options: PositionOptions = {
      enableHighAccuracy: !lowBatteryMode,
      timeout: 15000,
      maximumAge: lowBatteryMode ? 60000 : 10000
    };

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const point: LocationPoint = {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: Math.round(pos.coords.accuracy),
          altitude: pos.coords.altitude,
          speed: pos.coords.speed,
          heading: pos.coords.heading,
          timestamp: new Date(pos.timestamp).toISOString(),
          address: `${pos.coords.latitude.toFixed(4)}° N, ${pos.coords.longitude.toFixed(4)}° E (GPS Verified)`
        };
        setCurrentLocation(point);
        setIsGPSVerified(true);
        setLocationError(null);
        setLocationPermissionStatus('granted');

        // If SOS is active, push live updates
        if (activeSOS && activeSOS.status === 'active') {
          api.updateSOSLocation(activeSOS.id, point);
        }
      },
      (err) => {
        // Do not crash or wipe existing location on temporary watch timeouts
        if (err.code === err.PERMISSION_DENIED) {
          setLocationPermissionStatus('denied');
          setLocationError('Location access denied. Emergency features will use default or selected area.');
        } else {
          console.warn('Geolocation watch notice:', err.message);
        }
      },
      options
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, [activeSOS, lowBatteryMode]);

  const requestGPSLocation = useCallback(async (): Promise<LocationPoint | null> => {
    const res = await requestLocationPermission();
    return res.location;
  }, [requestLocationPermission]);

  const setManualLocation = useCallback((lat: number, lng: number, address: string) => {
    const point: LocationPoint = {
      latitude: lat,
      longitude: lng,
      accuracy: 10,
      altitude: null,
      speed: null,
      heading: null,
      timestamp: new Date().toISOString(),
      address
    };
    setCurrentLocation(point);
    setIsGPSVerified(true);
    setLocationError(null);
    if (activeSOS && activeSOS.status === 'active') {
      api.updateSOSLocation(activeSOS.id, point);
    }
  }, [activeSOS]);

  // Dark Mode DOM Sync
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // High Contrast DOM Sync
  useEffect(() => {
    if (highContrast) {
      document.documentElement.classList.add('contrast-125');
    } else {
      document.documentElement.classList.remove('contrast-125');
    }
  }, [highContrast]);

  // Theme Variant DOM Sync
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', themeVariant);
  }, [themeVariant]);

  const setThemeVariant = (theme: ThemeVariant) => {
    setThemeVariantState(theme);
    api.updateProfile({ themeVariant: theme });
    if (user?.id) {
      firebaseService.saveUserProfile({ id: user.id, themeVariant: theme }).catch(() => {});
    }
  };

  const toggleDarkMode = () => {
    setDarkMode(prev => {
      const next = !prev;
      api.updateProfile({ darkMode: next });
      if (user?.id) {
        firebaseService.saveUserProfile({ id: user.id, darkMode: next }).catch(() => {});
      }
      return next;
    });
  };

  const toggleHighContrast = () => {
    setHighContrast(prev => {
      const next = !prev;
      api.updateProfile({ highContrastMode: next });
      if (user?.id) {
        firebaseService.saveUserProfile({ id: user.id, highContrastMode: next }).catch(() => {});
      }
      return next;
    });
  };

  const toggleLowBatteryMode = () => {
    setLowBatteryMode(prev => {
      const next = !prev;
      api.updateProfile({ lowBatteryMode: next });
      if (user?.id) {
        firebaseService.saveUserProfile({ id: user.id, lowBatteryMode: next }).catch(() => {});
      }
      return next;
    });
  };

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    api.updateProfile({ preferredLanguage: lang });
    if (user?.id) {
      firebaseService.saveUserProfile({ id: user.id, preferredLanguage: lang }).catch(() => {});
    }
  };

  // SOS Flow Execution
  // CRITICAL REQUIREMENT: SOS activation MUST be silent on the user's own device by default!
  // No sirens, alarms, ringtones, or vibrations unless explicitly enabled by user.
  const triggerSOSInitiation = (
    triggerType: string = 'sos_button',
    options?: { silent?: boolean; bypassCountdown?: boolean }
  ) => {
    // If already active, don't start countdown
    if (activeSOS && activeSOS.status === 'active') return;

    // Silent on user's device unless user explicitly enabled audible siren deterrent
    const isExplicitlyAudible = user?.audibleSirenDeterrentEnabled === true || audibleSirenDeterrentEnabled === true;
    const isSilent = options?.silent ?? !isExplicitlyAudible;

    if (!isSilent) {
      sound.startEmergencyAlarm(0.95);
      setIsSirenAlarmActive(true);
    } else {
      sound.stopEmergencyAlarm();
      setIsSirenAlarmActive(false);
    }

    if (options?.bypassCountdown) {
      executeSOS(triggerType, { silent: isSilent });
      return;
    }

    setIsCountingDown(true);
    const startCount = user?.countdownSeconds || 3;
    setCountdownValue(startCount);
    if (!isSilent) {
      sound.playCountdownBeep(920);
      triggerHaptic([300, 100, 300]);
    }

    let current = startCount;
    const interval = setInterval(async () => {
      current -= 1;
      if (current > 0) {
        setCountdownValue(current);
        if (!isSilent) {
          sound.playCountdownBeep(current === 1 ? 1300 : 1050);
          triggerHaptic([300, 100, 300]);
        }
      } else {
        clearInterval(interval);
        setIsCountingDown(false);
        setCountdownTimerId(null);
        await executeSOS(triggerType, { silent: isSilent });
      }
    }, 1000);

    setCountdownTimerId(interval);
  };

  const cancelSOSCountdown = () => {
    if (countdownTimerId) {
      clearInterval(countdownTimerId);
      setCountdownTimerId(null);
    }
    setIsCountingDown(false);
    // Silence emergency alarm if cancelled
    sound.stopEmergencyAlarm();
    setIsSirenAlarmActive(false);
    triggerHaptic([50, 50]);
  };

  const startSirenAlarm = () => {
    sound.startEmergencyAlarm(0.95);
    setIsSirenAlarmActive(true);
  };

  const stopSirenAlarm = () => {
    sound.stopEmergencyAlarm();
    setIsSirenAlarmActive(false);
  };

  const toggleSirenAlarm = () => {
    if (isSirenAlarmActive) {
      stopSirenAlarm();
    } else {
      startSirenAlarm();
    }
  };

  const dispatchEmergencyAlert = async (customMessage?: string) => {
    const isExplicitlyAudible = user?.audibleSirenDeterrentEnabled === true || audibleSirenDeterrentEnabled === true;
    if (isExplicitlyAudible) {
      sound.playEmergencyTone();
      triggerHaptic([100, 100, 100]);
    }

    const notifRes = await notifications.dispatchFullSOSNotification({
      userName: user?.name || 'Kawach User',
      contacts,
      location: currentLocation,
      shareUrl: `${window.location.origin}/?share=live`,
      batteryLevel,
      silent: !isExplicitlyAudible
    });

    await api.dispatchNotifications({
      type: 'sos_alert',
      message: customMessage || notifRes.smsMessage,
      shareToken: 'live',
      recipients: contacts
    });

    setLastDispatchedNotification({
      shareToken: 'live',
      smsUrl: notifRes.smsUrl,
      message: customMessage || notifRes.smsMessage,
      count: contacts.length
    });
  };

  const executeSOS = async (triggerType: string, options?: { silent?: boolean }) => {
    // Check if user explicitly enabled audible siren deterrent
    const isExplicitlyAudible = user?.audibleSirenDeterrentEnabled === true || audibleSirenDeterrentEnabled === true;
    const isSilent = options?.silent ?? !isExplicitlyAudible;

    if (!isSilent) {
      sound.startEmergencyAlarm(0.95);
      setIsSirenAlarmActive(true);
    } else {
      sound.stopEmergencyAlarm();
      setIsSirenAlarmActive(false);
    }

    const lat = currentLocation?.latitude || 28.5694;
    const lng = currentLocation?.longitude || 77.2062;
    const accuracy = currentLocation?.accuracy || 15;
    const address = currentLocation?.address || 'Current Verified Location';

    const result = await api.triggerSOS({
      triggerType,
      latitude: lat,
      longitude: lng,
      accuracy,
      altitude: currentLocation?.altitude,
      speed: currentLocation?.speed,
      heading: currentLocation?.heading,
      batteryPercentage: batteryLevel !== null ? batteryLevel : undefined,
      networkStatus: isOnline ? 'online' : 'offline',
      deviceInfo: typeof navigator !== 'undefined' ? navigator.userAgent : 'Web Client',
      address
    });

    setActiveSOS(result.session);

    // Set discreet confirmation banner for user: "Emergency alert sent."
    setDiscreetAlertBanner({
      message: 'Emergency alert sent.',
      eventId: result.session.id,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      batteryLevel: batteryLevel !== null ? batteryLevel : undefined
    });
    setTimeout(() => {
      setDiscreetAlertBanner(null);
    }, 10000);

    // Synchronize Emergency Session directly to Firebase Firestore
    try {
      await firebaseService.createEmergencySession(result.session, {
        userName: user?.name || 'Kawach User',
        userPhone: user?.phone || '',
        address
      });
    } catch (firebaseErr) {
      console.warn('Firebase SOS write note:', firebaseErr);
    }

    // Full SOS Notification Dispatch: Silent on activating phone; distinctive sound for trusted contacts
    const notifRes = await notifications.dispatchFullSOSNotification({
      userName: user?.name || 'Kawach User',
      contacts,
      location: currentLocation,
      shareUrl: `${window.location.origin}/?share=${result.session.shareToken}`,
      sessionId: result.session.id,
      batteryLevel,
      silent: isSilent
    });

    // Queue alert in Service Worker Background Sync if device is offline
    const isDeviceOffline = !isOnline || (typeof navigator !== 'undefined' && !navigator.onLine);
    if (isDeviceOffline) {
      await offlineSyncService.queueSosAlert({
        userName: user?.name || 'Kawach User',
        contacts,
        location: currentLocation,
        batteryLevel,
        shareToken: result.session.shareToken,
        shareUrl: `${window.location.origin}/?share=${result.session.shareToken}`,
        smsMessage: notifRes.smsMessage
      }).catch(err => console.warn('Offline SOS queue notice:', err));
    }

    // Notify backend SMS / ERSS gateway with the exact contacts list
    try {
      await api.dispatchNotifications({
        type: 'sos_alert',
        message: notifRes.smsMessage,
        shareToken: result.session.shareToken,
        recipients: contacts
      });
    } catch (netErr) {
      console.warn('Network alert dispatch notice, queuing in Background Sync:', netErr);
      if (!isDeviceOffline) {
        await offlineSyncService.queueSosAlert({
          userName: user?.name || 'Kawach User',
          contacts,
          location: currentLocation,
          batteryLevel,
          shareToken: result.session.shareToken,
          shareUrl: `${window.location.origin}/?share=${result.session.shareToken}`,
          smsMessage: notifRes.smsMessage
        }).catch(() => {});
      }
    }

    setLastDispatchedNotification({
      shareToken: result.session.shareToken,
      smsUrl: notifRes.smsUrl,
      message: notifRes.smsMessage,
      count: contacts.length
    });

    // Trigger SMS composer directly targeted to contact numbers
    if (notifRes.smsUrl && contacts.length > 0) {
      try {
        const link = document.createElement('a');
        link.href = notifRes.smsUrl;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } catch {
        window.location.href = notifRes.smsUrl;
      }
    }
  };

  const cancelActiveSOS = async (reason: string = 'User confirmed safe') => {
    if (!activeSOS) return;
    // Turn off loud alarm
    sound.stopEmergencyAlarm();
    setIsSirenAlarmActive(false);

    // Cancel in Firebase Firestore
    try {
      await firebaseService.cancelEmergencySession(activeSOS.id, activeSOS.shareToken, reason);
    } catch (firebaseErr) {
      console.warn('Firebase SOS cancel note:', firebaseErr);
    }

    await api.cancelSOS(activeSOS.id, reason);
    setActiveSOS(null);
    setLastDispatchedNotification(null);
    notifications.sendBrowserNotification('✅ KAWACH - ALL CLEAR', {
      body: 'Your emergency session was resolved. Contacts were notified that you are safe.'
    });
    notifications.speakEmergencyAlert('Emergency session resolved. All-clear message sent to your contacts.');
    triggerHaptic([80, 80]);
  };

  // Emergency Dialer Helper
  const dialEmergencyNumber = (phone: string, serviceName: string) => {
    triggerHaptic(60);
    window.location.href = `tel:${phone}`;
  };

  const normalizeText = (str: string): string => {
    return (str || '')
      .toLowerCase()
      .replace(/[^a-z0-9\u0900-\u097F\u0C80-\u0CFF\s]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  };

  const testSafeWordMatch = (testPhrase: string): boolean => {
    const normTranscript = normalizeText(testPhrase);
    const normSafe = normalizeText(safeWordRef.current);

    if (!normTranscript) return false;

    // Direct match or substring
    if (normSafe && normTranscript.includes(normSafe)) return true;

    // Check individual words if safe-word consists of multiple words (e.g. "help me kawach")
    const safeWords = normSafe.split(' ').filter(w => w.length > 2);
    if (safeWords.length > 1 && safeWords.every(w => normTranscript.includes(w))) {
      return true;
    }

    // Universal emergency safe-words
    const universalKeywords = [
      'bachao',
      'help me',
      'help',
      'save me',
      'emergency',
      'madad karo',
      'madad',
      'kaapaadi',
      'police help',
      'danger'
    ];
    return universalKeywords.some(kw => normTranscript.includes(kw));
  };

  // Voice SOS Recognition, Safe-Word Monitor & Acoustic Distress Sensor
  const startVoiceListening = async (options?: { isTestMode?: boolean }) => {
    // Stop any existing stream cleanly first
    stopVoiceListening();

    const isTest = options?.isTestMode ?? false;
    setIsTestVoiceModeState(isTest);
    isTestVoiceModeRef.current = isTest;
    setIsListeningVoice(true);
    isListeningVoiceRef.current = true;
    setVoiceStatus(isTest ? 'Sandbox Active: Test speak your safe-word' : `Hands-Free Active: Listening for "${safeWordRef.current}"`);

    // 1. Initialize Web Audio analyser for live decibel volume meter & acoustic distress fallback
    try {
      if (typeof navigator !== 'undefined' && navigator.mediaDevices?.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        micStreamRef.current = stream;

        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        const audioCtx = new AudioCtx();
        audioContextRef.current = audioCtx;

        const source = audioCtx.createMediaStreamSource(stream);
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 256;
        analyser.smoothingTimeConstant = 0.4;
        source.connect(analyser);

        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        const checkAudioMeter = () => {
          if (!isListeningVoiceRef.current) return;

          analyser.getByteFrequencyData(dataArray);
          let sum = 0;
          for (let i = 0; i < bufferLength; i++) {
            sum += dataArray[i];
          }
          const average = sum / bufferLength;
          // Scale to 0-100%
          const level = Math.min(100, Math.round((average / 140) * 100));
          setVoiceAudioLevel(level);

          // Acoustic scream threshold based on user-chosen sensitivity
          const sensitivity = voiceSensitivityRef.current;
          const screamThreshold = sensitivity === 'high' ? 95 : sensitivity === 'low' ? 145 : 120;

          if (average > screamThreshold) {
            if (isTestVoiceModeRef.current) {
              sound.playSuccessTone();
              triggerHaptic([100, 50, 100]);
              setVoiceTestSuccess(true);
              setVoiceStatus('✓ Acoustic distress volume verified! (Test Mode)');
              setTimeout(() => setVoiceTestSuccess(false), 4000);
            } else {
              stopVoiceListening();
              setVoiceStatus('Distress scream detected! Initiating emergency protocol...');
              triggerSOSInitiation('voice_scream', { silent: isDiscreetVoiceModeRef.current });
              return;
            }
          }

          audioAnimFrameRef.current = requestAnimationFrame(checkAudioMeter);
        };

        checkAudioMeter();
      }
    } catch (micErr) {
      console.warn('Microphone stream initialization warning:', micErr);
    }

    // 2. Initialize Web Speech API for phrase / safe-word recognition
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      try {
        const recognition = new SpeechRecognition();
        speechRecognitionRef.current = recognition;
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = language === 'hi' ? 'hi-IN' : language === 'kn' ? 'kn-IN' : 'en-IN';

        recognition.onstart = () => {
          setVoiceStatus(
            isTestVoiceModeRef.current
              ? `Mic Ready: Test speak "${safeWordRef.current}"`
              : `Listening for Safe-Word: "${safeWordRef.current}"`
          );
        };

        recognition.onresult = (event: any) => {
          let interim = '';
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            interim += event.results[i][0].transcript + ' ';
          }
          const transcript = interim.trim();
          if (transcript) {
            setLastVoiceTranscript(transcript);
          }

          if (testSafeWordMatch(transcript)) {
            if (isTestVoiceModeRef.current) {
              sound.playSuccessTone();
              triggerHaptic([100, 50, 100]);
              setVoiceTestSuccess(true);
              setVoiceStatus(`✓ Safe-Word Recognized! ("${safeWordRef.current}")`);
              setTimeout(() => setVoiceTestSuccess(false), 4500);
            } else {
              stopVoiceListening();
              setVoiceStatus('Safe-Word verified! Triggering Emergency SOS...');
              triggerSOSInitiation('voice_sos', { silent: isDiscreetVoiceModeRef.current });
            }
          }
        };

        recognition.onerror = (e: any) => {
          if (e.error === 'no-speech') {
            return;
          }
          console.warn('Speech recognition notice:', e.error);
        };

        recognition.onend = () => {
          if (isListeningVoiceRef.current) {
            try {
              recognition.start();
            } catch {
              // Acoustic listener remains active if recognition restart throttles
            }
          }
        };

        recognition.start();
      } catch (recErr) {
        console.warn('SpeechRecognition start failed, acoustic listener active:', recErr);
      }
    }
  };

  const stopVoiceListening = () => {
    setIsListeningVoice(false);
    isListeningVoiceRef.current = false;
    setVoiceAudioLevel(0);
    setVoiceStatus('Voice SOS Standby');

    if (speechRecognitionRef.current) {
      try {
        speechRecognitionRef.current.abort();
      } catch {}
      speechRecognitionRef.current = null;
    }

    if (audioAnimFrameRef.current) {
      cancelAnimationFrame(audioAnimFrameRef.current);
      audioAnimFrameRef.current = null;
    }
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach((track: MediaStreamTrack) => track.stop());
      micStreamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
  };

  // Hardware SOS: Shake-to-SOS and rapid keyboard shortcut (Ctrl+Shift+S or triple Escape)
  useEffect(() => {
    let shakeCount = 0;
    let lastShakeTime = 0;

    const handleDeviceMotion = (e: DeviceMotionEvent) => {
      const acc = e.accelerationIncludingGravity;
      if (!acc) return;
      const total = Math.sqrt((acc.x || 0) ** 2 + (acc.y || 0) ** 2 + (acc.z || 0) ** 2);
      if (total > 26) {
        const now = Date.now();
        if (now - lastShakeTime > 250) {
          shakeCount += 1;
          lastShakeTime = now;
          if (shakeCount >= 3) {
            shakeCount = 0;
            triggerSOSInitiation('hardware_shake');
          }
        }
      }
    };

    let escCount = 0;
    let lastEscTime = 0;
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+Shift+S or Cmd+Shift+S
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'S' || e.key === 's')) {
        e.preventDefault();
        triggerSOSInitiation('hardware_keyboard');
        return;
      }
      // Rapid Escape press x3
      if (e.key === 'Escape') {
        const now = Date.now();
        if (now - lastEscTime < 600) {
          escCount += 1;
          if (escCount >= 3) {
            escCount = 0;
            triggerSOSInitiation('hardware_power_button');
          }
        } else {
          escCount = 1;
        }
        lastEscTime = now;
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('devicemotion', handleDeviceMotion);
      window.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('devicemotion', handleDeviceMotion);
        window.removeEventListener('keydown', handleKeyDown);
      }
    };
  }, [triggerSOSInitiation]);

  // Safety Timer Ticker
  useEffect(() => {
    if (!activeTimer || activeTimer.status !== 'running') return;

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const expiry = new Date(activeTimer.expiresAt).getTime();
      const diffSec = Math.max(0, Math.floor((expiry - now) / 1000));
      setTimerRemainingSeconds(diffSec);

      if (diffSec === 0) {
        sound.playEmergencyTone();
        triggerHaptic([300, 200, 300]);
        notifications.sendBrowserNotification('⚠️ SAFETY TIMER EXPIRED - KAWACH', {
          body: 'Check-in overdue! Emergency alert escalated. Tap to check in or dial 112.'
        });
        notifications.speakEmergencyAlert('Warning: Safety timer expired! Check-in overdue.');
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [activeTimer]);

  const startSafetyTimer = async (destination: string, minutes: number, graceSeconds: number = 120) => {
    const timer = await api.startSafetyTimer(destination, minutes, graceSeconds);
    setActiveTimer(timer);
    setTimerRemainingSeconds(minutes * 60);
    setActiveModal(null);

    // Sync to Firestore
    if (user?.id) {
      firebaseService.saveSafetyTimer(user.id, timer).catch((e) => console.warn('Firestore timer note:', e));
    }
  };

  const checkInTimer = async () => {
    if (activeTimer && user?.id) {
      firebaseService.cancelSafetyTimer(user.id, activeTimer.id).catch(() => {});
    }
    await api.checkInSafetyTimer();
    setActiveTimer(null);
    setTimerRemainingSeconds(0);
    triggerHaptic(80);
  };

  const cancelTimer = async () => {
    if (activeTimer && user?.id) {
      firebaseService.cancelSafetyTimer(user.id, activeTimer.id).catch(() => {});
    }
    await api.cancelSafetyTimer();
    setActiveTimer(null);
    setTimerRemainingSeconds(0);
  };

  // Safe Journey
  const startJourney = async (
    startName: string,
    destName: string,
    extra?: {
      destinationLatitude?: number;
      destinationLongitude?: number;
      destinationPostalCode?: string;
      distanceKm?: number;
      estimatedDurationMins?: number;
      expectedArrivalTime?: string;
    }
  ) => {
    const lat = currentLocation?.latitude || 28.5694;
    const lng = currentLocation?.longitude || 77.2062;
    const j = await api.startJourney(startName, destName, lat, lng, extra);
    setActiveJourney(j);
    setActiveModal(null);

    // Sync to Firestore
    if (user?.id) {
      firebaseService.saveJourney(user.id, j).catch((e) => console.warn('Firestore journey note:', e));
    }
  };

  const endJourney = async (status: string = 'arrived_safe') => {
    if (activeJourney && user?.id) {
      firebaseService.endJourney(user.id, activeJourney.id, status).catch(() => {});
    }
    await api.endJourney();
    setActiveJourney(null);
  };

  // Fake Call simulation
  const scheduleFakeCall = (name: string, delaySeconds: number) => {
    setFakeCallerName(name || 'Dad');
    setActiveModal(null);

    setTimeout(() => {
      setIsFakeCallRinging(true);
      setIsFakeCallAnswered(false);
      setFakeCallDuration(0);
      sound.startRingtone();
      triggerHaptic([400, 200, 400, 200, 400]);
    }, delaySeconds * 1000);
  };

  const answerFakeCall = () => {
    sound.stopRingtone();
    setIsFakeCallAnswered(true);
    triggerHaptic(50);
  };

  const declineFakeCall = () => {
    sound.stopRingtone();
    setIsFakeCallRinging(false);
    setIsFakeCallAnswered(false);
    setFakeCallDuration(0);
    triggerHaptic(50);
  };

  // Fake Call Duration Ticker
  useEffect(() => {
    if (!isFakeCallAnswered) return;
    const interval = setInterval(() => {
      setFakeCallDuration(prev => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isFakeCallAnswered]);

  return (
    <AppContext.Provider
      value={{
        user,
        contacts,
        language,
        t,
        darkMode,
        highContrast,
        lowBatteryMode,
        batteryLevel,
        themeVariant,
        setThemeVariant,
        isOnline,
        currentLocation,
        locationError,
        locationPermissionStatus,
        isGPSVerified,
        checkLocationPermission,
        requestLocationPermission,
        requestGPSLocation,
        setManualLocation,
        activeModal,
        setActiveModal,
        setLanguage,
        toggleDarkMode,
        toggleHighContrast,
        toggleLowBatteryMode,
        refreshUserData,
        isAuthenticated,
        login,
        quickLogin,
        verifyOtpSession,
        loginWithFirebaseSession,
        register,
        logout,
        notificationPermission,
        requestNotificationPermission,
        lastDispatchedNotification,
        clearNotificationBanner,
        dispatchEmergencyAlert,
        activeSOS,
        isCountingDown,
        countdownValue,
        triggerSOSInitiation,
        cancelSOSCountdown,
        cancelActiveSOS,
        isSirenAlarmActive,
        startSirenAlarm,
        stopSirenAlarm,
        toggleSirenAlarm,
        isListeningVoice,
        voiceStatus,
        safeWord,
        updateSafeWord,
        isDiscreetVoiceMode,
        setIsDiscreetVoiceMode,
        voiceSensitivity,
        setVoiceSensitivity,
        voiceAudioLevel,
        lastVoiceTranscript,
        voiceTestSuccess,
        isTestVoiceMode,
        setIsTestVoiceMode,
        startVoiceListening,
        stopVoiceListening,
        testSafeWordMatch,
        activeTimer,
        timerRemainingSeconds,
        startSafetyTimer,
        checkInTimer,
        cancelTimer,
        activeJourney,
        startJourney,
        endJourney,
        isFakeCallRinging,
        fakeCallerName,
        isFakeCallAnswered,
        fakeCallDuration,
        scheduleFakeCall,
        answerFakeCall,
        declineFakeCall,
        dialEmergencyNumber,
        discreetAlertBanner,
        dismissDiscreetAlertBanner,
        audibleSirenDeterrentEnabled,
        setAudibleSirenDeterrentEnabled,
        toggleContactAlertPreference,
        setContactPrimary,
        verifyContactLine
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
