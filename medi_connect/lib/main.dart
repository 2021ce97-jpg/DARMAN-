import 'dart:async';
import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_app_check/firebase_app_check.dart';
import 'firebase_options.dart';
import 'config/app_config.dart';
import 'theme/app_theme.dart';
import 'providers/theme_provider.dart';
import 'providers/role_provider.dart';
import 'screens/main_scaffold.dart';
import 'screens/doctor_listing_screen.dart';
import 'screens/doctor_profile_screen.dart';
import 'models/doctor_model.dart';
import 'models/appointment_model.dart';
import 'screens/booking_summary_screen.dart';
import 'screens/health_records_screen.dart';
import 'screens/help_screen.dart';
import 'screens/login_screen.dart';
import 'screens/unified_register_screen.dart';
import 'screens/symptom_checker_screen.dart';
import 'screens/ai_chatbot_screen.dart';
import 'screens/payment_screen.dart';
import 'screens/prescription_list_screen.dart';
import 'screens/video_consultation_screen.dart';
import 'screens/notifications_screen.dart';
import 'screens/health_dashboard_screen.dart';
import 'screens/medication_reminders_screen.dart';
import 'screens/lab_tests_screen.dart';
import 'screens/pharmacy_screen.dart';
import 'screens/chat_screen.dart';
import 'screens/add_health_metric_screen.dart';
import 'services/auth_service.dart';
// Doctor screens
import 'screens/doctor/doctor_scaffold.dart';
import 'screens/doctor/doctor_appointment_detail_screen.dart';
import 'screens/doctor/write_prescription_screen.dart';
import 'screens/doctor/doctor_register_screen.dart';
// Admin screens
import 'screens/admin/admin_dashboard_screen.dart';
// FCM
import 'services/fcm_service.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  await Firebase.initializeApp(
    options: DefaultFirebaseOptions.currentPlatform,
  );

  // Optional: connect to local Firebase emulators when building with
  // --dart-define=USE_FIREBASE_EMULATOR=true
  const useEmulator = bool.fromEnvironment('USE_FIREBASE_EMULATOR', defaultValue: false);
  if (useEmulator) {
    // Note: Android emulators often require host '10.0.2.2' instead of 'localhost'
    const host = 'localhost';
    FirebaseFirestore.instance.useFirestoreEmulator(host, 8080);
    try {
      FirebaseAuth.instance.useAuthEmulator(host, 9099);
    } catch (_) {}
    debugPrint('Connected to Firebase emulators at $host');
  }

  await _initializeAppCheck();

  runApp(const ProviderScope(child: MediConnectApp()));

  // ── Post-start initialization ──────────────────────────────────────────
  WidgetsBinding.instance.addPostFrameCallback((_) {
    // Disable persistence on Web to avoid "Offline" issues with stale cache
    if (kIsWeb) {
      try {
        FirebaseFirestore.instance.settings = const Settings(
          persistenceEnabled: false,
          cacheSizeBytes: Settings.CACHE_SIZE_UNLIMITED,
        );
      } catch (e) {
        debugPrint('Firestore settings error: $e');
      }
    }

    // ── FCM: initialize push notifications (Non-blocking) ─────────────────
    unawaited(Future(() async {
      try {
        await FCMService().initialize().timeout(const Duration(seconds: 10));
        final user = FirebaseAuth.instance.currentUser;
        final token = FCMService().fcmToken;
        if (user != null && token != null) {
          await FirebaseFirestore.instance
              .collection('users')
              .doc(user.uid)
              .set({'fcmToken': token}, SetOptions(merge: true));
        }
      } catch (e) {
        debugPrint('FCM init error (non-fatal): $e');
      }
    }));
  });
}

Future<void> _initializeAppCheck() async {
  try {
    // Web: use reCAPTCHA site key (must be configured via dart-define or env)
    if (kIsWeb) {
      if (AppConfig.isAppCheckWebConfigured) {
        try {
          // Some firebase_app_check versions don't accept a webRecaptchaSiteKey parameter.
          // Call activate() without parameters to support older SDKs.
          await FirebaseAppCheck.instance.activate();
          debugPrint('App Check (web) activated (no webRecaptchaSiteKey param)');
        } catch (e) {
          debugPrint('App Check (web) activation skipped or not supported in this SDK: $e');
        }
      } else {
        debugPrint('App Check (web) not configured; skipping');
      }
      return;
    }

    // Mobile: prefer Play Integrity on Android, DeviceCheck on iOS
    try {
      await FirebaseAppCheck.instance.activate(
        androidProvider: AndroidProvider.playIntegrity,
        appleProvider: AppleProvider.deviceCheck,
      );
      debugPrint('App Check (mobile) activated using Play Integrity / DeviceCheck');
    } catch (e) {
      // Fallback to SafetyNet if Play Integrity not available
      try {
        await FirebaseAppCheck.instance.activate(
          androidProvider: AndroidProvider.safetyNet,
          appleProvider: AppleProvider.deviceCheck,
        );
        debugPrint('App Check (mobile) activated using SafetyNet / DeviceCheck');
      } catch (e2) {
        debugPrint('App Check activation failed: $e / $e2');
      }
    }
  } catch (e, st) {
    debugPrint('App Check init error (non-fatal): $e\n$st');
  }
}

class RouterNotifier extends ChangeNotifier {
  final Ref _ref;

  RouterNotifier(this._ref) {
    _ref.listen<AsyncValue<User?>>(
      authStateProvider,
      (_, _) => notifyListeners(),
    );
    _ref.listen<AsyncValue<UserRole>>(
      userRoleProvider,
      (_, _) => notifyListeners(),
    );
  }

  String? redirect(BuildContext context, GoRouterState state) {
    final authState = _ref.read(authStateProvider);
    final isLoggedIn = authState.value != null;
    final loc = state.matchedLocation;
    final isAuthPath = loc == '/login' || loc == '/register' || loc == '/register-doctor';

    if (!isLoggedIn && !isAuthPath) return '/login';

    if (isLoggedIn) {
      final role = _ref.read(userRoleProvider).value;

      if (isAuthPath) {
        if (role == null) return null;
        if (role.isDoctor) return '/doctor';
        if (role.isAdmin) return '/admin';
        return '/';
      }

      if (loc == '/' && role != null) {
        if (role.isDoctor) return '/doctor';
        if (role.isAdmin) return '/admin';
      }
    }

    return null;
  }
}

final routerNotifierProvider = Provider<RouterNotifier>((ref) {
  return RouterNotifier(ref);
});

final routerProvider = Provider<GoRouter>((ref) {
  final notifier = ref.watch(routerNotifierProvider);

  return GoRouter(
    initialLocation: '/',
    refreshListenable: notifier,
    redirect: notifier.redirect,
    routes: [
      // ── Main tabs ──────────────────────────────────────────────────────
      GoRoute(path: '/', builder: (_, _) => const MainScaffold(initialIndex: 0)),
      GoRoute(path: '/appointments', builder: (_, _) => const MainScaffold(initialIndex: 2)),
      GoRoute(path: '/profile', builder: (_, _) => const MainScaffold(initialIndex: 3)),
      GoRoute(path: '/search', builder: (_, _) => const MainScaffold(initialIndex: 1)),

      // ── Auth ───────────────────────────────────────────────────────────
      GoRoute(path: '/login', builder: (_, _) => const LoginScreen()),
      GoRoute(path: '/register', builder: (_, _) => const UnifiedRegisterScreen()),

      // ── Doctors ────────────────────────────────────────────────────────
      GoRoute(
        path: '/doctors',
        builder: (_, state) {
          final args = state.extra as Map<String, dynamic>? ?? {};
          return DoctorListingScreen(specialty: args['specialty']);
        }
      ),
      GoRoute(
        path: '/doctor_profile',
        builder: (_, state) => DoctorProfileScreen(doctor: state.extra as DoctorModel),
      ),

      // ── Booking & Payment ──────────────────────────────────────────────
      GoRoute(
        path: '/booking_summary',
        builder: (_, state) => BookingSummaryScreen(appointment: state.extra as AppointmentModel?),
      ),
      GoRoute(
        path: '/payment',
        builder: (_, state) {
          final args = state.extra as Map<String, dynamic>? ?? {};
          return PaymentScreen(
            bookingId: args['bookingId'] ?? '',
            amount: (args['amount'] ?? 0).toDouble(),
            doctorName: args['doctorName'] ?? 'Doctor',
          );
        },
      ),

      // ── Health Records ─────────────────────────────────────────────────
      GoRoute(path: '/health_records', builder: (_, _) => const HealthRecordsScreen()),
      GoRoute(path: '/health_dashboard', builder: (_, _) => const HealthDashboardScreen()),
      GoRoute(path: '/add_health_metric', builder: (_, _) => const AddHealthMetricScreen()),

      // ── Prescriptions ──────────────────────────────────────────────────
      GoRoute(path: '/prescriptions', builder: (_, _) => const PrescriptionListScreen()),

      // ── Medications ────────────────────────────────────────────────────
      GoRoute(path: '/medication_reminders', builder: (_, _) => const MedicationRemindersScreen()),

      // ── Lab Tests ──────────────────────────────────────────────────────
      GoRoute(path: '/lab_tests', builder: (_, _) => const LabTestsScreen()),

      // ── Pharmacy ───────────────────────────────────────────────────────
      GoRoute(path: '/pharmacy', builder: (_, _) => const PharmacyScreen()),

      // ── AI & Symptom Checker ───────────────────────────────────────────
      GoRoute(path: '/ai_chat', builder: (_, _) => const AIChatbotScreen()),
      GoRoute(path: '/symptom_checker', builder: (_, _) => const SymptomCheckerScreen()),

      // ── Chat ───────────────────────────────────────────────────────────
      GoRoute(
        path: '/chat',
        builder: (_, state) {
          final args = state.extra as Map<String, dynamic>? ?? {};
          return ChatScreen(
            doctorId: args['doctorId'],
            doctorName: args['doctorName'],
            doctorSpecialty: args['doctorSpecialty'],
            doctorImageUrl: args['doctorImageUrl'],
            isAIChat: args['isAIChat'] ?? false,
          );
        },
      ),

      // ── Video Consultation ─────────────────────────────────────────────
      GoRoute(
        path: '/video_consultation',
        builder: (_, state) {
          final args = state.extra as Map<String, dynamic>? ?? {};
          return VideoConsultationScreen(
            consultationId: args['consultationId'] ?? '',
            doctorName: args['doctorName'] ?? 'Doctor',
            doctorSpecialty: args['doctorSpecialty'] ?? '',
            doctorImageUrl: args['doctorImageUrl'],
            userId: args['userId'] ?? '',
            role: args['role'] ?? 'patient',
          );
        },
      ),

      // ── Notifications ──────────────────────────────────────────────────
      GoRoute(path: '/notifications', builder: (_, _) => const NotificationsScreen()),

      // ── Help ───────────────────────────────────────────────────────────
      GoRoute(path: '/help', builder: (_, _) => const HelpScreen()),

      // ── Doctor Registration ────────────────────────────────────────────
      GoRoute(
        path: '/register-doctor',
        builder: (_, _) => const DoctorRegisterScreen(),
      ),

      // ── Doctor Shell (tabs) ───────────────────────────────────────────
      GoRoute(
        path: '/doctor',
        builder: (_, _) => const DoctorScaffold(initialIndex: 0),
      ),
      GoRoute(
        path: '/doctor/appointments',
        builder: (_, _) => const DoctorScaffold(initialIndex: 1),
      ),
      GoRoute(
        path: '/doctor/patients',
        builder: (_, _) => const DoctorScaffold(initialIndex: 2),
      ),
      GoRoute(
        path: '/doctor/profile',
        builder: (_, _) => const DoctorScaffold(initialIndex: 3),
      ),

      // ── Doctor Detail Screens ─────────────────────────────────────────
      GoRoute(
        path: '/doctor/appointment-detail',
        builder: (_, state) {
          final appt = state.extra as AppointmentModel;
          return DoctorAppointmentDetailScreen(appointment: appt);
        },
      ),
      GoRoute(
        path: '/doctor/write-prescription',
        builder: (_, state) {
          final args = state.extra as Map<String, dynamic>? ?? {};
          return WritePrescriptionScreen(
            patientName: args['patientName'],
            patientId: args['patientId'],
            appointmentId: args['appointmentId'],
          );
        },
      ),

      // ── Admin ─────────────────────────────────────────────────────────
      GoRoute(
        path: '/admin',
        builder: (_, _) => const AdminDashboardScreen(),
      ),
    ],
  );
});

class MediConnectApp extends ConsumerWidget {
  const MediConnectApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final themeMode = ref.watch(themeProvider);
    final router = ref.watch(routerProvider);

    return MaterialApp.router(
      title: 'HealthLink — DARMAN',
      theme: AppTheme.lightTheme,
      darkTheme: AppTheme.darkTheme,
      themeMode: themeMode,
      routerConfig: router,
      debugShowCheckedModeBanner: false,
    );
  }
}

