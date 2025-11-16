// src/firebase.js
import { getAnalytics } from "firebase/analytics";
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDXAd-5dIMhl7VuqiZO5YCXkBpsLAkRfvs",
  authDomain: "amigo-secreto-31525.firebaseapp.com",
  projectId: "amigo-secreto-31525",
  storageBucket: "amigo-secreto-31525.firebasestorage.app",
  messagingSenderId: "94941691122",
  appId: "1:94941691122:web:c616235995da6108f0a46b",
  measurementId: "G-8XGTZD4ZX1",
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);
const auth = getAuth(app);

export { analytics, auth, db };
