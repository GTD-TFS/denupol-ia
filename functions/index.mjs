import express from "express";
import admin from "firebase-admin";
import { onRequest } from "firebase-functions/v2/https";
import {
  startSessionCore,
  messageSessionCore,
  finalizeSessionCore,
  hydrateSession,
  getSessionSnapshot
} from "../ai-local/server.mjs";

if (!admin.apps.length) admin.initializeApp();

const db = admin.firestore();
const SESSION_TTL_MS = 30 * 60 * 1000;
const SESSION_COLLECTION = "aiSessions";
const api = express();

api.use(express.json({ limit: "2mb" }));

function tsToMs(value) {
  if (!value) return 0;
  if (typeof value.toMillis === "function") return value.toMillis();
  if (typeof value?._seconds === "number") return (value._seconds * 1000) + Math.floor((value._nanoseconds || 0) / 1e6);
  const parsed = new Date(value).getTime();
  return Number.isFinite(parsed) ? parsed : 0;
}

function isExpired(value) {
  const ms = tsToMs(value);
  return ms > 0 && Date.now() >= ms;
}

async function validateTokenSession(token) {
  const clean = String(token || "").trim();
  if (!clean) {
    const err = new Error("token required");
    err.status = 400;
    throw err;
  }

  const snap = await db.collection("tokenSessions").doc(clean).get();
  if (!snap.exists) {
    const err = new Error("token not found");
    err.status = 403;
    throw err;
  }

  const data = snap.data() || {};
  if (isExpired(data.expiresAt)) {
    const err = new Error("token expired");
    err.status = 403;
    throw err;
  }

  return { token: clean, data };
}

async function loadAiSession(sessionId, token) {
  const cleanId = String(sessionId || "").trim();
  if (!cleanId) {
    const err = new Error("sessionId required");
    err.status = 400;
    throw err;
  }

  const snap = await db.collection(SESSION_COLLECTION).doc(cleanId).get();
  if (!snap.exists) {
    const err = new Error("session not found");
    err.status = 404;
    throw err;
  }

  const data = snap.data() || {};
  if (String(data.token || "").trim() !== String(token || "").trim()) {
    const err = new Error("token mismatch");
    err.status = 403;
    throw err;
  }

  if (isExpired(data.expiresAt)) {
    const err = new Error("session expired");
    err.status = 410;
    throw err;
  }

  return { ref: snap.ref, data };
}

async function persistSessionSnapshot(sessionId, base = {}) {
  const snapshot = getSessionSnapshot(sessionId) || {};
  const expiresAt = admin.firestore.Timestamp.fromMillis(Date.now() + SESSION_TTL_MS);
  await db.collection(SESSION_COLLECTION).doc(sessionId).set({
    ...snapshot,
    ...base,
    sessionId,
    expiresAt,
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  }, { merge: true });
}

function route(path, handler) {
  api.post([path, `/api${path}`], async (req, res) => {
    try {
      await handler(req, res);
    } catch (err) {
      const status = Number(err?.status || 500);
      res.status(status).json({ error: String(err?.message || err) });
    }
  });
}

api.get(["/health", "/api/health"], (_req, res) => {
  res.json({ ok: true, provider: process.env.AI_PROVIDER || "openai" });
});

route("/ai/session/start", async (req, res) => {
  const body = req.body || {};
  const { token } = await validateTokenSession(body.token);
  const result = await startSessionCore(body);
  await persistSessionSnapshot(result.sessionId, {
    token,
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  });
  res.json(result);
});

route("/ai/session/message", async (req, res) => {
  const body = req.body || {};
  const { token } = await validateTokenSession(body.token);
  const loaded = await loadAiSession(body.sessionId, token);
  hydrateSession(body.sessionId, loaded.data);
  const result = await messageSessionCore(body);
  await persistSessionSnapshot(body.sessionId, { token });
  res.json(result);
});

route("/ai/session/finalize", async (req, res) => {
  const body = req.body || {};
  const { token } = await validateTokenSession(body.token);
  const loaded = await loadAiSession(body.sessionId, token);
  hydrateSession(body.sessionId, loaded.data);
  const result = await finalizeSessionCore(body);
  await persistSessionSnapshot(body.sessionId, {
    token,
    status: "FINALIZED",
    finalizedAt: admin.firestore.FieldValue.serverTimestamp()
  });
  res.json(result);
});

export const aiApi = onRequest({
  region: "europe-west1",
  timeoutSeconds: 120,
  memory: "512MiB",
  secrets: ["OPENAI_API_KEY"]
}, api);

