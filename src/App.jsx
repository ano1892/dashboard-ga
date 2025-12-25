// --- Konfigurasi Firebase ---
const firebaseConfig = typeof __firebase_config !== 'undefined'
  ? JSON.parse(__firebase_config)
  : {
      apiKey: "AIzaSyB8rtANpBSRWKeNew0s-7WR0Cz9idoh28E",
  authDomain: "dashboard-pekerjaan-ga.firebaseapp.com",
  projectId: "dashboard-pekerjaan-ga",
  storageBucket: "dashboard-pekerjaan-ga.firebasestorage.app",
  messagingSenderId: "53873450884",
  appId: "1:53873450884:web:1b7f1533c9fc62c90c47d1"
    };