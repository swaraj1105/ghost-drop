import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

// REPLACE THE OBJECT BELOW WITH YOUR COPIED KEYS
const firebaseConfig = {
  apiKey: "AIzaSyCtUmwDJYKJnIeoOMwpW7KDlU0UIE3oCSw",
  authDomain: "ghostdrop-ab911.firebaseapp.com",
  databaseURL: "https://ghostdrop-ab911-default-rtdb.firebaseio.com",
  projectId: "ghostdrop-ab911",
  storageBucket: "ghostdrop-ab911.firebasestorage.app",
  messagingSenderId: "174231153154",
  appId: "1:174231153154:web:aebb4aea2db45a8da1d51b"
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);