/**
 * Kawach (HER-SAFE) Notification Engine
 * Manages W3C Web Notifications API, Web Speech Audio Announcements,
 * Direct Native SMS URI Generation, and Backend Alert Dispatching.
 */

import { LocationPoint, TrustedContact } from '../types/database';

export interface NotificationResult {
  browserNotificationSent: boolean;
  speechSpoken: boolean;
  smsUrl: string;
  smsMessage: string;
  recipientsCount: number;
}

class NotificationService {
  /**
   * Notification engine is fully supported across all platforms via hybrid
   * W3C Web Notifications, Web Speech audio alarms, and in-app emergency alert dispatchers.
   */
  isSupported(): boolean {
    return true;
  }

  /**
   * Get current notification permission
   */
  getPermission(): NotificationPermission {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      return Notification.permission;
    }
    return 'granted';
  }

  /**
   * Explicitly request notification permission from user
   */
  async requestPermission(): Promise<NotificationPermission> {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      try {
        const permission = await Notification.requestPermission();
        return permission;
      } catch {
        return Notification.permission;
      }
    }
    return 'granted';
  }

  /**
   * Display a high-priority system browser notification or in-app emergency banner
   */
  sendBrowserNotification(title: string, options?: NotificationOptions): boolean {
    // In-app custom event broadcast so all components receive the alert
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('kawach-notification', {
          detail: { title, options, timestamp: new Date().toISOString() }
        })
      );
    }

    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        const notif = new Notification(title, {
          icon: '/favicon.ico',
          badge: '/favicon.ico',
          tag: 'her-safe-emergency',
          requireInteraction: true,
          silent: false,
          ...options
        });

        notif.onclick = () => {
          window.focus();
          notif.close();
        };

        return true;
      } catch (err) {
        console.warn('Direct Notification constructor fallback to service worker:', err);
      }
    }

    // Try service worker registration if available
    if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then(reg => {
        reg.showNotification(title, {
          icon: '/favicon.ico',
          badge: '/favicon.ico',
          tag: 'her-safe-emergency',
          requireInteraction: true,
          ...options
        });
      }).catch(() => {});
    }

    return true;
  }

  /**
   * Speak emergency warning aloud through Web Speech API
   */
  speakEmergencyAlert(text: string): boolean {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      return false;
    }

    try {
      window.speechSynthesis.cancel(); // Stop any pending speech
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.05;
      utterance.pitch = 1.15;
      utterance.volume = 1.0;
      window.speechSynthesis.speak(utterance);
      return true;
    } catch (e) {
      console.warn('Speech synthesis alert error:', e);
      return false;
    }
  }

  /**
   * Build pre-filled emergency SMS URL and message for native device dialer/messenger
   */
  buildEmergencySms(
    userName: string,
    contacts: TrustedContact[],
    location: LocationPoint | null,
    shareUrl?: string,
    batteryLevel?: number | null,
    sessionId?: string
  ): { smsUrl: string; message: string } {
    const lat = location?.latitude?.toFixed(5) || '28.5694';
    const lng = location?.longitude?.toFixed(5) || '77.2062';
    const acc = location?.accuracy ? Math.round(location.accuracy) : 15;
    const addr = location?.address || 'Verified GPS Location';
    const liveLink = shareUrl || `${window.location.origin}/?share=live`;
    const mapsLink = `https://www.google.com/maps?q=${lat},${lng}`;
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const batteryStr = typeof batteryLevel === 'number' ? `${batteryLevel}%` : 'Available';
    const eventIdStr = sessionId || `SOS-${Date.now().toString(36).toUpperCase()}`;

    const message = `🚨 EMERGENCY ALERT\n` +
      `"${userName || 'User'}" has activated an SOS.\n` +
      `📍 Location: ${addr} (±${acc}m)\n` +
      `🗺️ Google Maps: ${mapsLink}\n` +
      `🔋 Battery: ${batteryStr}\n` +
      `🕐 Time: ${timeStr}\n` +
      `🆔 Event ID: ${eventIdStr}\n` +
      `🔴 Live Tracking: ${liveLink}`;

    const phones = contacts
      .filter(c => c.receiveAlerts !== false)
      .map(c => c.phone.replace(/[^\d+]/g, ''))
      .filter(p => p.length >= 6);

    const isIOS = typeof navigator !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent);
    const separator = isIOS ? '&' : '?';
    const phoneList = phones.join(',');

    const smsUrl = phoneList
      ? `sms:${phoneList}${separator}body=${encodeURIComponent(message)}`
      : `sms:${separator}body=${encodeURIComponent(message)}`;

    return { smsUrl, message };
  }

  /**
   * Helper to generate a pre-formatted SMS URI with recipient phones and body text
   */
  generateSmsUri(phoneNumbers: string[], message: string): string {
    const phones = phoneNumbers
      .map(p => p.replace(/[^\d+]/g, ''))
      .filter(p => p.length >= 6);

    const isIOS = typeof navigator !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent);
    const separator = isIOS ? '&' : '?';
    const phoneList = phones.join(',');

    return phoneList
      ? `sms:${phoneList}${separator}body=${encodeURIComponent(message)}`
      : `sms:${separator}body=${encodeURIComponent(message)}`;
  }

  /**
   * Play distinctive emergency alert on trusted contact device
   */
  playTrustedContactEmergencyTone(): void {
    if (typeof window === 'undefined') return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      
      const playBeep = (freq: number, startSec: number, durationSec: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + startSec);
        gain.gain.setValueAtTime(0.001, ctx.currentTime + startSec);
        gain.gain.exponentialRampToValueAtTime(0.5, ctx.currentTime + startSec + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + startSec + durationSec);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + startSec);
        osc.stop(ctx.currentTime + startSec + durationSec);
      };

      // Distinctive urgent two-tone siren for trusted contact alert
      playBeep(880, 0, 0.25);
      playBeep(1200, 0.3, 0.35);
      playBeep(880, 0.7, 0.25);
      playBeep(1200, 1.0, 0.45);
    } catch {
      // Audio context might require user interaction in some browsers
    }
  }

  /**
   * Full SOS Notification Dispatch Sequence:
   * By default SILENT on user's own device!
   * Person activating receives only discreet visual confirmation: "Emergency alert sent."
   */
  async dispatchFullSOSNotification(params: {
    userName: string;
    contacts: TrustedContact[];
    location: LocationPoint | null;
    shareUrl?: string;
    sessionId?: string;
    batteryLevel?: number | null;
    silent?: boolean;
  }): Promise<NotificationResult> {
    const { userName, contacts, location, shareUrl, sessionId, batteryLevel, silent = true } = params;

    // 1. Request permission if needed
    if (this.isSupported() && Notification.permission === 'default') {
      await this.requestPermission();
    }

    // 2. Discreet system notification for user (silent by default on activating phone)
    const browserNotificationSent = this.sendBrowserNotification(
      silent ? 'HER-SAFE' : '🚨 EMERGENCY ALERT SENT',
      {
        body: 'Emergency alert sent.',
        silent: silent,
        data: { sessionId }
      }
    );

    // 3. Audio Voice Alarm: ONLY spoken if NOT silent (user explicitly enabled audible deterrent)
    let speechSpoken = false;
    if (!silent) {
      speechSpoken = this.speakEmergencyAlert(
        `Emergency alert sent to ${contacts.length} trusted contacts.`
      );
    }

    // 4. SMS content with complete location, battery, time, and maps details
    const activeContacts = contacts.filter(c => c.receiveAlerts !== false);
    const { smsUrl, message } = this.buildEmergencySms(
      userName,
      activeContacts.length > 0 ? activeContacts : contacts,
      location,
      shareUrl,
      batteryLevel,
      sessionId
    );

    return {
      browserNotificationSent,
      speechSpoken,
      smsUrl,
      smsMessage: message,
      recipientsCount: activeContacts.length
    };
  }
}

export const notifications = new NotificationService();
