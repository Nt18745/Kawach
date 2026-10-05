import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { api, triggerHaptic } from '../../services/api';
import { notifications } from '../../services/notifications';
import {
  Sparkles,
  Send,
  X,
  Shield,
  PhoneCall,
  MapPin,
  AlertTriangle,
  UserCheck,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  Bot,
  MessageSquare,
  Share2,
  Bell,
  Volume2
} from 'lucide-react';

interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: string;
  groundingChunks?: any[];
  model?: string;
  emergencyAction?: {
    type: 'sos_dispatched' | 'test_alert';
    smsUrl?: string;
    whatsappUrl?: string;
    shareUrl?: string;
    contactCount: number;
    userName?: string;
  };
}

export const AIChatModal: React.FC = () => {
  const {
    t,
    user,
    contacts,
    currentLocation,
    batteryLevel,
    isOnline,
    activeSOS,
    activeTimer,
    activeJourney,
    setActiveModal,
    triggerSOSInitiation,
    dispatchEmergencyAlert
  } = useApp();

  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    return [
      {
        id: 'msg-welcome',
        role: 'model',
        content: `Hello ${user?.name || 'there'}! I am your **Kawach AI Safety Guardian** 🛡️.\n\nI have real-time access to your safety preferences, **${contacts.length} trusted contacts**, emergency profile (Blood group: **${user?.bloodGroup || 'O+'}**), and your live GPS location.\n\nHow can I help keep you safe right now? You can also say **"Send SOS notification"** or ask for assistance.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ];
  });

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const quickPrompts = [
    { label: '🚨 Send SOS Alert Notification to all contacts', text: 'Send SOS notification to all my emergency contacts now' },
    { label: '🔔 Test emergency alert & notifications', text: 'Test emergency alert notification system' },
    { label: '🚨 I feel unsafe / someone following me', text: 'I feel unsafe and think someone is following me. What should I do right now?' },
    { label: '📍 Nearest Sakhi Centre or Police Station', text: 'Find the nearest Sakhi One-Stop Centre and 24/7 Police Station near my location.' },
    { label: '🛡️ Check my emergency circle & readiness', text: 'Check my emergency preparedness, contacts, and safety settings.' }
  ];

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || input).trim();
    if (!query || isLoading) return;

    triggerHaptic(30);
    setInput('');

    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      role: 'user',
      content: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    setIsLoading(true);

    // Check if the user specifically asked to send an SOS, emergency alert, or notification
    const isSosIntent = /(sos|emergency|help me|danger|save me|bachao|send notification|notify contacts|alert contacts|alert my contacts|test emergency alert|test alert|test notification|dispatch alert)/i.test(query);

    if (isSosIntent) {
      await dispatchEmergencyAlert(query);

      const shareUrl = `${window.location.origin}/?share=live`;
      const smsBody = encodeURIComponent(
        `EMERGENCY SOS from ${user?.name || 'Kawach User'}! Urgent safety assistance needed. Location: ${currentLocation?.address || 'GPS verified'}. Live tracking: ${shareUrl}`
      );
      const phoneNums = contacts.map(c => c.phone.replace(/[^0-9+]/g, '')).filter(Boolean);
      const smsRecipient = phoneNums.join(',');
      const isApple = typeof navigator !== 'undefined' && /iPad|iPhone|iPod|Macintosh/.test(navigator.userAgent);
      const smsSeparator = isApple ? '&' : '?';
      const smsUrl = `sms:${smsRecipient}${smsSeparator}body=${smsBody}`;
      const whatsappUrl = `https://api.whatsapp.com/send?text=${smsBody}`;

      const alertMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        role: 'model',
        content: `🚨 **EMERGENCY NOTIFICATION DISPATCHED!**\n\nI have immediately triggered system push notifications, synthesized an audible warning alarm, and queued emergency SMS delivery for your **${contacts.length} trusted contacts** and the **112 National ERSS Gateway**.\n\nUse the quick actions below to send directly via SMS or WhatsApp, or connect to emergency responders:`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        emergencyAction: {
          type: 'sos_dispatched',
          smsUrl,
          whatsappUrl,
          shareUrl,
          contactCount: contacts.length,
          userName: user?.name
        }
      };

      setMessages(prev => [...prev, alertMsg]);
      setIsLoading(false);
      return;
    }

    // Prepare live user safety context
    const userContext = {
      name: user?.name || 'Kawach User',
      bloodGroup: user?.bloodGroup || 'O+',
      medicalNotes: user?.emergencyMedicalNotes || '',
      contacts: contacts.map(c => ({
        name: c.name,
        phone: c.phone,
        relationship: c.relationship,
        priority: c.priority
      })),
      location: currentLocation ? {
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        address: currentLocation.address,
        accuracy: currentLocation.accuracy
      } : null,
      batteryLevel: batteryLevel,
      isOnline,
      activeTimer: activeTimer ? {
        destination: activeTimer.destination,
        durationMinutes: activeTimer.durationMinutes
      } : null,
      activeJourney: activeJourney ? {
        destination: activeJourney.destinationName,
        status: activeJourney.status
      } : null,
      voiceSosActive: user?.voiceEmergencyPhrase ? true : false
    };

    try {
      const payloadMessages = newHistory.map(m => ({
        role: m.role,
        content: m.content
      }));

      const res = await api.sendChatMessage(payloadMessages, userContext);

      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        role: 'model',
        content: res.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        groundingChunks: res.groundingChunks,
        model: res.model
      };

      setMessages(prev => [...prev, aiMsg]);
    } catch {
      const fallbackMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        role: 'model',
        content: `I am currently operating in offline mode. If you are in urgent need of assistance, please dial **112** (National ERSS) or tap the red SOS button.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, fallbackMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Kawach AI Safety Guardian"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/80 backdrop-blur-sm animate-fade-in"
    >
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg h-[92vh] max-h-[750px] shadow-2xl flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-rose-600 via-rose-700 to-amber-600 text-white shadow-md">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-white border border-white/20">
              <Sparkles className="w-5 h-5 text-amber-200" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-base font-bold tracking-tight">Kawach AI Guardian</h3>
                <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-emerald-500/30 text-emerald-100 border border-emerald-400/40">
                  Live Guard
                </span>
              </div>
              <p className="text-xs text-rose-100/90">
                Context-aware safety assistant & Google Maps grounding
              </p>
            </div>
          </div>
          <button
            onClick={() => setActiveModal(null)}
            className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition"
            aria-label="Close AI Safety Guardian"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live User Context Bar */}
        <div className="px-4 py-2 bg-slate-100 dark:bg-slate-800/90 border-b border-slate-200 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-300 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <UserCheck className="w-3.5 h-3.5 text-rose-500" />
            <span className="font-semibold text-slate-800 dark:text-slate-200">{user?.name || 'User'}</span>
            <span>·</span>
            <span>Blood: <strong className="text-rose-600 dark:text-rose-400">{user?.bloodGroup || 'O+'}</strong></span>
            <span>·</span>
            <span><strong>{contacts.length}</strong> contacts</span>
          </div>
          <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400 truncate max-w-[200px]">
            <MapPin className="w-3 h-3 text-rose-500 shrink-0" />
            <span className="truncate">{currentLocation?.address || 'GPS Active'}</span>
          </div>
        </div>

        {/* Conversation Thread */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50 dark:bg-slate-950/40">
          {messages.map(msg => (
            <div
              key={msg.id}
              className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div className="flex items-end gap-1.5 max-w-[88%]">
                {msg.role === 'model' && (
                  <div className="w-7 h-7 rounded-lg bg-rose-600/10 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 mb-1 border border-rose-200 dark:border-rose-900/50">
                    <Bot className="w-4 h-4" />
                  </div>
                )}
                <div
                  className={`p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed whitespace-pre-line ${
                    msg.role === 'user'
                      ? 'bg-rose-600 text-white rounded-br-none shadow-sm shadow-rose-600/20'
                      : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-bl-none border border-slate-200 dark:border-slate-700 shadow-sm'
                  }`}
                >
                  {msg.content}

                  {/* Interactive Emergency Action Card */}
                  {msg.emergencyAction && (
                    <div className="mt-3 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/70 border border-rose-200 dark:border-rose-900 space-y-2.5">
                      <div className="flex items-center justify-between text-xs font-bold text-rose-700 dark:text-rose-300">
                        <span className="flex items-center gap-1.5">
                          <AlertTriangle className="w-4 h-4 text-rose-600 animate-pulse" />
                          Alert Dispatched ({msg.emergencyAction.contactCount} Contacts)
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 font-semibold">
                          Active
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                        {msg.emergencyAction.smsUrl && (
                          <a
                            href={msg.emergencyAction.smsUrl}
                            className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-rose-600 text-white font-semibold text-xs hover:bg-rose-700 shadow-sm transition"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            <span>Open SMS App</span>
                          </a>
                        )}

                        {msg.emergencyAction.whatsappUrl && (
                          <a
                            href={msg.emergencyAction.whatsappUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-emerald-600 text-white font-semibold text-xs hover:bg-emerald-700 shadow-sm transition"
                          >
                            <Share2 className="w-3.5 h-3.5" />
                            <span>Share WhatsApp</span>
                          </a>
                        )}

                        <a
                          href="tel:112"
                          className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-slate-900 dark:bg-slate-800 text-white font-semibold text-xs hover:bg-black transition border border-slate-700"
                        >
                          <PhoneCall className="w-3.5 h-3.5 text-rose-400" />
                          <span>Call 112 National ERSS</span>
                        </a>

                        <button
                          onClick={() => {
                            setActiveModal(null);
                            triggerSOSInitiation('ai_chat_modal');
                          }}
                          className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-amber-500 text-white font-semibold text-xs hover:bg-amber-600 shadow-sm transition"
                        >
                          <Shield className="w-3.5 h-3.5" />
                          <span>Full SOS Siren Screen</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Google Maps Grounding Chunks */}
                  {msg.groundingChunks && msg.groundingChunks.length > 0 && (
                    <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-700/80 space-y-1.5">
                      <div className="flex items-center gap-1 text-[11px] font-semibold text-rose-600 dark:text-rose-400">
                        <MapPin className="w-3 h-3" />
                        <span>Google Maps Grounded Locations:</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {msg.groundingChunks.map((chunk, idx) => {
                          const mapsData = chunk.web || chunk.maps;
                          const title = mapsData?.title || 'View Verified Place';
                          const uri = mapsData?.uri || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(title)}`;
                          return (
                            <a
                              key={idx}
                              href={uri}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-700 hover:bg-rose-50 dark:hover:bg-rose-900/30 text-slate-700 dark:text-slate-200 text-[11px] border border-slate-200 dark:border-slate-600 transition"
                            >
                              <span>{title}</span>
                              <ExternalLink className="w-2.5 h-2.5 text-slate-400" />
                            </a>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <span className="text-[10px] text-slate-400 mt-1 px-1">
                {msg.timestamp}
              </span>
            </div>
          ))}

          {isLoading && (
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 pl-8">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-rose-500" />
              <span>Kawach AI is analyzing safety options & maps...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Action Chips */}
        <div className="p-2 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
          <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
            {quickPrompts.map((qp, i) => (
              <button
                key={i}
                onClick={() => handleSendMessage(qp.text)}
                disabled={isLoading}
                className="shrink-0 px-2.5 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/60 hover:text-rose-600 dark:hover:text-rose-400 text-slate-600 dark:text-slate-300 text-[11px] border border-slate-200 dark:border-slate-700 transition"
              >
                {qp.label}
              </button>
            ))}
          </div>
        </div>

        {/* Bottom Input Field */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask Kawach AI for emergency steps, nearby help, safe routes..."
            className="flex-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="min-h-[42px] min-w-[42px] flex items-center justify-center rounded-xl bg-rose-600 text-white disabled:opacity-40 hover:bg-rose-700 transition shadow-sm"
            aria-label="Send message"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>

        {/* Emergency Fast Bar at Bottom */}
        <div className="px-3 py-1.5 bg-rose-50 dark:bg-rose-950/60 border-t border-rose-100 dark:border-rose-900/50 flex items-center justify-between text-[11px]">
          <span className="text-rose-700 dark:text-rose-300 font-medium flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
            In active danger?
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setActiveModal(null);
                triggerSOSInitiation();
              }}
              className="font-bold text-rose-600 dark:text-rose-400 hover:underline"
            >
              TRIGGER SOS
            </button>
            <span>·</span>
            <a
              href="tel:112"
              className="font-bold text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-0.5"
            >
              <PhoneCall className="w-2.5 h-2.5" />
              112
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
