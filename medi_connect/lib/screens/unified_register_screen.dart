import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../theme/app_colors.dart';

enum UserType { patient, doctor }

class UnifiedRegisterScreen extends ConsumerStatefulWidget {
  const UnifiedRegisterScreen({super.key});

  @override
  ConsumerState<UnifiedRegisterScreen> createState() => _UnifiedRegisterScreenState();
}

class _UnifiedRegisterScreenState extends ConsumerState<UnifiedRegisterScreen> {
  final _formKey = GlobalKey<FormState>();
  UserType _selectedType = UserType.patient;
  bool _isLoading = false;
  bool _obscurePassword = true;
  int _step = 1; // 1: Choose type, 2: Basic info, 3: Professional info (doctor only)

  // Common fields
  final _nameCtrl = TextEditingController();
  final _emailCtrl = TextEditingController();
  final _phoneCtrl = TextEditingController();
  final _passwordCtrl = TextEditingController();

  // Doctor-specific fields
  final _specialtyCtrl = TextEditingController();
  final _regNoCtrl = TextEditingController();
  final _hospitalCtrl = TextEditingController();
  final _cityCtrl = TextEditingController();
  final _expCtrl = TextEditingController();

  static const _specialties = [
    'General Physician', 'Cardiologist', 'Dermatologist', 'Neurologist',
    'Orthopedic Surgeon', 'Pediatrician', 'Psychiatrist', 'Ophthalmologist',
    'ENT Specialist', 'Gynecologist', 'Urologist', 'Oncologist',
    'Radiologist', 'Endocrinologist', 'Pulmonologist', 'Gastroenterologist',
    'Rheumatologist', 'Dentist', 'Other',
  ];

  @override
  void dispose() {
    _nameCtrl.dispose();
    _emailCtrl.dispose();
    _phoneCtrl.dispose();
    _passwordCtrl.dispose();
    _specialtyCtrl.dispose();
    _regNoCtrl.dispose();
    _hospitalCtrl.dispose();
    _cityCtrl.dispose();
    _expCtrl.dispose();
    super.dispose();
  }

  Future<void> _register() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isLoading = true);

    try {
      final cred = await FirebaseAuth.instance.createUserWithEmailAndPassword(
        email: _emailCtrl.text.trim(),
        password: _passwordCtrl.text,
      );

      await cred.user!.updateDisplayName(_nameCtrl.text.trim());
      final uid = cred.user!.uid;
      final now = FieldValue.serverTimestamp();

      if (_selectedType == UserType.patient) {
        // Create patient account
        await FirebaseFirestore.instance.collection('users').doc(uid).set({
          'uid': uid,
          'name': _nameCtrl.text.trim(),
          'email': _emailCtrl.text.trim(),
          'phone': _phoneCtrl.text.trim(),
          'role': 'patient',
          'status': 'active',
          'createdAt': now,
        });

        if (mounted) {
          context.go('/');
        }
      } else {
        // Create doctor account
        final doctorData = {
          'uid': uid,
          'userId': uid,
          'name': _nameCtrl.text.trim(),
          'fullName': _nameCtrl.text.trim(),
          'email': _emailCtrl.text.trim(),
          'phone': _phoneCtrl.text.trim(),
          'specialty': _specialtyCtrl.text.trim(),
          'regNo': _regNoCtrl.text.trim(),
          'hospital': _hospitalCtrl.text.trim(),
          'city': _cityCtrl.text.trim(),
          'province': _cityCtrl.text.trim(),
          'experienceYears': int.tryParse(_expCtrl.text) ?? 0,
          'role': 'doctor',
          'status': 'Pending',
          'rating': 0.0,
          'reviewCount': 0,
          'fee': 500.0,
          'availableDays': ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
          'workingHoursStart': '09:00',
          'workingHoursEnd': '17:00',
          'languages': ['Dari', 'Pashto'],
          'qualifications': [],
          'isAvailableOnline': false,
          'createdAt': now,
          'updatedAt': now,
        };

        await FirebaseFirestore.instance.collection('doctors').doc(uid).set(doctorData);
        await FirebaseFirestore.instance.collection('users').doc(uid).set({
          'uid': uid,
          'name': _nameCtrl.text.trim(),
          'email': _emailCtrl.text.trim(),
          'phone': _phoneCtrl.text.trim(),
          'role': 'doctor',
          'status': 'active',
          'createdAt': now,
        });

        if (mounted) {
          showDialog(
            context: context,
            barrierDismissible: false,
            builder: (ctx) => AlertDialog(
              title: const Row(
                children: [
                  Icon(Icons.verified_rounded, color: AppColors.primary),
                  SizedBox(width: 8),
                  Text('Registration Submitted'),
                ],
              ),
              content: const Text(
                'Your doctor profile has been submitted for admin verification. '
                'You can start using the app now.',
              ),
              actions: [
                ElevatedButton(
                  onPressed: () {
                    Navigator.pop(ctx);
                    context.go('/doctor');
                  },
                  child: const Text('Continue'),
                ),
              ],
            ),
          );
        }
      }
    } on FirebaseAuthException catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(_authErrorMessage(e.code)),
            backgroundColor: AppColors.error,
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: $e')),
        );
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  String _authErrorMessage(String code) {
    switch (code) {
      case 'email-already-in-use':
        return 'This email is already registered. Please sign in.';
      case 'weak-password':
        return 'Password must be at least 6 characters.';
      case 'invalid-email':
        return 'Please enter a valid email address.';
      default:
        return 'Registration failed. Please try again.';
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: Form(
          key: _formKey,
          child: Column(
            children: [
              _buildHeader(),
              _buildProgressBar(),
              Expanded(
                child: _step == 1
                    ? _buildUserTypeSelection()
                    : _step == 2
                        ? _buildBasicInfo()
                        : _buildDoctorInfo(),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildHeader() {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [Color(0xFF0D8A79), AppColors.primary],
        ),
      ),
      child: Row(
        children: [
          if (_step > 1)
            IconButton(
              icon: const Icon(Icons.arrow_back_ios_new_rounded, color: Colors.white),
              onPressed: () => setState(() => _step--),
            )
          else
            IconButton(
              icon: const Icon(Icons.close_rounded, color: Colors.white),
              onPressed: () => context.go('/login'),
            ),
          const SizedBox(width: 4),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  _step == 1 ? 'Join DARMAN' : _step == 2 ? 'Your Details' : 'Professional Info',
                  style: const TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.w800,
                    fontSize: 18,
                  ),
                ),
                Text(
                  _step == 1
                      ? 'Choose your account type'
                      : _step == 2
                          ? 'Step 1 of ${_selectedType == UserType.doctor ? "2" : "1"}'
                          : 'Step 2 of 2 — Doctor credentials',
                  style: TextStyle(color: Colors.white.withOpacity(0.8), fontSize: 12),
                ),
              ],
            ),
          ),
          Icon(
            _selectedType == UserType.doctor
                ? Icons.medical_services_rounded
                : Icons.person_rounded,
            color: Colors.white70,
            size: 28,
          ),
        ],
      ),
    );
  }

  Widget _buildProgressBar() {
    if (_step == 1) return const SizedBox.shrink();
    
    double progress;
    if (_selectedType == UserType.patient) {
      progress = 1.0;
    } else {
      progress = _step == 2 ? 0.5 : 1.0;
    }

    return Container(
      color: AppColors.surface,
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
      child: LinearProgressIndicator(
        value: progress,
        backgroundColor: AppColors.divider,
        valueColor: const AlwaysStoppedAnimation<Color>(AppColors.primary),
        borderRadius: BorderRadius.circular(4),
        minHeight: 6,
      ),
    );
  }

  Widget _buildUserTypeSelection() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(20),
      child: Column(
        children: [
          const SizedBox(height: 20),
          const Text(
            'I am a...',
            style: TextStyle(fontSize: 20, fontWeight: FontWeight.w700),
          ),
          const SizedBox(height: 30),
          _UserTypeCard(
            icon: Icons.person_rounded,
            title: 'Patient',
            subtitle: 'Book appointments, consult doctors, manage health records',
            color: const Color(0xFF3B82F6),
            isSelected: _selectedType == UserType.patient,
            onTap: () => setState(() => _selectedType = UserType.patient),
          ),
          const SizedBox(height: 16),
          _UserTypeCard(
            icon: Icons.medical_services_rounded,
            title: 'Doctor',
            subtitle: 'Manage appointments, consult patients, write prescriptions',
            color: AppColors.primary,
            isSelected: _selectedType == UserType.doctor,
            onTap: () => setState(() => _selectedType = UserType.doctor),
          ),
          const SizedBox(height: 30),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: () => setState(() => _step = 2),
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.primary,
                padding: const EdgeInsets.symmetric(vertical: 16),
              ),
              child: const Text('Continue'),
            ),
          ),
          const SizedBox(height: 16),
          TextButton(
            onPressed: () => context.go('/login'),
            child: const Text('Already have an account? Sign in'),
          ),
        ],
      ),
    );
  }

  Widget _buildBasicInfo() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(20),
      child: Column(
        children: [
          _buildFormField(
            label: 'Full Name',
            ctrl: _nameCtrl,
            hint: _selectedType == UserType.doctor ? 'Dr. Ahmad Karimi' : 'Ahmad Karimi',
            icon: Icons.person_outline_rounded,
            validator: (v) => (v?.trim().isEmpty ?? true) ? 'Name is required' : null,
          ),
          _buildFormField(
            label: 'Email Address',
            ctrl: _emailCtrl,
            hint: 'example@email.com',
            icon: Icons.email_outlined,
            keyboardType: TextInputType.emailAddress,
            validator: (v) => (v?.contains('@') ?? false) ? null : 'Enter a valid email',
          ),
          _buildFormField(
            label: 'Phone Number',
            ctrl: _phoneCtrl,
            hint: '+93 700 000 000',
            icon: Icons.phone_outlined,
            keyboardType: TextInputType.phone,
            validator: (v) => (v?.trim().isEmpty ?? true) ? 'Phone is required' : null,
          ),
          _buildFormField(
            label: 'Password',
            ctrl: _passwordCtrl,
            hint: '••••••••',
            icon: Icons.lock_outline_rounded,
            isPassword: true,
            validator: (v) =>
                (v?.length ?? 0) < 6 ? 'Password must be at least 6 characters' : null,
          ),
          const SizedBox(height: 24),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: _selectedType == UserType.doctor
                  ? () => setState(() => _step = 3)
                  : _register,
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.primary,
                padding: const EdgeInsets.symmetric(vertical: 16),
              ),
              child: Text(_isLoading
                  ? 'Creating Account...'
                  : _selectedType == UserType.doctor
                      ? 'Next: Professional Info'
                      : 'Create Account'),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildDoctorInfo() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(20),
      child: Column(
        children: [
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'Medical Specialty',
                style: TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                  color: AppColors.textSecondary,
                ),
              ),
              const SizedBox(height: 6),
              DropdownButtonFormField<String>(
                hint: const Text('Select specialty'),
                decoration: InputDecoration(
                  filled: true,
                  fillColor: AppColors.background,
                  prefixIcon: const Icon(Icons.medical_information_outlined),
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                ),
                items: _specialties.map((s) => DropdownMenuItem(value: s, child: Text(s))).toList(),
                onChanged: (v) {
                  if (v != null) _specialtyCtrl.text = v;
                },
                validator: (v) => (v == null || v.isEmpty) ? 'Select a specialty' : null,
              ),
              const SizedBox(height: 14),
            ],
          ),
          _buildFormField(
            label: 'Medical Registration Number',
            ctrl: _regNoCtrl,
            hint: 'e.g., MED-12345-KBL',
            icon: Icons.badge_outlined,
            validator: (v) => (v?.trim().isEmpty ?? true) ? 'Registration number required' : null,
          ),
          _buildFormField(
            label: 'Hospital / Clinic',
            ctrl: _hospitalCtrl,
            hint: 'Wazir Akbar Khan Hospital',
            icon: Icons.local_hospital_outlined,
          ),
          _buildFormField(
            label: 'City',
            ctrl: _cityCtrl,
            hint: 'Kabul',
            icon: Icons.location_city_outlined,
            validator: (v) => (v?.trim().isEmpty ?? true) ? 'City is required' : null,
          ),
          _buildFormField(
            label: 'Years of Experience',
            ctrl: _expCtrl,
            hint: '5',
            icon: Icons.work_history_outlined,
            keyboardType: TextInputType.number,
          ),
          const SizedBox(height: 8),
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: const Color(0xFFFFF9E6),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: const Color(0xFFF59E0B)),
            ),
            child: const Row(
              children: [
                Icon(Icons.info_outline_rounded, color: Color(0xFFF59E0B), size: 18),
                SizedBox(width: 8),
                Expanded(
                  child: Text(
                    'Your account will be reviewed by admin before you can see patients.',
                    style: TextStyle(fontSize: 12, color: Color(0xFF92400E)),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: _isLoading ? null : _register,
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.primary,
                padding: const EdgeInsets.symmetric(vertical: 16),
              ),
              child: Text(_isLoading ? 'Creating Account...' : 'Create Doctor Account'),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildFormField({
    required String label,
    required TextEditingController ctrl,
    String? hint,
    IconData? icon,
    bool isPassword = false,
    TextInputType? keyboardType,
    String? Function(String?)? validator,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: const TextStyle(
            fontSize: 13,
            fontWeight: FontWeight.w600,
            color: AppColors.textSecondary,
          ),
        ),
        const SizedBox(height: 6),
        TextFormField(
          controller: ctrl,
          obscureText: isPassword && _obscurePassword,
          keyboardType: keyboardType,
          validator: validator,
          decoration: InputDecoration(
            hintText: hint,
            prefixIcon: icon != null ? Icon(icon, size: 20) : null,
            suffixIcon: isPassword
                ? IconButton(
                    icon: Icon(_obscurePassword
                        ? Icons.visibility_outlined
                        : Icons.visibility_off_outlined),
                    onPressed: () => setState(() => _obscurePassword = !_obscurePassword),
                  )
                : null,
            filled: true,
            fillColor: AppColors.background,
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
          ),
        ),
        const SizedBox(height: 14),
      ],
    );
  }
}

class _UserTypeCard extends StatelessWidget {
  final IconData icon;
  final String title;
  final String subtitle;
  final Color color;
  final bool isSelected;
  final VoidCallback onTap;

  const _UserTypeCard({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.color,
    required this.isSelected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: isSelected ? color : AppColors.outline,
            width: isSelected ? 2 : 1,
          ),
          boxShadow: isSelected
              ? [BoxShadow(color: color.withOpacity(0.2), blurRadius: 12, offset: const Offset(0, 4))]
              : null,
        ),
        child: Row(
          children: [
            Container(
              width: 56,
              height: 56,
              decoration: BoxDecoration(
                color: color.withOpacity(0.12),
                borderRadius: BorderRadius.circular(14),
              ),
              child: Icon(icon, color: color, size: 28),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: const TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w700,
                      color: AppColors.textPrimary,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    subtitle,
                    style: const TextStyle(fontSize: 12, color: AppColors.textHint),
                  ),
                ],
              ),
            ),
            if (isSelected)
              Container(
                width: 24,
                height: 24,
                decoration: BoxDecoration(
                  color: color,
                  shape: BoxShape.circle,
                ),
                child: const Icon(Icons.check, color: Colors.white, size: 16),
              ),
          ],
        ),
      ),
    );
  }
}
