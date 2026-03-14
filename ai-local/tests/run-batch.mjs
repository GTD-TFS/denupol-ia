import fs from "node:fs";
import path from "node:path";

const API_BASE = process.env.AI_API_BASE || "http://127.0.0.1:8787";
const COOLDOWN_MS = Number(process.env.EVAL_COOLDOWN_MS || 7000);
const CASE_LIMIT = Number(process.env.EVAL_CASE_LIMIT || 1);
const EVAL_MODE = (process.env.EVAL_MODE || "questions").toLowerCase(); // questions | full
const CASES_PATH = process.env.EVAL_CASES || path.join(process.cwd(), "tests", "cases.json");
const OUT_DIR = path.join(process.cwd(), "tests", "out");
const OUT_FILE = path.join(OUT_DIR, "latest.json");

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function post(pathname, body) {
  const r = await fetch(`${API_BASE}${pathname}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body || {})
  });
  const raw = await r.text();
  let data = {};
  try { data = raw ? JSON.parse(raw) : {}; } catch (_) {}
  if (!r.ok) return { ok: false, status: r.status, data, raw };
  return { ok: true, status: r.status, data, raw };
}

function evaluateCaseTrace(trace) {
  const issues = [];
  const questions = trace.turns.map((t) => String(t.nextQuestion || ""));
  const finalText = String(trace.final?.declaracionFinal || "");

  if (questions.some((q) => /motivaci[oó]n del denunciante/i.test(q))) {
    issues.push("Pregunta improcedente: motivación del denunciante.");
  }
  if (questions.some((q) => /seg[uú]n consta en las im[aá]genes/i.test(q))) {
    issues.push("Pregunta improcedente: presupone evidencia no confirmada.");
  }
  if (new Set(questions.filter(Boolean)).size !== questions.filter(Boolean).length) {
    issues.push("Hay preguntas repetidas.");
  }
  if (/\[estancia_eventual\]|\[fecha_vuelta\]/i.test(finalText)) {
    issues.push("Salida final contiene placeholders sin resolver.");
  }
  if (/\n\s*\n\s*\n/.test(finalText)) {
    issues.push("Salida final con saltos excesivos.");
  }
  if (finalText && !/^– /m.test(finalText)) {
    issues.push("Formato final no empieza párrafos con '– '.");
  }
  return { passed: issues.length === 0, issues };
}

async function runCase(c) {
  const trace = { id: c.id, turns: [] };
  const start = await post("/ai/session/start", {
    token: `BATCH-${Date.now()}`,
    crimeType: c.crimeType,
    lang: c.lang || "es",
    fixedAnswers: c.fixedAnswers || {}
  });
  trace.start = start.data || { error: start.raw };
  if (!start.ok) return { trace, result: { passed: false, issues: [`start falló (${start.status})`] } };

  let sessionId = start.data.sessionId;
  let current = start.data;
  const msgs = Array.isArray(c.messages) ? c.messages : [];
  let i = 0;

  const fallbackByGap = {
    cronologia: "No recuerda más precisión temporal.",
    lugar: "No puede concretar más el lugar.",
    mecanica: "No dispone de más detalle sobre la mecánica.",
    reaccion: "No consta reacción adicional.",
    identificacion: "No hay más datos para identificar al autor.",
    pruebas: "No constan más medios de prueba.",
    posterior: "No consta actuación posterior adicional.",
    motivacional: "Desconoce completamente el motivo."
  };

  while (current && current.status === "ASK" && i < 6) {
    const gap = String(current.targetGap || "");
    const scripted = i < msgs.length ? msgs[i] : "";
    const answer = scripted || fallbackByGap[gap] || "No consta más información.";
    await sleep(COOLDOWN_MS);
    const m = await post("/ai/session/message", {
      sessionId,
      userAnswer: answer
    });
    trace.turns.push({
      input: answer,
      nextQuestion: current.nextQuestion || "",
      response: m.data || { error: m.raw }
    });
    if (!m.ok) break;
    current = m.data;
    i += 1;
  }

  let fin = { ok: true, status: 200, data: { skipped: true } };
  if (EVAL_MODE === "full") {
    await sleep(COOLDOWN_MS);
    fin = await post("/ai/session/finalize", { sessionId });
    trace.final = fin.data || { error: fin.raw };
  } else {
    trace.final = { skipped: true, reason: "EVAL_MODE=questions" };
  }

  const result = evaluateCaseTrace(trace);
  if (!fin.ok) {
    result.passed = false;
    result.issues.push(`finalize falló (${fin.status})`);
  }
  return { trace, result };
}

async function main() {
  const cases = JSON.parse(fs.readFileSync(CASES_PATH, "utf8"));
  const startedAt = new Date().toISOString();
  const report = {
    startedAt,
    apiBase: API_BASE,
    evalMode: EVAL_MODE,
    cooldownMs: COOLDOWN_MS,
    summary: { total: 0, passed: 0, failed: 0 },
    results: []
  };

  for (const c of cases.slice(0, CASE_LIMIT > 0 ? CASE_LIMIT : cases.length)) {
    // Secuencial para no calentar el equipo.
    const out = await runCase(c);
    report.results.push({ id: c.id, ...out.result, trace: out.trace });
    report.summary.total += 1;
    if (out.result.passed) report.summary.passed += 1;
    else report.summary.failed += 1;
    await sleep(COOLDOWN_MS);
  }

  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(OUT_FILE, JSON.stringify(report, null, 2));

  console.log(`Evaluación completada: ${report.summary.passed}/${report.summary.total} OK`);
  console.log(`Reporte: ${OUT_FILE}`);
  if (report.summary.failed > 0) process.exitCode = 1;
}

main().catch((err) => {
  console.error("ERROR eval:batch:", err?.message || err);
  process.exit(1);
});
