import firebase from 'firebase/app';
import 'firebase/auth';
import 'firebase/firestore';
import 'firebase/storage';

const config = {
  apiKey: "AIzaSyCF-z2ZrX_tkqsmkUfHhLkEYsMuYDBTtiE",
  authDomain: "adminhome-36c6e.firebaseapp.com",
  projectId: "adminhome-36c6e",
  storageBucket: "adminhome-36c6e.appspot.com",
  messagingSenderId: "450868120054",
  appId: "1:450868120054:web:527d8ee64f78be64105fd7",
  rules: {
    ".read": "auth != null",
    ".write": "auth != null"
  }
};

// Initialize Firebase if not already initialized
const fire = !firebase.apps.length ? firebase.initializeApp(config) : firebase.app();

// Initialize Firebase services
const auth = fire.auth();
const firedb = fire.firestore();
const fire_storage = fire.storage().ref();

// Configurar persistencia LOCAL para mantener la sesión abierta indefinidamente
// (tipo Gmail, YouTube o apps móviles nativas hasta que el usuario dé Cerrar sesión)
auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL)
  .catch((errorPersistencia) => {
    console.warn('Aviso: No se pudo configurar la persistencia LOCAL de Firebase:', errorPersistencia);
  });

// Google Auth Provider
const googleProvider = new firebase.auth.GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

// Export everything
export { auth, firedb, fire_storage, googleProvider, firebase };
