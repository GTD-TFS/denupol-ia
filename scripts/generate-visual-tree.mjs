import fs from "node:fs";
import vm from "node:vm";

const sourceFile = "/Users/javierbejarnavarrete/Desktop/SUPER APPS/DENUPOL codex/question_es.js";
const outputFile = "/Users/javierbejarnavarrete/Desktop/SUPER APPS/DENUPOL codex/arbol_denuncia_visual.html";

function loadQuestionData(file) {
  let code = fs.readFileSync(file, "utf8");
  code = code.replace(/^export const EXPORT_KEY_MAP =/m, "const EXPORT_KEY_MAP =");
  code = code.replace(/^export \{ GLOBAL_ROUTES, QUESTION_SETS \};\s*$/m, "");
  code += "\nwindow.__GLOBAL_ROUTES = GLOBAL_ROUTES; window.__QUESTION_SETS = QUESTION_SETS;";
  const sandbox = { window: {} };
  vm.createContext(sandbox);
  vm.runInContext(code, sandbox, { filename: file });
  return {
    routes: sandbox.window.__GLOBAL_ROUTES,
    sets: sandbox.window.__QUESTION_SETS
  };
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function parseClause(src) {
  const conditions = [];
  const eqRe = /st\.([a-zA-Z0-9_]+)\s*===\s*"([^"]+)"/g;
  const neqRe = /st\.([a-zA-Z0-9_]+)\s*!==\s*"([^"]+)"/g;
  let match;
  while ((match = eqRe.exec(src))) {
    conditions.push({ field: match[1], op: "===", value: match[2] });
  }
  while ((match = neqRe.exec(src))) {
    conditions.push({ field: match[1], op: "!==", value: match[2] });
  }
  return conditions;
}

function parseWhen(fn) {
  if (typeof fn !== "function") return [];
  const src = fn
    .toString()
    .replace(/\s+/g, " ")
    .replace(/^\(?\s*\(?[^\)]*\)?\s*=>\s*/, "")
    .trim();

  const body = src
    .replace(/^\{\s*return\s+/, "")
    .replace(/;\s*\}$/, "")
    .replace(/^\((.*)\)$/, "$1");

  return body
    .split(/\s*\|\|\s*/)
    .map((clause) => parseClause(clause))
    .filter((clause) => clause.length);
}

function renderClause(clause) {
  return clause.map((c) => `${c.field} ${c.op === "===" ? "=" : "!="} ${c.value}`).join(" y ");
}

function condText(clauses) {
  if (!clauses.length) return "Siempre visible en este flujo";
  return clauses.map(renderClause).join(" o ");
}

function renderOptions(options) {
  if (!Array.isArray(options) || !options.length) return "";
  return `<div class="options">${options.map((opt) => `<span class="opt">${escapeHtml(opt)}</span>`).join("")}</div>`;
}

function renderItem(item, level = 0) {
  const clauses = parseWhen(item.when);
  const classes = ["step", clauses.length ? "conditional" : "plain", level ? "nested" : ""].filter(Boolean).join(" ");
  const type = item.type || "text";
  const title = item.title || item.key || "(sin titulo)";
  const key = item.key || "(sin key)";
  const options = renderOptions(item.options);
  const conditionBlock = clauses.length
    ? `<div class="when">Si <strong>${escapeHtml(condText(clauses))}</strong></div>`
    : "";

  if (type === "group" && Array.isArray(item.items)) {
    return `
      <div class="${classes}">
        ${conditionBlock}
        <div class="box group">
          <div class="meta"><span class="tag groupTag">group</span><code>${escapeHtml(key)}</code></div>
          <div class="title">${escapeHtml(title)}</div>
          <div class="items">
            ${item.items.map((child) => renderItem(child, level + 1)).join("")}
          </div>
        </div>
      </div>
    `;
  }

  return `
    <div class="${classes}">
      ${conditionBlock}
      <div class="box ${type === "select" ? "select" : "field"}">
        <div class="meta"><span class="tag">${escapeHtml(type)}</span><code>${escapeHtml(key)}</code></div>
        <div class="title">${escapeHtml(title)}</div>
        ${options}
      </div>
    </div>
  `;
}

function renderFlow(flowName, questions) {
  return `
    <details class="flowDetail">
      <summary>${escapeHtml(flowName)}</summary>
      <div class="flowBody">
        <div class="flowPath">
          <div class="entryBadge">flujo final</div>
          <div class="leafName">${escapeHtml(flowName)}</div>
        </div>
        <div class="timeline">
          ${questions.map((q, index) => `
            <div class="line">
              ${index ? '<div class="arrow">↓</div>' : ""}
              ${renderItem(q)}
            </div>
          `).join("")}
        </div>
      </div>
    </details>
  `;
}

function routeCard(label, target, extra = "") {
  return `
    <div class="routeCard">
      <div class="routeChoice">${escapeHtml(label)}</div>
      <div class="routeArrow">→</div>
      <div class="routeTarget">${escapeHtml(target)}</div>
      ${extra}
    </div>
  `;
}

function buildHtml(data) {
  const { routes, sets } = data;

  const entryOptions = (sets.GLOBAL?.[0]?.options || []).map((label) => {
    const target = (routes.ENTRY && routes.ENTRY[label]) || (routes.PAGE2 && routes.PAGE2[label]) || "";
    if (target === "SUSTRACCION_SELECTOR") return routeCard(label, "SUSTRACCION -> selector intermedio");
    if (target === "AGRESION_SELECTOR") return routeCard(label, "AGRESION -> selector intermedio");
    return routeCard(label, target || "SIN RUTA");
  }).join("");

  const sustraccionRoutes = Object.entries(routes.SUSTRACCION_SELECTOR)
    .map(([label, target]) => routeCard(label, target))
    .join("");

  const agresionRoutes = Object.entries(routes.AGRESION_SELECTOR)
    .map(([label, target]) => routeCard(label, target))
    .join("");

  const flowOrder = [
    "EXTRAVIO",
    "HURTO_RVI",
    "PATRIMONIO",
    "ROBO_FUERZA",
    "DANOS",
    "ESTAFA",
    "LESIONES",
    "AGRESION_FAMILIAR_AFECTIVO",
    "AMENAZAS_GLOBAL",
    "ALLANAMIENTO_USURPACION",
    "APROPIACION_INDEBIDA",
    "COACCIONES",
    "CARACTER_SEXUAL",
    "OTROS"
  ];

  const flowsHtml = flowOrder.map((name) => renderFlow(name, sets[name] || [])).join("");

  return `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Arbol Visual de Denuncia</title>
  <style>
    :root{
      --bg:#f3ede4;
      --panel:#fffdf9;
      --ink:#1f2937;
      --muted:#6b7280;
      --line:#d8c8b3;
      --accent:#8a5a2b;
      --soft:#f4e8d9;
      --soft2:#efe4d4;
      --green:#edf5eb;
    }
    *{box-sizing:border-box}
    body{
      margin:0;
      font-family:Georgia, "Times New Roman", serif;
      color:var(--ink);
      background:
        radial-gradient(circle at top left, #fff8ef 0, transparent 24%),
        linear-gradient(180deg, #f9f4ec 0%, var(--bg) 100%);
    }
    .wrap{max-width:1400px;margin:0 auto;padding:28px 18px 56px}
    h1{margin:0 0 8px;font-size:38px;line-height:1.04;color:#3f2a17}
    .intro{margin:0 0 18px;color:var(--muted);font-size:18px}
    .warning{background:#fff7ef;border:1px solid var(--line);border-radius:16px;padding:14px 16px;margin-bottom:18px}
    .warning strong{color:#6c421a}
    .routes, .flows{background:var(--panel);border:1px solid var(--line);border-radius:24px;padding:18px;box-shadow:0 16px 42px rgba(74,44,20,.08)}
    .routes{margin-bottom:22px}
    h2{margin:0 0 14px;font-size:24px;color:#56361b}
    h3{margin:16px 0 10px;font-size:19px;color:#684324}
    .entry{display:flex;align-items:center;gap:12px;padding:12px 14px;border-radius:16px;background:linear-gradient(180deg,#fffaf3,#f8eedf);border:1px solid var(--line);margin-bottom:14px}
    .entry .bubble{padding:6px 10px;border-radius:999px;background:#fff;border:1px solid var(--line);font-weight:700;color:#6d4521}
    .routeGrid{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:12px}
    .routeCard{display:grid;grid-template-columns:1fr auto 1fr;gap:10px;align-items:center;padding:12px 14px;border:1px solid var(--line);border-radius:16px;background:#fff}
    .routeChoice,.routeTarget{padding:10px 12px;border-radius:12px}
    .routeChoice{background:var(--soft);font-weight:700;color:#5f3d1f}
    .routeTarget{background:var(--green);font-weight:700;color:#27452a}
    .routeArrow{font-size:26px;color:var(--accent)}
    details.flowDetail{margin:14px 0;border:1px solid var(--line);border-radius:20px;overflow:hidden;background:#fff}
    details.flowDetail>summary{cursor:pointer;list-style:none;padding:15px 16px;background:linear-gradient(180deg,#fffaf3,#f3e8d8);font-weight:700;color:#4f3318}
    details.flowDetail>summary::-webkit-details-marker{display:none}
    .flowBody{padding:16px}
    .flowPath{display:flex;align-items:center;gap:10px;margin-bottom:14px}
    .entryBadge{padding:6px 10px;border-radius:999px;background:#fff;border:1px solid var(--line);font-size:13px;font-weight:700;color:#75512d;text-transform:uppercase}
    .leafName{padding:8px 12px;border-radius:12px;background:var(--green);border:1px solid #cfe1cd;font-weight:700}
    .timeline{display:grid;gap:0}
    .line{display:grid;gap:8px}
    .arrow{margin-left:18px;color:var(--accent);font-size:24px;line-height:1}
    .step{margin-left:8px}
    .step.nested{margin-left:0}
    .when{margin:0 0 8px 14px;padding:10px 12px;border-radius:12px;border:1px dashed var(--line);background:#fbf6ee;color:#6b4a2b;font-size:14px}
    .box{border:1px solid var(--line);border-radius:16px;padding:12px 14px;background:#fff}
    .box.select{background:#fffdfa}
    .box.group{background:#fcfaf6}
    .meta{display:flex;align-items:center;gap:8px;margin-bottom:8px;flex-wrap:wrap}
    .tag{display:inline-flex;align-items:center;justify-content:center;padding:4px 8px;border-radius:999px;background:var(--soft2);font-size:12px;font-weight:700;color:#734d26;text-transform:uppercase}
    .groupTag{background:#e8efe2;color:#3b5a35}
    code{padding:2px 6px;border-radius:8px;background:#f1e5d5;color:#5b391d;font-size:13px}
    .title{font-weight:700;color:#2b3440}
    .options{display:flex;flex-wrap:wrap;gap:8px;margin-top:10px}
    .opt{display:inline-flex;padding:6px 9px;border-radius:999px;background:#f7efe4;border:1px solid #ead8c2;color:#684423;font-size:13px}
    .items{display:grid;gap:10px;margin-top:12px;padding-top:12px;border-top:1px dashed #ddcfbc}
    @media (max-width: 800px){
      .wrap{padding:18px 10px 42px}
      h1{font-size:30px}
      .routeGrid{grid-template-columns:1fr}
      .routeCard{grid-template-columns:1fr}
      .routeArrow{text-align:center}
    }
  </style>
</head>
<body>
  <div class="wrap">
    <h1>Arbol Visual de Denuncia</h1>
    <p class="intro">Archivo generado directamente desde <code>question_es.js</code>. Muestra opciones reales de cada <code>select</code> y condiciones <code>when</code> del código.</p>
    <div class="warning"><strong>Lectura:</strong> arriba ves las ramas de entrada. Abajo, cada flujo final tiene su secuencia real de pasos. Cuando un paso depende de otro, aparece en una caja "Si ...".</div>

    <section class="routes">
      <h2>Entrada principal</h2>
      <div class="entry">
        <div class="bubble">Inicio</div>
        <div><strong>CARACTERÍSTICAS DEL HECHO</strong></div>
      </div>

      <h3>Opciones de la primera pantalla</h3>
      <div class="routeGrid">${entryOptions}</div>

      <h3>SUSTRACCIÓN → selector intermedio</h3>
      <div class="routeGrid">${sustraccionRoutes}</div>

      <h3>AGRESIÓN → selector intermedio</h3>
      <div class="routeGrid">${agresionRoutes}</div>
    </section>

    <section class="flows">
      <h2>Flujos finales</h2>
      ${flowsHtml}
    </section>
  </div>
</body>
</html>`;
}

const html = buildHtml(loadQuestionData(sourceFile));
fs.writeFileSync(outputFile, html);
console.log(`Generated ${outputFile}`);
