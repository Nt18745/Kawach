import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Clock,
  MapPin,
  Users,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ExternalLink,
  ChevronRight,
  HardDrive,
  UploadCloud,
  FileText,
  Lock,
  Battery,
  Wifi,
  Radio,
  FileCheck,
  X
} from 'lucide-react';
import { EmergencyHistoryRecord } from '../../types/database';
import { api } from '../../services/api';
import { useApp } from '../../context/AppContext';

interface EmergencyHistoryModalProps {
  onClose: () => void;
}

export const EmergencyHistoryModal: React.FC<EmergencyHistoryModalProps> = ({ onClose }) => {
  const { user } = useApp();
  const [history, setHistory] = useState<EmergencyHistoryRecord[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<EmergencyHistoryRecord | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [storageStats, setStorageStats] = useState<any>(null);
  const [uploading, setUploading] = useState<boolean>(false);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [hist, stats] = await Promise.all([
        api.getEmergencyHistory(),
        api.getStorageStats()
      ]);
      setHistory(hist);
      setStorageStats(stats);
      if (hist.length > 0 && !selectedRecord) {
        setSelectedRecord(hist[0]);
      }
    } catch (err) {
      console.error('Error loading emergency history:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadSuccess(null);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = (reader.result as string).split(',')[1];
        await api.uploadStorageArtifact({
          emergencyId: selectedRecord?.emergencyId || selectedRecord?.sessionId,
          filename: file.name,
          mimeType: file.type || 'application/octet-stream',
          sizeBytes: file.size,
          base64Content: base64
        });
        setUploadSuccess(`Evidence file "${file.name}" stored securely in 1 TB Cloud Vault.`);
        // Refresh stats
        const updatedStats = await api.getStorageStats();
        setStorageStats(updatedStats);
        setTimeout(() => setUploadSuccess(null), 4000);
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      alert(`Upload error: ${err.message || 'Failed to upload to cloud storage'}`);
    } finally {
      setUploading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return (
          <span className="px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/40 text-[11px] font-bold flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            ACTIVE
          </span>
        );
      case 'RESOLVED':
        return (
          <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[11px] font-bold flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            RESOLVED
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="px-2 py-0.5 rounded-full bg-slate-500/20 text-slate-300 border border-slate-500/40 text-[11px] font-bold">
            CANCELLED
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[11px] font-bold">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 animate-in fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden text-slate-100">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-500">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white font-display">
                Emergency History & 1 TB Evidence Vault
              </h2>
              <p className="text-xs text-slate-400">
                Encrypted SOS Timelines · Cloud Evidence · Audit Logs
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 1 TB Cloud Storage Metric Bar */}
        <div className="px-5 py-3 bg-slate-950/90 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <HardDrive className="w-4 h-4 text-cyan-400" />
            <span className="font-semibold text-slate-300">1 TB Cloud Storage Budget:</span>
            <span className="font-mono text-cyan-300 font-bold">
              {storageStats ? `${storageStats.usedGb} GB / 1,000 GB Target` : '1,000 GB Allocated'}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-slate-400 font-mono text-[11px]">
              <Lock className="w-3.5 h-3.5 text-emerald-400" />
              <span>AES-256 Encrypted</span>
            </div>
            <span className="text-slate-600">|</span>
            <div className="flex items-center gap-1.5 text-slate-400 font-mono text-[11px]">
              <FileCheck className="w-3.5 h-3.5 text-blue-400" />
              <span>Zero-Loss Audit Trail</span>
            </div>
          </div>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5">
          {loading ? (
            <div className="py-20 text-center space-y-3">
              <div className="w-10 h-10 rounded-full border-4 border-rose-500 border-t-transparent animate-spin mx-auto" />
              <p className="text-xs text-slate-400">Loading emergency history records...</p>
            </div>
          ) : history.length === 0 ? (
            <div className="py-16 text-center space-y-3 max-w-sm mx-auto">
              <div className="w-14 h-14 rounded-2xl bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-7 h-7 text-emerald-400" />
              </div>
              <h3 className="text-base font-bold text-white">No Emergency Alerts Yet</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                When you activate an SOS alert, your complete emergency timeline, GPS telemetry, notification delivery logs, and cloud evidence will appear here permanently.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
              
              {/* Left Column: History Sessions List */}
              <div className="md:col-span-5 space-y-2.5">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  All Emergency Sessions ({history.length})
                </p>
                <div className="space-y-2 max-h-[580px] overflow-y-auto pr-1">
                  {history.map((record) => {
                    const recId = record.emergencyId || record.sessionId || record.id;
                    const isSelected = (selectedRecord?.emergencyId || selectedRecord?.sessionId || selectedRecord?.id) === recId;
                    return (
                      <div
                        key={recId}
                        onClick={() => setSelectedRecord(record)}
                        className={`p-3.5 rounded-2xl border cursor-pointer transition ${
                          isSelected
                            ? 'bg-rose-950/30 border-rose-600/80 shadow-lg'
                            : 'bg-slate-800/50 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="font-mono text-[11px] text-slate-400 font-bold truncate max-w-[150px]">
                            {recId}
                          </span>
                          {getStatusBadge(record.status)}
                        </div>

                        <div className="flex items-center gap-1.5 text-xs text-slate-300 font-medium mb-1">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>{record.date} at {record.time}</span>
                        </div>

                        <div className="flex items-center gap-1.5 text-[11px] text-slate-400 truncate">
                          <MapPin className="w-3 h-3 text-rose-400 shrink-0" />
                          <span className="truncate">{record.startingLocation?.address || 'GPS Coordinates Acquired'}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Right Column: Detailed Session Timeline & Evidence */}
              {selectedRecord && (
                <div className="md:col-span-7 bg-slate-950/70 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-5">
                  
                  {/* Title & Status */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-800">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-slate-300">
                          SESSION: {selectedRecord.emergencyId || selectedRecord.sessionId || selectedRecord.id}
                        </span>
                        {getStatusBadge(selectedRecord.status)}
                      </div>
                      <p className="text-xs text-slate-400 mt-1">
                        Activated via: <span className="font-semibold text-slate-200">{selectedRecord.activationMethod}</span> &bull; Duration: {selectedRecord.durationSeconds || (selectedRecord.durationMinutes ? selectedRecord.durationMinutes * 60 : 0)}s
                      </p>
                    </div>

                    {selectedRecord.lastKnownLocation && (
                      <a
                        href={selectedRecord.lastKnownLocation.googleMapsUrl || `https://www.google.com/maps/search/?api=1&query=${selectedRecord.lastKnownLocation.latitude},${selectedRecord.lastKnownLocation.longitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Google Maps</span>
                      </a>
                    )}
                  </div>

                  {/* Telemetry Snapshot Strip */}
                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                      <span className="text-[10px] text-slate-400 block mb-0.5">Battery Level</span>
                      <div className="flex items-center justify-center gap-1 font-bold text-slate-200">
                        <Battery className="w-3.5 h-3.5 text-emerald-400" />
                        <span>{selectedRecord.batteryPercentage ? `${selectedRecord.batteryPercentage}%` : 'N/A'}</span>
                      </div>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                      <span className="text-[10px] text-slate-400 block mb-0.5">Network Status</span>
                      <div className="flex items-center justify-center gap-1 font-bold text-slate-200">
                        <Wifi className="w-3.5 h-3.5 text-cyan-400" />
                        <span className="capitalize">{selectedRecord.networkStatus || 'Online'}</span>
                      </div>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                      <span className="text-[10px] text-slate-400 block mb-0.5">Live Share</span>
                      <div className="flex items-center justify-center gap-1 font-bold text-slate-200">
                        <Radio className="w-3.5 h-3.5 text-rose-400" />
                        <span>{selectedRecord.locationShared ? 'Authorized' : 'Local'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Locations: Starting vs Last Known */}
                  <div className="space-y-3">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Location Breadcrumbs & GPS Accuracy
                    </p>

                    <div className="space-y-2">
                      <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs flex items-start justify-between gap-3">
                        <div className="flex items-start gap-2">
                          <MapPin className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-bold text-white block">Starting Location:</span>
                            <p className="text-slate-300 mt-0.5">{selectedRecord.startingLocation.address}</p>
                            <span className="font-mono text-[10px] text-slate-500 mt-1 block">
                              {selectedRecord.startingLocation.latitude.toFixed(5)}&deg; N, {selectedRecord.startingLocation.longitude.toFixed(5)}&deg; E &bull; Accuracy: &plusmn;{selectedRecord.startingLocation.accuracy}m
                            </span>
                          </div>
                        </div>
                        <a
                          href={selectedRecord.startingLocation.googleMapsUrl || `https://www.google.com/maps/search/?api=1&query=${selectedRecord.startingLocation.latitude},${selectedRecord.startingLocation.longitude}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-semibold shrink-0"
                        >
                          View Map
                        </a>
                      </div>

                      {selectedRecord.lastKnownLocation && (
                        <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs flex items-start justify-between gap-3">
                          <div className="flex items-start gap-2">
                            <MapPin className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                            <div>
                              <span className="font-bold text-white block">Last Known Location:</span>
                              <p className="text-slate-300 mt-0.5">{selectedRecord.lastKnownLocation.address}</p>
                              <span className="font-mono text-[10px] text-slate-500 mt-1 block">
                                {selectedRecord.lastKnownLocation.latitude.toFixed(5)}&deg; N, {selectedRecord.lastKnownLocation.longitude.toFixed(5)}&deg; E &bull; Accuracy: &plusmn;{selectedRecord.lastKnownLocation.accuracy}m
                              </span>
                            </div>
                          </div>
                          <a
                            href={selectedRecord.lastKnownLocation.googleMapsUrl || `https://www.google.com/maps/search/?api=1&query=${selectedRecord.lastKnownLocation.latitude},${selectedRecord.lastKnownLocation.longitude}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-semibold shrink-0"
                          >
                            View Map
                          </a>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Trusted Contacts Notified */}
                  {(() => {
                    const contactList = selectedRecord.trustedContactsNotified ||
                      (selectedRecord.contactsNotifiedDetails
                        ? selectedRecord.contactsNotifiedDetails.map(d => ({ name: d.name, phone: d.phone, status: d.deliveryStatus }))
                        : []);
                    return (
                      <div className="space-y-2">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                          Trusted Contacts Delivery Status ({contactList.length})
                        </p>
                        <div className="space-y-1.5">
                          {contactList.map((c: { name: string; phone: string; status: string }, i: number) => (
                            <div key={i} className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs">
                              <div>
                                <span className="font-bold text-slate-200">{c.name}</span>
                                <span className="text-slate-400 font-mono ml-2">({c.phone})</span>
                              </div>
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                c.status === 'delivered'
                                  ? 'bg-emerald-500/20 text-emerald-400'
                                  : 'bg-blue-500/20 text-blue-300'
                              }`}>
                                {c.status.toUpperCase()}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })()}

                  {/* Incident Notes */}
                  {selectedRecord.incidentNotes && (
                    <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs">
                      <span className="font-bold text-slate-400 block mb-1">Incident Notes / Resolution:</span>
                      <p className="text-slate-200 leading-relaxed">{selectedRecord.incidentNotes}</p>
                    </div>
                  )}

                  {/* 1 TB Cloud Storage Evidence Vault Uploader */}
                  <div className="p-4 rounded-2xl bg-slate-900/90 border border-cyan-800/50 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <HardDrive className="w-4 h-4 text-cyan-400" />
                        <span className="font-bold text-xs text-white">Upload Incident Evidence (1 TB Cloud Vault)</span>
                      </div>
                      <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/60">
                        Target 1 TB Allocated
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Store audio logs, photos, witness reports, or police documents linked to this emergency. Files are stored at <code className="text-cyan-300 font-mono">/users/{user?.id || 'uid'}/emergencies/{selectedRecord.emergencyId || selectedRecord.sessionId || selectedRecord.id}/incident-data/</code>.
                    </p>

                    {uploadSuccess && (
                      <div className="p-2.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 shrink-0" />
                        <span>{uploadSuccess}</span>
                      </div>
                    )}

                    <label className="min-h-[42px] px-4 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition shadow-md">
                      <UploadCloud className="w-4 h-4" />
                      <span>{uploading ? 'Encrypting & Uploading...' : 'Upload Incident Photo / Audio / Document'}</span>
                      <input
                        type="file"
                        onChange={handleFileUpload}
                        disabled={uploading}
                        className="hidden"
                      />
                    </label>
                  </div>

                </div>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
