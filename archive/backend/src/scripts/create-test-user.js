/**
 * Creates a test user in Firebase Auth for testing login
 * Run: node src/scripts/create-test-user.js
 */
import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import dotenv from 'dotenv';
import { getFirestore } from '../config/firebase.js';
dotenv.config();

const sa = JSON.parse(readFileSync('./serviceAccountKey.json', 'utf8'));
admin.initializeApp({ credential: admin.credential.cert(sa) });
const db = getFirestore();

async function createTestUser() {
  console.log('👤 Creating test users...\n');

  const users = [
    {
      email: 'patient@darman.af',
      password: 'Darman2026!',
      displayName: 'Ahmad Khan (Test Patient)',
      role: 'patient',
    },
    {
      email: 'doctor@darman.af',
      password: 'Darman2026!',
      displayName: 'Dr. Test Doctor',
      role: 'doctor',
    },
    {
      email: 'admin@darman.af',
      password: 'Darman2026!',
      displayName: 'DARMAN Admin',
      role: 'admin',
    },
  ];

  for (const user of users) {
    try {
      let userRecord;
      try {
        userRecord = await admin.auth().getUserByEmail(user.email);
        await admin.auth().updateUser(userRecord.uid, {
          password: user.password,
          displayName: user.displayName,
          emailVerified: true,
          disabled: false,
        });
        console.log(`ℹ️  Updated existing user: ${user.email} (uid: ${userRecord.uid})`);
      } catch (_) {
        userRecord = await admin.auth().createUser({
          email: user.email,
          password: user.password,
          displayName: user.displayName,
          emailVerified: true,
        });
        console.log(`✅ Created: ${user.email}`);
      }

      await admin.auth().setCustomUserClaims(userRecord.uid, { role: user.role });

      await db.collection('users').doc(userRecord.uid).set({
        uid: userRecord.uid,
        email: user.email,
        fullName: user.displayName,
        name: user.displayName,
        role: user.role,
        status: user.role === 'doctor' ? 'verified' : 'active',
        isBanned: false,
        updatedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      }, { merge: true });

      if (user.role === 'doctor') {
        await db.collection('doctors').doc(userRecord.uid).set({
          userId: userRecord.uid,
          fullName: user.displayName,
          name: user.displayName,
          email: user.email,
          specialty: 'General Physician',
          province: 'Kabul',
          city: 'Kabul City',
          hospital: 'DARMAN Demo Clinic',
          experience: 8,
          fee: 500,
          rating: 4.8,
          reviewCount: 12,
          status: 'verified',
          languages: ['Dari', 'Pashto', 'English'],
          isAvailableOnline: true,
          verifiedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
        }, { merge: true });
      }

      if (user.role === 'admin') {
        await db.collection('audit_logs').add({
          actorId: userRecord.uid,
          actorRole: 'admin',
          action: 'demo_account.bootstrap',
          entityType: 'user',
          entityId: userRecord.uid,
          metadata: { email: user.email, role: user.role },
          createdAt: new Date().toISOString(),
        });
      }

      console.log(`   UID: ${userRecord.uid}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Password: ${user.password}\n`);
    } catch (e) {
      console.error(`❌ Failed to create ${user.email}:`, e.message);
    }
  }

  console.log('\n🎉 Test users ready!');
  console.log('\n📱 Login credentials:');
  console.log('   Patient:  patient@darman.af  /  Darman2026!');
  console.log('   Doctor:   doctor@darman.af   /  Darman2026!');
  console.log('   Admin:    admin@darman.af     /  Darman2026!');
  console.log('\n🌐 Test at: https://mediconnect-4b155.web.app');

  process.exit(0);
}

createTestUser().catch(e => {
  console.error('❌', e.message);
  process.exit(1);
});
