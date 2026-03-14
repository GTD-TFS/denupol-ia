export function createAiAssistant(opts = {}) {
  const mountEl = opts.mountEl || null;
  const token = String(opts.token || "").trim();
  const getPayload = typeof opts.getPayload === "function" ? opts.getPayload : () => ({});
  const getCrimeType = typeof opts.getCrimeType === "function" ? opts.getCrimeType : () => "";
  const setStatus = typeof opts.setStatus === "function" ? opts.setStatus : () => {};
  const t = typeof opts.t === "function" ? opts.t : (s) => s;
  const apiBase = String(opts.apiBase || "/api").trim().replace(/\/+$/, "");

  const state = {
    visible: false,
    loading: false,
    sessionId: "",
    question: "",
    remainingQuestions: 0,
    draft: "",
    fingerprint: "",
    hechosAi: null,
    aiTurns: []
  };

  if (!mountEl) {
    return {
      updateContext: () => {},
      getSubmissionData: () => ({ draft: "", sessionId: "", hechosAi: null, aiTurns: [] }),
      ensureDraft: async () => ""
    };
  }

  mountEl.innerHTML = `
    <div id="aiAssistBox" style="display:none;margin-top:10px;padding:12px;border:1px solid rgba(255,255,255,.12);border-radius:12px;background:rgba(255,255,255,.04)">
      <div style="font-weight:700;margin-bottom:8px">${t("Asistente IA de completitud")}</div>
      <div id="aiAssistHint" class="muted" style="margin-bottom:8px">${t("La IA hará preguntas cortas para completar el relato antes de enviar.")}</div>
      <div id="aiQuestion" style="white-space:pre-wrap;margin-bottom:8px"></div>
      <textarea id="aiAnswer" rows="3" placeholder="${t("Escriba su respuesta aquí...")}" style="width:100%;margin-bottom:8px"></textarea>
      <div class="row" style="justify-content:flex-end;gap:8px;margin-top:10px">
        <button class="btn tiny" id="btnAiSend" type="button">${t("Enviar respuesta")}</button>
      </div>
      <div id="aiState" class="muted" style="margin-top:8px"></div>
    </div>
  `;

  const box = mountEl.querySelector("#aiAssistBox");
  const qEl = mountEl.querySelector("#aiQuestion");
  const aEl = mountEl.querySelector("#aiAnswer");
  const stEl = mountEl.querySelector("#aiState");
  const btnSend = mountEl.querySelector("#btnAiSend");

  function setUiState(msg = "") {
    if (!stEl) return;
    stEl.textContent = msg;
  }

  function setQuestion(text) {
    state.question = String(text || "").trim();
    if (qEl) qEl.textContent = state.question ? `${t("Pregunta IA")}: ${state.question}` : "";
  }

  function setLoading(on, msg = "") {
    state.loading = !!on;
    if (btnSend) btnSend.disabled = state.loading;
    if (msg) setUiState(msg);
  }

  function computeFingerprint() {
    try {
      const p = getPayload() || {};
      return JSON.stringify((p && p.hechos) || {});
    } catch (_) {
      return "";
    }
  }

  function resetSession(msg = "") {
    state.sessionId = "";
    state.question = "";
    state.remainingQuestions = 0;
    state.draft = "";
    state.hechosAi = null;
    state.aiTurns = [];
    if (aEl) aEl.value = "";
    setQuestion("");
    setUiState(msg);
  }

  async function postJson(path, body) {
    const r = await fetch(`${apiBase}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body || {})
    });
    const raw = await r.text();
    let data = {};
    try { data = raw ? JSON.parse(raw) : {}; } catch (_) {}
    if (!r.ok) {
      const errText = (data && data.error) ? String(data.error) : `HTTP ${r.status}`;
      throw new Error(errText);
    }
    return data;
  }

  async function startSession(auto = false) {
    const payload = getPayload() || {};
    const hechos = (payload && payload.hechos) || {};
    const nextFingerprint = JSON.stringify(hechos || {});
    if (!nextFingerprint || nextFingerprint === "{}") {
      setUiState(t("Complete primero los hechos para iniciar IA."));
      return;
    }
    setLoading(true, auto ? t("Iniciando IA...") : t("Iniciando IA..."));
    try {
      const data = await postJson("/ai/session/start", {
        token,
        crimeType: getCrimeType() || "",
        lang: (document.documentElement.lang || "es").toLowerCase(),
        fixedAnswers: hechos
      });
      state.sessionId = String(data.sessionId || "");
      state.fingerprint = nextFingerprint;
      state.remainingQuestions = Number(data.remainingQuestions || 0);
      setQuestion(data.nextQuestion || "");
      if (data.status === "ASK") {
        setUiState(`${t("Repreguntas restantes")}: ${state.remainingQuestions}`);
      } else {
        state.remainingQuestions = 0;
        setUiState(t("IA lista para redactar. Pulse \"FINALIZAR Y ENVIAR\"."));
      }
      setStatus("");
    } catch (err) {
      setUiState(`${t("Error IA")}: ${String(err.message || err)}`);
      if (!auto) setStatus(`${t("Error IA")}: ${String(err.message || err)}`);
    } finally {
      setLoading(false);
    }
  }

  async function sendAnswer() {
    if (!state.sessionId) {
      await startSession(false);
      return;
    }
    const userAnswer = (aEl && aEl.value ? aEl.value : "").trim();
    if (!userAnswer) {
      setUiState(t("Escriba una respuesta antes de enviar."));
      return;
    }
    setLoading(true, t("Enviando respuesta..."));
    try {
      const data = await postJson("/ai/session/message", {
        sessionId: state.sessionId,
        token,
        userAnswer
      });
      state.aiTurns.push({ userAnswer, ts: new Date().toISOString() });
      if (aEl) aEl.value = "";
      state.remainingQuestions = Number(data.remainingQuestions || 0);
      if (data.status === "ASK") {
        setQuestion(data.nextQuestion || "");
        setUiState(`${t("Repreguntas restantes")}: ${state.remainingQuestions}`);
      } else {
        state.remainingQuestions = 0;
        setQuestion("");
        setUiState(t("IA lista para redactar. Pulse \"FINALIZAR Y ENVIAR\"."));
      }
      setStatus("");
    } catch (err) {
      const txt = `${t("Error IA")}: ${String(err.message || err)}`;
      setUiState(txt);
      setStatus(txt);
    } finally {
      setLoading(false);
    }
  }

  async function buildDraft() {
    if (!state.sessionId) {
      setUiState(t("Primero inicie la sesión IA."));
      return;
    }
    setLoading(true, t("Generando denuncia final..."));
    try {
      const data = await postJson("/ai/session/finalize", {
        sessionId: state.sessionId,
        token
      });
      state.draft = String(data.declaracionFinal || "").trim();
      state.hechosAi = data.hechos_ai || null;
      if (!state.draft) throw new Error(t("La IA devolvió un texto vacío."));
      setUiState(t("Denuncia generada. Ya puede pulsar \"FINALIZAR Y ENVIAR\"."));
      setStatus("");
    } catch (err) {
      const txt = `${t("Error IA")}: ${String(err.message || err)}`;
      setUiState(txt);
      setStatus(txt);
    } finally {
      setLoading(false);
    }
  }

  btnSend?.addEventListener("click", () => { void sendAnswer(); });

  return {
    updateContext({ isFinalStep }) {
      state.visible = !!isFinalStep;
      if (box) box.style.display = state.visible ? "block" : "none";
      if (!state.visible) return;

      const fp = computeFingerprint();
      if (state.fingerprint && fp && fp !== state.fingerprint) {
        resetSession(t("Se modificaron los hechos. Reinicie la IA para regenerar la denuncia."));
      }

      if (!state.sessionId && !state.loading) {
        void startSession(true);
      }
    },
    getSubmissionData() {
      const fp = computeFingerprint();
      if (!state.draft) return { draft: "", sessionId: state.sessionId, hechosAi: state.hechosAi, aiTurns: state.aiTurns };
      if (!state.fingerprint || !fp || fp !== state.fingerprint) {
        return { draft: "", sessionId: state.sessionId, hechosAi: state.hechosAi, aiTurns: state.aiTurns };
      }
      return { draft: state.draft, sessionId: state.sessionId, hechosAi: state.hechosAi, aiTurns: state.aiTurns };
    },
    async ensureDraft() {
      const fp = computeFingerprint();
      if (state.draft && state.fingerprint && fp && fp === state.fingerprint) return state.draft;
      if (!state.sessionId) await startSession(true);
      await buildDraft();
      return state.draft;
    }
  };
}
