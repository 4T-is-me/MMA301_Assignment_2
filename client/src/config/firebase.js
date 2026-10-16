// Import the functions you need from the SDKs you need
import { initializeApp } from 'firebase/app';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getFirestore } from 'firebase/firestore';
import { initializeAuth, getReactNativePersistence,} from 'firebase/auth';
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyCEkV9x4pYE2rGOtOrWaZnIVZRmM8C0-xM",
    authDomain: "assignment-2-store.firebaseapp.com",
    projectId: "assignment-2-store",
    storageBucket: "assignment-2-store.firebasestorage.app",
    messagingSenderId: "294489054983",
    appId: "1:294489054983:web:ac56187e80020c215cefa2",
    measurementId: "G-Q9RXN1S4MN"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

export const auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
});
