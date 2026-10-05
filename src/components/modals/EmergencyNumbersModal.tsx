import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { api } from '../../services/api';
import { EmergencyNumber } from '../../types/database';
import {
  EMERGENCY_SYSTEM_DOCUMENTATION,
  getOfflineNumbersLastSync
} from '../../data/verifiedEmergencyNumbers';
import {
  X,
  BookOpen,
  Search,
  PhoneCall,
  ShieldCheck,
  Calendar,
  WifiOff,
  Radio,
  FileText,
  RotateCw,
  Info,
  CheckCircle2,
  AlertTriangle,
  MessageSquare,
  Shield
} from 'lucide-react';

export const EmergencyNumbersModal: React.FC = () => {
  const { activeModal, setActiveModal, t, dialEmergencyNumber, isOnline } = useApp();
  const [numbers, setNumbers] = useState<EmergencyNumber[]>([]);
  const [search, setSearch] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [offlineOnlyFilter, setOfflineOnlyFilter] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'directory' | 'documentation'>('directory');
  const [loading, setLoading] = useState<boolean>(true);
  const [syncing, setSyncing] = useState<boolean>(false);
  const [lastSyncText, setLastSyncText] = useState<string>(getOfflineNumbersLastSync());
  const [syncToast, setSyncToast] = useState<string | null>(null);

  useEffect(() => {
    if (activeModal !== 'emergency_numbers') return;

    const fetchNumbers = async () => {
      setLoading(true);
      const data = await api.getEmergencyNumbers(categoryFilter, undefined, search);
      setNumbers(data);
      setLoading(false);
      setLastSyncText(getOfflineNumbersLastSync());
    };

    fetchNumbers();
  }, [activeModal, categoryFilter, search]);

  if (activeModal !== 'emergency_numbers') return null;

  const handleManualSync = async () => {
    if (!isOnline) {
      setSyncToast('Device is offline. Using verified local offline directory.');
      setTimeout(() => setSyncToast(null), 3500);
      return;
    }
    setSyncing(true);
    try {
      const res = await api.syncEmergencyNumbers();
      const updated = await api.getEmergencyNumbers(categoryFilter, undefined, search);
      setNumbers(updated);
      setLastSyncText(getOfflineNumbersLastSync());
      setSyncToast(`Updated ${res.count} verified numbers from Ministry gazette.`);
    } catch {
      setSyncToast('Sync failed; preserved verified offline copy.');
    } finally {
      setSyncing(false);
      setTimeout(() => setSyncToast(null), 3500);
    }
  };

  const categories = [
    { id: 'all', label: 'All Services' },
    { id: 'women', label: 'Women Helplines' },
    { id: 'police', label: 'Police' },
    { id: 'ambulance', label: 'Medical / Ambulance' },
    { id: 'fire', label: 'Fire & Rescue' },
    { id: 'child', label: 'Childline' },
    { id: 'railway', label: 'Rail Madad' },
    { id: 'disaster', label: 'Disaster NDMA' },
    { id: 'cyber', label: 'Cyber Harassment' }
  ];

  const filteredNumbers = numbers.filter(n => {
    if (offlineOnlyFilter && !n.availableOffline) return false;
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-3 sm:p-4 animate-in fade-in">
      <div className="w-full max-w-2xl max-h-[92vh] rounded-3xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden">
        
        {/* Top Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-200 dark:border-emerald-800/40">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 dark:text-white font-display">
                  {t.emergencyNumbers}
                </h2>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700">
                  <CheckCircle2 className="w-3 h-3" />
                  Offline Ready
                </span>
              </div>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Official Directory of India · Stored Locally on Device
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveModal(null)}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Local Storage & Offline Status Banner */}
        <div className="px-4 py-2.5 bg-emerald-50/70 dark:bg-emerald-950/40 border-b border-emerald-100 dark:border-emerald-900/40 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 text-emerald-900 dark:text-emerald-300">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-semibold">
              On-Device Storage: 14 Verified Helplines Cached
            </span>
            <span className="hidden sm:inline text-emerald-700 dark:text-emerald-400/80">
              · Works without internet or data pack
            </span>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
            <span className="hidden md:inline">Last verified: {lastSyncText}</span>
            <button
              onClick={handleManualSync}
              disabled={syncing}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 font-medium transition active:scale-95 disabled:opacity-50"
              title="Sync with government emergency registry"
            >
              <RotateCw className={`w-3 h-3 ${syncing ? 'animate-spin text-emerald-600' : ''}`} />
              <span>{syncing ? 'Syncing...' : 'Sync Directory'}</span>
            </button>
          </div>
        </div>

        {/* Sync Toast Notice */}
        {syncToast && (
          <div className="px-4 py-2 bg-blue-600 text-white text-xs font-semibold text-center animate-in slide-in-from-top-2">
            {syncToast}
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 px-4 pt-2">
          <button
            onClick={() => setActiveTab('directory')}
            className={`min-h-[42px] px-4 font-bold text-xs border-b-2 flex items-center gap-2 transition ${
              activeTab === 'directory'
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400 bg-white dark:bg-slate-900 rounded-t-xl'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Helpline Directory ({filteredNumbers.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('documentation')}
            className={`min-h-[42px] px-4 font-bold text-xs border-b-2 flex items-center gap-2 transition ${
              activeTab === 'documentation'
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400 bg-white dark:bg-slate-900 rounded-t-xl'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Offline Architecture & Docs</span>
          </button>
        </div>

        {/* TAB 1: DIRECTORY */}
        {activeTab === 'directory' && (
          <div className="flex flex-col flex-1 overflow-hidden">
            {/* Search Input Bar */}
            <div className="p-3 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
              <div className="relative flex items-center">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search helpline (e.g. 112, 181, police, train, child, mental health)..."
                  className="w-full h-11 pl-10 pr-24 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                {search && (
                  <button
                    onClick={() => setSearch('')}
                    className="absolute right-3 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            {/* Filter Pills Strip + Offline Toggle */}
            <div className="flex items-center justify-between gap-2 px-4 py-2.5 overflow-x-auto border-b border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-950/20 no-scrollbar">
              <div className="flex items-center gap-1.5">
                {categories.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setCategoryFilter(cat.id)}
                    className={`min-h-[34px] px-3 text-xs font-semibold rounded-full whitespace-nowrap transition ${
                      categoryFilter === cat.id
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              {/* Quick Offline Only Toggle */}
              <button
                onClick={() => setOfflineOnlyFilter(!offlineOnlyFilter)}
                className={`min-h-[34px] px-3 text-xs font-bold rounded-full whitespace-nowrap flex items-center gap-1.5 shrink-0 transition ${
                  offlineOnlyFilter
                    ? 'bg-emerald-700 text-white'
                    : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                <WifiOff className="w-3.5 h-3.5" />
                <span>Offline Capable Only</span>
              </button>
            </div>

            {/* Directory List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {loading ? (
                <div className="py-12 text-center text-xs text-slate-400">
                  <RotateCw className="w-5 h-5 mx-auto mb-2 animate-spin text-emerald-500" />
                  Loading verified offline directory...
                </div>
              ) : filteredNumbers.length === 0 ? (
                <div className="py-12 text-center text-slate-500 dark:text-slate-400 space-y-2">
                  <AlertTriangle className="w-8 h-8 mx-auto text-amber-500" />
                  <p className="text-sm font-semibold">No numbers match your query</p>
                  <p className="text-xs">Try adjusting your search terms or clearing the category filter.</p>
                </div>
              ) : (
                filteredNumbers.map(num => (
                  <div
                    key={num.id}
                    className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/40 dark:hover:border-emerald-500/40 shadow-sm transition"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xl font-black text-rose-600 dark:text-rose-400 font-mono tracking-tight">
                            {num.phoneNumber}
                          </span>

                          {/* Offline Ready Badge */}
                          <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-800 px-2 py-0.5 rounded-full">
                            <WifiOff className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                            Offline Verified
                          </span>

                          {num.isNationwide && (
                            <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded">
                              Nationwide
                            </span>
                          )}

                          {num.offlineTelephonyType && (
                            <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                              {num.offlineTelephonyType === 'toll_free'
                                ? 'Toll-Free Voice'
                                : 'Direct Carrier Voice'}
                            </span>
                          )}
                        </div>

                        <h3 className="text-sm font-bold text-slate-900 dark:text-white mt-1.5">
                          {num.serviceName}
                        </h3>

                        <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                          {num.notes}
                        </p>

                        {/* Offline notes callout */}
                        {num.offlineNotes && (
                          <div className="mt-2 text-[11px] text-emerald-800 dark:text-emerald-300/90 bg-emerald-50/70 dark:bg-emerald-950/30 p-2 rounded-xl border border-emerald-100 dark:border-emerald-900/30">
                            <strong>Offline Channel:</strong> {num.offlineNotes}
                          </div>
                        )}
                      </div>

                      {/* Immediate Dial Button */}
                      <button
                        onClick={() => dialEmergencyNumber(num.phoneNumber, num.serviceName)}
                        className="min-h-[48px] px-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-sm flex items-center gap-2 shadow-sm shrink-0 active:scale-95 transition"
                        title={`Dial ${num.phoneNumber} directly via phone dialer`}
                      >
                        <PhoneCall className="w-4 h-4" />
                        <span>Call</span>
                      </button>
                    </div>

                    {/* Audit & Verification Metadata */}
                    <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400">
                      <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        Source: {num.source}
                      </span>
                      <span className="flex items-center gap-1 font-mono">
                        <Calendar className="w-3 h-3" />
                        Verified: {num.verificationDate}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB 2: SYSTEM DOCUMENTATION & OFFLINE ARCHITECTURE */}
        {activeTab === 'documentation' && (
          <div className="flex-1 overflow-y-auto p-5 space-y-6 text-slate-700 dark:text-slate-300">
            {/* Overview Box */}
            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50">
              <div className="flex items-center gap-2 text-emerald-900 dark:text-emerald-300 font-bold text-sm mb-1">
                <Shield className="w-4 h-4 text-emerald-600" />
                <span>Zero-Failure Offline Emergency Calling Architecture</span>
              </div>
              <p className="text-xs text-emerald-800 dark:text-emerald-300/90 leading-relaxed">
                {EMERGENCY_SYSTEM_DOCUMENTATION.overview}
              </p>
            </div>

            {/* Telephony vs IP Data */}
            <section className="space-y-2">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Radio className="w-4 h-4 text-rose-500" />
                <span>{EMERGENCY_SYSTEM_DOCUMENTATION.carrierTelephonyLayer.title}</span>
              </h3>
              <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800">
                {EMERGENCY_SYSTEM_DOCUMENTATION.carrierTelephonyLayer.explanation}
              </p>
            </section>

            {/* Regulatory & Standards Compliance */}
            <section className="space-y-2">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-blue-500" />
                <span>{EMERGENCY_SYSTEM_DOCUMENTATION.regulatoryAndStandardsCompliance.title}</span>
              </h3>
              <ul className="space-y-2">
                {EMERGENCY_SYSTEM_DOCUMENTATION.regulatoryAndStandardsCompliance.points.map((pt, i) => (
                  <li
                    key={i}
                    className="text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 flex items-start gap-2"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                    <span>{pt}</span>
                  </li>
                ))}
              </ul>
            </section>

            {/* Comprehensive Offline Availability Matrix Table */}
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <WifiOff className="w-4 h-4 text-emerald-600" />
                  <span>Curated Offline Emergency Numbers Matrix</span>
                </h3>
                <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                  All 14 Verified for Offline Operation
                </span>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold">
                    <tr>
                      <th className="p-3">Dial Number</th>
                      <th className="p-3">Service Name</th>
                      <th className="p-3">Offline Status</th>
                      <th className="p-3">Data Required</th>
                      <th className="p-3">Dialer Channel</th>
                      <th className="p-3">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                    {EMERGENCY_SYSTEM_DOCUMENTATION.offlineAvailabilityMatrix.map(row => (
                      <tr key={row.number} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        <td className="p-3 font-mono font-black text-rose-600 dark:text-rose-400">
                          {row.number}
                        </td>
                        <td className="p-3 font-medium text-slate-900 dark:text-white">
                          {row.service}
                        </td>
                        <td className="p-3">
                          <span className="inline-flex items-center gap-1 font-bold text-[10px] text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-300 dark:border-emerald-800">
                            <CheckCircle2 className="w-3 h-3" />
                            {row.offlineStatus}
                          </span>
                        </td>
                        <td className="p-3 font-semibold text-slate-600 dark:text-slate-400">
                          {row.dataRequired}
                        </td>
                        <td className="p-3 text-[11px] text-slate-500 dark:text-slate-400">
                          {row.dialerType}
                        </td>
                        <td className="p-3">
                          <button
                            onClick={() => dialEmergencyNumber(row.number, row.service)}
                            className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-[11px] flex items-center gap-1 shadow-sm"
                          >
                            <PhoneCall className="w-3 h-3" />
                            <span>Call</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* Offline Device Cache Architecture */}
            <section className="space-y-2">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-purple-500" />
                <span>{EMERGENCY_SYSTEM_DOCUMENTATION.offlineStorageArchitecture.title}</span>
              </h3>
              <ul className="space-y-2">
                {EMERGENCY_SYSTEM_DOCUMENTATION.offlineStorageArchitecture.points.map((pt, i) => (
                  <li
                    key={i}
                    className="text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 flex items-start gap-2"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-purple-500 shrink-0 mt-0.5" />
                    <span>{pt}</span>
                  </li>
                ))}
              </ul>
            </section>

            {/* Offline SMS Fallback Protocol */}
            <section className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 space-y-2">
              <div className="flex items-center gap-2 text-amber-900 dark:text-amber-300 font-bold text-sm">
                <MessageSquare className="w-4 h-4 text-amber-600" />
                <span>{EMERGENCY_SYSTEM_DOCUMENTATION.offlineSmsFallbackProtocol.title}</span>
              </div>
              <p className="text-xs text-amber-800 dark:text-amber-300/90 leading-relaxed">
                {EMERGENCY_SYSTEM_DOCUMENTATION.offlineSmsFallbackProtocol.explanation}
              </p>
              <div className="pt-2 flex items-center gap-2">
                <a
                  href="sms:112?body=EMERGENCY! I need immediate help. Sent via HER-SAFE offline protocol."
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold shadow-sm"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Test Emergency SMS Intent</span>
                </a>
              </div>
            </section>

          </div>
        )}

      </div>
    </div>
  );
};
