// auth.js
// 1. Importamos las herramientas exactas de la versión 12.12.1
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.12.1/firebase-app.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.12.1/firebase-auth.js";

// 2. Tu configuración exacta (La que te dio Firebase recién)
const firebaseConfig = {
    apiKey: "AIzaSyDooZx3eBmvWmi0q4Xz2NwWbG40fxVwNR0",
    authDomain: "test-2484b.firebaseapp.com",
    projectId: "test-2484b",
    storageBucket: "test-2484b.firebasestorage.app",
    messagingSenderId: "619066570772",
    appId: "1:619066570772:web:8815dd107dd8b29df84f01",
    measurementId: "G-JHYE1CW493"
};

// 3. Inicializamos Firebase y la Autenticación
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

// 4. Conectamos con el HTML
const loginSection = document.getElementById('login-section');
const dashboardSection = document.getElementById('dashboard-section');
const userNameDisplay = document.getElementById('user-name');
const btnLogin = document.getElementById('btn-login');
const btnLogout = document.getElementById('btn-logout');

// 5. Escuchar si el usuario entra o sale
onAuthStateChanged(auth, (user) => {
    if (user) {
        // Usuario entró: Ocultamos login, mostramos dashboard
        loginSection.style.display = 'none';
        dashboardSection.style.display = 'block';
        userNameDisplay.innerText = user.displayName;
    } else {
        // Usuario salió: Mostramos login, ocultamos dashboard
        loginSection.style.display = 'block';
        dashboardSection.style.display = 'none';
    }
});

// 6. Acción del botón "Entrar con Google"
btnLogin.addEventListener('click', async () => {
    try {
        await signInWithPopup(auth, provider);
    } catch (error) {
        console.error("Error al entrar:", error);
        alert("Hubo un error al iniciar sesión. Revisá la consola para más detalles.");
    }
});

// 7. Acción del botón "Cerrar Sesión"
btnLogout.addEventListener('click', () => {
    signOut(auth);
});
