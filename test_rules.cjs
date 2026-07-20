const { initializeTestEnvironment } = require('@firebase/rules-unit-testing');
const fs = require('fs');

async function run() {
  let testEnv = await initializeTestEnvironment({
    projectId: "ai-studio-a9ba2121-a2c8-437a-9558-29699c445cf9",
    firestore: {
      rules: fs.readFileSync('firestore.rules', 'utf8'),
    },
  });

  const db = testEnv.unauthenticatedContext().firestore();
  
  try {
    await db.collection('messages').doc('test1').set({
      id: 'test1',
      encryptedMessage: '123',
      viewCount: 0,
      expiryTimestamp: Date.now() + 1000,
      viewLimit: 1,
      passwordHash: null,
      createdAt: Date.now()
    });
    console.log("Allowed 1");
  } catch (e) {
    console.error("Denied 1:", e.message);
  }
  
  try {
    await db.collection('messages').doc('test2').set({
      id: 'test2',
      encryptedMessage: '123',
      viewCount: 0,
      expiryTimestamp: Date.now() + 1000,
      viewLimit: 1,
      createdAt: Date.now()
    });
    console.log("Allowed 2 (no passwordHash)");
  } catch (e) {
    console.error("Denied 2:", e.message);
  }

  process.exit(0);
}
run();
