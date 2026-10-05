import React, { useState, useEffect } from 'react';
import { APIProvider } from '@vis.gl/react-google-maps';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/Header';
import { HomeDashboard } from './components/HomeDashboard';
import { ActiveEmergencyScreen } from './components/ActiveEmergencyScreen';
import { OfflineIndicator } from './components/OfflineIndicator';
import { PWAInstallButton } from './components/PWAInstallButton';
import { LiveShareView } from './components/LiveShareView';
import { LoginPage } from './components/LoginPage';
import { EmergencyNotificationBanner } from './components/EmergencyNotificationBanner';

// Modals
import { NearbyHelpModal } from './components/modals/NearbyHelpModal';
import { EmergencyNumbersModal } from './components/modals/EmergencyNumbersModal';
import { TrustedContactsModal } from './components/modals/TrustedContactsModal';
import { SafetyTimerModal } from './components/modals/SafetyTimerModal';
import { SafeJourneyModal } from './components/modals/SafeJourneyModal';
import { MyLocationModal } from './components/modals/MyLocationModal';
import { SettingsModal } from './components/modals/SettingsModal';
import { FakeCallModal } from './components/modals/FakeCallModal';
import { HardwareSosGuideModal } from './components/modals/HardwareSosGuideModal';
import { AdminDashboardModal } from './components/modals/AdminDashboardModal';
import { PrivacyPolicyModal } from './components/modals/PrivacyPolicyModal';
import { AIChatModal } from './components/modals/AIChatModal';
import { EmergencyHistoryModal } from './components/modals/EmergencyHistoryModal';
import { VoiceSosModal } from './components/modals/VoiceSosModal';
import { SmsGatewayModal } from './components/modals/SmsGatewayModal';
import { LiveLocationShareModal } from './components/modals/LiveLocationShareModal';

const GOOGLE_MAPS_API_KEY =
  (import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string) ||
  'AIzaSyBVpLJpt-i95RDx50VBNKr0DDPsJ_nJtGs';

const MainContent: React.FC = () => {
  const { activeSOS, activeModal, setActiveModal, isAuthenticated, triggerSOSInitiation } = useApp();

  if (!isAuthenticated && (!activeSOS || activeSOS.status !== 'active')) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans bg-cyber-mesh relative overflow-hidden">
        <OfflineIndicator />
        <LoginPage onBypassEmergencySOS={() => triggerSOSInitiation('login_bypass')} />
        {activeSOS && activeSOS.status === 'active' && <ActiveEmergencyScreen />}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors bg-cyber-mesh relative">
      <OfflineIndicator />
      <Header />
      <EmergencyNotificationBanner />

      <main className="flex-1 w-full max-w-lg mx-auto pt-2">
        <HomeDashboard />
      </main>

      {/* Critical SOS Active Screen Overlay */}
      {activeSOS && activeSOS.status === 'active' && <ActiveEmergencyScreen />}

      {/* Modals & Dialogs */}
      <NearbyHelpModal />
      <EmergencyNumbersModal />
      <TrustedContactsModal />
      <SafetyTimerModal />
      <SafeJourneyModal />
      <MyLocationModal />
      <SettingsModal />
      <FakeCallModal />
      <HardwareSosGuideModal />
      <AdminDashboardModal />
      <PrivacyPolicyModal />
      <VoiceSosModal />
      {activeModal === 'emergency_history' && (
        <EmergencyHistoryModal onClose={() => setActiveModal(null)} />
      )}
      {activeModal === 'ai_chat' && <AIChatModal />}
      <SmsGatewayModal
        isOpen={activeModal === 'sms_gateway'}
        onClose={() => setActiveModal(null)}
      />

      {/* WhatsApp Live Location Sharing Modal */}
      <LiveLocationShareModal
        isOpen={activeModal === 'whatsapp_live_location' || activeModal === 'live_location'}
        onClose={() => setActiveModal(null)}
      />

      {/* PWA Install Notification */}
      <PWAInstallButton />
    </div>
  );
};

export default function App() {
  const [shareToken, setShareToken] = useState<string | null>(null);
  const [quotaExceeded, setQuotaExceeded] = useState(false);

  useEffect(() => {
    // Check if query parameter has ?share=token or path /share/token
    const params = new URLSearchParams(window.location.search);
    const token = params.get('share');
    if (token) {
      setShareToken(token);
    } else {
      const match = window.location.pathname.match(/\/share\/([a-zA-Z0-9_-]+)/);
      if (match && match[1]) {
        setShareToken(match[1]);
      }
    }

    const quotaHandler = () => setQuotaExceeded(true);
    window.addEventListener('gmp-quota-exceeded', quotaHandler);
    return () => window.removeEventListener('gmp-quota-exceeded', quotaHandler);
  }, []);

  return (
    <APIProvider apiKey={GOOGLE_MAPS_API_KEY}>
      {quotaExceeded && (
        <div className="bg-amber-50 border-b border-amber-200 text-amber-900 px-4 py-2.5 text-xs md:text-sm text-center sticky top-0 z-50 shadow-sm flex items-center justify-between">
          <span className="flex-1">
            Google Maps Platform quota reached. If you are the app owner, visit{' '}
            <a
              href="https://developers.google.com/maps/ai/ai-studio?utm_campaign=gmp_mcp_codeassist_v1_aistudio#quota_exceeded_errors"
              target="_blank"
              rel="noopener noreferrer"
              className="underline font-semibold text-amber-950 hover:text-amber-800"
            >
              maps developer site
            </a>{' '}
            for instructions to update your account.
          </span>
          <button
            onClick={() => setQuotaExceeded(false)}
            className="text-amber-700 hover:text-amber-950 ml-2 font-bold cursor-pointer"
          >
            &times;
          </button>
        </div>
      )}

      {shareToken ? (
        <LiveShareView
          token={shareToken}
          onExit={() => {
            window.history.replaceState({}, '', '/');
            setShareToken(null);
          }}
        />
      ) : (
        <AppProvider>
          <MainContent />
        </AppProvider>
      )}
    </APIProvider>
  );
}
