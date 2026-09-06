import { initializeApp } from 'firebase/app';
import { initializeFirestore, doc, collection } from 'firebase/firestore';
import { writeBatch } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAauUr5HckS0o2qvDnmoGU9-cIMsmWSvkQ",
  projectId: "gen-lang-client-0450901922"
};

const app = initializeApp(firebaseConfig);
const db = initializeFirestore(app, {
  experimentalAutoDetectLongPolling: true,
  useFetchStreams: false,
} , "ai-studio-a9ba2121-a2c8-437a-9558-29699c445cf9");

async function run() {
  const batch = writeBatch(db);
  const chunkData = 'A'.repeat(800 * 1024); // 800KB
  for (let i = 0; i < 20; i++) { // 16MB
    const ref = doc(db, 'messages/test_batch/chunks/chunk_' + i);
    batch.set(ref, { data: chunkData });
  }
  await batch.commit();
  console.log("Success");
  process.exit(0);
}
run().catch(e => {
  console.error("Failed:", e.message);
  process.exit(1);
});
