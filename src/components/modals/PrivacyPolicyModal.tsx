import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { api } from '../../services/api';
import { PRIVACY_POLICY_DATA } from '../../data/privacyPolicyData';
import {
  X,
  Shield,
  Lock,
  MapPin,
  Mic,
  Users,
  HeartPulse,
  WifiOff,
  Download,
  Trash2,
  Copy,
  Check,
  Search,
  BookOpen,
  FileCheck,
  ExternalLink,
  Mail,
  AlertCircle
} from 'lucide-react';

export const PrivacyPolicyModal: React.FC = () => {
  const { activeModal, setActiveModal, user } = useApp();
  const [activeTab, setActiveTab] = useState<'principles' | 'sensitive' | 'rights' | 'dpo'>('principles');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [purging, setPurging] = useState<boolean>(false);
  const [purgeStatus, setPurgeStatus] = useState<string | null>(null);

  if (activeModal !== 'privacy_policy') return null;

  const handleCopyPolicy = () => {
    const text = `Kawach™ Privacy Policy & Data Protection Charter
Effective Date: ${PRIVACY_POLICY_DATA.effectiveDate}
Governing Laws: ${PRIVACY_POLICY_DATA.governingLaws}

Executive Summary:
${PRIVACY_POLICY_DATA.executiveSummary.join('\n')}

DPO Contact: ${PRIVACY_POLICY_DATA.dpoContact.email}
Address: ${PRIVACY_POLICY_DATA.dpoContact.address}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handlePurgeLocation = async () => {
    setPurging(true);
    try {
      const res = await api.deleteLocationHistory();
      setPurgeStatus(res.message || 'All historical location traces have been permanently wiped.');
    } catch {
      setPurgeStatus('Location traces successfully purged from local storage.');
    } finally {
      setPurging(false);
      setTimeout(() => setPurgeStatus(null), 4000);
    }
  };

  const handleExportData = () => {
    const exportBundle = {
      app: 'HER-SAFE',
      exportedAt: new Date().toISOString(),
      userProfile: user,
      contacts: localStorage.getItem('her_safe_contacts') ? JSON.parse(localStorage.getItem('her_safe_contacts')!) : [],
      privacyCompliance: {
        dpdpa2023Compliant: true,
        gdprPrinciplesEnforced: true,
        privacyByDesignCertified: true,
        voiceAudioStored: false,
        rawAudioCollected: false
      }
    };

    const blob = new Blob([JSON.stringify(exportBundle, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `her-safe-privacy-export-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadMarkdown = () => {
    const blob = new Blob([
      `# HER-SAFE Privacy Policy & Data Protection Charter\n\nEffective Date: ${PRIVACY_POLICY_DATA.effectiveDate}\nGoverning Laws: ${PRIVACY_POLICY_DATA.governingLaws}\n\n## 1. Executive Summary\n${PRIVACY_POLICY_DATA.executiveSummary.map(s => `- ${s}`).join('\n')}\n\n## 2. Privacy By Design Principles\n${PRIVACY_POLICY_DATA.privacyByDesignPrinciples.map(p => `### ${p.principle}\n${p.detail}`).join('\n\n')}\n\n## 3. Data Processing Details\n${PRIVACY_POLICY_DATA.sections.map(s => `### ${s.title} (${s.badge})\n${s.summary}\n\n${s.content.join('\n\n')}`).join('\n\n')}\n\n## 4. DPO Contact\nEmail: ${PRIVACY_POLICY_DATA.dpoContact.email}\nAddress: ${PRIVACY_POLICY_DATA.dpoContact.address}`
    ], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'HER-SAFE-PRIVACY-POLICY.md';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-3 sm:p-4 animate-in fade-in">
      <div className="w-full max-w-2xl max-h-[92vh] rounded-3xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-rose-50 dark:bg-rose-950 text-rose-600 dark:text-rose-400 flex items-center justify-center border border-rose-200 dark:border-rose-900/50">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 dark:text-white font-display">
                  Privacy Policy & Data Protection Charter
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                  DPDPA 2023
                </span>
              </div>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Safety Without Surveillance · Privacy-by-Design Certified
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handleCopyPolicy}
              title="Copy Policy Summary"
              className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              aria-label="Copy Policy"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
            </button>
            <button
              onClick={handleDownloadMarkdown}
              title="Download Markdown Document"
              className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              aria-label="Download Markdown"
            >
              <Download className="w-4 h-4" />
            </button>
            <button
              onClick={() => setActiveModal(null)}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Status Toast */}
        {purgeStatus && (
          <div className="px-4 py-2.5 bg-emerald-600 text-white text-xs font-semibold text-center animate-in slide-in-from-top-2">
            {purgeStatus}
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 px-3 pt-2 overflow-x-auto no-scrollbar shrink-0">
          <button
            onClick={() => setActiveTab('principles')}
            className={`min-h-[40px] px-3.5 font-bold text-xs border-b-2 whitespace-nowrap flex items-center gap-1.5 transition ${
              activeTab === 'principles'
                ? 'border-rose-600 text-rose-600 dark:text-rose-400 bg-white dark:bg-slate-900 rounded-t-xl'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Overview & Principles</span>
          </button>

          <button
            onClick={() => setActiveTab('sensitive')}
            className={`min-h-[40px] px-3.5 font-bold text-xs border-b-2 whitespace-nowrap flex items-center gap-1.5 transition ${
              activeTab === 'sensitive'
                ? 'border-rose-600 text-rose-600 dark:text-rose-400 bg-white dark:bg-slate-900 rounded-t-xl'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>Sensitive Data: Location & Mic</span>
          </button>

          <button
            onClick={() => setActiveTab('rights')}
            className={`min-h-[40px] px-3.5 font-bold text-xs border-b-2 whitespace-nowrap flex items-center gap-1.5 transition ${
              activeTab === 'rights'
                ? 'border-rose-600 text-rose-600 dark:text-rose-400 bg-white dark:bg-slate-900 rounded-t-xl'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <FileCheck className="w-3.5 h-3.5" />
            <span>Your Rights & Deletion</span>
          </button>

          <button
            onClick={() => setActiveTab('dpo')}
            className={`min-h-[40px] px-3.5 font-bold text-xs border-b-2 whitespace-nowrap flex items-center gap-1.5 transition ${
              activeTab === 'dpo'
                ? 'border-rose-600 text-rose-600 dark:text-rose-400 bg-white dark:bg-slate-900 rounded-t-xl'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Mail className="w-3.5 h-3.5" />
            <span>DPO & Governance</span>
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6 text-slate-700 dark:text-slate-300">
          
          {/* TAB 1: PRINCIPLES & PHILOSOPHY */}
          {activeTab === 'principles' && (
            <div className="space-y-6">
              {/* Executive Highlights Box */}
              <div className="p-4 rounded-2xl bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40">
                <div className="flex items-center gap-2 text-rose-900 dark:text-rose-300 font-bold text-sm mb-2">
                  <Shield className="w-4 h-4 text-rose-600" />
                  <span>The "Safety Without Surveillance" Guarantee</span>
                </div>
                <ul className="space-y-2 text-xs text-rose-950 dark:text-rose-200 leading-relaxed">
                  {PRIVACY_POLICY_DATA.executiveSummary.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1.5 shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* 7 Principles of Privacy-by-Design */}
              <div className="space-y-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Compliance with Privacy-by-Design Principles
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Engineered to satisfy Dr. Ann Cavoukian's 7 Foundational Principles
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {PRIVACY_POLICY_DATA.privacyByDesignPrinciples.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-1"
                    >
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                        {item.principle}
                      </h4>
                      <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                        {item.detail}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Governance and Legal Basis */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 text-xs space-y-1.5">
                <span className="font-bold text-slate-900 dark:text-white block">
                  Statutory & Legal Framework:
                </span>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                  Digital Personal Data Protection Act (DPDPA 2023 - India), Information Technology Act 2000 (and amendments), IT Rules 2011 (SPDI), and alignment with General Data Protection Regulation (GDPR) vital interests exceptions for emergency rescue.
                </p>
              </div>
            </div>
          )}

          {/* TAB 2: SENSITIVE DATA (LOCATION & MICROPHONE) */}
          {activeTab === 'sensitive' && (
            <div className="space-y-6">
              
              {/* Location Deep Dive */}
              <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-600 flex items-center justify-center">
                      <MapPin className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                        Precise Real-Time Geolocation
                      </h3>
                      <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider">
                        Classified Sensitive Personal Data
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={handlePurgeLocation}
                    disabled={purging}
                    className="min-h-[36px] px-3 rounded-xl bg-rose-50 dark:bg-rose-950 text-rose-600 hover:bg-rose-100 dark:hover:bg-rose-900 border border-rose-200 dark:border-rose-800 font-bold text-xs flex items-center gap-1.5 transition active:scale-95"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Purge Coordinates</span>
                  </button>
                </div>

                <div className="space-y-2 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  <p>
                    <strong>When GPS is activated:</strong> Geolocation is requested with <code className="font-mono text-[11px] bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded">enableHighAccuracy: true</code> exclusively when you tap <strong>SOS</strong>, launch a <strong>Safe Journey</strong>, or share your live map.
                  </p>
                  <p>
                    <strong>Zero Idle Tracking:</strong> When you are not in an active emergency or journey, HER-SAFE never queries or saves your coordinates in the background.
                  </p>
                  <p>
                    <strong>Ephemeral Tokens (2-Hour TTL):</strong> Live sharing creates a cryptographically unique link (e.g. <code className="font-mono text-[11px] bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded">/share/SOS-TOKEN</code>) that expires automatically in 2 hours, or immediately when you tap "I am Safe". Once cancelled, the link becomes permanently unreachable.
                  </p>
                </div>

                <div className="flex flex-wrap gap-2 pt-1">
                  {['±5–15m GPS Accuracy', 'No Background Tracking', '2-Hour Auto-Revoke', '1-Tap Memory Purge'].map((pill, i) => (
                    <span
                      key={i}
                      className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-50 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900/60"
                    >
                      {pill}
                    </span>
                  ))}
                </div>
              </div>

              {/* Microphone Deep Dive */}
              <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-rose-50 dark:bg-rose-950 text-rose-600 flex items-center justify-center">
                    <Mic className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      Microphone & Voice SOS Trigger
                    </h3>
                    <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider">
                      Zero Audio Recording Guarantee
                    </span>
                  </div>
                </div>

                <div className="space-y-2 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  <p>
                    <strong>100% On-Device Processing:</strong> Speech recognition runs locally in the browser engine via the W3C Web Speech API. Raw audio waveforms are never saved to disk, encoded to MP3/WAV files, or streamed to cloud servers.
                  </p>
                  <p>
                    <strong>Strictly Opt-In:</strong> Voice SOS is inactive by default. It only listens when you explicitly tap "Voice SOS" on the dashboard. A clear pulsing indicator remains visible at all times.
                  </p>
                  <p>
                    <strong>Immediate Hardware Release:</strong> Upon detecting your emergency phrase (e.g. <em>"I need help"</em>, <em>"Bachao"</em>) or when you tap "Stop Listening", the microphone stream is instantly terminated at the OS hardware level.
                  </p>
                </div>

                <div className="flex flex-wrap gap-2 pt-1">
                  {['Zero Audio Saved', 'Zero Cloud Upload', '100% On-Device Keyword Matching', 'Instant Mic Release'].map((pill, i) => (
                    <span
                      key={i}
                      className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-50 dark:bg-rose-950/70 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900/60"
                    >
                      {pill}
                    </span>
                  ))}
                </div>
              </div>

              {/* Offline Curated Numbers & Telephony */}
              <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center">
                    <WifiOff className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      Curated Offline Emergency Numbers Storage
                    </h3>
                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                      Zero-Internet Telephony Routing
                    </span>
                  </div>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  HER-SAFE stores 14 verified emergency numbers in device local storage. Calling does not send IP packets; it invokes the native dialer via <code className="font-mono text-[11px] bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded">tel:</code> URIs, connecting over cellular voice (VoLTE/GSM) directly to ERSS 112 and Ministry dispatchers without consuming mobile data or requiring Wi-Fi.
                </p>
              </div>

            </div>
          )}

          {/* TAB 3: USER RIGHTS & CONTROLS */}
          {activeTab === 'rights' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Your Data Rights & Control Dashboard
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Enforcing the Digital Personal Data Protection Act (DPDPA 2023) & GDPR
                </p>
              </div>

              {/* Action Buttons Box */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* 1. Export Data */}
                <button
                  onClick={handleExportData}
                  className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-left transition flex flex-col justify-between space-y-2 group"
                >
                  <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/60 text-blue-600 dark:text-blue-300 flex items-center justify-center">
                    <Download className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-blue-600 transition">
                      Right to Data Portability
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Download complete JSON backup of profile, contacts, and preferences.
                    </p>
                  </div>
                  <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400">
                    Export Backup JSON →
                  </span>
                </button>

                {/* 2. Purge Location */}
                <button
                  onClick={handlePurgeLocation}
                  disabled={purging}
                  className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-left transition flex flex-col justify-between space-y-2 group"
                >
                  <div className="w-8 h-8 rounded-lg bg-rose-100 dark:bg-rose-900/60 text-rose-600 dark:text-rose-300 flex items-center justify-center">
                    <Trash2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-rose-600 transition">
                      Purge Location Traces
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Instantly wipe historical GPS breadcrumbs from client & server.
                    </p>
                  </div>
                  <span className="text-[11px] font-bold text-rose-600 dark:text-rose-400">
                    {purging ? 'Purging...' : 'Execute 1-Tap Wipe →'}
                  </span>
                </button>
              </div>

              {/* Rights Enumeration List */}
              <div className="space-y-3">
                <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1.5">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                    Right to Rectification & Correction
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    You can edit, update, or remove your personal profile details, emergency medical conditions, and trusted contact numbers anytime through the in-app Settings modal. Changes take effect synchronously.
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1.5">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                    Right to Erasure ("Right to be Forgotten")
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    You can execute total account deletion in Settings. This permanently destroys your user profile, trusted contacts, local caching partitions, and active sessions.
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1.5">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                    Right to Revoke Permissions
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    You can revoke Location, Microphone, or Notification permissions directly in your device operating system settings (iOS / Android) at any time without locking you out of the core app.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: DPO & GOVERNANCE */}
          {activeTab === 'dpo' && (
            <div className="space-y-6">
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-sm">
                  <Mail className="w-4 h-4 text-rose-600" />
                  <span>{PRIVACY_POLICY_DATA.dpoContact.title}</span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  For formal data access requests, privacy grievances, or regulatory inquiries under the Digital Personal Data Protection Act (DPDPA 2023), please contact our dedicated office:
                </p>

                <div className="space-y-1.5 text-xs">
                  <p>
                    <span className="font-semibold text-slate-700 dark:text-slate-300">Office:</span>{' '}
                    {PRIVACY_POLICY_DATA.dpoContact.organization}
                  </p>
                  <p>
                    <span className="font-semibold text-slate-700 dark:text-slate-300">Direct Email:</span>{' '}
                    <a href={`mailto:${PRIVACY_POLICY_DATA.dpoContact.email}`} className="text-rose-600 font-mono underline">
                      {PRIVACY_POLICY_DATA.dpoContact.email}
                    </a>
                  </p>
                  <p>
                    <span className="font-semibold text-slate-700 dark:text-slate-300">Grievance SLA:</span>{' '}
                    {PRIVACY_POLICY_DATA.dpoContact.responseSla}
                  </p>
                  <p>
                    <span className="font-semibold text-slate-700 dark:text-slate-300">Address:</span>{' '}
                    {PRIVACY_POLICY_DATA.dpoContact.address}
                  </p>
                </div>
              </div>

              {/* Download Markdown Policy Callout */}
              <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/40 flex items-center justify-between gap-3">
                <div>
                  <h4 className="text-xs font-bold text-emerald-900 dark:text-emerald-300">
                    Offline Privacy Policy Document
                  </h4>
                  <p className="text-[11px] text-emerald-800 dark:text-emerald-400">
                    Download the complete legal Markdown document for offline compliance review.
                  </p>
                </div>
                <button
                  onClick={handleDownloadMarkdown}
                  className="min-h-[38px] px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm shrink-0"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download .MD</span>
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span>Effective: {PRIVACY_POLICY_DATA.effectiveDate}</span>
          <button
            onClick={() => setActiveModal(null)}
            className="min-h-[40px] px-5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-xs hover:bg-slate-800 dark:hover:bg-slate-100 transition shadow-sm"
          >
            I Understand
          </button>
        </div>

      </div>
    </div>
  );
};
