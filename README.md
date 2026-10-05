# 🛡️ KAWACH (कवच) — Production Women & Personal Safety Network

> **Production-Grade Personal Guardian Platform**  
> High-Availability SOS Engine • Real-time GPS Tracking • Cryptographic Evidence Vault • Multilingual Offline-First Architecture

---

## 📑 Table of Contents
1. [Architecture Overview](#1-architecture-overview)
2. [Prerequisites](#2-prerequisites)
3. [Installation & Setup](#3-installation--setup)
4. [Environment Variables](#4-environment-variables)
5. [Database Architecture & Schema](#5-database-architecture--schema)
6. [Authentication & Session Security](#6-authentication--session-security)
7. [SMS & Telecom Integration](#7-sms--telecom-integration)
8. [Google Maps & Offline Tile Caching](#8-google-maps--offline-tile-caching)
9. [1 TB Cloud Storage & Evidence Vault](#9-1-tb-cloud-storage--evidence-vault)
10. [Multi-Channel Notification Dispatcher](#10-multi-channel-notification-dispatcher)
11. [Local Development](#11-local-development)
12. [Production Deployment (Docker & Cloud Run)](#12-production-deployment-docker--cloud-run)
13. [Automated Regression Testing](#13-automated-regression-testing)
14. [High-Throughput Load Testing](#14-high-throughput-load-testing)
15. [Security & Zero-Trust Defense](#15-security--zero-trust-defense)
16. [Backup & Atomic State Persistence](#16-backup--atomic-state-persistence)
17. [Disaster Recovery & Offline Resilience](#17-disaster-recovery--offline-resilience)
18. [Troubleshooting & Support](#18-troubleshooting--support)

---

## 1. Architecture Overview

KAWACH operates as a resilient, fault-tolerant dual-layer engine:
- **Client Tier**: Vite-powered React 19 Single Page Application (PWA) with Tailwind CSS, Leaflet/Google Maps, Web Audio siren generator, and Service Worker background sync.
- **Node.js Gateway (`server.ts`)**: Express server on port 3000 handling client-side SPA routing, Vite middlewares in development, and proxy routing to the Python microservice.
- **Python Core Engine (`app/` & `her_safe.py`)**: Multi-threaded REST service on port 8000 powering mission-critical emergency SOS state transitions, Haversine geospatial indexing, 1 TB Evidence Vault checksum validation, and SMS routing.

```
[ PWA Client (Browser / Mobile) ]
       │
       ▼ (Port 3000)
[ Express Gateway (server.ts) ] ── (Static Assets / Vite / Dist)
       │
       ▼ (Port 8000 Proxy)
[ Modular Python Core Engine (app/) ]
   ├── app/config/         (Settings & Provider credentials)
   ├── app/security/       (Salting, PIN verification, Rate Limiting, RBAC)
   ├── app/auth/           (E.164 verification, OTP session manager)
   ├── app/sos/            (Idempotent SOS engine, telemetry, breadcrumbs)
   ├── app/location/       (Haversine distance, bearing, temporary share links)
   ├── app/notifications/  (SMS gateway, Twilio/Fast2SMS/Web Share fallback)
   ├── app/recordings/     (1 TB Evidence Vault, SHA-256 tamper-proofing)
   ├── app/emergency_services/ (Verified MHA/MoWCD emergency directories)
   ├── app/database/       (Atomic writes, JSON persistent store)
   └── app/monitoring/     (Health probes, audit logging, telemetry metrics)
```

---

## 2. Prerequisites
- **Node.js**: v20 LTS or v22 LTS
- **Python**: v3.10+ (Standard library only; zero pip runtime dependencies required)
- **NPM**: v10+

---

## 3. Installation & Setup

1. **Clone repository**:
   ```bash
   git clone https://github.com/maniranjan/kawach.git
   cd kawach
   ```

2. **Install Node.js dependencies**:
   ```bash
   npm install
   ```

3. **Verify Python environment**:
   ```bash
   python3 her_safe.py --test
   ```

---

## 4. Environment Variables

Create `.env` based on `.env.example`:

| Variable | Description | Default |
|---|---|---|
| `PORT` | Express Gateway HTTP Port | `3000` |
| `PYTHON_PORT` | Python Core Engine Port | `8000` |
| `APP_SECRET_KEY` | Salt for cryptographic signatures & PIN hashing | Random 64-char string |
| `SMS_PROVIDER` | SMS Provider: `twilio`, `fast2sms`, or `console_fallback` | `console_fallback` |
| `TWILIO_ACCOUNT_SID` | Twilio Account SID (if using Twilio) | `""` |
| `TWILIO_AUTH_TOKEN` | Twilio Auth Token (if using Twilio) | `""` |
| `TWILIO_PHONE_NUMBER` | Originating Twilio emergency number | `""` |
| `FAST2SMS_API_KEY` | Fast2SMS Indian gateway API key | `""` |
| `STORAGE_BUCKET_NAME` | Cloud storage bucket name | `ai-studio-kawach-vault` |

---

## 5. Database Architecture & Schema

The system uses an ACID-compliant thread-safe JSON persistent database (`her_safe_db.json`) utilizing **atomic file replaces** (`os.replace`) to guarantee zero corruption in case of unexpected process termination:
- `user`: Authenticated user profile (E.164 phone, blood group, medical notes, PIN hash).
- `contacts`: Verified trusted emergency contacts with alert priority order.
- `active_sos`: Active emergency incident status, starting location, and live telemetry breadcrumbs.
- `emergency_history`: Historical emergency sessions with resolution notes and timestamps.
- `evidence_vault`: Encrypted incident recordings, media, and SHA-256 tamper-proof checksums.
- `storage_metrics`: Real-time 1 TB quota tracking (allocated bytes, used bytes, file count).
- `audit_logs`: Immutable chronological log of all security and emergency operations.

---

## 6. Authentication & Session Security
- **E.164 Phone Normalization**: Automatically validates international dialing prefixes.
- **Hashed OTP Storage**: Plaintext OTP codes are never persisted; stored as salted SHA-256 hashes.
- **Brute-Force Lockout**: Strictly enforces a 3-attempt limit with 15-second cooldown and 5-minute expiration.
- **Zero Technical Errors**: Never leaks raw backend exceptions to the user UI.

---

## 7. SMS & Telecom Integration
- **Carrier Agnostic**: Supports Twilio, Fast2SMS (India), and direct device native Web SMS intents.
- **Character Budget Optimization**: Formats emergency messages under 160 characters for maximum telecom delivery speed.
- **Idempotency**: Prevents sending duplicate SMS bursts if network retries occur.

---

## 8. Google Maps & Offline Tile Caching
- **Interactive Leaflet Engine**: Custom high-contrast Leaflet tiles and Google Maps location search.
- **IndexedDB Offline Tile Cache**: Automatically caches open map tiles locally so maps remain interactive during complete cell coverage dropouts.
- **Cryptographic Share Links**: `/live/:token` links expire automatically after 2 hours and can be revoked instantly.

---

## 9. 1 TB Cloud Storage & Evidence Vault
- **Tamper-Proof Integrity**: Every uploaded voice memo or incident recording is hashed using SHA-256.
- **Quota Tracking**: Dedicated 1 TB (1,000,000,000,000 bytes) allocation counter with byte-level accuracy.
- **Resumable Chunks**: Client captures audio via standard Web MediaRecorder API.

---

## 10. Multi-Channel Notification Dispatcher
- Dispatches emergency alerts across SMS, Push Notification, Web Share API, and in-app emergency banners.
- Exponential backoff retry logic (attempts 1 to 3 with backoff intervals).
- Granular delivery status: `SENT`, `DELIVERED`, `FAILED`, `PENDING`.

---

## 11. Local Development

Run the full-stack development environment (Node.js + Python microservice):
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 12. Production Deployment (Docker & Cloud Run)

### Using Docker Compose
```bash
docker compose up -d --build
```

### Manual Docker Build
```bash
docker build -t kawach-safety-network .
docker run -p 3000:3000 -p 8000:8000 kawach-safety-network
```

---

## 13. Automated Regression Testing

Execute the comprehensive automated test suite (100% pure Python assertions):
```bash
python3 her_safe.py --test
```
**Test Coverage**:
1. Phone Number E.164 Normalization
2. Cryptographic Salted PIN Hashing & Verification
3. OTP Generation, Delivery & Verification Flow
4. OTP Replay Attack Prevention
5. Emergency SOS Incident Creation
6. Emergency SOS Idempotency Protection
7. Live Location Telemetry & Breadcrumbs Tracking
8. SOS Safe Resolution & Token Revocation
9. Haversine Geolocation Distance Accuracy
10. Compass Bearing Calculation
11. Forged Emergency Link Rejection (HTTP 404/410)
12. Rate Limiter & SOS Emergency Bypass
13. Input Sanitization & Injection Defense
14. Cloud Evidence Vault SHA-256 Integrity Verification
15. High-Throughput Concurrency Simulation (50 ops)

---

## 14. High-Throughput Load Testing

The platform handles heavy concurrent loads with sub-5 millisecond response times on Core logic:
```bash
python3 -c "from app.tests.test_load import run_load_tests; print(run_load_tests(100))"
```

---

## 15. Security & Zero-Trust Defense
- **Zero Trust Principle**: Client claims are never trusted; role, ownership, and tokens are validated server-side.
- **IDOR Defense**: Users can only query and mutate their own contacts, incidents, and recordings.
- **Tamper Resistance**: Audit logs are append-only.
- **Emergency Priority**: Rate limiters throttle suspicious endpoints while giving instant zero-latency bypass to emergency SOS triggers.

---

## 16. Backup & Atomic State Persistence
- Atomic staging writes eliminate corrupted JSON files.
- Automated backup export API (`/api/backup/export`) allows secure encrypted snapshots.

---

## 17. Disaster Recovery & Offline Resilience
- When offline, Service Worker (`sw.js`) intercepts SOS calls, queues emergency alerts in IndexedDB, and automatically dispatches alerts via Web Share API as soon as network reconnection is detected.
- Map tiles are served directly from local IndexedDB cache when disconnected.

---

## 18. Troubleshooting & Support

- **Dev Server Port Conflict**: Ensure ports 3000 and 8000 are not occupied by other background processes.
- **GPS Coordinates Stale**: Ensure browser geolocation permissions are granted (`geolocation` in `metadata.json`).
- **Microphone Recording Permission**: When testing voice memo capture, verify microphone permission is allowed in browser settings.

---

**KAWACH (कवच) — Your Guardian Safety Shield**  
*Built for real-world reliability, mission-critical safety, and complete user privacy.*
