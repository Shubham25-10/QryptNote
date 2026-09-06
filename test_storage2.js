import { initializeApp } from 'firebase/app';
import { getStorage, ref, uploadString } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyAauUr5HckS0o2qvDnmoGU9-cIMsmWSvkQ",
  projectId: "gen-lang-client-0450901922",
  storageBucket: "gen-lang-client-0450901922.firebasestorage.app",
};

const app = initializeApp(firebaseConfig);
const storage = getStorage(app);
const storageRef = ref(storage, 'test.txt');

uploadString(storageRef, 'Hello, world!').then(() => {
  console.log('success');
  process.exit(0);
}).catch(e => {
  console.error(e);
  process.exit(1);
});
