/**
 * Firebase initialization for AquaSync WAE.
 * Uses a demo config — all Firebase calls are wrapped in try/catch.
 * If initialization or auth fails, we fall back to local UUID for userId.
 *
 * Firebase Security Model:
 * - Anonymous auth gives each device a unique UID
 * - Firestore path: /artifacts/{APP_ID}/users/{userId}/dispenser_logs
 * - Security rules should restrict read/write to auth.uid === userId
 */
import { type FirebaseApp, getApps, initializeApp } from "firebase/app";
import {
  type Auth,
  type User,
  getAuth,
  signInAnonymously,
} from "firebase/auth";
import {
  type Firestore,
  addDoc,
  collection,
  getDocs,
  getFirestore,
  orderBy,
  query,
} from "firebase/firestore";
import type { DispenseLog } from "../types/dispenser";

const firebaseConfig = {
  apiKey: "demo-key",
  authDomain: "demo.firebaseapp.com",
  projectId: "demo-project",
  storageBucket: "demo-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456",
};

export const APP_ID = "aquasync-wae";

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;

try {
  // Avoid re-initializing if already initialized (HMR safe)
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
  auth = getAuth(app);
  db = getFirestore(app);
} catch (e) {
  // Firebase init failed — will use local state only
  console.warn("[Firebase] Init failed, using local fallback.", e);
}

/**
 * Attempt anonymous sign-in.
 * Returns the Firebase User or null on failure.
 */
export async function signInAnon(): Promise<User | null> {
  if (!auth) return null;
  try {
    const cred = await signInAnonymously(auth);
    return cred.user;
  } catch (e) {
    console.warn("[Firebase] Anonymous auth failed.", e);
    return null;
  }
}

/**
 * Log a dispense event to Firestore.
 * Path: /artifacts/{APP_ID}/users/{userId}/dispenser_logs
 */
export async function logDispenseEvent(
  userId: string,
  log: Omit<DispenseLog, "id">,
): Promise<void> {
  if (!db) return;
  try {
    const path = `artifacts/${APP_ID}/users/${userId}/dispenser_logs`;
    await addDoc(collection(db, path), log);
  } catch (e) {
    // Silently fail — demo config won't have real Firestore access
    console.warn("[Firebase] Firestore write failed (demo mode).", e);
  }
}

/**
 * Fetch dispense history from Firestore.
 * Returns empty array if fails.
 */
export async function fetchDispenseLogs(
  userId: string,
): Promise<DispenseLog[]> {
  if (!db) return [];
  try {
    const path = `artifacts/${APP_ID}/users/${userId}/dispenser_logs`;
    const q = query(collection(db, path), orderBy("timestamp", "desc"));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as DispenseLog);
  } catch (e) {
    console.warn("[Firebase] Firestore read failed (demo mode).", e);
    return [];
  }
}

export { app, auth, db };
