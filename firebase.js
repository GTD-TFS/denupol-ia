// firebase.js — inicializacion unica Firebase (cliente)
// Importar SIEMPRE desde los HTML con: import { db, auth, serverTimestamp } from "./firebase.js";

import { initializeApp, getApp, getApps } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import { getFirestore, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";

const DEFAULT_FIREBASE_CONFIG = {
  apiKey: "AIzaSyDUG_T31JEWDK9x_apUZVHwriWnjurNrms",
  authDomain: "denupol.firebaseapp.com",
  projectId: "denupol",
  storageBucket: "denupol.firebasestorage.app",
  messagingSenderId: "691472437659",
  appId: "1:691472437659:web:2cdd59082976841d7d513e"
};

function normalizeConfig(raw) {
  if (!raw || typeof raw !== "object") return null;
  const cfg = {
    apiKey: String(raw.apiKey || "").trim(),
    authDomain: String(raw.authDomain || "").trim(),
    projectId: String(raw.projectId || "").trim(),
    storageBucket: String(raw.storageBucket || "").trim(),
    messagingSenderId: String(raw.messagingSenderId || "").trim(),
    appId: String(raw.appId || "").trim()
  };
  if (!cfg.apiKey || !cfg.authDomain || !cfg.projectId || !cfg.appId) return null;
  return cfg;
}

function loadRuntimeConfig() {
  // 1) Inyectado manualmente en window.__ODAC_FIREBASE_CONFIG__
  try {
    const fromWindow = normalizeConfig(globalThis.__ODAC_FIREBASE_CONFIG__);
    if (fromWindow) return fromWindow;
  } catch (_) {}

  // 2) Guardado en localStorage por firebase_setup.html
  try {
    const raw = localStorage.getItem("odac_firebase_config");
    if (raw) {
      const parsed = JSON.parse(raw);
      const fromLs = normalizeConfig(parsed);
      if (fromLs) return fromLs;
    }
  } catch (_) {}

  // 3) Fallback actual (denupol)
  return DEFAULT_FIREBASE_CONFIG;
}

export const firebaseConfig = loadRuntimeConfig();

// App NOMBRADA (evita colisiones entre proyectos en la misma pagina)
const APP_NAME = "odac-" + String(firebaseConfig.projectId || "default").toLowerCase();
export const app = getApps().some(a => a.name === APP_NAME)
  ? getApp(APP_NAME)
  : initializeApp(firebaseConfig, APP_NAME);

export const auth = getAuth(app);
export const db = getFirestore(app);

// Re-export directo
export { serverTimestamp };
