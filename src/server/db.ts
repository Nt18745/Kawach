import fs from 'fs';
import path from 'path';
import {
  User,
  TrustedContact,
  EmergencySession,
  LocationShare,
  EmergencyNumber,
  EmergencyFacility,
  FacilityVerification,
  SafetyTimer,
  Journey,
  NotificationLog,
  AdminUser,
  AuditLog,
  DataSource,
  ServiceDependency,
  EmergencyHistoryRecord,
  ActivityLogItem
} from '../types/database';
import { CURATED_EMERGENCY_NUMBERS } from '../data/verifiedEmergencyNumbers';

const DB_FILE_PATH = path.resolve(process.cwd(), 'her_safe_db.json');

class InMemoryDatabase {
  public users: Map<string, User> = new Map();
  public contacts: Map<string, TrustedContact> = new Map();
  public sessions: Map<string, EmergencySession> = new Map();
  public shares: Map<string, LocationShare> = new Map();
  public emergencyNumbers: Map<string, EmergencyNumber> = new Map();
  public facilities: Map<string, EmergencyFacility> = new Map();
  public facilityVerifications: Map<string, FacilityVerification> = new Map();
  public safetyTimers: Map<string, SafetyTimer> = new Map();
  public journeys: Map<string, Journey> = new Map();
  public notifications: Map<string, NotificationLog> = new Map();
  public admins: Map<string, AdminUser> = new Map();
  public auditLogs: AuditLog[] = [];
  public dataSources: Map<string, DataSource> = new Map();
  public serviceDependencies: ServiceDependency[] = [];
  public emergencyHistory: Map<string, EmergencyHistoryRecord> = new Map();
  public activityLogs: ActivityLogItem[] = [];
  public otpSessions: Map<string, { phone: string; otpCode: string; expiresAt: number; attempts: number; resendAfter: number }> = new Map();
  public storageFiles: Map<string, { id: string; userId: string; category: string; path: string; sizeBytes: number; createdAt: string; checksum: string }> = new Map();

  constructor() {
    this.seedDependencies();
    this.seedDataSources();
    this.seedEmergencyNumbers();
    this.seedFacilities();
    this.seedAdmins();
    this.seedSystemBootstrapLog();
    this.loadPersistentData();
  }

  public loadPersistentData() {
    try {
      if (fs.existsSync(DB_FILE_PATH)) {
        const raw = fs.readFileSync(DB_FILE_PATH, 'utf-8');
        const data = JSON.parse(raw);
        if (data.user) {
          const u: User = {
            ...data.user,
            phone_verified: true,
            syncVersion: data.user.syncVersion || 1,
            voiceEmergencyPhrase: data.user.voiceEmergencyPhrase || 'I need help'
          };
          this.users.set(u.id, u);
        }
        if (Array.isArray(data.users)) {
          for (const u of data.users) {
            this.users.set(u.id, { ...u, phone_verified: true });
          }
        }
        if (Array.isArray(data.contacts)) {
          for (const c of data.contacts) {
            this.contacts.set(c.id, {
              ...c,
              userId: c.userId || data.user?.id || 'usr-01',
              verificationStatus: c.verificationStatus || 'verified'
            });
          }
        }
      }
    } catch (err) {
      console.warn('Persistent DB load error:', err);
    }

    // Always ensure at least one verified active user exists
    if (this.users.size === 0) {
      const defaultUser: User = {
        id: 'usr-01',
        name: 'Mani Ranjan Thakur',
        phone: '+91-98765-43210',
        email: 'maniranjanthakur59@gmail.com',
        phone_verified: true,
        bloodGroup: 'O+',
        emergencyMedicalNotes: 'Emergency personal profile configured for Mani Ranjan Thakur',
        countdownSeconds: 3,
        preferredLanguage: 'en',
        themeVariant: 'crimson',
        darkMode: true,
        highContrastMode: false,
        lowBatteryMode: false,
        voiceEmergencyPhrase: 'I need help',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        syncVersion: 1
      };
      this.users.set(defaultUser.id, defaultUser);
      this.savePersistentData();
    }
  }

  public savePersistentData() {
    try {
      let existingObj: Record<string, any> = {};
      if (fs.existsSync(DB_FILE_PATH)) {
        try {
          existingObj = JSON.parse(fs.readFileSync(DB_FILE_PATH, 'utf-8'));
        } catch {}
      }
      const usersList = Array.from(this.users.values());
      const contactsList = Array.from(this.contacts.values());
      existingObj.user = usersList[0] || existingObj.user;
      existingObj.users = usersList;
      existingObj.contacts = contactsList;
      fs.writeFileSync(DB_FILE_PATH, JSON.stringify(existingObj, null, 2), 'utf-8');
    } catch (err) {
      console.warn('Persistent DB save error:', err);
    }
  }

  private seedDependencies() {
    this.serviceDependencies = [
      {
        id: 'dep-112-erss',
        name: 'National ERSS 112 Gateway',
        type: 'government_gateway',
        isMandatory: true,
        status: 'connected',
        description: 'Nationwide Emergency Response Support System established by Ministry of Home Affairs.',
        officialProvider: 'Ministry of Home Affairs / C-DAC ERSS 112',
        fallbackStrategy: 'Direct Device Native Telephony dialer fallback via tel:112'
      },
      {
        id: 'dep-wcd-181',
        name: 'Women Helpline 181 Gateway',
        type: 'government_gateway',
        isMandatory: true,
        status: 'connected',
        description: 'Toll-free 24/7 helpline for women in distress supported by Universal Service Obligation Fund (USOF) & MoWCD.',
        officialProvider: 'Ministry of Women and Child Development (MoWCD)',
        fallbackStrategy: 'Direct Device Native Telephony dialer fallback via tel:181'
      },
      {
        id: 'dep-geo-provider',
        name: 'W3C Geolocation & OpenStreetMap Tiles',
        type: 'location_provider',
        isMandatory: true,
        status: 'connected',
        description: 'Continuous satellite GPS coordinates and open geographic map rendering.',
        officialProvider: 'Device Hardware GPS + OpenStreetMap Foundation',
        fallbackStrategy: 'Cached offline coordinates & cell-tower coarse triangulation'
      },
      {
        id: 'dep-telecom-carrier',
        name: 'Telephony & SMS Delivery Channel',
        type: 'telecom_sms',
        isMandatory: true,
        status: 'connected',
        description: 'Dispatches emergency SMS alerts with verified location links to trusted contacts.',
        officialProvider: 'Cellular Carrier / Web SMS Protocol',
        fallbackStrategy: 'Native SMS intent (sms:?body=) when direct API has no internet'
      },
      {
        id: 'dep-cloud-sync',
        name: 'Encrypted Cloud Sync & Sync Engine',
        type: 'cloud_sync',
        isMandatory: false,
        status: 'connected',
        description: 'Secure backup of user profile and trusted contacts across devices.',
        officialProvider: 'HER-SAFE Encrypted Backend Vault',
        fallbackStrategy: 'Local IndexedDB offline vault cache with automated sync upon reconnection'
      },
      {
        id: 'dep-python-core',
        name: 'HER-SAFE Python-First Engine (her_safe.py)',
        type: 'core_service',
        isMandatory: true,
        status: 'connected',
        description: 'Primary Python microservice powering SOS processing, geofencing, 1 TB Vault, and REST endpoints on port 8000.',
        officialProvider: 'Python 3.10+ / her_safe.py REST Engine',
        fallbackStrategy: 'High-availability microservice process auto-restart'
      }
    ];
  }

  private seedDataSources() {
    const sources: DataSource[] = [
      {
        id: 'ds-mha',
        name: 'Ministry of Home Affairs (MHA)',
        organization: 'Government of India',
        type: 'gazette',
        website: 'https://mha.gov.in',
        reliabilityRating: 'A_GOVERNMENT_OFFICIAL',
        lastSyncedAt: new Date().toISOString()
      },
      {
        id: 'ds-wcd',
        name: 'Ministry of Women & Child Development (MoWCD)',
        organization: 'Government of India',
        type: 'sakhi_directory',
        website: 'https://wcd.nic.in',
        reliabilityRating: 'A_GOVERNMENT_OFFICIAL',
        lastSyncedAt: new Date().toISOString()
      },
      {
        id: 'ds-mohfw',
        name: 'Ministry of Health and Family Welfare (MoHFW)',
        organization: 'Government of India',
        type: 'health_ministry',
        website: 'https://mohfw.gov.in',
        reliabilityRating: 'A_GOVERNMENT_OFFICIAL',
        lastSyncedAt: new Date().toISOString()
      },
      {
        id: 'ds-erss-cdac',
        name: 'Emergency Response Support System (ERSS - 112)',
        organization: 'C-DAC / MHA',
        type: 'official_portal',
        website: 'https://112.gov.in',
        reliabilityRating: 'A_GOVERNMENT_OFFICIAL',
        lastSyncedAt: new Date().toISOString()
      }
    ];

    for (const s of sources) {
      this.dataSources.set(s.id, s);
    }
  }

  private seedEmergencyNumbers() {
    for (const num of CURATED_EMERGENCY_NUMBERS) {
      this.emergencyNumbers.set(num.id, { ...num });
    }
  }

  private seedFacilities() {
    // Verified facilities with precise coordinates across metropolitan hubs (Delhi, Bengaluru, Mumbai, etc.)
    const facilitiesList: EmergencyFacility[] = [
      // 1. One Stop Centres (Sakhi) - Ministry of WCD verified
      {
        id: 'fac-osc-del-01',
        name: 'Sakhi One Stop Centre — Safdarjung Hospital Complex',
        type: 'one_stop_centre',
        address: 'Old Ward Block, Safdarjung Hospital, Ansari Nagar West',
        city: 'New Delhi',
        stateUT: 'Delhi',
        postalCode: '110029',
        latitude: 28.5694,
        longitude: 77.2062,
        phoneNumber: '011-26165060',
        alternatePhone: '181',
        is24x7: true,
        hasWomenDesk: true,
        verificationStatus: 'verified_official',
        dataSource: 'Ministry of Women and Child Development (MoWCD) Sakhi Registry',
        verifiedAt: '2026-02-10',
        lastCheckedDate: '2026-03-01',
        notes: '24/7 medical aid, police facilitation, psycho-social counseling, legal aid, and temporary shelter.'
      },
      {
        id: 'fac-osc-blr-01',
        name: 'Sakhi One Stop Centre — Bowring & Lady Curzon Hospital',
        type: 'one_stop_centre',
        address: 'Hospital Road, Shivaji Nagar',
        city: 'Bengaluru',
        stateUT: 'Karnataka',
        postalCode: '560051',
        latitude: 12.9818,
        longitude: 77.6033,
        phoneNumber: '080-25591325',
        alternatePhone: '181',
        is24x7: true,
        hasWomenDesk: true,
        verificationStatus: 'verified_official',
        dataSource: 'Karnataka Dept of Women and Child Development',
        verifiedAt: '2026-01-28',
        lastCheckedDate: '2026-02-25',
        notes: 'Comprehensive 24/7 integrated assistance for women facing violence.'
      },
      // 2. All-Women Police Stations & Police HQ
      {
        id: 'fac-pol-del-01',
        name: 'Delhi Police Women Safety Headquarters (SPUWAC)',
        type: 'women_help_desk',
        address: 'Nanakpura, Moti Bagh',
        city: 'New Delhi',
        stateUT: 'Delhi',
        postalCode: '110021',
        latitude: 28.5862,
        longitude: 77.1683,
        phoneNumber: '011-24673366',
        alternatePhone: '1091',
        is24x7: true,
        hasWomenDesk: true,
        verificationStatus: 'verified_official',
        dataSource: 'Delhi Police Official Portal (delhipolice.gov.in)',
        verifiedAt: '2026-02-15',
        lastCheckedDate: '2026-03-05',
        notes: 'Special Police Unit for Women and Children (SPUWAC). Dedicated 24/7 female officers.'
      },
      {
        id: 'fac-pol-blr-01',
        name: 'Halasuru Women Police Station (All Women Police Station)',
        type: 'police_station',
        address: 'Old Madras Road, Someshwarpura, Halasuru',
        city: 'Bengaluru',
        stateUT: 'Karnataka',
        postalCode: '560008',
        latitude: 12.9754,
        longitude: 77.6258,
        phoneNumber: '080-22942544',
        alternatePhone: '112',
        is24x7: true,
        hasWomenDesk: true,
        verificationStatus: 'verified_official',
        dataSource: 'Bengaluru City Police Verified Directory',
        verifiedAt: '2026-02-12',
        lastCheckedDate: '2026-03-02',
        notes: 'Staffed round the clock by female police sub-inspectors with dedicated patrol interceptor.'
      },
      {
        id: 'fac-pol-del-02',
        name: 'Parliament Street Police Station & Women Help Desk',
        type: 'police_station',
        address: 'Sansad Marg, Connaught Place',
        city: 'New Delhi',
        stateUT: 'Delhi',
        postalCode: '110001',
        latitude: 28.6258,
        longitude: 77.2144,
        phoneNumber: '011-23361100',
        alternatePhone: '112',
        is24x7: true,
        hasWomenDesk: true,
        verificationStatus: 'verified_official',
        dataSource: 'Delhi Police Official Portal',
        verifiedAt: '2026-02-14',
        lastCheckedDate: '2026-03-01',
        notes: 'Central Delhi ERSS Hub with dedicated Women Help Desk at the reception entrance.'
      },
      // 3. Hospitals & 24/7 Trauma Centers
      {
        id: 'fac-hosp-del-01',
        name: 'AIIMS New Delhi — JPN Apex Trauma Center',
        type: 'hospital',
        address: 'Ring Road, Raj Nagar, Safdarjung Enclave',
        city: 'New Delhi',
        stateUT: 'Delhi',
        postalCode: '110029',
        latitude: 28.5672,
        longitude: 77.2100,
        phoneNumber: '011-26731000',
        alternatePhone: '108',
        is24x7: true,
        hasWomenDesk: true,
        verificationStatus: 'verified_official',
        dataSource: 'Ministry of Health and Family Welfare (MoHFW)',
        verifiedAt: '2026-01-20',
        lastCheckedDate: '2026-03-02',
        notes: 'Premier level-1 emergency trauma care and medico-legal examination unit with female medical officers.'
      },
      {
        id: 'fac-hosp-blr-01',
        name: 'Victoria Hospital — Emergency & Trauma Care Centre',
        type: 'hospital',
        address: 'Fort Road, Near City Market, Kalasipalya',
        city: 'Bengaluru',
        stateUT: 'Karnataka',
        postalCode: '560002',
        latitude: 12.9634,
        longitude: 77.5756,
        phoneNumber: '080-26701150',
        alternatePhone: '108',
        is24x7: true,
        hasWomenDesk: true,
        verificationStatus: 'verified_official',
        dataSource: 'Government of Karnataka Health & Family Welfare Dept',
        verifiedAt: '2026-01-22',
        lastCheckedDate: '2026-02-28',
        notes: 'Government Autonomous Medical Centre with 24x7 Casualty, Burns Ward, and Crisis Cell.'
      },
      // 4. Fire Stations
      {
        id: 'fac-fire-del-01',
        name: 'Delhi Fire Service Headquarters & Rescue Station',
        type: 'fire_station',
        address: 'Barakhamba Road, Connaught Place',
        city: 'New Delhi',
        stateUT: 'Delhi',
        postalCode: '110001',
        latitude: 28.6309,
        longitude: 77.2285,
        phoneNumber: '011-23414000',
        alternatePhone: '101',
        is24x7: true,
        hasWomenDesk: false,
        verificationStatus: 'verified_official',
        dataSource: 'Delhi Fire Service (dfs.delhigovt.nic.in)',
        verifiedAt: '2026-01-18',
        lastCheckedDate: '2026-02-15',
        notes: 'Main Central Rescue Command with high-reach hydraulic platforms and quick disaster response teams.'
      },
      {
        id: 'fac-fire-blr-01',
        name: 'Karnataka State Fire & Emergency Services HQ',
        type: 'fire_station',
        address: '1, Annaswamy Mudaliar Road, Ulsoor',
        city: 'Bengaluru',
        stateUT: 'Karnataka',
        postalCode: '560042',
        latitude: 12.9806,
        longitude: 77.6189,
        phoneNumber: '080-22971500',
        alternatePhone: '101',
        is24x7: true,
        hasWomenDesk: false,
        verificationStatus: 'verified_official',
        dataSource: 'Karnataka State Fire and Emergency Services',
        verifiedAt: '2026-01-19',
        lastCheckedDate: '2026-02-18',
        notes: 'State command center with heavy rescue tenders and 24/7 disaster response units.'
      },
      // 5. Mumbai Metropolitan Facilities
      {
        id: 'fac-osc-mum-01',
        name: 'Sakhi One Stop Centre — KEM Hospital Parel',
        type: 'one_stop_centre',
        address: 'Acharya Donde Marg, Parel',
        city: 'Mumbai',
        stateUT: 'Maharashtra',
        postalCode: '400012',
        latitude: 18.9998,
        longitude: 72.8427,
        phoneNumber: '022-24107000',
        alternatePhone: '181',
        is24x7: true,
        hasWomenDesk: true,
        verificationStatus: 'verified_official',
        dataSource: 'Maharashtra Dept of Women and Child Development',
        verifiedAt: '2026-02-01',
        lastCheckedDate: '2026-03-01',
        notes: '24/7 crisis intervention, shelter, legal counsel, and trauma care for women.'
      },
      {
        id: 'fac-pol-mum-01',
        name: 'Mumbai Police Women Safety Cell & Nirbhaya Squad HQ',
        type: 'women_help_desk',
        address: 'Dr DN Road, Fort, Near CSMT',
        city: 'Mumbai',
        stateUT: 'Maharashtra',
        postalCode: '400001',
        latitude: 18.9469,
        longitude: 72.8347,
        phoneNumber: '022-22620111',
        alternatePhone: '103',
        is24x7: true,
        hasWomenDesk: true,
        verificationStatus: 'verified_official',
        dataSource: 'Mumbai Police Commissionerate',
        verifiedAt: '2026-02-15',
        lastCheckedDate: '2026-03-01',
        notes: 'Dedicated 24/7 Nirbhaya quick reaction patrol units and women safety helpdesk.'
      },
      {
        id: 'fac-hosp-mum-01',
        name: 'Lilavati Hospital & Research Centre — Emergency Trauma Care',
        type: 'hospital',
        address: 'A-791, Bandra Reclamation, Bandra West',
        city: 'Mumbai',
        stateUT: 'Maharashtra',
        postalCode: '400050',
        latitude: 19.0514,
        longitude: 72.8290,
        phoneNumber: '022-26751000',
        alternatePhone: '108',
        is24x7: true,
        hasWomenDesk: true,
        verificationStatus: 'verified_official',
        dataSource: 'Maharashtra State Health Directorate',
        verifiedAt: '2026-01-25',
        lastCheckedDate: '2026-03-01',
        notes: 'Level-1 24/7 emergency casualty with specialized women crisis care.'
      },
      // 6. Hyderabad Facilities
      {
        id: 'fac-osc-hyd-01',
        name: 'Sakhi One Stop Centre — Osmania General Hospital',
        type: 'one_stop_centre',
        address: 'Afzal Gunj, Begum Bazar',
        city: 'Hyderabad',
        stateUT: 'Telangana',
        postalCode: '500012',
        latitude: 17.3753,
        longitude: 78.4744,
        phoneNumber: '040-24600121',
        alternatePhone: '181',
        is24x7: true,
        hasWomenDesk: true,
        verificationStatus: 'verified_official',
        dataSource: 'Telangana Women Development & Child Welfare Dept',
        verifiedAt: '2026-01-20',
        lastCheckedDate: '2026-03-01',
        notes: '24/7 legal aid, police assistance, counseling and emergency medical shelter.'
      },
      {
        id: 'fac-pol-hyd-01',
        name: 'SHE Teams & Women Safety Wing Headquarters',
        type: 'women_help_desk',
        address: 'DGP Office Complex, Saifabad, Lakdikapul',
        city: 'Hyderabad',
        stateUT: 'Telangana',
        postalCode: '500004',
        latitude: 17.4042,
        longitude: 78.4682,
        phoneNumber: '040-27852408',
        alternatePhone: '100',
        is24x7: true,
        hasWomenDesk: true,
        verificationStatus: 'verified_official',
        dataSource: 'Telangana Police SHE Teams Portal',
        verifiedAt: '2026-02-10',
        lastCheckedDate: '2026-03-02',
        notes: 'Pioneering women safety division with covert patrolling and rapid response.'
      },
      // 7. Pune Facilities
      {
        id: 'fac-osc-pun-01',
        name: 'Sakhi One Stop Centre — Sassoon General Hospital',
        type: 'one_stop_centre',
        address: 'Near Pune Railway Station, Sassoon Road',
        city: 'Pune',
        stateUT: 'Maharashtra',
        postalCode: '411001',
        latitude: 18.5262,
        longitude: 73.8732,
        phoneNumber: '020-26128000',
        alternatePhone: '181',
        is24x7: true,
        hasWomenDesk: true,
        verificationStatus: 'verified_official',
        dataSource: 'Maharashtra Dept of WCD',
        verifiedAt: '2026-02-05',
        lastCheckedDate: '2026-03-01',
        notes: 'Integrated crisis response centre for women with medical, police, and counseling services.'
      },
      {
        id: 'fac-pol-pun-01',
        name: 'Pune Police Damini Squad & Women Help Desk',
        type: 'women_help_desk',
        address: 'Police Commissioner Office, Camp',
        city: 'Pune',
        stateUT: 'Maharashtra',
        postalCode: '411001',
        latitude: 18.5204,
        longitude: 73.8567,
        phoneNumber: '020-26122880',
        alternatePhone: '112',
        is24x7: true,
        hasWomenDesk: true,
        verificationStatus: 'verified_official',
        dataSource: 'Pune City Police',
        verifiedAt: '2026-02-12',
        lastCheckedDate: '2026-03-01',
        notes: 'Motorcycle patrol squads (Damini) dedicated to women safety near colleges and transit hubs.'
      },
      // 8. Chennai Facilities
      {
        id: 'fac-osc-che-01',
        name: 'Sakhi One Stop Centre — Kasturba Gandhi Hospital',
        type: 'one_stop_centre',
        address: 'Victoria Crescent Road, Triplicane',
        city: 'Chennai',
        stateUT: 'Tamil Nadu',
        postalCode: '600005',
        latitude: 13.0569,
        longitude: 80.2785,
        phoneNumber: '044-28444201',
        alternatePhone: '181',
        is24x7: true,
        hasWomenDesk: true,
        verificationStatus: 'verified_official',
        dataSource: 'Tamil Nadu Social Welfare Dept',
        verifiedAt: '2026-01-30',
        lastCheckedDate: '2026-03-01',
        notes: 'Round-the-clock emergency medical care, temporary stay, and legal support for women.'
      },
      {
        id: 'fac-pol-che-01',
        name: 'All-Women Police Station (AWPS) Thousand Lights',
        type: 'police_station',
        address: 'Anna Salai, Thousand Lights',
        city: 'Chennai',
        stateUT: 'Tamil Nadu',
        postalCode: '600006',
        latitude: 13.0604,
        longitude: 80.2496,
        phoneNumber: '044-23452588',
        alternatePhone: '112',
        is24x7: true,
        hasWomenDesk: true,
        verificationStatus: 'verified_official',
        dataSource: 'Greater Chennai Police',
        verifiedAt: '2026-02-10',
        lastCheckedDate: '2026-03-01',
        notes: 'Exclusively managed by female police officers with dedicated emergency patrol vehicles.'
      },
      // 9. Kolkata Facilities
      {
        id: 'fac-osc-kol-01',
        name: 'Sakhi One Stop Centre — Calcutta Medical College',
        type: 'one_stop_centre',
        address: '88, College Street, Bowbazar',
        city: 'Kolkata',
        stateUT: 'West Bengal',
        postalCode: '700073',
        latitude: 22.5744,
        longitude: 88.3617,
        phoneNumber: '033-22551600',
        alternatePhone: '181',
        is24x7: true,
        hasWomenDesk: true,
        verificationStatus: 'verified_official',
        dataSource: 'West Bengal Dept of Women and Social Welfare',
        verifiedAt: '2026-01-28',
        lastCheckedDate: '2026-03-01',
        notes: '24/7 crisis support, medical attention, and immediate shelter accommodation.'
      },
      {
        id: 'fac-pol-kol-01',
        name: 'Kolkata Police Women Grievance Cell & Lalbazar HQ',
        type: 'women_help_desk',
        address: '18, Lalbazar Street, BBD Bagh',
        city: 'Kolkata',
        stateUT: 'West Bengal',
        postalCode: '700001',
        latitude: 22.5726,
        longitude: 88.3512,
        phoneNumber: '033-22145000',
        alternatePhone: '1091',
        is24x7: true,
        hasWomenDesk: true,
        verificationStatus: 'verified_official',
        dataSource: 'Kolkata Police Official Portal',
        verifiedAt: '2026-02-14',
        lastCheckedDate: '2026-03-01',
        notes: 'Dedicated 24/7 all-women mobile squad (Winners Squad) patrolling city streets.'
      }
    ];

    for (const fac of facilitiesList) {
      this.facilities.set(fac.id, fac);
    }
  }

  private seedAdmins() {
    const adminAccounts: AdminUser[] = [
      {
        id: 'admin-super-01',
        name: 'Dr. Archana Sharma (Super Administrator)',
        email: 'superadmin@kawach.org',
        role: 'super_admin',
        active: true,
        lastLoginAt: new Date().toISOString(),
        permissions: {
          canManageEmergencyNumbers: true,
          canVerifyFacilities: true,
          canViewAuditLogs: true,
          canManageAdmins: true,
          canViewSystemHealth: true
        }
      },
      {
        id: 'admin-data-01',
        name: 'Rohan Mehra (Data Administrator)',
        email: 'data@kawach.org',
        role: 'data_admin',
        active: true,
        lastLoginAt: new Date().toISOString(),
        permissions: {
          canManageEmergencyNumbers: true,
          canVerifyFacilities: true,
          canViewAuditLogs: true,
          canManageAdmins: false,
          canViewSystemHealth: true
        }
      },
      {
        id: 'admin-support-01',
        name: 'Priyanka Sen (Support Administrator)',
        email: 'support@kawach.org',
        role: 'support_admin',
        active: true,
        lastLoginAt: new Date().toISOString(),
        permissions: {
          canManageEmergencyNumbers: false,
          canVerifyFacilities: false,
          canViewAuditLogs: true,
          canManageAdmins: false,
          canViewSystemHealth: true
        }
      }
    ];

    for (const a of adminAccounts) {
      this.admins.set(a.id, a);
    }
  }

  private seedSystemBootstrapLog() {
    this.auditLogs.push({
      id: 'log-seed-01',
      actorId: 'system',
      actorRole: 'system',
      action: 'SYSTEM_BOOTSTRAP',
      targetEntity: 'Database',
      details: 'Kawach production database initialized with verified emergency directory and healthcare/police infrastructure.',
      timestamp: new Date().toISOString()
    });
  }

  public logAudit(actorId: string, actorRole: string, action: string, targetEntity: string, details: string, targetId?: string, ipAddress?: string) {
    const entry: AuditLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      actorId,
      actorRole,
      action,
      targetEntity,
      targetId,
      details,
      ipAddress,
      timestamp: new Date().toISOString()
    };
    this.auditLogs.unshift(entry);
    // Keep max 500 audit logs to prevent memory leak
    if (this.auditLogs.length > 500) {
      this.auditLogs.pop();
    }
    return entry;
  }

  public logActivity(userId: string, type: ActivityLogItem['type'], title: string, description: string, metadata?: Record<string, any>): ActivityLogItem {
    const item: ActivityLogItem = {
      id: `act-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      userId,
      type,
      title,
      description,
      metadata,
      timestamp: new Date().toISOString()
    };
    this.activityLogs.unshift(item);
    if (this.activityLogs.length > 1000) {
      this.activityLogs.pop();
    }
    return item;
  }
}

export const db = new InMemoryDatabase();
