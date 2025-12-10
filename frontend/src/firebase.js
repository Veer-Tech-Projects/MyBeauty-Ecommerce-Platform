// src/firebase.js
import { initializeApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";


const firebaseConfig = {
  apiKey: "AIzaSyCBkEZlboBSLJkT6yQysK3cqzvp9NCqLj4",
  authDomain: "myjewels-dcce6.firebaseapp.com",
  projectId: "myjewels-dcce6",
  storageBucket: "myjewels-dcce6.firebasestorage.app",
  messagingSenderId: "1070911475027",
  appId: "1:1070911475027:web:fd8b0c669d70cc76f4a5a6"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();
