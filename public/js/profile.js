// js/profile.js
import { auth, db, getUserDoc, generateAvatar, showAlert, formatDate } from './auth.js';
import { onAuthStateChanged, updateProfile }
  from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import { doc, updateDoc, serverTimestamp }
  from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

let currentUser = null;

onAuthStateChanged(auth, async (user) => {
  if (!user) return;
  currentUser = user;

  const data = await getUserDoc(user.uid);

  // Avatar
  const photoURL = user.photoURL || generateAvatar(user.displayName || user.email || 'U');
  setImg('profile-avatar', photoURL);
  setImg('sidebar-avatar', photoURL);
  setImg('topbar-avatar',  photoURL);

  // Identity card
  setText('display-name-text', user.displayName || user.email);
  setText('display-email', user.email || '(anónimo)');
  setText('uid-text', user.uid);
  setText('created-text', formatDate(new Date(user.metadata.creationTime)));

  // Provider icon
  const provider = user.providerData[0]?.providerId || 'password';
  const iconMap = {
    'google.com':   'bi-google',
    'github.com':   'bi-github',
    'facebook.com': 'bi-facebook',
    'password':     'bi-envelope-fill',
    'phone':        'bi-telephone-fill',
  };
  const iconEl = document.getElementById('provider-icon');
  if (iconEl) iconEl.className = `bi ${iconMap[provider] || 'bi-person-fill'}`;

  // Verified badge
  const badgeWrap = document.getElementById('verified-badge-wrap');
  if (badgeWrap) {
    badgeWrap.innerHTML = user.emailVerified
      ? '<span class="badge bg-success-subtle text-success border border-success border-opacity-25 mb-3"><i class="bi bi-check-circle me-1"></i>Email verificado</span>'
      : '<span class="badge bg-warning-subtle text-warning border border-warning border-opacity-25 mb-3"><i class="bi bi-exclamation-circle me-1"></i>Email no verificado</span>';
  }

  // Provider tags
  const providerList = document.getElementById('providers-list');
  if (providerList) {
    const labelMap = { 'google.com':'Google','github.com':'GitHub','facebook.com':'Facebook','password':'Email','phone':'Teléfono' };
    providerList.innerHTML = user.providerData.map(p =>
      `<span class="badge bg-primary-subtle text-primary border border-primary border-opacity-25">${labelMap[p.providerId] || p.providerId}</span>`
    ).join('');
  }

  // Fill form from Firestore
  if (data) {
    setVal('f-firstName', data.firstName);
    setVal('f-lastName',  data.lastName);
    setVal('f-email',     data.email);
    setVal('f-phone',     data.phone);
    setVal('f-city',      data.city);
    setVal('f-bio',       data.bio);
    setVal('f-website',   data.website);
    setVal('f-photoURL',  data.photoURL);
  } else {
    setVal('f-email', user.email || '');
  }
});

// ─── Save profile ────────────────────────────────────
document.getElementById('profile-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  if (!currentUser) return;

  const btn  = document.getElementById('btn-save-profile');
  const spin = document.getElementById('spin-profile');
  btn.disabled = true;
  spin.classList.remove('d-none');

  try {
    const firstName = document.getElementById('f-firstName').value.trim();
    const lastName  = document.getElementById('f-lastName').value.trim();
    const phone     = document.getElementById('f-phone').value.trim();
    const city      = document.getElementById('f-city').value.trim();
    const bio       = document.getElementById('f-bio').value.trim();
    const website   = document.getElementById('f-website').value.trim();
    const displayName = `${firstName} ${lastName}`.trim();

    // Update Auth profile
    await updateProfile(currentUser, { displayName });

    // Update Firestore
    await updateDoc(doc(db, 'users', currentUser.uid), {
      firstName, lastName, displayName,
      phone, city, bio, website,
      updatedAt: serverTimestamp(),
    });

    // Refresh name display
    setText('display-name-text', displayName);

    showAlert('alert-box', 'success', '<i class="bi bi-check-circle me-2"></i>Perfil actualizado correctamente.');
  } catch (err) {
    showAlert('alert-box', 'danger', `<i class="bi bi-x-circle me-2"></i>Error: ${err.message}`);
  } finally {
    btn.disabled = false;
    spin.classList.add('d-none');
  }
});

// ─── Save photo ──────────────────────────────────────
document.getElementById('btn-save-photo').addEventListener('click', async () => {
  if (!currentUser) return;
  const photoURL = document.getElementById('f-photoURL').value.trim();
  if (!photoURL) return showAlert('alert-box', 'warning', 'Ingresa una URL de imagen válida.');

  try {
    await updateProfile(currentUser, { photoURL });
    await updateDoc(doc(db, 'users', currentUser.uid), { photoURL, updatedAt: serverTimestamp() });
    setImg('profile-avatar', photoURL);
    setImg('sidebar-avatar', photoURL);
    setImg('topbar-avatar',  photoURL);
    showAlert('alert-box', 'success', '<i class="bi bi-check-circle me-2"></i>Foto de perfil actualizada.');
  } catch (err) {
    showAlert('alert-box', 'danger', `<i class="bi bi-x-circle me-2"></i>Error: ${err.message}`);
  }
});

// Cancel reloads the page
document.getElementById('btn-cancel').addEventListener('click', () => window.location.reload());

// ─── Helpers ─────────────────────────────────────────
function setText(id, val) { const el = document.getElementById(id); if (el) el.textContent = val || '—'; }
function setVal(id, val)  { const el = document.getElementById(id); if (el) el.value = val || ''; }
function setImg(id, src)  { const el = document.getElementById(id); if (el) el.src = src; }
