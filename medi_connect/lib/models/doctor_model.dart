import 'package:cloud_firestore/cloud_firestore.dart';

class DoctorModel {
  final String id;
  final String name;
  final String specialty;
  final String city;
  final String province;
  final String status; // 'Pending' | 'Verified' | 'Rejected'
  final String regNo;
  final double fee;
  final String? bio;
  final String? photoUrl;
  final String? hospital;
  final String? phone;
  final String? email;
  final double rating;
  final int reviewCount;
  final int experienceYears;
  final List<String> availableDays; // ['Mon', 'Tue', ...]
  final String workingHoursStart; // '09:00'
  final String workingHoursEnd;   // '17:00'
  final List<String> languages;
  final List<String> qualifications;
  final bool isAvailableOnline;
  final DateTime? createdAt;

  DoctorModel({
    required this.id,
    required this.name,
    required this.specialty,
    required this.city,
    required this.province,
    required this.status,
    required this.regNo,
    this.fee = 500,
    this.bio,
    this.photoUrl,
    this.hospital,
    this.phone,
    this.email,
    this.rating = 0.0,
    this.reviewCount = 0,
    this.experienceYears = 0,
    this.availableDays = const ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
    this.workingHoursStart = '09:00',
    this.workingHoursEnd = '17:00',
    this.languages = const ['English'],
    this.qualifications = const [],
    this.isAvailableOnline = false,
    this.createdAt,
  });

factory DoctorModel.fromFirestore(DocumentSnapshot doc) {
  final data = doc.data() as Map<String, dynamic>;
  
  // Debug print to see actual Firebase data structure
  print('Firebase Doctor Data: $data');
  
  return DoctorModel(
    id: doc.id,
    name: data['fullName'] ?? data['name'] ?? 'Unknown Doctor', // KEY FIX: Use fullName
    specialty: data['specialty'] ?? 'General Physician',
    city: data['city'] ?? 'Kabul City',
    province: data['province'] ?? 'Kabul',
    status: data['status'] ?? 'Pending',
    regNo: data['regNo'] ?? data['id'] ?? 'N/A',
    fee: (data['fee'] as num?)?.toDouble() ?? 500,
    bio: data['about'] ?? data['bio'] ?? '', // KEY FIX: Use about
    photoUrl: data['photoUrl'],
    hospital: data['hospital'] ?? 'General Hospital',
    phone: data['phone'],
    email: data['email'],
    rating: (data['rating'] as num?)?.toDouble() ?? 0.0,
    reviewCount: (data['reviewCount'] as num?)?.toInt() ?? 0,
    experienceYears: (data['experience'] ?? data['experienceYears'] as num?)?.toInt() ?? 0, // KEY FIX: Use experience
    availableDays: List<String>.from(data['availableDays'] ?? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']),
    workingHoursStart: data['workingHoursStart'] ?? '09:00',
    workingHoursEnd: data['workingHoursEnd'] ?? '17:00',
    languages: List<String>.from(data['languages'] ?? ['English']),
    qualifications: List<String>.from(data['qualifications'] ?? []),
    isAvailableOnline: data['isAvailableOnline'] ?? false,
    createdAt: (data['createdAt'] as Timestamp?)?.toDate(),
  );
}

  /// Factory constructor from JSON (for API responses)
  factory DoctorModel.fromJson(Map<String, dynamic> json) {
    return DoctorModel(
      id: json['id'] ?? '',
      name: json['fullName'] ?? json['name'] ?? 'Unknown Doctor',
      specialty: json['specialty'] ?? 'General Physician',
      city: json['city'] ?? 'Kabul',
      province: json['province'] ?? 'Kabul',
      status: json['status'] ?? 'verified',
      regNo: json['regNo'] ?? json['doctorId'] ?? 'N/A',
      fee: (json['fee'] as num?)?.toDouble() ?? 500,
      bio: json['bio'] ?? json['about'],
      photoUrl: json['photoUrl'],
      hospital: json['hospital'],
      phone: json['phone'],
      email: json['email'],
      rating: (json['rating'] as num?)?.toDouble() ?? 0.0,
      reviewCount: (json['reviewCount'] as num?)?.toInt() ?? 0,
      experienceYears: (json['experienceYears'] ?? json['experience'] as num?)?.toInt() ?? 0,
      availableDays: json['availableDays'] != null 
          ? List<String>.from(json['availableDays'])
          : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
      workingHoursStart: json['workingHoursStart'] ?? '09:00',
      workingHoursEnd: json['workingHoursEnd'] ?? '17:00',
      languages: json['languages'] != null 
          ? List<String>.from(json['languages'])
          : ['English'],
      qualifications: json['qualifications'] != null 
          ? List<String>.from(json['qualifications'])
          : json['education'] != null ? [json['education']] : [],
      isAvailableOnline: json['isAvailableOnline'] ?? false,
      createdAt: json['createdAt'] != null 
          ? DateTime.tryParse(json['createdAt'])
          : null,
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'name': name,
      'specialty': specialty,
      'city': city,
      'province': province,
      'status': status,
      'regNo': regNo,
      'fee': fee,
      if (bio != null) 'bio': bio,
      if (photoUrl != null) 'photoUrl': photoUrl,
      if (hospital != null) 'hospital': hospital,
      if (phone != null) 'phone': phone,
      if (email != null) 'email': email,
      'rating': rating,
      'reviewCount': reviewCount,
      'experienceYears': experienceYears,
      'availableDays': availableDays,
      'workingHoursStart': workingHoursStart,
      'workingHoursEnd': workingHoursEnd,
      'languages': languages,
      'qualifications': qualifications,
      'isAvailableOnline': isAvailableOnline,
      'createdAt': FieldValue.serverTimestamp(),
    };
  }

  /// Legacy compatibility — used by existing screens that import Doctor from doctor_service
  String get feeFormatted => '${fee.toStringAsFixed(0)} AFN';
}
