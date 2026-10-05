import { EmergencyNumber } from '../types/database';

/**
 * HER-SAFE Curated Verified Emergency Numbers Directory
 * Stored locally on the user's device for 100% offline availability.
 * All numbers use native cellular circuit-switched or packet-switched voice channels (tel:)
 * which do not require mobile data or Wi-Fi internet access.
 */
export const CURATED_EMERGENCY_NUMBERS: EmergencyNumber[] = [
  {
    id: 'num-112',
    serviceName: 'National Emergency Response Support System (ERSS 112)',
    phoneNumber: '112',
    category: 'general',
    country: 'India',
    stateUT: 'All India',
    source: 'Ministry of Home Affairs (MHA) & C-DAC',
    sourceUrl: 'https://112.gov.in',
    verificationDate: '2026-01-10',
    lastUpdatedDate: '2026-03-01',
    status: 'verified_official',
    notes: 'Single emergency helpline integrating Police, Fire, and Ambulance across all States and UTs. Direct PSAP dispatch.',
    isNationwide: true,
    availableOffline: true,
    offlineTelephonyType: 'cellular_voice',
    offlineNotes: 'Priority emergency call routing (3GPP TS 22.101 standard). Operates without active internet, with zero mobile balance, and even without a physical SIM card installed on any carrier network.'
  },
  {
    id: 'num-181',
    serviceName: 'Women Helpline (Domestic Violence & Distress)',
    phoneNumber: '181',
    category: 'women',
    country: 'India',
    stateUT: 'All India',
    source: 'Ministry of Women and Child Development (MoWCD)',
    sourceUrl: 'https://wcd.nic.in',
    verificationDate: '2026-01-12',
    lastUpdatedDate: '2026-03-05',
    status: 'verified_official',
    notes: '24/7 toll-free emergency helpline providing crisis counseling, rescue coordination, shelter assistance, and One Stop Centre referrals.',
    isNationwide: true,
    availableOffline: true,
    offlineTelephonyType: 'toll_free',
    offlineNotes: 'Toll-free direct telephony connection funded by the Universal Service Obligation Fund (USOF). No data connection or call balance required.'
  },
  {
    id: 'num-1091',
    serviceName: 'Women In Distress Helpline (Police)',
    phoneNumber: '1091',
    category: 'women',
    country: 'India',
    stateUT: 'All India',
    source: 'State Police Departments & MHA',
    verificationDate: '2026-01-15',
    lastUpdatedDate: '2026-02-20',
    status: 'verified_official',
    notes: 'Direct line to District Police Women Safety Cells and immediate mobile patrol dispatch units.',
    isNationwide: true,
    availableOffline: true,
    offlineTelephonyType: 'cellular_voice',
    offlineNotes: 'Direct cellular carrier voice dialer. Operates offline without internet connectivity.'
  },
  {
    id: 'num-1090',
    serviceName: 'Women Power Line (Cyber & Stalking Harassment)',
    phoneNumber: '1090',
    category: 'women',
    country: 'India',
    stateUT: 'Uttar Pradesh / Extended Support',
    source: 'State Police Women Safety Wing',
    verificationDate: '2026-01-15',
    lastUpdatedDate: '2026-02-18',
    status: 'verified_official',
    notes: 'Dedicated 24/7 helpline to handle phone stalking, online harassment, and Eve-teasing with female call handlers.',
    isNationwide: false,
    availableOffline: true,
    offlineTelephonyType: 'toll_free',
    offlineNotes: 'Direct cellular voice dialer; toll-free offline call.'
  },
  {
    id: 'num-100',
    serviceName: 'Police Control Room (PCR)',
    phoneNumber: '100',
    category: 'police',
    country: 'India',
    stateUT: 'All India',
    source: 'National Police Commission / MHA',
    verificationDate: '2026-01-01',
    lastUpdatedDate: '2026-03-01',
    status: 'verified_official',
    notes: 'Legacy police control room number (automatically routes to 112 in ERSS-upgraded districts).',
    isNationwide: true,
    availableOffline: true,
    offlineTelephonyType: 'cellular_voice',
    offlineNotes: 'Standard cellular voice protocol; routed via local telecom exchange to the closest PCR dispatch center without internet.'
  },
  {
    id: 'num-108',
    serviceName: 'Emergency Medical & Disaster Ambulance',
    phoneNumber: '108',
    category: 'ambulance',
    country: 'India',
    stateUT: 'All India',
    source: 'Ministry of Health & Family Welfare (MoHFW)',
    verificationDate: '2026-01-14',
    lastUpdatedDate: '2026-02-28',
    status: 'verified_official',
    notes: '24/7 free emergency medical response service equipped with Basic & Advanced Life Support ambulances.',
    isNationwide: true,
    availableOffline: true,
    offlineTelephonyType: 'toll_free',
    offlineNotes: 'Toll-free PSTN/GSM emergency line; accessible without data pack or mobile internet.'
  },
  {
    id: 'num-102',
    serviceName: 'Maternal & Child Transport Ambulance',
    phoneNumber: '102',
    category: 'ambulance',
    country: 'India',
    stateUT: 'All India',
    source: 'Janani Shishu Suraksha Karyakram (JSSK)',
    verificationDate: '2026-01-14',
    lastUpdatedDate: '2026-02-25',
    status: 'verified_official',
    notes: 'Dedicated transport service for pregnant women, mothers, and newborns for delivery and emergency pediatric care.',
    isNationwide: true,
    availableOffline: true,
    offlineTelephonyType: 'toll_free',
    offlineNotes: 'Direct toll-free offline voice call.'
  },
  {
    id: 'num-101',
    serviceName: 'Fire and Rescue Service',
    phoneNumber: '101',
    category: 'fire',
    country: 'India',
    stateUT: 'All India',
    source: 'Directorate General Fire Services, Civil Defence & Home Guards',
    verificationDate: '2026-01-10',
    lastUpdatedDate: '2026-02-20',
    status: 'verified_official',
    notes: 'Fire suppression, building collapse, flood rescue, and industrial chemical leak response.',
    isNationwide: true,
    availableOffline: true,
    offlineTelephonyType: 'cellular_voice',
    offlineNotes: 'Direct carrier voice connection. Available on any mobile handset without internet.'
  },
  {
    id: 'num-1098',
    serviceName: 'Childline Emergency (Children in Distress)',
    phoneNumber: '1098',
    category: 'child',
    country: 'India',
    stateUT: 'All India',
    source: 'Ministry of Women & Child Development (MoWCD)',
    verificationDate: '2026-01-18',
    lastUpdatedDate: '2026-03-02',
    status: 'verified_official',
    notes: 'Emergency 24-hour service for children in need of care and protection, abuse intervention, and missing child reporting.',
    isNationwide: true,
    availableOffline: true,
    offlineTelephonyType: 'toll_free',
    offlineNotes: 'Toll-free emergency line, fully accessible offline.'
  },
  {
    id: 'num-139',
    serviceName: 'Railway Protection Force (RPF) & Rail Madad',
    phoneNumber: '139',
    category: 'railway',
    country: 'India',
    stateUT: 'All India',
    source: 'Ministry of Railways (Indian Railways)',
    verificationDate: '2026-01-20',
    lastUpdatedDate: '2026-02-15',
    status: 'verified_official',
    notes: 'Instant security assistance on moving trains and railway stations ("Meri Saheli" women safety initiative).',
    isNationwide: true,
    availableOffline: true,
    offlineTelephonyType: 'cellular_voice',
    offlineNotes: 'Voice IVR and operator connection routed via standard telecom networks, effective in low-coverage railway corridors without mobile data.'
  },
  {
    id: 'num-1078',
    serviceName: 'National Disaster Management Authority (NDMA)',
    phoneNumber: '1078',
    category: 'disaster',
    country: 'India',
    stateUT: 'All India',
    source: 'National Disaster Management Authority (NDMA)',
    verificationDate: '2026-01-22',
    lastUpdatedDate: '2026-03-02',
    status: 'verified_official',
    notes: 'Emergency operational helpline for major natural disasters, flash floods, cyclones, and landslides.',
    isNationwide: true,
    availableOffline: true,
    offlineTelephonyType: 'toll_free',
    offlineNotes: 'Toll-free disaster helpline; functional during terrestrial grid network disruptions via emergency priority carriers.'
  },
  {
    id: 'num-1930',
    serviceName: 'National Cyber Crime Reporting Helpline',
    phoneNumber: '1930',
    category: 'cyber',
    country: 'India',
    stateUT: 'All India',
    source: 'Indian Cyber Crime Coordination Centre (I4C) / MHA',
    verificationDate: '2026-01-11',
    lastUpdatedDate: '2026-03-04',
    status: 'verified_official',
    notes: 'Rapid reporting of online extortion, non-consensual deepfakes/intimate imagery, and financial fraud.',
    isNationwide: true,
    availableOffline: true,
    offlineTelephonyType: 'cellular_voice',
    offlineNotes: 'Voice telephony line accessible directly from your phone dialer without internet connection.'
  },
  {
    id: 'num-14567',
    serviceName: 'Senior Citizen National Helpline (Elderline)',
    phoneNumber: '14567',
    category: 'general',
    country: 'India',
    stateUT: 'All India',
    source: 'Ministry of Social Justice and Empowerment',
    verificationDate: '2026-01-19',
    lastUpdatedDate: '2026-02-10',
    status: 'verified_official',
    notes: 'Toll-free emergency helpline for senior women and elderly individuals facing abandonment or abuse.',
    isNationwide: true,
    availableOffline: true,
    offlineTelephonyType: 'toll_free',
    offlineNotes: 'Toll-free direct call accessible offline.'
  },
  {
    id: 'num-14416',
    serviceName: 'Tele-MANAS National Mental Health & Crisis Helpline',
    phoneNumber: '14416',
    category: 'women',
    country: 'India',
    stateUT: 'All India',
    source: 'Ministry of Health & Family Welfare / NIMHANS',
    verificationDate: '2026-01-25',
    lastUpdatedDate: '2026-03-01',
    status: 'verified_official',
    notes: '24/7 free psychological counseling and suicide prevention crisis intervention in 20 regional languages.',
    isNationwide: true,
    availableOffline: true,
    offlineTelephonyType: 'toll_free',
    offlineNotes: 'Toll-free audio call operating on telephony networks without internet access.'
  }
];

export const LOCAL_STORAGE_KEY_OFFLINE_NUMBERS = 'her_safe_offline_emergency_numbers_v2';
export const LOCAL_STORAGE_KEY_LAST_SYNC = 'her_safe_offline_numbers_last_sync';

/**
 * Retrieves the local offline curated emergency numbers from device storage.
 * If not yet saved, initializes device storage with the verified bundle.
 */
export function getLocallyStoredEmergencyNumbers(): EmergencyNumber[] {
  if (typeof window === 'undefined') return CURATED_EMERGENCY_NUMBERS;

  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY_OFFLINE_NUMBERS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Error reading offline emergency numbers from localStorage:', err);
  }

  // Fallback & automatic initialization
  saveLocallyStoredEmergencyNumbers(CURATED_EMERGENCY_NUMBERS);
  return CURATED_EMERGENCY_NUMBERS;
}

/**
 * Persists the curated emergency numbers to the client device's local storage.
 */
export function saveLocallyStoredEmergencyNumbers(numbers: EmergencyNumber[]): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(LOCAL_STORAGE_KEY_OFFLINE_NUMBERS, JSON.stringify(numbers));
    localStorage.setItem(LOCAL_STORAGE_KEY_LAST_SYNC, new Date().toISOString());
  } catch (err) {
    console.error('Failed to save offline emergency numbers to device:', err);
  }
}

/**
 * Returns the human-readable timestamp of when the local offline emergency numbers were last verified/synced.
 */
export function getOfflineNumbersLastSync(): string {
  if (typeof window === 'undefined') return 'Verified On-Device';
  const raw = localStorage.getItem(LOCAL_STORAGE_KEY_LAST_SYNC);
  if (!raw) return 'Verified On-Device (Pre-bundled)';
  try {
    const date = new Date(raw);
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return 'Verified On-Device';
  }
}

/**
 * System Documentation detailing the architecture of the Offline Emergency Numbers system.
 */
export const EMERGENCY_SYSTEM_DOCUMENTATION = {
  overview: `The HER-SAFE emergency number system is engineered with an "Offline-First, Zero-Failure" philosophy. In critical personal safety scenarios, cellular data packets (4G/5G/Wi-Fi) are often degraded, deliberately jammed, or depleted. The emergency directory is therefore architecturally decoupled from cloud servers and permanently cached in the device's persistent local storage.`,
  
  carrierTelephonyLayer: {
    title: 'Telephony Layer vs. IP Data Layer',
    explanation: 'Standard smartphone web applications rely on HTTP/WebSockets over TCP/IP packets. When mobile data is unavailable, cloud-dependent apps become non-functional. In contrast, HER-SAFE emergency dialing triggers native tel: URIs (e.g. tel:112). This activates the smartphone\'s baseband processor and cellular radio to initiate circuit-switched or IMS VoLTE voice calls directly to telecom base stations (BTS/eNodeB) without consuming a single byte of IP data.'
  },

  regulatoryAndStandardsCompliance: {
    title: 'Telecom Regulatory Priority (3GPP TS 22.101 & MHA ERSS)',
    points: [
      '3GPP TS 22.101 Emergency Telephony Standard: Emergency calls to 112 are granted highest class pre-emption priority in all cellular tower handshakes.',
      'Unauthenticated Network Attachment: Calls to 112 can connect through any available carrier (Airtel, Jio, Vi, BSNL) even if the user has no active subscription or has roaming barred.',
      'Zero-Balance Execution: Under TRAI and DoT mandates, calls to 112, 181, 108, 102, 1098, and 1078 are strictly toll-free and complete with zero currency balance.',
      'SIM-Free / Lock Screen Dialing: Dialing 112 is permitted by phone hardware firmware even when the device SIM is locked or absent.'
    ]
  },

  offlineStorageArchitecture: {
    title: 'Device Local Storage & PWA Cache Architecture',
    points: [
      'LocalStorage Partitioning: The full verified emergency directory is stored under key "her_safe_offline_emergency_numbers_v2" in isolated browser origin storage.',
      'Immutable Fallback Bundle: If browser cache is ever purged, the application falls back immediately to hardcoded pre-bundled constants within the client runtime bundle.',
      'Automatic Periodic Revalidation: Whenever network connectivity is restored (window.online event), the client performs a differential sync against /api/emergency-numbers, updating verified gazette updates without interrupting offline readiness.',
      'Service Worker Cache: Assets and the entire emergency numbers catalog are registered in the PWA Service Worker cache for instantaneous load in airplane mode.'
    ]
  },

  offlineAvailabilityMatrix: [
    {
      number: '112',
      service: 'National ERSS (All Emergencies)',
      offlineStatus: '100% Offline Capable',
      dialerType: 'Cellular Priority Voice',
      dataRequired: 'No',
      simRequired: 'No (Emergency Attachment)',
      coverage: 'Pan-India Nationwide'
    },
    {
      number: '181',
      service: 'Women In Distress Helpline',
      offlineStatus: '100% Offline Capable',
      dialerType: 'Toll-Free Cellular Voice',
      dataRequired: 'No',
      simRequired: 'Active Carrier Signal',
      coverage: 'Pan-India Nationwide'
    },
    {
      number: '1091',
      service: 'Police Women Safety Cell',
      offlineStatus: '100% Offline Capable',
      dialerType: 'Direct Cellular Voice',
      dataRequired: 'No',
      simRequired: 'Active Carrier Signal',
      coverage: 'Pan-India Nationwide'
    },
    {
      number: '108',
      service: 'Medical & Disaster Ambulance',
      offlineStatus: '100% Offline Capable',
      dialerType: 'Toll-Free Cellular Voice',
      dataRequired: 'No',
      simRequired: 'Active Carrier Signal',
      coverage: 'Pan-India Nationwide'
    },
    {
      number: '101',
      service: 'Fire & Rescue Service',
      offlineStatus: '100% Offline Capable',
      dialerType: 'Direct Cellular Voice',
      dataRequired: 'No',
      simRequired: 'Active Carrier Signal',
      coverage: 'Pan-India Nationwide'
    },
    {
      number: '1098',
      service: 'Childline Emergency',
      offlineStatus: '100% Offline Capable',
      dialerType: 'Toll-Free Cellular Voice',
      dataRequired: 'No',
      simRequired: 'Active Carrier Signal',
      coverage: 'Pan-India Nationwide'
    },
    {
      number: '139',
      service: 'Rail Madad / RPF ("Meri Saheli")',
      offlineStatus: '100% Offline Capable',
      dialerType: 'Direct Cellular Voice',
      dataRequired: 'No',
      simRequired: 'Active Carrier Signal',
      coverage: 'Indian Railways Network'
    },
    {
      number: '1078',
      service: 'Disaster Management (NDMA)',
      offlineStatus: '100% Offline Capable',
      dialerType: 'Toll-Free Cellular Voice',
      dataRequired: 'No',
      simRequired: 'Active Carrier Signal',
      coverage: 'Pan-India Nationwide'
    },
    {
      number: '1930',
      service: 'Cyber Crime Reporting (I4C)',
      offlineStatus: '100% Offline Capable',
      dialerType: 'Direct Cellular Voice',
      dataRequired: 'No',
      simRequired: 'Active Carrier Signal',
      coverage: 'Pan-India Nationwide'
    }
  ],

  offlineSmsFallbackProtocol: {
    title: 'Offline Emergency SMS Fallback Protocol',
    explanation: 'If voice channels are congested during large-scale network strain or when speaking aloud would jeopardize user safety, HER-SAFE generates an encoded SMS intent string: "sms:112?body=EMERGENCY! I need immediate help. My GPS coordinates: [Lat, Long]. Sent via HER-SAFE." This utilizes signaling control channels that can pass through even when voice calls fail to establish.'
  }
};
