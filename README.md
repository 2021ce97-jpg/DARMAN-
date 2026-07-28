# DARMAN MediConnect - Healthcare Platform for Afghanistan

Connecting patients, doctors, hospitals, labs, and pharmacies across Afghanistan.

---

## Live Service Links

| Service | URL | Status |
|---------|-----|--------|
| Patient Web App (Flutter) | https://mediconnect-4b155.web.app | Live |
| Backend API | https://darman.onrender.com | Live |
| API Health Check | https://darman.onrender.com/health | Live |
| Admin Dashboard (Next.js) | Not yet deployed to Vercel | Pending |
| Firebase Console | https://console.firebase.google.com/project/mediconnect-4b155 | Active |
| Firestore Database | https://console.firebase.google.com/project/mediconnect-4b155/firestore | Active |
| Firebase Auth | https://console.firebase.google.com/project/mediconnect-4b155/authentication | Active |
| Firebase Storage | https://console.firebase.google.com/project/mediconnect-4b155/storage | Active |

---

## Test Accounts

| Email | Password | Role |
|-------|----------|------|
| patient@darman.af | Darman2026! | Patient |
| admin@darman.af | Darman2026! | Admin |
| dr.karimi@darman.af | Darman2026! | Doctor |
| dr.noori@darman.af | Darman2026! | Doctor |
| dr.ahmadzai@darman.af | Darman2026! | Doctor |
| dr.sultani@darman.af | Darman2026! | Doctor |

---

## Project Progress

### Phase 1 - Core MVP [100% COMPLETE]
- Firebase Auth with role-based routing (patient / doctor / admin)
- Patient Flutter app - 25+ screens
- Doctor Flutter app - dedicated dashboard with appointments, patients, prescriptions
- Admin Flutter screen
- Backend API (Node.js + Fastify) - 14 route modules, 40+ endpoints
- Firestore with seeded doctor, hospital, lab, pharmacy data
- Android APK built and tested

### Phase 2 - Enhanced Features [90% COMPLETE]
- AI Chatbot (Gemini API - configured in backend + mobile)
- Symptom checker screen
- Video consultation screen (Agora service built, needs credentials)
- Prescription management (create, list, detail screens)
- Payment screen + backend service (needs HesabPay credentials)
- Health dashboard + vitals tracking
- Lab tests and pharmacy screens
- Push notifications (FCM integrated)
- PENDING: Set AGORA_APP_ID + AGORA_APP_CERTIFICATE in Render env vars
- PENDING: Set HESABPAY_API_KEY in Render env vars

### Phase 3 - Admin Web Dashboard [70% COMPLETE]
- Next.js 14 admin dashboard built locally
- 5 panels: Overview, Doctors, Patients, Bookings, Analytics
- Login page with credentials guard
- NOT DEPLOYED - run: cd admin-dashboard && npx vercel deploy --prod
- Panels currently use mock data - needs live Firestore connection

### Phase 4 - Localization and Production Polish [0% NOT STARTED]
- Dari and Pashto language support
- RTL layout support
- Google Play Store submission
- Admin dashboard connected to real Firebase data

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Mobile/Web App | Flutter 3.41 + Riverpod + GoRouter |
| Backend API | Node.js 24 + Fastify 5 |
| Database | Firebase Firestore |
| Auth | Firebase Authentication |
| Hosting | Firebase Hosting (Flutter web) |
| Backend Host | Render.com |
| Admin Dashboard | Next.js 14 + Tailwind CSS |
| AI | Google Gemini API |
| Video Calls | Agora SDK |
| Payments | HesabPay (Afghanistan) |
| Notifications | Firebase Cloud Messaging |

---

## Quick Start

Run Backend: cd backend && npm install && node src/server.js -> http://localhost:3000
Run Flutter:  cd medi_connect && flutter pub get && flutter run -d chrome -> http://localhost:8080
Run Admin:    cd admin-dashboard && npm install && npm run dev -> http://localhost:3001
Build APK:    cd medi_connect && flutter build apk --release

---

## Next Actions (Priority Order)

1. Deploy admin dashboard: cd admin-dashboard && npx vercel deploy --prod
2. Add Agora credentials in Render dashboard (AGORA_APP_ID, AGORA_APP_CERTIFICATE)
3. Add HesabPay credentials in Render dashboard (HESABPAY_API_KEY)
4. Connect admin dashboard panels to live Firestore
5. Add Dari/Pashto localization to Flutter app
6. Submit APK to Google Play Store

---

Last updated: July 28, 2026 - v1.2.0
