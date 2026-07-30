const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin
const serviceAccount = require(path.resolve(__dirname, '../../service-account.json'));

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();
const auth = admin.auth();

const targetAccounts = [
  {
    email: 'fazl122710@gmail.com',
    role: 'patient',
    name: 'Fazl (Patient)'
  },
  {
    email: 'f7864877@gmail.com',
    role: 'doctor',
    name: 'Dr. Fazl'
  },
  {
    email: '2021ce97@student.uet.edu.pk',
    role: 'admin',
    name: 'Admin Fazl'
  }
];

async function updateRealAccounts() {
  console.log('🔄 Starting update for real user accounts...');

  for (const account of targetAccounts) {
    try {
      // 1. Get the user from Firebase Auth
      console.log(`\n🔍 Looking up ${account.email}...`);
      let userRecord;
      try {
        userRecord = await auth.getUserByEmail(account.email);
        console.log(`✅ Found user in Auth: ${userRecord.uid}`);
      } catch (err) {
        if (err.code === 'auth/user-not-found') {
          console.log(`❌ User ${account.email} not found in Firebase Auth! Creating them...`);
          userRecord = await auth.createUser({
            email: account.email,
            password: 'Password123!', // Default password if creating
            displayName: account.name,
            emailVerified: true
          });
          console.log(`✅ Created user in Auth: ${userRecord.uid}`);
        } else {
          throw err;
        }
      }

      const uid = userRecord.uid;

      // 2. Set Custom Claims
      await auth.setCustomUserClaims(uid, { role: account.role });
      console.log(`✅ Custom claims set to: ${account.role}`);

      // 3. Update Firestore Document
      const userRef = db.collection('users').doc(uid);
      const userDoc = await userRef.get();

      const userData = {
        uid: uid,
        email: account.email,
        fullName: account.name,
        role: account.role,
        isBanned: false,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      };

      if (!userDoc.exists) {
        userData.createdAt = admin.firestore.FieldValue.serverTimestamp();
      }

      await userRef.set(userData, { merge: true });
      console.log(`✅ Firestore document updated for ${account.email} as ${account.role}.`);

      // 4. If Doctor, also ensure they are in the 'doctors' collection
      if (account.role === 'doctor') {
        const doctorRef = db.collection('doctors').doc(uid);
        const doctorDoc = await doctorRef.get();
        if (!doctorDoc.exists) {
          await doctorRef.set({
            userId: uid,
            name: account.name,
            email: account.email,
            specialty: 'General Physician',
            hospital: 'DARMAN Main Hospital',
            city: 'Kabul',
            status: 'Verified',
            verifiedAt: admin.firestore.FieldValue.serverTimestamp(),
            createdAt: admin.firestore.FieldValue.serverTimestamp()
          });
          console.log(`✅ Doctor profile created in 'doctors' collection and Verified.`);
        } else {
          await doctorRef.update({
            status: 'Verified',
            verifiedAt: admin.firestore.FieldValue.serverTimestamp()
          });
          console.log(`✅ Doctor profile marked as Verified.`);
        }
      }

    } catch (error) {
      console.error(`❌ Error processing ${account.email}:`, error);
    }
  }

  console.log('\n🎉 Finished updating all accounts!');
  process.exit(0);
}

updateRealAccounts();
