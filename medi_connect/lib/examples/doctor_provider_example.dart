// EXAMPLE: How to use the Enhanced Doctor Provider
// 
// This file demonstrates the key features of the enhanced doctor provider:
// - Advanced filtering and search
// - Pagination
// - Offline caching
// - State management

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../providers/doctor_provider.dart';

class EnhancedDoctorListExample extends ConsumerStatefulWidget {
  const EnhancedDoctorListExample({Key? key}) : super(key: key);

  @override
  ConsumerState<EnhancedDoctorListExample> createState() => _EnhancedDoctorListExampleState();
}

class _EnhancedDoctorListExampleState extends ConsumerState<EnhancedDoctorListExample> {
  final TextEditingController _searchController = TextEditingController();
  
  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    // Watch the main doctor state
    final doctorState = ref.watch(doctorProviderNotifier);
    final doctorNotifier = ref.read(doctorProviderNotifier.notifier);
    
    // Watch convenience providers
    final currentDoctors = ref.watch(currentDoctorsProvider);
    final pagination = ref.watch(doctorPaginationProvider);
    final isOffline = ref.watch(isOfflineModeProvider);
    
    return Scaffold(
      appBar: AppBar(
        title: Text('Enhanced Doctor Search'),
        backgroundColor: Colors.blue,
        actions: [
          if (isOffline)
            const Icon(Icons.offline_bolt, color: Colors.orange),
        ],
      ),
      body: Column(
        children: [
          // Search Bar
          Padding(
            padding: const EdgeInsets.all(16.0),
            child: TextField(
              controller: _searchController,
              decoration: InputDecoration(
                hintText: 'Search doctors by name, specialty, or location',
                prefixIcon: const Icon(Icons.search),
                suffixIcon: _searchController.text.isNotEmpty
                    ? IconButton(
                        icon: const Icon(Icons.clear),
                        onPressed: () {
                          _searchController.clear();
                          doctorNotifier.clearSearch();
                        },
                      )
                    : null,
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
              onChanged: (query) {
                doctorNotifier.searchDoctors(query);
              },
            ),
          ),
          
          // Filter Controls
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16.0),
            child: Row(
              children: [
                // Specialty Filter
                Expanded(
                  child: DropdownButtonFormField<String>(
                    value: doctorState.filters.specialty,
                    decoration: const InputDecoration(
                      labelText: 'Specialty',
                      isDense: true,
                    ),
                    items: MedicalSpecialties.all.map((specialty) {
                      return DropdownMenuItem(
                        value: specialty,
                        child: Text(specialty),
                      );
                    }).toList(),
                    onChanged: (value) {
                      if (value != null) {
                        doctorNotifier.updateFilters(
                          doctorState.filters.copyWith(specialty: value),
                        );
                      }
                    },
                  ),
                ),
                const SizedBox(width: 16),
                
                // Province Filter
                Expanded(
                  child: DropdownButtonFormField<String?>(
                    value: doctorState.filters.province,
                    decoration: const InputDecoration(
                      labelText: 'Province',
                      isDense: true,
                    ),
                    items: AfghanistanProvinces.all.map((province) {
                      return DropdownMenuItem(
                        value: province == 'All Provinces' ? null : province,
                        child: Text(province),
                      );
                    }).toList(),
                    onChanged: (value) {
                      doctorNotifier.updateFilters(
                        doctorState.filters.copyWith(province: value),
                      );
                    },
                  ),
                ),
              ],
            ),
          ),
          
          // Additional Filters
          Padding(
            padding: const EdgeInsets.all(16.0),
            child: Row(
              children: [
                // Online Only Toggle
                FilterChip(
                  label: const Text('Online Only'),
                  selected: doctorState.filters.onlineOnly,
                  onSelected: (selected) {
                    doctorNotifier.updateFilters(
                      doctorState.filters.copyWith(onlineOnly: selected),
                    );
                  },
                ),
                const SizedBox(width: 8),
                
                // Sort Dropdown
                DropdownButton<String>(
                  value: doctorState.filters.sortBy,
                  items: const [
                    DropdownMenuItem(value: 'rating', child: Text('Rating')),
                    DropdownMenuItem(value: 'fee_low', child: Text('Fee: Low to High')),
                    DropdownMenuItem(value: 'fee_high', child: Text('Fee: High to Low')),
                    DropdownMenuItem(value: 'experience', child: Text('Experience')),
                  ],
                  onChanged: (value) {
                    if (value != null) {
                      doctorNotifier.updateFilters(
                        doctorState.filters.copyWith(sortBy: value),
                      );
                    }
                  },
                ),
                
                const Spacer(),
                
                // Reset Filters
                TextButton(
                  onPressed: () {
                    _searchController.clear();
                    doctorNotifier.resetFilters();
                    doctorNotifier.clearSearch();
                  },
                  child: const Text('Reset'),
                ),
              ],
            ),
          ),
          
          // Doctor List
          Expanded(
            child: RefreshIndicator(
              onRefresh: () => doctorNotifier.refreshDoctors(force: true),
              child: _buildDoctorList(currentDoctors, pagination, doctorNotifier),
            ),
          ),
        ],
      ),
    );
  }
  
  Widget _buildDoctorList(
    List<dynamic> doctors,
    DoctorPagination pagination,
    DoctorProviderNotifier notifier,
  ) {
    if (pagination.isLoading && doctors.isEmpty) {
      return const Center(child: CircularProgressIndicator());
    }
    
    if (doctors.isEmpty) {
      return const Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.search_off, size: 64, color: Colors.grey),
            SizedBox(height: 16),
            Text('No doctors found'),
            Text('Try adjusting your search or filters'),
          ],
        ),
      );
    }
    
    return ListView.builder(
      itemCount: doctors.length + (pagination.hasNextPage ? 1 : 0),
      itemBuilder: (context, index) {
        if (index == doctors.length) {
          // Load more indicator
          if (pagination.isLoadingMore) {
            return const Padding(
              padding: EdgeInsets.all(16.0),
              child: Center(child: CircularProgressIndicator()),
            );
          } else {
            return Padding(
              padding: const EdgeInsets.all(16.0),
              child: ElevatedButton(
                onPressed: () => notifier.loadMoreDoctors(),
                child: const Text('Load More'),
              ),
            );
          }
        }
        
        final doctor = doctors[index];
        return Card(
          margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          child: ListTile(
            leading: CircleAvatar(
              backgroundImage: doctor.photoUrl != null
                  ? NetworkImage(doctor.photoUrl!)
                  : null,
              child: doctor.photoUrl == null
                  ? Text(doctor.name[0])
                  : null,
            ),
            title: Text(doctor.name),
            subtitle: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('${doctor.specialty} • ${doctor.city}'),
                Row(
                  children: [
                    const Icon(Icons.star, size: 16, color: Colors.orange),
                    Text(' ${doctor.rating} (${doctor.reviewCount} reviews)'),
                  ],
                ),
                Text('Fee: ${doctor.feeFormatted}'),
              ],
            ),
            trailing: doctor.isAvailableOnline
                ? const Icon(Icons.videocam, color: Colors.green)
                : null,
            isThreeLine: true,
          ),
        );
      },
    );
  }
}
