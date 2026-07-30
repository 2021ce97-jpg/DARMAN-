import { initializeFirebase, getFirestore } from '../config/firebase.js';
import dotenv from 'dotenv';
dotenv.config();

initializeFirebase();
const db = getFirestore();

const doctors = [
  { fullName: 'Dr. Ahmad Karimi', specialty: 'Cardiologist', province: 'Kabul', city: 'Kabul City', hospital: 'Wazir Akbar Khan Hospital', experience: 12, fee: 800, rating: 4.8, reviewCount: 124, status: 'verified', about: 'Experienced cardiologist with 12 years of practice in Kabul.', photoUrl: 'https://i.pravatar.cc/150?img=11', isAvailableOnline: true, languages: ['Dari', 'Pashto', 'English'], createdAt: new Date().toISOString() },
  { fullName: 'Dr. Fatima Noori', specialty: 'Gynecologist', province: 'Kabul', city: 'Kabul City', hospital: 'Rabia Balkhi Hospital', experience: 8, fee: 600, rating: 4.9, reviewCount: 89, status: 'verified', about: 'Specialist in women\'s health and maternal care.', photoUrl: 'https://i.pravatar.cc/150?img=5', isAvailableOnline: false, languages: ['Dari', 'Pashto'], createdAt: new Date().toISOString() },
  { fullName: 'Dr. Khalid Ahmadzai', specialty: 'Pediatrician', province: 'Herat', city: 'Herat City', hospital: 'Herat Regional Hospital', experience: 15, fee: 700, rating: 4.7, reviewCount: 201, status: 'verified', about: 'Dedicated pediatrician serving children in Herat province.', photoUrl: 'https://i.pravatar.cc/150?img=15', isAvailableOnline: true, languages: ['Dari', 'Pashto', 'English'], createdAt: new Date().toISOString() },
  { fullName: 'Dr. Mariam Sultani', specialty: 'Dermatologist', province: 'Kabul', city: 'Kabul City', hospital: 'French Medical Institute', experience: 6, fee: 900, rating: 4.6, reviewCount: 67, status: 'verified', about: 'Skin specialist trained in France with expertise in modern dermatology.', photoUrl: 'https://i.pravatar.cc/150?img=9', isAvailableOnline: true, languages: ['Dari', 'French', 'English'], createdAt: new Date().toISOString() },
  { fullName: 'Dr. Noor Rahman', specialty: 'General Physician', province: 'Balkh', city: 'Mazar-i-Sharif', hospital: 'Balkh Regional Hospital', experience: 10, fee: 400, rating: 4.5, reviewCount: 312, status: 'verified', about: 'General physician providing primary healthcare in northern Afghanistan.', photoUrl: 'https://i.pravatar.cc/150?img=20', isAvailableOnline: true, languages: ['Dari', 'Uzbek', 'Pashto'], createdAt: new Date().toISOString() },
  { fullName: 'Dr. Zarghona Rahimi', specialty: 'Neurologist', province: 'Kabul', city: 'Kabul City', hospital: 'Jamhuriat Hospital', experience: 9, fee: 1000, rating: 4.7, reviewCount: 45, status: 'verified', about: 'Neurologist specializing in brain and nervous system disorders.', photoUrl: 'https://i.pravatar.cc/150?img=25', isAvailableOnline: true, languages: ['Dari', 'English'], createdAt: new Date().toISOString() },
  { fullName: 'Dr. Habibullah Safi', specialty: 'Orthopedic', province: 'Kandahar', city: 'Kandahar City', hospital: 'Mirwais Hospital', experience: 14, fee: 850, rating: 4.4, reviewCount: 98, status: 'verified', about: 'Orthopedic surgeon with expertise in bone and joint surgery.', photoUrl: 'https://i.pravatar.cc/150?img=30', isAvailableOnline: false, languages: ['Pashto', 'Dari'], createdAt: new Date().toISOString() },
  { fullName: 'Dr. Laila Ahmadi', specialty: 'Psychiatrist', province: 'Kabul', city: 'Kabul City', hospital: 'Mental Health Hospital', experience: 7, fee: 750, rating: 4.8, reviewCount: 56, status: 'verified', about: 'Psychiatrist helping patients with mental health challenges.', photoUrl: 'https://i.pravatar.cc/150?img=35', isAvailableOnline: true, languages: ['Dari', 'English'], createdAt: new Date().toISOString() },
  { fullName: 'Dr. Mohammad Yusuf', specialty: 'Dentist', province: 'Kabul', city: 'Kabul City', hospital: 'Kabul Dental Clinic', experience: 5, fee: 500, rating: 4.3, reviewCount: 78, status: 'verified', about: 'Dentist providing comprehensive dental care.', photoUrl: 'https://i.pravatar.cc/150?img=40', isAvailableOnline: false, languages: ['Dari', 'Pashto'], createdAt: new Date().toISOString() },
  { fullName: 'Dr. Shirin Kargar', specialty: 'ENT Specialist', province: 'Herat', city: 'Herat City', hospital: 'Herat Regional Hospital', experience: 11, fee: 650, rating: 4.6, reviewCount: 134, status: 'verified', about: 'ENT specialist with extensive experience in ear, nose and throat conditions.', photoUrl: 'https://i.pravatar.cc/150?img=45', isAvailableOnline: true, languages: ['Dari', 'Pashto'], createdAt: new Date().toISOString() },
];

const hospitals = [
  { name: 'Wazir Akbar Khan Hospital', province: 'Kabul', city: 'Kabul City', address: 'Wazir Akbar Khan, Kabul', phone: '+93-20-2100000', type: 'Government', beds: 400, status: 'verified', specialties: ['Cardiology', 'Surgery', 'Emergency', 'Pediatrics'], rating: 4.2, createdAt: new Date().toISOString() },
  { name: 'French Medical Institute for Mothers and Children', province: 'Kabul', city: 'Kabul City', address: 'Aliabad, Kabul', phone: '+93-20-2200000', type: 'NGO', beds: 200, status: 'verified', specialties: ['Gynecology', 'Pediatrics', 'Neonatology'], rating: 4.7, createdAt: new Date().toISOString() },
  { name: 'Herat Regional Hospital', province: 'Herat', city: 'Herat City', address: 'Herat City Center', phone: '+93-40-2200000', type: 'Government', beds: 600, status: 'verified', specialties: ['General Medicine', 'Surgery', 'Orthopedics', 'Cardiology'], rating: 4.0, createdAt: new Date().toISOString() },
  { name: 'Jamhuriat Hospital', province: 'Kabul', city: 'Kabul City', address: 'Shahr-e-Naw, Kabul', phone: '+93-20-2300000', type: 'Government', beds: 350, status: 'verified', specialties: ['Neurology', 'Internal Medicine', 'Surgery'], rating: 4.1, createdAt: new Date().toISOString() },
  { name: 'Mirwais Hospital', province: 'Kandahar', city: 'Kandahar City', address: 'Kandahar City', phone: '+93-50-2100000', type: 'Government', beds: 500, status: 'verified', specialties: ['General Medicine', 'Surgery', 'Orthopedics'], rating: 3.9, createdAt: new Date().toISOString() },
  { name: 'Rabia Balkhi Hospital', province: 'Kabul', city: 'Kabul City', address: 'Karte Char, Kabul', phone: '+93-20-2400000', type: 'Government', beds: 250, status: 'verified', specialties: ['Gynecology', 'Obstetrics', 'Pediatrics'], rating: 4.3, createdAt: new Date().toISOString() },
];

const labs = [
  { name: 'Kabul Diagnostic Center', province: 'Kabul', city: 'Kabul City', address: 'Share Naw, Kabul', phone: '+93-20-2300000', status: 'verified', services: ['Blood Tests', 'X-Ray', 'Ultrasound', 'MRI', 'CT Scan'], rating: 4.4, createdAt: new Date().toISOString() },
  { name: 'Afghan Lab Services', province: 'Kabul', city: 'Kabul City', address: 'Macroyan, Kabul', phone: '+93-20-2400000', status: 'verified', services: ['Blood Tests', 'Urine Tests', 'PCR', 'Pathology'], rating: 4.3, createdAt: new Date().toISOString() },
  { name: 'Herat Medical Lab', province: 'Herat', city: 'Herat City', address: 'Herat City', phone: '+93-40-2300000', status: 'verified', services: ['Blood Tests', 'X-Ray', 'Ultrasound'], rating: 4.2, createdAt: new Date().toISOString() },
  { name: 'Kandahar Diagnostic Lab', province: 'Kandahar', city: 'Kandahar City', address: 'Kandahar City', phone: '+93-50-2200000', status: 'verified', services: ['Blood Tests', 'Urine Tests', 'X-Ray'], rating: 4.0, createdAt: new Date().toISOString() },
];

const pharmacies = [
  { name: 'Shifa Pharmacy', province: 'Kabul', city: 'Kabul City', address: 'Share Naw, Kabul', phone: '+93-20-2500000', status: 'verified', openHours: '8:00 AM - 10:00 PM', rating: 4.5, createdAt: new Date().toISOString() },
  { name: 'Sehat Pharmacy', province: 'Kabul', city: 'Kabul City', address: 'Karte Char, Kabul', phone: '+93-20-2600000', status: 'verified', openHours: '7:00 AM - 11:00 PM', rating: 4.6, createdAt: new Date().toISOString() },
  { name: 'Herat Pharmacy', province: 'Herat', city: 'Herat City', address: 'Herat City', phone: '+93-40-2400000', status: 'verified', openHours: '8:00 AM - 9:00 PM', rating: 4.3, createdAt: new Date().toISOString() },
  { name: 'Kandahar Pharmacy', province: 'Kandahar', city: 'Kandahar City', address: 'Kandahar City', phone: '+93-50-2300000', status: 'verified', openHours: '8:00 AM - 8:00 PM', rating: 4.1, createdAt: new Date().toISOString() },
];

async function seed() {
  console.log('🌱 Seeding Firestore database...\n');
  let total = 0;

  const collections = [
    { name: 'doctors', data: doctors },
    { name: 'hospitals', data: hospitals },
    { name: 'labs', data: labs },
    { name: 'pharmacies', data: pharmacies },
  ];

  for (const { name, data } of collections) {
    console.log(`📝 Adding ${data.length} ${name}...`);
    for (const item of data) {
      try {
        await db.collection(name).add(item);
        total++;
      } catch (e) {
        console.error(`  ❌ Failed: ${e.message}`);
      }
    }
    console.log(`  ✅ Done`);
  }

  console.log(`\n✅ Seeded ${total} documents total!`);
  console.log('🌐 View at: https://console.firebase.google.com/project/mediconnect-4b155/firestore');
  process.exit(0);
}

seed().catch(e => { console.error('❌', e.message); process.exit(1); });
