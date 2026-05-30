// js/settings.js
import { auth, db, getUserDoc, showAlert, friendlyError } from './auth.js';
import {
  onAuthStateChanged,
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
  sendEmailVerification,
  deleteUser,
  signOut,
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import { doc, updateDoc, deleteDoc, serverTimestamp }
  from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

let currentUser = null;

// ─── Tab switching ────────────────────────────────────
document.querySelectorAll('#settings-tabs .nav-link').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('#settings-tabs .nav-link').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const tab = btn.dataset.tab;
    document.querySelectorAll('.tab-content').forEach(tc => tc.classList.add('d-none'));
    document.getElementById(`tab-${tab}`)?.classList.remove('d-none');
  });
});

// ─── Auth state ───────────────────────────────────────
onAuthStateChanged(auth, async (user) => {
  if (!user) return;
  currentUser = user;

  const data = await getUserDoc(user.uid);

  // Email verification status
  const verifiedEl = document.getElementById('email-verified-text');
  if (verifiedEl) {
    verifiedEl.innerHTML = user.emailVerified
      ? `<span class="text-success"><i class="bi bi-check-circle me-1"></i>Verificado: ${user.email}</span>`
      : `<span class="text-warning"><i class="bi bi-exclamation-circle me-1"></i>No verificado: ${user.email}</span>`;
  }

  // Provider rows
  const providersEl = document.getElementById('providers-settings');
  if (providersEl) {
    const labelMap = { 'google.com':'Google','github.com':'GitHub','facebook.com':'Facebook','password':'Email/Contraseña','phone':'Teléfono' };
    const iconMap  = { 'google.com':'bi-google','github.com':'bi-github','facebook.com':'bi-facebook','password':'bi-envelope','phone':'bi-telephone' };
    providersEl.innerHTML = user.providerData.map(p => `
      <div class="provider-row">
        <div class="d-flex align-items-center gap-2">
          <i class="bi ${iconMap[p.providerId] || 'bi-person'} text-primary"></i>
          <span class="fw-medium small">${labelMap[p.providerId] || p.providerId}</span>
          <span class="badge bg-success-subtle text-success border border-success border-opacity-25 ms-1" style="font-size:10px">Vinculado</span>
        </div>
        <span class="small text-body-secondary">${p.email || p.uid || ''}</span>
      </div>
    `).join('');
  }

  // Theme
  const savedTheme = data?.theme || 'dark';
  document.querySelectorAll('.theme-option').forEach(opt => {
    opt.classList.toggle('active', opt.dataset.theme === savedTheme);
  });

  // Notifications
  if (data?.notifications) {
    const n = data.notifications;
    ['email','security','updates','marketing'].forEach(key => {
      const el = document.getElementById(`n-${key}`);
      if (el) el.checked = !!n[key];
    });
  }
});

// ─── Change password ──────────────────────────────────
document.getElementById('password-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  if (!currentUser) return;

  const currentPw = document.getElementById('f-current-pw').value;
  const newPw     = document.getElementById('f-new-pw').value;
  const newPw2    = document.getElementById('f-new-pw2').value;

  if (!currentPw || !newPw) return showAlert('alert-box', 'danger', 'Completa todos los campos.');
  if (newPw !== newPw2)     return showAlert('alert-box', 'danger', 'Las contraseñas nuevas no coinciden.');
  if (newPw.length < 8)     return showAlert('alert-box', 'danger', 'La contraseña debe tener al menos 8 caracteres.');

  const btn  = document.getElementById('btn-change-pw');
  const spin = document.getElementById('spin-pw');
  btn.disabled = true;
  spin.classList.remove('d-none');

  try {
    // Re-authenticate first
    const credential = EmailAuthProvider.credential(currentUser.email, currentPw);
    await reauthenticateWithCredential(currentUser, credential);
    await updatePassword(currentUser, newPw);
    showAlert('alert-box', 'success', '<i class="bi bi-check-circle me-2"></i>Contraseña actualizada correctamente.');
    document.getElementById('password-form').reset();
  } catch (err) {
    showAlert('alert-box', 'danger', `<i class="bi bi-x-circle me-2"></i>${friendlyError(err.code)}`);
  } finally {
    btn.disabled = false;
    spin.classList.add('d-none');
  }
});

// ─── Send verification ────────────────────────────────
document.getElementById('btn-send-verify')?.addEventListener('click', async () => {
  try {
    if (currentUser && !currentUser.emailVerified) {
      await sendEmailVerification(currentUser);
      showAlert('alert-box', 'success', '<i class="bi bi-check-circle me-2"></i>Email de verificación enviado.');
    } else {
      showAlert('alert-box', 'info', 'Tu email ya está verificado.');
    }
  } catch (err) {
    showAlert('alert-box', 'danger', friendlyError(err.code));
  }
});

// ─── Theme switching ──────────────────────────────────
document.querySelectorAll('.theme-option').forEach(opt => {
  opt.addEventListener('click', async () => {
    const theme = opt.dataset.theme;
    document.querySelectorAll('.theme-option').forEach(o => o.classList.remove('active'));
    opt.classList.add('active');
    // Apply theme
    document.documentElement.setAttribute('data-bs-theme', theme === 'auto' ? 'dark' : theme);
    // Save to Firestore
    if (currentUser) {
      await updateDoc(doc(db, 'users', currentUser.uid), { theme, updatedAt: serverTimestamp() });
    }
    showAlert('alert-box', 'success', `<i class="bi bi-check-circle me-2"></i>Tema "${theme}" aplicado.`);
  });
});

// ─── Notifications ────────────────────────────────────
document.getElementById('notif-form')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  if (!currentUser) return;
  try {
    const notifications = {
      email:     document.getElementById('n-email').checked,
      security:  document.getElementById('n-security').checked,
      updates:   document.getElementById('n-updates').checked,
      marketing: document.getElementById('n-marketing').checked,
    };
    await updateDoc(doc(db, 'users', currentUser.uid), { notifications, updatedAt: serverTimestamp() });
    showAlert('alert-box', 'success', '<i class="bi bi-check-circle me-2"></i>Preferencias guardadas.');
  } catch (err) {
    showAlert('alert-box', 'danger', `Error: ${err.message}`);
  }
});

// ─── Revoke sessions ──────────────────────────────────
document.getElementById('btn-revoke')?.addEventListener('click', async () => {
  if (!currentUser) return;
  try {
    await signOut(auth);
    window.location.href = '../index.html';
  } catch (err) {
    showAlert('alert-box', 'danger', `Error: ${err.message}`);
  }
});

// ─── Delete account ───────────────────────────────────
const confirmInput = document.getElementById('confirm-delete-input');
const confirmBtn   = document.getElementById('btn-confirm-delete');

confirmInput?.addEventListener('input', () => {
  confirmBtn.disabled = confirmInput.value !== 'ELIMINAR';
});

confirmBtn?.addEventListener('click', async () => {
  if (!currentUser) return;
  try {
    // Delete Firestore doc first
    await deleteDoc(doc(db, 'users', currentUser.uid));
    // Delete Auth user
    await deleteUser(currentUser);
    window.location.href = '../index.html';
  } catch (err) {
    if (err.code === 'auth/requires-recent-login') {
      showAlert('alert-box', 'warning',
        '<i class="bi bi-exclamation-triangle me-2"></i>Por seguridad, cierra sesión, vuelve a entrar y prueba de nuevo.');
    } else {
      showAlert('alert-box', 'danger', `Error: ${err.message}`);
    }
  }
});
