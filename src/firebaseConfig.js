import firebase from 'firebase/app'
import 'firebase/auth'
import 'firebase/firestore'
import 'firebase/storage'

const config = {
    apiKey: "AIzaSyBlrhCB15tH1CPY7-pqQLUM6lxzbwhxt1I",
    authDomain: "admincuentas-c08f5.firebaseapp.com",
    projectId: "admincuentas-c08f5",
    storageBucket: "admincuentas-c08f5.appspot.com",
    messagingSenderId: "1039913593297",
    appId: "1:1039913593297:web:abbc7acf6ab0c62de518f0",
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
