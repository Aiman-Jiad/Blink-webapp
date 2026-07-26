# Blink

A premium, WhatsApp-inspired real-time messaging application built with React, Vite, TypeScript, and Firebase. Designed to be beautiful, responsive, and deployable to GitHub Pages with zero configuration.

![Blink](public/blink.svg)

---

## Overview

Blink is a production-quality messenger that brings the familiar WhatsApp experience to the web with a modern, polished design. It works **out of the box in demo mode** (no Firebase setup required) using a localStorage-backed backend, and seamlessly upgrades to real Firebase when you provide credentials.

### Highlights

- **No setup required** — runs instantly in demo mode
- **GitHub Pages ready** — builds and deploys with a single command
- **Fully responsive** — desktop, tablet, and mobile
- **Real-time feel** — typing indicators, read receipts, live message status
- **Premium animations** — powered by Framer Motion
- **Accessible** — keyboard navigation, ARIA labels, high-contrast mode

---

## Features

### Authentication
- Email & password login/signup
- Google sign-in
- Forgot password (reset link)
- Email verification
- Protected routes

### Messaging
- One-to-one and group chats
- Real-time message updates
- Typing indicators
- Read receipts (sent / delivered / read)
- Reply to messages
- Forward messages
- Delete for me / delete for everyone
- Copy message
- Pin & star messages
- Message reactions (emoji)
- In-chat search
- Auto-scroll with smart detection
- Message grouping by date

### Media
- Send images, videos, documents
- Voice messages (UI)
- Camera capture
- Image preview
- Drag & drop upload
- Clipboard image paste

### Chat List
- Recent chats with unread badges
- Search chats & messages
- Pin, archive, favourite, mute chats
- Filter by status (unread, pinned, favourites, archived)

### Groups
- Create groups with name, description, icon
- Add/remove members
- Admin roles
- Group info panel

### Status (Stories)
- Upload image/video/text status
- View contacts' status
- Status viewer with progress bars
- Viewer count

### Calls (UI only)
- Audio call interface
- Video call interface
- Call history
- Minimized call bar

### Settings
- Dark / Light / System theme
- Notification settings
- Privacy settings (read receipts, last seen)
- Appearance (font size, high contrast)
- Account settings
- Reset to defaults

### Productivity
- Command palette (Cmd/Ctrl+K)
- Global search (Cmd/Ctrl+/)
- Keyboard shortcuts (vim-style `g c`, `g s`, `g p`)
- Right-click context menus
- Drag & drop file upload
- Clipboard image paste

### Performance
- Lazy-loaded routes (code splitting)
- Component memoization
- Firestore-ready pagination
- Optimized bundle (manual chunks)

---

## Tech Stack

| Category | Technology |
|---|---|
| Frontend | React 18, Vite, TypeScript |
| Styling | Tailwind CSS, shadcn/ui |
| Animations | Framer Motion |
| Icons | Lucide React |
| State | Zustand |
| Routing | React Router (HashRouter) |
| Backend | Firebase (Auth, Firestore, Storage) |
| Forms | React Hook Form + Zod |
| Utilities | date-fns, emoji-picker-react, nanoid |
| Deployment | GitHub Pages |

---

## Installation

```bash
# 1. Clone the repository
git clone https://github.com/your-username/blink.git
cd blink

# 2. Install dependencies
npm install

# 3. Start the development server
npm run dev
```

The app runs at `http://localhost:5173`.

> **Demo mode:** Without Firebase credentials, Blink uses a localStorage-backed mock backend with seeded demo data. You can log in with any email and password (6+ characters) to explore every feature.

---

## Firebase Setup (Optional)

To use real Firebase instead of demo mode:

1. Go to [Firebase Console](https://console.firebase.google.com/) and create a new project.

2. Enable the services you need:
   - **Authentication** → Sign-in method → Email/Password and Google
   - **Firestore Database** → Create database (production mode)
   - **Storage** → Get started

3. Get your web app config:
   - Project Settings → General → Your apps → Web app (`</>`)
   - Copy the `firebaseConfig` values

4. Create a `.env` file in the project root:
   ```env
   VITE_FIREBASE_API_KEY=AIza...
   VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your-project
   VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
   VITE_FIREBASE_APP_ID=1:123456789:web:abcdef
   ```

5. Apply the security rules:
   - Copy `firestore.rules` to Firestore → Rules
   - Copy `storage.rules` to Storage → Rules

6. Restart the dev server — Blink now uses real Firebase.

---

## Deployment to GitHub Pages

### Automatic (GitHub Actions)

1. Push your code to GitHub.

2. Enable GitHub Pages:
   - Repository **Settings** → **Pages**
   - **Source**: GitHub Actions

3. The included workflow (`.github/workflows/deploy.yml`) automatically:
   - Installs dependencies
   - Builds the project
   - Deploys to GitHub Pages

4. Your app is live at `https://your-username.github.io/blink/`

> **Using real Firebase on GitHub Pages?** Add your Firebase credentials as repository secrets (Settings → Secrets and variables → Actions) with the names shown in the workflow file.

### Manual

```bash
# Build the project
npm run build

# The dist/ folder contains the built site.
# Copy its contents to your GitHub Pages branch (gh-pages) or
# use a tool like gh-pages:
npx gh-pages -d dist
```

### Why HashRouter?

Blink uses `HashRouter` (URLs like `/#/chats`) so deep links work on GitHub Pages without server configuration. GitHub Pages serves static files and doesn't support SPA fallback routing — HashRouter avoids this limitation entirely.

The `base: './'` in `vite.config.ts` ensures assets load correctly regardless of the repository name.

---

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start dev server |
| `npm run build` | Type-check + build for production |
| `npm run preview` | Preview the production build |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | Run TypeScript checker only |

---

## Folder Structure

```
blink/
├── public/                  # Static assets (logo)
├── src/
│   ├── components/
│   │   ├── auth/           # Auth components (protected routes, password input, Google button)
│   │   ├── calls/          # Call overlay UI
│   │   ├── chat/           # Chat list, message bubble, composer, info panel
│   │   ├── layout/         # Sidebar, mobile nav, page header
│   │   ├── shared/         # Avatar, logo, loaders, empty states, skeletons
│   │   └── ui/             # shadcn/ui primitives
│   ├── firebase/           # Firebase config + mock backend
│   ├── hooks/              # Custom hooks (auth, theme, realtime, shortcuts)
│   ├── layouts/            # Auth layout, app shell layout
│   ├── pages/              # Route pages (login, chats, settings, etc.)
│   ├── services/           # Data service + auth service (unified API)
│   ├── store/              # Zustand stores (auth, chat, settings, UI)
│   ├── types/              # TypeScript type definitions
│   └── utils/              # Utility functions
├── .github/workflows/      # GitHub Actions deployment
├── firestore.rules         # Firestore security rules
├── storage.rules           # Firebase Storage security rules
├── .env.example            # Firebase config template
├── vite.config.ts          # Vite config (GitHub Pages base path)
└── tailwind.config.js      # Tailwind theme
```

---

## Screenshots

> Add your screenshots here after running the app.

```
screenshots/
├── login.png
├── chat-list.png
├── chat-view.png
├── status.png
├── settings.png
└── mobile.png
```

---

## Future Improvements

- End-to-end encryption
- Voice/video calls with WebRTC
- Message search across all chats
- Message scheduling
- Disappearing messages
- Custom chat wallpapers
- Sticker packs
- Message editing
- Multi-device sync
- Push notifications via FCM
- Block contacts
- Export chat history
- Dark/Light theme auto-switching by time

---

## License

MIT — feel free to use this project as a starting point for your own messaging app.

---

Built with care. Star the repo if you find it useful.
