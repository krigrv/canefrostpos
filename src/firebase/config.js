import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'

// Your web app's Firebase configuration
// Replace these with your actual Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyBqa15sDD7JuNOxY85O7fhMXD8DfYwvUWk",
  authDomain: "canefrostpos.firebaseapp.com",
  projectId: "canefrostpos",
  storageBucket: "canefrostpos.firebasestorage.app",
  messagingSenderId: "113733653005",
  appId: "1:113733653005:web:a67061a992f1e843cafb44",
  measurementId: "G-P772WL4CTB"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig)

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app)

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app)

// Initialize Cloud Storage and get a reference to the service
export const storage = getStorage(app)

export default app