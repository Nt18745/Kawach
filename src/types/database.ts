/**
 * HER-SAFE Database Models & System Architecture Types
 * Defines data structures, RBAC permissions, and mandatory service dependencies.
 */

// 1. Mandatory Service Connection Dependencies
export interface ServiceDependency {
  id: string;
  name: string;
  type: 'government_gateway' | 'telecom_sms' | 'device_api' | 'location_provider' | 'cloud_sync' | 'core_service';
  isMandatory: boolean;
  status: 'connected' | 'degraded' | 'offline' | 'unauthorized';
  description: string;
  officialProvider: string;
  fallbackStrategy: string;
}

export type ThemeVariant =
  | 'crimson'
  | 'emerald'
  | 'amber'
  | 'indigo'
  | 'slate'
  | 'cyberpunk'
  | 'white'
  | 'black'
  | 'yellow'
  | 'blue'
  | 'pink';

// 2. User Model
export interface User {
  id: string;
  name: string;
  phone: string;
  email?: string;
  bloodGroup?: string;
  emergencyMedicalNotes?: string;
  pinHash?: string; // Optional 4-digit PIN lock
  biometricEnabled?: boolean;
  preferredLanguage: 'en' | 'hi' | 'kn';
  themeVariant?: ThemeVariant;
  highContrastMode?: boolean;
  darkMode?: boolean;
  lowBatteryMode?: boolean;
  voiceEmergencyPhrase: string; // Default: "I need help"
  countdownSeconds: number; // Default 3
  phone_verified?: boolean;
  profilePhoto?: string;
  dateOfBirth?: string;
  country?: string;
  audibleSirenDeterrentEnabled?: boolean; // SOS siren sound disabled by default for victim stealth
  silentSosEnabled?: boolean; // Default true - silent on activating device
  autoDial112?: boolean;
  notificationPermission?: string;
  locationPermission?: string;
  microphonePermission?: string;
  safetyPreferences?: {
    voicePhrase?: string;
    countdownSeconds?: number;
    lowBatteryMode?: boolean;
    sirenVolume?: number;
    audibleSirenDeterrentEnabled?: boolean;
    silentSosEnabled?: boolean;
  };
  createdAt: string;
  updatedAt: string;
  syncVersion: number;
}

// 3. TrustedContact Model
export interface TrustedContact {
  id: string;
  userId: string;
  name: string;
  phone: string;
  relationship: 'Mother' | 'Father' | 'Sister' | 'Brother' | 'Partner' | 'Friend' | 'Guardian' | 'Other' | string;
  priority: 'primary' | 'secondary';
  verificationStatus: 'verified' | 'pending' | 'unverified';
  verifiedAt?: string;
  receiveAlerts?: boolean; // Select which contacts receive SOS alerts (toggle)
  notificationStatus?: 'sent' | 'delivered' | 'opened' | 'failed' | 'idle';
  lastDeliveryStatus?: 'sent' | 'delivered' | 'opened' | 'failed' | 'idle';
  lastNotifiedAt?: string;
  lastError?: string;
  createdAt: string;
  updatedAt: string;
}

// 4. EmergencySession Model
export interface EmergencySession {
  id: string;
  userId: string;
  status: 'active' | 'cancelled' | 'resolved' | 'expired';
  triggerType: 'sos_button' | 'hardware_gesture' | 'voice_sos' | 'voice_scream' | 'safety_timer_expired' | 'journey_alert' | 'login_bypass' | 'hardware_shake' | 'hardware_keyboard' | 'hardware_power_button' | string;
  startedAt: string;
  cancelledAt?: string;
  resolvedAt?: string;
  expiresAt: string; // Automatic safety expiration
  cancellationReason?: string;
  
  // Real-time location trace (minimal retention)
  initialLocation: LocationPoint;
  lastKnownLocation: LocationPoint;
  locationUpdateCount: number;
  
  // Real device state
  batteryPercentage?: number;
  networkStatus?: 'online' | 'offline' | 'cellular' | 'wifi';
  deviceInfo?: string;

  // Real-time step progress
  statusSteps?: Array<{
    step: string;
    description: string;
    status: 'pending' | 'success' | 'failed';
    timestamp: string;
  }>;

  // Per-contact notification statuses
  contactsStatuses?: Array<{
    contactId: string;
    name: string;
    phone: string;
    channel: 'sms' | 'whatsapp' | 'push' | 'voice';
    status: 'delivered' | 'sent' | 'retrying' | 'failed';
    timestamp: string;
    error?: string;
  }>;

  // Status of action dispatches
  officialEmergencyCallStatus: 'dialer_opened' | 'connected' | 'failed' | 'not_attempted';
  officialEmergencyNumberDialed: string;
  contactsNotifiedCount: number;
  contactsTotalCount: number;
  shareToken: string; // Token used for secure live-location view
}

// 5. LocationShare Model
export interface LocationShare {
  id: string;
  token: string;
  sessionId?: string; // Tied to SOS or Journey
  userId: string;
  userName: string;
  userPhone: string;
  contactIdsAllowed: string[]; // Strict authorization list
  active: boolean;
  accessCount: number;
  lastAccessedAt?: string;
  expiresAt: string;
  createdAt: string;
  revokedAt?: string;
  latitude: number;
  longitude: number;
  accuracyMeters: number;
  address?: string;
  batteryLevel?: number;
  speedKmh?: number;
  heading?: number;
  comment?: string;
  breadcrumbs?: Array<{
    latitude: number;
    longitude: number;
    timestamp: string;
    accuracy?: number;
    speed?: number;
  }>;
}

export interface LocationPoint {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: string;
  altitude?: number | null;
  speed?: number | null;
  heading?: number | null;
  address?: string;
  batteryPercentage?: number;
  networkStatus?: 'online' | 'offline' | 'cellular' | 'wifi';
  googleMapsUrl?: string;
}

// 6. EmergencyNumber Model (Official Directory)
export interface EmergencyNumber {
  id: string;
  serviceName: string;
  phoneNumber: string;
  category: 'general' | 'women' | 'police' | 'ambulance' | 'fire' | 'child' | 'railway' | 'disaster' | 'cyber';
  country: string;
  stateUT: string; // e.g. "All India", "Delhi", "Karnataka", "Maharashtra"
  districtCity?: string;
  source: string; // Official Government Gazette / Department Portal
  sourceUrl?: string;
  verificationDate: string;
  lastUpdatedDate: string;
  status: 'verified_official' | 'pending_verification' | 'deprecated';
  notes?: string;
  isNationwide: boolean;
  availableOffline?: boolean;
  offlineTelephonyType?: 'cellular_voice' | 'toll_free' | 'ussd_sms';
  offlineNotes?: string;
}

// 7. EmergencyFacility Model
export interface EmergencyFacility {
  id: string;
  name: string;
  type: 'police_station' | 'hospital' | 'ambulance' | 'fire_station' | 'women_help_desk' | 'one_stop_centre';
  address: string;
  city: string;
  stateUT: string;
  postalCode?: string;
  latitude: number;
  longitude: number;
  phoneNumber: string;
  alternatePhone?: string;
  is24x7: boolean;
  hasWomenDesk: boolean;
  verificationStatus: 'verified_official' | 'unverified';
  dataSource: string;
  verifiedAt: string;
  lastCheckedDate: string;
  notes?: string;
}

// 8. FacilityVerification Audit
export interface FacilityVerification {
  id: string;
  facilityId: string;
  verifierAdminId: string;
  verifierName: string;
  verificationMethod: 'physical_visit' | 'government_registry' | 'telephonic_check';
  verifiedAt: string;
  notes: string;
}

// 9. SafetyTimer Model
export interface SafetyTimer {
  id: string;
  userId: string;
  destination: string;
  durationMinutes: number;
  startedAt: string;
  expiresAt: string;
  gracePeriodSeconds: number; // e.g. 120s
  status: 'running' | 'completed_safe' | 'grace_period' | 'alert_triggered' | 'cancelled';
  trustedContactIds: string[];
  lastPingLocation?: LocationPoint;
}

// 10. Journey Model
export interface Journey {
  id: string;
  userId: string;
  startLocationName: string;
  destinationName: string;
  startCoordinates: LocationPoint;
  destinationCoordinates?: { latitude: number; longitude: number };
  destinationPostalCode?: string;
  distanceKm?: number;
  estimatedDurationMins?: number;
  shareToken?: string;
  expectedArrivalTime: string;
  status: 'in_progress' | 'arrived_safe' | 'diverted' | 'cancelled' | 'alert_triggered';
  startedAt: string;
  completedAt?: string;
  trustedContactIds: string[];
  checkInIntervalMinutes: number;
  breadcrumbs: LocationPoint[];
}

// 11. Notification Model
export interface NotificationLog {
  id: string;
  userId: string;
  recipientPhone: string;
  recipientName: string;
  type: 'sos_alert' | 'sos_ended' | 'timer_alert' | 'journey_update' | 'test_alert';
  message: string;
  deliveryChannel: 'sms' | 'push' | 'in_app' | 'simulated_carrier';
  status: 'delivered' | 'sent' | 'pending' | 'failed' | 'requires_user_dial';
  failureReason?: string;
  timestamp: string;
}

// 12. Device & Permission Model
export interface DeviceInfo {
  id: string;
  userId: string;
  platform: 'android' | 'ios' | 'web';
  userAgent: string;
  batterySupported: boolean;
  speechSupported: boolean;
  vibrationSupported: boolean;
  registeredAt: string;
  lastActiveAt: string;
}

export interface PermissionStatusMap {
  geolocation: 'granted' | 'denied' | 'prompt';
  microphone: 'granted' | 'denied' | 'prompt';
  notifications: 'granted' | 'denied' | 'prompt';
  backgroundLocation: 'granted' | 'denied' | 'prompt';
}

// 13. Admin Model (RBAC)
export type AdminRole = 'super_admin' | 'data_admin' | 'support_admin';

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: AdminRole;
  active: boolean;
  lastLoginAt: string;
  permissions: {
    canManageEmergencyNumbers: boolean;
    canVerifyFacilities: boolean;
    canViewAuditLogs: boolean;
    canManageAdmins: boolean;
    canViewSystemHealth: boolean;
  };
}

// 14. AuditLog Model
export interface AuditLog {
  id: string;
  actorId: string;
  actorRole: string;
  action: string;
  targetEntity: string;
  targetId?: string;
  details: string;
  ipAddress?: string;
  timestamp: string;
}

// 15. DataSource Model
export interface DataSource {
  id: string;
  name: string;
  organization: string;
  type: 'official_portal' | 'gazette' | 'police_dept' | 'health_ministry' | 'sakhi_directory';
  website: string;
  reliabilityRating: 'A_GOVERNMENT_OFFICIAL' | 'B_STATUTORY_BODY' | 'C_LOCAL_AUTHORITY';
  lastSyncedAt: string;
}

// 16. Cloud Backup & Sync
export interface CloudBackupPayload {
  userId: string;
  backupTimestamp: string;
  userProfile: Partial<User>;
  contacts: TrustedContact[];
  offlineSettings: {
    voicePhrase: string;
    countdownSeconds: number;
    preferredLanguage: string;
    highContrast: boolean;
  };
  syncHash: string;
}

export interface OfflineQueueItem {
  id: string;
  type: 'CREATE_SESSION' | 'UPDATE_LOCATION' | 'LOG_ALERT' | 'UPDATE_CONTACT';
  payload: Record<string, unknown>;
  createdAt: string;
  retries: number;
}

// 17. Complete Emergency History Record
export interface EmergencyHistoryRecord {
  id: string;
  sessionId: string;
  emergencyId?: string;
  userId: string;
  date: string;
  time: string;
  activationMethod: 'sos_button' | 'hardware_gesture' | 'voice_sos' | 'safety_timer_expired' | 'journey_alert' | string;
  startingLocation: LocationPoint;
  lastKnownLocation?: LocationPoint;
  locationHistory: LocationPoint[];
  durationMinutes: number;
  durationSeconds?: number;
  contactsNotifiedCount: number;
  contactsTotalCount: number;
  trustedContactsNotified?: Array<{
    name: string;
    phone: string;
    status: string;
    timestamp?: string;
  }>;
  contactsNotifiedDetails: Array<{
    name: string;
    phone: string;
    deliveryStatus: 'delivered' | 'sent' | 'retried' | 'failed' | string;
    notifiedAt: string;
  }>;
  emergencyNumbersAccessed: string[];
  nearbyServicesAccessed: string[];
  locationShared: boolean;
  locationSharingStoppedAt?: string;
  batteryPercentage?: number;
  networkStatus?: string;
  incidentNotes?: string;
  status: 'ACTIVE' | 'RESOLVED' | 'CANCELLED' | 'EXPIRED' | 'FAILED' | string;
  createdAt: string;
  resolvedAt?: string;
}

// 18. 1 TB Cloud Storage System Architecture Types
export interface CloudStorageConfig {
  targetCapacityGb: 1000; // 1 TB / 1000 GB
  targetCapacityBytes: 1073741824000;
  provider: 'Google Cloud Storage' | 'Firebase Storage' | 'AWS S3' | 'Cloudflare R2';
  bucketName: string;
  region: string;
  encryption: 'AES-256-GCM / Customer-Managed Encryption Key';
  retentionPolicy: 'Emergency Events: 7 Years (Legal Standard) | Ephemeral GPS: 24h Purge';
  status: 'active_configured' | 'pending_bucket_provision';
  paths: {
    userProfiles: '/users/{user_id}/profile/';
    emergencyEvents: '/users/{user_id}/emergencies/{emergency_id}/sos-event/';
    locationHistory: '/users/{user_id}/emergencies/{emergency_id}/location-history/';
    notifications: '/users/{user_id}/emergencies/{emergency_id}/notifications/';
    incidentData: '/users/{user_id}/emergencies/{emergency_id}/incident-data/';
    journeyData: '/users/{user_id}/journeys/{journey_id}/journey-data/';
    timerData: '/users/{user_id}/timers/{timer_id}/timer-data/';
    systemAudit: '/system/audit/';
    systemLogs: '/system/logs/';
  };
}

export interface CloudStorageStats {
  totalCapacityGb: number;
  usedBytes: number;
  usedGb: number;
  usagePercentage: number;
  categorizedUsage: {
    userProfilesBytes: number;
    emergencyEventsBytes: number;
    locationHistoryBytes: number;
    incidentEvidenceBytes: number;
    auditLogsBytes: number;
  };
  totalFilesCount: number;
}

// 19. Structured Activity Record
export interface ActivityLogItem {
  id: string;
  userId: string;
  type:
    | 'SOS_ACTIVATED'
    | 'SOS_CANCELLED'
    | 'SOS_RESOLVED'
    | 'CONTACT_ADDED'
    | 'CONTACT_REMOVED'
    | 'LOCATION_SHARED'
    | 'LOCATION_SHARING_STOPPED'
    | 'SAFETY_TIMER_STARTED'
    | 'SAFETY_TIMER_COMPLETED'
    | 'SAFETY_TIMER_EXPIRED'
    | 'SAFE_JOURNEY_STARTED'
    | 'SAFE_JOURNEY_COMPLETED'
    | 'EMERGENCY_NUMBER_ACCESSED'
    | 'FACILITY_VIEWED'
    | 'GOOGLE_MAPS_OPENED'
    | 'PERMISSION_CHANGED'
    | 'USER_LOGIN'
    | 'USER_LOGOUT';
  title: string;
  description: string;
  metadata?: Record<string, any>;
  timestamp: string;
}

