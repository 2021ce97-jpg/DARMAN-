# Phase 3 Implementation Tasks

## Overview
Phase 3 makes MediConnect production-ready with advanced features. Tasks are ordered by priority and dependency.

---

## Category 1: Complete Remaining UI

- [x] 1.1 Create Video Consultation Screen
  - [x] 1.1.1 Create `medi_connect/lib/screens/video_consultation_screen.dart` with call UI, camera/mic controls, and end-call confirmation
  - [x] 1.1.2 Create `medi_connect/lib/widgets/video_controls.dart` with mute, camera toggle, speaker, and end-call buttons
  - [x] 1.1.3 Add `agora_rtc_engine: ^6.3.0` and `permission_handler: ^11.0.1` to pubspec.yaml

- [x] 1.2 Create Enhanced Prescription Management Screens
  - [x] 1.2.1 Create `medi_connect/lib/screens/prescription_list_screen.dart` with history timeline, search, and filter
  - [x] 1.2.2 Create `medi_connect/lib/screens/prescription_detail_screen.dart` with download, share, and refill request
  - [x] 1.2.3 Create `medi_connect/lib/widgets/prescription_card.dart`

- [x] 1.3 Create Medical Records Gallery Screen
  - [x] 1.3.1 Create `medi_connect/lib/screens/medical_records_gallery_screen.dart` with grid view, categories, and share
  - [x] 1.3.2 Create `medi_connect/lib/screens/file_upload_screen.dart` with image/PDF picker
  - [x] 1.3.3 Create `medi_connect/lib/widgets/file_card.dart`
  - [x] 1.3.4 Add `image_picker: ^1.0.4` and `file_picker: ^6.1.1` to pubspec.yaml

---

## Category 2: State Management

- [ ] 2.1 Implement Riverpod State Management
  - [x] 2.1.1 Create `medi_connect/lib/providers/auth_provider.dart` with authentication state
  - [ ] 2.1.2 Create `medi_connect/lib/providers/doctor_provider.dart` with doctor list and search state
  - [ ] 2.1.3 Create `medi_connect/lib/providers/booking_provider.dart` with booking flow state
  - [ ] 2.1.4 Create `medi_connect/lib/providers/payment_provider.dart` with payment state
  - [ ] 2.1.5 Create `medi_connect/lib/providers/chat_provider.dart` with chat messages state
  - [ ] 2.1.6 Wrap app root with `ProviderScope` in `main.dart`

---

## Category 3: Push Notifications

- [ ] 3.1 Set Up Firebase Cloud Messaging
  - [ ] 3.1.1 Create `medi_connect/lib/services/fcm_service.dart` with token management and message handling
  - [ ] 3.1.2 Create `medi_connect/lib/services/local_notification_service.dart` for foreground notifications
  - [ ] 3.1.3 Enhance `backend/src/services/notification_service.js` to send FCM push notifications
  - [ ] 3.1.4 Add `firebase_messaging: ^14.7.6` and `flutter_local_notifications: ^16.3.0` to pubspec.yaml

---

## Category 4: In-App Messaging

- [ ] 4.1 Build Doctor-Patient Chat
  - [ ] 4.1.1 Create `backend/src/services/chat_service.js` with Firestore-backed real-time messaging
  - [ ] 4.1.2 Create `backend/src/routes/chat.routes.js` with send/history/read-receipt endpoints
  - [ ] 4.1.3 Create `medi_connect/lib/screens/chat_screen.dart` with message bubbles, image sharing, and typing indicator
  - [ ] 4.1.4 Create `medi_connect/lib/screens/chat_list_screen.dart` with conversation list and unread counts
  - [ ] 4.1.5 Create `medi_connect/lib/widgets/message_bubble.dart`
  - [ ] 4.1.6 Create `medi_connect/lib/services/chat_service.dart`

---

## Category 5: Health Tracking

- [ ] 5.1 Build Health Metrics Dashboard
  - [ ] 5.1.1 Create `backend/src/routes/health_metrics.routes.js` with CRUD for vitals
  - [ ] 5.1.2 Create `backend/src/services/health_metrics_service.js`
  - [ ] 5.1.3 Create `medi_connect/lib/models/health_metric_model.dart`
  - [ ] 5.1.4 Create `medi_connect/lib/screens/health_dashboard_screen.dart` with charts and history
  - [ ] 5.1.5 Create `medi_connect/lib/screens/add_health_metric_screen.dart`
  - [ ] 5.1.6 Create `medi_connect/lib/widgets/health_chart.dart`
  - [ ] 5.1.7 Add `fl_chart: ^0.65.0` to pubspec.yaml

---

## Category 6: Medication Reminders

- [ ] 6.1 Build Medication Reminder System
  - [ ] 6.1.1 Create `backend/src/routes/medication.routes.js` with CRUD for medications
  - [ ] 6.1.2 Create `backend/src/services/medication_service.js`
  - [ ] 6.1.3 Create `medi_connect/lib/screens/medication_reminders_screen.dart`
  - [ ] 6.1.4 Create `medi_connect/lib/screens/add_medication_screen.dart`
  - [ ] 6.1.5 Create `medi_connect/lib/widgets/medication_card.dart`
  - [ ] 6.1.6 Create `medi_connect/lib/services/medication_reminder_service.dart` with local notification scheduling

---

## Category 7: Lab Test Booking

- [ ] 7.1 Build Lab Test Booking System
  - [ ] 7.1.1 Create `backend/src/routes/lab_test.routes.js` with browse, book, and results endpoints
  - [ ] 7.1.2 Create `backend/src/services/lab_test_service.js`
  - [ ] 7.1.3 Create `medi_connect/lib/models/lab_test_model.dart`
  - [ ] 7.1.4 Create `medi_connect/lib/screens/lab_tests_screen.dart` with search and categories
  - [ ] 7.1.5 Create `medi_connect/lib/screens/lab_test_booking_screen.dart` with slot selection and payment
  - [ ] 7.1.6 Create `medi_connect/lib/screens/lab_results_screen.dart`

---

## Category 8: Pharmacy Integration

- [ ] 8.1 Build Medicine Ordering System
  - [ ] 8.1.1 Create `backend/src/routes/medicine_order.routes.js` with browse, cart, and order endpoints
  - [ ] 8.1.2 Create `backend/src/services/medicine_order_service.js`
  - [ ] 8.1.3 Create `medi_connect/lib/models/medicine_model.dart` and `order_model.dart`
  - [ ] 8.1.4 Create `medi_connect/lib/screens/pharmacy_screen.dart` with medicine browse and search
  - [ ] 8.1.5 Create `medi_connect/lib/screens/cart_screen.dart` with order summary and checkout
  - [ ] 8.1.6 Create `medi_connect/lib/screens/order_tracking_screen.dart`

---

## Category 9: Insurance Integration

- [ ]* 9.1 Build Insurance Management
  - [ ]* 9.1.1 Create `backend/src/routes/insurance.routes.js`
  - [ ]* 9.1.2 Create `backend/src/services/insurance_service.js`
  - [ ]* 9.1.3 Create `medi_connect/lib/screens/insurance_screen.dart`
  - [ ]* 9.1.4 Create `medi_connect/lib/models/insurance_model.dart`

---

## Category 10: Analytics & Monitoring

- [ ] 10.1 Set Up Firebase Analytics
  - [ ] 10.1.1 Add `firebase_analytics: ^10.7.4` to pubspec.yaml
  - [ ] 10.1.2 Create `medi_connect/lib/services/analytics_service.dart` with event tracking helpers
  - [ ] 10.1.3 Instrument key screens with screen-view and action events

- [ ] 10.2 Set Up Crash Reporting
  - [ ] 10.2.1 Add `firebase_crashlytics: ^3.4.8` to pubspec.yaml
  - [ ] 10.2.2 Configure Crashlytics in `main.dart` with Flutter error handler

---

## Category 11: Performance & Optimization

- [ ] 11.1 Optimize App Performance
  - [ ] 11.1.1 Add `cached_network_image: ^3.3.1` and replace all `Image.network` calls
  - [ ] 11.1.2 Add `shimmer: ^3.0.0` and implement skeleton loaders for list screens
  - [ ] 11.1.3 Implement pagination in doctor listing and search screens

- [ ] 11.2 Add Offline Support
  - [ ] 11.2.1 Add `connectivity_plus: ^5.0.2`, `hive: ^2.2.3`, `hive_flutter: ^1.1.0` to pubspec.yaml
  - [ ] 11.2.2 Create `medi_connect/lib/services/cache_service.dart` for Hive-backed offline caching
  - [ ] 11.2.3 Add offline banner widget to `main_scaffold.dart`
  - [ ] 11.2.4 Cache doctor list and appointment data for offline access

---

## Category 12: Security Enhancements

- [ ] 12.1 Enhance App Security
  - [ ] 12.1.1 Add `flutter_secure_storage: ^9.0.0` and migrate token storage from SharedPreferences
  - [ ] 12.1.2 Add `local_auth: ^2.1.8` and implement biometric lock screen
  - [ ] 12.1.3 Implement auto-logout after 15 minutes of inactivity

- [ ] 12.2 Update Firestore Security Rules
  - [ ] 12.2.1 Write production-ready `firestore.rules` with role-based access control
  - [ ] 12.2.2 Write `storage.rules` for Firebase Storage access control

---

## Category 13: UI/UX Enhancements

- [ ] 13.1 Add Animations & Transitions
  - [ ] 13.1.1 Add `lottie: ^3.0.0` to pubspec.yaml
  - [ ] 13.1.2 Add page transition animations via GoRouter
  - [ ] 13.1.3 Add Lottie success/error animations to payment and booking flows

- [ ] 13.2 Implement Dark Mode
  - [ ] 13.2.1 Create dark `ThemeData` in `medi_connect/lib/theme/`
  - [ ] 13.2.2 Add theme toggle to profile screen with SharedPreferences persistence

- [ ] 13.3 Add Localization (Dari/Pashto/English)
  - [ ] 13.3.1 Set up `flutter_localizations` and `intl` ARB workflow
  - [ ] 13.3.2 Create `lib/l10n/app_en.arb`, `app_fa.arb` (Dari), `app_ps.arb` (Pashto)
  - [ ] 13.3.3 Add language switcher to profile screen with RTL support

---

## Category 14: Testing

- [ ] 14.1 Write Unit Tests
  - [ ] 14.1.1 Write tests for `auth_service.dart`, `doctor_service.dart`, `booking_service_api.dart`
  - [ ] 14.1.2 Write tests for all model `fromJson`/`toJson` methods
  - [ ] 14.1.3 Write tests for Riverpod providers

- [ ] 14.2 Write Widget Tests
  - [ ] 14.2.1 Write widget tests for `login_screen.dart` and `register_screen_api.dart`
  - [ ] 14.2.2 Write widget tests for `doctor_listing_screen.dart` and `booking_summary_screen.dart`

- [ ] 14.3 Write Integration Tests
  - [ ] 14.3.1 Write integration test for full booking flow (search → profile → book → confirm)
  - [ ] 14.3.2 Write integration test for payment flow

---

## Category 15: Deployment

- [ ] 15.1 Deploy Backend to Cloud
  - [ ] 15.1.1 Create `backend/Dockerfile` for containerized deployment
  - [ ] 15.1.2 Create `backend/.github/workflows/deploy.yml` for CI/CD to Google Cloud Run
  - [ ] 15.1.3 Document environment variables and secrets setup

- [ ] 15.2 Deploy Flutter Web to Firebase Hosting
  - [ ] 15.2.1 Create `firebase.json` and `.firebaserc` for hosting configuration
  - [ ] 15.2.2 Configure PWA manifest and service worker
  - [ ] 15.2.3 Document build and deploy commands

- [ ]* 15.3 Prepare Mobile App for Stores
  - [ ]* 15.3.1 Configure Android signing and generate release APK/AAB
  - [ ]* 15.3.2 Write Play Store listing copy and prepare screenshots
