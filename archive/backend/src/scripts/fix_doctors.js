import { initializeFirebase, getFirestore } from '../config/firebase.js';

async function fixDoctors() {
  console.log('🚀 Fixing Doctors Collection...');

  initializeFirebase();
  const db = getFirestore();

  const snapshot = await db.collection('doctors').get();
  let updatedCount = 0;

  for (const doc of snapshot.docs) {
    const data = doc.data();
    const updates = {};
    let needsUpdate = false;

    // Fix name
    if (data.fullName && !data.name) {
      updates.name = data.fullName;
      needsUpdate = true;
    }

    // Fix status casing
    if (data.status === 'verified') {
      updates.status = 'Verified';
      needsUpdate = true;
    }

    // Fix createdAt string to Timestamp
    if (typeof data.createdAt === 'string') {
      try {
        const date = new Date(data.createdAt);
        updates.createdAt = date; // Firestore Node SDK automatically converts JS Dates to Timestamps
        needsUpdate = true;
      } catch (e) {
        console.log(`Failed to parse date for ${doc.id}:`, e);
      }
    }

    if (needsUpdate) {
      await doc.ref.update(updates);
      console.log(`✅ Updated doctor ${doc.id} (${data.fullName || data.name})`);
      updatedCount++;
    }
  }

  console.log(`\n✨ Fixed ${updatedCount} doctors!`);
  process.exit(0);
}

fixDoctors();
