import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { KawachLogo } from './KawachLogo';
import {
  Shield,
  Radio,
  BatteryCharging,
  BatteryWarning,
  Globe,
  ShieldAlert,
  Sparkles,
  Palette,
  Moon,
  Sun,
  Check,
  User,
  LogOut,
  Bell,
  BellRing,
  Settings,
  Key
} from 'lucide-react';
import { Language } from '../types/translations';

export const Header: React.FC = () => {
  const {
    user,
    logout,
    notificationPermission,
    requestNotificationPermission,
    language,
    setLanguage,
    lowBatteryMode,
    toggleLowBatteryMode,
    batteryLevel,
    isOnline,
    currentLocation,
    setActiveModal,
    themeVariant,
    setThemeVariant,
    darkMode,
    toggleDarkMode
  } = useApp();

  const [showThemePicker, setShowThemePicker] = useState<boolean>(false);
  const [showUserMenu, setShowUserMenu] = useState<boolean>(false);

  const themeOptions = [
    { id: 'crimson', name: 'Crimson', dot: 'bg-rose-600' },
    { id: 'emerald', name: 'Emerald', dot: 'bg-emerald-600' },
    { id: 'amber', name: 'Amber', dot: 'bg-amber-600' },
    { id: 'indigo', name: 'Indigo', dot: 'bg-indigo-600' },
    { id: 'slate', name: 'Slate', dot: 'bg-slate-600' },
    { id: 'cyberpunk', name: 'Cyberpunk', dot: 'bg-purple-600' }
  ] as const;

  const brandAccentClasses: Record<string, { bg: string; shadow: string; badge: string }> = {
    crimson: { bg: 'bg-rose-600', shadow: 'shadow-rose-600/30', badge: 'bg-rose-50 dark:bg-rose-950/70 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-900' },
    emerald: { bg: 'bg-emerald-600', shadow: 'shadow-emerald-600/30', badge: 'bg-emerald-50 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900' },
    amber: { bg: 'bg-amber-600', shadow: 'shadow-amber-600/30', badge: 'bg-amber-50 dark:bg-amber-950/70 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-900' },
    indigo: { bg: 'bg-indigo-600', shadow: 'shadow-indigo-600/30', badge: 'bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-900' },
    slate: { bg: 'bg-slate-700', shadow: 'shadow-slate-700/30', badge: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700' },
    cyberpunk: { bg: 'bg-purple-600', shadow: 'shadow-purple-600/30', badge: 'bg-purple-50 dark:bg-purple-950/70 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-900' }
  };

  const activeAccent = brandAccentClasses[themeVariant] || brandAccentClasses.crimson;

  const languages: { code: Language; label: string }[] = [
    { code: 'en', label: 'EN' },
    { code: 'hi', label: 'हिं' },
    { code: 'kn', label: 'ಕನ್ನ' }
  ];

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between px-4 py-3 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
      {/* Zone 1: Brand Wordmark with Holographic Shield Emblem */}
      <div className="flex items-center gap-2 cursor-pointer" onClick={() => setActiveModal(null)}>
        <KawachLogo
          size="sm"
          showText={true}
          subtitle={isOnline ? '112 ERSS · Active Sentinel' : 'Offline Safe Sentinel'}
        />
      </div>

      {/* Zone 2: System Telemetry status (GPS accuracy & Battery) */}
      <div className="hidden sm:flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-1 px-2 py-1 rounded bg-slate-100 dark:bg-slate-800">
          <Radio className="w-3.5 h-3.5 text-rose-500" />
          <span>GPS: ±{currentLocation?.accuracy || 12}m</span>
        </div>
        {batteryLevel !== null && (
          <div className="flex items-center gap-1 px-2 py-1 rounded bg-slate-100 dark:bg-slate-800">
            {batteryLevel <= 20 ? (
              <BatteryWarning className="w-3.5 h-3.5 text-amber-500" />
            ) : (
              <BatteryCharging className="w-3.5 h-3.5 text-emerald-500" />
            )}
            <span>{batteryLevel}%</span>
          </div>
        )}
      </div>

      {/* Zone 3: Primary Quick Actions */}
      <div className="flex items-center gap-2">
        {/* Kawach AI Guardian Quick Launch */}
        <button
          onClick={() => setActiveModal('ai_chat')}
          title="Kawach AI Safety Guardian"
          className="min-h-[44px] px-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/70 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/60 hover:bg-rose-100 dark:hover:bg-rose-900/80 flex items-center gap-1.5 text-xs font-bold transition shadow-sm"
          aria-label="Kawach AI Safety Guardian"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span className="hidden sm:inline">AI Guardian</span>
        </button>

        {/* Low Battery Emergency Toggle */}
        <button
          onClick={toggleLowBatteryMode}
          title="Toggle Low Battery Emergency Saver"
          className={`min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg text-xs font-medium transition ${
            lowBatteryMode
              ? 'bg-amber-500 text-white'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
          }`}
          aria-label="Low battery emergency saver"
        >
          <BatteryWarning className="w-4 h-4" />
        </button>

        {/* Theme Switcher Button & Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowThemePicker(!showThemePicker)}
            title="Switch App Theme"
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
            aria-label="Switch App Theme"
          >
            <Palette className="w-4 h-4" />
          </button>

          {showThemePicker && (
            <div className="absolute right-0 mt-2 w-48 rounded-2xl bg-white dark:bg-slate-900 shadow-xl border border-slate-200 dark:border-slate-800 p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between px-2 py-1.5 border-b border-slate-100 dark:border-slate-800 mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  App Theme
                </span>
                <button
                  onClick={toggleDarkMode}
                  className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition"
                  title="Toggle Light / Dark"
                >
                  {darkMode ? <Sun className="w-3.5 h-3.5 text-amber-500" /> : <Moon className="w-3.5 h-3.5 text-indigo-500" />}
                </button>
              </div>

              <div className="space-y-0.5">
                {themeOptions.map(t => {
                  const isSelected = themeVariant === t.id;
                  return (
                    <button
                      key={t.id}
                      onClick={() => {
                        setThemeVariant(t.id);
                        setShowThemePicker(false);
                      }}
                      className={`w-full px-2 py-1.5 rounded-lg flex items-center justify-between text-xs font-semibold transition ${
                        isSelected
                          ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white'
                          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className={`w-3 h-3 rounded-full ${t.dot} shadow-sm`} />
                        <span>{t.name}</span>
                      </div>
                      {isSelected && <Check className="w-3.5 h-3.5 text-rose-500" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Language Switcher */}
        <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5 border border-slate-200 dark:border-slate-700">
          <div className="pl-1.5 pr-0.5 text-slate-400">
            <Globe className="w-3.5 h-3.5" />
          </div>
          {languages.map(l => (
            <button
              key={l.code}
              onClick={() => setLanguage(l.code)}
              className={`min-h-[38px] px-2 py-1 text-xs font-semibold rounded-md transition ${
                language === l.code
                  ? 'bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {l.label}
            </button>
          ))}
        </div>

        {/* Notification Permission Indicator / Requester */}
        <button
          onClick={async () => {
            if (notificationPermission !== 'granted') {
              await requestNotificationPermission();
            }
          }}
          title={
            notificationPermission === 'granted'
              ? 'Emergency System Notifications: Enabled'
              : 'Tap to Allow Emergency Notifications'
          }
          className={`min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg text-xs font-medium transition ${
            notificationPermission === 'granted'
              ? 'bg-emerald-50 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/60'
              : 'bg-amber-50 dark:bg-amber-950/70 text-amber-600 dark:text-amber-400 border border-amber-300 dark:border-amber-800 animate-pulse'
          }`}
          aria-label="Notification permissions"
        >
          {notificationPermission === 'granted' ? <Bell className="w-4 h-4" /> : <BellRing className="w-4 h-4" />}
        </button>

        {/* User Account / Profile Menu */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            title={user ? `Account: ${user.name}` : 'User Profile'}
            className="min-h-[44px] px-2.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition flex items-center gap-1.5 text-xs font-semibold"
            aria-label="User account menu"
          >
            <div className="w-5 h-5 rounded-full bg-rose-600 text-white flex items-center justify-center text-[10px] font-bold">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <span className="hidden md:inline max-w-[90px] truncate">{user?.name?.split(' ')[0] || 'Profile'}</span>
          </button>

          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800 p-3 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="border-b border-slate-100 dark:border-slate-800 pb-2 mb-2">
                <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                  {user?.name || 'HER-SAFE User'}
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                  {user?.phone || 'Emergency Guardian'}
                </p>
                <div className="flex items-center gap-2 mt-1.5 text-[10px] font-medium text-slate-400">
                  <span className="px-1.5 py-0.5 rounded bg-rose-50 dark:bg-rose-950 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900">
                    Blood: {user?.bloodGroup || 'O+'}
                  </span>
                  <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-400">
                    ERSS Sync ✓
                  </span>
                </div>
              </div>

              <div className="space-y-1">
                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    setActiveModal('settings');
                  }}
                  className="w-full px-2.5 py-2 rounded-xl text-left text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2 transition"
                >
                  <Settings className="w-4 h-4 text-slate-400" />
                  <span>Safety Settings</span>
                </button>

                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    setActiveModal('sms_gateway');
                  }}
                  className="w-full px-2.5 py-2 rounded-xl text-left text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center gap-2 transition"
                >
                  <Key className="w-4 h-4 text-amber-500" />
                  <span>Configure SMS Gateway</span>
                </button>

                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    logout();
                  }}
                  className="w-full px-2.5 py-2 rounded-xl text-left text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/60 flex items-center gap-2 transition"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out / Switch</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Admin Portal Shortcut */}
        <button
          onClick={() => setActiveModal('admin_dashboard')}
          title="Admin Verification Portal"
          className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
          aria-label="Admin Verification Portal"
        >
          <ShieldAlert className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
