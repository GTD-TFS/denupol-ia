
import { db, serverTimestamp } from "./firebase.js";
import { doc, setDoc } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";
import { GLOBAL_ROUTES, QUESTION_SETS } from "./question_es.js";
const EXPORT_KEY_MAP = QUESTION_SETS["EXPORT_KEY_MAP"] || {};
const $ = (id)=>document.getElementById(id);
const qs = new URLSearchParams(location.search);
const token = (qs.get("token")||"").trim();
const __MAP_LANG = (document.documentElement.lang || "es").toLowerCase();
function mapText(key){
  const mp = window.DenupolMapPicker;
  if (mp && typeof mp.t === "function") return mp.t(__MAP_LANG, key);
  const L = (__MAP_LANG||"en").toLowerCase();
  const lang = L.startsWith("es") ? "es" :
               L.startsWith("de") ? "de" :
               L.startsWith("it") ? "it" :
               L.startsWith("fr") ? "fr" :
               L.startsWith("ru") ? "ru" :
               L.startsWith("zh") ? "zh" :
               L.startsWith("ja") ? "ja" : "en";
  const fb = {
    es:{ pick_on_map:"Seleccionar en mapa", selected_none:"Sin coordenadas seleccionadas", selected_prefix:"Coordenadas", map_legend:"Si no conoce el nombre de la calle, utilice el mapa." },
    en:{ pick_on_map:"Pick on map", selected_none:"No coordinates selected", selected_prefix:"Coordinates", map_legend:"If you do not know the street name, use the map." },
    de:{ pick_on_map:"Auf Karte wählen", selected_none:"Keine Koordinaten ausgewählt", selected_prefix:"Koordinaten", map_legend:"Wenn Sie den Straßennamen nicht kennen, nutzen Sie die Karte." },
    it:{ pick_on_map:"Seleziona sulla mappa", selected_none:"Nessuna coordinata selezionata", selected_prefix:"Coordinate", map_legend:"Se non conosce il nome della via, usi la mappa." },
    fr:{ pick_on_map:"Sélectionner sur la carte", selected_none:"Aucune coordonnée sélectionnée", selected_prefix:"Coordonnées", map_legend:"Si vous ne connaissez pas le nom de la rue, utilisez la carte." },
    ru:{ pick_on_map:"Выбрать на карте", selected_none:"Координаты не выбраны", selected_prefix:"Координаты", map_legend:"Если вы не знаете название улицы, используйте карту." },
    zh:{ pick_on_map:"在地图上选择", selected_none:"未选择坐标", selected_prefix:"坐标", map_legend:"如果不知道街道名称，请使用地图。" },
    ja:{ pick_on_map:"地図で選択", selected_none:"座標が未選択です", selected_prefix:"座標", map_legend:"通り名が分からない場合は地図を使用してください。" }
  };
  return (fb[lang] && fb[lang][key]) || fb.en[key] || key;
}

function finalText(key){
  const L = (document.documentElement.lang || "es").toLowerCase();
  const lang = L.startsWith("es") ? "es" :
               L.startsWith("de") ? "de" :
               L.startsWith("it") ? "it" :
               L.startsWith("fr") ? "fr" :
               L.startsWith("ru") ? "ru" :
               L.startsWith("zh") ? "zh" :
               L.startsWith("ja") ? "ja" : "en";
  const m = {
    es:{ title:"Denuncia enviada correctamente", sub:"Este enlace ya no puede volver a utilizarse." },
    en:{ title:"Report submitted successfully", sub:"This link can no longer be used." },
    de:{ title:"Anzeige erfolgreich gesendet", sub:"Dieser Link kann nicht erneut verwendet werden." },
    it:{ title:"Denuncia inviata correttamente", sub:"Questo link non può più essere utilizzato." },
    fr:{ title:"Déclaration envoyée avec succès", sub:"Ce lien ne peut plus être utilisé." },
    ru:{ title:"Заявление успешно отправлено", sub:"Эта ссылка больше не может быть использована." },
    zh:{ title:"报案已成功提交", sub:"此链接已不能再次使用。" },
    ja:{ title:"届出が正常に送信されました", sub:"このリンクはこれ以上使用できません。" }
  };
  return (m[lang] && m[lang][key]) || m.en[key] || "";
}


const tipo = (qs.get("tipo")||"PATRIMONIO").trim().toUpperCase();
// === UI: overrides de etiqueta (solo visual; NO cambia valores internos) ===
const UI_ES_OVERRIDES = {
  "EXTRAVÍO/PÉRDIDA": "🧳 EXTRAVÍO/PÉRDIDA",
  "SUSTRACCIÓN": "🕵️ ROBO / HURTO",
  "DAÑOS": "🧱 DAÑOS",
  "ESTAFA / ESTAFA INFORMÁTICA": "💳 ESTAFA / ESTAFA INFORMÁTICA",
  "AGRESIÓN": "👊 AGRESIÓN",
  "AMENAZAS": "🗣️ AMENAZAS",
  "OTRO TIPO DE HECHO": "➡️ OTRO TIPO DE HECHO",
  "ALLANAMIENTO / USURPACIÓN": "🏠 ALLANAMIENTO / USURPACIÓN",
  "APROPIACIÓN INDEBIDA": "📦 APROPIACIÓN INDEBIDA",
  "COACCIONES": "🧷 COACCIONES",
  "CARÁCTER SEXUAL": "🔒 CARÁCTER SEXUAL",
  "DENUNCIA GENÉRICA": "🧩 DENUNCIA GENÉRICA"
};

// --- COMPAPOL: filiación cifrada (password fijo) ---
const __FILIACION_PASS = "adejegtd";

function buildLabelPublicoFromFiliacion(f){
  const nombre = ((f && f["Nombre"]) ? String(f["Nombre"]) : "").trim();
  const ap = ((f && f["Apellidos"]) ? String(f["Apellidos"]) : "").trim();
  const ap1 = (ap.split(/\s+/).filter(Boolean)[0] || "");
  if (nombre && ap1) return `${nombre} ${ap1[0].toUpperCase()}.`;
  return (nombre || ap1 || "(Sin nombre)");
}

function encryptFiliacionForCompapol(f){
  if (!window.CryptoJS || !CryptoJS.AES) throw new Error("Falta CryptoJS (AES). No se puede cifrar.");
  const plain = JSON.stringify(f || {});
  const data = CryptoJS.AES.encrypt(plain, __FILIACION_PASS).toString();
  return { meta_encrypted: true, data };
}

function applyTipoDocVisibility(){
  const sel = $("fTipoDoc");
  const box = document.getElementById("boxOtroDoc");
  if (!sel || !box) return;
  const v = (sel.value || "").trim();
  box.classList.toggle("hidden", v !== "Otro documento de Identidad");
}
$("fTipoDoc")?.addEventListener("change", applyTipoDocVisibility);
function normUp(s){
  // Quita tildes/diacríticos PERO conserva Ñ.
  // Truco: protegemos Ñ antes de normalizar y la restauramos al final.
  const mark = "__ENYE__";
  return (s||"").toString()
    .replace(/ñ/gi, mark)
    .normalize("NFD").replace(/[\u0300-\u036f]/g,"")
    .replace(new RegExp(mark, "g"), "Ñ")
    .toUpperCase().replace(/\s+/g," ").trim();
}

function getAllPaises(){
  const out = [];
  const P = (window.PAISES || null);
  if (!P) return out;
  if (Array.isArray(P.featured)) out.push(...P.featured);
  if (Array.isArray(P.groups)){
    for (const g of P.groups){
      if (g && Array.isArray(g.items)) out.push(...g.items);
    }
  }
  const seen = new Set();
  return out.map(normUp).filter(x=>x && !seen.has(x) && (seen.add(x), true));
}
const __PAISES_ALL = getAllPaises();
const __PAISES_SET = new Set(__PAISES_ALL);

function renderPillsFor(inputEl, hostEl, onPick){
  if (!inputEl || !hostEl) return;
  const paint = ()=>{
    const q = normUp(inputEl.value);
    hostEl.innerHTML = "";
    if (!q) return; // SIN píldoras rápidas: solo al escribir

    const list = __PAISES_ALL.filter(p=>p.includes(q)).slice(0, 18);

    for (const opt of list){
      if (opt === "DESCONOCIDO") continue;
      const b = document.createElement("button");
      b.type = "button";
      b.className = "choiceBtn";
      b.textContent = opt;
      b.dataset.value = opt;
      b.classList.toggle("isPicked", normUp(inputEl.value) === opt);
      b.addEventListener("click", ()=>{
        inputEl.value = opt;
        if (onPick) onPick(opt);
        paint();
      });
      hostEl.appendChild(b);
    }
  };
  inputEl.addEventListener("input", paint);
  inputEl.addEventListener("blur", ()=>{
    const v = normUp(inputEl.value);
    if (v && __PAISES_SET.has(v)) inputEl.value = v;
  });
  paint();
}

function fillProvincias(sel){
  const el = (typeof sel === "string") ? $(sel) : sel;
  if (!el) return;
  el.innerHTML = `<option value=""></option>`;
  const arr = Array.isArray(window.PROVINCIAS_ES) ? window.PROVINCIAS_ES : [];
  for (const p of arr){
    const o = document.createElement("option");
    o.value = p; o.textContent = p;
    el.appendChild(o);
  }
}

function fillMunicipios(prov, sel){
  const el = (typeof sel === "string") ? $(sel) : sel;
  if (!el) return;
  el.innerHTML = `<option value=""></option>`;
  const M0 = (window.MUNICIPIOS_ES && typeof window.MUNICIPIOS_ES === "object") ? window.MUNICIPIOS_ES
           : (window.MUNICIPIOS && typeof window.MUNICIPIOS === "object") ? window.MUNICIPIOS
           : {};
  const arr = Array.isArray(M0[prov]) ? M0[prov] : [];
  for (const m of arr){
    const o = document.createElement("option");
    o.value = m; o.textContent = m;
    el.appendChild(o);
  }
}

function computeLugarNacimiento(){
  const pais = normUp($("fNacPais")?.value);
  const hid = $("fNacLugar");
  const outProv = $("fNacProvOut");
  const outMun = $("fNacMunOut");
  if (!hid || !outProv || !outMun) return;

  outProv.value = "";
  outMun.value = "";

  if (!pais){ hid.value = ""; return; }

  if (pais !== "ESPAÑA"){
    hid.value = pais;
    return;
  }

  const prov = ($("fNacProv")?.value||"").trim();
  const mun  = ($("fNacMun")?.value||"").trim();

  if (prov) outProv.value = prov;
  if (mun) outMun.value = mun;

  if (prov && mun){
    hid.value = (prov === mun) ? `${mun}` : `${mun}, ${prov}`;
    if (prov === mun) outProv.value = ""; // “Madrid, Madrid” -> no repitas
    return;
  }
  hid.value = mun || prov || "ESPAÑA";
}

function toggleNacEsUI(){
  const pais = normUp($("fNacPais")?.value);
  const box = $("nacEsBox");
  if (!box) return;
  const isEs = (pais === "ESPAÑA");
  box.style.display = isEs ? "grid" : "none";
  if (isEs){
    fillProvincias("fNacProv");
    const prov = ($("fNacProv")?.value||"").trim();
    if (prov) fillMunicipios(prov, "fNacMun");
  }
  computeLugarNacimiento();
}

function renderNacPills(){
  renderPillsFor($("fNac"), $("nacPills"));                 // Nacionalidad
  renderPillsFor($("fNacPais"), $("nacPaisPills"), ()=>{    // País nacimiento
    toggleNacEsUI();
  });

  $("fNacPais")?.addEventListener("input", toggleNacEsUI);
  $("fNacPais")?.addEventListener("blur", toggleNacEsUI);

  $("fNacProv")?.addEventListener("change", ()=>{
    const prov = ($("fNacProv")?.value||"").trim();
    fillMunicipios(prov, "fNacMun");
    computeLugarNacimiento();
  });
  $("fNacMun")?.addEventListener("change", computeLugarNacimiento);

  // Domicilio: país + prov/mun si ES + dirección libre
  renderPillsFor($("fDomPais"), $("domPaisPills"), ()=>{ toggleDomEsUI(); });
  $("fDomPais")?.addEventListener("input", toggleDomEsUI);
  $("fDomPais")?.addEventListener("blur", toggleDomEsUI);
  $("fDomProv")?.addEventListener("change", ()=>{
    const prov = ($("fDomProv")?.value||"").trim();
    fillMunicipios(prov, "fDomMun");
  });
  $("fResideTfeSi")?.addEventListener("change", toggleResidenciaTenerife);
  $("fResideTfeNo")?.addEventListener("change", toggleResidenciaTenerife);
  $("fFechaVuelta")?.addEventListener("change", ()=>{});
  toggleResidenciaTenerife();
}

function toggleResidenciaTenerife(){
  const box = $("noResTfeBox");
  if (!box) return;
  const noRes = !!($("fResideTfeNo")?.checked);
  box.style.display = noRes ? "block" : "none";
  if (!noRes){
    if ($("fEstanciaEventual")) $("fEstanciaEventual").value = "";
    if ($("fFechaVuelta")) $("fFechaVuelta").value = "";
  }
}

function computeDomicilio(){
  const pais = normUp($("fDomPais")?.value);
  const dir  = ($("fDomDir")?.value||"").trim();

  if (!pais){
    return dir; // si no hay país, al menos deja la dirección
  }

  if (pais !== "ESPAÑA"){
    // "Direccion, Pais"
    return [dir, pais].filter(Boolean).join(", ");
  }

  const prov = ($("fDomProv")?.value||"").trim();
  const mun  = ($("fDomMun")?.value||"").trim();

  // "Direccion, Municipio, Provincia"
  const parts = [];
  if (dir) parts.push(dir);
  if (mun) parts.push(mun);
  if (prov) parts.push(prov);
  return parts.join(", ");
}

function toggleDomEsUI(){
  const pais = normUp($("fDomPais")?.value);
  const box = $("domEsBox");
  if (!box) return;
  const isEs = (pais === "ESPAÑA");
  box.style.display = isEs ? "grid" : "none";
  if (isEs){
    fillProvincias("fDomProv");
    const prov = ($("fDomProv")?.value||"").trim();
    if (prov) fillMunicipios(prov, "fDomMun");
  }
}
// =============================



// =============================
// Router GLOBAL (GLOBAL_ROUTES + QUESTION_SETS)
// =============================
function routeFromEntry(st){
  const pick = (st.caracteristica_hecho||"").trim();
  const t1 = (GLOBAL_ROUTES.ENTRY && GLOBAL_ROUTES.ENTRY[pick]) || null;
  if (t1 !== "OTRO_TIPO_HECHO") return t1;
  const pick2 = (st.caracteristica_hecho_p2||"").trim();
  return (GLOBAL_ROUTES.PAGE2 && GLOBAL_ROUTES.PAGE2[pick2]) || "OTRO_TIPO_HECHO";
}

function routeFromSustraccion(st){
  const pick = (st.sustraccion_donde||"").trim();
  return (GLOBAL_ROUTES.SUSTRACCION_SELECTOR && GLOBAL_ROUTES.SUSTRACCION_SELECTOR[pick]) || null;
}

function routeFromAgresion(st){
  const pick = (st.agresion_tipo||"").trim();
  return (GLOBAL_ROUTES.AGRESION_SELECTOR && GLOBAL_ROUTES.AGRESION_SELECTOR[pick]) || null;
}

function resolveLeafTipo(st){
  // GLOBAL_nt: devuelve el tipo final (leaf) según las selecciones actuales.
  let t = routeFromEntry(st);
  if (!t) return null;

  if (t === "SUSTRACCION_SELECTOR"){
    const t2 = routeFromSustraccion(st);
    return t2 || "SUSTRACCION_SELECTOR";
  }

  if (t === "AGRESION_SELECTOR"){
    const t2 = routeFromAgresion(st);
    return t2 || "AGRESION_SELECTOR";
  }

  return t;
}

function buildQuestionFlow(st){
  const out = [];

  // 1) Siempre empezamos por GLOBAL
  out.push(...(QUESTION_SETS["GLOBAL"] || []));

  // Defaults ANTES del routing (si no, el flujo se queda en GLOBAL y aparece FINALIZAR)
  if (!st.caracteristica_hecho){
    const q0 = QUESTION_SETS["GLOBAL"]?.[0];
    const def0 = q0?.options?.[0] || "";
    if (def0) st.caracteristica_hecho = def0;
  }

  // 2) ENTRY -> ...
  const pick = (st.caracteristica_hecho || "").trim();
  const t1base = (GLOBAL_ROUTES.ENTRY && GLOBAL_ROUTES.ENTRY[pick]) || null;
  if (!t1base) return out;

  if (t1base === "OTRO_TIPO_HECHO"){
    out.push(...(QUESTION_SETS["OTRO_TIPO_HECHO"] || []));
    if (!st.caracteristica_hecho_p2){
      const qx = QUESTION_SETS["OTRO_TIPO_HECHO"]?.[0];
      const defx = qx?.options?.[0] || "";
      if (defx) st.caracteristica_hecho_p2 = defx;
    }
    const pick2 = (st.caracteristica_hecho_p2 || "").trim();
    const t2 = (GLOBAL_ROUTES.PAGE2 && GLOBAL_ROUTES.PAGE2[pick2]) || null;
    if (t2 && QUESTION_SETS[t2]) out.push(...QUESTION_SETS[t2]);
    return out;
  }

  const t1 = routeFromEntry(st);
  if (t1 && QUESTION_SETS[t1]) out.push(...QUESTION_SETS[t1]);

  if (t1 === "SUSTRACCION_SELECTOR"){
    if (!st.sustraccion_donde){
      const q1 = QUESTION_SETS["SUSTRACCION_SELECTOR"]?.[0];
      const def1 = q1?.options?.[0] || "";
      if (def1) st.sustraccion_donde = def1;
    }
    const t2 = routeFromSustraccion(st);
    if (t2 && QUESTION_SETS[t2]) out.push(...QUESTION_SETS[t2]);
    return out;
  }

  if (t1 === "AGRESION_SELECTOR"){
    if (!st.agresion_tipo){
      const q2 = QUESTION_SETS["AGRESION_SELECTOR"]?.[0];
      const def2 = q2?.options?.[0] || "";
      if (def2) st.agresion_tipo = def2;
    }
    const t2 = routeFromAgresion(st);
    if (t2 && QUESTION_SETS[t2]) out.push(...QUESTION_SETS[t2]);
    return out;
  }

  return out;
}

function getQuestionsFor(){
  // Mantengo el nombre para no romper el resto: ahora ignora "tipo" y usa GLOBAL_ROUTES.
  return buildQuestionFlow(wiz.st);
}

function currentTipoFinal(){
  return resolveLeafTipo(wiz.st) || "GLOBAL";
}

// =============================
// Estado wizard
// =============================
let objetosState = [];
let objetosNoValorMode = false;
let autoresStateByKey = {};
let currentAuthorsKey = "";
const OBJETO_TIPO_OPTIONS = [
  "MÓVIL",
  "CARTERA / MONEDERO",
  "DOCUMENTACIÓN",
  "JOYAS",
  "EFECTIVO",
  "HERRAMIENTA",
  "BICICLETA",
  "PATINETE",
  "PORTÁTIL / TABLET",
  "MOCHILA / BOLSO",
  "OTRO"
];
const AUTOR_SEXO_OPTIONS = ["HOMBRE", "MUJER", "NO DETERMINADO"];
const AUTOR_EDAD_OPTIONS = ["<20","20-25","25-30","30-40","40-50","50-60",">60"];
const AUTOR_CONSTITUCION_OPTIONS = ["DELGADA","NORMAL","FUERTE/CORPULENTA","ATLÉTICA","NO DETERMINADA"];
const AUTOR_ALTURA_OPTIONS = ["<160","160-170","170-180","180-190",">190","NO DETERMINADA"];
const wiz = {
  idx: 0,                 // 0 = filiación (pantalla fija)
  steps: [],              // [{q, el, inputEl?}]
  st: {                   // respuestas
    // GLOBAL
    caracteristica_hecho:"",
    caracteristica_hecho_p2:"",

    // SELECTORES
    sustraccion_donde:"",
    agresion_tipo:"",

    // RESTO
    calidad_denunciante:"PERJUDICADO",
    conocimiento_hecho:"",
    fecha:"",
    hora:"",
    hora_desde:"",
    hora_hasta:"",
    lugar:"",
    lugar_coords:null,
    conoce_autor:"",
    datos_autor:"",
    descripcion_autor:"",
    interaccion_autor:"",
    autor_retenido:"",
    lesiones:"NO",
    parte_medico:"NO",
    camaras:"NO",
    camaras_detalle:"",
    resumen:""
  }
};

function storageKey(){ return "pred_GLOBAL_"+token; }

function readFiliacion(){
  return {
  "Nombre": ($("fNombre").value||"").trim(),
"Apellidos": ($("fApellidos").value||"").trim().toUpperCase(),
  "Tipo de documento": ($("fTipoDoc").value||"").trim(),
  "Otro documento": ($("fTipoDoc").value||"").trim() === "Otro documento de Identidad" ? ($("fOtroDoc").value||"").trim() : "",
  "Nº Documento": ($("fNumDoc").value||"").trim(),
  "Sexo": ($("fSexo").value||"").trim(),
  "Nacionalidad": ($("fNac").value||"").trim(),
  "Nombre de los Padres": ($("fPadres").value||"").trim(),
  "Fecha de nacimiento": ($("fNacFecha").value||"").trim(),
  "País nacimiento": ($("fNacPais").value||"").trim(),
  "Lugar de nacimiento": ($("fNacLugar").value||"").trim(),
  "Provincia nacimiento": ($("fNacProvOut").value||"").trim(),
  "Municipio nacimiento": ($("fNacMunOut").value||"").trim(),
  "Domicilio": computeDomicilio(),
  "Teléfono": ($("fTel").value||"").trim(),
  "Condición": (wiz.st.calidad_denunciante||"").trim()
};
}
function buildHechosAskedOnly(){
  const out = {};
  const qs = getQuestionsFor();

  for (const q of qs){
    if (!shouldShowQuestion(q)) continue;

    // FHL: exporta sus campos asociados si no están vacíos
    if (q.type === "fhl"){
      const f = (wiz.st.fecha||"").trim(); if (f) out.fecha = f;
      const l = (wiz.st.lugar||"").trim(); if (l) out.lugar = l;

      const h  = (wiz.st.hora||"").trim();       if (h)  out.hora = h;
      const hd = (wiz.st.hora_desde||"").trim(); if (hd) out.hora_desde = hd;
      const hh = (wiz.st.hora_hasta||"").trim(); if (hh) out.hora_hasta = hh;
      continue;
    }

    // Objects: exporta solo si hay objetos
    if (q.type === "objects"){
      const key = q.key || "objetos";
      if (objetosState.length) out[key] = objetosState.slice();
      continue;
    }
    if (q.type === "authors"){
      const arr = autoresStateByKey[q.key] || [];
      if (arr.length) out[q.key] = arr.slice();
      continue;
    }
    if (q.type === "group"){
      const items = Array.isArray(q.items) ? q.items : [];
      for (const it of items){
        if (!it || !it.key) continue;
        if (typeof it.when === "function"){
          let ok = false;
          try{ ok = !!it.when(wiz.st); }catch(_){ ok = false; }
          if (!ok) continue;
        }
        const v = wiz.st[it.key];
        if (v === undefined || v === null) continue;
        const s = String(v).trim();
        if (!s) continue;
        out[it.key] = s;
      }
      continue;
    }

    // Resto: key => valor si no está vacío
    const k = q.key;
    if (!k) continue;
    const v = wiz.st[k];
    if (v === undefined || v === null) continue;
    const s = String(v).trim();
    if (!s) continue;
    out[k] = s;
  }

  // En LESIONES y AGRESIÓN (familiar/afectivo) no se pregunta "conocimiento_hecho".
  // Si viene arrastrado por carga previa, NO lo exportes.
if ($("fResideTfeNo")?.checked){
  const est = ($("fEstanciaEventual")?.value||"").trim();
  const fv = ($("fFechaVuelta")?.value||"").trim();
  if (est) out.estancia_eventual = est;
  if (fv) out.fecha_vuelta = fv;
}

  try{
    const tipoFinal = currentTipoFinal();
    if (tipoFinal === "LESIONES" || tipoFinal === "AGRESION_FAMILIAR_AFECTIVO"){
      delete out.conocimiento_hecho;
      delete out.hecho_conocimiento; // por si algún flujo lo metió ya renombrado
    }
  }catch(_){ }

  return out;
}
function buildPayload(){
  const filiacion = readFiliacion();
  if ($("fResideTfeNo")?.checked){
    const est = ($("fEstanciaEventual")?.value||"").trim();
    const fv = ($("fFechaVuelta")?.value||"").trim();
    if (est) filiacion["estancia_eventual"] = est;
    if (fv) filiacion["fecha_vuelta"] = fv;
  }
  return {
    meta: { tipo_delictivo: currentTipoFinal(), token, version: 2, createdAt: new Date().toISOString() },
    filiacion,
    hechos: exportForChatGPT(buildHechosAskedOnly())
  };
}
function exportForChatGPT(state, map = EXPORT_KEY_MAP){
  const has = (o,k)=> Object.prototype.hasOwnProperty.call(o,k);
  const isObj = (v)=> v && typeof v === "object" && !Array.isArray(v);

  const rec = (v)=>{
    if (Array.isArray(v)) return v.map(rec).filter(x => x !== undefined);
    if (isObj(v)){
      const out = {};
      for (const k of Object.keys(v)){
        const x = rec(v[k]);
        // NO filtra "NO": solo quita undefined/null/"" y objetos/arrays vacíos
        if (x === undefined || x === null || x === "") continue;
        if (Array.isArray(x) && x.length === 0) continue;
        if (isObj(x) && Object.keys(x).length === 0) continue;
        out[k] = x;
      }
      return out;
    }
    return v;
  };

  const out = {};
  for (const k of Object.keys(state)){
    if (!has(state, k)) continue;               // solo preguntas realmente respondidas
    const v = rec(state[k]);
    if (v === undefined || v === null || v === "") continue;
    if (Array.isArray(v) && v.length === 0) continue;
    if (isObj(v) && Object.keys(v).length === 0) continue;
    out[map[k] || k] = v;                       // renombra a clave “entendible”
  }
  return out;
}

function shouldShowQuestion(q){
  if (typeof q.when === "function"){
    try{ return !!q.when(wiz.st); }catch(_){ return false; }
  }
  return true;
}

function setStatus(t){
  const el = $("wizStatus");
  if (el) el.textContent = t || "";
}

function showToast(msg){
  const text = String(msg||"").trim();
  if (!text) return;
  let t = document.getElementById("wizToast");
  if (!t){
    t = document.createElement("div");
    t.id = "wizToast";
    t.className = "toastMsg";
    document.body.appendChild(t);
  }
  t.textContent = text;
  t.classList.add("show");
  clearTimeout(showToast._tmr);
  showToast._tmr = setTimeout(()=> t.classList.remove("show"), 1800);
}

function msgUI(s){
  return (typeof trUI === "function") ? trUI(s) : s;
}

function failValidation(msg){
  const m = msgUI(msg);
  setStatus(m);
  showToast(m);
  return false;
}

// =============================
// Render pasos dinámicos
// =============================
function makeStepEl(q){
  const wrap = document.createElement("div");
  wrap.className = "step";
  wrap.dataset.key = q.key;

  const title = document.createElement("div");
  title.className = "stepTitle";
  title.textContent = q.title;
  wrap.appendChild(title);

  let inputEl = null;

  if (q.type === "select"){
    const panel = document.createElement("div");
    panel.className = "stepPanel";

    const box = document.createElement("div");
    box.className = "choices pills";

    const current = (wiz.st[q.key] || "").trim();
    const def = (q.options && q.options[0]) ? q.options[0] : "";
    const initial = current || def;
    if (!wiz.st[q.key] && initial) wiz.st[q.key] = initial;

    for (const opt of (q.options||[])){
      const b = document.createElement("button");
      b.type = "button";
      b.className = "choiceBtn";
      const uiLabel = (UI_ES_OVERRIDES && UI_ES_OVERRIDES[opt]) ? UI_ES_OVERRIDES[opt] : opt;
      b.textContent = uiLabel;
      b.dataset.value = opt;
      b.classList.toggle("isPicked", opt === wiz.st[q.key]);
      b.addEventListener("click", ()=>{
        wiz.st[q.key] = opt;
        // refresca resaltado
        box.querySelectorAll(".choiceBtn").forEach(x=>x.classList.toggle("isPicked", x.dataset.value === opt));
        // Recalcula flujo GLOBAL (GLOBAL -> selectores -> leaf)
        renderWizard();
      });
      box.appendChild(b);
    }

    panel.appendChild(box);
    wrap.appendChild(panel);
    inputEl = box.querySelector(".choiceBtn.isPicked") || box.querySelector(".choiceBtn") || null;
  }

  // --- FHL wizard step (Fecha + Hora + Lugar) ---
  if (q.type === "fhl"){
    const panel = document.createElement("div");
    panel.className = "stepPanel";

    const g = document.createElement("div");
    g.className = "grid";
    const isInterval = (q.interval === true) || (q.intervalo === true);

    const w1 = document.createElement("div");
    const l1 = document.createElement("label");
    l1.textContent = "Fecha";
    const i1 = document.createElement("input");
    i1.type = "date";
    i1.id = "q_fecha";
    i1.value = wiz.st.fecha || "";
    i1.addEventListener("input", ()=>{ wiz.st.fecha = i1.value; });
    w1.appendChild(l1);
    w1.appendChild(i1);

    // hora/interval
    let w2 = null;
    let w2b = null;

    if (isInterval){
      // Dos campos independientes (DESDE / HASTA) para que siempre se vean.
      w2 = document.createElement("div");
      const l2a = document.createElement("label");
      l2a.textContent = "Hora (desde)";
      const i2a = document.createElement("input");
      i2a.type = "time";
      i2a.id = "q_hora_desde";
      i2a.value = wiz.st.hora_desde || "";
      i2a.addEventListener("input", ()=>{
        wiz.st.hora_desde = i2a.value;
        wiz.st.hora = (wiz.st.hora_desde && wiz.st.hora_hasta) ? (wiz.st.hora_desde + " - " + wiz.st.hora_hasta) : "";
      });
      w2.appendChild(l2a);
      w2.appendChild(i2a);

      w2b = document.createElement("div");
      const l2b = document.createElement("label");
      l2b.textContent = "Hora (hasta)";
      const i2b = document.createElement("input");
      i2b.type = "time";
      i2b.id = "q_hora_hasta";
      i2b.value = wiz.st.hora_hasta || "";
      i2b.addEventListener("input", ()=>{
        wiz.st.hora_hasta = i2b.value;
        wiz.st.hora = (wiz.st.hora_desde && wiz.st.hora_hasta) ? (wiz.st.hora_desde + " - " + wiz.st.hora_hasta) : "";
      });
      w2b.appendChild(l2b);
      w2b.appendChild(i2b);

    } else {
      w2 = document.createElement("div");
      const l2 = document.createElement("label");
      l2.textContent = "Hora";
      const i2 = document.createElement("input");
      i2.type = "time";
      i2.id = "q_hora";
      i2.value = wiz.st.hora || "";
      i2.addEventListener("input", ()=>{ 
        wiz.st.hora = i2.value;
        wiz.st.hora_desde = "";
        wiz.st.hora_hasta = "";
      });
      w2.appendChild(l2);
      w2.appendChild(i2);

      w2b = document.createElement("div");
      const l2b = document.createElement("label");
      l2b.textContent = "Hora (hasta, si ocurre en un periodo de tiempo)";
      const i2b = document.createElement("input");
      i2b.type = "time";
      i2b.id = "q_hora_hasta_opt";
      i2b.value = wiz.st.hora_hasta || "";
      i2b.addEventListener("input", ()=>{
        wiz.st.hora_hasta = i2b.value;
        wiz.st.hora = wiz.st.hora_hasta ? `${i2.value || ""} - ${wiz.st.hora_hasta}`.trim() : (i2.value || "");
      });
      w2b.appendChild(l2b);
      w2b.appendChild(i2b);
    }

    const w3 = document.createElement("div");
    w3.style.gridColumn = "1/-1";
    const l3 = document.createElement("label");
    l3.textContent = "Lugar";
    const i3 = document.createElement("input");
    i3.type = "text";
    i3.id = "q_lugar";
    i3.placeholder = q.placeholderLugar || "";
    i3.value = wiz.st.lugar || "";
    i3.addEventListener("input", ()=>{ wiz.st.lugar = i3.value; });

    const mapRow = document.createElement("div");
    mapRow.className = "row";
    mapRow.style.marginTop = "8px";

    const mapBtn = document.createElement("button");
    mapBtn.type = "button";
    mapBtn.className = "btn secondary";
    mapBtn.textContent = mapText("pick_on_map");

    const mapInfo = document.createElement("div");
    mapInfo.className = "muted";
    mapInfo.style.fontSize = "11px";

    const mapLegend = document.createElement("div");
    mapLegend.className = "muted";
    mapLegend.style.fontSize = "11px";
    mapLegend.style.marginTop = "6px";
    mapLegend.textContent = mapText("map_legend");

    const paintCoords = ()=>{
      const c = wiz.st.lugar_coords;
      if (c && Number.isFinite(+c.lat) && Number.isFinite(+c.lng)) {
        mapInfo.textContent = mapText("selected_prefix") + ": " + (+c.lat).toFixed(6) + ", " + (+c.lng).toFixed(6);
      } else {
        mapInfo.textContent = "";
      }
    };

    mapBtn.addEventListener("click", async ()=>{
      try{
        const mp = window.DenupolMapPicker;
        if (!mp || typeof mp.open !== "function") return;
        const cur = wiz.st.lugar_coords || {};
        const picked = await mp.open({
          lang: __MAP_LANG,
          lat: Number.isFinite(+cur.lat) ? +cur.lat : undefined,
          lng: Number.isFinite(+cur.lng) ? +cur.lng : undefined
        });
        if (!picked) return;
        wiz.st.lugar_coords = { lat:+picked.lat, lng:+picked.lng };
        if (picked.label) {
          i3.value = picked.label;
          wiz.st.lugar = picked.label;
        }
        paintCoords();
      }catch(_){}
    });

    mapRow.appendChild(mapBtn);
    mapRow.appendChild(mapInfo);
    paintCoords();

    w3.appendChild(l3);
    w3.appendChild(i3);
    w3.appendChild(mapRow);
    w3.appendChild(mapLegend);

    g.appendChild(w1);
    if (w2) g.appendChild(w2);
    if (w2b) g.appendChild(w2b);
    g.appendChild(w3);

    panel.appendChild(g);
    wrap.appendChild(panel);
    inputEl = i1;
  }

  if (q.type === "date" || q.type === "time"){
    const inp = document.createElement("input");
    inp.type = q.type;
    inp.id = "q_"+q.key;
    inp.value = wiz.st[q.key] || "";
    inp.addEventListener("input", ()=>{ wiz.st[q.key] = inp.value; });
    wrap.appendChild(inp);
    inputEl = inp;
  }

  if (q.type === "text"){
    const inp = document.createElement("input");
    inp.type = "text";
    inp.id = "q_"+q.key;
    inp.placeholder = q.placeholder || "";
    inp.value = wiz.st[q.key] || "";
    inp.addEventListener("input", ()=>{ wiz.st[q.key] = inp.value; });
    wrap.appendChild(inp);
    inputEl = inp;
  }

  if (q.type === "textarea"){
    const ta = document.createElement("textarea");
    ta.id = "q_"+q.key;
    ta.placeholder = q.placeholder || "";
    if (q.max) ta.maxLength = q.max;
    ta.value = wiz.st[q.key] || "";
    if (q.key === "resumen") ta.style.minHeight = "260px";
    ta.addEventListener("input", ()=>{ wiz.st[q.key] = ta.value; });
    wrap.appendChild(ta);
    inputEl = ta;
  }

  if (q.type === "objects"){
    const row = document.createElement("div");
    row.className = "row";
    row.style.justifyContent = "space-between";

    const b = document.createElement("button");
    b.className = "btn secondary";
    b.type = "button";
    b.id = "q_objBtn";
    b.textContent = "AÑADIR / EDITAR OBJETOS";
    b.addEventListener("click", ()=> openObjs(!!q.noValue));

    const c = document.createElement("div");
    c.className = "muted";
    c.id = "q_objCount";
    c.textContent = String(objetosState.length);

    row.appendChild(b);
    row.appendChild(c);
    wrap.appendChild(row);

  }
  if (q.type === "authors"){
    const row = document.createElement("div");
    row.className = "row";
    row.style.justifyContent = "space-between";
    const b = document.createElement("button");
    b.className = "btn secondary";
    b.type = "button";
    b.textContent = "AÑADIR / EDITAR AUTORES";
    b.addEventListener("click", ()=> openAuthors(q.key));
    const c = document.createElement("div");
    c.className = "muted";
    c.textContent = String((autoresStateByKey[q.key] || []).length);
    row.appendChild(b);
    row.appendChild(c);
    wrap.appendChild(row);
  }
  if (q.type === "group"){
    const panel = document.createElement("div");
    panel.className = "stepPanel";
    const g = document.createElement("div");
    g.className = "grid";
    const itemWrap = new Map();

    const isItemVisible = (it)=>{
      if (typeof it.when === "function"){
        try{ return !!it.when(wiz.st); }catch(_){ return false; }
      }
      return true;
    };
    const refreshItemVisibility = ()=>{
      for (const it of (q.items || [])){
        const w = itemWrap.get(it.key);
        if (!w) continue;
        w.style.display = isItemVisible(it) ? "" : "none";
      }
    };

    for (const it of (q.items || [])){
      if (!it || !it.key) continue;
      const w = document.createElement("div");
      if (it.fullRow) w.style.gridColumn = "1/-1";

      const l = document.createElement("label");
      l.textContent = it.title || "";
      w.appendChild(l);

      if (it.type === "select"){
        const sel = document.createElement("select");
        const options = Array.isArray(it.options) ? it.options : [];
        if (!wiz.st[it.key] && options[0]) wiz.st[it.key] = options[0];
        sel.innerHTML = options.map(v=>`<option value="${v}">${v}</option>`).join("");
        sel.value = wiz.st[it.key] || "";
        sel.addEventListener("change", ()=>{
          wiz.st[it.key] = sel.value;
          refreshItemVisibility();
          renderWizard();
        });
        w.appendChild(sel);
        if (!inputEl) inputEl = sel;
      } else if (it.type === "textarea"){
        const ta = document.createElement("textarea");
        ta.placeholder = it.placeholder || "";
        if (it.max) ta.maxLength = it.max;
        ta.value = wiz.st[it.key] || "";
        ta.addEventListener("input", ()=>{ wiz.st[it.key] = ta.value; refreshItemVisibility(); });
        w.appendChild(ta);
        if (!inputEl) inputEl = ta;
      } else if (it.type === "date" || it.type === "time"){
        const inp = document.createElement("input");
        inp.type = it.type;
        inp.value = wiz.st[it.key] || "";
        inp.addEventListener("input", ()=>{ wiz.st[it.key] = inp.value; refreshItemVisibility(); });
        w.appendChild(inp);
        if (!inputEl) inputEl = inp;
      } else {
        const inp = document.createElement("input");
        inp.type = "text";
        inp.placeholder = it.placeholder || "";
        inp.value = wiz.st[it.key] || "";
        inp.addEventListener("input", ()=>{ wiz.st[it.key] = inp.value; refreshItemVisibility(); });
        w.appendChild(inp);
        if (!inputEl) inputEl = inp;
      }

      itemWrap.set(it.key, w);
      g.appendChild(w);
    }

    panel.appendChild(g);
    wrap.appendChild(panel);
    refreshItemVisibility();
  }

  return { el: wrap, inputEl };
}

function renderWizard(){
  const dyn = $("dynSteps");
  dyn.innerHTML = "";

  const qs = getQuestionsFor();
  wiz.steps = [];

  for (const q of qs){
    const { el, inputEl } = makeStepEl(q);
    dyn.appendChild(el);
    wiz.steps.push({ q, el, inputEl });
  }

  // Si el flujo cambia (GLOBAL_ROUTES), asegúrate de que el índice actual sigue siendo válido y visible.
  const last = lastRealStep();
  if (wiz.idx > last) wiz.idx = last;
  if (wiz.idx < 0) wiz.idx = 0;
  if (!isRealStepVisible(wiz.idx)){
    const n = nextVisibleReal(wiz.idx);
    const p = prevVisibleReal(wiz.idx);
    wiz.idx = (n !== null) ? n : (p !== null) ? p : 0;
  }

  updateStepUI(false);
}

function totalVisibleSteps(){
  // paso 0 (filiación) + visibles de preguntas
  let n = 1;
  for (const s of wiz.steps){
    if (shouldShowQuestion(s.q)) n++;
  }
  return n;
}

function visibleStepIndices(){
  // índices lógicos: 0=filiación, 1..N preguntas visibles en orden
  const out = [0];
  let k = 1;
  for (const s of wiz.steps){
    if (shouldShowQuestion(s.q)) out.push(k);
    k++;
  }
  return out;
}

function logicalToRealIndex(logicalIdx){
  // logicalIdx: 0=filiación; 1.. = orden de preguntas (incluye ocultas)
  // Aquí usamos wiz.idx como índice REAL: 0=filiación, 1..=posición en wiz.steps
  // Mantendremos wiz.idx como REAL.
  return logicalIdx;
}

function firstRealStep(){ return 0; }
function lastRealStep(){ return wiz.steps.length; }

function isRealStepVisible(realIdx){
  if (realIdx === 0) return true;
  const s = wiz.steps[realIdx-1];
  if (!s) return false;
  return shouldShowQuestion(s.q);
}

function nextVisibleReal(from){
  for (let i = from+1; i <= lastRealStep(); i++){
    if (isRealStepVisible(i)) return i;
  }
  return null;
}

function prevVisibleReal(from){
  for (let i = from-1; i >= firstRealStep(); i--){
    if (isRealStepVisible(i)) return i;
  }
  return null;
}

function updateProgress(){
  const total = totalVisibleSteps();
  // posición visible actual
  let pos = 1;
  if (wiz.idx === 0){
    pos = 1;
  } else {
    // cuenta visibles hasta wiz.idx
    pos = 1;
    for (let i = 1; i <= wiz.idx; i++){
      if (isRealStepVisible(i)) pos++;
    }
  }
  const p = $("wizProgress");
  if (p) p.textContent = `Paso ${pos} de ${total}`;
}

function updateStepUI(focus){
  // Mostrar/ocultar la sección de filiación fuera del wizard
  const bf = document.getElementById("boxFiliacion");
  if (bf) bf.classList.toggle("isHidden", wiz.idx !== 0);
  const isMobile = window.matchMedia("(max-width:720px)").matches;
  const lockScroll = (wiz.idx !== 0) && isMobile;
  document.body.classList.toggle("noScroll", lockScroll);

  // Título superior (donde estaba "Predenuncia")
  const pt = document.getElementById("pageTitle");
  if (pt){
    if (wiz.idx === 0){
      pt.textContent = "Datos de filiación";
    } else {
      const s = wiz.steps[wiz.idx-1];
      pt.textContent = (s && s.q && s.q.title) ? String(s.q.title) : "";
    }
  }

  // Pasos dinámicos
  for (let i=0;i<wiz.steps.length;i++){
    const realIdx = i+1;
    const isActive = (wiz.idx === realIdx);
    wiz.steps[i].el.classList.toggle("isActive", isActive);
  }

  // Botones
  const prev = $("btnPrev");
  const next = $("btnNext");
  const fin = $("btnFinish");

  const hasPrev = prevVisibleReal(wiz.idx) !== null;
  prev.disabled = !hasPrev;

  // En la pantalla de filiación (idx 0) SIEMPRE mostramos SIGUIENTE y ocultamos FINALIZAR.
  // Evita que un fallo de cálculo de visibilidad deje al usuario con FINALIZAR desde el inicio.
  if (wiz.idx === 0){
    next.style.display = "inline-block";
    fin.style.display = "none";
  } else {
    const hasNext = nextVisibleReal(wiz.idx) !== null;
    next.style.display = hasNext ? "inline-block" : "none";
    fin.style.display = hasNext ? "none" : "inline-block";
  }

  updateProgress();

  // SIN AUTOFOCUS
// El teclado, calendario o reloj solo se abre si el usuario toca el campo
}

function isGtdBypass(){
  const n1 = (($("fNombre")?.value)||"" ).trim();
  const n2 = (($("fApellidos")?.value)||"" ).trim();
  return /gtd/i.test((n1 + " " + n2).trim());
}

function validateCurrentStep(){
  if (isGtdBypass()) return true;
  setStatus("");

  if (wiz.idx === 0){
    const nombre = ($("fNombre")?.value||"").trim();
    const apellidos = ($("fApellidos")?.value||"").trim();
    const tipoDoc = ($("fTipoDoc")?.value||"").trim();
    const otroDoc = ($("fOtroDoc")?.value||"").trim();
    const numDoc = ($("fNumDoc")?.value||"").trim();
    const sexo = ($("fSexo")?.value||"").trim();
    const fechaNac = ($("fNacFecha")?.value||"").trim();
    const dir = ($("fDomDir")?.value||"").trim();

    const isIndoc = /INDOCUMENTAD/.test(normUp(tipoDoc));

    if (!nombre || !apellidos || !tipoDoc || !sexo || !fechaNac || !dir){
      return failValidation("Completa los campos obligatorios para continuar.");
    }

    if (tipoDoc === "Otro documento de Identidad" && !otroDoc){
      return failValidation("Indica cuál es el otro documento de identidad.");
    }

    if (!isIndoc && !numDoc){
      return failValidation("El número de documento es obligatorio salvo que seleccione Indocumentado/Indocumentada.");
    }

    if (tipoDoc === "DNI" && /^[A-Za-z]/.test(numDoc)){
      return failValidation("Si el número empieza por letra corresponde a NIE. Seleccione NIE como tipo de documento.");
    }

    const canonCountry = (v)=> (typeof canonicalCountry === "function") ? canonicalCountry(v) : normUp(v);

    const nat = canonCountry($("fNac")?.value);
    if (!nat || !__PAISES_SET.has(nat)) return failValidation("Selecciona una NACIONALIDAD válida (usa las píldoras).");

    const paisNac = canonCountry($("fNacPais")?.value);
    if (!paisNac || !__PAISES_SET.has(paisNac)) return failValidation("Selecciona un PAÍS de nacimiento válido (usa las píldoras).");

    if (paisNac === "ESPAÑA") {
      const prov = ($("fNacProv")?.value||"").trim();
      const mun = ($("fNacMun")?.value||"").trim();
      if (!prov || !mun) return failValidation("Si el país de nacimiento es ESPAÑA, selecciona PROVINCIA y MUNICIPIO.");
    }

    const paisDom = canonCountry($("fDomPais")?.value);
    if (!paisDom || !__PAISES_SET.has(paisDom)) return failValidation("Selecciona un país de DOMICILIO válido (usa las píldoras).");

    if (paisDom === "ESPAÑA") {
      const provD = ($("fDomProv")?.value||"").trim();
      const munD = ($("fDomMun")?.value||"").trim();
      if (!provD || !munD) return failValidation("Si el domicilio es ESPAÑA, selecciona PROVINCIA y MUNICIPIO.");
    }

    if ($("fResideTfeNo")?.checked){
      const est = ($("fEstanciaEventual")?.value||"").trim();
      const fv = ($("fFechaVuelta")?.value||"").trim();
      if (!est || !fv) return failValidation("Si no reside en Tenerife, complete estancia eventual y fecha prevista de regreso.");
    }

    return true;
  }

  const s = wiz.steps[wiz.idx-1];
  if (!s) return true;
  return true;
}

function goTo(realIdx){
  wiz.idx = realIdx;
  updateStepUI(false);
}

$("btnPrev").addEventListener("click", ()=>{
  const p = prevVisibleReal(wiz.idx);
  if (p !== null) goTo(p);
});

$("btnNext").addEventListener("click", async ()=>{
  const bypass = isGtdBypass();
  if (!bypass && !validateCurrentStep()) return;

  let n = nextVisibleReal(wiz.idx);
  if (n === null && wiz.idx === 0){
    n = nextVisibleReal(0);
    if (n === null && wiz.steps.length) n = 1;
  }

  if (wiz.idx === 0 && n !== null){
    try{ await saveInitialPredenuncia(); }catch(err){ console.warn("saveInitialPredenuncia", err); }
  }

  if (n !== null) goTo(n);
});

$("btnFinish").addEventListener("click", async ()=>{
  await saveFinal();
});

// =============================
// Objetos modal (se mantiene)
// =============================
function updateObjsCount(){
  const n = objetosState.length;
  const el = $("objsCount");
  if (el) el.textContent = String(n);
  const el2 = $("q_objCount");
  if (el2) el2.textContent = String(n);
}

function openObjs(noValueMode = false){
  objetosNoValorMode = !!noValueMode;
  renderObjs();
  const b = $("objsBack");
  if (b) b.style.display = "flex";
}
function closeObjs(){
  const b = $("objsBack");
  if (b) b.style.display = "none";
}

function renderObjs(){
  const list = $("objsList");
  if (!list) return;
  list.innerHTML = "";

  if (!objetosState.length){
    const empty = document.createElement("div");
    empty.className = "muted";
    empty.textContent = "Sin objetos.";
    list.appendChild(empty);
    return;
  }

  objetosState.forEach((o, idx)=>{
    if (!o.tipo_catalogo){
      const t = String(o.tipo || "").trim().toUpperCase();
      if (OBJETO_TIPO_OPTIONS.includes(t)) o.tipo_catalogo = t;
      else if (t) { o.tipo_catalogo = "OTRO"; o.descripcion = o.descripcion || o.tipo; }
      else o.tipo_catalogo = "";
    }
    const row = document.createElement("div");
    row.className = "objRow";
    if (objetosNoValorMode) row.classList.add("noValue");

    const card = document.createElement("div");
    card.className = "objCard";

    const tipoI = document.createElement("select");
    tipoI.className = "objTipo";
    tipoI.innerHTML = `<option value=""></option>${OBJETO_TIPO_OPTIONS.map(v=>`<option value="${v}">${v}</option>`).join("")}`;
    tipoI.value = o.tipo_catalogo || "";
    tipoI.addEventListener("change", ()=>{
      o.tipo_catalogo = tipoI.value;
      if (o.tipo_catalogo !== "MÓVIL") o.marca_modelo = "";
      syncObjectTipo(o);
      renderObjs();
    });

    const cantI = document.createElement("input");
    cantI.className = "objCant";
    cantI.placeholder = "Cantidad";
    cantI.inputMode = "numeric";
    cantI.value = o.cantidad || "";
    cantI.addEventListener("input", ()=>{ o.cantidad = cantI.value; });

    const valI = document.createElement("input");
    valI.className = "objVal";
    valI.placeholder = "Valor total (€)";
    valI.inputMode = "numeric";
    valI.value = o.valor_total_eur || "";
    valI.addEventListener("input", ()=>{ o.valor_total_eur = valI.value; });
    const descI = document.createElement("input");
    descI.style.gridColumn = "1/-1";
    descI.placeholder = "Descripción del objeto";
    descI.value = o.descripcion || "";
    descI.addEventListener("input", ()=>{ o.descripcion = descI.value; syncObjectTipo(o); });
    const serialI = document.createElement("input");
    serialI.style.gridColumn = "1/-1";
    serialI.placeholder = "Nº serie / IMEI (opcional)";
    serialI.value = o.numero_serie_imei || "";
    serialI.addEventListener("input", ()=>{ o.numero_serie_imei = serialI.value; });
    const marcaI = document.createElement("input");
    marcaI.style.gridColumn = "1/-1";
    marcaI.placeholder = "Marca / modelo (si es móvil)";
    marcaI.value = o.marca_modelo || "";
    marcaI.addEventListener("input", ()=>{ o.marca_modelo = marcaI.value; syncObjectTipo(o); });

    const del = document.createElement("button");
    del.className = "btn danger objDel";
    del.type = "button";
    del.textContent = "X";
    del.addEventListener("click", ()=>{
      objetosState.splice(idx, 1);
      renderObjs();
      updateObjsCount();
    });

    row.appendChild(tipoI);
    row.appendChild(cantI);
    if (!objetosNoValorMode){
      row.appendChild(valI);
    } else {
      delete o.valor_total_eur;
    }
    row.appendChild(del);
    row.appendChild(descI);
    if (o.tipo_catalogo === "MÓVIL") row.appendChild(marcaI);
    row.appendChild(serialI);

    card.appendChild(row);
    list.appendChild(card);
  });
}
function syncObjectTipo(o){
  const tc = (o.tipo_catalogo || "").trim();
  if (!tc){ o.tipo = ""; return; }
  if (tc === "OTRO"){
    o.tipo = (o.descripcion || "").trim() || "OTRO";
    return;
  }
  o.tipo = tc;
}

$("btnCloseObjs").addEventListener("click", closeObjs);
$("objsBack").addEventListener("click", (e)=>{ if (e.target === $("objsBack")) closeObjs(); });

$("btnAddObj").addEventListener("click", ()=>{
  objetosState.push(objetosNoValorMode
    ? { tipo_catalogo:"", tipo:"", cantidad:"", descripcion:"", numero_serie_imei:"", marca_modelo:"" }
    : { tipo_catalogo:"", tipo:"", cantidad:"", valor_total_eur:"", descripcion:"", numero_serie_imei:"", marca_modelo:"" });
  renderObjs();
  updateObjsCount();
});

$("btnSaveObjs").addEventListener("click", ()=>{
  objetosState = objetosState
    .map(o => ({ ...o }))
    .filter(o => {
      syncObjectTipo(o);
      return (o.tipo||"").trim() || (o.cantidad||"").trim() || (o.valor_total_eur||"").trim() || (o.descripcion||"").trim() || (o.numero_serie_imei||"").trim();
    });
  updateObjsCount();
  closeObjs();
});

function openAuthors(key){
  currentAuthorsKey = key;
  if (!Array.isArray(autoresStateByKey[key])) autoresStateByKey[key] = [];
  renderAuthors();
  const b = $("authorsBack");
  if (b) b.style.display = "flex";
}
function closeAuthors(){
  const b = $("authorsBack");
  if (b) b.style.display = "none";
}
function renderAuthors(){
  const list = $("authorsList");
  if (!list) return;
  const arr = autoresStateByKey[currentAuthorsKey] || [];
  list.innerHTML = "";
  if (!arr.length){
    const empty = document.createElement("div");
    empty.className = "muted";
    empty.textContent = "Sin autores.";
    list.appendChild(empty);
    return;
  }
  arr.forEach((a, idx)=>{
    const card = document.createElement("div");
    card.className = "objCard";
    const grid = document.createElement("div");
    grid.className = "grid";
    const mkSel = (labelTxt, opts, val, onChange)=>{
      const w = document.createElement("div");
      const l = document.createElement("label"); l.textContent = labelTxt;
      const s = document.createElement("select");
      s.innerHTML = `<option value=""></option>${opts.map(v=>`<option value="${v}">${v}</option>`).join("")}`;
      s.value = val || "";
      s.addEventListener("change", ()=> onChange(s.value));
      w.appendChild(l); w.appendChild(s);
      return w;
    };
    const mkInp = (labelTxt, ph, val, onChange)=>{
      const w = document.createElement("div");
      const l = document.createElement("label"); l.textContent = labelTxt;
      const i = document.createElement("input");
      i.type = "text"; i.placeholder = ph || ""; i.value = val || "";
      i.addEventListener("input", ()=> onChange(i.value));
      w.appendChild(l); w.appendChild(i);
      return w;
    };
    grid.appendChild(mkSel("Sexo", AUTOR_SEXO_OPTIONS, a.sexo, (v)=>a.sexo=v));
    grid.appendChild(mkSel("Rango de edad", AUTOR_EDAD_OPTIONS, a.edad_rango, (v)=>a.edad_rango=v));
    grid.appendChild(mkSel("Constitución", AUTOR_CONSTITUCION_OPTIONS, a.constitucion, (v)=>a.constitucion=v));
    grid.appendChild(mkSel("Altura aprox.", AUTOR_ALTURA_OPTIONS, a.altura_rango, (v)=>a.altura_rango=v));
    grid.appendChild(mkInp("Vestimenta superior", "Chaqueta negra...", a.vestimenta_superior, (v)=>a.vestimenta_superior=v));
    grid.appendChild(mkInp("Vestimenta inferior", "Pantalón vaquero...", a.vestimenta_inferior, (v)=>a.vestimenta_inferior=v));
    grid.appendChild(mkInp("Idioma / acento", "Español acento canario...", a.idioma_acento, (v)=>a.idioma_acento=v));
    grid.appendChild(mkInp("Rasgo distintivo", "Cicatriz, tatuaje...", a.rasgo_distintivo, (v)=>a.rasgo_distintivo=v));
    const del = document.createElement("button");
    del.className = "btn danger";
    del.type = "button";
    del.textContent = "Eliminar";
    del.addEventListener("click", ()=>{
      arr.splice(idx, 1);
      autoresStateByKey[currentAuthorsKey] = arr;
      renderAuthors();
    });
    card.appendChild(grid);
    card.appendChild(del);
    list.appendChild(card);
  });
}
function normalizeAuthorsByKey(key){
  const arr = Array.isArray(autoresStateByKey[key]) ? autoresStateByKey[key] : [];
  autoresStateByKey[key] = arr.filter(a =>
    (a.sexo||"").trim() ||
    (a.edad_rango||"").trim() ||
    (a.constitucion||"").trim() ||
    (a.altura_rango||"").trim() ||
    (a.vestimenta_superior||"").trim() ||
    (a.vestimenta_inferior||"").trim() ||
    (a.idioma_acento||"").trim() ||
    (a.rasgo_distintivo||"").trim()
  );
}
$("btnCloseAuthors").addEventListener("click", closeAuthors);
$("authorsBack").addEventListener("click", (e)=>{ if (e.target === $("authorsBack")) closeAuthors(); });
$("btnAddAuthor").addEventListener("click", ()=>{
  if (!currentAuthorsKey) return;
  if (!Array.isArray(autoresStateByKey[currentAuthorsKey])) autoresStateByKey[currentAuthorsKey] = [];
  autoresStateByKey[currentAuthorsKey].push({
    sexo: "",
    edad_rango: "",
    constitucion: "",
    altura_rango: "",
    vestimenta_superior: "",
    vestimenta_inferior: "",
    idioma_acento: "",
    rasgo_distintivo: ""
  });
  renderAuthors();
});
$("btnSaveAuthors").addEventListener("click", ()=>{
  if (!currentAuthorsKey) return closeAuthors();
  normalizeAuthorsByKey(currentAuthorsKey);
  renderWizard(); // refresca el contador visible del bloque authors
  closeAuthors();
});

// =============================
// Guardado / carga
// =============================
async function saveInitialPredenuncia(){
  if (!token) return;

  const p = buildPayload();

  try{
    const outLocal = { estado:"INICIADA", ...p };
    localStorage.setItem(storageKey(), JSON.stringify(outLocal));
  }catch(_){ }

  const ref = doc(db, "predenuncias", token);
  const label_publico = buildLabelPublicoFromFiliacion(p.filiacion);
  const sexo_publico = ((p.filiacion && p.filiacion["Sexo"]) ? String(p.filiacion["Sexo"]) : "").trim();
  const filiacion_enc = encryptFiliacionForCompapol(p.filiacion);

  await setDoc(ref, {
    estado: "INICIADA",
    tipo: currentTipoFinal(),
    token,
    filiacion_enc,
    label_publico,
    sexo_publico,
    createdAt: serverTimestamp(),
    startedAt: serverTimestamp(),
    lastUpdatedAt: serverTimestamp()
  }, { merge: true });
}

async function saveFinal(){
  try{
    if (!token){ alert("Falta token en la URL."); return; }

    const p = buildPayload();

    try{
      const outLocal = { estado:"FINALIZADA", ...p };
      localStorage.setItem(storageKey(), JSON.stringify(outLocal));
    }catch(_){ }

    const ref = doc(db, "predenuncias", token);

    // Enviamos a Firebase: filiación CIFRADA + doc en claro (editable en Denupol)
    const label_publico = buildLabelPublicoFromFiliacion(p.filiacion);
    const sexo_publico = ((p.filiacion && p.filiacion["Sexo"]) ? String(p.filiacion["Sexo"]) : "").trim();
    const filiacion_enc = encryptFiliacionForCompapol(p.filiacion);

    const docText = (p.hechos && (p.hechos.resumen || p.hechos.Resumen)) ? String(p.hechos.resumen || p.hechos.Resumen) : "";

    await setDoc(ref, {
      estado: "FINALIZADA",
      tipo: currentTipoFinal(),
      token,

      // --- lo que Denupol necesita sin ver filiación en claro ---
      filiacion_enc,
      label_publico,
      sexo_publico,

      // --- resto ---
      hechos: p.hechos,
      doc: docText,
      createdAt: serverTimestamp(),
      lastUpdatedAt: serverTimestamp(),
      finalizedAt: serverTimestamp()
    }, { merge: true });

    const msg = $("doneMsg");
    if (msg) msg.style.display = "block";
    document.body.innerHTML = `
      <div style="min-height:100dvh;display:flex;align-items:center;justify-content:center;padding:28px">
        <div style="max-width:720px;width:100%;text-align:center;border:1px solid rgba(255,255,255,.10);border-radius:18px;padding:18px;background:rgba(255,255,255,.06);backdrop-filter:blur(10px) saturate(130%);-webkit-backdrop-filter:blur(10px) saturate(130%);box-shadow:0 18px 46px rgba(0,0,0,.35), inset 0 1px 0 rgba(255,255,255,.06)">
          <h2 style="margin:0 0 10px;font-weight:900;letter-spacing:.2px">
            Denuncia enviada correctamente
          </h2>
          <p style="margin:0;color:rgba(255,255,255,.72)">
            Este enlace ya no puede volver a utilizarse.
          </p>
        </div>
      </div>
    `;
    return;

  }catch(err){
    const m = (err && err.message) ? err.message : String(err);
    alert("ERROR AL FINALIZAR: " + m);
  }
}

function invalidateIfFinalized(){
  const raw = localStorage.getItem(storageKey());
  if (!raw) return;

  try{
    const x = JSON.parse(raw);
    if (x.estado === "FINALIZADA"){
      document.body.innerHTML = `
        <div style="min-height:100dvh;display:flex;align-items:center;justify-content:center;padding:28px">
          <div style="max-width:720px;width:100%;text-align:center;border:1px solid rgba(255,255,255,.10);border-radius:18px;padding:18px;background:rgba(255,255,255,.06);backdrop-filter:blur(10px) saturate(130%);-webkit-backdrop-filter:blur(10px) saturate(130%);box-shadow:0 18px 46px rgba(0,0,0,.35), inset 0 1px 0 rgba(255,255,255,.06)">
            <h2 style="margin:0 0 10px;font-weight:900;letter-spacing:.2px">
              Denuncia enviada correctamente
            </h2>
            <p style="margin:0;color:rgba(255,255,255,.72)">
              Este enlace ya no puede volver a utilizarse.
            </p>
          </div>
        </div>
      `;
      throw "__STOP__";
    }
  }catch(e){
    if (e !== "__STOP__") {}
  }
}

function loadIfAny(){
  const raw = localStorage.getItem(storageKey());
  if (!raw) return;
  try{
    const x = JSON.parse(raw);

    // Filiación
    const f = x.filiacion || {};
    $("fNombre").value = f["Nombre"]||"";
    $("fApellidos").value = f["Apellidos"]||"";
    $("fTipoDoc").value = f["Tipo de documento"]||"DNI";
    $("fOtroDoc").value = f["Otro documento"]||"";
    applyTipoDocVisibility();
    $("fNumDoc").value = f["Nº Documento"]||"";
    $("fNac").value = f["Nacionalidad"]||"";
    $("fNacFecha").value = f["Fecha de nacimiento"]||"";
    $("fNacLugar").value = f["Lugar de nacimiento"]||"";
    $("fDomDir").value = f["Domicilio"]||"";
    $("fDomPais").value = "";
    const __resNo = !!((f["estancia_eventual"]||"").trim() || (f["fecha_vuelta"]||"").trim());
    if ($("fResideTfeNo")) $("fResideTfeNo").checked = __resNo;
    if ($("fResideTfeSi")) $("fResideTfeSi").checked = !__resNo;
    if ($("fEstanciaEventual")) $("fEstanciaEventual").value = f["estancia_eventual"]||"";
    if ($("fFechaVuelta")) $("fFechaVuelta").value = f["fecha_vuelta"]||"";
    try{ toggleResidenciaTenerife(); }catch(_){ }
    $("fTel").value = f["Teléfono"]||"";
    $("fSexo").value = f["Sexo"]||"";
    $("fPadres").value = f["Nombre de los Padres"]||"";
    $("fNacPais").value = f["País nacimiento"]||"";
    $("fNacLugar").value = f["Lugar de nacimiento"]||"";
    $("fNacProvOut").value = f["Provincia nacimiento"]||"";
    $("fNacMunOut").value = f["Municipio nacimiento"]||"";

    try{ toggleNacEsUI(); }catch(_){ }

    // Hechos
    const h = x.hechos || {};
    wiz.st.calidad_denunciante = h.calidad_denunciante || "";
    wiz.st.conocimiento_hecho = h.conocimiento_hecho || "";
    wiz.st.fecha = h.fecha || "";
    wiz.st.hora = h.hora || "";
    wiz.st.hora_desde = "";
    wiz.st.hora_hasta = "";
    if (wiz.st.hora && wiz.st.hora.includes(" - ")){
      const parts = wiz.st.hora.split(" - ");
      wiz.st.hora_desde = (parts[0] || "").trim();
      wiz.st.hora_hasta = (parts[1] || "").trim();
    }
    wiz.st.lugar = h.lugar || "";
    wiz.st.lugar_coords = null;
    wiz.st.interaccion_autor = h.interaccion_autor || "";
    wiz.st.autor_retenido = h.autor_retenido || "";
    wiz.st.lesiones = h.lesiones || "NO";
    wiz.st.parte_medico = h.parte_medico || "NO";
    wiz.st.camaras = h.camaras || "NO";
    wiz.st.camaras_detalle = h.camaras_detalle || "";
    wiz.st.resumen = h.resumen || "";

    objetosState = Array.isArray(h.objetos) ? h.objetos.slice() : (Array.isArray(h.objetos_extraviados) ? h.objetos_extraviados.slice() : (Array.isArray(h.extravio_objetos) ? h.extravio_objetos.slice() : []));
    const authorKeys = ["autores", "descripcion_autor", "descripcion_autores"];
    for (const k of authorKeys){
      if (Array.isArray(h[k])) autoresStateByKey[k] = h[k].slice();
    }
    updateObjsCount();

  }catch(_){ }
}

// INIT
invalidateIfFinalized();
loadIfAny();
renderWizard();
applyTipoDocVisibility();
updateObjsCount();
renderNacPills();
try{ toggleNacEsUI(); }catch(_){ }
try{ toggleDomEsUI(); }catch(_){ }
try{
  const isMobile = window.matchMedia("(max-width:720px)").matches;
  document.body.classList.toggle("noScroll", (wiz.idx !== 0) && isMobile);
}catch(_){ }
window.addEventListener("resize", ()=>{
  try{ updateStepUI(false); }catch(_){ }
});
// Debug helpers for browser console
window.dumpPredenunciaPayload = () => buildPayload();
window.dumpPredenunciaHechos = () => buildPayload().hechos;
// Si hay tipo desconocido, lo dejamos funcionando igualmente.
