import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_riverpod/legacy.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'dart:convert';
import '../models/doctor_model.dart';
import '../services/doctor_service.dart';

// Re-export existing providers for backward compatibility
export '../services/doctor_service.dart'
    show
        doctorServiceProvider,
        verifiedDoctorsProvider,
        topDoctorsProvider,
        onlineDoctorsProvider,
        doctorsBySpecialtyProvider,
        doctorSearchProvider,
        doctorsFromApiProvider,
        specialtiesFromApiProvider;

// ═══════════════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════════════

/// Afghanistan's 34 provinces
class AfghanistanProvinces {
  static const List<String> all = [
    'All Provinces',
    'Badakhshan',
    'Badghis',
    'Baghlan',
    'Balkh',
    'Bamyan',
    'Daykundi',
    'Farah',
    'Faryab',
    'Ghazni',
    'Ghor',
    'Helmand',
    'Herat',
    'Jawzjan',
    'Kabul',
    'Kandahar',
    'Kapisa',
    'Khost',
    'Kunar',
    'Kunduz',
    'Laghman',
    'Logar',
    'Nangarhar',
    'Nimruz',
    'Nuristan',
    'Paktia',
    'Paktika',
    'Panjshir',
    'Parwan',
    'Samangan',
    'Sar-e Pol',
    'Takhar',
    'Uruzgan',
    'Wardak',
    'Zabul',
  ];
}

/// Medical specialties common in Afghanistan
class MedicalSpecialties {
  static const List<String> all = [
    'All Specialties',
    'General Physician',
    'Internal Medicine',
    'Pediatrics',
    'Gynecology & Obstetrics',
    'Cardiology',
    'Neurology',
    'Orthopedics',
    'Dermatology',
    'Psychiatry',
    'ENT (Ear, Nose, Throat)',
    'Ophthalmology',
    'Urology',
    'Surgery',
    'Emergency Medicine',
    'Radiology',
    'Pathology',
    'Anesthesiology',
    'Family Medicine',
    'Infectious Diseases',
  ];
}

// ═══════════════════════════════════════════════════════════════════════════════════
// FILTER MODELS
// ═══════════════════════════════════════════════════════════════════════════════════

/// Comprehensive filter state for doctor search and listing
class DoctorFilters {
  final String specialty;
  final String? province;
  final String? city;
  final bool onlineOnly;
  final double? minRating;
  final double? maxFee;
  final String? availableDay;
  final List<String> languages;
  final String sortBy; // 'rating', 'fee_low', 'fee_high', 'experience'

  const DoctorFilters({
    this.specialty = 'All Specialties',
    this.province,
    this.city,
    this.onlineOnly = false,
    this.minRating,
    this.maxFee,
    this.availableDay,
    this.languages = const [],
    this.sortBy = 'rating',
  });

  DoctorFilters copyWith({
    String? specialty,
    String? province,
    String? city,
    bool? onlineOnly,
    double? minRating,
    double? maxFee,
    String? availableDay,
    List<String>? languages,
    String? sortBy,
  }) {
    return DoctorFilters(
      specialty: specialty ?? this.specialty,
      province: province ?? this.province,
      city: city ?? this.city,
      onlineOnly: onlineOnly ?? this.onlineOnly,
      minRating: minRating ?? this.minRating,
      maxFee: maxFee ?? this.maxFee,
      availableDay: availableDay ?? this.availableDay,
      languages: languages ?? this.languages,
      sortBy: sortBy ?? this.sortBy,
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'specialty': specialty,
      'province': province,
      'city': city,
      'onlineOnly': onlineOnly,
      'minRating': minRating,
      'maxFee': maxFee,
      'availableDay': availableDay,
      'languages': languages,
      'sortBy': sortBy,
    };
  }

  factory DoctorFilters.fromMap(Map<String, dynamic> map) {
    return DoctorFilters(
      specialty: map['specialty'] ?? 'All Specialties',
      province: map['province'],
      city: map['city'],
      onlineOnly: map['onlineOnly'] ?? false,
      minRating: map['minRating']?.toDouble(),
      maxFee: map['maxFee']?.toDouble(),
      availableDay: map['availableDay'],
      languages: List<String>.from(map['languages'] ?? []),
      sortBy: map['sortBy'] ?? 'rating',
    );
  }
}

/// Pagination state for doctor listing
class DoctorPagination {
  final int currentPage;
  final int itemsPerPage;
  final int totalItems;
  final bool hasNextPage;
  final bool isLoading;
  final bool isLoadingMore;

  const DoctorPagination({
    this.currentPage = 1,
    this.itemsPerPage = 20,
    this.totalItems = 0,
    this.hasNextPage = false,
    this.isLoading = false,
    this.isLoadingMore = false,
  });

  DoctorPagination copyWith({
    int? currentPage,
    int? itemsPerPage,
    int? totalItems,
    bool? hasNextPage,
    bool? isLoading,
    bool? isLoadingMore,
  }) {
    return DoctorPagination(
      currentPage: currentPage ?? this.currentPage,
      itemsPerPage: itemsPerPage ?? this.itemsPerPage,
      totalItems: totalItems ?? this.totalItems,
      hasNextPage: hasNextPage ?? this.hasNextPage,
      isLoading: isLoading ?? this.isLoading,
      isLoadingMore: isLoadingMore ?? this.isLoadingMore,
    );
  }

  int get totalPages => (totalItems / itemsPerPage).ceil();
}

/// Complete doctor listing state
class DoctorListState {
  final List<DoctorModel> doctors;
  final List<DoctorModel> filteredDoctors;
  final List<DoctorModel> searchResults;
  final DoctorFilters filters;
  final DoctorPagination pagination;
  final String searchQuery;
  final bool isSearching;
  final String? error;
  final DateTime? lastFetched;
  final bool isOfflineMode;

  const DoctorListState({
    this.doctors = const [],
    this.filteredDoctors = const [],
    this.searchResults = const [],
    this.filters = const DoctorFilters(),
    this.pagination = const DoctorPagination(),
    this.searchQuery = '',
    this.isSearching = false,
    this.error,
    this.lastFetched,
    this.isOfflineMode = false,
  });

  DoctorListState copyWith({
    List<DoctorModel>? doctors,
    List<DoctorModel>? filteredDoctors,
    List<DoctorModel>? searchResults,
    DoctorFilters? filters,
    DoctorPagination? pagination,
    String? searchQuery,
    bool? isSearching,
    String? error,
    DateTime? lastFetched,
    bool? isOfflineMode,
  }) {
    return DoctorListState(
      doctors: doctors ?? this.doctors,
      filteredDoctors: filteredDoctors ?? this.filteredDoctors,
      searchResults: searchResults ?? this.searchResults,
      filters: filters ?? this.filters,
      pagination: pagination ?? this.pagination,
      searchQuery: searchQuery ?? this.searchQuery,
      isSearching: isSearching ?? this.isSearching,
      error: error ?? this.error,
      lastFetched: lastFetched ?? this.lastFetched,
      isOfflineMode: isOfflineMode ?? this.isOfflineMode,
    );
  }
}

// ═══════════════════════════════════════════════════════════════════════════════════
// CACHE MANAGER
// ═══════════════════════════════════════════════════════════════════════════════════

/// Offline cache manager for doctor data using SharedPreferences
/// Note: In production, consider upgrading to Hive for better performance
class DoctorCacheManager {
  static const String _doctorsKey = 'cached_doctors';
  static const String _specialtiesKey = 'cached_specialties';
  static const String _lastFetchKey = 'doctors_last_fetch';
  static const Duration cacheExpiry = Duration(hours: 6);

  /// Save doctors to cache
  static Future<void> cacheDoctors(List<DoctorModel> doctors) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final doctorsJson = doctors.map((d) => d.toMap()).toList();
      await prefs.setString(_doctorsKey, jsonEncode(doctorsJson));
      await prefs.setString(_lastFetchKey, DateTime.now().toIso8601String());
      debugPrint('Cached ${doctors.length} doctors');
    } catch (e) {
      debugPrint('Error caching doctors: $e');
    }
  }

  /// Load doctors from cache
  static Future<List<DoctorModel>> getCachedDoctors() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final doctorsString = prefs.getString(_doctorsKey);
      if (doctorsString == null) return [];

      final List<dynamic> doctorsJson = jsonDecode(doctorsString);
      return doctorsJson.map((json) => DoctorModel.fromJson(json)).toList();
    } catch (e) {
      debugPrint('Error loading cached doctors: $e');
      return [];
    }
  }

  /// Save specialties to cache
  static Future<void> cacheSpecialties(List<String> specialties) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setStringList(_specialtiesKey, specialties);
    } catch (e) {
      debugPrint('Error caching specialties: $e');
    }
  }

  /// Load specialties from cache
  static Future<List<String>> getCachedSpecialties() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      return prefs.getStringList(_specialtiesKey) ?? MedicalSpecialties.all;
    } catch (e) {
      debugPrint('Error loading cached specialties: $e');
      return MedicalSpecialties.all;
    }
  }

  /// Check if cache is expired
  static Future<bool> isCacheExpired() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final lastFetchString = prefs.getString(_lastFetchKey);
      if (lastFetchString == null) return true;

      final lastFetch = DateTime.parse(lastFetchString);
      return DateTime.now().difference(lastFetch) > cacheExpiry;
    } catch (e) {
      return true;
    }
  }

  /// Clear all cached data
  static Future<void> clearCache() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.remove(_doctorsKey);
      await prefs.remove(_specialtiesKey);
      await prefs.remove(_lastFetchKey);
    } catch (e) {
      debugPrint('Error clearing cache: $e');
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════════════
// DOCTOR PROVIDER NOTIFIER
// ═══════════════════════════════════════════════════════════════════════════════════

/// Main doctor provider with advanced search, filtering, and caching
class DoctorProviderNotifier extends Notifier<DoctorListState> {
  Timer? _searchDebounceTimer;

  @override
  DoctorListState build() {
    _initializeProvider();
    return const DoctorListState();
  }

  DoctorService get _doctorService => ref.read(doctorServiceProvider);

  /// Initialize provider with cached data
  Future<void> _initializeProvider() async {
    // Load cached doctors first for immediate display
    final cachedDoctors = await DoctorCacheManager.getCachedDoctors();
    if (cachedDoctors.isNotEmpty) {
      state = state.copyWith(
        doctors: cachedDoctors,
        filteredDoctors: cachedDoctors,
        isOfflineMode: true,
        lastFetched: DateTime.now(),
      );
    }

    // Fetch fresh data if cache is expired or in online mode
    await refreshDoctors();
  }

  /// Refresh doctors from API with fallback to cache
  Future<void> refreshDoctors({bool force = false}) async {
    final isExpired = await DoctorCacheManager.isCacheExpired();
    
    if (!force && !isExpired && state.doctors.isNotEmpty) {
      return; // Use existing data
    }

    state = state.copyWith(
      pagination: state.pagination.copyWith(isLoading: true),
      error: null,
    );

    try {
      // Try to fetch from API
      final doctors = await _doctorService.getVerifiedDoctorsFromApi(
        page: 1,
        limit: state.pagination.itemsPerPage,
      );

      if (doctors.isNotEmpty) {
        // Cache the fresh data
        await DoctorCacheManager.cacheDoctors(doctors);
        
        state = state.copyWith(
          doctors: doctors,
          filteredDoctors: _applyFilters(doctors),
          isOfflineMode: false,
          lastFetched: DateTime.now(),
          pagination: state.pagination.copyWith(
            isLoading: false,
            totalItems: doctors.length,
            hasNextPage: doctors.length >= state.pagination.itemsPerPage,
          ),
        );
      } else {
        // Fallback to cached data
        final cachedDoctors = await DoctorCacheManager.getCachedDoctors();
        state = state.copyWith(
          doctors: cachedDoctors,
          filteredDoctors: _applyFilters(cachedDoctors),
          isOfflineMode: true,
          pagination: state.pagination.copyWith(isLoading: false),
        );
      }
    } catch (e) {
      // Error: fallback to cached data
      final cachedDoctors = await DoctorCacheManager.getCachedDoctors();
      state = state.copyWith(
        doctors: cachedDoctors,
        filteredDoctors: _applyFilters(cachedDoctors),
        isOfflineMode: true,
        error: e.toString(),
        pagination: state.pagination.copyWith(isLoading: false),
      );
    }
  }

  /// Load more doctors for pagination
  Future<void> loadMoreDoctors() async {
    if (state.pagination.isLoadingMore || !state.pagination.hasNextPage) {
      return;
    }

    state = state.copyWith(
      pagination: state.pagination.copyWith(isLoadingMore: true),
    );

    try {
      final nextPage = state.pagination.currentPage + 1;
      final moreDoctors = await _doctorService.getVerifiedDoctorsFromApi(
        specialty: state.filters.specialty != 'All Specialties' 
            ? state.filters.specialty 
            : null,
        province: state.filters.province != 'All Provinces' 
            ? state.filters.province 
            : null,
        page: nextPage,
        limit: state.pagination.itemsPerPage,
      );

      if (moreDoctors.isNotEmpty) {
        final allDoctors = [...state.doctors, ...moreDoctors];
        await DoctorCacheManager.cacheDoctors(allDoctors);

        state = state.copyWith(
          doctors: allDoctors,
          filteredDoctors: _applyFilters(allDoctors),
          pagination: state.pagination.copyWith(
            currentPage: nextPage,
            isLoadingMore: false,
            hasNextPage: moreDoctors.length >= state.pagination.itemsPerPage,
          ),
        );
      } else {
        state = state.copyWith(
          pagination: state.pagination.copyWith(
            isLoadingMore: false,
            hasNextPage: false,
          ),
        );
      }
    } catch (e) {
      state = state.copyWith(
        error: e.toString(),
        pagination: state.pagination.copyWith(isLoadingMore: false),
      );
    }
  }

  /// Update filters and apply them
  void updateFilters(DoctorFilters newFilters) {
    state = state.copyWith(
      filters: newFilters,
      filteredDoctors: _applyFilters(state.doctors),
    );
  }
  /// Apply current filters to doctor list
  List<DoctorModel> _applyFilters(List<DoctorModel> doctors) {
    var filtered = doctors.where((doctor) {
      // Specialty filter
      if (state.filters.specialty != 'All Specialties') {
        if (!doctor.specialty.toLowerCase().contains(
          state.filters.specialty.toLowerCase(),
        )) {
          return false;
        }
      }

      // Province filter
      if (state.filters.province != null && 
          state.filters.province != 'All Provinces') {
        if (doctor.province != state.filters.province) {
          return false;
        }
      }

      // City filter
      if (state.filters.city != null) {
        if (!doctor.city.toLowerCase().contains(
          state.filters.city!.toLowerCase(),
        )) {
          return false;
        }
      }

      // Online availability filter
      if (state.filters.onlineOnly && !doctor.isAvailableOnline) {
        return false;
      }

      // Rating filter
      if (state.filters.minRating != null && 
          doctor.rating < state.filters.minRating!) {
        return false;
      }

      // Fee filter
      if (state.filters.maxFee != null && 
          doctor.fee > state.filters.maxFee!) {
        return false;
      }

      // Available day filter
      if (state.filters.availableDay != null) {
        if (!doctor.availableDays.contains(state.filters.availableDay)) {
          return false;
        }
      }

      // Language filter
      if (state.filters.languages.isNotEmpty) {
        final hasCommonLanguage = state.filters.languages
            .any((lang) => doctor.languages.contains(lang));
        if (!hasCommonLanguage) {
          return false;
        }
      }

      return true;
    }).toList();

    // Apply sorting
    filtered.sort((a, b) {
      switch (state.filters.sortBy) {
        case 'rating':
          return b.rating.compareTo(a.rating);
        case 'fee_low':
          return a.fee.compareTo(b.fee);
        case 'fee_high':
          return b.fee.compareTo(a.fee);
        case 'experience':
          return b.experienceYears.compareTo(a.experienceYears);
        default:
          return b.rating.compareTo(a.rating);
      }
    });

    return filtered;
  }

  /// Search doctors with debouncing
  void searchDoctors(String query) {
    _searchDebounceTimer?.cancel();
    
    state = state.copyWith(
      searchQuery: query,
      isSearching: query.isNotEmpty,
    );

    if (query.trim().isEmpty) {
      state = state.copyWith(
        searchResults: [],
        isSearching: false,
      );
      return;
    }

    _searchDebounceTimer = Timer(const Duration(milliseconds: 500), () {
      _performSearch(query.trim().toLowerCase());
    });
  }

  /// Perform actual search
  void _performSearch(String query) {
    final results = state.doctors.where((doctor) {
      return doctor.name.toLowerCase().contains(query) ||
          doctor.specialty.toLowerCase().contains(query) ||
          (doctor.hospital?.toLowerCase().contains(query) ?? false) ||
          doctor.city.toLowerCase().contains(query) ||
          (doctor.bio?.toLowerCase().contains(query) ?? false);
    }).toList();

    // Apply current filters to search results
    final filteredResults = results.where((doctor) {
      return _applyFilters([doctor]).isNotEmpty;
    }).toList();

    state = state.copyWith(
      searchResults: filteredResults,
      isSearching: false,
    );
  }

  /// Clear search
  void clearSearch() {
    _searchDebounceTimer?.cancel();
    state = state.copyWith(
      searchQuery: '',
      searchResults: [],
      isSearching: false,
    );
  }

  /// Reset all filters
  void resetFilters() {
    state = state.copyWith(
      filters: const DoctorFilters(),
      filteredDoctors: state.doctors,
    );
  }

  /// Clear error state
  void clearError() {
    state = state.copyWith(error: null);
  }
}

// ═══════════════════════════════════════════════════════════════════════════════════
// PROVIDERS
// ═══════════════════════════════════════════════════════════════════════════════════

/// Main doctor provider
final doctorProviderNotifier = 
    NotifierProvider<DoctorProviderNotifier, DoctorListState>(
      DoctorProviderNotifier.new);

/// Legacy compatibility providers (maintain backward compatibility)
final selectedSpecialtyProvider = StateProvider<String>((ref) => 'All Specialties');
final selectedProvinceProvider = StateProvider<String?>((ref) => null);
final doctorSearchQueryProvider = StateProvider<String>((ref) => '');
final selectedDoctorProvider = StateProvider<DoctorModel?>((ref) => null);

/// Convenience providers for common use cases
final currentDoctorsProvider = Provider<List<DoctorModel>>((ref) {
  final state = ref.watch(doctorProviderNotifier);
  return state.isSearching && state.searchQuery.isNotEmpty
      ? state.searchResults
      : state.filteredDoctors;
});

final doctorFiltersProvider = Provider<DoctorFilters>((ref) {
  return ref.watch(doctorProviderNotifier).filters;
});

final doctorPaginationProvider = Provider<DoctorPagination>((ref) {
  return ref.watch(doctorProviderNotifier).pagination;
});

final isOfflineModeProvider = Provider<bool>((ref) {
  return ref.watch(doctorProviderNotifier).isOfflineMode;
});

/// Specialties provider with caching
final availableSpecialtiesProvider = FutureProvider<List<String>>((ref) async {
  // Try to get from API first
  try {
    final service = ref.watch(doctorServiceProvider);
    final apiSpecialties = await service.getSpecialtiesFromApi();
    
    if (apiSpecialties.isNotEmpty) {
      // Cache the result
      await DoctorCacheManager.cacheSpecialties(apiSpecialties);
      return ['All Specialties', ...apiSpecialties];
    }
  } catch (e) {
    debugPrint('Error fetching specialties from API: $e');
  }
  
  // Fallback to cached or default specialties
  final cachedSpecialties = await DoctorCacheManager.getCachedSpecialties();
  return cachedSpecialties;
});

/// Provinces provider
final availableProvincesProvider = Provider<List<String>>((ref) {
  return AfghanistanProvinces.all;
});

/// Doctor availability provider (unchanged for compatibility)
final doctorAvailabilityProvider = FutureProvider.autoDispose
    .family<Map<String, dynamic>?, ({String doctorId, String date})>((ref, args) async {
  final service = ref.watch(doctorServiceProvider);
  return service.getDoctorAvailability(args.doctorId, args.date);
});

