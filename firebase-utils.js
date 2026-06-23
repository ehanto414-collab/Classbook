import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import {
  getFirestore,
  doc,
  setDoc,
  onSnapshot,
  getDoc,
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { getStorage, ref, uploadString, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js";

const firebaseConfig = {
  apiKey: "AIzaSyDBkDj1xUWRE59snEQvXJwXEY-EeXJFDgk",
  authDomain: "classebook-f48fb.firebaseapp.com",
  projectId: "classebook-f48fb",
  storageBucket: "classebook-f48fb.appspot.com",
  messagingSenderId: "903186398608",
  appId: "1:903186398608:web:8324ffedcbbc2837de4715",
  measurementId: "G-3SWPZ4XSB6"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);

// Write the whole app state to a single document (simple approach for this small app)
export async function setState(state) {
  try {
    await setDoc(doc(db, "state", "global"), state);
  } catch (e) {
    console.warn("setState failed", e);
    throw e;
  }
}

// Read once
export async function getStateOnce() {
  try {
    const snap = await getDoc(doc(db, "state", "global"));
    if (snap.exists()) return snap.data();
    return null;
  } catch (e) {
    console.warn("getStateOnce failed", e);
    return null;
  }
}

// Listen to state document updates
export function listenState(onChange) {
  try {
    return onSnapshot(doc(db, "state", "global"), (snap) => {
      if (snap.exists()) onChange(snap.data());
    });
  } catch (e) {
    console.warn("listenState failed", e);
    return function () {};
  }
}

// Upload a dataURL image to Firebase Storage and return a public URL
export async function uploadImage(dataUrl, filename) {
  try {
    const fileRef = ref(storage, `images/${filename}`);
    // dataUrl is like data:image/jpeg;base64,... so uploadString with 'data_url'
    await uploadString(fileRef, dataUrl, 'data_url');
    const url = await getDownloadURL(fileRef);
    return url;
  } catch (e) {
    console.warn("uploadImage failed", e);
    throw e;
  }
}
