// Firebase Core
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-app.js";

// Auth
import { getAuth } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-auth.js";

// Firestore
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-firestore.js";

import { getStorage } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-storage.js";

// Config
const firebaseConfig = {
  apiKey: "سري",
  authDomain: "casehub-753d3.firebaseapp.com",
  projectId: "casehub-753d3",
  storageBucket: "casehub-753d3.firebasestorage.app",
  messagingSenderId: "600752409812",
  appId: "1:600752409812:web:a761594c1ca427518fbf41",
  measurementId: "G-06DQXLGB6L"
};

// Init
const app = initializeApp(firebaseConfig);

// Services
export const auth = getAuth(app);
export const db = getFirestore(app);

export const storage = getStorage(app);
