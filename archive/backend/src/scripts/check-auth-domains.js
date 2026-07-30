import { readFileSync } from 'fs';
import { GoogleAuth } from 'google-auth-library';
import dotenv from 'dotenv';
dotenv.config();

const PROJECT_ID = 'mediconnect-4b155';

async function checkAndFixAuthDomains() {
  const serviceAccount = JSON.parse(readFileSync('./serviceAccountKey.json', 'utf8'));
  const auth = new GoogleAuth({
    credentials: serviceAccount,
    scopes: ['https://www.googleapis.com/auth/cloud-platform', 'https://www.googleapis.com/auth/identitytoolkit'],
  });
  const client = await auth.getClient();
  const token = (await client.getAccessToken()).token;

  // Get current auth config
  const configUrl = `https://identitytoolkit.googleapis.com/admin/v2/projects/${PROJECT_ID}/config`;
  const res = await fetch(configUrl, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const config = await res.json();

  if (config.error) {
    console.log('❌ Error getting config:', config.error.message);
    return;
  }

  const currentDomains = config.authorizedDomains || [];
  console.log('\n📋 Current authorized domains:');
  currentDomains.forEach(d => console.log('  ✅', d));

  // Domains we need
  const requiredDomains = [
    'localhost',
    'mediconnect-4b155.web.app',
    'mediconnect-4b155.firebaseapp.com',
    'darman-api.onrender.com',
  ];

  const missing = requiredDomains.filter(d => !currentDomains.includes(d));

  if (missing.length === 0) {
    console.log('\n✅ All required domains are already authorized!');
    return;
  }

  console.log('\n⚠️  Missing domains:', missing);
  console.log('\n🔧 Adding missing domains...');

  const updatedDomains = [...new Set([...currentDomains, ...requiredDomains])];

  const updateRes = await fetch(configUrl + '?updateMask=authorizedDomains', {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ authorizedDomains: updatedDomains }),
  });

  const updateResult = await updateRes.json();

  if (updateResult.error) {
    console.log('❌ Error updating domains:', updateResult.error.message);
    console.log('\n📌 Please add these domains manually:');
    console.log('   Go to: https://console.firebase.google.com/project/mediconnect-4b155/authentication/settings');
    missing.forEach(d => console.log('   Add:', d));
  } else {
    console.log('\n✅ Domains updated successfully!');
    console.log('📋 New authorized domains:');
    (updateResult.authorizedDomains || []).forEach(d => console.log('  ✅', d));
  }

  process.exit(0);
}

checkAndFixAuthDomains().catch(e => {
  console.error('❌', e.message);
  process.exit(1);
});
