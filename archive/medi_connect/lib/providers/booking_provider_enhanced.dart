import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../models/appointment_model.dart';
import '../models/doctor_model.dart';
import '../services/booking_service_api.dart';
import 'auth_provider.dart';

// Re-export existing providers
export '../services/booking_service_api.dart'
    show bookingServiceApiProvider, myBookingsProvider, bookingByIdProvider;

/// Booking flow step enumeration
enum BookingStep {
  selectDoctor,
  selectDateTime,
  selectType,
  enterDetails,
  confirmBooking,
  payment,
  completed,
}

/// Enhanced booking state with step-by-step flow
class BookingState {
  final BookingStep currentStep;
  final DoctorModel? selectedDoctor;
  final DateTime? selectedDate;
  final String? selectedTimeSlot;
  final AppointmentType? appointmentType;
  final String? notes;
  final double? estimatedFee;
  final bool isLoading;
  final String? error;
  final List<String> availableTimeSlots;
  final bool isOfflineMode;

  const BookingState({
    this.currentStep = BookingStep.selectDoctor,
    this.selectedDoctor,
    this.selectedDate,
    this.selectedTimeSlot,
    this.appointmentType,
    this.notes,
    this.estimatedFee,
    this.isLoading = false,
    this.error,
    this.availableTimeSlots = const [],
    this.isOfflineMode = false,
  });

  BookingState copyWith({
    BookingStep? currentStep,
    DoctorModel? selectedDoctor,
    DateTime? selectedDate,
    String? selectedTimeSlot,
    AppointmentType? appointmentType,
    String? notes,
    double? estimatedFee,
    bool? isLoading,
    String? error,
    List<String>? availableTimeSlots,
    bool? isOfflineMode,
  }) {
    return BookingState(
      currentStep: currentStep ?? this.currentStep,
      selectedDoctor: selectedDoctor ?? this.selectedDoctor,
      selectedDate: selectedDate ?? this.selectedDate,
      selectedTimeSlot: selectedTimeSlot ?? this.selectedTimeSlot,
      appointmentType: appointmentType ?? this.appointmentType,
      notes: notes ?? this.notes,
      estimatedFee: estimatedFee ?? this.estimatedFee,
      isLoading: isLoading ?? this.isLoading,
      error: error,
      availableTimeSlots: availableTimeSlots ?? this.availableTimeSlots,
      isOfflineMode: isOfflineMode ?? this.isOfflineMode,
    );
  }

  /// Check if booking is valid and can proceed to next step
  bool get canProceedToNextStep {
    switch (currentStep) {
      case BookingStep.selectDoctor:
        return selectedDoctor != null;
      case BookingStep.selectDateTime:
        return selectedDate != null && selectedTimeSlot != null;
      case BookingStep.selectType:
        return appointmentType != null;
      case BookingStep.enterDetails:
        return true; // Notes are optional
      case BookingStep.confirmBooking:
        return true;
      case BookingStep.payment:
        return true;
      case BookingStep.completed:
        return false;
    }
  }

  /// Get estimated total fee based on appointment type and doctor fee
  double get totalEstimatedFee {
    if (selectedDoctor == null || appointmentType == null) return 0.0;
    
    double baseFee = selectedDoctor!.consultationFee;
    
    // Add platform fee for online consultations
    if (appointmentType == AppointmentType.online) {
      baseFee += (baseFee * 0.1); // 10% platform fee for online
    }
    
    return baseFee;
  }
}

/// Enhanced booking flow state notifier
class BookingNotifier extends Notifier<BookingState> {
  @override
  BookingState build() => const BookingState();

  /// Initialize booking flow
  void initializeBooking() {
    state = const BookingState();
  }

  /// Select doctor and move to next step
  void selectDoctor(DoctorModel doctor) {
    state = state.copyWith(
      selectedDoctor: doctor,
      currentStep: BookingStep.selectDateTime,
      estimatedFee: doctor.consultationFee,
      error: null,
    );
    _saveBookingStateLocally();
  }

  /// Load available time slots for selected date
  Future<void> loadAvailableTimeSlots(DateTime date) async {
    if (state.selectedDoctor == null) return;

    state = state.copyWith(isLoading: true, error: null);

    try {
      // Generate sample time slots (in production, this would come from API)
      List<String> slots = _generateTimeSlots(date);
      
      state = state.copyWith(
        availableTimeSlots: slots,
        isLoading: false,
      );
    } catch (e) {
      state = state.copyWith(
        error: _getLocalizedError('Failed to load time slots: ${e.toString()}'),
        isLoading: false,
        isOfflineMode: true,
      );
    }
  }

  /// Select date and time slot
  void selectDateTime(DateTime date, String timeSlot) {
    state = state.copyWith(
      selectedDate: date,
      selectedTimeSlot: timeSlot,
      currentStep: BookingStep.selectType,
      error: null,
    );
    _saveBookingStateLocally();
  }

  /// Select appointment type
  void selectAppointmentType(AppointmentType type) {
    state = state.copyWith(
      appointmentType: type,
      currentStep: BookingStep.enterDetails,
      error: null,
    );
    _saveBookingStateLocally();
  }

  /// Add notes and proceed to confirmation
  void addNotes(String? notes) {
    state = state.copyWith(
      notes: notes,
      currentStep: BookingStep.confirmBooking,
      error: null,
    );
    _saveBookingStateLocally();
  }

  /// Confirm booking and create appointment
  Future<bool> confirmBooking() async {
    if (!state.canProceedToNextStep) return false;

    state = state.copyWith(isLoading: true, error: null);

    try {
      final currentUser = ref.read(currentUserProvider);
      if (currentUser == null) {
        throw Exception('User not authenticated');
      }

      final service = ref.read(bookingServiceApiProvider);
      final result = await service.createBooking(
        doctorId: state.selectedDoctor!.id,
        date: state.selectedDate!.toIso8601String().split('T')[0],
        timeSlot: state.selectedTimeSlot!,
        type: state.appointmentType == AppointmentType.online ? 'online' : 'in-person',
        notes: state.notes,
      );

      if (result['success'] == true) {
        state = state.copyWith(
          currentStep: BookingStep.completed,
          isLoading: false,
        );
        await _clearBookingStateLocally();
        return true;
      } else {
        state = state.copyWith(
          error: _getLocalizedError(result['error'] ?? 'Failed to create booking'),
          isLoading: false,
        );
        return false;
      }
    } catch (e) {
      state = state.copyWith(
        error: _getLocalizedError('Booking failed: ${e.toString()}'),
        isLoading: false,
        isOfflineMode: true,
      );
      
      // Save booking for offline sync
      await _saveOfflineBooking();
      return false;
    }
  }

  /// Go back to previous step
  void goToPreviousStep() {
    BookingStep? previousStep;
    
    switch (state.currentStep) {
      case BookingStep.selectDateTime:
        previousStep = BookingStep.selectDoctor;
        break;
      case BookingStep.selectType:
        previousStep = BookingStep.selectDateTime;
        break;
      case BookingStep.enterDetails:
        previousStep = BookingStep.selectType;
        break;
      case BookingStep.confirmBooking:
        previousStep = BookingStep.enterDetails;
        break;
      case BookingStep.payment:
        previousStep = BookingStep.confirmBooking;
        break;
      default:
        return;
    }

    state = state.copyWith(currentStep: previousStep, error: null);
    }

  /// Cancel booking and reset state
  void cancelBooking() {
    state = const BookingState();
    _clearBookingStateLocally();
  }

  /// Generate sample time slots for a given date
  List<String> _generateTimeSlots(DateTime date) {
    final List<String> slots = [];
    final now = DateTime.now();
    
    // If it's today, start from next available hour
    int startHour = date.day == now.day ? now.hour + 1 : 9;
    
    for (int hour = startHour; hour <= 17; hour++) {
      if (hour >= 9 && hour <= 12) {
        slots.add('${hour.toString().padLeft(2, '0')}:00');
        if (hour != 12) slots.add('${hour.toString().padLeft(2, '0')}:30');
      } else if (hour >= 14 && hour <= 17) {
        slots.add('${hour.toString().padLeft(2, '0')}:00');
        if (hour != 17) slots.add('${hour.toString().padLeft(2, '0')}:30');
      }
    }
    
    return slots;
  }

  /// Save booking state locally for persistence
  Future<void> _saveBookingStateLocally() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('booking_step', state.currentStep.name);
      if (state.selectedDoctor != null) {
        await prefs.setString('selected_doctor_id', state.selectedDoctor!.id);
      }
      if (state.selectedDate != null) {
        await prefs.setString('selected_date', state.selectedDate!.toIso8601String());
      }
    } catch (e) {
      debugPrint('Failed to save booking state locally: $e');
    }
  }

  /// Clear local booking state
  Future<void> _clearBookingStateLocally() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.remove('booking_step');
      await prefs.remove('selected_doctor_id');
      await prefs.remove('selected_date');
      await prefs.remove('offline_bookings');
    } catch (e) {
      debugPrint('Failed to clear booking state locally: $e');
    }
  }

  /// Save booking for offline sync
  Future<void> _saveOfflineBooking() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final currentUser = ref.read(currentUserProvider);
      
      if (currentUser == null) return;

      final offlineBooking = {
        'doctorId': state.selectedDoctor?.id,
        'doctorName': state.selectedDoctor?.name,
        'patientId': currentUser.id,
        'patientName': currentUser.name,
        'date': state.selectedDate?.toIso8601String(),
        'timeSlot': state.selectedTimeSlot,
        'type': state.appointmentType?.name,
        'notes': state.notes,
        'timestamp': DateTime.now().toIso8601String(),
      };

      List<String> offlineBookings = prefs.getStringList('offline_bookings') ?? [];
      offlineBookings.add(offlineBooking.toString());
      await prefs.setStringList('offline_bookings', offlineBookings);
      
      debugPrint('Booking saved for offline sync');
    } catch (e) {
      debugPrint('Failed to save offline booking: $e');
    }
  }

  /// Get localized error message
  String _getLocalizedError(String error) {
    // TODO: Implement proper localization for Dari/Pashto
    final errorMappings = {
      'Network error': 'Network connection failed',
      'Authentication required': 'Please log in to continue',
      'Doctor not available': 'Selected doctor is not available',
      'Time slot not available': 'Selected time slot is not available',
    };
    
    return errorMappings[error] ?? error;
  }
}

// ─── Enhanced Providers ─────────────────────────────────────────────────────

/// Enhanced booking flow state provider
final bookingNotifierProvider = NotifierProvider<BookingNotifier, BookingState>(() {
  return BookingNotifier();
});

// ─── Convenience Providers ──────────────────────────────────────────────────

/// Current booking step
final currentBookingStepProvider = Provider<BookingStep>((ref) {
  return ref.watch(bookingNotifierProvider.select((state) => state.currentStep));
});

/// Selected doctor in booking flow
final selectedDoctorProvider = Provider<DoctorModel?>((ref) {
  return ref.watch(bookingNotifierProvider.select((state) => state.selectedDoctor));
});

/// Is booking loading
final isBookingLoadingProvider = Provider<bool>((ref) {
  return ref.watch(bookingNotifierProvider.select((state) => state.isLoading));
});

/// Booking error
final bookingErrorProvider = Provider<String?>((ref) {
  return ref.watch(bookingNotifierProvider.select((state) => state.error));
});

/// Can proceed to next booking step
final canProceedBookingProvider = Provider<bool>((ref) {
  return ref.watch(bookingNotifierProvider.select((state) => state.canProceedToNextStep));
});

/// Total estimated booking fee
final totalEstimatedFeeProvider = Provider<double>((ref) {
  return ref.watch(bookingNotifierProvider.select((state) => state.totalEstimatedFee));
});

// Booking status filter
final bookingStatusFilterProvider = StateProvider<String?>((ref) => null);