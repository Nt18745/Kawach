/**
 * Structured Privacy Policy content for in-app viewer and user rights controls.
 */

export interface PolicySection {
  id: string;
  title: string;
  badge?: string;
  summary: string;
  content: string[];
  keyHighlights: string[];
}

export const PRIVACY_POLICY_DATA = {
  effectiveDate: 'January 1, 2026',
  lastRevised: 'March 15, 2026',
  governingLaws: 'Digital Personal Data Protection Act (DPDPA 2023 - India), IT Act 2000, and GDPR Principles',
  
  executiveSummary: [
    'Zero Commercialization: We never sell, monetize, or trade your data with advertisers or data brokers.',
    'No Behavioral Tracking: Zero ad trackers, tracking cookies, or commercial telemetry SDKs.',
    'Sensitive Data Protection: Precise GPS is collected ONLY during active SOS/Journeys. Microphone audio for Voice SOS is processed 100% on-device and NEVER recorded or uploaded.',
    'Offline Verification: Curated emergency numbers are stored directly on your phone and work without internet.',
    'Total Sovereignty: 1-tap instant purge of location history and complete data deletion at any time.'
  ],

  privacyByDesignPrinciples: [
    {
      principle: '1. Proactive not Reactive',
      detail: 'Privacy threats are anticipated and blocked architecturally via local-first computing and ephemeral tokens before risks occur.'
    },
    {
      principle: '2. Privacy as Default',
      detail: 'No background tracking is enabled out of the box. Location tracking is active ONLY when an SOS or Safe Journey is initiated.'
    },
    {
      principle: '3. Privacy Embedded in Design',
      detail: 'Sandboxed local storage and instant session revocation are built into the core framework, not bolted on.'
    },
    {
      principle: '4. Full Functionality (Positive-Sum)',
      detail: 'Full emergency assistance works even without internet; users do not trade privacy for safety.'
    },
    {
      principle: '5. End-to-End Security',
      detail: 'TLS 1.3 encryption in transit, AES-256 equivalent vault at rest, and one-way hashed PIN protection.'
    },
    {
      principle: '6. Visibility & Transparency',
      detail: 'Every data transfer, permission usage, and source verification date is visible in real-time in the app.'
    },
    {
      principle: '7. Respect for User Privacy',
      detail: 'User has full control with 1-tap data purge, JSON export, and permission revocation anytime.'
    }
  ],

  sections: [
    {
      id: 'location',
      title: 'Precise Geolocation Data',
      badge: 'Sensitive Data',
      summary: 'Used exclusively during active emergencies to dispatch first responders and alert guardians.',
      content: [
        'How it is collected: When an SOS, Safe Journey, or Safety Timer is triggered, HER-SAFE queries the device W3C GPS hardware with high accuracy (±5–15 meters).',
        'When it is NOT collected: When the app is idle and no emergency session is running, your background location is NEVER tracked, logged, or recorded.',
        'Ephemeral Sharing: Live tracking links are issued with cryptographically random tokens and automatically expire after 2 hours or immediately upon pressing "Cancel SOS / I am Safe".',
        'Instant Deletion: Users can instantly purge all historical GPS coordinates via Settings > Purge Location History.'
      ],
      keyHighlights: [
        'GPS accuracy: ±5 to 15 meters',
        'No idle tracking',
        '2-hour token auto-expiry',
        '1-tap location purge'
      ]
    },
    {
      id: 'microphone',
      title: 'Microphone & Voice SOS',
      badge: 'Sensitive Data',
      summary: 'Processed 100% on-device for hands-free emergency phrases. Raw audio is NEVER recorded or uploaded.',
      content: [
        'On-Device Speech Processing: The Voice SOS feature uses client-side SpeechRecognition to listen for emergency keywords (such as "I need help" or "Bachao").',
        'Zero Audio Recording: HER-SAFE does not create audio files (e.g. WAV, MP3) and does not stream voice recordings to remote cloud servers or AI processing farms.',
        'Opt-In and Visible: Voice SOS is inactive by default. When switched on, a prominent red pulsing microphone banner is displayed. You can terminate listening at any second with one tap.',
        'Immediate Release: As soon as a trigger word is detected or the user stops Voice SOS, the microphone input stream is instantly released at the hardware driver level.'
      ],
      keyHighlights: [
        '100% On-device keyword spotting',
        'Zero audio files created or stored',
        'Zero cloud audio uploads',
        'Instant microphone release'
      ]
    },
    {
      id: 'contacts',
      title: 'Trusted Contacts & Notifications',
      badge: 'Emergency Dispatch',
      summary: 'Stored locally and used solely to dispatch urgent SOS alerts and tracking links during crisis.',
      content: [
        'Contact Data: Names, phone numbers, and guardian relationships are stored in your device local storage.',
        'Purpose-Bound Dispatch: Contacts are contacted strictly when you trigger an emergency SOS, when a safety timer expires unacknowledged, or when you tap "Send Test Alert".',
        'Zero Marketing: Your contacts will never receive promotional SMS, marketing calls, or third-party communications from HER-SAFE.',
        'Direct Control: You can add, edit, or delete any contact in real time with instant synchronization.'
      ],
      keyHighlights: [
        'Stored locally on your device',
        'Used strictly for distress dispatches',
        'Never spammed or shared with commercial entities'
      ]
    },
    {
      id: 'medical_id',
      title: 'Emergency Medical ID & Lock Screen Profile',
      badge: 'Vital Interests',
      summary: 'Critical health information shown to first responders (EMTs, doctors) during active emergency rescue.',
      content: [
        'Health Fields: Blood group, severe allergies, chronic medical conditions, and emergency notes.',
        'Display Scope: Displayed on the Active Emergency screen so emergency medical personnel can provide immediate informed treatment.',
        'Local Storage: Kept in your sandboxed local storage profile, completely editable or erasable by you.'
      ],
      keyHighlights: [
        'Optional field for first responder triage',
        'Editable and erasable at any time'
      ]
    },
    {
      id: 'offline_numbers',
      title: 'Offline Emergency Directory Storage',
      badge: 'Offline Architecture',
      summary: 'Curated official emergency numbers stored locally on the device for reliable offline calling.',
      content: [
        'Local Directory Cache: 14 verified national and regional emergency helplines (112, 181, 1091, 108, 101, 1098, 139, etc.) are pre-stored in device local storage.',
        'Native Telephony Dialer: Dialing invokes the standard cellular phone dialer (tel:) without requiring cellular mobile data or Wi-Fi internet.',
        'Zero-Balance & No-SIM Priority: Calls to ERSS 112 operate under national emergency carrier priority (3GPP TS 22.101) even with zero phone balance or without a SIM card.',
        'Verified Sources: All numbers are verified against official Government of India gazettes with visible verification timestamps.'
      ],
      keyHighlights: [
        '100% accessible in Airplane Mode',
        'Direct cellular voice routing (no internet required)',
        'Carrier emergency priority compliance'
      ]
    },
    {
      id: 'security_storage',
      title: 'Data Storage, Encryption & Protection',
      badge: 'Security Architecture',
      summary: 'Defense-in-depth protection using TLS 1.3, origin sandboxing, and hashed PIN security.',
      content: [
        'Encryption in Transit: All data transfers between client and server are secured with TLS 1.3 with Perfect Forward Secrecy.',
        'Local Sandboxing: Application storage keys are isolated to the HER-SAFE origin and inaccessible to external websites or third-party iframes.',
        'Security PIN Hash: Optional 4-digit security PIN is stored as a cryptographic salt-hash. Plaintext PINs are never stored or transmitted.',
        'Role-Based Admin Protection: Only authenticated administrators can audit system health or update official helplines.'
      ],
      keyHighlights: [
        'TLS 1.3 end-to-end transport encryption',
        'Origin sandboxed localStorage',
        'One-way cryptographic PIN hashing'
      ]
    },
    {
      id: 'user_rights',
      title: 'Your Rights & Data Sovereignty',
      badge: 'DPDPA 2023 & GDPR',
      summary: 'Comprehensive rights to access, rectify, export, and erase all personal information.',
      content: [
        'Right to Access & Data Portability: Export your complete profile, contacts, and safety settings in a machine-readable JSON backup anytime.',
        'Right to Erasure (Right to be Forgotten): Permanently delete your location history or execute complete account deletion with one tap.',
        'Right to Rectify: Update your personal profile, contacts, and emergency phrases at any moment with zero friction.',
        'Right to Revoke Permissions: Turn off device location or microphone permissions anytime in your phone OS Settings.'
      ],
      keyHighlights: [
        'Instant JSON Cloud Backup export',
        '1-tap location history purge',
        '1-tap total account erasure'
      ]
    }
  ],

  dpoContact: {
    title: 'Data Protection Officer (DPO)',
    organization: 'HER-SAFE Safety & Data Protection Office',
    email: 'privacy@her-safe.internal',
    altEmail: 'dpo@her-safe.gov.in',
    responseSla: 'Inquiries acknowledged within 24 hours and resolved within 72 hours.',
    address: 'Cyber Safety & Women Security Division, C-DAC Partner Node, New Delhi, India.'
  }
};
