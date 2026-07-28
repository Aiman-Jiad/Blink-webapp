// ============================================================================
// Auth service — unified mock + Firebase implementation.
//
// Same pattern as dataService: uses Firebase Auth when configured, otherwise
// a localStorage-backed mock that simulates email/password + Google sign-in.
// This lets the whole auth flow (login, signup, reset, verification, Google)
// work end-to-end in demo mode.
// ============================================================================

import { FIREBASE_ENABLED, auth } from '@/firebase/config';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as fbSignOut,
  sendPasswordResetEmail,
  sendEmailVerification as fbSendEmailVerification,
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged,
  updateProfile,
  type User as FbUser,
} from 'firebase/auth';
import { nanoid } from 'nanoid';
import { dataService } from './dataService';
import type { UserProfile } from '@/types';
import { mockSession } from '@/firebase/mock';

const SESSION_KEY = 'blink:current_user';

export interface AuthResult {
  user: UserProfile;
}

function profileFromFbUser(u: FbUser): UserProfile {
  return {
    id: u.uid,
    name: u.displayName || (u.email ? u.email.split('@')[0] : 'Blink user'),
    username: (u.email ? u.email.split('@')[0] : nanoid(6)).toLowerCase(),
    email: u.email || '',
    about: 'Hey there! I am using Blink.',
    phone: u.phoneNumber || undefined,
    photoURL: u.photoURL,
    status: 'online',
    lastSeen: Date.now(),
    online: true,
    createdAt: Date.now(),
    readReceiptsEnabled: true,
    photoVisibility: 'everyone',
    aboutVisibility: 'everyone',
    lastSeenVisibility: 'everyone',
    onlineStatusVisibility: 'everyone',
    readReceiptsVisibility: 'everyone',
  };
}

async function persistProfile(profile: UserProfile): Promise<UserProfile> {
  await dataService.users.upsert(profile);
  return profile;
}

// ---------------------------------------------------------------------------
// Mock auth helpers
// ---------------------------------------------------------------------------

function mockCreateSession(profile: UserProfile): AuthResult {
  mockSession.set(profile.id);
  localStorage.setItem(SESSION_KEY, JSON.stringify(profile));
  return { user: profile };
}

function mockGetStoredProfile(): UserProfile | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as UserProfile) : null;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export const authService = {
  /** Subscribe to auth state changes. Returns an unsubscribe fn. */
  onAuthChange(cb: (user: UserProfile | null) => void): () => void {
    if (FIREBASE_ENABLED && auth) {
      return onAuthStateChanged(auth, async (fbUser) => {
        if (fbUser) {
          const profile = profileFromFbUser(fbUser);
          const existing = await dataService.users.get(fbUser.uid);
          cb(existing ? { ...existing, online: true, lastSeen: Date.now() } : profile);
        } else {
          cb(null);
        }
      });
    }
    // Mock: poll session (cheap; runs once + on storage events)
    const emit = () => {
      const stored = mockGetStoredProfile();
      cb(stored);
    };
    emit();
    const onStorage = (e: StorageEvent) => {
      if (e.key === SESSION_KEY) emit();
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  },

  async signUp(name: string, email: string, password: string): Promise<AuthResult> {
    if (FIREBASE_ENABLED && auth) {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(cred.user, { displayName: name });
      const profile = profileFromFbUser(cred.user);
      profile.name = name;
      await persistProfile(profile);
      return { user: profile };
    }
    // Mock
    const profile: UserProfile = {
      id: 'me',
      name,
      username: email.split('@')[0].toLowerCase(),
      email,
      about: 'Hey there! I am using Blink.',
      photoURL: null,
      status: 'online',
      lastSeen: Date.now(),
      online: true,
      createdAt: Date.now(),
      readReceiptsEnabled: true,
      photoVisibility: 'everyone',
      aboutVisibility: 'everyone',
      lastSeenVisibility: 'everyone',
      onlineStatusVisibility: 'everyone',
      readReceiptsVisibility: 'everyone',
    };
    await persistProfile(profile);
    return mockCreateSession(profile);
  },

  async signIn(email: string, password: string): Promise<AuthResult> {
    if (FIREBASE_ENABLED && auth) {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      let profile = await dataService.users.get(cred.user.uid);
      if (!profile) {
        profile = profileFromFbUser(cred.user);
        await persistProfile(profile);
      }
      return { user: { ...profile, online: true, lastSeen: Date.now() } };
    }
    // Mock: accept any email/password, or log in as the seeded "me" user.
    const profile = mockGetStoredProfile() ?? {
      id: 'me',
      name: email.split('@')[0],
      username: email.split('@')[0].toLowerCase(),
      email,
      about: 'Hey there! I am using Blink.',
      photoURL: null,
      status: 'online' as const,
      lastSeen: Date.now(),
      online: true,
      createdAt: Date.now(),
      readReceiptsEnabled: true,
      photoVisibility: 'everyone',
      aboutVisibility: 'everyone',
      lastSeenVisibility: 'everyone',
      onlineStatusVisibility: 'everyone',
      readReceiptsVisibility: 'everyone',
    };
    await persistProfile(profile);
    return mockCreateSession(profile);
  },

  async signInWithGoogle(): Promise<AuthResult> {
    if (FIREBASE_ENABLED && auth) {
      const provider = new GoogleAuthProvider();
      const cred = await signInWithPopup(auth, provider);
      let profile = await dataService.users.get(cred.user.uid);
      if (!profile) {
        profile = profileFromFbUser(cred.user);
        await persistProfile(profile);
      }
      return { user: { ...profile, online: true, lastSeen: Date.now() } };
    }
    // Mock Google sign-in -> create a guest "Google" user
    const profile: UserProfile = {
      id: 'me',
      name: 'Jordan Lee',
      username: 'jordan',
      email: 'jordan@gmail.com',
      about: 'Hey there! I am using Blink.',
      photoURL: 'https://images.pexels.com/photos/1043471/pexels-photo-1043471.jpeg?auto=compress&cs=tinysrgb&w=200&h=200&fit=crop',
      status: 'online',
      lastSeen: Date.now(),
      online: true,
      createdAt: Date.now(),
      readReceiptsEnabled: true,
      photoVisibility: 'everyone',
      aboutVisibility: 'everyone',
      lastSeenVisibility: 'everyone',
      onlineStatusVisibility: 'everyone',
      readReceiptsVisibility: 'everyone',
    };
    await persistProfile(profile);
    return mockCreateSession(profile);
  },

  async signOut(): Promise<void> {
    if (FIREBASE_ENABLED && auth) {
      await fbSignOut(auth);
      return;
    }
    mockSession.clear();
    localStorage.removeItem(SESSION_KEY);
    window.dispatchEvent(new StorageEvent('storage', { key: SESSION_KEY }));
  },

  async sendPasswordReset(email: string): Promise<void> {
    if (FIREBASE_ENABLED && auth) {
      await sendPasswordResetEmail(auth, email);
      return;
    }
    // Mock: pretend to send
    await new Promise((r) => setTimeout(r, 600));
  },

  async sendEmailVerification(): Promise<void> {
    if (FIREBASE_ENABLED && auth && auth.currentUser) {
      await fbSendEmailVerification(auth.currentUser);
      return;
    }
    await new Promise((r) => setTimeout(r, 400));
  },

  async updateProfile(user: UserProfile): Promise<UserProfile> {
    if (FIREBASE_ENABLED && auth && auth.currentUser) {
      await updateProfile(auth.currentUser, {
        displayName: user.name,
        photoURL: user.photoURL,
      });
    }
    await dataService.users.upsert(user);
    localStorage.setItem(SESSION_KEY, JSON.stringify(user));
    return user;
  },
};
