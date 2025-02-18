// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getStorage } from "firebase/storage";
import { getDatabase } from "firebase/database";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAgJzstn5_ZCL6_x4aEgjWSBkuYEpjavX0",
  authDomain: "chatroom-28e7f.firebaseapp.com",
  databaseURL: "https://chatroom-28e7f-default-rtdb.firebaseio.com",
  projectId: "chatroom-28e7f",
  storageBucket: "chatroom-28e7f.appspot.com",
  messagingSenderId: "454454387741",
  appId: "1:454454387741:web:aaf3490446a6d1539c92f4",
  measurementId: "G-J5KL228DYW"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const storage = getStorage();
export const database = getDatabase();
const analytics = getAnalytics(app);