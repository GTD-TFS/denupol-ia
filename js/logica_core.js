

// === LÓGICA CORE: extraído desde Registro odt-roa.html ===
function sanitizeForFilename(s) { return String(s || '').replace(/[\/\:*?"<>|]+/g, ' ').trim(); }
function U(s) { return String(s ?? '').toUpperCase(); } // MAYÚSCULAS

// Mostrar inputs "OTRO" + bloquear NºDOC si indocumentado + mostrar IDIOMA si intérprete "OTRO"
document.addEventListener('change', e => {
  if (e.target.id === "tipoDocumento") {
    const val = e.target.value;
    document.getElementById('tipoDocumentoOtro').style.display = (val === "OTRO") ? "block" : "none";
    const num = document.getElementById("numeroDocumento");
    const up = String(val || '').toUpperCase();
    if (up === "INDOCUMENTADO" || up === "INDOCUMENTADA") { num.value = ""; num.disabled = true; } else { num.disabled = false; }
  }
  if (e.target.id === "interpreteOpcion") {
    document.getElementById('idioma').style.display = (e.target.value === "OTRO") ? "block" : "none";
  }
  // 🔄 Si cambia el sexo, ajustar tipoDocumento si corresponde
  if (e.target.id === "sexoOpcion") {
    const tipo = document.getElementById('tipoDocumento');
    if (!tipo) return;
    const sex = String(e.target.value || '').toUpperCase();
    const v = String(tipo.value || '').toUpperCase();
    if (v === 'INDOCUMENTADO' || v === 'INDOCUMENTADA') {
      tipo.value = (sex === 'FEMENINO') ? 'INDOCUMENTADA' : 'INDOCUMENTADO';
      tipo.dispatchEvent(new Event('change'));
    }
  }
  if (e.target.tagName === "SELECT" && e.target.closest('.field-card')) {
    const input = e.target.closest('.field-card').querySelector('input[type="text"]');
    if (input && !["tipoDocumento", "interpreteOpcion"].includes(e.target.id)) {
      input.style.display = (e.target.value === "OTRO") ? "block" : "none";
    }
  }
});

const selectDelito = document.getElementById("delitoSelect");
const lista = document.getElementById("delitosSeleccionados");
const inputOtro = document.getElementById("delitoOtroTexto");
let delitosElegidos = [];

selectDelito.addEventListener("change", () => {
  const val = selectDelito.value;
  if (val === "OTRO") { inputOtro.style.display = "inline-block"; inputOtro.focus(); return; }
  if (val && !delitosElegidos.includes(val)) { delitosElegidos.push(val); renderDelitos(); }
  selectDelito.value = "";
});

inputOtro.addEventListener("keydown", e => {
  if (e.key === "Enter") {
    e.preventDefault();
    const val = inputOtro.value.trim();
    if (val && !delitosElegidos.includes(val)) { delitosElegidos.push(val); renderDelitos(); }
    inputOtro.value = ""; inputOtro.style.display = "none"; selectDelito.value = "";
  }
});

function renderDelitos() {
  lista.innerHTML = "";
  if (delitosElegidos.length === 0) {
    lista.innerHTML = '<em style="color: red; font-style: normal;"></em>';
  } else {
    delitosElegidos.forEach((d, i) => {
      const span = document.createElement("span");
      span.textContent = d;
      span.style.cssText = "padding:3px 6px; margin:2px; background:transparent; border:1px solid #99c; border-radius:4px; display:inline-block; cursor:pointer;";
      span.title = "Click para eliminar";
      span.addEventListener("click", () => {
        delitosElegidos.splice(i, 1);
        renderDelitos();
      });
      lista.appendChild(span);
    });
  }

  // 🔹 Borde y color dinámico del contenedor de chips
  const contenedor = document.getElementById("delitosSeleccionados");
  if (contenedor) {
    if (delitosElegidos.length > 0) {
      contenedor.style.border = "1px solid rgba(255,255,255,0.30)";
      contenedor.style.padding = "6px";
      contenedor.style.minHeight = "30px";
      contenedor.style.color = "#ffffff";
    } else {
      contenedor.style.border = "none";
      contenedor.style.padding = "0";
      contenedor.style.minHeight = "0";
      contenedor.style.color = "";
    }
  }
}
renderDelitos(); // fuerza estado inicial del borde
// Normaliza: quita acentos, pasa a mayúsculas y compacta
function normalizeKey(str) {
  return str
    ? str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().replace(/[^A-Z0-9]/g, "").trim()
    : "";
}

// Auxiliar: maneja selects con input asociado (NO APORTA / OTRO)
function setSelectWithInput(selectName, excelValue) {
  const select = document.querySelector(`[name="${selectName}"]`);
  if (!select) return;
  const card = select.closest(".field-card");
  const textInput = card ? card.querySelector("input[type=text], textarea") : null;
  const normExcel = normalizeKey(excelValue);

  let matched = false;
  for (const opt of select.options) {
    if (normalizeKey(opt.value) === normExcel) {
      select.value = opt.value;
      matched = true;
      if (textInput) { textInput.value = ""; textInput.style.display = "none"; }
      break;
    }
  }

  if (!matched) {
    if (!excelValue || ["NOAPORTA", "NO", "DEOFICIO"].includes(normExcel)) {
      const fallback = Array.from(select.options).find(opt =>
        ["NOAPORTA", "NO", "DEOFICIO"].includes(normalizeKey(opt.value))
      );
      if (fallback) select.value = fallback.value;
      if (textInput) { textInput.value = ""; textInput.style.display = "none"; }
    } else {
      const otherOpt = Array.from(select.options).find(opt => normalizeKey(opt.value) === "OTRO");
      if (otherOpt) select.value = otherOpt.value;
      if (textInput) { textInput.value = excelValue; textInput.style.display = "block"; }
    }
  }
}

// Guardar JSON con FSA
async function saveBlobJson(text, filename) {
  const blob = new Blob([text], { type: 'application/json;charset=utf-8' });
  if (window.showSaveFilePicker) {
    try {
      const handle = await window.showSaveFilePicker({
        suggestedName: filename,
        types: [{ description: 'JSON', accept: { 'application/json': ['.json'] } }]
      });
      const writable = await handle.createWritable();
      await writable.write(blob);
      await writable.close();
      return;
    } catch (e) {
      // Si el usuario cancela, no hacemos descarga directa
      if (e && (e.name === 'AbortError' || e.code === 20)) {
        console.warn('Guardado JSON cancelado por el usuario');
        return;
      }
      console.warn('FSA fallback JSON', e);
    }
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click();
  setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 1500);
}

const RUTA_ROA = "./roa.html";
function splitApellidos(s) { s = String(s || "").trim(); if (!s) return { primer: "", segundo: "" }; const p = s.split(/\s+/); return { primer: p[0] || "", segundo: p.slice(1).join(" ") }; }
function sexoAHoM(v) { const Uv = String(v || "").toUpperCase(); if (Uv.startsWith("MASC")) return "H"; if (Uv.startsWith("FEM")) return "M"; return ""; }
function buildRoaPayloadFromRegistro(data) {
  const ap = splitApellidos(data["APELLIDOS"]);
  const domDisplay = (data["DOMICILIO_OPCION"] === "APORTA")
    ? ((document.getElementById('direccionDomicilio')?.value) || data["DOMICILIO"] || "")
    : (data["DOMICILIO_OPCION"] || "");
  const telDisplay = (data["TELÉFONO_OPCION"] === "OTRO")
    ? (data["TELÉFONO"] || "")
    : (data["TELÉFONO_OPCION"] || "");
  const tipoDoc = data["TIPO DOCUMENTO_OPCION"] === "OTRO"
    ? (data["TIPO DOCUMENTO"] || "")
    : (data["TIPO DOCUMENTO_OPCION"] || "");

  // --- Nacimiento: aplica la regla España / no España ---
  const paisNacEl = document.getElementById('paisNacimiento');
  const provNacEl = document.getElementById('provNacimiento');
  const munNacEl = document.getElementById('munNacimiento');

  const paisNac = (paisNacEl?.value || "").trim();
  const provNac = (provNacEl?.value || "").trim();
  const munNac = (munNacEl?.value || "").trim();

  const stripAcc = s => String(s || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const normPaisNac = stripAcc(paisNac).toUpperCase().trim();
  const isSpainNac = normPaisNac === "ESPANA" || normPaisNac === "ES" || normPaisNac === "ESPANA ";

  // Valores por defecto (compatibilidad)
  let lugarNacOut = data["LUGAR DE NACIMIENTO"] || "";
  let provinciaNacOut = "";
  let paisOut = data["NACIONALIDAD"] || "";

  if (paisNac) {
    if (isSpainNac) {
      // Si país = España → lugar = municipio, provincia = provincia, país = España
      lugarNacOut = munNac || lugarNacOut;
      provinciaNacOut = provNac || "";
      paisOut = paisNac || "ESPAÑA";
    } else {
      // Si NO es España → lugar = país, provincia vacía, país = país
      lugarNacOut = paisNac;
      provinciaNacOut = "";
      paisOut = paisNac;
    }
  }

  return {
    "TIPO DOCUMENTO": tipoDoc,
    "NÚMERO DE DOCUMENTO": data["NºDOCUMENTO"] || "",
    "NOMBRE": data["Nombre"] || "",
    "PRIMER APELLIDO": ap.primer,
    "SEGUNDO APELLIDO": ap.segundo,
    "FECHA DE NACIMIENTO": data["FECHA DE NACIMIENTO"] || "",
    "LUGAR DE NACIMIENTO": lugarNacOut,
    "PROVINCIA": provinciaNacOut,
    "PAÍS": paisOut,
    "NACIONALIDAD": data["NACIONALIDAD"] || "",
    "NOMBRE DE LOS PADRES": (data["NOMBRE_PADRES_OPCION"] === "OTRO"
      ? (data["NOMBRE_PADRES"] || "")
      : (data["NOMBRE_PADRES_OPCION"] || "")),
    "PROFESIÓN": "",
    "TELÉFONO": telDisplay,
    "DOMICILIOS": domDisplay,
    "ARMAS": "", "ALIAS": "", "CONSORTES": "", "EMPRESAS": "", "LUGARES DE ACTUACION": "", "LUGARES DE FRECUENCIA": "", "ORGANIZACION": "",
    "SEXO": sexoAHoM(data["SEXO_OPCION"]),
    "TALLA": "", "COMPLEXION": "", "RAZA": "", "ACENTO": "", "CEJAS": "", "LABIOS": "", "MENTON": "", "CARA": "", "PELO": "", "OJOS": "", "NARIZ": "", "OREJAS": "", "MARCAS": "", "USAS": "", "VEHICULOS": "",
    "DILIGENCIAS": data["DILIGENCIAS"] || "",
    "FECHA DILIGENCIAS": data["FECHA_GENERACION"] || "",
    "RESUMEN DILIGENCIAS": "", "FUNCIONARIO EMISOR": "", "FECHA DE CUMPLIMENTACION": ""
  };
}

function validarRequeridos() {
  const form = document.getElementById('registroForm');
  if (!form) return true;
  var divDelitos = document.getElementById('delitosSeleccionados');
  if (divDelitos) {
    var txt = (divDelitos.textContent || '').trim();
    if (txt.indexOf('Ningún delito seleccionado') !== -1 || txt.indexOf('Ningun delito seleccionado') !== -1) {
      alert('⚠️ Debes seleccionar al menos un delito.');
      return false;
    }
  }
  const invalidos = Array.from(form.querySelectorAll('[required]')).filter(el => !el.value.trim());
  if (invalidos.length > 0) {
    alert("⚠️ Faltan campos obligatorios por rellenar:\n\n- " + invalidos.map(el => el.previousElementSibling?.innerText || el.name || el.id).join("\n- "));
    invalidos[0].focus();
    return false;
  }

  // Validación específica: Nº de documento obligatorio salvo indocumentado/a
  const tipoDocSel = document.getElementById('tipoDocumento');
  const numDocInput = document.getElementById('numeroDocumento');
  if (tipoDocSel && numDocInput) {
    const v = String(tipoDocSel.value || '').toUpperCase().trim();
    const esIndoc = (v === 'INDOCUMENTADO' || v === 'INDOCUMENTADA' || v === 'INDOCUMENTADO/A');
    if (!esIndoc && !numDocInput.value.trim()) {
      alert('⚠️ Debes rellenar el número de documento (salvo que esté marcado como indocumentado/a).');
      numDocInput.focus();
      return false;
    }
  }

  return true;
}

// Parchear exportarJSON para validar antes de descargar
const _exportarJSON = window.exportarJSON;
window.exportarJSON = async function () {
  if (!validarRequeridos()) return;
  return _exportarJSON.apply(this, arguments);
};

async function exportarJSON(opts) {
  const msg = document.getElementById("message");
  msg.innerText = "Generando JSON...";
  opts = opts || {};
  // ==== Validación País / Nacionalidad contra lista de países ====
  (function () {
    const natEl = document.getElementById('nacionalidadInput');
    const paisEl = document.getElementById('paisNacimiento');
    const nat = (natEl?.value || '').trim();
    const paisN = (paisEl?.value || '').trim();

    // Si ambos están vacíos, que actúen otras validaciones (required)
    if (!nat && !paisN) return;

    let raw = [];
    try {
      // Preferimos la lista plana que ya se usa para los datalist (PAISES_FULL en registro-nacimiento-domicilio.js)
      if (Array.isArray(PAISES_FULL) && PAISES_FULL.length) {
        raw = PAISES_FULL.slice();
      }
    } catch (_e) {
      raw = [];
    }
    // Fallback por si en algún momento no existe PAISES_FULL pero sí PAISES/paises
    if (!raw.length) {
      if (Array.isArray(window.PAISES) && window.PAISES.length) {
        raw = window.PAISES.slice();
      } else if (Array.isArray(window.paises) && window.paises.length) {
        raw = window.paises.slice();
      }
    }

    // === VALIDACIÓN EXACTA contra LISTA DE PAISES (array) ===
    if (raw.length) {
      const norm = s => String(s || "")

        .toUpperCase()
        .trim();
      const listaNorm = raw.map(norm);
      const inval = v => v && !listaNorm.includes(norm(v));

      if (inval(nat)) {
        alert("⚠️ La nacionalidad debe ser un país de la lista.");
        throw new Error("Nacionalidad fuera de lista");
      }
      if (inval(paisN)) {
        alert("⚠️ El país de nacimiento debe ser un país de la lista.");
        throw new Error("País de nacimiento fuera de lista");
      }
    }

    // === VALIDACIÓN EXACTA contra DATALIST igual que MUNICIPIO ===
    (function () {
      // Nacionalidad
      const natInp = document.getElementById('nacionalidadInput');
      if (natInp && natInp.list && natInp.list.options.length) {
        const opcionesNat = Array.from(natInp.list.options).map(o => String(o.value || "").trim());
        const valNat = String(natInp.value || "").trim();
        if (valNat && !opcionesNat.includes(valNat)) {
          alert("⚠️ La nacionalidad debe coincidir EXACTAMENTE con un país de la lista. (MAYÚCULAS)");
          throw new Error("Nacionalidad fuera de lista");
        }
      }

      // País de nacimiento
      const paisInp = document.getElementById('paisNacimiento');
      if (paisInp && paisInp.list && paisInp.list.options.length) {
        const opcionesPais = Array.from(paisInp.list.options).map(o => String(o.value || "").trim());
        const valPais = String(paisInp.value || "").trim();
        if (valPais && !opcionesPais.includes(valPais)) {
          alert("⚠️ El país de nacimiento debe coincidir EXACTAMENTE con un país de la lista. (MAYÚCULAS)");
          throw new Error("País de nacimiento fuera de lista");
        }
      }
    })();
  })();

  // === VALIDACIÓN: provincias y municipios nacimiento/domicilio contra listas ===
  (function () {
    const norm = s => String(s || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toUpperCase()
      .trim();

    // --- Helper provincias permitidas ---
    let provList = [];
    try {
      if (Array.isArray(window.PROVINCIAS_ES)) {
        provList = window.PROVINCIAS_ES.slice();
      }
    } catch (_) { }
    const provNormSet = new Set(provList.map(norm));

    const paisNEl = document.getElementById('paisNacimiento');
    const provNEl = document.getElementById('provNacimiento');
    const munNEl = document.getElementById('munNacimiento');

    const paisN = (paisNEl?.value || "").trim();
    const provN = (provNEl?.value || "").trim();
    const munN = (munNEl?.value || "").trim();

    const isSpain = v => {
      const n = norm(v);
      return n === "ESPANA" || n === "ES";
    };

    // --- Nacimiento: si país = España, provincia/municipio obligatorios y de lista ---
    if (isSpain(paisN)) {
      // Provincia nacimiento
      if (!provN) {
        alert("⚠️ Debes seleccionar una provincia de nacimiento de la lista.");
        throw new Error("Provincia de nacimiento obligatoria");
      }
      if (provNormSet.size && !provNormSet.has(norm(provN))) {
        alert("⚠️ La provincia de nacimiento debe ser una de la lista.");
        throw new Error("Provincia de nacimiento fuera de lista");
      }

      // Municipio nacimiento (si hay datalist asociado)
      if (munNEl && munNEl.list && munNEl.list.options && munN) {
        const opciones = Array.from(munNEl.list.options).map(o => String(o.value || "").trim());
        if (opciones.length && !opciones.includes(munN.trim())) {
          alert("⚠️ El municipio de nacimiento debe escogerse de la lista.");
          throw new Error("Municipio de nacimiento fuera de lista");
        }
      }
    }

    // --- Domicilio: solo si el usuario APORTA domicilio ---
    const domSel = document.getElementById('domicilioOpcion');
    const provDEl = document.getElementById('provDomicilio');
    const munDEl = document.getElementById('munDomicilio');
    const domOpt = (domSel?.value || "").trim();

    if (domOpt === "APORTA") {
      const provD = (provDEl?.value || "").trim();
      const munD = (munDEl?.value || "").trim();

      if (provD) {
        if (provNormSet.size && !provNormSet.has(norm(provD))) {
          alert("⚠️ La provincia de domicilio debe ser una de la lista.");
          throw new Error("Provincia de domicilio fuera de lista");
        }
      }

      if (munDEl && munDEl.list && munDEl.list.options && munD) {
        const opcionesD = Array.from(munDEl.list.options).map(o => String(o.value || "").trim());
        if (opcionesD.length && !opcionesD.includes(munD.trim())) {
          alert("⚠️ El municipio de domicilio debe escogerse de la lista.");
          throw new Error("Municipio de domicilio fuera de lista");
        }
      }
    }
  })();

  // --- ESCUDO: Nombre de los Padres → si OTRO, no permitir vacío ---
  (function () {
    const sel = document.getElementById('nombrePadresOpcion');
    const txt = document.getElementById('nombrePadresTexto');
    if (sel && txt && sel.value === "OTRO" && !txt.value.trim()) {
      alert("⚠️ Si seleccionas OTRO en Nombre de los Padres, debes especificarlo.");
      txt.focus();
      throw new Error("Nombre de los Padres vacío");
    }
  })();

  // --- ESCUDO: Teléfono OTRO no puede ir vacío ---
  (function () {
    const sel = document.getElementById('telefonoOpcion');
    const txt = document.getElementById('telefonoTexto');
    if (sel && txt && sel.value === "OTRO" && !txt.value.trim()) {
      alert("⚠️ Si seleccionas OTRO en teléfono, debes escribir un número.");
      if (txt) txt.focus();
      throw new Error("Teléfono OTRO vacío");
    }
  })();

  // === REQUISITO: LUGAR DEL HECHO y DETENCIÓN OBLIGATORIOS (municipio + vía del callejero) ===
  (function () {

    // --- ESCUDO ANTI-FALLO CALLEJERO (parche seguro) ---
    function __escudoCallejero(m, v) {
      try {
        if (typeof window.esCalleValida === "function") {
          return !!window.esCalleValida(m, v);
        }
        return false; // si falta la función, considerar NO válida
      } catch (_) {
        return false; // si hay error interno, NO válida
      }
    }
    const msg = document.getElementById('message');
    const selH = document.getElementById('munHechoSel');
    const viaH = document.getElementById('viaHecho');
    const selD = document.getElementById('munDetSel');
    const viaD = document.getElementById('viaDet');
    const U = s => String(s || '').trim().toUpperCase();
    const esVal = (m, v) => {
      try { return (typeof window.esCalleValida === 'function') ? !!window.esCalleValida(m, v) : true; } catch (_) { return true; }
    };
    // Hecho
    const mHRaw = selH && selH.value;
    const mH = U(mHRaw);
    const vH = viaH && viaH.value;
    if (!mH) {
      if (msg) { msg.innerText = '⚠️ Selecciona municipio del hecho ⚠️'; msg.style.color = '#ff6f00'; }
      alert('⚠️ Selecciona municipio del hecho.');
      if (selH) selH.focus();
      throw new Error('Falta municipio del hecho');
    }
    if (!vH) {
      if (msg) { msg.innerText = '⚠️ Escribe la vía del hecho ⚠️'; msg.style.color = '#ff6f00'; }
      alert('⚠️ Escribe la vía del hecho.');
      if (viaH) viaH.focus();
      throw new Error('Falta vía del hecho');
    }
    // Si el municipio NO es OTRO (es decir, ADEJE / ARONA), se valida contra el callejero
    if (mH !== 'OTRO' && !__escudoCallejero(mH, vH)) {
      if (msg) { msg.innerText = '⚠️ La vía del hecho debe existir en el callejero de ' + mH + ' ⚠️'; msg.style.color = '#ff6f00'; }
      alert('⚠️ La vía del hecho debe existir en el callejero de ' + mH + ' ⚠️');
      if (viaH) viaH.focus();
      throw new Error('Vía del hecho no válida');
    }

    // Detención
    const mDRaw = selD && selD.value;
    const mD = U(mDRaw);
    const vD = viaD && viaD.value;
    if (!mD) {
      if (msg) { msg.innerText = '⚠️ Selecciona municipio de la detención ⚠️'; msg.style.color = '#ff6f00'; }
      alert('⚠️ Selecciona municipio de la detención ⚠️');
      if (selD) selD.focus();
      throw new Error('Falta municipio detención');
    }
    if (!vD) {
      if (msg) { msg.innerText = '⚠️ Escribe la vía de la detención ⚠️'; msg.style.color = '#ff6f00'; }
      alert('⚠️ Escribe la vía de la detención ⚠️');
      if (viaD) viaD.focus();
      throw new Error('Falta vía detención');
    }
    // Si el municipio NO es OTRO (es decir, ADEJE / ARONA), se valida contra el callejero
    if (mD !== 'OTRO' && !__escudoCallejero(mD, vD)) {
      if (msg) { msg.innerText = '⚠️ La vía de la detención debe existir en el callejero de ' + mD + ' ⚠️'; msg.style.color = '#ff6f00'; }
      alert('⚠️ La vía de la detención debe existir en el callejero de ' + mD + ' ⚠️');
      if (viaD) viaD.focus();
      throw new Error('Vía detención no válida');
    }
  })();

  try {
    const form = document.getElementById("registroForm");
    const fd = new FormData(form);
    const data = {}; fd.forEach((v, k) => data[k] = v);

    const UPP = s => String(s ?? '').toUpperCase();
    function toESDate(s) {
      const t = String(s || '').trim();
      let m = t.match(/^(\d{4})-(\d{2})-(\d{2})$/);
      if (m) return `${m[3]}/${m[2]}/${m[1]}`;
      m = t.match(/^(\d{2})[\/\-](\d{2})[\/\-](\d{4})$/);
      if (m) return `${m[1]}/${m[2]}/${m[3]}`;
      return t;
    }

    // --- PATCH: asignación compacta de TIPO DOCUMENTO y NºDOCUMENTO ---
    const optTD = data["TIPO DOCUMENTO_OPCION"]; // valor select (INDOCUMENTADO / INDOCUMENTADA / DNI / ...)
    const upOpt = String(optTD || "").toUpperCase();
    if (upOpt === "INDOCUMENTADO" || upOpt === "INDOCUMENTADA") {
      data["TIPO DOCUMENTO"] = (upOpt === "INDOCUMENTADA") ? "Indocumentada" : "Indocumentado";
      data["NºDOCUMENTO"] = ""; // siempre vacío si indocumentado/a
    } else if (upOpt === "OTRO") {
      data["TIPO DOCUMENTO"] = data["TIPO DOCUMENTO"] || ""; // texto libre
      // NºDOCUMENTO se respeta tal cual
    } else {
      data["TIPO DOCUMENTO"] = optTD; // DNI/NIE/PASAPORTE...
    }
    data["SEXO"] = data["SEXO_OPCION"] || "";
    data["INSTRUCTOR"] = data["INSTRUCTOR"] || "";
    data["FECHA_GENERACION"] = document.getElementById('fechaGeneracion')?.value || '';

    let delitoTexto = "";
    if (typeof delitosElegidos !== "undefined") {
      if (delitosElegidos.length === 1) delitoTexto = delitosElegidos[0];
      else if (delitosElegidos.length === 2) delitoTexto = delitosElegidos[0] + " y " + delitosElegidos[1];
      else if (delitosElegidos.length > 2) delitoTexto = delitosElegidos.slice(0, -1).join(", ") + " y " + delitosElegidos[delitosElegidos.length - 1];
    }

    // --- MINI ESCUDO FINAL DELITOS ---
    (function () {
      const cont = document.getElementById("delitosSeleccionados");
      if (!cont) return;

      const visibles = Array.from(cont.children)
        .map(e => (e.textContent || "").trim())
        .filter(Boolean);

      // Si no hay delitos visibles → alerta + bloqueo
      if (!visibles.length) {
        alert("⚠️ Debe seleccionar al menos un delito.");
        throw new Error("Sin delitos visibles");
      }

      // Forzar que exporte EXACTAMENTE lo que se ve
      if (visibles.length === 1) delitoTexto = visibles[0];
      else if (visibles.length === 2) delitoTexto = visibles[0] + " y " + visibles[1];
      else delitoTexto = visibles.slice(0, -1).join(", ") + " y " + visibles[visibles.length - 1];
    })();

    data["DELITO"] = delitoTexto;

    const abOpt = data["ABOGADO_OPCION"];
    data["ABOGADO"] = (abOpt === "DE OFICIO") ? "de oficio." : (abOpt === "OTRO" ? (data["ABOGADO"] || "") : (data["ABOGADO"] || ""));

    const ccOpt = data["COMUNICARSE CON_OPCION"];
    data["COMUNICARSE CON:"] = (ccOpt === "NADIE") ? "nadie." : (ccOpt === "OTRO" ? (data["COMUNICARSE CON:"] || "") : (data["COMUNICARSE CON:"] || ""));

    const infOpt = data["INFORMAR DE DETENCION_OPCION"];
    data["INFORMAR DE DETENCION"] = (infOpt === "NADIE") ? "nadie." : (infOpt === "OTRO" ? (data["INFORMAR DE DETENCION"] || "") : (data["INFORMAR DE DETENCION"] || ""));

    const intOpt = data["INTERPRETE_OPCION"] || "NO";
    let interpreteDisplay = "NO";
    if (intOpt === "OTRO") interpreteDisplay = data["IDIOMA"] || "";
    else if (intOpt !== "NO") interpreteDisplay = intOpt;
    data["IDIOMA"] = interpreteDisplay;
    data["INTERPRETE"] = interpreteDisplay;

    const nomDisplay = (data["NOMBRE_PADRES_OPCION"] === "OTRO") ? (data["NOMBRE_PADRES"] || "") : (data["NOMBRE_PADRES_OPCION"] || "");
    const domDisplay = (data["DOMICILIO_OPCION"] === "APORTA") ? ((document.getElementById('direccionDomicilio')?.value) || data["DOMICILIO"] || "") : (data["DOMICILIO_OPCION"] || "");
    const telDisplay = (data["TELÉFONO_OPCION"] === "OTRO") ? (data["TELÉFONO"] || "") : (data["TELÉFONO_OPCION"] || "");

    data["NOMBRE_PADRES"] = nomDisplay;
    data["Nombre de los Padres"] = nomDisplay;
    data["DOMICILIO"] = domDisplay;
    data["TELÉFONO"] = telDisplay;

    data["MEDICO"] = (data["MEDICO"] === "SI") ? "SI" : "NO";
    data["CONSULADO"] = (data["CONSULADO"] === "SI") ? "SI" : "NO";

    const hoy = new Date();
    const dd = String(hoy.getDate()).padStart(2, '0');
    const mm = String(hoy.getMonth() + 1).padStart(2, '0');
    const yyyy = String(hoy.getFullYear());
    const fechaStr = `${dd}-${mm}-${yyyy}`;

    // Garantiza que existan claves de municipio ya capitalizadas en data
    if (!data["municipio-hecho"] && document.getElementById('munHechoSel')) {
      (function () {
        const sel = document.getElementById('munHechoSel');
        const otro = document.getElementById('munHechoOtro');
        const vSel = (sel?.value || '').trim().toUpperCase();
        const val = vSel === 'OTRO' ? (otro?.value || '') : vSel;
        const up = String(val || '').trim().toUpperCase();
        data["municipio-hecho"] = up === 'ADEJE' ? 'Adeje' : (up === 'ARONA' ? 'Arona' : (String(val || '').trim().toLowerCase().replace(/\b([A-Za-zÀ-ÖØ-öø-ÿ])/g, m => m.toUpperCase())));
      })();
    }
    if (!data["municipio-detencion"] && document.getElementById('munDetSel')) {
      (function () {
        const sel = document.getElementById('munDetSel');
        const otro = document.getElementById('munDetOtro');
        const vSel = (sel?.value || '').trim().toUpperCase();
        const val = vSel === 'OTRO' ? (otro?.value || '') : vSel;
        const up = String(val || '').trim().toUpperCase();
        data["municipio-detencion"] = up === 'ADEJE' ? 'Adeje' : (up === 'ARONA' ? 'Arona' : (String(val || '').trim().toLowerCase().replace(/\b([A-Za-zÀ-ÖØ-öø-ÿ])/g, m => m.toUpperCase())));
      })();
    }

    // === VIA/MUNI/RESTO → construir Lugar completo y campos dedicados ===
    function titleCase(s) {
      s = String(s || '').trim();
      if (!s) return '';
      return s.toLowerCase().replace(/\b([a-záéíóúüñ])/gi, m => m.toUpperCase());
    }
    function getTipoVia(via) {
      const t = String(via || '').trim();
      if (!t) return '';
      const m = t.match(/^([A-ZÁÉÍÓÚÜÑ]+|[A-Za-zÁÉÍÓÚÜÑ]+)\b/);
      if (!m) return '';
      // Normaliza tipo: "AVENIDA" → "Avenida"
      return titleCase(m[1]);
    }
    function normalizarViaConTipo(via) {
      const v = String(via || '').trim();
      if (!v) return '';
      const tipo = getTipoVia(v);
      if (!tipo) return v;
      // Reemplaza el prefijo detectado por la versión capitalizada
      return v.replace(/^([A-ZÁÉÍÓÚÜÑ]+|[A-Za-zÁÉÍÓÚÜÑ]+)\b/, tipo);
    }
    // === Helper: separa VÍA en { tipo, nombre } ===
    function splitViaTipoNombre(via) {
      const v = String(via || '').trim();
      if (!v) return { tipo: '', nombre: '' };
      const tipo = getTipoVia(v);
      if (!tipo) return { tipo: '', nombre: v };
      const nombre = v.replace(/^([A-ZÁÉÍÓÚÜÑ]+|[A-Za-zÁÉÍÓÚÜÑ]+)\b\s*/, '').trim();
      return { tipo, nombre };
    }
    function buildLugar(via, resto, muni) {
      const v = normalizarViaConTipo(via);
      const r = String(resto || '').trim();
      const m = String(muni || '').trim();
      const dir = v ? (r ? (v + ' ' + r) : v) : (r || '');
      return m ? (dir ? `${dir}, ${m}` : m) : dir;
    }
    function getMuniFromUI(selId, otroId) {
      const sel = document.getElementById(selId);
      const otro = document.getElementById(otroId);
      if (!sel) return '';
      const val = String(sel.value || '').trim();
      if (val.toUpperCase() === 'OTRO') return String(otro?.value || '').trim();
      return val;
    }

    // --- HECHO (leer SIEMPRE de los campos visibles, NO del hidden) ---
    const _viaHVal = document.getElementById('viaHecho')?.value || '';
    const _restoHVal = document.getElementById('restoHecho')?.value || '';
    const _muniHVal = getMuniFromUI('munHechoSel', 'munHechoOtro');
    const _tipoViaH = getTipoVia(_viaHVal);
    // Derivados para JSON: via-* (con tipo) y viasin-* (sin tipo), sin forzar minúsculas
    const _viaHechoLower = (function () {
      const p = splitViaTipoNombre(_viaHVal);
      return (p.tipo ? (p.tipo + ' ' + p.nombre) : p.nombre);
    })();
    const _viasinHechoLower = splitViaTipoNombre(_viaHVal).nombre;
    const _lugarHechoFull = buildLugar(_viaHVal, _restoHVal, _muniHVal);

    // --- DETENCIÓN (leer SIEMPRE de los campos visibles, NO del hidden) ---
    const _viaDVal = document.getElementById('viaDet')?.value || '';
    const _restoDVal = document.getElementById('restoDet')?.value || '';
    const _muniDVal = getMuniFromUI('munDetSel', 'munDetOtro');
    const _tipoViaD = getTipoVia(_viaDVal);
    const _viaDetLower = (function () {
      const p = splitViaTipoNombre(_viaDVal);
      return (p.tipo ? (p.tipo + ' ' + p.nombre) : p.nombre);
    })();
    const _viasinDetLower = splitViaTipoNombre(_viaDVal).nombre;
    const _lugarDetFull = buildLugar(_viaDVal, _restoDVal, _muniDVal);

    // ===== CAMPOS GRANULARES NACIMIENTO / DOMICILIO (para COMPAPOL) =====
    const __paisNacVal = (document.getElementById('paisNacimiento')?.value || '').trim();
    const __provNacVal = (document.getElementById('provNacimiento')?.value || '').trim();
    const __munNacVal = (document.getElementById('munNacimiento')?.value || '').trim();

    const __provDomVal = (document.getElementById('provDomicilio')?.value || '').trim();
    const __munDomVal = (document.getElementById('munDomicilio')?.value || '').trim();
    const __dirDomVal = (document.getElementById('direccionDomicilio')?.value || '').trim();



    const jsonOut = {
      "Nombre": data["Nombre"],
      "Apellidos": UPP(data["APELLIDOS"]),
      "Tipo de documento": data["TIPO DOCUMENTO"],
      "Nº Documento": UPP(data["NºDOCUMENTO"]),
      "Sexo": UPP(data["SEXO"]),
      "Nacionalidad": data["NACIONALIDAD"],
      "Nombre de los Padres": data["Nombre de los Padres"],
      "Fecha de nacimiento": UPP(toESDate(data["FECHA DE NACIMIENTO"])),
      "Lugar de nacimiento": UPP(data["LUGAR DE NACIMIENTO"]),
      // --- CAMPOS GRANULARES (COMPAPOL) ---
      "País nacimiento": UPP(__paisNacVal),
      "Provincia nacimiento": UPP(__provNacVal),
      "Municipio nacimiento": UPP(__munNacVal),
      "Provincia domicilio": UPP(__provDomVal),
      "Municipio domicilio": UPP(__munDomVal),

      // --- CLAVES TÉCNICAS (Registro: rehidratación) ---
      "pais-nacimiento": UPP(__paisNacVal),
      "provincia-nacimiento": UPP(__provNacVal),
      "municipio-nacimiento": UPP(__munNacVal),
      "provincia-domicilio": UPP(__provDomVal),
      "municipio-domicilio": UPP(__munDomVal),
      "direccion-domicilio": __dirDomVal,

      "Domicilio": domDisplay,
      "Teléfono": UPP(telDisplay),
      "Delito": UPP(data["DELITO"]),
      "C.P. Agentes": UPP(data["C.P. AGENTES"]),
      "Diligencias": UPP(data["DILIGENCIAS"]),
      "Instructor": UPP(data["INSTRUCTOR"]),
      "Lugar del hecho": _lugarHechoFull,
      "Lugar de la detención": _lugarDetFull,
      "tipovia-hecho": _tipoViaH,
      "tipovia-detencion": _tipoViaD,
      "restodireccion-hecho": _restoHVal,
      "restodireccion-detencion": _restoDVal,
      "via-hecho": _viaHechoLower,
      "via-detencion": _viaDetLower,
      "viasin-hecho": _viasinHechoLower,
      "viasin-detencion": _viasinDetLower,
      "municipio-hecho": data["municipio-hecho"] || "",
      "municipio-detencion": data["municipio-detencion"] || "",
      "Hora del hecho": (document.getElementById('horaHecho')?.value || data["HORA DEL HECHO"] || "").trim(),
      "Hora de la detención": (document.getElementById('horaDetencion')?.value || data["HORA DE LA DETENCIÓN"] || "").trim(),
      "Breve resumen de los hechos": UPP(data["BREVE RESUMEN DE LOS HECHOS"]),
      "Indicios por los que se detiene": UPP(data["INDICIOS POR LOS QUE SE DETIENE"]),
      "Abogado": UPP(data["ABOGADO"]),
      "Comunicarse con": UPP(data["COMUNICARSE CON:"]),
      "Informar de detención": UPP(data["INFORMAR DE DETENCION"]),
      "Intérprete": UPP(interpreteDisplay),
      "Médico": UPP(data["MEDICO"]),
      "Consulado": UPP(data["CONSULADO"]),
      "Indicativo": data["Indicativo"],
      "Fecha de generación": UPP(data["FECHA_GENERACION"]),
      "Condición": "Detenido"
    };

    const fileName = `${sanitizeForFilename(data["Nombre"] || "")} ${sanitizeForFilename(data["APELLIDOS"] || "")} ${fechaStr}.json`.trim() || "resumen.json";

    let finalContent = JSON.stringify(jsonOut, null, 2);

    // --- ENCRIPTACIÓN AUTOMÁTICA (Password: Fecha de Nacimiento DDMMYYYY) ---
    try {
      let pass = "adejegtd"; // Fallback/Default
      const dobInput = document.querySelector('input[name="FECHA DE NACIMIENTO"]');
      if (dobInput && dobInput.value) {
        // dobInput.value suele ser YYYY-MM-DD para <input type="date">
        const parts = dobInput.value.split('-');
        if (parts.length === 3) {
          pass = parts[2] + parts[1] + parts[0]; // DDMMYYYY
        }
      }

      const encrypted = CryptoJS.AES.encrypt(finalContent, pass).toString();
      const wrapper = {
        "meta_encrypted": true,
        "data": encrypted,
        "timestamp": new Date().toISOString()
      };
      finalContent = JSON.stringify(wrapper, null, 2);
    } catch (e) {
      console.error("Error auto-encriptando", e);
      alert("Error encriptando: " + e);
      return;
    }

    if (!opts.noSave) await saveBlobJson(finalContent, fileName);
    if (opts.returnText) return { jsonOut, jsonText: finalContent, fileName };
    msg.innerText = "✅ JSON generado y descargado ✅";
    try {
      const payload = buildRoaPayloadFromRegistro(data);
      sessionStorage.setItem('ROA_PAYLOAD', JSON.stringify(payload));
      /*const goBtn = document.getElementById('goRoaBtn');
      if(goBtn){ goBtn.style.display='inline-block'; goBtn.onclick = ()=>{ location.href = RUTA_ROA; }; }*/
    } catch (_e) { }
  } catch (err) {
    console.error(err);
    msg.innerText = "❌ " + (err?.message || err);
  }
}

// PATCH compacto: importarJSON + rehidratación completa (mismo comportamiento, menos código)
(function () {
  const U = s => String(s || '').trim();
  const H = v => { const m = U(v).match(/^(\d{1,2})[:hH\.](\d{2})/); return m ? `${m[1].padStart(2, '0')}:${m[2]}` : ""; };
  const D = s => { s = U(s); if (!s) return ''; let m = s.match(/^([0-3]?\d)[\/\-]([0-1]?\d)[\/\-](\d{4})$/); if (m) return `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`; m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/); if (m) return s; m = s.match(/^(\d{4})[\/](\d{1,2})[\/](\d{1,2})$/); if (m) return `${m[1]}-${m[2].padStart(2, '0')}-${m[3].padStart(2, '0')}`; return ''; };
  const PL = s => { s = U(s); if (!s) return { via: '', muni: '' }; const p = s.lastIndexOf(','); return p < 0 ? { via: s, muni: '' } : { via: s.slice(0, p).trim(), muni: s.slice(p + 1).trim() }; };
  const SSI = (n, v) => { try { setSelectWithInput(n, v); } catch (_) { } };
  const SB = (n, v) => { const el = document.querySelector(`[name="${n}"]`); if (el) { el.value = v ?? ''; el.dispatchEvent(new Event('change')); } };
  const ESV = (sel, val) => {
    if (!sel) { return }
    const s = U(val); if (!s) { sel.value = ''; sel.dispatchEvent(new Event('change')); return; }
    let o = [...sel.options].find(x => x.value === s) || [...sel.options].find(x => x.value.toUpperCase() === s.toUpperCase());
    if (!o) { o = document.createElement('option'); o.value = s; o.textContent = s; sel.appendChild(o); }
    sel.value = o.value; sel.dispatchEvent(new Event('change'));
  };
  window.importarJSON = function () {
    const input = document.getElementById("fileInputJSON");
    input.value = null; input.click();
    input.onchange = async (e) => {
      const f = e.target.files && e.target.files[0]; if (!f) return;
      try {
        const textContent = await f.text();
        let obj;
        try {
          obj = JSON.parse(textContent);
        } catch (e) {
          throw new Error("El archivo no es un JSON válido.");
        }

        // --- DETECCIÓN DE ENCRIPTACIÓN ---
        if (obj && obj["meta_encrypted"] === true && obj["data"]) {
          let pass = "adejegtd"; // Intento automático
          let decryptedData = "";
          let success = false;

          // 1. Intentar con password por defecto
          try {
            const bytes = CryptoJS.AES.decrypt(obj["data"], pass);
            decryptedData = bytes.toString(CryptoJS.enc.Utf8);
            if (decryptedData) success = true;
          } catch (e) { }

          // 2. Si falla, pedir contraseña (la fecha de nacimiento o "adejegtd")
          if (!success) {
            pass = prompt("Archivo protegido. Introduce la contraseña (ej: DDMMYYYY):", "");
            if (!pass) throw new Error("Se requiere contraseña.");
            try {
              const bytes = CryptoJS.AES.decrypt(obj["data"], pass);
              decryptedData = bytes.toString(CryptoJS.enc.Utf8);
              if (!decryptedData) throw new Error("Incorrecta.");
            } catch (e) {
              throw new Error("Contraseña incorrecta o fallo al desencriptar.");
            }
          }

          obj = JSON.parse(decryptedData);
        }
        const M = new Map(Object.entries(obj).map(([k, v]) => [String(k).trim().toUpperCase(), v]));
        const G = k => M.get(String(k).toUpperCase()) ?? "";

        // Delitos
        (function () {
          let raw = G("Delito");
          if (!raw && ("Delito" in obj)) raw = obj["Delito"];
          if (!raw) raw = obj["DELITOS"] || obj["Delitos"] || obj["delitos"];
          let lista = [];
          if (Array.isArray(raw)) lista = raw.map(v => String(v || '').trim()).filter(Boolean);
          else if (typeof raw === 'string') lista = raw ? raw.split(/\s*,\s*|\s+y\s+/i).map(v => v.trim()).filter(Boolean) : [];
          if (typeof delitosElegidos === 'undefined') { window.delitosElegidos = []; }
          try { delitosElegidos.splice(0, delitosElegidos.length, ...lista); } catch (_) { window.delitosElegidos = lista.slice(); }
          try { if (typeof renderDelitos === 'function') renderDelitos(); } catch (_) { }
        })();

        // Campos simples
        SB("Nombre", G("Nombre"));
        SB("APELLIDOS", G("Apellidos"));
        SB("NACIONALIDAD", G("Nacionalidad"));
        SB("FECHA DE NACIMIENTO", D(G("Fecha de nacimiento") || G("FECHA DE NACIMIENTO")));
        SB("LUGAR DE NACIMIENTO", G("Lugar de nacimiento"));
        SB("C.P. AGENTES", G("C.P. Agentes"));
        SB("DILIGENCIAS", G("Diligencias"));
        SB("INSTRUCTOR", G("Instructor"));
        SB("LUGAR DEL HECHO", G("Lugar del hecho"));
        SB("LUGAR DE LA DETENCIÓN", G("Lugar de la detención"));
        SB("BREVE RESUMEN DE LOS HECHOS", G("Breve resumen de los hechos"));
        SB("INDICIOS POR LOS QUE SE DETIENE", G("Indicios por los que se detiene"));
        SB("Indicativo", G("Indicativo"));
        SB("FECHA_GENERACION", G("Fecha de generación"));
        SB("HORA DEL HECHO", H(G("Hora del hecho")));
        SB("HORA DE LA DETENCIÓN", H(G("Hora de la detención")));

        // Selects asociados
        SSI("DOMICILIO_OPCION", G("Domicilio"));
        SSI("TELÉFONO_OPCION", G("Teléfono"));
        SSI("NOMBRE_PADRES_OPCION", G("Nombre de los Padres"));
        SSI("ABOGADO_OPCION", G("Abogado"));
        SSI("COMUNICARSE CON_OPCION", G("Comunicarse con"));
        SSI("INFORMAR DE DETENCION_OPCION", G("Informar de detención"));
        SSI("INTERPRETE_OPCION", G("Intérprete"));
        SSI("SEXO_OPCION", G("Sexo"));
        SSI("TIPO DOCUMENTO_OPCION", G("Tipo de documento"));
        SSI("MEDICO", G("Médico"));
        SSI("CONSULADO", G("Consulado"));

        // Nº documento (respeta INDOCUMENTADO/A)
        (function () {
          const t = document.querySelector('[name="TIPO DOCUMENTO_OPCION"]');
          SB("NºDOCUMENTO", (t && String(t.value).toUpperCase() === "INDOCUMENTADO/A") ? "" : (G("Nº Documento") || ""));
        })();

        // Nacimiento / Domicilio extendidos
        (function () {
          const gv = (...ks) => { for (const k of ks) { if (k in obj && U(obj[k])) return U(obj[k]); const up = k.toUpperCase(), lo = k.toLowerCase(); if (up in obj && U(obj[up])) return U(obj[up]); if (lo in obj && U(obj[lo])) return U(obj[lo]); } return ''; };
          const pais = gv('pais-nacimiento', 'PAÍS-NACIMIENTO', 'PAIS-NACIMIENTO', 'PAÍS DE NACIMIENTO', 'PAIS', 'País');
          const prov = gv('provincia-nacimiento');
          const mun = gv('municipio-nacimiento');
          const paisInp = document.getElementById('paisNacimiento'), provSel = document.getElementById('provNacimiento'), munInp = document.getElementById('munNacimiento');
          if (paisInp && pais) { paisInp.value = pais; paisInp.dispatchEvent(new Event('input')); paisInp.dispatchEvent(new Event('change')); }
          if (provSel && prov) { ESV(provSel, prov); }
          if (munInp && mun) { munInp.value = mun; munInp.dispatchEvent(new Event('input')); munInp.dispatchEvent(new Event('change')); }
          try { if (typeof recomputeLugarNacimiento === 'function') recomputeLugarNacimiento(); } catch (_) { }

          const domSel = document.getElementById('domicilioOpcion'), provD = document.getElementById('provDomicilio'), munD = document.getElementById('munDomicilio'), dirD = document.getElementById('direccionDomicilio');
          const pD = gv('provincia-domicilio'), mD = gv('municipio-domicilio'), dD = gv('direccion-domicilio', 'Domicilio', 'DOMICILIO');
          if ((pD || mD || dD) && domSel && domSel.value !== 'APORTA') { domSel.value = 'APORTA'; domSel.dispatchEvent(new Event('change')); }
          if (provD && pD) { ESV(provD, pD); }
          if (munD && mD) { munD.value = mD; munD.dispatchEvent(new Event('input')); munD.dispatchEvent(new Event('change')); }
          if (dirD && dD) { dirD.value = dD; dirD.dispatchEvent(new Event('input')); }
        })();

        // --- Rehidratación: LUGAR DEL HECHO y LUGAR DE LA DETENCIÓN (municipio + vía + resto) ---
        (function () {
          const Tt = s => String(s || '').trim();
          const Up = s => Tt(s).toUpperCase();
          const splitLugar = (s) => {
            s = Tt(s); if (!s) return { dir: '', muni: '' };
            const p = s.lastIndexOf(',');
            return (p < 0) ? { dir: s, muni: '' } : { dir: Tt(s.slice(0, p)), muni: Tt(s.slice(p + 1)) };
          };
          function setMunicipio(selId, otroId, muniVal) {
            const sel = document.getElementById(selId);
            const otro = document.getElementById(otroId);
            if (!sel) return;
            const MU = Up(muniVal);
            if (MU === 'ADEJE' || MU === 'ARONA') {
              sel.value = MU;
              if (otro) { otro.style.display = 'none'; otro.value = ''; }
            } else if (MU) {
              sel.value = 'OTRO';
              if (otro) { otro.style.display = 'block'; otro.value = muniVal; }
            } else {
              sel.value = '';
              if (otro) { otro.style.display = 'none'; otro.value = ''; }
            }
            // No disparamos eventos aquí
          }
          function setViaResto(viaId, restoId, viaVal, restoVal) {
            const viaEl = document.getElementById(viaId);
            const resEl = document.getElementById(restoId);
            if (viaEl) {
              viaEl.style.display = 'block';
              viaEl.value = Tt(viaVal);
            }
            if (resEl) {
              resEl.style.display = 'block';
              resEl.value = Tt(restoVal);
            }
          }
          // HECHO
          (function () {
            const L = obj["Lugar del hecho"] || obj["LUGAR DEL HECHO"] || "";
            const via = obj["via-hecho"] || "";
            const res = obj["restodireccion-hecho"] || "";
            const mun = obj["municipio-hecho"] || "";
            const fromL = splitLugar(L);
            setMunicipio('munHechoSel', 'munHechoOtro', mun || fromL.muni);
            setViaResto('viaHecho', 'restoHecho', via || fromL.dir, res);
          })();
          // DETENCIÓN
          (function () {
            const L = obj["Lugar de la detención"] || obj["LUGAR DE LA DETENCIÓN"] || obj["LUGAR DE LA DETENCION"] || "";
            const via = obj["via-detencion"] || "";
            const res = obj["restodireccion-detencion"] || "";
            const mun = obj["municipio-detencion"] || "";
            const fromL = splitLugar(L);
            setMunicipio('munDetSel', 'munDetOtro', mun || fromL.muni);
            setViaResto('viaDet', 'restoDet', via || fromL.dir, res);
          })();
        })();

        const msg = document.getElementById("message"); if (msg) msg.innerText = "✅ JSON importado y formulario rellenado ✅";
      } catch (err) {
        console.error(err);
        const msg = document.getElementById("message"); if (msg) msg.innerText = "❌ Error al importar JSON: " + (err?.message || err);
      }
    };
  };

  // --- INTEGRACIÓN CON DENUPOL (FIREBASE) ---
  function showToast(text) {
    const prev = document.getElementById('denuToast');
    if (prev) prev.remove();

    const t = document.createElement('div');
    t.id = 'denuToast';
    t.textContent = text;
    t.style.cssText = `
      position:fixed;
      left:50%;
      top:50%;
      transform:translate(-50%,-40%);
      background:rgba(15,25,40,.92);
      color:#fff;
      padding:14px 24px;
      border-radius:18px;
      font-weight:800;
      letter-spacing:.5px;
      z-index:999999;
      box-shadow:0 15px 40px rgba(0,0,0,.6);
      border:1px solid rgba(255,255,255,.18);
      opacity:0;
      text-transform:uppercase;
      backdrop-filter:blur(8px);
      -webkit-backdrop-filter:blur(8px);
      transition:opacity .2s ease, transform .2s ease;
      pointer-events:none;
    `;
    document.body.appendChild(t);

    // Forzar reflow para animación
    t.offsetHeight;
    t.style.opacity = '1';
    t.style.transform = 'translate(-50%,-50%)';

    setTimeout(() => {
      t.style.opacity = '0';
      t.style.transform = 'translate(-50%,-60%)';
      setTimeout(() => t.remove(), 200);
    }, 3500);
  }

  async function persistEncryptedToDenupol(encJsonText, filename) {
    const fb = window.DENU_FB;
    if (!fb) throw new Error("Firebase no disponible (falta window.DENU_FB)");
    const user = fb.auth.currentUser;
    if (!user || !user.uid) throw new Error("No autenticado en Firebase. Inicia sesión primero.");
    const name = (String(filename || "registro").trim() || "registro").replace(/\.json$/i, "") + ".json";
    await fb.addDoc(fb.collection(fb.db, "registros"), {
      ownerUid: user.uid,
      filename: name,
      encJson: String(encJsonText || ""),
      createdAt: fb.serverTimestamp()
    });
    showToast("Guardado en DenuPol");
  }

  async function onSaveEncryptedJsonToDenupol() {
    showToast("Generando datos...");
    // Usamos window.exportarJSON para asegurar que pase por la validación del wrapper
    const r = await window.exportarJSON({ noSave: true, returnText: true });
    if (!r || !r.jsonText) {
      // Si no hay r, es porque validarRequeridos() falló (y ya mostró alert) o hubo un error.
      return;
    }
    showToast("Enviando a DenuPol...");
    await persistEncryptedToDenupol(r.jsonText, r.fileName);
  }

  // Cableado del botón (más robusto: intentar ahora y también en DOMContentLoaded)
  function wireSaveButton() {
    const btnSave = document.getElementById("btnSaveEncJson");
    if (btnSave) {
      // Evitar duplicados eliminando listener previo (si lo hubiera en el mismo objeto)
      btnSave.onclick = null;
      // Usamos event listener limpio
      const newHandler = () => {
        onSaveEncryptedJsonToDenupol().catch(e => {
          console.error(e);
          alert("Error guardando en DenuPol: " + (e?.message || e));
        });
      };
      // Reemplazamos el botón para asegurar que no hay otros listeners colgando del clon anterior
      const cloned = btnSave.cloneNode(true);
      btnSave.parentNode.replaceChild(cloned, btnSave);
      cloned.addEventListener("click", newHandler);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", wireSaveButton);
  } else {
    wireSaveButton();
  }
})();