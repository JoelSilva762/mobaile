
import { initializeApp } from "firebase/app";
import { getAuth } from 'firebase/auth';
import { getDatabase } from 'firebase/database';



const firebaseConfig = {
  apiKey: "AIzaSyDPxQS38WoDJ0KfqqhDB_IPiz_3T2O3bL4",
  authDomain: "mobile2balels.firebaseapp.com",
  databaseURL: "https://mobile2balels-default-rtdb.firebaseio.com",
  projectId: "mobile2balels",
  storageBucket: "mobile2balels.firebasestorage.app",
  messagingSenderId: "728466642963",
  appId: "1:728466642963:web:62f4e579c1828bdbcc87e6"
};


const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getDatabase(app);
