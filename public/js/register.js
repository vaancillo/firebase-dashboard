// js/register.js
import { auth, db, showAlert, setLoading, friendlyError } from './auth.js';
import {
  createUserWithEmailAndPassword,
  updateProfile,
  sendEmailVerification,
  signInWithPopup,
  GoogleAuthProvider,
  GithubAuthProvider,
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import { doc, setDoc, serverTimestamp }
  from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

// ─── Password strength ────────────────────────────────
document.getElementById('password').addEventListener('input', (e) => {
  const pw  = e.target.value;
  const bar = document.getElementById('strength-bar');
  const lbl = document.getElementById('strength-label');

  let score = 0;
  if (pw.length >= 8)                score++;
  if (/[A-Z]/.test(pw))             score++;
  if (/[0-9]/.test(pw))             score++;
  if (/[^A-Za-z0-9]/.test(pw))     score++;

  const levels = [
    { pct: 0,   cls: '',        text: '' },
    { pct: 25,  cls: 'bg-danger',   text: 'Muy débil' },
    { pct: 50,  cls: 'bg-warning',  text: 'Débil' },
    { pct: 75,  cls: 'bg-info',     text: 'Buena' },
    { pct: 100, cls: 'bg-success',  text: 'Fuerte 💪' },
  ];

  const l = levels[score];
  bar.style.width     = l.pct + '%';
  bar.className       = `progress-bar ${l.cls}`;
  lbl.textContent     = l.text;
});

// ─── Register form ────────────────────────────────────
document.getElementById('register-form').addEventListener('submit', async (e) => {
  e.preventDefault();

  const firstName = document.getElementById('firstName').value.trim();
  const lastName  = document.getElementById('lastName').value.trim();
  const email     = document.getElementById('email').value.trim();
  const password  = document.getElementById('password').value;
  const password2 = document.getElementById('password2').value;
  const terms     = document.getElementById('terms').checked;

  if (!firstName || !email || !password) {
    return showAlert('alert-box', 'danger', '<i class="bi bi-exclamation-circle me-2"></i>Completa todos los campos obligatorios.');
  }
  if (password !== password2) {
    return showAlert('alert-box', 'danger', '<i class="bi bi-x-circle me-2"></i>Las contraseñas no coinciden.');
  }
  if (password.length < 8) {
    return showAlert('alert-box', 'danger', '<i class="bi bi-x-circle me-2"></i>La contraseña debe tener al menos 8 caracteres.');
  }
  if (!terms) {
    return showAlert('alert-box', 'warning', '<i class="bi bi-exclamation-triangle me-2"></i>Debes aceptar los términos y condiciones.');
  }

  setLoading('btn-register', 'spin-register', true);

  try {
    // Create Firebase Auth user
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    const displayName = `${firstName} ${lastName}`.trim();

    // Update Auth profile
    await updateProfile(cred.user, { displayName });

    // Create Firestore document
    await setDoc(doc(db, 'users', cred.user.uid), {
      uid:           cred.user.uid,
      email,
      firstName,
      lastName,
      displayName,
      photoURL:      '',
      phone:         '',
      city:          '',
      bio:           '',
      website:       '',
      role:          'user',
      theme:         'dark',
      notifications: { email: true, security: true, updates: false, marketing: false },
      createdAt:     serverTimestamp(),
      updatedAt:     serverTimestamp(),
    });

    // Send verification email
    await sendEmailVerification(cred.user);

    showAlert('alert-box', 'success',
      '<i class="bi bi-check-circle me-2"></i>¡Cuenta creada! Revisa tu correo para verificar tu cuenta. Redirigiendo...');

    // auth.js onAuthStateChanged handles the redirect
  } catch (err) {
    showAlert('alert-box', 'danger', `<i class="bi bi-x-circle me-2"></i>${friendlyError(err.code)}`);
    setLoading('btn-register', 'spin-register', false);
  }
});

// ─── Social register ──────────────────────────────────
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
  const p = new GithubAuthProvider();
  p.addScope('user:email');
  socialLogin(p);
});

// ─── Password visibility ──────────────────────────────
document.getElementById('toggle-pw').addEventListener('click', () => {
  const input = document.getElementById('password');
  const icon  = document.querySelector('#toggle-pw i');
  input.type  = input.type === 'password' ? 'text' : 'password';
  icon.className = input.type === 'password' ? 'bi bi-eye' : 'bi bi-eye-slash';
});
