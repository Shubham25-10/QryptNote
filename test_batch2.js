import { initializeApp } from 'firebase/app';
import { initializeFirestore } from 'firebase/firestore';
import { writeBatch } from 'firebase/firestore/lite';

const firebaseConfig = {
  apiKey: "AIzaSyAauUr5HckS0o2qvDnmoGU9-cIMsmWSvkQ",
  projectId: "gen-lang-client-0450901922"
};

const app = initializeApp(firebaseConfig);
const db = initializeFirestore(app, {
  experimentalAutoDetectLongPolling: true,
  useFetchStreams: false,
} , "ai-studio-a9ba2121-a2c8-437a-9558-29699c445cf9");

try {
  const batch = writeBatch(db);
  console.log("Success");
} catch(e) {
  console.error("Failed:", e.message);
}
