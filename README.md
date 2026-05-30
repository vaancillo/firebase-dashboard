# 🔐 FireDash — Firebase Auth + Firestore Dashboard

> Full-stack authentication dashboard built with Firebase Authentication, Cloud Firestore, and Bootstrap 5. Zero build tools — runs entirely in the browser via ES modules.

![Firebase](https://img.shields.io/badge/Firebase-10.x-FFCA28?logo=firebase&logoColor=black)
![Bootstrap](https://img.shields.io/badge/Bootstrap-5.3-7952B3?logo=bootstrap&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-ESModules-F7DF1E?logo=javascript&logoColor=black)
![License](https://img.shields.io/badge/license-MIT-green)
[![Deploy to Firebase](https://github.com/YOUR_USERNAME/firebase-dashboard/actions/workflows/firebase-deploy.yml/badge.svg)](https://github.com/YOUR_USERNAME/firebase-dashboard/actions)

---

## ✨ Features

### Authentication
| Provider | Method |
|---|---|
| Email / Password | Native Firebase Auth |
| Google | OAuth 2.0 popup |
| GitHub | OAuth 2.0 popup |
| Facebook | OAuth 2.0 popup |

- Password strength meter on registration
- Email verification flow
- Password reset via email
- Session persistence control (remember me)
- Route guard — protected pages redirect to login

### User Data (Firestore)
- User document created automatically on first sign-in
- Profile editing: name, phone, city, bio, website, avatar URL
- Notification preferences
- Theme preference (dark / light / auto) — persisted across devices
- Firestore Security Rules — users can only read/write their own document

### Pages
| Page | Path | Description |
|---|---|---|
| Login | `/index.html` | Sign in with email or social providers |
| Register | `/pages/register.html` | Create account with profile data |
| Dashboard | `/pages/dashboard.html` | Overview, stats, quick actions |
| Profile | `/pages/profile.html` | Edit personal information |
| Settings | `/pages/settings.html` | Password, theme, notifications, danger zone |
| 404 | `/pages/404.html` | Not found page |

### DevOps
- Firebase Hosting deployment
- GitHub Actions CI/CD — auto-deploy on push to `main`
- Preview channels for pull requests

---

## 🗂️ Project Structure

```
firebase-dashboard/
├── public/
│   ├── index.html              # Login page
│   ├── assets/
│   │   └── favicon.svg
│   ├── css/
│   │   └── app.css             # Custom styles
│   ├── js/
│   │   ├── firebase-config.js  # ← Your Firebase config goes here
│   │   ├── auth.js             # Shared: init, guards, helpers
│   │   ├── login.js
│   │   ├── register.js
│   │   ├── dashboard.js
│   │   ├── profile.js
│   │   └── settings.js
│   └── pages/
│       ├── register.html
│       ├── dashboard.html
│       ├── profile.html
│       ├── settings.html
│       └── 404.html
├── .github/
│   └── workflows/
│       └── firebase-deploy.yml # CI/CD pipeline
├── firebase.json               # Firebase Hosting config
├── firestore.rules             # Firestore Security Rules
├── firestore.indexes.json
├── .firebaserc                 # Project alias
├── .gitignore
└── package.json
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm
- Git
- Firebase project ([create one](https://console.firebase.google.com))

### 1. Clone the repository

```bash
git clone https://github.com/vaancillo/firebase-dashboard.git
cd firebase-dashboard
```

### 2. Install Firebase CLI

```bash
npm install
npm install -g firebase-tools
```

### 3. Create your Firebase project

1. Go to [console.firebase.google.com](https://console.firebase.google.com)
2. Click **Add project**
3. Enable **Authentication** → Sign-in method → enable:
   - Email/Password
   - Google
   - GitHub *(requires GitHub OAuth app)*
   - Facebook *(requires Facebook app)*
4. Enable **Firestore Database** → Start in production mode

### 4. Configure the app

Edit `public/js/firebase-config.js` with your project's config:

```js
// public/js/firebase-config.js
export const firebaseConfig = {
  apiKey:            "AIzaSy...",
  authDomain:        "your-project.firebaseapp.com",
  projectId:         "your-project-id",
  storageBucket:     "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId:             "1:123:web:abc",
};
```

> Get this from: Firebase Console → ⚙️ Project Settings → Your apps → Web app

### 5. Add authorized domains

Firebase Console → Authentication → Settings → **Authorized domains**:
- `localhost`
- `your-project.web.app`
- `your-project.firebaseapp.com`

### 6. Deploy Firestore rules

```bash
firebase login
firebase use YOUR_PROJECT_ID
firebase deploy --only firestore:rules
```

### 7. Run locally

```bash
firebase serve --only hosting
# → http://localhost:5000
```

---

## ⚙️ Provider Setup

### Google
Firebase Console → Authentication → Sign-in method → Google → Enable. Done.

### GitHub
1. Go to [github.com/settings/developers](https://github.com/settings/developers) → **New OAuth App**
2. **Homepage URL:** `https://your-project.web.app`
3. **Authorization callback URL:** `https://your-project.firebaseapp.com/__/auth/handler`
4. Copy **Client ID** and **Client Secret** → paste in Firebase Console

### Facebook
1. [developers.facebook.com](https://developers.facebook.com) → **My Apps → Create App → Consumer**
2. Add **Facebook Login** product
3. **Valid OAuth Redirect URIs:** `https://your-project.firebaseapp.com/__/auth/handler`
4. Copy **App ID** and **App Secret** → paste in Firebase Console

---

## 🚢 Deployment

### Manual deploy

```bash
firebase deploy --only hosting,firestore:rules
```

### Automatic deploy via GitHub Actions

1. In Firebase Console → Project Settings → **Service accounts** → Generate new private key
2. In your GitHub repo → Settings → Secrets and variables → Actions → **New repository secret**:
   - `FIREBASE_SERVICE_ACCOUNT` → paste the entire JSON content of the service account key
   - `FIREBASE_PROJECT_ID` → your Firebase project ID (e.g. `my-app-abc123`)
3. Push to `main` — the workflow deploys automatically

The pipeline also creates **preview channels** for every pull request so you can test changes before merging.

---

## 🛡️ Firestore Security Rules

Users are strictly scoped to their own document:

```
users/{userId}  →  readable/writable only by request.auth.uid == userId
```

- No user can promote themselves to admin via the client
- `uid` field is immutable once set
- All other paths are denied by default

---

## 🧰 Tech Stack

| Layer | Technology |
|---|---|
| Auth | Firebase Authentication 10.x |
| Database | Cloud Firestore |
| Hosting | Firebase Hosting |
| UI Framework | Bootstrap 5.3 |
| Icons | Bootstrap Icons 1.11 |
| JavaScript | Vanilla ESModules (no bundler) |
| CI/CD | GitHub Actions |

---

## 📝 License

MIT — free to use, modify, and distribute.

---

*Built with ❤️ using [Claude](https://claude.ai) and Firebase*
