const DEFAULT_AI_RUNTIME = {
  enabled: true,
  mode: "optional",
  apiBase: "/api",
  maxQuestions: 6
};

function normalizeMode(value) {
  const mode = String(value || "").trim().toLowerCase();
  if (mode === "required") return "required";
  if (mode === "optional") return "optional";
  return "off";
}

function normalizeRuntime(raw) {
  if (!raw || typeof raw !== "object") return null;
  const enabled = !!raw.enabled && normalizeMode(raw.mode || "optional") !== "off";
  const mode = enabled ? normalizeMode(raw.mode || "optional") : "off";
  const apiBase = String(raw.apiBase || DEFAULT_AI_RUNTIME.apiBase).trim().replace(/\/+$/, "") || DEFAULT_AI_RUNTIME.apiBase;
  const maxQuestions = Math.max(1, Number(raw.maxQuestions || DEFAULT_AI_RUNTIME.maxQuestions) || DEFAULT_AI_RUNTIME.maxQuestions);
  return { enabled, mode, apiBase, maxQuestions };
}

export function loadAiRuntimeConfig() {
  try {
    const fromWindow = normalizeRuntime(globalThis.__DENU_AI_CONFIG__);
    if (fromWindow) return fromWindow;
  } catch (_) {}

  return { ...DEFAULT_AI_RUNTIME };
}
