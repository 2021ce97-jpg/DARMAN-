import { initializeFirebase, getAuth, getFirestore } from '../config/firebase.js';

async function setupRealRoles() {
  console.log('🚀 Starting Real Role Setup Script...');

  // 1. Initialize Firebase
  const app = initializeFirebase();
  if (!app) {
    console.error('❌ Failed to initialize Firebase.');
    process.exit(1);
  }

  const auth = getAuth();
  const db = getFirestore();

  const usersToSetup = [
    { email: 'fazl122710@gmail.com', role: 'patient', name: 'Fazl (Patient)' },
    { email: 'f7864877@gmail.com', role: 'doctor', name: 'Dr. Fazl' },
    { email: '2021ce97@student.uet.edu.pk', role: 'admin', name: 'Fazl Admin' }
  ];

  for (const userConfig of usersToSetup) {
    try {
      console.log(`\n🔍 Processing: ${userConfig.email}...`);

      // Find user in Auth
      let userRecord;
      try {
        userRecord = await auth.getUserByEmail(userConfig.email);
        console.log(`✅ Found UID: ${userRecord.uid}`);
      } catch (e) {
        if (e.code === 'auth/user-not-found') {
          console.log(`❌ User ${userConfig.email} not found! Creating user...`);
          userRecord = await auth.createUser({
            email: userConfig.email,
            password: 'Password123!',
            displayName: userConfig.name,
            emailVerified: true
          });
          console.log(`✅ Created User: ${userRecord.uid}`);
        } else {
          console.error(`⚠️ Error getting user: ${e.message}`);
          continue;
        }
      }

      const uid = userRecord.uid;

      // Update Firestore 'users' collection
      await db.collection('users').doc(uid).set({
        email: userConfig.email,
        role: userConfig.role,
        name: userConfig.name,
        fullName: userConfig.name,
        isBanned: false,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      console.log(`✅ Updated Firestore users doc as ${userConfig.role}`);

      // Special handling for Doctor
      if (userConfig.role === 'doctor') {
        const doctorSnap = await db.collection('doctors').where('userId', '==', uid).get();
        if (doctorSnap.docs.length === 0) {
          console.log('📝 Creating doctor profile entry...');
          // Check if doc exists with UID directly
          const docRef = db.collection('doctors').doc(uid);
          await docRef.set({
            userId: uid,
            name: userConfig.name,
            email: userConfig.email,
            specialty: 'General Physician',
            city: 'Kabul',
            status: 'Verified',
            createdAt: new Date().toISOString()
          }, { merge: true });
          console.log('✅ Doctor profile created!');
        } else {
          console.log('ℹ️ Doctor profile already exists.');
        }
      }

      // Set Custom Claims
      await auth.setCustomUserClaims(uid, { role: userConfig.role });
      console.log(`✅ Custom claims set for role: ${userConfig.role}`);

    } catch (error) {
      console.error(`❌ Error processing ${userConfig.email}:`, error.message);
    }
  }

  console.log('\n✨ Setup complete! You can now login with these accounts.');
  process.exit(0);
}

setupRealRoles();
