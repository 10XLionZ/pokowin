import { initializeApp } from "https://gstatic.com";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, signOut } from "https://gstatic.com";
import { getFirestore, doc, getDoc, setDoc, onSnapshot } from "https://gstatic.com";

// ⚠️ यहाँ अपने असली Firebase Project की कॉन्फ़िगरेशन डिटेल्स डालें
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_AUTH_DOMAIN",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_STORAGE_BUCKET",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// DOM Elements
const loginSec = document.getElementById('login-section');
const dashSec = document.getElementById('dashboard-section');
const redeemSec = document.getElementById('redeem-section');
const mainNav = document.getElementById('main-nav');
const authForm = document.getElementById('auth-form');
const authError = document.getElementById('auth-error');
const userCoinsTxt = document.getElementById('user-coins');
const userEmailTxt = document.getElementById('user-display-email');
const offerwallIframe = document.getElementById('offerwall-iframe');

// Global Function to Switch Sections smoothly
window.showSection = function(sectionId) {
    loginSec.style.display = 'none';
    dashSec.style.display = 'none';
    redeemSec.style.display = 'none';
    
    document.getElementById(sectionId).style.display = 'block';
}

// 1. Monitor Authentication State (Login Status Check)
onAuthStateChanged(auth, async (user) => {
    if (user) {
        // User logged in
        mainNav.style.display = 'block';
        userEmailTxt.innerText = user.email;
        showSection('dashboard-section');
        
        // Load or Create User Document in Database to track coins
        const userDocRef = doc(db, "users", user.uid);
        
        // Listen to Realtime Coin Updates from Firebase
        onSnapshot(userDocRef, (docSnap) => {
            if (docSnap.exists()) {
                userCoinsTxt.innerText = docSnap.data().coins || 0;
            } else {
                // If new user, setup database structure with 0 coins
                setDoc(userDocRef, { coins: 0, email: user.email });
                userCoinsTxt.innerText = 0;
            }
        });

        // 🟢 REAL INTEGRATION: यहाँ अपनी Torox / RevU की वास्तविक लिंक डालें
        // URL के अंत में User UID पास की गई है, यही आईडी पोस्टबैक के लिए ज़रूरी है
        const toroxPublishId = "YOUR_TOROX_PUBLISHER_ID"; 
        const toroxAppId = "YOUR_TOROX_APP_ID";
        offerwallIframe.src = `https://torox.io{toroxPublishId}/${toroxAppId}/?user_id=${user.uid}`;

    } else {
        // User logged out
        mainNav.style.display = 'none';
        offerwallIframe.src = "";
        showSection('login-section');
    }
});

// 2. Handle Login & Automated Signup (All-in-one Form)
authForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    authError.classList.add('hidden');
    const email = document.getElementById('auth-email').value;
    const password = document.getElementById('auth-password').value;

    try {
        // Try Logging In
        await signInWithEmailAndPassword(auth, email, password);
    } catch (loginErr) {
        // If account doesn't exist, automatically sign them up
        if (loginErr.code === 'auth/user-not-found' || loginErr.code === 'auth/invalid-credential') {
            try {
                await createUserWithEmailAndPassword(auth, email, password);
            } catch (signupErr) {
                authError.innerText = signupErr.message;
                authError.classList.remove('hidden');
            }
        } else {
            authError.innerText = loginErr.message;
            authError.classList.remove('hidden');
        }
    }
});

// 3. Handle Logout Action
document.getElementById('btn-logout').addEventListener('click', () => {
    signOut(auth);
});
