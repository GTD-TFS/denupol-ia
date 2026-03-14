import { randomUUID } from "node:crypto";
import OpenAI from "openai";


const PORT = Number(process.env.PORT || 8787);
const AI_PROVIDER = String(process.env.AI_PROVIDER || (process.env.OPENAI_API_KEY ? "openai" : "ollama")).toLowerCase();
const OLLAMA_URL = process.env.OLLAMA_URL || "http://127.0.0.1:11434";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "qwen2.5:14b-instruct";
const OLLAMA_KEEP_ALIVE = process.env.OLLAMA_KEEP_ALIVE || "30s";
const OLLAMA_NUM_THREAD = Number(process.env.OLLAMA_NUM_THREAD || 0);
const OLLAMA_NUM_CTX = Number(process.env.OLLAMA_NUM_CTX || 0);
const OLLAMA_TEMPERATURE = Number(process.env.OLLAMA_TEMPERATURE || 0.2);
const OLLAMA_NUM_PREDICT = Number(process.env.OLLAMA_NUM_PREDICT || 0);
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4.1-mini";
const QUESTION_MODE = String(process.env.QUESTION_MODE || "model").toLowerCase();
const MAX_TURNS = 6;
const NO_INFO_RE = /\b(no\s+sé|no\s+se|no\s+recuerdo|no\s+consta|desconozco|no\s+dispongo|no\s+quiero|no\s+hay\s+m[aá]s\s+datos|sin\s+m[aá]s\s+datos)\b/i;
const USE_MOCK_MODEL = /^mock[-_:]/i.test(OLLAMA_MODEL) || String(process.env.AI_PROVIDER || "").toLowerCase() === "mock";
const openai = AI_PROVIDER === "openai" ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;

const sessions = new Map();

const GENERIC_PLACE_RE = /\b(en la calle|mi casa|por la zona|zona de bares|cerca del trabajo|domicilio|zona)\b/i;

const KEY_ALIAS = {
  vg_que_ocurrio_tras_intento: "vg_resultado_tras_intento_separacion_victima",
  vg_consumo_detalle: "vg_consumo_autor_detalle_sustancias_frecuencia",
  vg_comienzo_violencia: "vg_inicio_violencia_en_relacion",
  vg_dependencia_economica: "vg_victima_depende_economicamente_del_autor",
  vg_entorno_conoce_situacion: "vg_entorno_victima_conoce_situacion",
  vg_miedo_real_vida: "vg_victima_teme_por_su_vida",
  vg_puede_empeorar: "vg_victima_percibe_riesgo_empeoramiento",
  vd_en_domicilio_familiar: "vd_hechos_en_domicilio_familiar",
  vd_anteriores_similares: "vd_hechos_previos_similares",
  declarante_condicion: "declarante_rol_en_hechos",
  autor_datos: "autor_identificacion_datos_aportados",
  autor_interaccion: "autor_interaccion_con_victima_testigo",
  hecho_conocimiento: "declarante_como_conocio_el_hecho",
  hecho_resumen: "hecho_resumen_narrativo"
};

const PROMPT_BASE = `
Tu función es asistir en la elaboración de denuncias policiales españolas con dos modos:

MODO 1: COMPLETITUD (repregunta)
MODO 2: REDACCIÓN FINAL (denuncia lista para atestado)

Debes basarte solo en la información facilitada por el agente (texto libre o datos estructurados).
No debes mencionar claves, formularios, sistemas, apps, IA ni procesos internos.




=======
OBJETIVO
=======

1) Interpretar correctamente la información recibida.
2) Detectar carencias para:
- esclarecimiento del hecho
- identificación útil del autor
- trazabilidad probatoria
3) Formular preguntas cuando falten datos críticos.
4) Cuando exista suficiencia, redactar denuncia final completa.

Integra toda la información disponible y redacta directamente (sin transformaciones intermedias).

================
ESTILO OBLIGATORIO
================

• Lenguaje formal, objetivo, claro y policial.
• Siempre tercera persona y tiempo presente.
• Cada párrafo comienza con “– ”.
• Sin encabezados visibles.
• No incluir frases sobre voluntad de acciones legales.
• No opiniones del agente actuante.
• No inventar datos.
• Alternar conectores: manifiesta, expone, relata, hace constar, añade, informa, prosigue indicando, señala.

====================
PERJUDICADO VS VÍCTIMA
====================

• “Perjudicado”: afectación patrimonial o indirecta sin afectación personal directa.
• “Víctima”: afectación personal directa física/psíquica.
• En patrimoniales sin interacción personal directa: usar “perjudicado”.
• Si concurren afectación patrimonial y personal: prevalece “víctima”.
• Mantener coherencia terminológica en todo el texto.

========================
PRIMER PÁRRAFO OBLIGATORIO
========================

La redacción final debe empezar siempre con:

– Se persona en estas dependencias en calidad de [perjudicado / víctima del hecho / trabajador o dependiente del establecimiento afectado / representante legal del establecimiento afectado], en relación a los hechos que se exponen a continuación.

===========================
MODO 1: LÓGICA DE COMPLETITUD
===========================

Antes de redactar, evalúa suficiencia. Si faltan datos críticos, pregunta.

Prioridades:
1. Cronología básica (fecha/hora/intervalo).
2. Lugar concreto del hecho.
3. Mecánica (qué ocurre, cómo, secuencia).
4. Interacción entre implicados (si existe).
5. Identificación útil de intervinientes.
6. Pruebas (testigos, cámaras, grabaciones, evidencias).
7. Resultado/perjuicio y actuaciones posteriores.
8. Contexto causal del hecho (circunstancia previa relevante).
9) CONTEXTO MOTIVACIONAL MÍNIMO
- Debe constar, al menos, una de estas dos opciones:
a) la causa/finalidad aparente de la conducta del autor, según lo que conoce el compareciente, o
b) constancia expresa de que el compareciente desconoce completamente el motivo.

Reglas de repregunta:
• Una sola pregunta por turno.
• Un solo objetivo informativo por turno (pregunta atómica).
• Máximo 6 repreguntas.
• Preguntas cortas, concretas y útiles.
• No preguntar extremos implausibles por contexto.
• Tras cada respuesta, revaluar cobertura y decidir el siguiente gap.
• Si no consta contexto motivacional, la siguiente pregunta debe ir dirigida a aclararlo de forma neutra.
Pregunta base:
“¿Qué cree que pretendía el autor con esa conducta o qué quería que usted hiciera o dejara de hacer?”


======================================
REGLA DE VALIDACIÓN DE LUGAR (CONDICIONAL)
======================================

Solo preguntar por lugar si es insuficiente o ambiguo.

Lugar suficiente:
- calle y número, o
- establecimiento concreto, o
- referencia inequívoca del punto, o
- domicilio con dirección concreta.

Lugar insuficiente:
“zona de bares”, “cerca del trabajo”, “en la calle”, “mi casa”, “por [zona]”, etc.

Si es insuficiente, preguntar una sola vez:
“¿Puede indicar el lugar exacto del hecho (calle, número o referencia concreta del punto)?”

Si el lugar ya es suficiente, no volver a preguntarlo.

================================
PUERTA DE CIERRE (ANTES DE REDACTAR)
================================

No cerrar aunque el relato sea narrable si falta alguno de estos bloques:

1) Cronología operativa.
2) Lugar concreto.
3) Mecánica concreta del hecho.
4) Reacción de la persona afectada o de los intervinientes.
5) Identificación útil disponible o constancia expresa de su ausencia.
6) Estado de medios de prueba (incluido “no consta/no sabe”).
7) Actuación inmediata posterior.
8) Contexto causal mínimo (o constancia expresa de que se desconoce).

Si falta alguno, seguir en MODO 1.

===========================================
REGLAS DE CONTENIDO EN MODO 2 (REDACCIÓN FINAL)
===========================================

Integrar narrativamente, si constan:
• Fecha, hora y lugar.
• Situación o actividad previa.
• Descripción cronológica completa.
• Identidad o descripción de intervinientes.
• Medios de prueba.
• Actuaciones posteriores (aviso policial, asistencia, intervención, seguimiento).
• Perjuicios y valoración aproximada (solo si constan).
• Lesiones (solo si existen) e indicar si se aporta parte/informe médico.

Reglas específicas:
• Si no hay lesiones, no mencionar parte médico.
• Si no hubo interacción personal, no atribuir lesiones.
• En extravío/pérdida, no aludir a testigos/cámaras/medios de prueba.
• “Cantidad” de objetos se expresa en lenguaje natural:
  - correcto: “dos teléfonos móviles”
  - incorrecto: “un teléfono en cantidad dos”.

=========================================
INDAGACIÓN CONTEXTUAL (OBLIGATORIA Y NEUTRA)
=========================================

En cualquier relato que requiera entendimiento contextual, debes indagar por la circunstancia previa o motivo aparente de forma neutra y no culpabilizadora.

Pregunta base sugerida si no consta:
“Para contextualizar correctamente los hechos, ¿existió alguna circunstancia previa relevante inmediatamente antes del incidente?”

Pregunta de precisión si sigue vago:
“¿Qué hecho concreto ocurre justo antes y cómo cree que se relaciona con lo sucedido?”

Nunca sugerir culpa de la persona denunciante.

=====
IDIOMA
=====

Si hay valores en idioma distinto del español, interprétalos y redacta en español sin mencionar traducción.

======================
PROHIBICIONES ABSOLUTAS
======================

× Nada en primera persona
× Nada de encabezados visibles
× Nada sobre voluntad de denunciar/acciones legales
× Nada inventado
× Nada que parezca valoración subjetiva del agente
× Nada sobre prompts, JSON, formularios, sistemas o IA

==========================================
REGLA ESPECÍFICA: ESTANCIA EVENTUAL EN TENERIFE
==========================================

Si consta que NO reside en Tenerife y existen estancia_eventual + fecha_vuelta, añadir al final:

“Se significa que el compareciente se encuentra alojado en [estancia_eventual] hasta el próximo día [fecha_vuelta].”

Si no constan ambos, no añadir mención.

====================
FORMATO DE RESPUESTA
====================

- Si no hay suficiencia o no supera la puerta de cierre: devolver solo UNA pregunta atómica de completitud.
- Si hay suficiencia y supera la puerta de cierre: devolver la denuncia final completa.
- Antes de la redacción final, debe formularse al menos una pregunta de indagación sobre contexto motivacional.
- Si el compareciente no sabe, no puede o no quiere concretarlo, se continuará con la redacción dejando constancia expresa de dicha circunstancia.
- La ausencia de motivo aclarado no bloquea el cierre, pero la pregunta de indagación es obligatoria.
`.trim();

const SYSTEM_COMPLETITUD = `
${PROMPT_BASE}

MODO 1 ACTIVO (COMPLETITUD):
- Devuelve solo UNA pregunta atómica de completitud.
- Un solo objetivo informativo por turno.
- No repitas preguntas ya hechas ni preguntes datos ya aportados.
- Si un dato consta como desconocido/no recordado/no disponible, no insistir en ese mismo punto.
- Prioriza: cronología, lugar concreto, mecánica, reacción, identificación, prueba, actuación posterior y contexto motivacional.
- Si falta contexto motivacional, preguntar de forma neutra.

FORMATO DE RESPUESTA:
Devuelve SOLO una línea con una pregunta. Sin texto adicional.
`.trim();

const SYSTEM_QUESTION_REVIEW = `
${PROMPT_BASE}

Modo revisión de pregunta:
- Recibes una pregunta candidata de completitud.
- Debes validarla contra el contexto y el historial.
- Si la pregunta presupone hechos no aportados, atribuye intención a la persona equivocada o es improcedente por contexto, reescríbela.
- Evita preguntas de bajo valor operativo o irrelevantes para esclarecer, identificar autor o preservar prueba.
- No centres la pregunta en reacciones de terceros (por ejemplo personal de comercio) salvo necesidad probatoria clara.
- Debe quedar una única pregunta atómica, neutra, útil y contextual.
- No repitas lo ya preguntado o respondido.

Formato de salida:
Devuelve SOLO una línea con la pregunta final validada.
`.trim();

const SYSTEM_REDACCION = `
${PROMPT_BASE}

MODO 2 ACTIVO (REDACCIÓN FINAL):
- Redacta la denuncia final completa.
- Integra cronología, lugar, mecánica, intervinientes, pruebas, actuaciones posteriores y contexto motivacional si constan.
- Si un dato no consta, deja constancia objetiva sin inventar.
- Sin firmas, sin títulos, sin apartados.

FORMATO DE RESPUESTA:
Devuelve SOLO el texto final de denuncia.
`.trim();

const SYSTEM_REDACCION_REPAIR = `
${PROMPT_BASE}

Modo reparación de redacción:
- Recibirás un borrador deficiente.
- Debes reescribirlo completo con calidad policial, sin inventar hechos.
- Mínimo 6 párrafos y cada párrafo debe iniciar por "– ".
- El primer párrafo debe ser exactamente el obligatorio del prompt.
- No usar encabezados ni apartados.

Devuelve SOLO el texto final corregido.
`.trim();

function remapKeys(value) {
  if (Array.isArray(value)) return value.map(remapKeys);
  if (!value || typeof value !== "object") return value;
  const out = {};
  for (const [k, v] of Object.entries(value)) {
    out[KEY_ALIAS[k] || k] = remapKeys(v);
  }
  return out;
}

function getStr(obj, ...keys) {
  for (const k of keys) {
    const v = obj?.[k];
    if (v !== undefined && v !== null && String(v).trim()) return String(v).trim();
  }
  return "";
}

function hasAny(obj, keys = []) {
  return keys.some((k) => {
    const v = obj?.[k];
    if (Array.isArray(v)) return v.length > 0;
    return v !== undefined && v !== null && String(v).trim() !== "";
  });
}

function getAny(obj, keys = []) {
  for (const k of keys) {
    const v = obj?.[k];
    if (v !== undefined && v !== null && String(v).trim() !== "") return v;
  }
  return "";
}

function normalizeText(v) {
  return String(v || "").toLowerCase();
}

function splitBulletLines(text) {
  return String(text || "")
    .split("\n")
    .map((x) => x.trim())
    .filter((x) => x.startsWith("– "));
}

function hasBasicDraftQuality(text) {
  const src = String(text || "").trim();
  if (!src) return false;
  const lines = splitBulletLines(src);
  if (lines.length < 6) return false;
  if (src.length < 650) return false;
  const firstLineOk = /^– Se persona en estas dependencias en calidad de /i.test(lines[0] || "");
  return firstLineOk;
}

function hasInteraction(session) {
  const h = session.hechos_ai || {};
  const inter = normalizeText(getAny(h, ["autor_interaccion_con_victima_testigo", "autor_interaccion", "interaccion_autor"]));
  if (!inter) return false;
  if (inter === "no" || inter.includes("sin interacción") || inter.includes("sin interaccion")) return false;
  return true;
}

function isExtravio(session) {
  const t = normalizeText(session.crimeType);
  const c1 = normalizeText(getAny(session.hechos_ai || {}, ["hecho_caracteristicas", "caracteristica_hecho"]));
  return t.includes("extravio") || c1.includes("extrav");
}

function isDiscoveryPosterior(session) {
  const h = session.hechos_ai || {};
  const src = normalizeText(getAny(h, ["hecho_conocimiento", "declarante_como_conocio_el_hecho", "conocimiento_hecho"]));
  if (!src) return false;
  return /descubr|posterior|al\s+regresar|al\s+llegar|se\s+percata|advierte/.test(src);
}

function isDirectObservation(session) {
  const h = session.hechos_ai || {};
  const src = normalizeText(getAny(h, ["hecho_conocimiento", "declarante_como_conocio_el_hecho", "conocimiento_hecho"]));
  if (!src) return false;
  return /testigo|presenci|vio|observ[óo]\s+directamente|en\s+el\s+momento/.test(src);
}

function shouldAskMotivacional(session) {
  const h = session.hechos_ai || {};
  const resumen = normalizeText(getAny(h, ["hecho_resumen_narrativo", "hecho_detalle_adicional", "resumen"]));
  const lesionesRaw = normalizeText(getAny(h, ["lesiones_presenta", "lesiones"]));
  const lesionesSi = lesionesRaw === "si" || lesionesRaw === "sí";
  const hasViolenceSignals = (
    hasAny(h, ["amenazas_tipologia", "coacciones_tipo", "vg_amenaza_muerte"]) ||
    lesionesSi ||
    /amenaz|agred|coacci|extorsi|intimid/.test(resumen)
  );
  return hasInteraction(session) || hasViolenceSignals;
}

function shouldRequireReaction(session) {
  const h = session.hechos_ai || {};
  const lesiones = normalizeText(getAny(h, ["lesiones_presenta", "lesiones"]));
  return hasInteraction(session) || lesiones === "si";
}

function shouldRequirePruebas(session) {
  return !isExtravio(session);
}

function shouldRequireIdentificacion(session) {
  if (isExtravio(session)) return false;
  if (hasInteraction(session)) return true;
  if (isDirectObservation(session)) return true;
  if (isDiscoveryPosterior(session)) return false;
  return false;
}

function sanitizeQuestion(session, gap, q) {
  let out = String(q || "").trim();
  if (!out) return questionForGap(gap, session);
  if (!/[?؟]$/.test(out)) out = `${out}?`;

  const low = normalizeText(out);
  if (/\b(nombre completo|edad de la persona|edad del denunciante|edad de la victima|filiaci[oó]n|dni|pasaporte|nie)\b/i.test(low)) {
    return questionForGap(gap, session);
  }
  if (low.includes("motivación del denunciante") || low.includes("motivacion del denunciante")) {
    return questionForGap(gap, session);
  }
  if (low.includes("según consta en las imágenes") || low.includes("segun consta en las imagenes")) {
    return questionForGap(gap, session);
  }
  if (!shouldAskMotivacional(session) && gap === "motivacional") {
    return questionForGap("mecanica", session);
  }
  if (isExtravio(session) && /\bautor\b/.test(low)) {
    return questionForGap("mecanica", session);
  }
  return out;
}

function isWeakQuestion(q) {
  const s = String(q || "").trim();
  if (!s) return true;
  if (s.length < 18) return true;
  if (!/[?؟]$/.test(s)) return true;
  if (/^¿se ha\??$/i.test(s)) return true;
  return false;
}

function isPlaceSpecific(place) {
  const p = String(place || "").trim();
  if (!p) return false;
  if (GENERIC_PLACE_RE.test(p)) return false;
  if (/\d/.test(p)) return true;
  if (p.split(",").filter(Boolean).length >= 2) return true;
  if (/\b(calle|avenida|plaza|portal|local|n[úu]mero|km)\b/i.test(p)) return true;
  return p.length > 18;
}

function evaluateCoverage(session) {
  const h = session.hechos_ai || {};
  const extra = session.extra || {};

  const fecha = getStr(h, "hecho_fecha", "fecha");
  const hora = getStr(h, "hecho_hora", "hora", "hecho_hora_desde", "hora_desde");
  const lugar = getStr(h, "hecho_lugar", "lugar");
  const mecanica = getStr(h, "hecho_resumen_narrativo", "hecho_detalle_adicional", "resumen");

  const cronologiaOk = !!(fecha || hora || extra.cronologia);
  const lugarOk = isPlaceSpecific(lugar) || isPlaceSpecific(extra.lugar_exacto);
  const mecanicaOk = !!(mecanica || extra.mecanica_concreta);
  const reactionRequired = shouldRequireReaction(session);
  const reaccionOk = isExtravio(session) || !reactionRequired || hasAny(h, ["autor_interaccion_con_victima_testigo", "autor_interaccion", "vg_resultado_tras_intento_separacion_victima"]) || !!extra.reaccion_intervinientes;
  const idRequired = shouldRequireIdentificacion(session);
  const idOk = !idRequired || hasAny(h, ["autor_identificacion_datos_aportados", "autores", "autor_descripcion", "autor_conocido", "autor_vinculo"]) || !!extra.identificacion_o_ausencia;
  const proofRequired = shouldRequirePruebas(session);
  const pruebaOk = !proofRequired || hasAny(h, ["camaras_hay", "camaras_gestion_detalle", "estafa_evidencias"]) || !!extra.medios_prueba;
  const posteriorOk = true;
  const motivationalRequired = shouldAskMotivacional(session);
  const motivacionalOk = !motivationalRequired || (session.motivacionAsked && !!extra.contexto_motivacional);

  const missing = [];
  const initialProbeNeeded = (session.aiTurns || []).length === 0;
  if (initialProbeNeeded) missing.push("mecanica");
  if (!cronologiaOk) missing.push("cronologia");
  if (!lugarOk) missing.push("lugar");
  if (!mecanicaOk) missing.push("mecanica");
  if (!reaccionOk) missing.push("reaccion");
  if (!idOk) missing.push("identificacion");
  if (!pruebaOk) missing.push("pruebas");
  if (!posteriorOk) missing.push("posterior");
  if (!motivacionalOk) missing.push("motivacional");

  return { missing };
}

function questionForGap(gap, session = null) {
  if (session && isExtravio(session)) {
    switch (gap) {
      case "cronologia":
        return "¿Puede indicar fecha y hora aproximada en la que advierte la pérdida del objeto?";
      case "lugar":
        return "¿Puede indicar el último lugar concreto donde tuvo el objeto antes de advertir su extravío?";
      case "mecanica":
        return "¿Cómo se percata del extravío y cuál fue el último momento en que tuvo el objeto consigo?";
      default:
        return "¿Puede aportar algún dato adicional útil para localizar el objeto extraviado?";
    }
  }
  switch (gap) {
    case "cronologia":
      return "¿Puede indicar fecha y hora aproximada del hecho?";
    case "lugar":
      return "¿Puede indicar el lugar exacto del hecho (calle, número o referencia concreta del punto)?";
    case "mecanica":
      return "¿Qué ocurre exactamente y en qué secuencia, de forma breve y concreta?";
    case "reaccion":
      return "¿Cómo reacciona usted o los intervinientes justo después del hecho?";
    case "identificacion":
      return "¿Dispone de algún dato útil para identificar al autor o, en su defecto, puede confirmar que no lo conoce?";
    case "pruebas":
      return "¿Consta algún medio de prueba (testigos, cámaras, grabaciones o documentos) o puede confirmar que no dispone de ellos?";
    case "posterior":
      return "¿Consta alguna actuación inmediata posterior relevante (aviso, asistencia o gestión), o no consta ninguna?";
    case "motivacional":
      return "¿Qué cree que pretendía el autor con esa conducta o qué quería que usted hiciera o dejara de hacer?";
    default:
      return "¿Puede aportar un dato adicional relevante para esclarecer el hecho?";
  }
}

function saveAnswerByGap(session, gap, answer) {
  if (!session.extra) session.extra = {};
  const a = String(answer || "").trim();
  if (!a) return;
  const noInfo = NO_INFO_RE.test(a);
  if (!session.closedGaps) session.closedGaps = {};

  if (gap === "cronologia") session.extra.cronologia = a;
  else if (gap === "lugar") session.extra.lugar_exacto = a;
  else if (gap === "mecanica") session.extra.mecanica_concreta = a;
  else if (gap === "reaccion") session.extra.reaccion_intervinientes = a;
  else if (gap === "identificacion") session.extra.identificacion_o_ausencia = a;
  else if (gap === "pruebas") session.extra.medios_prueba = a;
  else if (gap === "posterior") session.extra.actuacion_posterior = a;
  else if (gap === "motivacional") {
    session.extra.contexto_motivacional = a;
    session.motivacionAsked = true;
  }
  if (noInfo && gap) session.closedGaps[gap] = true;
}

function nextQuestion(session) {
  const { missing } = evaluateCoverage(session);
  const filteredMissing = missing.filter((g) => !session.closedGaps?.[g]);
  if (shouldAskMotivacional(session) && !session.motivacionAsked) {
    session.lastGap = "motivacional";
    return { status: "ASK", nextQuestion: questionForGap("motivacional", session), targetGap: "motivacional" };
  }
  if (!filteredMissing.length) {
    session.lastGap = "";
    return { status: "READY_TO_DRAFT", nextQuestion: "", targetGap: "" };
  }
  const gap = filteredMissing[0];
  session.lastGap = gap;
  return { status: "ASK", nextQuestion: "", targetGap: gap };
}

async function generateQuestion(session, gap) {
  if (QUESTION_MODE === "deterministic") {
    return questionForGap(gap, session);
  }
  if (gap === "motivacional") {
    return "¿Qué cree que pretendía el autor con esa conducta o qué quería que usted hiciera o dejara de hacer?";
  }

  const askedQuestions = (session.aiTurns || []).map((t) => t.question).filter(Boolean);
  const knownNoInfo = Object.keys(session.closedGaps || {});
  const userPrompt = [
    `Tipo de hecho: ${session.crimeType || "NO_INDICADO"}`,
    `Objetivo del turno (gap): ${gap}`,
    "Datos conocidos de hechos:",
    JSON.stringify(session.hechos_ai || {}, null, 2),
    "Respuestas de turnos previos:",
    JSON.stringify(session.aiTurns || [], null, 2),
    "Gaps cerrados por desconocimiento/no disponibilidad:",
    JSON.stringify(knownNoInfo),
    "Preguntas ya usadas (NO repetir):",
    JSON.stringify(askedQuestions),
    "Genera una única pregunta útil para este gap."
  ].join("\n");

  let q = "";
  try {
    q = await askOllama([
      { role: "system", content: SYSTEM_COMPLETITUD },
      { role: "user", content: userPrompt }
    ]);
  } catch {
    q = "";
  }

  const candidate = String(q || "").split("\n").map((x) => x.trim()).filter(Boolean)[0] || "";
  const fallback = questionForGap(gap, session);
  const toReview = isWeakQuestion(candidate) ? fallback : candidate;

  const reviewPrompt = [
    `Tipo de hecho: ${session.crimeType || "NO_INDICADO"}`,
    `Gap objetivo: ${gap}`,
    "Hechos conocidos:",
    JSON.stringify(session.hechos_ai || {}, null, 2),
    "Historial de turnos:",
    JSON.stringify(session.aiTurns || [], null, 2),
    "Pregunta candidata:",
    toReview
  ].join("\n");

  let reviewed = "";
  try {
    reviewed = await askOllama([
      { role: "system", content: SYSTEM_QUESTION_REVIEW },
      { role: "user", content: reviewPrompt }
    ]);
  } catch {
    reviewed = "";
  }

  const oneLine = String(reviewed || "").split("\n").map((x) => x.trim()).filter(Boolean)[0] || "";
  const reviewedOrFallback = isWeakQuestion(oneLine) ? toReview : oneLine;
  return sanitizeQuestion(session, gap, reviewedOrFallback || fallback);
}

async function askOllama(messages) {
  if (USE_MOCK_MODEL) {
    const system = String(messages?.[0]?.content || "");
    const user = String(messages?.[1]?.content || "");
    if (/MODO 1 ACTIVO/i.test(system)) {
      const gap = (user.match(/Objetivo del turno \(gap\):\s*([^\n]+)/i)?.[1] || "mecanica").trim();
      return questionForGap(gap);
    }
    if (/Modo revisión de pregunta/i.test(system)) {
      const candidate = (user.split("Pregunta candidata:")[1] || "").split("\n").map((x) => x.trim()).filter(Boolean)[0] || "";
      return candidate || "¿Puede concretar ese dato de forma breve?";
    }
    if (/MODO 2 ACTIVO/i.test(system) || /Modo reparación de redacción/i.test(system)) {
      return [
        "– Se persona en estas dependencias en calidad de perjudicado, en relación a los hechos que se exponen a continuación.",
        "– Manifiesta que en fecha y franja horaria aportadas, los hechos se detectan en el lugar reseñado por el compareciente, quedando descrita una sustracción en interior de inmueble con acceso mediante forzamiento de puerta.",
        "– Expone que la mecánica conocida se basa en el descubrimiento posterior, haciendo constar la existencia de daños materiales en el punto de acceso, así como la manipulación del lugar previa a la comparecencia.",
        "– Relata que entre los efectos sustraídos constan joyas de oro y plata, sin que en este momento se aporte valoración económica cerrada ni presupuesto de reparación asociado.",
        "– Informa que no constan cámaras, testigos directos ni otros medios de prueba adicionales en esta fase, sin perjuicio de ampliación posterior si se obtuvieran nuevos elementos objetivos.",
        "– Prosigue indicando que, respecto de la identificación de autoría, no se dispone de datos útiles al tratarse de conocimiento posterior al hecho y sin observación directa de intervinientes.",
        "– Hace constar que la presente declaración se emite con los datos facilitados hasta este momento, quedando abierta la posibilidad de ampliación para trazabilidad probatoria y concreción de perjuicios."
      ].join("\n");
    }
    return "OK";
  }

  if (AI_PROVIDER === "openai") {
    if (!openai) throw new Error("OPENAI_API_KEY no configurada");
    const response = await openai.responses.create({
      model: OPENAI_MODEL,
      input: messages.map((msg) => ({
        role: msg.role === "assistant" ? "assistant" : (msg.role === "system" ? "system" : "user"),
        content: [{ type: "input_text", text: String(msg.content || "") }]
      }))
    });

    const text = String(response.output_text || "").trim();
    if (text) return text;

    const fallbackText = Array.isArray(response.output)
      ? response.output
          .flatMap((item) => Array.isArray(item?.content) ? item.content : [])
          .map((item) => (item && typeof item.text === "string") ? item.text : "")
          .filter(Boolean)
          .join("\n")
          .trim()
      : "";

    if (fallbackText) return fallbackText;
    throw new Error("Respuesta vacia de OpenAI");
  }

  const options = {};
  if (OLLAMA_NUM_THREAD > 0) options.num_thread = OLLAMA_NUM_THREAD;
  if (OLLAMA_NUM_CTX > 0) options.num_ctx = OLLAMA_NUM_CTX;
  if (OLLAMA_NUM_PREDICT > 0) options.num_predict = OLLAMA_NUM_PREDICT;
  options.temperature = OLLAMA_TEMPERATURE;

  const callChat = async (msgs) => {
    const r = await fetch(`${OLLAMA_URL}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        messages: msgs,
        stream: false,
        keep_alive: OLLAMA_KEEP_ALIVE,
        options
      })
    });
    if (!r.ok) {
      const t = await r.text().catch(() => "");
      throw new Error(`Ollama error ${r.status}: ${t || "sin detalle"}`);
    }
    return r.json();
  };

  const callGenerate = async (prompt) => {
    const r = await fetch(`${OLLAMA_URL}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        prompt,
        stream: false,
        keep_alive: OLLAMA_KEEP_ALIVE,
        options
      })
    });
    if (!r.ok) {
      const t = await r.text().catch(() => "");
      throw new Error(`Ollama generate error ${r.status}: ${t || "sin detalle"}`);
    }
    return r.json();
  };

  const extractText = (data) => {
    const raw = data?.message?.content;
    let txt = "";
    if (typeof raw === "string") {
      txt = raw;
    } else if (Array.isArray(raw)) {
      txt = raw
        .map((item) => {
          if (typeof item === "string") return item;
          if (item && typeof item.text === "string") return item.text;
          if (item && typeof item.content === "string") return item.content;
          return "";
        })
        .filter(Boolean)
        .join("\n");
    } else if (typeof data?.response === "string") {
      txt = data.response;
    } else if (typeof data?.output_text === "string") {
      txt = data.output_text;
    } else if (typeof data?.message?.thinking === "string") {
      txt = data.message.thinking;
    } else if (Array.isArray(data?.message?.thinking)) {
      txt = data.message.thinking
        .map((item) => {
          if (typeof item === "string") return item;
          if (item && typeof item.text === "string") return item.text;
          if (item && typeof item.content === "string") return item.content;
          return "";
        })
        .filter(Boolean)
        .join("\n");
    }
    return String(txt || "").trim();
  };

  const data = await callChat(messages);
  let txt = extractText(data);
  if (txt) return txt;

  const retryMessages = [
    ...messages,
    { role: "user", content: "Responde solo en texto plano, sin JSON ni marcas, en una sola respuesta util." }
  ];
  const dataRetry = await callChat(retryMessages);
  txt = extractText(dataRetry);
  if (txt) return txt;

  // Fallback robusto para modelos cloud que devuelven chat vacio.
  const mergedPrompt = retryMessages
    .map((m) => {
      const role = String(m?.role || "user").toUpperCase();
      const content = String(m?.content || "");
      return `[${role}]\n${content}`;
    })
    .join("\n\n");
  const dataGen = await callGenerate(mergedPrompt);
  const genTxt = String(dataGen?.response || dataGen?.output_text || "").trim();
  if (genTxt) return genTxt;

  const keys = Object.keys(dataRetry || {}).join(", ");
  const msgKeys = Object.keys(dataRetry?.message || {}).join(", ");
  const genKeys = Object.keys(dataGen || {}).join(", ");
  throw new Error(`Respuesta vacía del modelo (schema: ${keys || "sin_claves"}; message: ${msgKeys || "sin_claves"}; generate: ${genKeys || "sin_claves"})`);
}

function buildFallbackDraft(session, hechosForNarrative, estanciaEventual, fechaVuelta) {
  const h = hechosForNarrative || {};
  const lines = [];
  const lesionesRaw = normalizeText(getAny(h, ["lesiones_presenta", "lesiones", "tiene_lesiones"]));
  const esVictima = lesionesRaw === "si" || lesionesRaw === "sí" || hasInteraction(session);
  const rol = esVictima ? "víctima del hecho" : "perjudicado";
  lines.push(`– Se persona en estas dependencias en calidad de ${rol}, en relación a los hechos que se exponen a continuación.`);

  const fecha = getStr(h, "hecho_fecha", "fecha") || getStr(session.extra || {}, "cronologia");
  const hora = getStr(h, "hecho_hora", "hora", "hecho_hora_desde", "hora_desde");
  const lugar = getStr(h, "hecho_lugar", "lugar") || getStr(session.extra || {}, "lugar_exacto");
  const resumen = getStr(h, "hecho_resumen_narrativo", "hecho_detalle_adicional", "resumen") || getStr(session.extra || {}, "mecanica_concreta");
  const previo = getStr(h, "declarante_como_conocio_el_hecho", "hecho_conocimiento");
  const acceso = getStr(h, "acceso_metodo", "danos_tipologia");
  const danos = getStr(h, "danos_descripcion");
  const objetos = Array.isArray(getAny(h, ["sustraccion_objetos", "objetos", "extravio_objetos"])) ? getAny(h, ["sustraccion_objetos", "objetos", "extravio_objetos"]) : [];
  const ident = getStr(h, "autor_identificacion_datos_aportados", "autor_descripcion", "autores", "autor_conocido") || getStr(session.extra || {}, "identificacion_o_ausencia");
  const pruebas = getStr(h, "camaras_hay", "camaras_gestion_detalle", "estafa_evidencias") || getStr(session.extra || {}, "medios_prueba");
  const actuacion = getStr(session.extra || {}, "actuacion_posterior");
  const motiv = getStr(session.extra || {}, "contexto_motivacional");

  if (fecha || hora || lugar || resumen) {
    const p1 = [fecha ? `En fecha ${fecha}` : "", hora ? `a la franja horaria ${hora}` : "", lugar ? `en ${lugar}` : ""]
      .filter(Boolean).join(", ");
    lines.push(`– Manifiesta que ${p1 || "en el momento y lugar indicados"}, se produce el hecho denunciado, haciendo constar como núcleo del relato que ${resumen || "se detecta una incidencia con relevancia penal"}.`);
  }
  if (previo) lines.push(`– Expone que el conocimiento del hecho se produce en la siguiente circunstancia: ${previo}.`);
  if (acceso || danos) {
    lines.push(`– Relata que, en relación con la mecánica material, ${acceso ? `se aprecia ${acceso.toLowerCase()}` : "no se concreta el método de acceso"}, ${danos ? `observándose además ${danos}` : "sin mayor detalle de daños adicionales en este momento"}.`);
  }
  if (objetos.length) {
    const objTxt = objetos.map((o) => (o?.descripcion || o?.tipo || o?.tipo_catalogo || "")).filter(Boolean).join(", ");
    lines.push(`– Hace constar que entre los efectos afectados figuran ${objTxt || "diversos objetos"}, quedando pendiente, en su caso, concreción económica posterior conforme avance la comprobación documental.`);
  }
  if (ident) lines.push(`– Añade que, sobre la identificación de posibles intervinientes, se dispone del siguiente dato útil: ${ident}.`);
  else lines.push("– Añade que, sobre la identificación de posibles intervinientes, no se dispone de datos útiles en este momento, al no existir observación directa suficiente.");
  if (pruebas) lines.push(`– Informa que respecto a medios de prueba consta lo siguiente: ${pruebas}.`);
  else lines.push("– Informa que respecto a medios de prueba no constan por ahora testigos, grabaciones ni evidencias adicionales, sin perjuicio de ampliación posterior.");
  if (actuacion) lines.push(`– Prosigue indicando que, tras los hechos, se realiza la siguiente actuación inmediata: ${actuacion}.`);
  else lines.push("– Prosigue indicando que la actuación inmediata posterior consiste en la comparecencia para documentar formalmente los hechos y posibilitar su trazabilidad investigadora.");
  if (motiv) lines.push(`– Señala que, en cuanto al contexto causal o motivacional, ${motiv}.`);
  else lines.push("– Señala que no se dispone de una motivación concreta adicional más allá de la secuencia objetiva descrita por el compareciente.");

  if (estanciaEventual && fechaVuelta) {
    lines.push(`– Se significa que el compareciente se encuentra alojado en ${estanciaEventual} hasta el próximo día ${fechaVuelta}.`);
  }
  return lines.join("\n");
}

class ApiError extends Error {
  constructor(status, message, extra = {}) {
    super(message);
    this.status = status;
    this.extra = extra;
  }
}

export async function startSessionCore(body = {}) {
  const sessionId = randomUUID();
  const fixedAnswers = (body?.fixedAnswers && typeof body.fixedAnswers === "object")
    ? body.fixedAnswers
    : {};

  const session = {
    sessionId,
    token: String(body?.token || "").trim(),
    crimeType: String(body?.crimeType || "").trim(),
    lang: String(body?.lang || "es").trim(),
    hechos_original: fixedAnswers,
    hechos_ai: remapKeys(fixedAnswers),
    aiTurns: [],
    extra: {},
    closedGaps: {},
    lastGap: "",
    lastQuestion: "",
    motivacionAsked: false,
    remainingQuestions: MAX_TURNS
  };

  sessions.set(sessionId, session);

  const nxt = nextQuestion(session);
  const q = (nxt.status === "ASK" && nxt.targetGap) ? await generateQuestion(session, nxt.targetGap) : "";
  session.lastQuestion = q || "";
  if (nxt.status !== "ASK") session.remainingQuestions = 0;
  return {
    sessionId,
    status: nxt.status,
    nextQuestion: q,
    remainingQuestions: session.remainingQuestions,
    targetGap: nxt.targetGap
  };
}

export function hydrateSession(sessionId, sessionData) {
  const key = String(sessionId || "").trim();
  if (!key || !sessionData || typeof sessionData !== "object") return null;
  sessions.set(key, sessionData);
  return sessionData;
}

export function getSessionSnapshot(sessionId) {
  const key = String(sessionId || "").trim();
  if (!key) return null;
  return sessions.get(key) || null;
}

export function dropSession(sessionId) {
  const key = String(sessionId || "").trim();
  if (!key) return;
  sessions.delete(key);
}

export async function messageSessionCore(body = {}) {
  const sessionId = String(body?.sessionId || "").trim();
  const userAnswer = String(body?.userAnswer || "").trim();
  const session = sessions.get(sessionId);
  if (!session) throw new ApiError(404, "session not found");

  saveAnswerByGap(session, session.lastGap, userAnswer);
  session.aiTurns.push({
    gap: session.lastGap || "general",
    question: session.lastQuestion || "",
    userAnswer,
    ts: new Date().toISOString()
  });
  session.remainingQuestions = Math.max(0, session.remainingQuestions - 1);

  if (session.remainingQuestions === 0) {
    const mustMotivation = shouldAskMotivacional(session) && !session.motivacionAsked;
    if (mustMotivation) {
      session.lastGap = "motivacional";
      const q = await generateQuestion(session, "motivacional");
      session.lastQuestion = q || "";
      return {
        status: "ASK",
        nextQuestion: q,
        targetGap: "motivacional",
        remainingQuestions: 1,
        answerApplied: true
      };
    }
    return {
      status: "READY_TO_DRAFT",
      remainingQuestions: 0,
      answerApplied: true
    };
  }

  const nxt = nextQuestion(session);
  const q = (nxt.status === "ASK" && nxt.targetGap) ? await generateQuestion(session, nxt.targetGap) : "";
  session.lastQuestion = q || "";
  if (nxt.status !== "ASK") session.remainingQuestions = 0;
  return {
    status: nxt.status,
    nextQuestion: q,
    targetGap: nxt.targetGap,
    remainingQuestions: session.remainingQuestions,
    answerApplied: true
  };
}

export async function finalizeSessionCore(body = {}) {
  const sessionId = String(body?.sessionId || "").trim();
  const session = sessions.get(sessionId);
  if (!session) throw new ApiError(404, "session not found");

  const { missing } = evaluateCoverage(session);
  if (missing.length) {
    throw new ApiError(400, `Faltan bloques críticos: ${missing.join(", ")}`, { missing });
  }

  const hechosForNarrative = { ...(session.hechos_ai || {}) };
  const estanciaEventual = getStr(hechosForNarrative, "estancia_eventual");
  const fechaVuelta = getStr(hechosForNarrative, "fecha_vuelta");
  delete hechosForNarrative.estancia_eventual;
  delete hechosForNarrative.fecha_vuelta;

  const userPrompt = [
    "Datos base (hechos clarificados):",
    JSON.stringify(hechosForNarrative, null, 2),
    "Respuestas de completitud:",
    JSON.stringify(session.aiTurns, null, 2),
    "Regla crítica: si existen 'estancia_eventual' y 'fecha_vuelta', pertenecen SIEMPRE al compareciente, nunca al autor.",
    "Datos adicionales estructurados de completitud:",
    JSON.stringify(session.extra || {}, null, 2),
    "Responda en español y cumpla el formato indicado."
  ].join("\n");

  let declaracionFinal = "";
  try {
    const declaracionFinalRaw = await askOllama([
      { role: "system", content: SYSTEM_REDACCION },
      { role: "user", content: userPrompt }
    ]);
    declaracionFinal = String(declaracionFinalRaw || "").trim();
  } catch {
    declaracionFinal = "";
  }

  for (let i = 0; i < 2 && !hasBasicDraftQuality(declaracionFinal); i++) {
    const repairPrompt = [
      "Borrador a corregir:",
      declaracionFinal || "(vacío)",
      "",
      "Datos base (hechos clarificados):",
      JSON.stringify(hechosForNarrative, null, 2),
      "Respuestas de completitud:",
      JSON.stringify(session.aiTurns, null, 2),
      "Datos adicionales estructurados:",
      JSON.stringify(session.extra || {}, null, 2),
      "Reescribe completamente cumpliendo el formato policial requerido."
    ].join("\n");
    try {
      const repaired = await askOllama([
        { role: "system", content: SYSTEM_REDACCION_REPAIR },
        { role: "user", content: repairPrompt }
      ]);
      declaracionFinal = String(repaired || "").trim();
    } catch {}
  }

  if (!hasBasicDraftQuality(declaracionFinal)) {
    declaracionFinal = buildFallbackDraft(session, hechosForNarrative, estanciaEventual, fechaVuelta);
  }

  declaracionFinal = declaracionFinal
    .replace(/^.*\[estancia_eventual\].*$/gim, "")
    .replace(/^.*\[fecha_vuelta\].*$/gim, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  if (!hasBasicDraftQuality(declaracionFinal)) {
    // Nunca cortar flujo por calidad; último saneado mínimo para continuidad operativa.
    const compact = splitBulletLines(declaracionFinal).filter(Boolean);
    declaracionFinal = (compact.length ? compact : [
      "– Se persona en estas dependencias en calidad de perjudicado, en relación a los hechos que se exponen a continuación.",
      "– Manifiesta que se deja constancia de los datos disponibles del hecho conforme a la información facilitada en esta comparecencia.",
      "– Expone que la cronología y el lugar constan según lo reseñado por la persona compareciente.",
      "– Relata la mecánica conocida y los perjuicios apreciados en el momento de la denuncia.",
      "– Informa sobre la situación de identificación y medios de prueba con los datos disponibles hasta la fecha.",
      "– Señala que la presente declaración podrá ampliarse con nuevos datos objetivos si resultan acreditados."
    ]).join("\n");
  }

  if (estanciaEventual && fechaVuelta) {
    const extraLine = `– Se significa que el compareciente se encuentra alojado en ${estanciaEventual} hasta el próximo día ${fechaVuelta}.`;
    const hasSeSignifica = /–\s*Se significa que el compareciente se encuentra alojado en/i.test(declaracionFinal);
    if (!hasSeSignifica) declaracionFinal = `${declaracionFinal}\n${extraLine}`;
  }

  return {
    status: "OK",
    declaracionFinal,
    gapsRemaining: [],
    hechos_ai: session.hechos_ai
  };
}
