const { initializeTestEnvironment, assertFails, assertSucceeds } = require('@firebase/rules-unit-testing');
const fs = require('fs');
const path = require('path');
const { expect } = require('chai');

const PROJECT_ID = 'darman-test';
let testEnv;

describe('Firestore security rules - chats', () => {
  before(async () => {
    testEnv = await initializeTestEnvironment({
      projectId: PROJECT_ID,
      firestore: {
        rules: fs.readFileSync(path.join(__dirname, '..', '..', 'firestore.rules'), 'utf8'),
      },
    });
  });

  after(async () => {
    await testEnv.cleanup();
  });

  it('participant can create message with matching senderId', async () => {
    const aliceAuth = { uid: 'alice' };
    const bobAuth = { uid: 'bob' };

    // Create chat document with participants alice and bob (seed via admin)
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const admin = context.firestore();
      await admin.collection('chats').doc('alice_bob').set({ participants: ['alice', 'bob'] });
    });

    const alice = testEnv.authenticatedContext(aliceAuth.uid).firestore();
    const msgRef = alice.collection('chats').doc('alice_bob').collection('messages').doc('m1');

    await assertSucceeds(msgRef.set({ senderId: 'alice', content: 'hi' }));
  });

  it('non-participant cannot read chat', async () => {
    const eve = testEnv.authenticatedContext('eve').firestore();
    const ref = eve.collection('chats').doc('alice_bob');
    await assertFails(ref.get());
  });

  it('cannot create message with mismatched senderId', async () => {
    const alice = testEnv.authenticatedContext('alice').firestore();
    const msgRef = alice.collection('chats').doc('alice_bob').collection('messages').doc('m2');
    await assertFails(msgRef.set({ senderId: 'eve', content: 'impostor' }));
  });

  it('participant can update only readAt or metadata', async () => {
    const alice = testEnv.authenticatedContext('alice').firestore();
    const msgRef = alice.collection('chats').doc('alice_bob').collection('messages').doc('m3');
    // seed message as admin
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const admin = context.firestore();
      await admin.collection('chats').doc('alice_bob').collection('messages').doc('m3').set({ senderId: 'alice', content: 'x' });
    });

    // allowed: update readAt
    await assertSucceeds(msgRef.update({ readAt: Date.now() }));
    // disallowed: change content
    await assertFails(msgRef.update({ content: 'edited' }));
  });
});
