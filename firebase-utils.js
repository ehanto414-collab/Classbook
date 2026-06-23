// firebase-utils.js - initialize firebase and simple state sync helpers
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import {
  getFirestore,
  doc,
  setDoc,
  onSnapshot,
  getDoc,
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDBkDj1xUWRE59snEQvXJwXEY-EeXJFDgk",
  authDomain: "classebook-f48fb.firebaseapp.com",
  projectId: "classebook-f48fb",
  storageBucket: "classebook-f48fb.firebasestorage.app",
  messagingSenderId: "903186398608",
  appId: "1:903186398608:web:8324ffedcbbc2837de4715",
  measurementId: "G-3SWPZ4XSB6"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Write the whole app state to a single document (simple approach for this small app)
export async function setState(state) {
  try {
    await setDoc(doc(db, "state", "global"), state);
  } catch (e) {
    console.warn("setState failed", e);
    throw e;
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
