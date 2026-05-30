// js/dashboard.js
import { auth, db, getUserDoc, generateAvatar, formatDate, formatDateTime, showAlert } from './auth.js';
import { onAuthStateChanged, reload, sendEmailVerification }
  from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';

onAuthStateChanged(auth, async (user) => {
  if (!user) return; // auth.js handles redirect

  // Load Firestore data
  const data = await getUserDoc(user.uid);

  // Avatar
  const photoURL = user.photoURL || generateAvatar(user.displayName || user.email || 'U');
  ['profile-avatar', 'sidebar-avatar', 'topbar-avatar'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.src = photoURL;
  });

  // Welcome
  const firstName = data?.firstName || user.displayName?.split(' ')[0] || 'Usuario';
  setText('welcome-name', firstName);
  setText('profile-name', user.displayName || user.email || 'Usuario');
  setText('profile-email', user.email || '(anónimo)');

  // Info rows
  setText('info-uid', user.uid);
  document.getElementById('info-verified').innerHTML = user.emailVerified
    ? '<span class="badge bg-success-subtle text-success border border-success border-opacity-25">✓ Verificado</span>'
    : '<span class="badge bg-warning-subtle text-warning border border-warning border-opacity-25">✗ Pendiente</span>';

  const created  = user.metadata.creationTime;
  const lastSign = user.metadata.lastSignInTime;
  setText('info-created', created  ? formatDate(new Date(created))  : '—');
  setText('info-last',    lastSign ? formatDate(new Date(lastSign)) : '—');

  // Activity
  setText('act-login-time',   lastSign ? formatDateTime(new Date(lastSign)) : '—');
  setText('act-created-time', created  ? formatDateTime(new Date(created))  : '—');

  // Stats
  const daysSince = created
    ? Math.floor((Date.now() - new Date(created).getTime()) / 86400000)
    : 0;
  setText('stat-days', daysSince);
  setText('stat-role', data?.role || 'user');

  // Provider
  const providerMap = {
    'google.com':   'Google',
    'github.com':   'GitHub',
    'facebook.com': 'Facebook',
    'password':     'Email',
    'phone':        'Teléfono',
  };
  const providerIds = user.providerData.map(p => p.providerId);
  const providerNames = providerIds.map(id => providerMap[id] || id).join(', ');
  setText('stat-provider', providerNames || '—');

  // Show/hide verify email button
  const verifyBtn = document.getElementById('btn-verify-email');
  if (verifyBtn) {
    if (!user.emailVerified && user.email) {
      verifyBtn.classList.remove('d-none');
    } else {
      verifyBtn.classList.add('d-none');
    }
  }
});

// ─── Actions ──────────────────────────────────────────
document.getElementById('btn-verify-email')?.addEventListener('click', async () => {
  try {
    const user = auth.currentUser;
    if (user) await sendEmailVerification(user);
    showAlert('alert-box', 'success', '📧 Email de verificación enviado.');
  } catch {
    showAlert('alert-box', 'danger', 'No se pudo enviar el email. Intenta más tarde.');
  }
});

document.getElementById('btn-reload')?.addEventListener('click', async () => {
  try {
    await reload(auth.currentUser);
    window.location.reload();
  } catch {
    showAlert('alert-box', 'danger', 'No se pudo actualizar.');
  }
});

// ─── Util ─────────────────────────────────────────────
function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value ?? '—';
}
