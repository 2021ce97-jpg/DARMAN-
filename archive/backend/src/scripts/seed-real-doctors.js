/**
 * Seed Real Doctor Accounts into Firebase Auth + Firestore
 * Creates doctor users with login credentials and full profiles
 * Run: node src/scripts/seed-real-doctors.js
 */
import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import dotenv from 'dotenv';
dotenv.config();

// Initialize Firebase Admin
const sa = JSON.parse(readFileSync('./serviceAccountKey.json', 'utf8'));
if (!admin.apps.length) {
  admin.initializeApp({ credential: admin.credential.cert(sa) });
}

// Get Firestore and configure with database settings
const db = admin.firestore();
try {
  db.settings({ ignoreUndefinedProperties: true, databaseId: 'default' });
} catch(_) { /* already set */ }

const realDoctors = [
  {
    email: 'dr.karimi@darman.af',
    password: 'Darman2026!',
    displayName: 'Dr. Ahmad Karimi',
    profile: {
      specialty: 'Cardiologist',
      province: 'Kabul',
      city: 'Kabul City',
      hospital: 'Wazir Akbar Khan Hospital',
      experience: 12,
      fee: 800,
      rating: 4.8,
      reviewCount: 124,
      about: 'Senior cardiologist with 12 years of practice at Wazir Akbar Khan Hospital. Specializes in interventional cardiology and heart failure management.',
      education: 'MBBS, MD Cardiology - Kabul University of Medical Sciences',
      photoUrl: 'https://i.pravatar.cc/150?img=11',
      languages: ['Dari', 'Pashto', 'English'],
      isAvailableOnline: true,
      availableDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday'],
      availableHours: '8:00 AM - 4:00 PM',
      phone: '+93-70-1234567',
    },
  },
  {
    email: 'dr.noori@darman.af',
    password: 'Darman2026!',
    displayName: 'Dr. Fatima Noori',
    profile: {
      specialty: 'Gynecologist',
      province: 'Kabul',
      city: 'Kabul City',
      hospital: 'Rabia Balkhi Hospital',
      experience: 8,
      fee: 600,
      rating: 4.9,
      reviewCount: 89,
      about: 'Specialist in women\'s health and maternal care. Dedicated to improving maternal health outcomes in Afghanistan.',
      education: 'MBBS, MD Obstetrics & Gynecology - Kabul Medical University',
      photoUrl: 'https://i.pravatar.cc/150?img=5',
      languages: ['Dari', 'Pashto'],
      isAvailableOnline: false,
      availableDays: ['Sunday', 'Monday', 'Tuesday', 'Wednesday'],
      availableHours: '9:00 AM - 3:00 PM',
      phone: '+93-70-2345678',
    },
  },
  {
    email: 'dr.ahmadzai@darman.af',
    password: 'Darman2026!',
    displayName: 'Dr. Khalid Ahmadzai',
    profile: {
      specialty: 'Pediatrician',
      province: 'Herat',
      city: 'Herat City',
      hospital: 'Herat Regional Hospital',
      experience: 15,
      fee: 700,
      rating: 4.7,
      reviewCount: 201,
      about: 'Dedicated pediatrician serving children across Herat province for over 15 years. Expert in neonatal care and childhood diseases.',
      education: 'MBBS, MD Pediatrics - Herat University',
      photoUrl: 'https://i.pravatar.cc/150?img=15',
      languages: ['Dari', 'Pashto', 'English'],
      isAvailableOnline: true,
      availableDays: ['Monday', 'Wednesday', 'Thursday', 'Saturday'],
      availableHours: '8:00 AM - 5:00 PM',
      phone: '+93-70-3456789',
    },
  },
  {
    email: 'dr.sultani@darman.af',
    password: 'Darman2026!',
    displayName: 'Dr. Mariam Sultani',
    profile: {
      specialty: 'Dermatologist',
      province: 'Kabul',
      city: 'Kabul City',
      hospital: 'French Medical Institute',
      experience: 6,
      fee: 900,
      rating: 4.6,
      reviewCount: 67,
      about: 'Skin specialist trained in France. Expert in cosmetic dermatology, acne treatment, and skin cancer screening.',
      education: 'MBBS, MD Dermatology - Université Paris Descartes',
      photoUrl: 'https://i.pravatar.cc/150?img=9',
      languages: ['Dari', 'French', 'English'],
      isAvailableOnline: true,
      availableDays: ['Tuesday', 'Thursday', 'Saturday'],
      availableHours: '10:00 AM - 6:00 PM',
      phone: '+93-70-4567890',
    },
  },
  {
    email: 'dr.rahman@darman.af',
    password: 'Darman2026!',
    displayName: 'Dr. Noor Rahman',
    profile: {
      specialty: 'General Physician',
      province: 'Balkh',
      city: 'Mazar-i-Sharif',
      hospital: 'Balkh Regional Hospital',
      experience: 10,
      fee: 400,
      rating: 4.5,
      reviewCount: 312,
      about: 'General physician providing primary healthcare in northern Afghanistan. Known for affordable and accessible care.',
      education: 'MBBS - Balkh University of Medical Sciences',
      photoUrl: 'https://i.pravatar.cc/150?img=20',
      languages: ['Dari', 'Uzbek', 'Pashto'],
      isAvailableOnline: true,
      availableDays: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday'],
      availableHours: '7:00 AM - 3:00 PM',
      phone: '+93-70-5678901',
    },
  },
  {
    email: 'dr.rahimi@darman.af',
    password: 'Darman2026!',
    displayName: 'Dr. Zarghona Rahimi',
    profile: {
      specialty: 'Neurologist',
      province: 'Kabul',
      city: 'Kabul City',
      hospital: 'Jamhuriat Hospital',
      experience: 9,
      fee: 1000,
      rating: 4.7,
      reviewCount: 45,
      about: 'Neurologist specializing in brain and nervous system disorders including epilepsy, stroke, and headache management.',
      education: 'MBBS, MD Neurology - Kabul University',
      photoUrl: 'https://i.pravatar.cc/150?img=25',
      languages: ['Dari', 'English'],
      isAvailableOnline: true,
      availableDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday'],
      availableHours: '9:00 AM - 4:00 PM',
      phone: '+93-70-6789012',
    },
  },
  {
    email: 'dr.safi@darman.af',
    password: 'Darman2026!',
    displayName: 'Dr. Habibullah Safi',
    profile: {
      specialty: 'Orthopedic Surgeon',
      province: 'Kandahar',
      city: 'Kandahar City',
      hospital: 'Mirwais Hospital',
      experience: 14,
      fee: 850,
      rating: 4.4,
      reviewCount: 98,
      about: 'Orthopedic surgeon with expertise in bone and joint surgery. Extensive experience in trauma surgery and sports medicine.',
      education: 'MBBS, MS Orthopedics - Kandahar University',
      photoUrl: 'https://i.pravatar.cc/150?img=30',
      languages: ['Pashto', 'Dari'],
      isAvailableOnline: false,
      availableDays: ['Sunday', 'Monday', 'Wednesday', 'Thursday'],
      availableHours: '8:00 AM - 2:00 PM',
      phone: '+93-70-7890123',
    },
  },
  {
    email: 'dr.ahmadi@darman.af',
    password: 'Darman2026!',
    displayName: 'Dr. Laila Ahmadi',
    profile: {
      specialty: 'Psychiatrist',
      province: 'Kabul',
      city: 'Kabul City',
      hospital: 'Kabul Mental Health Hospital',
      experience: 7,
      fee: 750,
      rating: 4.8,
      reviewCount: 56,
      about: 'Psychiatrist dedicated to mental health awareness and treatment. Specializes in PTSD, anxiety, and depression management.',
      education: 'MBBS, MD Psychiatry - Kabul Medical University',
      photoUrl: 'https://i.pravatar.cc/150?img=35',
      languages: ['Dari', 'English'],
      isAvailableOnline: true,
      availableDays: ['Monday', 'Tuesday', 'Thursday', 'Saturday'],
      availableHours: '10:00 AM - 5:00 PM',
      phone: '+93-70-8901234',
    },
  },
];

async function seedDoctors() {
  console.log('🏥 Seeding Real Doctor Accounts...\n');
  console.log('═══════════════════════════════════════════════════\n');

  // First test Firestore connectivity
  console.log('🔍 Testing Firestore connectivity...');
  try {
    const testRef = db.collection('_test_connectivity');
    const testDoc = await testRef.add({ test: true, ts: new Date().toISOString() });
    await testRef.doc(testDoc.id).delete();
    console.log('✅ Firestore is accessible!\n');
  } catch (e) {
    console.error('❌ Firestore connection failed:', e.message);
    console.error('   Please ensure the Firestore database exists at:');
    console.error('   https://console.firebase.google.com/project/mediconnect-4b155/firestore');
    console.error('\n   The doctor Auth accounts were created, but Firestore profiles could not be written.');
    console.error('   You may need to create the Firestore database first.\n');
    // Continue anyway with Auth-only creation
  }

  const results = [];

  for (const doc of realDoctors) {
    try {
      let userRecord;
      try {
        userRecord = await admin.auth().getUserByEmail(doc.email);
        await admin.auth().updateUser(userRecord.uid, {
          password: doc.password,
          displayName: doc.displayName,
          emailVerified: true,
          disabled: false,
        });
        console.log(`ℹ️  Updated existing Auth: ${doc.email}`);
      } catch (_) {
        userRecord = await admin.auth().createUser({
          email: doc.email,
          password: doc.password,
          displayName: doc.displayName,
          emailVerified: true,
        });
        console.log(`✅ Created new Auth: ${doc.email}`);
      }

      // Set custom claims
      await admin.auth().setCustomUserClaims(userRecord.uid, { role: 'doctor' });

      // Try Firestore writes
      try {
        // Create user document
        await db.collection('users').doc(userRecord.uid).set({
          uid: userRecord.uid,
          email: doc.email,
          fullName: doc.displayName,
          name: doc.displayName,
          role: 'doctor',
          status: 'verified',
          isBanned: false,
          updatedAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
        }, { merge: true });

        // Create doctor profile document
        await db.collection('doctors').doc(userRecord.uid).set({
          userId: userRecord.uid,
          fullName: doc.displayName,
          name: doc.displayName,
          email: doc.email,
          status: 'verified',
          verifiedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          ...doc.profile,
        }, { merge: true });

        console.log(`   ✅ Firestore profile created`);
      } catch (fsErr) {
        console.log(`   ⚠️  Firestore write skipped: ${fsErr.message}`);
      }

      results.push({
        name: doc.displayName,
        email: doc.email,
        password: doc.password,
        uid: userRecord.uid,
        specialty: doc.profile.specialty,
      });

      console.log(`   UID: ${userRecord.uid}`);
      console.log(`   Specialty: ${doc.profile.specialty}`);
      console.log(`   Hospital: ${doc.profile.hospital}\n`);

    } catch (e) {
      console.error(`❌ Failed ${doc.email}: ${e.message}`);
    }
  }

  console.log('═══════════════════════════════════════════════════');
  console.log('\n🎉 Doctor accounts seeded!\n');
  console.log('📋 DOCTOR LOGIN CREDENTIALS:');
  console.log('═══════════════════════════════════════════════════');
  for (const r of results) {
    console.log(`  ${r.name}`);
    console.log(`    Email:     ${r.email}`);
    console.log(`    Password:  ${r.password}`);
    console.log(`    Specialty: ${r.specialty}`);
    console.log(`    UID:       ${r.uid}`);
    console.log('');
  }
  console.log('═══════════════════════════════════════════════════');
  console.log(`\n✅ Total: ${results.length} doctors with Auth accounts`);
  console.log('🌐 Login at: https://mediconnect-4b155.web.app/login');
  console.log('📱 Or use the DARMAN mobile app\n');

  process.exit(0);
}

seedDoctors().catch(e => {
  console.error('❌ Fatal error:', e.message);
  process.exit(1);
});
