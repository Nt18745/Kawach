# HER-SAFE™ — Privacy Policy & Data Protection Charter

**Effective Date:** January 1, 2026  
**Last Revised:** March 15, 2026  
**Application Name:** HER-SAFE (Women's Emergency Assistance & Personal Safety Platform)  
**Governing Laws:** Digital Personal Data Protection Act (DPDPA 2023 - India), Information Technology Act (2000 & 2008 Amendments), IT (Reasonable Security Practices and Procedures and Sensitive Personal Data or Information) Rules 2011, and General Data Protection Regulation (GDPR) principles.

---

## 1. Executive Statement & Privacy Philosophy

**HER-SAFE** was conceived with a foundational principle: **"Safety without Surveillance."** We believe that an emergency personal safety tool must never become a tool of commercial tracking, user profiling, or invasive monitoring.

- **Zero Data Commercialization:** We do **NOT** sell, rent, monetize, or trade your personal information, location history, or contacts with advertisers, data brokers, or commercial third parties.
- **Zero Behavioral Ad Tracking:** There are zero advertisement SDKs, tracking pixels, behavioral telemetry cookies, or behavioral profiling tools embedded in HER-SAFE.
- **Local-First Processing:** Wherever technologically feasible, your safety data (including contacts, voice processing, emergency countdown timers, and emergency number directories) is processed and stored strictly on your local device.
- **Strict Need-to-Know Emergency Sharing:** Your real-time location is broadcast **ONLY** when you initiate an emergency SOS session, start a user-requested Safe Journey, or explicitly tap "Share Location" with your pre-selected emergency contacts and public safety answering points (ERSS 112).

---

## 2. Privacy-by-Design Compliance (The 7 Foundational Principles)

HER-SAFE is formally architected around the **7 Foundational Principles of Privacy-by-Design** formulated by Dr. Ann Cavoukian:

1. **Proactive not Reactive; Preventative not Remedial:**  
   Privacy risks (such as unauthorized location leakage or background microphone eavesdropping) are prevented by architectural barriers—such as ephemeral single-use location tokens and on-device voice processing—before any incident can occur.

2. **Privacy as the Default Setting:**  
   When HER-SAFE is installed, tracking is turned **OFF** by default. Background continuous location tracking is inactive until an explicit user action (e.g., triggering SOS or starting a Safe Journey) initiates it.

3. **Privacy Embedded into Design:**  
   Privacy is an integral core component of the core system architecture, not an afterthought or compliance patch. Local sandbox partitioning, ephemeral tokens, and immediate session termination are native primitives.

4. **Full Functionality — Positive-Sum, not Zero-Sum:**  
   Users do not have to sacrifice personal privacy to achieve life-saving protection. All critical features—including verified emergency number calling, offline dialers, fake incoming calls, and local safety timers—operate 100% offline without sending data to any remote server.

5. **End-to-End Security — Full Lifecycle Protection:**  
   From the millisecond location is sampled by the device's GPS hardware to its delivery to trusted contacts via encrypted temporary links, telemetry is secured via TLS 1.3 in transit and AES-256 equivalent cryptographic hashing at rest.

6. **Visibility and Transparency — Keep it Open:**  
   Every data point collected, retained, or transmitted is made completely visible to the user via the in-app Audit Log and Privacy Dashboard. Verification dates, government data sources, and permissions are openly inspectable.

7. **Respect for User Privacy — Keep it User-Centric:**  
   The user maintains total sovereignty over their data: 1-tap historical location purge, 1-tap instant account and record deletion, and total offline control.

---

## 3. Categories of Data Collected, Processing Purpose & Sensitivity Matrix

| Data Category | Specific Elements | Legal Basis & Primary Purpose | Storage Location | Retention Period |
| :--- | :--- | :--- | :--- | :--- |
| **Precise Geolocation** *(Sensitive)* | Latitude, longitude, altitude, accuracy radius (meters), speed, heading, reverse-geocoded street name | **Vital Interests & Emergency Rescue:** Transmitted only during active SOS, Safe Journey, or user-initiated location share to guide first responders (ERSS 112) and trusted guardians. | Volatile client memory + local device sandbox. Ephemerally cached on server during active SOS only. | Purged automatically upon session cancellation / safe arrival, or instantly via manual 1-tap purge in Settings. |
| **Audio & Microphone** *(Sensitive)* | Audio input stream captured via browser SpeechRecognition API | **Hands-Free Voice SOS:** Continuously matches spoken words against user-defined trigger phrases (e.g., *"I need help"*, *"Bachao"*). **Raw audio is NEVER recorded, saved, or uploaded.** | Processed strictly on-device in volatile system RAM. Never written to disk or network. | 0 seconds (Immediate ephemeral stream disposal). |
| **Trusted Contacts** | Contact name, phone number, relationship, notification priority | **Emergency Dispatch:** Used to transmit automated SMS emergency alerts and encrypted live tracking hyperlinks during an SOS or safety timer escalation. | Client device local storage (`localStorage`) + optional encrypted user backup vault. | Retained until manually deleted or edited by user. |
| **Emergency Medical ID** | Blood group, severe allergies, chronic conditions, emergency medical notes | **First Responder Medical Aid:** Displayed on the Active Emergency screen so ambulance crews or bystanders can deliver life-saving first aid. | Client device local storage + optional encrypted user backup. | Retained until manually edited or purged by user. |
| **Device Telemetry** | Battery percentage, charging state, network connectivity status (online/offline) | **Battery-Adaptive Power Management:** Throttles location polling from 5s intervals to 60s when battery falls below 15% to prevent phone shutdown during emergencies. | In-memory device state only. | Volatile runtime session only. |
| **Security PIN & Auth** | 4-digit PIN hash, optional biometric authentication token | **Unauthorized Access Prevention:** Prevents unauthorized persons from tampering with contacts or cancelling an active emergency SOS. | One-way cryptographic salt-hash in local storage. Plaintext PIN is never stored. | Until modified or removed by user in Settings. |

---

## 4. Deep-Dive: Sensitive Data Handling

### 4.1. Precise Real-Time Geolocation
- **Collection Threshold:** The W3C Geolocation API is queried with `enableHighAccuracy: true` to obtain GPS coordinates with accuracy up to ±5–15 meters.
- **Non-Continuous When Idle:** When no active emergency session, timer, or journey is running, HER-SAFE does **not** track or log your movements in the background.
- **Ephemeral Token Architecture:** When you share your location, HER-SAFE generates a cryptographically random, non-guessable temporary token (`/share/[token]`). This link expires automatically after **2 hours** or **immediately** upon clicking "Cancel SOS / I am Safe". Once cancelled, any recipient attempting to access the link receives an immediate HTTP 410 Gone / Revoked response.
- **1-Tap Purge Guarantee:** Users can navigate to **Settings → Privacy & Retention Controls** and tap **"Purge Historical Location Traces"** to permanently wipe all stored coordinate breadcrumbs across both client and server storage.

### 4.2. Microphone & Voice Recognition
- **On-Device Keyword Spotting:** HER-SAFE utilizes standard Web Speech Recognition. All audio phonetic decoding happens locally within your browser/operating system speech engine.
- **Zero Audio Storage:** HER-SAFE does not create, maintain, or store audio recording files (WAV, MP3, AAC, etc.). We do not transmit audio samples to remote artificial intelligence servers or cloud speech services.
- **User-Initiated Activation:** Voice recognition is **OFF** by default and can only be activated by explicitly pressing the Voice SOS button on the dashboard. A prominent visual pulsing microphone indicator is displayed at all times while active.
- **Immediate Deactivation:** As soon as a trigger phrase is recognized, or when the user taps "Stop Listening", the microphone stream is immediately released and terminated at the OS hardware level.

---

## 5. Offline Emergency Numbers & Data Storage Architecture

HER-SAFE stores a curated, verified catalog of 14 national and regional emergency helplines directly on the client device.

- **Storage Medium:** Browser LocalStorage (`her_safe_offline_emergency_numbers_v2`) and Service Worker Cache API.
- **Zero-Internet Dependency:** When the user device has no cellular data, Wi-Fi, or is in Airplane mode, the full directory—including 112 (ERSS), 181 (Women Helpline), 1091 (Women in Distress), 108 (Ambulance), 101 (Fire), 1098 (Childline), and 139 (Rail Madad)—remains fully searchable, filterable, and dialable.
- **Telephony Protocol:** Numbers are invoked via standard `tel:` URI schemes. This routes directly through the handset's cellular baseband chip to the telecommunications network (PSTN/VoLTE), completely bypassing the internet protocol (IP) stack.
- **Verification Integrity:** Emergency numbers are tagged with their verifying government ministry (Ministry of Home Affairs, Ministry of Women & Child Development, MoHFW), gazette verification dates, and offline availability badges.

---

## 6. Data Storage, Encryption & Security Controls

We enforce defense-in-depth engineering practices to secure all data:

1. **Transport Layer Security (TLS 1.3):** All communications between the application client and backend proxies use TLS 1.3 with Perfect Forward Secrecy (PFS) and strict HSTS headers.
2. **Storage Isolation:** Local storage elements are sandboxed within the application's unique origin. Third-party iframes or cross-origin scripts cannot access HER-SAFE storage keys.
3. **Role-Based Access Control (RBAC):** Administrative endpoints (such as emergency number verification and audit logs) are restricted to authenticated Super Admins with role-based access enforcement and immutable audit trails.
4. **Anti-Tamper PIN Protection:** Users can configure a 4-digit PIN to prevent an attacker or assailant from altering emergency contacts or silencing an active distress call.

---

## 7. User Rights & Data Sovereignty

In accordance with the **Digital Personal Data Protection Act (DPDPA 2023)** and international privacy frameworks (GDPR), HER-SAFE guarantees the following rights to every user:

1. **Right to Access & Portability:** You can download a complete, readable JSON export of all your stored profile data, contacts, and safety preferences at any time via **Settings → Export Cloud Backup**.
2. **Right to Correction & Rectification:** You can directly modify your full name, blood group, emergency medical conditions, trusted contacts, and emergency phrases at any time. Changes take effect immediately.
3. **Right to Erasure ("Right to be Forgotten"):** You have the unfettered right to permanently delete your data. You may execute:
   - **Purge Location History:** Deletes all coordinate points and location traces.
   - **Delete Account & Erase All Records:** Permanently drops your user profile, deletes all contacts, clears local storage caches, and invalidates active sessions.
4. **Right to Revoke Hardware Permissions:** You may revoke Location, Microphone, or Notification permissions at any moment via your device's operating system settings (Android App Permissions or iOS Privacy & Security settings). The app will gracefully fall back to manual offline dialer modes.

---

## 8. Third-Party Disclosures & Government Integration

- **Emergency First Responders (ERSS 112 & Women Helpline 181):** During an active SOS distress signal, your location and profile details are formatted to assist public safety dispatchers.
- **Trusted Contacts:** Automated SMS notifications containing your verified GPS coordinates and emergency dispatch text are sent only to the phone numbers you have explicitly entered into your Trusted Contacts list.
- **No Commercial Third Parties:** We do not partner with ad networks, data exchanges, analytics brokers, or commercial marketing platforms.

---

## 9. Contact Our Data Protection Officer (DPO)

If you have questions, feedback, or grievances regarding this Privacy Policy or your personal data rights, you may contact our dedicated Data Protection Officer:

- **Office:** Data Protection & Safety Architecture Office, HER-SAFE
- **Email:** `privacy@her-safe.internal` / `dpo@her-safe.gov.in`
- **Grievance Redressal Timeline:** All data access or deletion inquiries are acknowledged within 24 hours and fully executed within 72 hours.
- **Mailing Address:** Cyber Safety Division, Ministry of Home Affairs / C-DAC Partner Node, New Delhi, 110001, India.
