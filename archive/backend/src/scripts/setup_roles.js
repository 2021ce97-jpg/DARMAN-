import { initializeFirebase, getAuth, getFirestore } from '../config/firebase.js';

async function setupRoles() {
  console.log('🚀 Starting Role Setup Script...');

  // 1. Initialize Firebase
  const app = initializeFirebase();
  if (!app) {
    console.error('❌ Failed to initialize Firebase. Check your .env file and serviceAccountKey.json');
    process.exit(1);
  }

  const auth = getAuth();
  const db = getFirestore();

  const usersToSetup = [
    { email: 'admin@darman.af', role: 'admin', name: 'Admin User' },
    { email: 'doctor@darman.af', role: 'doctor', name: 'Dr. Test Provider' },
    { email: 'patient@darman.af', role: 'patient', name: 'Test Patient' }
  ];

  for (const userConfig of usersToSetup) {
    try {
      console.log(`\n🔍 Processing: ${userConfig.email}...`);

      // Find user in Auth
      let userRecord;
      try {
        userRecord = await auth.getUserByEmail(userConfig.email);
      } catch (e) {
        console.warn(`⚠️ User ${userConfig.email} not found in Auth. Please create them first in the console.`);
        continue;
      }

      const uid = userRecord.uid;
      console.log(`✅ Found UID: ${uid}`);

      // Update Firestore 'users' collection
      await db.collection('users').doc(uid).set({
        email: userConfig.email,
        role: userConfig.role,
        name: userConfig.name,
        isBanned: false,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      console.log(`✅ Updated Firestore roles for ${userConfig.role}`);

      // Special handling for Doctor
      if (userConfig.role === 'doctor') {
        // We check if doctor already exists in 'doctors' collection
        const doctorSnap = await db.collection('doctors').where('userId', '==', uid).get();

        if (doctorSnap.docs.length === 0) {
          console.log('📝 Creating doctor profile entry...');
          await db.collection('doctors').add({
            userId: uid,
            name: userConfig.name,
            email: userConfig.email,
            specialty: 'General Physician',
            city: 'Kabul',
            status: 'Verified',
            createdAt: new Date().toISOString()
          });
          console.log('✅ Doctor profile created!');
        } else {
          console.log('ℹ️ Doctor profile already exists.');
        }
      }

      // Set Custom Claims (optional but good for security)
      await auth.setCustomUserClaims(uid, { role: userConfig.role });
      console.log(`✅ Custom claims set for role: ${userConfig.role}`);

    } catch (error) {
      console.error(`❌ Error setting up ${userConfig.email}:`, error.message);
    }
  }

  console.log('\n✨ Setup complete! You can now login with these accounts.');
  process.exit(0);
}

setupRoles();
