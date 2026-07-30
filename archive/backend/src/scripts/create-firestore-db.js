/**
 * Creates the Firestore database using Firebase Management API
 * Run this if the database doesn't exist yet
 */
import { readFileSync } from 'fs';
import { GoogleAuth } from 'google-auth-library';
import dotenv from 'dotenv';

dotenv.config();

const PROJECT_ID = 'mediconnect-4b155';

async function getAccessToken() {
  const serviceAccount = JSON.parse(readFileSync('./serviceAccountKey.json', 'utf8'));
  const auth = new GoogleAuth({
    credentials: serviceAccount,
    scopes: [
      'https://www.googleapis.com/auth/cloud-platform',
      'https://www.googleapis.com/auth/datastore',
    ],
  });
  const client = await auth.getClient();
  const tokenResponse = await client.getAccessToken();
  return tokenResponse.token;
}

async function createFirestoreDatabase() {
  console.log('🔥 Attempting to create Firestore database...\n');

  try {
    const token = await getAccessToken();

    // Try to create the database
    const createUrl = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases?databaseId=(default)`;
    
    const response = await fetch(createUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'FIRESTORE_NATIVE',
        locationId: 'nam5', // US multi-region
      }),
    });

    const result = await response.json();

    if (response.ok) {
      console.log('✅ Firestore database creation initiated!');
      console.log('   Waiting for database to be ready...');
      
      // Wait for database to be ready
      await new Promise(resolve => setTimeout(resolve, 10000));
      
      console.log('✅ Database should be ready now!');
      console.log('\n📝 Now seeding data...');
      
      // Now seed the data
      await seedData(token);
    } else if (result.error?.code === 409) {
      console.log('ℹ️  Database already exists!');
      console.log('\n📝 Seeding data...');
      await seedData(token);
    } else {
      console.error('❌ Failed to create database:', JSON.stringify(result.error, null, 2));
      console.log('\n💡 Please create the database manually:');
      console.log('   https://console.firebase.google.com/project/mediconnect-4b155/firestore');
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

async function createDocument(token, collection, docId, data) {
  const BASE_URL = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;
  
  const fields = {};
  for (const [key, value] of Object.entries(data)) {
    if (typeof value === 'string') {
      fields[key] = { stringValue: value };
    } else if (typeof value === 'number') {
      if (Number.isInteger(value)) {
        fields[key] = { integerValue: String(value) };
      } else {
        fields[key] = { doubleValue: value };
      }
    } else if (typeof value === 'boolean') {
      fields[key] = { booleanValue: value };
    } else if (Array.isArray(value)) {
      fields[key] = {
        arrayValue: {
          values: value.map(v => ({ stringValue: String(v) })),
        },
      };
    }
  }

  const url = `${BASE_URL}/${collection}?documentId=${docId}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ fields }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to create ${collection}/${docId}: ${error}`);
  }

  return await response.json();
}

async function seedData(token) {
  const doctors = [
    { id: 'doc_001', fullName: 'Dr. Ahmad Karimi', specialty: 'Cardiologist', province: 'Kabul', city: 'Kabul City', hospital: 'Wazir Akbar Khan Hospital', experience: 12, fee: 800, rating: 4.8, reviewCount: 124, status: 'verified', about: 'Experienced cardiologist with 12 years of practice.', photoUrl: 'https://i.pravatar.cc/150?img=11', isAvailableOnline: true, createdAt: new Date().toISOString() },
    { id: 'doc_002', fullName: 'Dr. Fatima Noori', specialty: 'Gynecologist', province: 'Kabul', city: 'Kabul City', hospital: 'Rabia Balkhi Hospital', experience: 8, fee: 600, rating: 4.9, reviewCount: 89, status: 'verified', about: 'Specialist in women\'s health and maternal care.', photoUrl: 'https://i.pravatar.cc/150?img=5', isAvailableOnline: false, createdAt: new Date().toISOString() },
    { id: 'doc_003', fullName: 'Dr. Khalid Ahmadzai', specialty: 'Pediatrician', province: 'Herat', city: 'Herat City', hospital: 'Herat Regional Hospital', experience: 15, fee: 700, rating: 4.7, reviewCount: 201, status: 'verified', about: 'Dedicated pediatrician serving children in Herat.', photoUrl: 'https://i.pravatar.cc/150?img=15', isAvailableOnline: true, createdAt: new Date().toISOString() },
    { id: 'doc_004', fullName: 'Dr. Mariam Sultani', specialty: 'Dermatologist', province: 'Kabul', city: 'Kabul City', hospital: 'French Medical Institute', experience: 6, fee: 900, rating: 4.6, reviewCount: 67, status: 'verified', about: 'Skin specialist trained in France.', photoUrl: 'https://i.pravatar.cc/150?img=9', isAvailableOnline: true, createdAt: new Date().toISOString() },
    { id: 'doc_005', fullName: 'Dr. Noor Rahman', specialty: 'General Physician', province: 'Balkh', city: 'Mazar-i-Sharif', hospital: 'Balkh Regional Hospital', experience: 10, fee: 400, rating: 4.5, reviewCount: 312, status: 'verified', about: 'General physician providing primary healthcare.', photoUrl: 'https://i.pravatar.cc/150?img=20', isAvailableOnline: true, createdAt: new Date().toISOString() },
    { id: 'doc_006', fullName: 'Dr. Zarghona Rahimi', specialty: 'Neurologist', province: 'Kabul', city: 'Kabul City', hospital: 'Jamhuriat Hospital', experience: 9, fee: 1000, rating: 4.7, reviewCount: 45, status: 'verified', about: 'Neurologist specializing in brain and nervous system disorders.', photoUrl: 'https://i.pravatar.cc/150?img=25', isAvailableOnline: true, createdAt: new Date().toISOString() },
    { id: 'doc_007', fullName: 'Dr. Habibullah Safi', specialty: 'Orthopedic', province: 'Kandahar', city: 'Kandahar City', hospital: 'Mirwais Hospital', experience: 14, fee: 850, rating: 4.4, reviewCount: 98, status: 'verified', about: 'Orthopedic surgeon with expertise in bone and joint surgery.', photoUrl: 'https://i.pravatar.cc/150?img=30', isAvailableOnline: false, createdAt: new Date().toISOString() },
    { id: 'doc_008', fullName: 'Dr. Laila Ahmadi', specialty: 'Psychiatrist', province: 'Kabul', city: 'Kabul City', hospital: 'Mental Health Hospital', experience: 7, fee: 750, rating: 4.8, reviewCount: 56, status: 'verified', about: 'Psychiatrist helping patients with mental health challenges.', photoUrl: 'https://i.pravatar.cc/150?img=35', isAvailableOnline: true, createdAt: new Date().toISOString() },
  ];

  const hospitals = [
    { id: 'hosp_001', name: 'Wazir Akbar Khan Hospital', province: 'Kabul', city: 'Kabul City', address: 'Wazir Akbar Khan, Kabul', phone: '+93-20-2100000', type: 'Government', beds: 400, status: 'verified', rating: 4.2, createdAt: new Date().toISOString() },
    { id: 'hosp_002', name: 'French Medical Institute', province: 'Kabul', city: 'Kabul City', address: 'Aliabad, Kabul', phone: '+93-20-2200000', type: 'NGO', beds: 200, status: 'verified', rating: 4.7, createdAt: new Date().toISOString() },
    { id: 'hosp_003', name: 'Herat Regional Hospital', province: 'Herat', city: 'Herat City', address: 'Herat City Center', phone: '+93-40-2200000', type: 'Government', beds: 600, status: 'verified', rating: 4.0, createdAt: new Date().toISOString() },
    { id: 'hosp_004', name: 'Jamhuriat Hospital', province: 'Kabul', city: 'Kabul City', address: 'Shahr-e-Naw, Kabul', phone: '+93-20-2300000', type: 'Government', beds: 350, status: 'verified', rating: 4.1, createdAt: new Date().toISOString() },
    { id: 'hosp_005', name: 'Mirwais Hospital', province: 'Kandahar', city: 'Kandahar City', address: 'Kandahar City', phone: '+93-50-2100000', type: 'Government', beds: 500, status: 'verified', rating: 3.9, createdAt: new Date().toISOString() },
  ];

  const labs = [
    { id: 'lab_001', name: 'Kabul Diagnostic Center', province: 'Kabul', city: 'Kabul City', address: 'Share Naw, Kabul', phone: '+93-20-2300000', status: 'verified', rating: 4.4, createdAt: new Date().toISOString() },
    { id: 'lab_002', name: 'Afghan Lab Services', province: 'Kabul', city: 'Kabul City', address: 'Macroyan, Kabul', phone: '+93-20-2400000', status: 'verified', rating: 4.3, createdAt: new Date().toISOString() },
    { id: 'lab_003', name: 'Herat Medical Lab', province: 'Herat', city: 'Herat City', address: 'Herat City', phone: '+93-40-2300000', status: 'verified', rating: 4.2, createdAt: new Date().toISOString() },
  ];

  const pharmacies = [
    { id: 'pharm_001', name: 'Shifa Pharmacy', province: 'Kabul', city: 'Kabul City', address: 'Share Naw, Kabul', phone: '+93-20-2500000', status: 'verified', openHours: '8:00 AM - 10:00 PM', rating: 4.5, createdAt: new Date().toISOString() },
    { id: 'pharm_002', name: 'Sehat Pharmacy', province: 'Kabul', city: 'Kabul City', address: 'Karte Char, Kabul', phone: '+93-20-2600000', status: 'verified', openHours: '7:00 AM - 11:00 PM', rating: 4.6, createdAt: new Date().toISOString() },
    { id: 'pharm_003', name: 'Herat Pharmacy', province: 'Herat', city: 'Herat City', address: 'Herat City', phone: '+93-40-2400000', status: 'verified', openHours: '8:00 AM - 9:00 PM', rating: 4.3, createdAt: new Date().toISOString() },
  ];

  let created = 0;
  let failed = 0;

  console.log('📝 Creating doctors...');
  for (const doc of doctors) {
    try {
      const { id, ...data } = doc;
      await createDocument(token, 'doctors', id, data);
      console.log(`  ✅ ${doc.fullName}`);
      created++;
    } catch (e) {
      console.log(`  ⚠️  ${doc.fullName}: ${e.message.substring(0, 80)}`);
      failed++;
    }
  }

  console.log('\n🏥 Creating hospitals...');
  for (const h of hospitals) {
    try {
      const { id, ...data } = h;
      await createDocument(token, 'hospitals', id, data);
      console.log(`  ✅ ${h.name}`);
      created++;
    } catch (e) {
      console.log(`  ⚠️  ${h.name}: ${e.message.substring(0, 80)}`);
      failed++;
    }
  }

  console.log('\n🔬 Creating labs...');
  for (const l of labs) {
    try {
      const { id, ...data } = l;
      await createDocument(token, 'labs', id, data);
      console.log(`  ✅ ${l.name}`);
      created++;
    } catch (e) {
      console.log(`  ⚠️  ${l.name}: ${e.message.substring(0, 80)}`);
      failed++;
    }
  }

  console.log('\n💊 Creating pharmacies...');
  for (const p of pharmacies) {
    try {
      const { id, ...data } = p;
      await createDocument(token, 'pharmacies', id, data);
      console.log(`  ✅ ${p.name}`);
      created++;
    } catch (e) {
      console.log(`  ⚠️  ${p.name}: ${e.message.substring(0, 80)}`);
      failed++;
    }
  }

  console.log(`\n✅ Done! Created: ${created}, Failed: ${failed}`);
  console.log('\n🌐 View your data:');
  console.log('   https://console.firebase.google.com/project/mediconnect-4b155/firestore');
  process.exit(0);
}

createFirestoreDatabase();
