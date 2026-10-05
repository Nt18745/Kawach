import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { KawachLogo } from './KawachLogo';
import {
  PhoneCall,
  LogIn,
  UserPlus,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  ShieldCheck,
  ChevronDown,
  Sparkles,
  Globe,
  User,
  Heart,
  Phone,
  ArrowRight,
  Shield
} from 'lucide-react';
import { signInWithPopup } from 'firebase/auth';
import { auth, db, googleProvider } from '../lib/firebase';
import { doc, setDoc } from 'firebase/firestore';

export interface CountryCode {
  name: string;
  code: string;
  dialCode: string;
  flag: string;
  formatPlaceholder: string;
  digitCount: number;
}

export const SUPPORTED_COUNTRIES: CountryCode[] = [
  { name: 'India', code: 'IN', dialCode: '+91', flag: '🇮🇳', formatPlaceholder: '98765 43210', digitCount: 10 },
  { name: 'United States', code: 'US', dialCode: '+1', flag: '🇺🇸', formatPlaceholder: '(555) 012-3456', digitCount: 10 },
  { name: 'United Kingdom', code: 'GB', dialCode: '+44', flag: '🇬🇧', formatPlaceholder: '7911 123456', digitCount: 10 },
  { name: 'Canada', code: 'CA', dialCode: '+1', flag: '🇨🇦', formatPlaceholder: '(555) 012-3456', digitCount: 10 },
  { name: 'Australia', code: 'AU', dialCode: '+61', flag: '🇦🇺', formatPlaceholder: '412 345 678', digitCount: 9 },
  { name: 'United Arab Emirates', code: 'AE', dialCode: '+971', flag: '🇦🇪', formatPlaceholder: '50 123 4567', digitCount: 9 },
  { name: 'Singapore', code: 'SG', dialCode: '+65', flag: '🇸🇬', formatPlaceholder: '8123 4567', digitCount: 8 },
  { name: 'Germany', code: 'DE', dialCode: '+49', flag: '🇩🇪', formatPlaceholder: '151 23456789', digitCount: 10 },
  { name: 'France', code: 'FR', dialCode: '+33', flag: '🇫🇷', formatPlaceholder: '6 12 34 56 78', digitCount: 9 },
  { name: 'Japan', code: 'JP', dialCode: '+81', flag: '🇯🇵', formatPlaceholder: '90 1234 5678', digitCount: 10 },
  { name: 'Saudi Arabia', code: 'SA', dialCode: '+966', flag: '🇸🇦', formatPlaceholder: '50 123 4567', digitCount: 9 },
  { name: 'South Korea', code: 'KR', dialCode: '+82', flag: '🇰🇷', formatPlaceholder: '10 1234 5678', digitCount: 10 },
  { name: 'New Zealand', code: 'NZ', dialCode: '+64', flag: '🇳🇿', formatPlaceholder: '21 123 4567', digitCount: 9 },
  { name: 'South Africa', code: 'ZA', dialCode: '+27', flag: '🇿🇦', formatPlaceholder: '82 123 4567', digitCount: 9 },
  { name: 'Nigeria', code: 'NG', dialCode: '+234', flag: '🇳🇬', formatPlaceholder: '802 123 4567', digitCount: 10 },
  { name: 'Nepal', code: 'NP', dialCode: '+977', flag: '🇳🇵', formatPlaceholder: '984 1234567', digitCount: 10 },
  { name: 'Bangladesh', code: 'BD', dialCode: '+880', flag: '🇧🇩', formatPlaceholder: '171 234 5678', digitCount: 10 },
  { name: 'Sri Lanka', code: 'LK', dialCode: '+94', flag: '🇱🇰', formatPlaceholder: '77 123 4567', digitCount: 9 },
];

export const normalizeToE164 = (selectedCountry: CountryCode, rawPhone: string): string => {
  const trimmed = rawPhone.trim();
  if (trimmed.startsWith('+')) {
    return trimmed.replace(/[^\d+]/g, '');
  }
  const digits = trimmed.replace(/\D/g, '');
  const cleanDigits = digits.replace(/^0+/, '');
  const cleanDialCode = selectedCountry.dialCode.startsWith('+')
    ? selectedCountry.dialCode
    : `+${selectedCountry.dialCode.replace(/\D/g, '')}`;
  return `${cleanDialCode}${cleanDigits}`;
};

interface LoginPageProps {
  onBypassEmergencySOS?: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onBypassEmergencySOS }) => {
  const { loginWithFirebaseSession, quickLogin, triggerSOSInitiation } = useApp();

  // Mode: Sign In vs Register
  const [activeTab, setActiveTab] = useState<'signin' | 'register'>('signin');

  // Country & Phone
  const [selectedCountry, setSelectedCountry] = useState<CountryCode>(SUPPORTED_COUNTRIES[0]);
  const [phoneNumber, setPhoneNumber] = useState('');

  // Profile fields
  const [fullName, setFullName] = useState('');
  const [bloodGroup, setBloodGroup] = useState('O+');
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  // Submit Handler: Direct Instant Login
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfoMessage(null);

    const rawDigits = phoneNumber.replace(/\D/g, '');
    if (rawDigits.length < 6) {
      setError('Please enter a valid mobile number (at least 6 digits).');
      return;
    }

    const fullE164 = normalizeToE164(selectedCountry, phoneNumber);
    const targetName = fullName.trim() || 'Mani Ranjan Thakur';

    setLoading(true);
    try {
      const ok = await quickLogin(fullE164, targetName, {
        bloodGroup,
        emergencyContactName: contactName.trim() || undefined,
        emergencyContactPhone: contactPhone.trim() || undefined
      });

      if (!ok) {
        setError('Login failed. Please check your credentials and try again.');
      }
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Direct 1-Click Instant Authorized Access
  const handleInstantGuestLogin = async () => {
    setError(null);
    setLoading(true);
    try {
      const targetPhone = phoneNumber.trim()
        ? normalizeToE164(selectedCountry, phoneNumber)
        : '+919876543210';
      const targetName = fullName.trim() || 'Mani Ranjan Thakur';

      const ok = await quickLogin(targetPhone, targetName, {
        bloodGroup: 'O+'
      });

      if (!ok) {
        setError('Direct authorization failed. Please try again.');
      }
    } catch (err: any) {
      setError(err?.message || 'Authorization failed.');
    } finally {
      setLoading(false);
    }
  };

  // Google 1-Tap Popup Sign-In
  const handleGoogleSignIn = async () => {
    setError(null);
    setInfoMessage(null);
    setLoading(true);

    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      const idToken = await user.getIdToken();
      const phone = user.phoneNumber || '+919876543210';
      const name = user.displayName || 'Authorized Kawach User';

      // Save to Firestore
      try {
        await setDoc(
          doc(db, 'users', user.uid),
          {
            id: user.uid,
            name,
            email: user.email,
            phone,
            phone_verified: true,
            photoURL: user.photoURL,
            updatedAt: new Date().toISOString()
          },
          { merge: true }
        );
      } catch (fErr) {
        console.warn('Firestore write warning:', fErr);
      }

      await loginWithFirebaseSession({
        firebaseUid: user.uid,
        phone,
        name,
        email: user.email || undefined,
        idToken
      });
    } catch (err: any) {
      console.error('Google Sign-In Error:', err);
      if (err?.code === 'auth/popup-closed-by-user') {
        setError('Sign-in window was closed.');
      } else {
        setError(err?.message || 'Google Sign-In failed.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleBypassSOS = () => {
    if (onBypassEmergencySOS) {
      onBypassEmergencySOS();
    } else {
      triggerSOSInitiation('login_emergency');
    }
  };

  const currentE164Preview = normalizeToE164(selectedCountry, phoneNumber);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between p-4 sm:p-6 font-sans">
      {/* 1. LIFE-SAFETY OVERRIDE: Instant SOS & 112 Direct Dial */}
      <div className="w-full max-w-md mx-auto pt-2">
        <button
          onClick={handleBypassSOS}
          className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-red-600 via-rose-600 to-red-700 hover:from-red-500 hover:to-rose-500 text-white font-black text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2.5 shadow-xl shadow-red-900/40 border border-red-500/80 active:scale-98 transition animate-pulse cursor-pointer"
        >
          <PhoneCall className="w-4 h-4 animate-bounce" />
          <span>Immediate Danger? Tap for Instant SOS (112)</span>
        </button>
      </div>

      {/* 2. Main Authentication Container */}
      <div className="w-full max-w-md mx-auto my-auto py-4">
        {/* Brand Header with Cyber-Shield Emblem */}
        <div className="text-center mb-6 flex flex-col items-center">
          <div className="relative mb-3 p-2">
            <div className="absolute inset-0 rounded-full bg-rose-600/20 blur-xl animate-pulse pointer-events-none" />
            <KawachLogo size="xl" showText={false} animated={true} />
          </div>

          <div className="flex items-center justify-center gap-2">
            <h1 className="text-3xl font-black tracking-tight text-white font-display">
              KAWACH
            </h1>
            <span className="px-2 py-0.5 rounded-lg bg-gradient-to-r from-rose-600 via-rose-500 to-amber-500 text-white font-extrabold text-sm shadow-md shadow-rose-600/30">
              कवच
            </span>
          </div>

          <p className="text-xs text-rose-300/80 font-medium tracking-wide mt-1 max-w-xs mx-auto">
            Advanced Women's Safety & Emergency Telemetry Network
          </p>

          <div className="inline-flex items-center gap-2 mt-3 px-3 py-1 rounded-full bg-slate-900/90 border border-rose-500/20 text-[11px] text-slate-300 shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
            <span className="font-semibold text-emerald-400">112 ERSS Live Sentinel</span>
            <span className="text-slate-500">·</span>
            <span className="text-slate-400">Direct Instant Access</span>
          </div>
        </div>

        {/* Global Informational Banner */}
        {infoMessage && (
          <div className="mb-4 p-3 rounded-2xl bg-emerald-950/80 border border-emerald-800 text-emerald-200 text-xs flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{infoMessage}</span>
          </div>
        )}

        {/* Global Error Banner */}
        {error && (
          <div className="mb-4 p-3.5 rounded-2xl bg-red-950/90 border border-red-800 text-red-200 text-xs flex items-start gap-2.5 animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold">{error}</p>
            </div>
          </div>
        )}

        {/* Mode Switcher: Sign In vs Register */}
        <div className="bg-slate-900 p-1 rounded-2xl border border-slate-800 grid grid-cols-2 gap-1 mb-4">
          <button
            type="button"
            onClick={() => {
              setActiveTab('signin');
              setError(null);
            }}
            className={`min-h-[42px] rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'signin'
                ? 'bg-rose-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <LogIn className="w-4 h-4" />
            <span>Sign In</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('register');
              setError(null);
            }}
            className={`min-h-[42px] rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'register'
                ? 'bg-rose-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <UserPlus className="w-4 h-4" />
            <span>Register</span>
          </button>
        </div>

        {/* Direct Instant Authentication Form */}
        <form
          onSubmit={handleSubmit}
          className="bg-slate-900/90 rounded-3xl p-5 border border-slate-800 shadow-2xl space-y-4"
        >
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">
              Select Country & Calling Code *
            </label>
            <div className="relative">
              <select
                value={selectedCountry.code}
                onChange={(e) => {
                  const found = SUPPORTED_COUNTRIES.find((c) => c.code === e.target.value);
                  if (found) setSelectedCountry(found);
                }}
                className="w-full py-2.5 pl-3 pr-8 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs font-medium focus:border-rose-500 focus:outline-none appearance-none transition"
              >
                {SUPPORTED_COUNTRIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.flag} {c.name} ({c.dialCode})
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">
              Mobile Phone Number *
            </label>
            <div className="relative flex items-center">
              <span className="absolute left-3 font-mono font-bold text-sm text-slate-400 pointer-events-none">
                {selectedCountry.dialCode}
              </span>
              <input
                type="tel"
                inputMode="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder={selectedCountry.formatPlaceholder}
                required
                autoFocus
                className="w-full pl-16 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm font-mono tracking-wide focus:border-rose-500 focus:outline-none transition"
              />
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1.5 px-0.5">
              <span>E.164 Standard:</span>
              <span className="font-mono text-emerald-400 font-semibold">
                {phoneNumber.trim() ? currentE164Preview : `${selectedCountry.dialCode}...`}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">
              {activeTab === 'register' ? 'Full Legal Name *' : 'Your Name (Optional)'}
            </label>
            <div className="relative flex items-center">
              <User className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Mani Ranjan Thakur"
                required={activeTab === 'register'}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs font-medium focus:border-rose-500 focus:outline-none transition"
              />
            </div>
          </div>

          {/* Registration extra fields */}
          {activeTab === 'register' && (
            <div className="pt-2 border-t border-slate-800 space-y-3 animate-in fade-in">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Blood Group (For Emergency First Responders)
                </label>
                <div className="relative flex items-center">
                  <Heart className="w-4 h-4 text-rose-500 absolute left-3 pointer-events-none" />
                  <select
                    value={bloodGroup}
                    onChange={(e) => setBloodGroup(e.target.value)}
                    className="w-full py-2.5 pl-10 pr-4 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs font-medium focus:border-rose-500 focus:outline-none transition"
                  >
                    {['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'].map((bg) => (
                      <option key={bg} value={bg}>{bg}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Primary Emergency Contact (Optional)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    placeholder="Contact Name (e.g. Mom)"
                    className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:border-rose-500 focus:outline-none transition"
                  />
                  <input
                    type="tel"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    placeholder="Contact Phone"
                    className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs font-mono focus:border-rose-500 focus:outline-none transition"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Action Button: Instant Direct Login */}
          <button
            type="submit"
            disabled={loading || phoneNumber.replace(/\D/g, '').length < 6}
            className="w-full min-h-[46px] rounded-xl bg-gradient-to-r from-rose-600 via-rose-500 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-rose-900/30 active:scale-98 transition disabled:opacity-50 cursor-pointer"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Authenticating...</span>
              </>
            ) : activeTab === 'signin' ? (
              <>
                <LogIn className="w-4 h-4" />
                <span>LOG IN & ENTER KAWACH</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" />
                <span>REGISTER & ENTER PLATFORM</span>
              </>
            )}
          </button>

          <div className="relative flex items-center justify-center my-3">
            <div className="border-t border-slate-800 w-full" />
            <span className="bg-slate-900 px-3 text-[11px] text-slate-500 uppercase font-bold tracking-wider shrink-0">
              Or Instant 1-Click Access
            </span>
            <div className="border-t border-slate-800 w-full" />
          </div>

          {/* One-Click Direct Authorized Demo Login */}
          <button
            type="button"
            onClick={handleInstantGuestLogin}
            disabled={loading}
            className="w-full min-h-[44px] rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700 hover:border-rose-500/50 text-slate-200 hover:text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow transition active:scale-98 cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Instant 1-Tap Guest Access</span>
            <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {/* Google Sign In */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full min-h-[44px] rounded-xl bg-slate-950 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white font-semibold text-xs flex items-center justify-center gap-2 transition active:scale-98 cursor-pointer"
          >
            <Globe className="w-4 h-4 text-emerald-400" />
            <span>Continue with Google</span>
          </button>
        </form>
      </div>

      {/* 3. Footer Trust & Platform Info */}
      <div className="w-full max-w-md mx-auto text-center text-[11px] text-slate-500 space-y-1 pb-2">
        <p className="flex items-center justify-center gap-2">
          <span>ERSS 112 Compatible</span> &bull;
          <span>Real-Time Telemetry</span> &bull;
          <span>Encrypted Vault</span>
        </p>
      </div>
    </div>
  );
};
