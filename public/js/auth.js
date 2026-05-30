// js/auth.js — Shared Firebase Auth + Firestore module
import { initializeApp }        from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import { getAuth, onAuthStateChanged, signOut }
                                from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import { getFirestore, doc, setDoc, getDoc, serverTimestamp }
                                from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';
import { firebaseConfig }       from './firebase-config.js';

// ─── Init ───────────────────────────────────────────────
const app  = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db   = getFirestore(app);

export { app, auth, db };

// ─── Route guard ────────────────────────────────────────
// Pages that require auth
const PROTECTED = ['dashboard.html', 'profile.html', 'settings.html'];
// Pages that redirect to dashboard when already logged in
const AUTH_PAGES = ['index.html', 'register.html'];

const page = window.location.pathname.split('/').pop() || 'index.html';

onAuthStateChanged(auth, async (user) => {
  if (user) {
    // Redirect away from auth pages
    if (AUTH_PAGES.includes(page)) {
      window.location.replace('pages/dashboard.html');
      return;
    }
    // Load shared UI elements
    populateSidebar(user);
    populateTopbar(user);
    // Ensure Firestore doc exists
    await ensureUserDoc(user);
  } else {
    // Redirect away from protected pages
    if (PROTECTED.includes(page)) {
      window.location.replace('../index.html');
    }
  }
});

// ─── Firestore helpers ───────────────────────────────────
export async function ensureUserDoc(user) {
  const ref = doc(db, 'users', user.uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    const [firstName, ...rest] = (user.displayName || 'Usuario').split(' ');
    await setDoc(ref, {
      uid:        user.uid,
      email:      user.email || '',
      firstName:  firstName || '',
      lastName:   rest.join(' ') || '',
      displayName: user.displayName || '',
      photoURL:   user.photoURL || '',
      phone:      user.phoneNumber || '',
      city:       '',
      bio:        '',
      website:    '',
      role:       'user',
      theme:      'dark',
      notifications: { email: true, security: true, updates: false, marketing: false },
      createdAt:  serverTimestamp(),
      updatedAt:  serverTimestamp(),
    });
  }
  return ref;
}

export async function getUserDoc(uid) {
  const snap = await getDoc(doc(db, 'users', uid));
  return snap.exists() ? snap.data() : null;
}

// ─── Shared UI ───────────────────────────────────────────
function populateSidebar(user) {
  const nameEl   = document.getElementById('sidebar-name');
  const emailEl  = document.getElementById('sidebar-email');
  const avatarEl = document.getElementById('sidebar-avatar');
  const logoutEl = document.getElementById('btn-logout');

  if (nameEl)   nameEl.textContent  = user.displayName || user.email || 'Usuario';
  if (emailEl)  emailEl.textContent = user.email || '(anónimo)';
  if (avatarEl) {
    avatarEl.src = user.photoURL || generateAvatar(user.displayName || user.email || 'U');
  }
  if (logoutEl) {
    logoutEl.addEventListener('click', async () => {
      await signOut(auth);
      const depth = window.location.pathname.includes('/pages/') ? '../' : '';
      window.location.href = depth + 'index.html';
    });
  }

  // Mobile sidebar toggle
  const toggle  = document.getElementById('sidebar-toggle');
  const close   = document.getElementById('sidebar-close');
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebar-overlay');

  if (toggle) toggle.addEventListener('click', () => openSidebar(sidebar, overlay));
  if (close)  close.addEventListener('click',  () => closeSidebar(sidebar, overlay));
  if (overlay) overlay.addEventListener('click', () => closeSidebar(sidebar, overlay));
}

function populateTopbar(user) {
  const avatarEl = document.getElementById('topbar-avatar');
  if (avatarEl) {
    avatarEl.src = user.photoURL || generateAvatar(user.displayName || user.email || 'U');
    avatarEl.addEventListener('click', () => {
      window.location.href = window.location.pathname.includes('/pages/')
        ? 'profile.html'
        : 'pages/profile.html';
    });
  }
}

function openSidebar(sidebar, overlay) {
  sidebar?.classList.add('open');
  overlay?.classList.add('show');
  document.body.style.overflow = 'hidden';
}

function closeSidebar(sidebar, overlay) {
  sidebar?.classList.remove('open');
  overlay?.classList.remove('show');
  document.body.style.overflow = '';
}

// ─── Helpers ────────────────────────────────────────────
export function generateAvatar(name) {
  const initial = (name || 'U').charAt(0).toUpperCase();
  const colors  = ['6366f1','8b5cf6','06b6d4','10b981','f59e0b','ef4444'];
  const color   = colors[initial.charCodeAt(0) % colors.length];
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(initial)}&background=${color}&color=fff&size=128&bold=true`;
}

export function showAlert(id, type, message) {
  const el = document.getElementById(id);
  if (!el) return;
  el.className = `alert alert-${type}`;
  el.innerHTML = message;
  el.classList.remove('d-none');
  el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  if (type === 'success') {
    setTimeout(() => el.classList.add('d-none'), 4000);
  }
}

export function setLoading(btnId, spinId, loading) {
  const btn  = document.getElementById(btnId);
  const spin = document.getElementById(spinId);
  if (!btn) return;
  btn.disabled = loading;
  spin?.classList.toggle('d-none', !loading);
}

export function friendlyError(code) {
  const map = {
    'auth/user-not-found':                      'No existe una cuenta con ese correo.',
    'auth/wrong-password':                      'Contraseña incorrecta.',
    'auth/email-already-in-use':                'Ese correo ya está registrado.',
    'auth/invalid-email':                       'Correo electrónico inválido.',
    'auth/weak-password':                       'La contraseña debe tener al menos 6 caracteres.',
    'auth/popup-closed-by-user':                'Se cerró la ventana de inicio de sesión.',
    'auth/operation-not-allowed':               'Proveedor no habilitado. Actívalo en Firebase Console.',
    'auth/account-exists-with-different-credential':
                                                'Ya existe una cuenta con ese email usando otro proveedor.',
    'auth/too-many-requests':                   'Demasiados intentos. Espera un momento.',
    'auth/network-request-failed':              'Error de red. Verifica tu conexión.',
    'auth/requires-recent-login':               'Por seguridad, vuelve a iniciar sesión e intenta de nuevo.',
    'auth/invalid-api-key':                     'API Key inválida. Revisa firebase-config.js.',
    'auth/user-disabled':                       'Esta cuenta ha sido deshabilitada.',
  };
  return map[code] || `Error: ${code}`;
}

export function formatDate(value) {
  if (!value) return '—';
  const d = value.toDate ? value.toDate() : new Date(value);
  return d.toLocaleDateString('es-MX', { year: 'numeric', month: 'short', day: 'numeric' });
}

export function formatDateTime(value) {
  if (!value) return '—';
  const d = value.toDate ? value.toDate() : new Date(value);
  return d.toLocaleString('es-MX', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}
