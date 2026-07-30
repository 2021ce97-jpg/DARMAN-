import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../services/auth_service.dart';
import '../models/user_model.dart';

// Re-export auth service providers
export '../services/auth_service.dart' show authStateProvider, authServiceProvider;

// ─── Authentication State ────────────────────────────────────────────────────

/// Represents the current authentication state
class AuthState {
  final bool isLoading;
  final User? firebaseUser;
  final UserModel? userProfile;
  final String? error;
  final bool isOffline;

  const AuthState({
    this.isLoading = false,
    this.firebaseUser,
    this.userProfile,
    this.error,
    this.isOffline = false,
  });

  bool get isAuthenticated => firebaseUser != null;
  bool get hasProfile => userProfile != null;
  String? get uid => firebaseUser?.uid;
  String get userRole => userProfile?.role ?? 'patient';
  bool get isPatient => userRole == 'patient';
  bool get isDoctor => userRole == 'doctor';
  bool get isAdmin => userRole == 'admin';

  AuthState copyWith({
    bool? isLoading,
    User? firebaseUser,
    UserModel? userProfile,
    String? error,
    bool? isOffline,
    bool clearError = false,
  }) {
    return AuthState(
      isLoading: isLoading ?? this.isLoading,
      firebaseUser: firebaseUser ?? this.firebaseUser,
      userProfile: userProfile ?? this.userProfile,
      error: clearError ? null : (error ?? this.error),
      isOffline: isOffline ?? this.isOffline,
    );
  }

  @override
  String toString() => 'AuthState(isLoading: $isLoading, isAuth: $isAuthenticated, role: $userRole, error: $error)';
}

// ─── Authentication Provider ─────────────────────────────────────────────────

class AuthNotifier extends StateNotifier<AuthState> {
  final AuthService _authService;
  final FirebaseFirestore _firestore;

  AuthNotifier(this._authService, this._firestore) : super(const AuthState()) {
    _init();
  }

  /// Initialize authentication state and listen to auth changes
  Future<void> _init() async {
    state = state.copyWith(isLoading: true);

    try {
      // Initialize auth service
      await _authService.initialize();

      // Listen to Firebase Auth state changes
      _authService.authStateChanges.listen(_onAuthStateChanged);

      // Load offline user profile if available
      await _loadOfflineUserProfile();
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: 'Failed to initialize authentication: ${e.toString()}',
      );
    }
  }

  /// Handle Firebase Auth state changes
  Future<void> _onAuthStateChanged(User? firebaseUser) async {
    state = state.copyWith(
      firebaseUser: firebaseUser,
      isLoading: firebaseUser != null, // Load profile if user exists
      clearError: true,
    );

    if (firebaseUser != null) {
      await _loadUserProfile(firebaseUser.uid);
    } else {
      // User signed out - clear profile and offline cache
      state = state.copyWith(userProfile: null, isLoading: false);
      await _clearOfflineUserProfile();
    }
  }

  /// Load user profile from Firestore or cache
  Future<void> _loadUserProfile(String uid) async {
    try {
      // Try to load from Firestore first
      final doc = await _firestore.collection('users').doc(uid).get();
      
      if (doc.exists) {
        final userProfile = UserModel.fromFirestore(doc);
        state = state.copyWith(
          userProfile: userProfile,
          isLoading: false,
          isOffline: false,
        );
        
        // Cache profile offline
        await _cacheUserProfileOffline(userProfile);
      } else {
        // Profile doesn't exist in Firestore, might be new user
        state = state.copyWith(
          isLoading: false,
          error: 'User profile not found. Please complete your profile.',
        );
      }
    } catch (e) {
      // Firestore failed, try loading from offline cache
      final cachedProfile = await _loadOfflineUserProfile();
      if (cachedProfile == null) {
        state = state.copyWith(
          isLoading: false,
          isOffline: true,
          error: 'Unable to load user profile. Check your connection.',
        );
      }
    }
  }

  /// Sign in with email and password
  Future<bool> signInWithEmail(String email, String password) async {
    state = state.copyWith(isLoading: true, clearError: true);

    try {
      final result = await _authService.signInWithEmail(email, password);
      
      if (result['success'] == true) {
        // AuthStateChanged will handle loading the profile
        return true;
      } else {
        state = state.copyWith(
          isLoading: false,
          error: _parseAuthError(result['error']),
        );
        return false;
      }
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: 'Sign in failed: ${e.toString()}',
      );
      return false;
    }
  }

  /// Sign up with email and password
  Future<bool> signUpWithEmail(String email, String password, String name, String phone) async {
    state = state.copyWith(isLoading: true, clearError: true);

    try {
      final result = await _authService.signUpWithEmail(email, password, name, phone);
      
      if (result['success'] == true) {
        // AuthStateChanged will handle loading/creating the profile
        return true;
      } else {
        state = state.copyWith(
          isLoading: false,
          error: _parseAuthError(result['error']),
        );
        return false;
      }
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: 'Sign up failed: ${e.toString()}',
      );
      return false;
    }
  }

  /// Update user profile
  Future<bool> updateProfile(Map<String, dynamic> updates) async {
    if (!state.isAuthenticated) return false;

    state = state.copyWith(isLoading: true, clearError: true);

    try {
      final result = await _authService.updateUserProfile(updates);
      
      if (result['success'] == true) {
        // Reload profile to get updated data
        await _loadUserProfile(state.uid!);
        return true;
      } else {
        state = state.copyWith(
          isLoading: false,
          error: result['error'] ?? 'Failed to update profile',
        );
        return false;
      }
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: 'Update failed: ${e.toString()}',
      );
      return false;
    }
  }

  /// Send password reset email
  Future<bool> sendPasswordResetEmail(String email) async {
    state = state.copyWith(isLoading: true, clearError: true);

    try {
      await _authService.sendPasswordResetEmail(email);
      state = state.copyWith(isLoading: false);
      return true;
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: 'Password reset failed: ${e.toString()}',
      );
      return false;
    }
  }

  /// Sign out
  Future<void> signOut() async {
    state = state.copyWith(isLoading: true);
    
    try {
      await _authService.signOut();
      // AuthStateChanged will handle clearing the state
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: 'Sign out failed: ${e.toString()}',
      );
    }
  }

  /// Delete account
  Future<bool> deleteAccount() async {
    if (!state.isAuthenticated) return false;

    state = state.copyWith(isLoading: true, clearError: true);

    try {
      await _authService.deleteAccount();
      return true;
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: 'Account deletion failed: ${e.toString()}',
      );
      return false;
    }
  }

  /// Clear error state
  void clearError() {
    state = state.copyWith(clearError: true);
  }

  /// Refresh authentication token
  Future<void> refreshToken() async {
    try {
      await _authService.refreshToken();
    } catch (e) {
      state = state.copyWith(
        error: 'Token refresh failed: ${e.toString()}',
      );
    }
  }

  /// Cache user profile offline using SharedPreferences
  Future<void> _cacheUserProfileOffline(UserModel profile) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final profileData = {
        'uid': profile.uid,
        'name': profile.name,
        'email': profile.email,
        'role': profile.role,
        'phone': profile.phone,
        'photoUrl': profile.photoUrl,
        'bloodType': profile.bloodType,
        'weight': profile.weight,
        'height': profile.height,
        'allergies': profile.allergies,
        'dateOfBirth': profile.dateOfBirth?.toIso8601String(),
        'gender': profile.gender,
        'createdAt': profile.createdAt.toIso8601String(),
      };
      
      await prefs.setString('cached_user_profile', profileData.toString());
    } catch (e) {
      // Silently fail offline caching
    }
  }

  /// Load user profile from offline cache
  Future<UserModel?> _loadOfflineUserProfile() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final cachedData = prefs.getString('cached_user_profile');
      
      if (cachedData != null) {
        // In a real implementation, you'd use proper JSON serialization
        // For now, we'll just mark as offline mode
        state = state.copyWith(isOffline: true);
        return null; // Return null for now, implement proper deserialization later
      }
    } catch (e) {
      // Silently fail offline loading
    }
    return null;
  }

  /// Clear offline user profile cache
  Future<void> _clearOfflineUserProfile() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.remove('cached_user_profile');
    } catch (e) {
      // Silently fail
    }
  }

  /// Parse Firebase Auth errors into user-friendly messages
  String _parseAuthError(String? error) {
    if (error == null) return 'Unknown error occurred';
    
    final errorCode = error.toLowerCase();
    
    if (errorCode.contains('user-not-found')) {
      return 'No account found with this email address';
    } else if (errorCode.contains('wrong-password')) {
      return 'Incorrect password';
    } else if (errorCode.contains('email-already-in-use')) {
      return 'An account already exists with this email address';
    } else if (errorCode.contains('weak-password')) {
      return 'Password is too weak. Please use at least 6 characters';
    } else if (errorCode.contains('invalid-email')) {
      return 'Please enter a valid email address';
    } else if (errorCode.contains('network-request-failed')) {
      return 'Network error. Please check your connection';
    } else if (errorCode.contains('too-many-requests')) {
      return 'Too many attempts. Please try again later';
    } else {
      return error;
    }
  }
}

// ─── Providers ───────────────────────────────────────────────────────────────

final authNotifierProvider = StateNotifierProvider<AuthNotifier, AuthState>((ref) {
  final authService = ref.watch(authServiceProvider);
  final firestore = FirebaseFirestore.instance;
  return AuthNotifier(authService, firestore);
});

// ─── Convenience Providers ───────────────────────────────────────────────────

/// Current Firebase Auth user
final currentFirebaseUserProvider = Provider<User?>((ref) {
  return ref.watch(authNotifierProvider).firebaseUser;
});

/// Current user profile
final currentUserProvider = Provider<UserModel?>((ref) {
  return ref.watch(authNotifierProvider).userProfile;
});

/// Current user UID
final currentUidProvider = Provider<String?>((ref) {
  return ref.watch(authNotifierProvider).uid;
});

/// Is user authenticated
final isLoggedInProvider = Provider<bool>((ref) {
  return ref.watch(authNotifierProvider).isAuthenticated;
});

/// Is authentication loading
final isAuthLoadingProvider = Provider<bool>((ref) {
  return ref.watch(authNotifierProvider).isLoading;
});

/// Authentication error
final authErrorProvider = Provider<String?>((ref) {
  return ref.watch(authNotifierProvider).error;
});

/// User role
final userRoleProvider = Provider<String>((ref) {
  return ref.watch(authNotifierProvider).userRole;
});

/// Is user a patient
final isPatientProvider = Provider<bool>((ref) {
  return ref.watch(authNotifierProvider).isPatient;
});

/// Is user a doctor
final isDoctorProvider = Provider<bool>((ref) {
  return ref.watch(authNotifierProvider).isDoctor;
});

/// Is user an admin
final isAdminProvider = Provider<bool>((ref) {
  return ref.watch(authNotifierProvider).isAdmin;
});

/// User display name
final userDisplayNameProvider = Provider<String>((ref) {
  final userProfile = ref.watch(currentUserProvider);
  final firebaseUser = ref.watch(currentFirebaseUserProvider);
  
  return userProfile?.name ?? 
         firebaseUser?.displayName ?? 
         'User';
});

/// User email
final userEmailProvider = Provider<String?>((ref) {
  final userProfile = ref.watch(currentUserProvider);
  final firebaseUser = ref.watch(currentFirebaseUserProvider);
  
  return userProfile?.email ?? firebaseUser?.email;
});

/// Is offline mode
final isOfflineModeProvider = Provider<bool>((ref) {
  return ref.watch(authNotifierProvider).isOffline;
});

/// Has complete user profile
final hasCompleteProfileProvider = Provider<bool>((ref) {
  final userProfile = ref.watch(currentUserProvider);
  return userProfile != null && 
         userProfile.name.isNotEmpty && 
         userProfile.email.isNotEmpty;
});