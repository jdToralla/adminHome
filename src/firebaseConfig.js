import firebase from 'firebase/app'
import 'firebase/auth'
import 'firebase/firestore'
import 'firebase/storage'

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


  const fire = firebase.initializeApp(config)

  // Initialize Firebase for Authentication
  const auth = fire.auth();
   
  // Initialize Firebase for Firestore
  const firedb = fire.firestore()
  
  // Initialize Firebase for Storage
   const fire_storage = fire.storage().ref();
  
  //Exportamos todo
   export{auth, firedb, fire_storage}
