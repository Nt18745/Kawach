import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { api } from '../../services/api';
import { firebaseService } from '../../services/firebaseService';
import {
  X,
  Settings,
  Shield,
  Lock,
  Heart,
  Moon,
  Sun,
  Eye,
  Trash2,
  Download,
  Upload,
  CheckCircle2,
  AlertTriangle,
  Globe,
  Palette,
  Sparkles,
  Phone,
  Camera,
  Users,
  Bell,
  MapPin,
  Mic,
  LogOut,
  Volume2,
  VolumeX,
  ShieldCheck,
  ChevronRight,
  User as UserIcon,
  Sliders,
  Server
} from 'lucide-react';
import { Language } from '../../types/translations';
import { SmsGatewayModal } from './SmsGatewayModal';

const DEFAULT_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80'
];

export const SettingsModal: React.FC = () => {
  const {
    activeModal,
    setActiveModal,
    user,
    refreshUserData,
    darkMode,
    toggleDarkMode,
    highContrast,
    toggleHighContrast,
    themeVariant,
    setThemeVariant,
    language,
    setLanguage,
    t,
    logout,
    contacts,
    locationPermissionStatus,
    requestLocationPermission,
    notificationPermission,
    requestNotificationPermission,
    audibleSirenDeterrentEnabled,
    setAudibleSirenDeterrentEnabled
  } = useApp();

  const [name, setName] = useState<string>(user?.name || '');
  const [phone, setPhone] = useState<string>(user?.phone || '');
  const [profilePhoto, setProfilePhoto] = useState<string>(user?.profilePhoto || DEFAULT_AVATARS[0]);
  const [bloodGroup, setBloodGroup] = useState<string>(user?.bloodGroup || 'B+');
  const [medicalNotes, setMedicalNotes] = useState<string>(user?.emergencyMedicalNotes || '');
  const [voicePhrase, setVoicePhrase] = useState<string>(user?.voiceEmergencyPhrase || 'Help me Kawach');
  const [pin, setPin] = useState<string>(user?.pinHash || '');
  const [countdownSec, setCountdownSec] = useState<number>(user?.countdownSeconds || 3);
  const [micPermission, setMicPermission] = useState<string>('prompt');

  // UI state
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [backupJson, setBackupJson] = useState<string>('');
  const [showRestoreBox, setShowRestoreBox] = useState<boolean>(false);
  const [confirmPurgeLoc, setConfirmPurgeLoc] = useState<boolean>(false);
  const [confirmDeleteAcc, setConfirmDeleteAcc] = useState<boolean>(false);
  const [confirmLogout, setConfirmLogout] = useState<boolean>(false);
  const [showPhotoPicker, setShowPhotoPicker] = useState<boolean>(false);
  const [showSmsGateway, setShowSmsGateway] = useState<boolean>(false);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setPhone(user.phone || '');
      setProfilePhoto(user.profilePhoto || DEFAULT_AVATARS[0]);
      setBloodGroup(user.bloodGroup || 'B+');
      setMedicalNotes(user.emergencyMedicalNotes || '');
      setVoicePhrase(user.voiceEmergencyPhrase || 'Help me Kawach');
      setCountdownSec(user.countdownSeconds || 3);
    }
  }, [user, activeModal]);

  // Check microphone permission
  useEffect(() => {
    if (typeof navigator !== 'undefined' && navigator.permissions?.query) {
      navigator.permissions
        .query({ name: 'microphone' as any })
        .then((res) => {
          setMicPermission(res.state);
          res.onchange = () => setMicPermission(res.state);
        })
        .catch(() => setMicPermission('prompt'));
    }
  }, [activeModal]);

  if (activeModal !== 'settings') return null;

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.updateProfile({
        name,
        phone,
        profilePhoto,
        bloodGroup,
        emergencyMedicalNotes: medicalNotes,
        voiceEmergencyPhrase: voicePhrase,
        pinHash: pin || undefined,
        countdownSeconds: Number(countdownSec),
        preferredLanguage: language
      });
      if (user?.id) {
        await firebaseService.saveUserProfile({
          id: user.id,
          name,
          phone,
          profilePhoto,
          bloodGroup,
          emergencyMedicalNotes: medicalNotes,
          voiceEmergencyPhrase: voicePhrase,
          countdownSeconds: Number(countdownSec),
          preferredLanguage: language
        });
      }
      await refreshUserData();
      setStatusMsg('Profile and emergency settings saved successfully.');
      setTimeout(() => setStatusMsg(null), 3000);
    } catch {
      setStatusMsg('Failed to update profile.');
    }
  };

  const handleRequestMic = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((track) => track.stop());
      setMicPermission('granted');
      setStatusMsg('Microphone permission granted for Voice SOS.');
      setTimeout(() => setStatusMsg(null), 3000);
    } catch {
      setMicPermission('denied');
      setStatusMsg('Microphone access was denied in browser settings.');
    }
  };

  const handleExportBackup = async () => {
    const json = await api.createCloudBackup();
    setBackupJson(json);
    setShowRestoreBox(true);
    setStatusMsg('Cloud backup generated. Copy or download below.');
  };

  const handleRestoreBackup = async () => {
    try {
      const msg = await api.restoreCloudBackup(backupJson);
      await refreshUserData();
      setStatusMsg(msg);
      setShowRestoreBox(false);
    } catch {
      setStatusMsg('Failed to restore. Please ensure JSON is valid.');
    }
  };

  const handleDeleteLocationHistory = async () => {
    try {
      const res = await api.deleteLocationHistory();
      setConfirmPurgeLoc(false);
      setStatusMsg(res.message);
      setTimeout(() => setStatusMsg(null), 3500);
    } catch {
      setStatusMsg('Failed to purge location history.');
    }
  };

  const handleDeleteAccount = async () => {
    try {
      await api.deleteAccount();
      setConfirmDeleteAcc(false);
      await logout();
      setActiveModal(null);
    } catch {
      setStatusMsg('Failed to delete account.');
    }
  };

  const handleLogout = async () => {
    await logout();
    setActiveModal(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-3 sm:p-4 animate-in fade-in">
      <div className="w-full max-w-xl max-h-[92vh] rounded-3xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden">
        {/* Top Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-rose-500/10 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center border border-rose-500/30">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white font-display">
                {t.settings}
              </h2>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                User Profile, Emergency Preferences & Permissions
              </span>
            </div>
          </div>
          <button
            onClick={() => setActiveModal(null)}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {statusMsg && (
          <div className="bg-emerald-50 dark:bg-emerald-950/60 border-b border-emerald-200 dark:border-emerald-800 px-4 py-2.5 text-xs font-semibold text-emerald-800 dark:text-emerald-300 flex items-center gap-2 shrink-0">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{statusMsg}</span>
          </div>
        )}

        {/* Scrollable Modal Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* 1. Profile Header with Photo, Name & Phone */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 flex flex-col sm:flex-row items-center gap-4">
            <div className="relative group">
              <img
                src={profilePhoto}
                alt={name || 'User Profile'}
                className="w-20 h-20 rounded-full object-cover border-2 border-rose-500 shadow-md"
              />
              <button
                type="button"
                onClick={() => setShowPhotoPicker(!showPhotoPicker)}
                className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center shadow-lg transition active:scale-95"
                title="Change Profile Photo"
                aria-label="Change Profile Photo"
              >
                <Camera className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="flex-1 text-center sm:text-left min-w-0">
              <h3 className="text-base font-bold text-slate-900 dark:text-white truncate">
                {name || 'Kawach User'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5 flex items-center justify-center sm:justify-start gap-1">
                <Phone className="w-3.5 h-3.5 text-rose-500" />
                <span>{phone || 'No phone registered'}</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 font-sans font-bold ml-1">
                  Verified
                </span>
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                Blood Group: <strong className="text-slate-700 dark:text-slate-200">{bloodGroup}</strong> &bull; {contacts.length} Trusted Contacts
              </p>
            </div>
          </div>

          {/* Photo Picker Drawer */}
          {showPhotoPicker && (
            <div className="p-3.5 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 space-y-2 animate-in fade-in">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-200 block">
                Choose Profile Photo Avatar
              </span>
              <div className="flex items-center gap-3 overflow-x-auto py-1">
                {DEFAULT_AVATARS.map((url, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setProfilePhoto(url);
                      setShowPhotoPicker(false);
                    }}
                    className={`relative rounded-full transition shrink-0 ${
                      profilePhoto === url ? 'ring-4 ring-rose-500' : 'opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={url} alt={`Avatar ${idx + 1}`} className="w-12 h-12 rounded-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 2. Quick Link: Trusted Contacts Circle */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-rose-50 to-pink-50 dark:from-rose-950/40 dark:to-pink-950/20 border border-rose-200 dark:border-rose-900/50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-600/10 dark:bg-rose-600/20 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Trusted Emergency Contacts
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  {contacts.length} {contacts.length === 1 ? 'contact' : 'contacts'} configured for instant live location dispatch
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setActiveModal('trusted_contacts')}
              className="min-h-[38px] px-3.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-1 shadow-sm transition active:scale-95 shrink-0"
            >
              <span>Manage</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* 3. Form: Profile Details & Emergency Medical ID */}
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Heart className="w-3.5 h-3.5 text-rose-500" />
              User Profile & Emergency Medical ID
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full h-10 px-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                  placeholder="Your legal name"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Registered Phone Number
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full h-10 px-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-rose-500"
                  placeholder="+91 98765 43210"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Blood Group
                </label>
                <select
                  value={bloodGroup}
                  onChange={(e) => setBloodGroup(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none"
                >
                  {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((bg) => (
                    <option key={bg} value={bg}>
                      {bg}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Language Preference
                </label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value as Language)}
                  className="w-full h-10 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none"
                >
                  <option value="en">English (US/UK/IN)</option>
                  <option value="hi">हिन्दी (Hindi)</option>
                  <option value="kn">ಕನ್ನಡ (Kannada)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Emergency Medical Notes & Allergies (Shown to Paramedics & Hospital)
              </label>
              <textarea
                rows={2}
                value={medicalNotes}
                onChange={(e) => setMedicalNotes(e.target.value)}
                placeholder="e.g. Penicillin allergy, Type 1 diabetes, carry EpiPen..."
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>

            {/* 4. Emergency SOS Preferences */}
            <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-rose-500" />
                Emergency & SOS Activation Preferences
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Voice SOS Safe-Word
                    </label>
                    <button
                      type="button"
                      onClick={() => setActiveModal('voice_sos_setup')}
                      className="text-[11px] font-bold text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-0.5"
                    >
                      <Sliders className="w-3 h-3" />
                      Sandbox →
                    </button>
                  </div>
                  <input
                    type="text"
                    value={voicePhrase}
                    onChange={(e) => setVoicePhrase(e.target.value)}
                    placeholder="e.g. Help me Kawach"
                    className="w-full h-10 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    SOS Countdown Seconds
                  </label>
                  <select
                    value={countdownSec}
                    onChange={(e) => setCountdownSec(Number(e.target.value))}
                    className="w-full h-10 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none"
                  >
                    <option value={1}>1 second (Instant)</option>
                    <option value={3}>3 seconds (Standard)</option>
                    <option value={5}>5 seconds (Safe grace)</option>
                  </select>
                </div>
              </div>

              {/* CRITICAL SOS SOUND PREFERENCE */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {audibleSirenDeterrentEnabled ? (
                      <Volume2 className="w-4 h-4 text-red-500" />
                    ) : (
                      <VolumeX className="w-4 h-4 text-slate-400" />
                    )}
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      Silent SOS on this Device (Recommended)
                    </span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!audibleSirenDeterrentEnabled}
                      onChange={(e) => setAudibleSirenDeterrentEnabled(!e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                  </label>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                  When silent mode is active, SOS activation does not play any sirens, alarms, or emergency sounds on your device to keep you safe from attackers. Your trusted contacts still receive high-priority alerts with sound on their phones.
                </p>
              </div>

              {/* 4-Digit Security PIN */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  4-Digit Security PIN (Optional PIN Lock)
                </label>
                <input
                  type="password"
                  maxLength={4}
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                  placeholder="Set 4-digit PIN"
                  className="w-full h-10 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white tracking-widest font-mono"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full min-h-[44px] rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md shadow-rose-600/25 transition active:scale-98"
            >
              Save Profile & Emergency Settings
            </button>
          </form>

          {/* 5. Permission Center (Location, Notification, Recording) */}
          <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-500" />
              Device Permission Diagnostics
            </h3>

            <div className="space-y-2.5">
              {/* Location Permission */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <MapPin className="w-4 h-4 text-rose-500 shrink-0" />
                  <div>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                      GPS Location Access
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      Required for live coordinates in SOS
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                      locationPermissionStatus === 'granted'
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                        : 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                    }`}
                  >
                    {locationPermissionStatus}
                  </span>
                  {locationPermissionStatus !== 'granted' && (
                    <button
                      type="button"
                      onClick={() => requestLocationPermission()}
                      className="text-xs font-bold text-rose-600 hover:underline"
                    >
                      Grant
                    </button>
                  )}
                </div>
              </div>

              {/* Notification Permission */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Bell className="w-4 h-4 text-purple-500 shrink-0" />
                  <div>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                      Push Notifications
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      Discreet confirmation & safety alerts
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                      notificationPermission === 'granted'
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                        : 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                    }`}
                  >
                    {notificationPermission}
                  </span>
                  {notificationPermission !== 'granted' && (
                    <button
                      type="button"
                      onClick={() => requestNotificationPermission()}
                      className="text-xs font-bold text-purple-600 hover:underline"
                    >
                      Grant
                    </button>
                  )}
                </div>
              </div>

              {/* Microphone / Recording Permission */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Mic className="w-4 h-4 text-amber-500 shrink-0" />
                  <div>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                      Microphone Access
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      Hands-free voice SOS safe-word detection
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                      micPermission === 'granted'
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                        : 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                    }`}
                  >
                    {micPermission}
                  </span>
                  {micPermission !== 'granted' && (
                    <button
                      type="button"
                      onClick={handleRequestMic}
                      className="text-xs font-bold text-amber-600 hover:underline"
                    >
                      Enable
                    </button>
                  )}
                </div>
              </div>

              {/* SMS Gateway Direct Credentials */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Server className="w-4 h-4 text-emerald-500 shrink-0" />
                  <div>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                      SMS Gateway Credentials
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      Direct Fast2SMS or Twilio API key setup & testing
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowSmsGateway(true)}
                  className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-sm transition"
                >
                  Configure
                </button>
              </div>
            </div>
          </div>

          {/* 6. Theme & Visual Style */}
          <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5 text-rose-500" />
                Theme & Accessibility
              </h3>
              <span className="text-[11px] font-mono text-slate-500 capitalize">
                {themeVariant} {darkMode ? '(Dark)' : '(Light)'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={toggleDarkMode}
                className="min-h-[44px] px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 flex items-center justify-between text-xs font-semibold text-slate-800 dark:text-slate-200 active:scale-95 transition"
              >
                <span className="flex items-center gap-2">
                  {darkMode ? <Moon className="w-4 h-4 text-purple-400" /> : <Sun className="w-4 h-4 text-amber-500" />}
                  Appearance
                </span>
                <span className="text-slate-400 font-normal">{darkMode ? 'Dark' : 'Light'}</span>
              </button>

              <button
                type="button"
                onClick={toggleHighContrast}
                className="min-h-[44px] px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 flex items-center justify-between text-xs font-semibold text-slate-800 dark:text-slate-200 active:scale-95 transition"
              >
                <span className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-blue-500" />
                  High Contrast
                </span>
                <span className="text-slate-400 font-normal">{highContrast ? 'On' : 'Off'}</span>
              </button>
            </div>
          </div>

          {/* 7. Cloud Backup & Restore */}
          <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Cloud Backup & Data Sync
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={handleExportBackup}
                className="min-h-[44px] rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold text-xs flex items-center justify-center gap-1.5 transition"
              >
                <Download className="w-4 h-4" />
                <span>Export Cloud Backup</span>
              </button>

              <button
                type="button"
                onClick={() => setShowRestoreBox(!showRestoreBox)}
                className="min-h-[44px] rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold text-xs flex items-center justify-center gap-1.5 transition"
              >
                <Upload className="w-4 h-4" />
                <span>Restore Backup</span>
              </button>
            </div>

            {showRestoreBox && (
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-2">
                <textarea
                  rows={4}
                  value={backupJson}
                  onChange={(e) => setBackupJson(e.target.value)}
                  placeholder="Paste backup JSON payload here..."
                  className="w-full p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-[11px] font-mono text-slate-800 dark:text-slate-200"
                />
                <button
                  type="button"
                  onClick={handleRestoreBackup}
                  className="w-full min-h-[38px] rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs"
                >
                  Execute Restore
                </button>
              </div>
            )}
          </div>

          {/* 8. Privacy & Account Controls (Logout, Data Purge & Account Deletion) */}
          <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Account, Privacy & Deletion Controls
            </h3>

            {/* View Full Privacy Policy Link */}
            <button
              type="button"
              onClick={() => setActiveModal('privacy_policy')}
              className="w-full min-h-[44px] rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold flex items-center justify-between px-3.5 transition"
            >
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-rose-600" />
                <span>View Full Privacy Policy & DPDPA Charter</span>
              </div>
              <span className="text-rose-600 dark:text-rose-400 font-semibold">Read →</span>
            </button>

            {/* Logout Button */}
            {confirmLogout ? (
              <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 space-y-2">
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  Are you sure you want to sign out of your account?
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs"
                  >
                    Yes, Sign Out
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmLogout(false)}
                    className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs border border-slate-300 dark:border-slate-600"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmLogout(true)}
                className="w-full min-h-[42px] rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold flex items-center justify-center gap-2 transition"
              >
                <LogOut className="w-4 h-4 text-slate-500" />
                <span>Sign Out of Account</span>
              </button>
            )}

            {/* Purge Location Traces */}
            <div className="space-y-2 pt-1">
              {confirmPurgeLoc ? (
                <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 space-y-2">
                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    Permanently purge all historical location breadcrumbs?
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleDeleteLocationHistory}
                      className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs"
                    >
                      Confirm Purge
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmPurgeLoc(false)}
                      className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs border border-slate-300 dark:border-slate-600"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmPurgeLoc(true)}
                  className="w-full min-h-[42px] rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:text-red-500 text-xs font-semibold flex items-center justify-center gap-2 transition"
                >
                  <Trash2 className="w-4 h-4 text-red-500" />
                  <span>Purge Historical Location Traces</span>
                </button>
              )}

              {/* Permanently Delete Account */}
              {confirmDeleteAcc ? (
                <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/70 border border-red-300 dark:border-red-800 space-y-2">
                  <p className="text-xs font-bold text-red-700 dark:text-red-300">
                    Erase entire account, trusted contacts, and emergency records permanently?
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleDeleteAccount}
                      className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold text-xs"
                    >
                      Permanently Delete
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteAcc(false)}
                      className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold text-xs border border-slate-300 dark:border-slate-700"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmDeleteAcc(true)}
                  className="w-full min-h-[42px] rounded-xl border border-red-200 dark:border-red-900/60 bg-red-50/50 dark:bg-red-950/20 text-red-600 dark:text-red-400 text-xs font-bold flex items-center justify-center gap-2 hover:bg-red-100 dark:hover:bg-red-950/40 transition"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete Account & Erase All Records</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
