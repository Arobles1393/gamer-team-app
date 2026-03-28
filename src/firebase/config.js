// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
//import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDloM3bgJoO83p-pud2EXLS9XtFiy9qUgw",
  authDomain: "gamerteam-4ed20.firebaseapp.com",
  projectId: "gamerteam-4ed20",
  storageBucket: "gamerteam-4ed20.firebasestorage.app",
  messagingSenderId: "438461935368",
  appId: "1:438461935368:web:cfde1729d3ffae3b2086bd",
  measurementId: "G-CMXE6VW3FW"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
//const analytics = getAnalytics(app);
export const db = getFirestore(app);
export const auth = getAuth(app);