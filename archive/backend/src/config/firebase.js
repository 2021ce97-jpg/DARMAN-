import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import dotenv from 'dotenv';

dotenv.config();

let firebaseApp;
let mockMode = false;

// In-memory mock store for demo/development without Firebase credentials
export const mockStore = {
  users: new Map(),
  doctors: new Map(),
  appointments: new Map(),
  hospitals: new Map(),
  labs: new Map(),
  pharmacies: new Map(),
  bookings: new Map(),
  medical_records: new Map(),
  payments: new Map(),
  notifications: new Map(),
  reviews: new Map(),
};

// Seed mock data
const seedMockData = () => {
  // Seed doctors
  const doctors = [
    {
      id: 'doc_001',
      fullName: 'Dr. Ahmad Karimi',
      specialty: 'Cardiologist',
      province: 'Kabul',
      city: 'Kabul City',
      hospital: 'Wazir Akbar Khan Hospital',
      experience: 12,
      fee: 800,
      rating: 4.8,
      reviewCount: 124,
      status: 'verified',
      languages: ['Dari', 'Pashto', 'English'],
      education: 'MBBS, MD Cardiology - Kabul University',
      about: 'Experienced cardiologist with 12 years of practice in Kabul.',
      photoUrl: 'https://i.pravatar.cc/150?img=11',
      availableDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday'],
      createdAt: new Date().toISOString(),
    },
    {
      id: 'doc_002',
      fullName: 'Dr. Fatima Noori',
      specialty: 'Gynecologist',
      province: 'Kabul',
      city: 'Kabul City',
      hospital: 'Rabia Balkhi Hospital',
      experience: 8,
      fee: 600,
      rating: 4.9,
      reviewCount: 89,
      status: 'verified',
      languages: ['Dari', 'Pashto'],
      education: 'MBBS, MD Gynecology - Kabul Medical University',
      about: 'Specialist in women\'s health and maternal care.',
      photoUrl: 'https://i.pravatar.cc/150?img=5',
      availableDays: ['Sunday', 'Monday', 'Tuesday', 'Wednesday'],
      createdAt: new Date().toISOString(),
    },
    {
      id: 'doc_003',
      fullName: 'Dr. Khalid Ahmadzai',
      specialty: 'Pediatrician',
      province: 'Herat',
      city: 'Herat City',
      hospital: 'Herat Regional Hospital',
      experience: 15,
      fee: 700,
      rating: 4.7,
      reviewCount: 201,
      status: 'verified',
      languages: ['Dari', 'Pashto', 'English'],
      education: 'MBBS, MD Pediatrics - Herat University',
      about: 'Dedicated pediatrician serving children in Herat province.',
      photoUrl: 'https://i.pravatar.cc/150?img=15',
      availableDays: ['Monday', 'Wednesday', 'Thursday', 'Saturday'],
      createdAt: new Date().toISOString(),
    },
    {
      id: 'doc_004',
      fullName: 'Dr. Mariam Sultani',
      specialty: 'Dermatologist',
      province: 'Kabul',
      city: 'Kabul City',
      hospital: 'French Medical Institute',
      experience: 6,
      fee: 900,
      rating: 4.6,
      reviewCount: 67,
      status: 'verified',
      languages: ['Dari', 'French', 'English'],
      education: 'MBBS, MD Dermatology - Paris University',
      about: 'Skin specialist trained in France with expertise in modern dermatology.',
      photoUrl: 'https://i.pravatar.cc/150?img=9',
      availableDays: ['Tuesday', 'Thursday', 'Saturday'],
      createdAt: new Date().toISOString(),
    },
    {
      id: 'doc_005',
      fullName: 'Dr. Noor Rahman',
      specialty: 'General Physician',
      province: 'Balkh',
      city: 'Mazar-i-Sharif',
      hospital: 'Balkh Regional Hospital',
      experience: 10,
      fee: 400,
      rating: 4.5,
      reviewCount: 312,
      status: 'verified',
      languages: ['Dari', 'Uzbek', 'Pashto'],
      education: 'MBBS - Balkh University',
      about: 'General physician providing primary healthcare in northern Afghanistan.',
      photoUrl: 'https://i.pravatar.cc/150?img=20',
      availableDays: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday'],
      createdAt: new Date().toISOString(),
    },
  ];

  doctors.forEach(d => mockStore.doctors.set(d.id, d));

  // Seed hospitals
  const hospitals = [
    {
      id: 'hosp_001',
      name: 'Wazir Akbar Khan Hospital',
      province: 'Kabul',
      city: 'Kabul City',
      address: 'Wazir Akbar Khan, Kabul',
      phone: '+93-20-2100000',
      type: 'Government',
      beds: 400,
      status: 'verified',
      specialties: ['Cardiology', 'Surgery', 'Emergency', 'Pediatrics'],
      rating: 4.2,
      photoUrl: 'https://picsum.photos/seed/hosp1/400/200',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'hosp_002',
      name: 'French Medical Institute for Mothers and Children',
      province: 'Kabul',
      city: 'Kabul City',
      address: 'Aliabad, Kabul',
      phone: '+93-20-2200000',
      type: 'NGO',
      beds: 200,
      status: 'verified',
      specialties: ['Gynecology', 'Pediatrics', 'Neonatology'],
      rating: 4.7,
      photoUrl: 'https://picsum.photos/seed/hosp2/400/200',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'hosp_003',
      name: 'Herat Regional Hospital',
      province: 'Herat',
      city: 'Herat City',
      address: 'Herat City Center',
      phone: '+93-40-2200000',
      type: 'Government',
      beds: 600,
      status: 'verified',
      specialties: ['General Medicine', 'Surgery', 'Orthopedics', 'Cardiology'],
      rating: 4.0,
      photoUrl: 'https://picsum.photos/seed/hosp3/400/200',
      createdAt: new Date().toISOString(),
    },
  ];

  hospitals.forEach(h => mockStore.hospitals.set(h.id, h));

  // Seed labs
  const labs = [
    {
      id: 'lab_001',
      name: 'Kabul Diagnostic Center',
      province: 'Kabul',
      city: 'Kabul City',
      address: 'Share Naw, Kabul',
      phone: '+93-20-2300000',
      status: 'verified',
      services: ['Blood Tests', 'X-Ray', 'Ultrasound', 'MRI', 'CT Scan'],
      rating: 4.4,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'lab_002',
      name: 'Afghan Lab Services',
      province: 'Kabul',
      city: 'Kabul City',
      address: 'Macroyan, Kabul',
      phone: '+93-20-2400000',
      status: 'verified',
      services: ['Blood Tests', 'Urine Tests', 'PCR', 'Pathology'],
      rating: 4.3,
      createdAt: new Date().toISOString(),
    },
  ];

  labs.forEach(l => mockStore.labs.set(l.id, l));

  // Seed pharmacies
  const pharmacies = [
    {
      id: 'pharm_001',
      name: 'Shifa Pharmacy',
      province: 'Kabul',
      city: 'Kabul City',
      address: 'Share Naw, Kabul',
      phone: '+93-20-2500000',
      status: 'verified',
      openHours: '8:00 AM - 10:00 PM',
      rating: 4.5,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'pharm_002',
      name: 'Sehat Pharmacy',
      province: 'Kabul',
      city: 'Kabul City',
      address: 'Karte Char, Kabul',
      phone: '+93-20-2600000',
      status: 'verified',
      openHours: '7:00 AM - 11:00 PM',
      rating: 4.6,
      createdAt: new Date().toISOString(),
    },
  ];

  pharmacies.forEach(p => mockStore.pharmacies.set(p.id, p));

  console.log('✅ Mock data seeded');
};

export const initializeFirebase = () => {
  if (firebaseApp) return firebaseApp;

  if (process.env.FIREBASE_MOCK_MODE === 'true') {
    mockMode = true;
    console.warn('⚠️  Running in MOCK MODE — FIREBASE_MOCK_MODE=true.');
    seedMockData();
    return null;
  }

  if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
    try {
      const serviceAccount = JSON.parse(
        readFileSync(process.env.FIREBASE_SERVICE_ACCOUNT_PATH, 'utf8')
      );
      firebaseApp = admin.initializeApp({ 
        credential: admin.credential.cert(serviceAccount),
        databaseURL: `https://${serviceAccount.project_id}.firebaseio.com`,
        storageBucket: `${serviceAccount.project_id}.appspot.com`,
      });
      console.log('✅ Firebase Admin initialized (service account file)');
      return firebaseApp;
    } catch (e) {
      console.warn('⚠️  Could not load service account file:', e.message);
    }
  }

  if (
    process.env.FIREBASE_PROJECT_ID &&
    process.env.FIREBASE_PRIVATE_KEY &&
    process.env.FIREBASE_CLIENT_EMAIL &&
    !process.env.FIREBASE_PRIVATE_KEY.includes('YOUR_PRIVATE_KEY_HERE')
  ) {
    try {
      firebaseApp = admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        }),
        databaseURL: `https://${process.env.FIREBASE_PROJECT_ID}.firebaseio.com`,
        storageBucket: `${process.env.FIREBASE_PROJECT_ID}.appspot.com`,
      });
      console.log('✅ Firebase Admin initialized (env vars)');
      return firebaseApp;
    } catch (e) {
      console.warn('⚠️  Could not initialize Firebase with env vars:', e.message);
    }
  }

  // Fall back to mock mode
  mockMode = true;
  console.warn('⚠️  Running in MOCK MODE — no Firebase credentials provided.');
  console.warn('    Add real credentials to .env to connect to Firebase.');
  seedMockData();
  return null;
};

export const isMockMode = () => mockMode;

// Mock Firestore implementation
const createMockCollection = (collectionName) => ({
  doc: (id) => ({
    get: async () => {
      const data = mockStore[collectionName]?.get(id);
      return { exists: !!data, data: () => data, id };
    },
    set: async (data, opts) => {
      const existing = mockStore[collectionName]?.get(id) || {};
      mockStore[collectionName]?.set(id, opts?.merge ? { ...existing, ...data } : data);
    },
    update: async (data) => {
      const existing = mockStore[collectionName]?.get(id) || {};
      mockStore[collectionName]?.set(id, { ...existing, ...data });
    },
    collection: (subName) => createMockCollection(`${collectionName}_${subName}`),
  }),
  add: async (data) => {
    const id = `${collectionName}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    if (!mockStore[collectionName]) mockStore[collectionName] = new Map();
    mockStore[collectionName].set(id, { ...data, id });
    return { id };
  },
  where: (field, op, value) => createMockQuery(collectionName, [{ field, op, value }]),
  orderBy: () => createMockQuery(collectionName, []),
  limit: (n) => createMockQuery(collectionName, [], n),
  get: async () => {
    const store = mockStore[collectionName] || new Map();
    const docs = [...store.entries()].map(([id, data]) => ({ id, data: () => data }));
    return { docs, forEach: (fn) => docs.forEach(fn) };
  },
});

const createMockQuery = (collectionName, filters, limitN = 100) => ({
  where: (field, op, value) => createMockQuery(collectionName, [...filters, { field, op, value }], limitN),
  orderBy: () => createMockQuery(collectionName, filters, limitN),
  limit: (n) => createMockQuery(collectionName, filters, n),
  get: async () => {
    const store = mockStore[collectionName] || new Map();
    let docs = [...store.entries()].map(([id, data]) => ({ id, data: () => data }));

    // Apply filters
    for (const { field, op, value } of filters) {
      docs = docs.filter(doc => {
        const docData = doc.data();
        if (op === '==') return docData[field] === value;
        if (op === '!=') return docData[field] !== value;
        if (op === '>') return docData[field] > value;
        if (op === '<') return docData[field] < value;
        return true;
      });
    }

    docs = docs.slice(0, limitN);
    return { docs, forEach: (fn) => docs.forEach(fn) };
  },
});

let _firestoreInstance = null;
let _firestoreAvailable = null;

// Smart Firestore wrapper: tries real Firestore, falls back to mock on NOT_FOUND
const createSmartCollection = (realDb, collectionName) => {
  const tryReal = async (fn) => {
    if (_firestoreAvailable === false) {
      return createMockCollection(collectionName);
    }
    try {
      const result = await fn();
      _firestoreAvailable = true;
      return result;
    } catch (e) {
      if (e.code === 5 || e.message?.includes('NOT_FOUND') || e.message?.includes('does not exist')) {
        if (_firestoreAvailable !== false) {
          console.warn('⚠️  Firestore database not found — falling back to mock data');
          console.warn('   Create the database at: https://console.firebase.google.com/project/mediconnect-4b155/firestore');
          _firestoreAvailable = false;
          seedMockData();
        }
        return createMockCollection(collectionName);
      }
      throw e;
    }
  };

  return {
    doc: (id) => ({
      get: () => tryReal(() => realDb.collection(collectionName).doc(id).get()),
      set: (data, opts) => tryReal(() => realDb.collection(collectionName).doc(id).set(data, opts)),
      update: (data) => tryReal(() => realDb.collection(collectionName).doc(id).update(data)),
      collection: (sub) => createSmartCollection(realDb, `${collectionName}/${id}/${sub}`),
    }),
    add: (data) => tryReal(() => realDb.collection(collectionName).add(data)),
    where: (f, op, v) => createSmartQuery(realDb, collectionName, [{ f, op, v }]),
    orderBy: () => createSmartQuery(realDb, collectionName, []),
    limit: (n) => createSmartQuery(realDb, collectionName, [], n),
    get: () => tryReal(() => realDb.collection(collectionName).get()),
  };
};

const createSmartQuery = (realDb, collectionName, filters, limitN = 100) => ({
  where: (f, op, v) => createSmartQuery(realDb, collectionName, [...filters, { f, op, v }], limitN),
  orderBy: () => createSmartQuery(realDb, collectionName, filters, limitN),
  limit: (n) => createSmartQuery(realDb, collectionName, filters, n),
  get: async () => {
    if (_firestoreAvailable === false) {
      return createMockQuery(collectionName, filters.map(({f,op,v}) => ({field:f,op,value:v})), limitN).get();
    }
    try {
      let q = realDb.collection(collectionName);
      for (const { f, op, v } of filters) q = q.where(f, op, v);
      const result = await q.limit(limitN).get();
      _firestoreAvailable = true;
      return result;
    } catch (e) {
      if (e.code === 5 || e.message?.includes('NOT_FOUND') || e.message?.includes('does not exist')) {
        if (_firestoreAvailable !== false) {
          console.warn('⚠️  Firestore database not found — falling back to mock data');
          _firestoreAvailable = false;
          seedMockData();
        }
        return createMockQuery(collectionName, filters.map(({f,op,v}) => ({field:f,op,value:v})), limitN).get();
      }
      throw e;
    }
  },
});

export const getFirestore = () => {
  if (mockMode) {
    return { collection: (name) => createMockCollection(name) };
  }
  if (!_firestoreInstance) {
    _firestoreInstance = admin.firestore();
    try {
      _firestoreInstance.settings({ 
        ignoreUndefinedProperties: true,
        databaseId: 'default',
      });
    } catch (e) {
      // Settings already applied, ignore
    }
  }
  // Return smart wrapper that falls back to mock if Firestore DB doesn't exist
  return {
    collection: (name) => createSmartCollection(_firestoreInstance, name),
    batch: () => _firestoreInstance.batch(),
  };
};

export const getAuth = () => {
  if (mockMode) {
    return {
      verifyIdToken: async (token) => {
        // In mock mode, accept any token starting with "mock_"
        if (token.startsWith('mock_')) {
          const uid = token.replace('mock_', '');
          return { uid, email: `${uid}@demo.com`, role: 'patient' };
        }
        throw new Error('Invalid token in mock mode. Use "mock_<uid>" format.');
      },
      createUser: async ({ email, password, displayName, phoneNumber }) => {
        const uid = `user_${Date.now()}`;
        return { uid, email, displayName };
      },
      setCustomUserClaims: async () => {},
    };
  }
  return admin.auth();
};

export const getStorage = () => {
  if (mockMode) return null;
  return admin.storage();
};

export const getMessaging = () => {
  if (mockMode) return null;
  return admin.messaging();
};

export default admin;
