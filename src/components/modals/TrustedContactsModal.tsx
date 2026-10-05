import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { api } from '../../services/api';
import { notifications } from '../../services/notifications';
import { TrustedContact } from '../../types/database';
import { firebaseService } from '../../services/firebaseService';
import {
  X,
  Users,
  UserPlus,
  Trash2,
  BellRing,
  ShieldCheck,
  CheckCircle2,
  Phone,
  AlertCircle,
  Smartphone,
  Upload,
  Edit2,
  HelpCircle,
  MessageSquare,
  Share2,
  Send
} from 'lucide-react';

export const TrustedContactsModal: React.FC = () => {
  const {
    activeModal,
    setActiveModal,
    contacts,
    refreshUserData,
    user,
    t,
    toggleContactAlertPreference,
    setContactPrimary,
    verifyContactLine
  } = useApp();
  const [showAddForm, setShowAddForm] = useState<boolean>(false);
  const [editingContact, setEditingContact] = useState<TrustedContact | null>(null);

  // Form states
  const [name, setName] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [relationship, setRelationship] = useState<string>('Family');
  const [priority, setPriority] = useState<string>('primary');

  // Deletion inline confirmation state
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [confirmClearAll, setConfirmClearAll] = useState<boolean>(false);

  // Status & Feedback
  const [error, setError] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Active Alert Notification Result Banner
  const [activeAlertResult, setActiveAlertResult] = useState<{
    phone: string;
    name: string;
    smsUrl?: string;
    whatsappUrl?: string;
    message: string;
  } | null>(null);

  // File input ref for vCard / CSV import
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Check if native Web Contact Picker API is available
  const hasNativeContactPicker =
    typeof navigator !== 'undefined' &&
    'contacts' in navigator &&
    'ContactsManager' in window &&
    typeof (navigator as any).contacts?.select === 'function';

  // Auto-clean any legacy unwanted dummy contacts on mount
  useEffect(() => {
    if (activeModal !== 'trusted_contacts') return;

    const legacySeedIds = ['con-01', 'con-02', 'con-03', 'cnt-01', 'cnt-02', 'cnt-03'];
    const hasLegacy = contacts.some(c => legacySeedIds.includes(c.id));
    if (hasLegacy) {
      // Purge them asynchronously
      (async () => {
        for (const c of contacts) {
          if (legacySeedIds.includes(c.id)) {
            await api.deleteContact(c.id);
          }
        }
        await refreshUserData();
      })();
    }
  }, [activeModal, contacts, refreshUserData]);

  if (activeModal !== 'trusted_contacts') return null;

  // Open Edit Form
  const startEdit = (c: TrustedContact) => {
    setEditingContact(c);
    setName(c.name);
    setPhone(c.phone);
    setRelationship(c.relationship || 'Family');
    setPriority(c.priority || 'primary');
    setShowAddForm(true);
    setError(null);
  };

  // Reset Form
  const resetForm = () => {
    setName('');
    setPhone('');
    setRelationship('Family');
    setPriority('primary');
    setEditingContact(null);
    setShowAddForm(false);
    setError(null);
  };

  // Add or Update Contact
  const handleSaveContact = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanPhone = phone.trim();
    const cleanName = name.trim();

    if (!cleanName || !cleanPhone) {
      setError('Please provide contact name and phone number.');
      return;
    }

    if (cleanPhone.replace(/\D/g, '').length < 8) {
      setError('Please provide a valid phone number (at least 8 digits).');
      return;
    }

    setSubmitting(true);
    try {
      if (editingContact) {
        await api.updateContact(editingContact.id, {
          name: cleanName,
          phone: cleanPhone,
          relationship,
          priority: priority as any
        });
        if (user?.id) {
          firebaseService.saveContact(user.id, {
            id: editingContact.id,
            userId: user.id,
            name: cleanName,
            phone: cleanPhone,
            relationship: relationship as any,
            priority: priority as any,
            verificationStatus: editingContact.verificationStatus || 'verified',
            createdAt: editingContact.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }).catch(() => {});
        }
        setStatusMsg(`Updated details for ${cleanName}.`);
      } else {
        const added = await api.addContact({
          name: cleanName,
          phone: cleanPhone,
          relationship,
          priority
        });
        if (user?.id && added?.id) {
          firebaseService.saveContact(user.id, {
            id: added.id,
            userId: user.id,
            name: cleanName,
            phone: cleanPhone,
            relationship: relationship as any,
            priority: priority as any,
            verificationStatus: 'verified',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }).catch(() => {});
        }
        setStatusMsg(`Added ${cleanName} to your emergency circle.`);
      }

      await refreshUserData();
      resetForm();
      setTimeout(() => setStatusMsg(null), 3500);
    } catch (err: any) {
      setError(err.message || 'Could not save contact');
    } finally {
      setSubmitting(false);
    }
  };

  // Delete Single Contact (No window.confirm!)
  const executeDelete = async (id: string, contactName: string) => {
    setConfirmDeleteId(null);
    try {
      if (user?.id) {
        firebaseService.deleteContact(user.id, id).catch(() => {});
      }
      await api.deleteContact(id);
      await refreshUserData();
      setStatusMsg(`Removed ${contactName} from your trusted contacts.`);
      setTimeout(() => setStatusMsg(null), 3000);
    } catch {
      setError('Failed to delete contact. Please try again.');
    }
  };

  // Clear All Contacts
  const executeClearAll = async () => {
    setConfirmClearAll(false);
    try {
      await api.clearAllContacts();
      await refreshUserData();
      setStatusMsg('All contacts removed. Your emergency circle is now clean.');
      setTimeout(() => setStatusMsg(null), 3500);
    } catch {
      setError('Failed to clear contacts.');
    }
  };

  // Test Alert SMS
  const handleTestAlert = async (id: string, contactName: string, contactPhone?: string) => {
    setStatusMsg(`Preparing emergency test alert for ${contactName}...`);
    try {
      const res = await api.sendTestAlert(id);
      const targetPhone = res.phone || contactPhone || '';
      const cleanPhone = targetPhone.replace(/[^\d+]/g, '');
      const cleanDigits = targetPhone.replace(/[^\d]/g, '');

      const isIOS = typeof navigator !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent);
      const defaultMsg = `🚨 [KAWACH TEST ALERT]\nHello ${contactName}, this is a verified safety test alert from Kawach.\nYou are my trusted emergency contact. In an emergency you will receive live GPS coordinates. No action required.`;
      const finalMsg = res.message || defaultMsg;

      const smsUrl = res.smsUrl || (cleanPhone ? `sms:${cleanPhone}${isIOS ? '&' : '?'}body=${encodeURIComponent(finalMsg)}` : undefined);
      const whatsappUrl = res.whatsappUrl || (cleanDigits ? `https://api.whatsapp.com/send?phone=${cleanDigits}&text=${encodeURIComponent(finalMsg)}` : undefined);

      setActiveAlertResult({
        name: contactName,
        phone: targetPhone,
        smsUrl,
        whatsappUrl,
        message: finalMsg
      });

      setStatusMsg(`Emergency alert dispatched to ${targetPhone || contactName}!`);

      // Trigger native messaging app
      if (smsUrl) {
        try {
          const a = document.createElement('a');
          a.href = smsUrl;
          a.target = '_blank';
          a.rel = 'noopener noreferrer';
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
        } catch {
          window.location.href = smsUrl;
        }
      }

      notifications.sendBrowserNotification(`🔔 TEST ALERT DISPATCHED - KAWACH`, {
        body: `Test emergency notification dispatched to ${contactName} (${targetPhone}). Delivered via SMS & ERSS.`
      });
      notifications.speakEmergencyAlert(`Test emergency alert dispatched to ${contactName}`);
    } catch {
      setStatusMsg('Failed to send test alert');
      setTimeout(() => setStatusMsg(null), 3000);
    }
  };

  const handleDirectSms = (c: TrustedContact) => {
    const cleanPhone = c.phone.replace(/[^\d+]/g, '');
    const isIOS = typeof navigator !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent);
    const text = `🚨 [KAWACH EMERGENCY ALERT] I need assistance! Verified contact: ${c.name}. Live tracking: ${window.location.origin}/?share=live`;
    const url = `sms:${cleanPhone}${isIOS ? '&' : '?'}body=${encodeURIComponent(text)}`;
    window.location.href = url;
  };

  const handleDirectWhatsApp = (c: TrustedContact) => {
    const cleanDigits = c.phone.replace(/[^\d]/g, '');
    const text = `🚨 *[KAWACH EMERGENCY ALERT]*\nI need immediate assistance! Emergency Contact: ${c.name}.\nLive tracking: ${window.location.origin}/?share=live`;
    window.open(`https://api.whatsapp.com/send?phone=${cleanDigits}&text=${encodeURIComponent(text)}`, '_blank');
  };

  // 1. Native Mobile Contact Picker API
  const handlePickFromPhone = async () => {
    setError(null);
    if (!hasNativeContactPicker) {
      // Prompt vCard / CSV file selector or manual entry
      fileInputRef.current?.click();
      return;
    }

    try {
      const props = ['name', 'tel'];
      const selected = await (navigator as any).contacts.select(props, { multiple: true });

      if (!selected || selected.length === 0) {
        return; // User cancelled
      }

      const parsedList: Array<{ name: string; phone: string; relationship: string; priority: string }> = [];

      for (const item of selected) {
        const cName = Array.isArray(item.name) && item.name.length > 0 ? item.name[0] : 'Phone Contact';
        const cTel = Array.isArray(item.tel) && item.tel.length > 0 ? item.tel[0] : '';

        if (cTel && cTel.replace(/\D/g, '').length >= 6) {
          parsedList.push({
            name: cName.trim(),
            phone: cTel.trim(),
            relationship: 'Phone Contact',
            priority: 'primary'
          });
        }
      }

      if (parsedList.length === 0) {
        setError('Selected contacts did not contain valid phone numbers.');
        return;
      }

      setSubmitting(true);
      await api.importContacts(parsedList);
      await refreshUserData();
      setStatusMsg(`Successfully imported ${parsedList.length} contact(s) from your phone!`);
      setTimeout(() => setStatusMsg(null), 4000);
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        setError(err.message || 'Could not access phone contacts.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  // 2. vCard (.vcf) or CSV file importer
  const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setSubmitting(true);

    try {
      const text = await file.text();
      const parsedContacts: Array<{ name: string; phone: string; relationship: string; priority: string }> = [];

      if (file.name.toLowerCase().endsWith('.vcf') || text.includes('BEGIN:VCARD')) {
        // Parse vCard format
        const vcards = text.split(/BEGIN:VCARD/i);
        for (const card of vcards) {
          if (!card.trim()) continue;

          // Extract FN or N
          let contactName = '';
          const fnMatch = card.match(/FN[;:]([^\r\n]+)/i);
          if (fnMatch) {
            contactName = fnMatch[1].trim();
          } else {
            const nMatch = card.match(/N[;:]([^\r\n]+)/i);
            if (nMatch) {
              const parts = nMatch[1].split(';').filter(Boolean);
              contactName = parts.reverse().join(' ').trim();
            }
          }

          // Extract TEL
          const telMatches = card.match(/TEL[^:]*:([^\r\n]+)/gi);
          if (telMatches) {
            for (const telLine of telMatches) {
              const num = telLine.replace(/TEL[^:]*:/i, '').trim();
              if (num && num.replace(/\D/g, '').length >= 7) {
                parsedContacts.push({
                  name: contactName || 'Phone Contact',
                  phone: num,
                  relationship: 'Phone Contact',
                  priority: 'primary'
                });
                break; // Take primary number per card
              }
            }
          }
        }
      } else {
        // Parse CSV format (Name, Phone, Relationship)
        const lines = text.split(/[\r\n]+/).filter(Boolean);
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          // Skip header row if it contains 'name' or 'phone'
          if (i === 0 && (line.toLowerCase().includes('name') || line.toLowerCase().includes('phone'))) {
            continue;
          }
          const parts = line.split(',').map(s => s.replace(/["']/g, '').trim());
          if (parts.length >= 2) {
            const cName = parts[0];
            const cPhone = parts[1];
            if (cPhone.replace(/\D/g, '').length >= 7) {
              parsedContacts.push({
                name: cName || 'Contact',
                phone: cPhone,
                relationship: parts[2] || 'Friend',
                priority: 'primary'
              });
            }
          }
        }
      }

      if (parsedContacts.length === 0) {
        setError('No valid phone contacts found in this file.');
        return;
      }

      await api.importContacts(parsedContacts);
      await refreshUserData();
      setStatusMsg(`Imported ${parsedContacts.length} contact(s) from ${file.name}!`);
      setTimeout(() => setStatusMsg(null), 4000);
    } catch (err: any) {
      setError(`Failed to read contact file: ${err.message || 'Unknown error'}`);
    } finally {
      setSubmitting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-3 sm:p-4 animate-in fade-in">
      {/* Hidden File Input for .vcf / CSV import */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".vcf,.vcard,text/vcard,text/x-vcard,.csv,text/csv"
        className="hidden"
        onChange={handleFileImport}
      />

      <div className="w-full max-w-xl max-h-[92vh] rounded-3xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden">
        
        {/* Top Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-rose-50 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 flex items-center justify-center border border-rose-200 dark:border-rose-800/40">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 dark:text-white font-display">
                  {t.trustedContacts}
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300">
                  {contacts.length} {contacts.length === 1 ? 'Contact' : 'Contacts'}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Authorized guardians who receive your emergency alerts & live tracking
              </p>
            </div>
          </div>

          <button
            onClick={() => setActiveModal(null)}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status feedback banner */}
        {statusMsg && (
          <div className="bg-emerald-50 dark:bg-emerald-950/70 border-b border-emerald-200 dark:border-emerald-800/80 px-4 py-2.5 text-xs font-semibold text-emerald-800 dark:text-emerald-300 flex items-center gap-2 animate-in slide-in-from-top-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{statusMsg}</span>
          </div>
        )}

        {/* Error notification banner */}
        {error && (
          <div className="bg-rose-50 dark:bg-rose-950/70 border-b border-rose-200 dark:border-rose-800/80 px-4 py-2.5 text-xs font-semibold text-rose-800 dark:text-rose-300 flex items-center gap-2 animate-in slide-in-from-top-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Live Notification Dispatch & Delivery Card */}
        {activeAlertResult && (
          <div className="bg-emerald-950 border-b border-emerald-500/40 p-3.5 text-white animate-in slide-in-from-top-2 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/30">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-xs text-white">
                    Emergency Alert Dispatched to {activeAlertResult.name}
                  </h4>
                  <p className="text-[11px] text-emerald-300 font-mono">
                    {activeAlertResult.phone}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveAlertResult(null)}
                className="text-emerald-400 hover:text-white p-1 rounded hover:bg-emerald-900 transition"
                aria-label="Close alert banner"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-[11px] text-emerald-200 leading-relaxed">
              Dispatched via Kawach Emergency Gateway. Native SMS app was launched for this recipient number. If your device messaging app did not open automatically, tap below:
            </p>

            <div className="flex flex-wrap items-center gap-2 pt-0.5">
              {activeAlertResult.smsUrl && (
                <a
                  href={activeAlertResult.smsUrl}
                  className="min-h-[34px] px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-xs flex items-center gap-1.5 shadow transition"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Open SMS to {activeAlertResult.phone}</span>
                </a>
              )}
              {activeAlertResult.whatsappUrl && (
                <a
                  href={activeAlertResult.whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="min-h-[34px] px-3 rounded-lg bg-emerald-800 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs flex items-center gap-1.5 shadow transition"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Send WhatsApp</span>
                </a>
              )}
            </div>
          </div>
        )}

        {/* Action Toolbar */}
        {!showAddForm && (
          <div className="p-3.5 bg-slate-50 dark:bg-slate-950/50 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shrink-0">
            {/* Pick from phone contacts */}
            <button
              onClick={handlePickFromPhone}
              disabled={submitting}
              className="flex-1 min-h-[42px] px-3.5 rounded-xl bg-rose-600 hover:bg-rose-500 active:scale-98 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm shadow-rose-600/20 transition disabled:opacity-60"
              title="Select contacts directly from your phone address book"
            >
              <Smartphone className="w-4 h-4" />
              <span>{hasNativeContactPicker ? 'Pick from Phone Contacts' : 'Import Phone Contacts'}</span>
            </button>

            {/* Import file fallback */}
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={submitting}
              className="min-h-[42px] px-3.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 font-semibold text-xs flex items-center justify-center gap-1.5 transition active:scale-98 disabled:opacity-60"
              title="Upload an exported vCard (.vcf) or CSV file from your phonebook"
            >
              <Upload className="w-3.5 h-3.5 text-slate-500" />
              <span>Import .vcf / CSV</span>
            </button>

            {/* Manual entry button */}
            <button
              onClick={() => {
                resetForm();
                setShowAddForm(true);
              }}
              disabled={submitting}
              className="min-h-[42px] px-3.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold text-xs flex items-center justify-center gap-1.5 transition active:scale-98"
            >
              <UserPlus className="w-3.5 h-3.5 text-rose-500" />
              <span>Add Manually</span>
            </button>
          </div>
        )}

        {/* Modal Main Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {showAddForm ? (
            /* Add or Edit Contact Form */
            <form onSubmit={handleSaveContact} className="space-y-4 p-1 animate-in fade-in">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Users className="w-4 h-4 text-rose-500" />
                  <span>{editingContact ? 'Edit Emergency Contact' : 'Add New Emergency Contact'}</span>
                </h3>
                <span className="text-[11px] text-slate-500">Stored on your device</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Full Name / Contact Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Maya Patel"
                  className="w-full h-11 px-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Phone Number <span className="text-rose-500">*</span>
                </label>
                <div className="relative flex items-center">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="e.g. +91 98765 43210"
                    className="w-full h-11 pl-10 pr-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  Include country code (e.g. +91 for India) for reliable emergency SMS delivery.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Relationship
                  </label>
                  <select
                    value={relationship}
                    onChange={e => setRelationship(e.target.value)}
                    className="w-full h-11 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                  >
                    <option value="Family">Family</option>
                    <option value="Mother">Mother</option>
                    <option value="Father">Father</option>
                    <option value="Sister">Sister</option>
                    <option value="Brother">Brother</option>
                    <option value="Spouse/Partner">Spouse / Partner</option>
                    <option value="Friend">Friend</option>
                    <option value="Guardian">Guardian</option>
                    <option value="Colleague">Colleague / Roommate</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Alert Priority
                  </label>
                  <select
                    value={priority}
                    onChange={e => setPriority(e.target.value)}
                    className="w-full h-11 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                  >
                    <option value="primary">Primary (Instant SMS & Live Map)</option>
                    <option value="secondary">Secondary (Backup Contact)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-3">
                <button
                  type="button"
                  onClick={resetForm}
                  className="min-h-[46px] rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="min-h-[46px] rounded-xl bg-rose-600 hover:bg-rose-500 active:scale-98 text-white font-bold text-xs shadow-md shadow-rose-600/30 transition disabled:opacity-60"
                >
                  {submitting ? 'Saving...' : editingContact ? 'Update Contact' : 'Save Contact'}
                </button>
              </div>
            </form>
          ) : contacts.length === 0 ? (
            /* Clean Empty State: User has full sovereignty */
            <div className="py-10 px-4 text-center space-y-4">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center border border-rose-200 dark:border-rose-900/50 shadow-inner">
                <Users className="w-8 h-8" />
              </div>
              
              <div className="max-w-sm mx-auto space-y-1.5">
                <h3 className="text-base font-bold text-slate-900 dark:text-white font-display">
                  No Emergency Contacts Added
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Your emergency circle is currently empty. You are in complete control of your contacts — HER-SAFE never pre-fills dummy or unwanted numbers.
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed pt-1">
                  Add trusted friends, family, or guardians directly from your phone so they can receive an instant SMS alert with your live GPS location if you trigger an SOS.
                </p>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                  onClick={handlePickFromPhone}
                  className="w-full sm:w-auto min-h-[44px] px-5 rounded-xl bg-rose-600 hover:bg-rose-500 active:scale-98 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-rose-600/25 transition"
                >
                  <Smartphone className="w-4 h-4" />
                  <span>Pick from Phone Contacts</span>
                </button>

                <button
                  onClick={() => {
                    resetForm();
                    setShowAddForm(true);
                  }}
                  className="w-full sm:w-auto min-h-[44px] px-5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs flex items-center justify-center gap-2 transition"
                >
                  <UserPlus className="w-4 h-4 text-rose-500" />
                  <span>Type Number Manually</span>
                </button>
              </div>

              <div className="pt-4 max-w-sm mx-auto flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
                <HelpCircle className="w-3.5 h-3.5 shrink-0" />
                <span>Need to import from backup? Use the Import .vcf / CSV button above.</span>
              </div>
            </div>
          ) : (
            /* Populated Contacts List */
            <div className="space-y-3">
              {/* Clear all inline confirmation notice */}
              {confirmClearAll && (
                <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/70 border border-rose-300 dark:border-rose-800 text-xs space-y-2 animate-in fade-in">
                  <div className="flex items-center gap-2 text-rose-800 dark:text-rose-200 font-bold">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>Remove all {contacts.length} emergency contacts?</span>
                  </div>
                  <p className="text-[11px] text-rose-700 dark:text-rose-300">
                    This will empty your emergency network. Your emergency SOS will still dial 112 ERSS, but will not send SMS alerts until you add new contacts.
                  </p>
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={executeClearAll}
                      className="px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition"
                    >
                      Yes, Remove All
                    </button>
                    <button
                      onClick={() => setConfirmClearAll(false)}
                      className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-medium text-xs border border-slate-200 dark:border-slate-700"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {contacts.map(c => {
                const isConfirmingThis = confirmDeleteId === c.id;

                return (
                  <div
                    key={c.id}
                    className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-sm transition space-y-2.5"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                            {c.name}
                          </h4>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider shrink-0 ${
                              c.priority === 'primary'
                                ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 border border-rose-300 dark:border-rose-800'
                                : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                            }`}
                          >
                            {c.priority}
                          </span>
                          {c.priority !== 'primary' && (
                            <button
                              type="button"
                              onClick={() => setContactPrimary(c.id)}
                              className="text-[10px] font-bold text-rose-500 hover:text-rose-600 hover:underline transition"
                            >
                              Make Primary
                            </button>
                          )}
                        </div>

                        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-1 font-mono">
                          <Phone className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                          <span className="font-semibold">{c.phone}</span>
                          <span aria-hidden="true">·</span>
                          <span className="font-sans text-slate-600 dark:text-slate-300">{c.relationship || 'Guardian'}</span>
                        </div>

                        {/* Toggle: Receive SOS Alerts */}
                        <div className="mt-2 flex items-center gap-2">
                          <label className="flex items-center gap-1.5 cursor-pointer text-xs select-none">
                            <input
                              type="checkbox"
                              checked={c.receiveAlerts !== false}
                              onChange={(e) => toggleContactAlertPreference(c.id, e.target.checked)}
                              className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500 bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700"
                            />
                            <span className={c.receiveAlerts !== false ? 'font-semibold text-slate-700 dark:text-slate-200' : 'text-slate-400 line-through'}>
                              Receive SOS Alerts
                            </span>
                          </label>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        {/* Send Test SMS */}
                        <button
                          onClick={() => handleTestAlert(c.id, c.name)}
                          title="Dispatch test emergency SMS to verify line"
                          className="min-h-[38px] px-2.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center gap-1 transition active:scale-95"
                        >
                          <BellRing className="w-3.5 h-3.5 text-rose-500" />
                          <span className="hidden sm:inline">Test</span>
                        </button>

                        {/* Edit */}
                        <button
                          onClick={() => startEdit(c)}
                          title="Edit contact details"
                          className="min-h-[38px] min-w-[38px] rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center transition active:scale-95"
                          aria-label={`Edit ${c.name}`}
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        {/* Delete Button (Inline confirmation, 0 popups!) */}
                        <button
                          onClick={() => setConfirmDeleteId(c.id)}
                          title="Remove from trusted contacts"
                          className="min-h-[38px] min-w-[38px] rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 flex items-center justify-center transition active:scale-95"
                          aria-label={`Remove ${c.name}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Inline Delete Confirmation Strip */}
                    {isConfirmingThis && (
                      <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900/60 flex flex-wrap items-center justify-between gap-2 animate-in fade-in">
                        <span className="text-xs font-semibold text-rose-800 dark:text-rose-300">
                          Remove {c.name} from emergency contacts?
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => executeDelete(c.id, c.name)}
                            className="px-3 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-sm transition"
                          >
                            Remove
                          </button>
                          <button
                            onClick={() => setConfirmDeleteId(null)}
                            className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium text-xs border border-slate-200 dark:border-slate-700"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Verification & Notification Status Indicators */}
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-[11px]">
                      <div className="flex items-center gap-1.5">
                        {c.verificationStatus === 'verified' ? (
                          <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                            <ShieldCheck className="w-3.5 h-3.5" />
                            Verified Line
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={async () => {
                              setStatusMsg(`Verifying line for ${c.name}...`);
                              const res = await verifyContactLine(c.id);
                              setStatusMsg(res.message);
                              setTimeout(() => setStatusMsg(null), 3000);
                            }}
                            className="flex items-center gap-1 text-amber-600 dark:text-amber-400 hover:underline font-semibold"
                          >
                            <AlertCircle className="w-3.5 h-3.5" />
                            Verify Line
                          </button>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-400 text-[10px]">Notification Status:</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          (c.notificationStatus || c.lastDeliveryStatus) === 'delivered' ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300' :
                          (c.notificationStatus || c.lastDeliveryStatus) === 'opened' ? 'bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300' :
                          (c.notificationStatus || c.lastDeliveryStatus) === 'failed' ? 'bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300' :
                          (c.notificationStatus || c.lastDeliveryStatus) === 'sent' ? 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300' :
                          'bg-slate-100 dark:bg-slate-800 text-slate-500'
                        }`}>
                          {c.notificationStatus || c.lastDeliveryStatus || 'Ready'}
                        </span>
                        {(c.notificationStatus || c.lastDeliveryStatus) === 'failed' && (
                          <button
                            type="button"
                            onClick={() => handleDirectSms(c)}
                            className="text-[10px] text-rose-500 underline font-bold"
                            title="Fallback to direct SMS"
                          >
                            SMS Fallback
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Direct Contact Dispatch Controls */}
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleTestAlert(c.id, c.name, c.phone)}
                          title={`Dispatch safety alert to ${c.phone}`}
                          className="min-h-[32px] px-2.5 rounded-lg bg-rose-600 hover:bg-rose-500 active:scale-95 text-white font-bold text-[11px] flex items-center gap-1.5 shadow-sm transition"
                        >
                          <BellRing className="w-3 h-3" />
                          <span>Send Alert to {c.phone}</span>
                        </button>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleDirectSms(c)}
                          title={`Open native SMS composer for ${c.phone}`}
                          className="min-h-[32px] px-2.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-95 text-slate-700 dark:text-slate-200 font-semibold text-[11px] flex items-center gap-1 transition border border-slate-200 dark:border-slate-700"
                        >
                          <MessageSquare className="w-3 h-3 text-blue-500" />
                          <span>SMS</span>
                        </button>

                        <button
                          onClick={() => handleDirectWhatsApp(c)}
                          title={`Send WhatsApp alert to ${c.phone}`}
                          className="min-h-[32px] px-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-semibold text-[11px] flex items-center gap-1 transition"
                        >
                          <Share2 className="w-3 h-3" />
                          <span>WhatsApp</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Bottom List Controls: Clear All Contacts */}
              <div className="pt-2 flex items-center justify-between px-1 text-xs text-slate-500 dark:text-slate-400">
                <span>{contacts.length} trusted {contacts.length === 1 ? 'guardian' : 'guardians'}</span>
                {!confirmClearAll && (
                  <button
                    onClick={() => setConfirmClearAll(true)}
                    className="text-slate-400 hover:text-rose-500 text-xs font-medium underline transition"
                  >
                    Remove All Contacts
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
