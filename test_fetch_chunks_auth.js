import { initializeApp } from 'firebase/app';
import { initializeFirestore, collection, getDocs, doc, setDoc } from 'firebase/firestore';

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
  const messageRef = doc(db, 'messages', 'test_read_chunks');
  await setDoc(messageRef, { id: 'test_read_chunks', viewCount: 0 }); // should succeed due to rules
  const chunkRef = doc(collection(messageRef, 'chunks'), 'chunk_0');
  await setDoc(chunkRef, { data: 'test' });
  
  const chunksRef = collection(db, 'messages', 'test_read_chunks', 'chunks');
  const snapshot = await getDocs(chunksRef);
  console.log('Got chunks:', snapshot.size);
  process.exit(0);
}
run().catch(e => {
  console.error(e);
  process.exit(1);
});
