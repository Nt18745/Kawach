import React, { useState, useEffect } from 'react';
import {
  X,
  Key,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  Send,
  Loader2,
  Trash2,
  Phone,
  Server
} from 'lucide-react';
import { api } from '../../services/api';

interface SmsGatewayModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultProvider?: 'fast2sms' | 'twilio';
  initialPhone?: string;
}

export const SmsGatewayModal: React.FC<SmsGatewayModalProps> = ({
  isOpen,
  onClose,
  defaultProvider = 'fast2sms',
  initialPhone = ''
}) => {
  const [provider, setProvider] = useState<'fast2sms' | 'twilio'>(defaultProvider);
  
  // Fast2SMS fields
  const [fast2smsKey, setFast2smsKey] = useState<string>('');
  
  // Twilio fields
  const [twilioSid, setTwilioSid] = useState<string>('');
  const [twilioToken, setTwilioToken] = useState<string>('');
  const [twilioPhone, setTwilioPhone] = useState<string>('');

  // Testing state
  const [testPhoneNumber, setTestPhoneNumber] = useState<string>(initialPhone || '+91');
  const [isTesting, setIsTesting] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<{
    status: 'success' | 'error';
    message: string;
    details?: string;
  } | null>(null);

  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  // Load from localStorage on open
  useEffect(() => {
    if (isOpen) {
      const savedProvider = (localStorage.getItem('SMS_PROVIDER_CHOICE') as any) || defaultProvider;
      setProvider(savedProvider);
      setFast2smsKey(localStorage.getItem('FAST2SMS_KEY') || '');
      setTwilioSid(localStorage.getItem('TWILIO_ACCOUNT_SID') || '');
      setTwilioToken(localStorage.getItem('TWILIO_API_KEY') || localStorage.getItem('TWILIO_AUTH_TOKEN') || '');
      setTwilioPhone(localStorage.getItem('TWILIO_PHONE_NUMBER') || '');
      if (initialPhone) {
        setTestPhoneNumber(initialPhone);
      }
      setTestResult(null);
      setSaveSuccess(false);
    }
  }, [isOpen, defaultProvider, initialPhone]);

  if (!isOpen) return null;

  const handleSave = () => {
    localStorage.setItem('SMS_PROVIDER_CHOICE', provider);
    if (fast2smsKey.trim()) {
      localStorage.setItem('FAST2SMS_KEY', fast2smsKey.trim());
    } else {
      localStorage.removeItem('FAST2SMS_KEY');
    }

    if (twilioSid.trim()) {
      localStorage.setItem('TWILIO_ACCOUNT_SID', twilioSid.trim());
    } else {
      localStorage.removeItem('TWILIO_ACCOUNT_SID');
    }

    if (twilioToken.trim()) {
      localStorage.setItem('TWILIO_API_KEY', twilioToken.trim());
      localStorage.setItem('TWILIO_AUTH_TOKEN', twilioToken.trim());
    } else {
      localStorage.removeItem('TWILIO_API_KEY');
      localStorage.removeItem('TWILIO_AUTH_TOKEN');
    }

    if (twilioPhone.trim()) {
      localStorage.setItem('TWILIO_PHONE_NUMBER', twilioPhone.trim());
    } else {
      localStorage.removeItem('TWILIO_PHONE_NUMBER');
    }

    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleClearAll = () => {
    localStorage.removeItem('FAST2SMS_KEY');
    localStorage.removeItem('TWILIO_ACCOUNT_SID');
    localStorage.removeItem('TWILIO_API_KEY');
    localStorage.removeItem('TWILIO_AUTH_TOKEN');
    localStorage.removeItem('TWILIO_PHONE_NUMBER');
    setFast2smsKey('');
    setTwilioSid('');
    setTwilioToken('');
    setTwilioPhone('');
    setTestResult({
      status: 'error',
      message: 'All custom SMS credentials cleared from device storage.'
    });
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      // Save first
      handleSave();

      const res = await api.testSmsGateway({
        provider,
        fast2smsApiKey: fast2smsKey.trim() || undefined,
        twilioAccountSid: twilioSid.trim() || undefined,
        twilioAuthToken: twilioToken.trim() || undefined,
        twilioPhoneNumber: twilioPhone.trim() || undefined,
        testPhone: testPhoneNumber.trim() || '+919876543210'
      });

      if (res.status === 'sent' || res.status === 'delivered') {
        setTestResult({
          status: 'success',
          message: `SMS successfully dispatched via ${res.provider.toUpperCase()}!`,
          details: `Tracking Reference: ${res.providerMessageId || 'OK'}`
        });
      } else {
        setTestResult({
          status: 'error',
          message: `Gateway Rejected: ${res.errorMessage || 'Unable to deliver message'}`,
          details: res.statusCode ? `HTTP Status ${res.statusCode}` : undefined
        });
      }
    } catch (err: any) {
      setTestResult({
        status: 'error',
        message: err?.message || 'Network exception testing gateway connection'
      });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in select-none">
      <div className="relative w-full max-w-lg rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl p-5 sm:p-6 text-slate-100 max-h-[90vh] overflow-y-auto">
        {/* Top Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-600 to-amber-500 flex items-center justify-center shadow-md shadow-rose-600/30">
              <Server className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white font-display">
                Configure SMS Gateway
              </h2>
              <p className="text-xs text-slate-400">
                Direct carrier credentials for emergency SOS SMS broadcast & alerts
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Provider Tabs */}
        <div className="mt-4 grid grid-cols-2 gap-2 p-1 rounded-xl bg-slate-950 border border-slate-800">
          <button
            type="button"
            onClick={() => setProvider('fast2sms')}
            className={`py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
              provider === 'fast2sms'
                ? 'bg-gradient-to-r from-rose-600 to-red-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>Fast2SMS (+91 India)</span>
            <span className="text-[9px] px-1 py-0.2 rounded bg-amber-400/20 text-amber-300 font-mono">
              SOS
            </span>
          </button>

          <button
            type="button"
            onClick={() => setProvider('twilio')}
            className={`py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
              provider === 'twilio'
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>Twilio (Global)</span>
            <span className="text-[9px] px-1 py-0.2 rounded bg-blue-400/20 text-blue-300 font-mono">
              SMS
            </span>
          </button>
        </div>

        {/* Form Body */}
        <div className="mt-4 space-y-4 text-xs">
          {provider === 'fast2sms' ? (
            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-800/60 text-amber-200 space-y-1">
                <p className="font-bold flex items-center gap-1.5 text-xs text-amber-300">
                  <ShieldCheck className="w-4 h-4 text-amber-400" />
                  Fast2SMS Emergency Gateway
                </p>
                <p className="text-[11px] text-amber-200/90 leading-relaxed">
                  Sends verified emergency SOS broadcast alerts to Indian (+91) trusted mobile numbers.
                </p>
                <a
                  href="https://www.fast2sms.com/dashboard/dev-api"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-400 hover:underline pt-1"
                >
                  <span>Get Fast2SMS API Key</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1 text-[11px]">
                  Fast2SMS Authorization API Key
                </label>
                <input
                  type="password"
                  value={fast2smsKey}
                  onChange={(e) => setFast2smsKey(e.target.value)}
                  placeholder="Paste your Fast2SMS authorization key..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono text-xs focus:outline-none focus:border-rose-500 transition"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-blue-950/40 border border-blue-800/60 text-blue-200 space-y-1">
                <p className="font-bold flex items-center gap-1.5 text-xs text-blue-300">
                  <ShieldCheck className="w-4 h-4 text-blue-400" />
                  Twilio Programmable SMS Gateway
                </p>
                <p className="text-[11px] text-blue-200/90 leading-relaxed">
                  Dispatches international SMS worldwide using Twilio REST API credentials.
                </p>
                <a
                  href="https://console.twilio.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-400 hover:underline pt-1"
                >
                  <span>Open Twilio Console</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1 text-[11px]">
                  Twilio Account SID (starts with AC...)
                </label>
                <input
                  type="text"
                  value={twilioSid}
                  onChange={(e) => setTwilioSid(e.target.value)}
                  placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono text-xs focus:outline-none focus:border-blue-500 transition"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1 text-[11px]">
                  Twilio Auth Token
                </label>
                <input
                  type="password"
                  value={twilioToken}
                  onChange={(e) => setTwilioToken(e.target.value)}
                  placeholder="Paste Twilio Auth Token..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono text-xs focus:outline-none focus:border-blue-500 transition"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1 text-[11px]">
                  Twilio Sender Phone Number (E.164 with +)
                </label>
                <input
                  type="text"
                  value={twilioPhone}
                  onChange={(e) => setTwilioPhone(e.target.value)}
                  placeholder="+1234567890"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono text-xs focus:outline-none focus:border-blue-500 transition"
                />
              </div>
            </div>
          )}

          {/* Test Phone Field */}
          <div className="pt-2 border-t border-slate-800">
            <label className="block text-slate-300 font-semibold mb-1 text-[11px]">
              Test Destination Mobile Number
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={testPhoneNumber}
                onChange={(e) => setTestPhoneNumber(e.target.value)}
                placeholder="+919876543210"
                className="flex-1 px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono text-xs focus:outline-none focus:border-rose-500 transition"
              />
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={isTesting}
                className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-1.5 transition disabled:opacity-50"
              >
                {isTesting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Testing...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Test Send</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Test Result Display */}
          {testResult && (
            <div
              className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 animate-in fade-in ${
                testResult.status === 'success'
                  ? 'bg-emerald-950/70 border-emerald-800 text-emerald-200'
                  : 'bg-red-950/80 border-red-800 text-red-200'
              }`}
            >
              {testResult.status === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              )}
              <div className="flex-1 min-w-0">
                <p className="font-bold">{testResult.message}</p>
                {testResult.details && (
                  <p className="text-[11px] opacity-80 mt-0.5 font-mono break-all">
                    {testResult.details}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Save Status Notification */}
          {saveSuccess && (
            <div className="p-2.5 rounded-xl bg-emerald-950/60 border border-emerald-800/80 text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>SMS Gateway settings saved securely in your browser!</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={handleClearAll}
              className="px-3 py-2 rounded-xl text-slate-400 hover:text-red-400 hover:bg-red-950/30 text-xs font-semibold flex items-center gap-1 transition"
              title="Remove stored credentials from browser"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear Keys</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
              >
                Close
              </button>

              <button
                type="button"
                onClick={() => {
                  handleSave();
                  onClose();
                }}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/30 transition flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Save & Apply</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
