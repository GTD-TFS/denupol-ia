import { createAiAssistant } from "./ai_assistant.js";
import { loadAiRuntimeConfig } from "./denupol_ai_runtime.js";

function createDisabledFlow(runtime) {
  return {
    runtime,
    updateContext: () => {},
    async resolveFinalDocument(baseDocText) {
      return {
        declarationText: "",
        docBase: String(baseDocText || "").trim(),
        docAi: "",
        docSource: "manual",
        aiStatus: runtime.mode === "off" ? "disabled" : "skipped",
        aiLang: "",
        aiTurns: [],
        sessionId: ""
      };
    }
  };
}

export function setupPredenunciaAi(opts = {}) {
  const runtime = loadAiRuntimeConfig();
  const mountEl = opts.mountEl || null;

  if (!runtime.enabled || !mountEl) {
    return createDisabledFlow(runtime);
  }

  const assistant = createAiAssistant({
    mountEl,
    token: opts.token || "",
    getPayload: opts.getPayload,
    getCrimeType: opts.getCrimeType,
    setStatus: opts.setStatus,
    t: opts.t,
    apiBase: runtime.apiBase
  });

  return {
    runtime,
    updateContext(payload) {
      assistant.updateContext(payload || {});
    },
    async resolveFinalDocument(baseDocText) {
      const base = String(baseDocText || "").trim();
      let draft = "";
      let snapshot = assistant.getSubmissionData();

      if (runtime.mode !== "off") {
        try {
          draft = String(snapshot.draft || "").trim();
          if (!draft) {
            draft = String(await assistant.ensureDraft() || "").trim();
            snapshot = assistant.getSubmissionData();
          }
        } catch (err) {
          if (runtime.mode === "required") throw err;
          draft = "";
          snapshot = assistant.getSubmissionData();
        }
      }

      if (!draft) {
        return {
          declarationText: "",
          docBase: base,
          docAi: "",
          docSource: "manual",
          aiStatus: runtime.mode === "required" ? "error" : "skipped",
          aiLang: "",
          aiTurns: snapshot.aiTurns || [],
          sessionId: snapshot.sessionId || ""
        };
      }

      return {
        declarationText: draft,
        docBase: base,
        docAi: draft,
        docSource: "ai",
        aiStatus: "completed",
        aiLang: String(document.documentElement.lang || "es").toLowerCase(),
        aiTurns: snapshot.aiTurns || [],
        sessionId: snapshot.sessionId || ""
      };
    }
  };
}
