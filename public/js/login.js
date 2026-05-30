// js/login.js
import { auth }                      from './auth.js';
import { showAlert, setLoading, friendlyError } from './auth.js';
import {
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  GithubAuthProvider,
  FacebookAuthProvider,
  sendPasswordResetEmail,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';

// ─── Email / password login ───────────────────────────
document.getElementById('login-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const email    = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;
  const remember = document.getElementById('remember').checked;

  if (!email || !password) {
    return showAlert('alert-box', 'danger', '<i class="bi bi-exclamation-circle me-2"></i>Completa todos los campos.');
  }

  setLoading('btn-login', 'spin-login', true);

  try {
    const persistence = remember ? browserLocalPersistence : browserSessionPersistence;
    await setPersistence(auth, persistence);
    await signInWithEmailAndPassword(auth, email, password);
    // onAuthStateChanged in auth.js handles the redirect
  } catch (err) {
    showAlert('alert-box', 'danger', `<i class="bi bi-x-circle me-2"></i>${friendlyError(err.code)}`);
    setLoading('btn-login', 'spin-login', false);
  }
});

// ─── Social login helper ───────────────────────────────
async function socialLogin(provider) {
  try {
    await signInWithPopup(auth, provider);
  } catch (err) {
    if (err.code !== 'auth/popup-closed-by-user') {
      showAlert('alert-box', 'danger', `<i class="bi bi-x-circle me-2"></i>${friendlyError(err.code)}`);
    }
  }
}

document.getElementById('btn-google').addEventListener('click', () =>
  socialLogin(new GoogleAuthProvider()));

document.getElementById('btn-github').addEventListener('click', () => {
  const provider = new GithubAuthProvider();
  provider.addScope('user:email');
  socialLogin(provider);
});

document.getElementById('btn-facebook').addEventListener('click', () =>
  socialLogin(new FacebookAuthProvider()));

// ─── Forgot password ──────────────────────────────────
document.getElementById('forgot-link').addEventListener('click', async (e) => {
  e.preventDefault();
  const email = document.getElementById('email').value.trim();
  if (!email) {
    return showAlert('alert-box', 'info', '<i class="bi bi-info-circle me-2"></i>Ingresa tu correo arriba y pulsa el enlace de nuevo.');
  }
  try {
    await sendPasswordResetEmail(auth, email);
    showAlert('alert-box', 'success', `<i class="bi bi-check-circle me-2"></i>Email de recuperación enviado a <strong>${email}</strong>`);
  } catch (err) {
    showAlert('alert-box', 'danger', `<i class="bi bi-x-circle me-2"></i>${friendlyError(err.code)}`);
  }
});

// ─── Password visibility toggle ───────────────────────
document.getElementById('toggle-pw').addEventListener('click', () => {
  const input = document.getElementById('password');
  const icon  = document.querySelector('#toggle-pw i');
  input.type  = input.type === 'password' ? 'text' : 'password';
  icon.className = input.type === 'password' ? 'bi bi-eye' : 'bi bi-eye-slash';
});
