  // Helper para guardar ZIP usando File Picker si disponible, si no descarga directa
  async function saveZipWithPicker(blob, defaultName){
    const name = defaultName || 'expediente.zip';
    if (window.showSaveFilePicker){
      try{
        const handle = await window.showSaveFilePicker({
          suggestedName: name,
          types: [{
            description: 'Archivo ZIP',
            accept: {'application/zip':['.zip']}
          }]
        });
        const writable = await handle.createWritable();
        await writable.write(blob);
        await writable.close();
        return;
      }catch(e){
        // Si el usuario cancela el cuadro de diálogo, no hacer nada (no fallback a descarga directa)
        if (e && (e.name === 'AbortError' || e.name === 'NotAllowedError')) {
          console.warn('Guardado cancelado por el usuario, no se descarga el ZIP.');
          return;
        }
        // Otros errores: hacer fallback a descarga directa
        console.warn('showSaveFilePicker no disponible o falló; usando descarga directa.', e);
      }
    }
    const a = document.createElement('a');
    const url = URL.createObjectURL(blob);
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    setTimeout(()=>{ URL.revokeObjectURL(url); a.remove(); }, 800);
  }

(function(){
  // Aviso si falta JSZip
  if (!window.JSZip){ console.warn('JSZip no está cargado; exportarODTJSON no funcionará.'); }

  // Utiles: reusan si ya existen, si no definen alternativas seguras
  const xmlEsc = (typeof xmlEscape === 'function') ? xmlEscape : (s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'));
  const UPPER = (typeof U === 'function') ? U : (s=>String(s??'').toUpperCase());
  const sfn   = (typeof sanitizeForFilename === 'function') ? sanitizeForFilename : (s=>String(s||'').replace(/[\/:*?"<>|]+/g,' ').trim());

  // Carpeta donde residen las plantillas ODT (misma carpeta que este JS por defecto)
  const BASE_PATH = 'js/';

  // Convierte Blob -> base64 (para alimentar JSZip.loadAsync con {base64:true})
  function blobToBase64(blob){
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(String(reader.result).split(',')[1] || '');
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  // Carga perezosa de PLANTILLAS: primero intenta variables JS globales, luego ficheros .odt
  async function ensurePlantillas(){
    if (window.PLANTILLAS) return; // ya definido en otro script

    // 1) Preferir JS: variables globales creadas por scripts tipo "plantilla_*.js"
    const jsVars = {
      amarillas:         (typeof window.PLANTILLA_AMARILLAS        !== 'undefined') ? window.PLANTILLA_AMARILLAS        : null,
      azules:            (typeof window.PLANTILLA_AZULES           !== 'undefined') ? window.PLANTILLA_AZULES           : null,
      derechos_espanol:  (typeof window.PLANTILLA_DERECHOS_ESPANOL !== 'undefined') ? window.PLANTILLA_DERECHOS_ESPANOL : null,
      derechos_ingles:   (typeof window.PLANTILLA_DERECHOS_INGLES  !== 'undefined') ? window.PLANTILLA_DERECHOS_INGLES  : null,
      derechos_italiano: (typeof window.PLANTILLA_DERECHOS_ITALIANO!== 'undefined') ? window.PLANTILLA_DERECHOS_ITALIANO: null,
      derechos_ruso:     (typeof window.PLANTILLA_DERECHOS_RUSO    !== 'undefined') ? window.PLANTILLA_DERECHOS_RUSO    : null,
      derechos_arabe:    (typeof window.PLANTILLA_DERECHOS_ARABE   !== 'undefined') ? window.PLANTILLA_DERECHOS_ARABE   : null,
      fax:               (typeof window.PLANTILLA_FAX              !== 'undefined') ? window.PLANTILLA_FAX              : null
    };
    const out = {};
    Object.keys(jsVars).forEach(k=>{
      const v = jsVars[k];
      if (typeof v === 'string' && v.trim().length) out[k] = v.trim();
    });
    if (Object.keys(out).length){
      window.PLANTILLAS = Object.assign({}, out);
      return;
    }

    // 2) Fallback: intentar cargar ficheros .odt desde BASE_PATH
    const candidates = [
      { key:'amarillas',          file:'amarillas.odt' },
      { key:'azules',             file:'azules.odt' },
      { key:'derechos_espanol',   file:'derechos_espanol.odt' },
      { key:'derechos_ingles',    file:'derechos_ingles.odt' },
      { key:'derechos_arabe',     file:'derechos_arabe.odt' },
      { key:'derechos_italiano',  file:'derechos_italiano.odt' },
      { key:'derechos_ruso',      file:'derechos_ruso.odt' },
      { key:'fax',                file:'fax.odt' }
    ];
    for (const c of candidates){
      try{
        const res = await fetch(BASE_PATH + c.file);
        if (!res.ok) continue;
        const blob = await res.blob();
        out[c.key] = await blobToBase64(blob);
      }catch(_){ /* puede no existir */ }
    }
    if (!Object.keys(out).length){
      throw new Error('No se pudieron cargar plantillas ODT/JS. Comprueba los <script src="js/plantilla_*.js"> o ajusta BASE_PATH.');
    }
    window.PLANTILLAS = Object.assign({}, out);
  }

  // --- Genera un ODT sustituyendo {{tokens}} en content.xml con normalización robusta
  async function generarODTUint8(plantillaBase64, dataObj){
    const zip = await JSZip.loadAsync(plantillaBase64, { base64:true });
    let contentXML = await zip.file('content.xml').async('string');

    // Normalizador de claves (ignora acentos, espacios, y signos de puntuación vs guiones bajos)
    const N = s => String(s||'')
      .normalize('NFD').replace(/[\u0300-\u036f]/g,'')
      .replace(/\s+/g,'_')
      .toUpperCase()
      .replace(/[^0-9A-Z_]/g,'')  // elimina : . , ; ( ) ¿ ? ¡ ! y demás
      .trim();

    // Índice normalizado de valores (con espejos espacio<>guion_bajo)
    const idx = new Map();
    for (const [k, v] of Object.entries(dataObj)){
      const val = v == null ? '' : String(v);
      const kN = N(k);
      if (!idx.has(kN)) idx.set(kN, val);
      const kSpace = k.replace(/_/g, ' ');
      const kUnder = k.replace(/\s+/g, '_');
      [kSpace, kUnder].forEach(alt=>{
        const aN = N(alt);
        if (!idx.has(aN)) idx.set(aN, val);
      });
    }

    // Reemplazo de tokens, limpiando cualquier etiqueta HTML/XML dentro del marcador
    const tokenRe = /\{\{\s*([^}]+?)\s*\}\}|\$\{\s*([^}]+?)\s*\}/g;
    contentXML = contentXML.replace(tokenRe, (m,a,b)=>{
      let raw = (a||b||'');
      raw = String(raw).replace(/&lt;[^&gt;]*&gt;|<[^>]*>/g, ''); // limpia etiquetas por si se colaron
      const keyN = N(raw);
      if (idx.has(keyN)) return xmlEsc(idx.get(keyN));
      return '';
    });
    // === Segunda pasada tolerante a <span> dentro de {{token}} (ODT puede trocear palabras) ===
    function __spanTokenRegex(label){
      const esc = String(label).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const inner = esc.split('').map(ch => {
        if (ch === ' ') return '\\s*(?:<[^>]+>\\s*)*';
        return ch + '(?:\\s*<[^>]+>\\s*)*';
      }).join('');
      return new RegExp('\\{\\{\\s*' + inner + '\\s*\\}\\}', 'gi');
    }
    function __replSmart(label, value){
      if (!value) return;
      const rx = __spanTokenRegex(label);
      contentXML = contentXML.replace(rx, xmlEsc(String(value)));
    }

    // Valores desde el índice normalizado (mismas llaves que en ES y EN usan la plantilla)
    const __vAbogado  = idx.get(N('Abogado')) || idx.get(N('ABOGADO')) || idx.get(N('LETRADO')) || idx.get(N('ABOGADO DE OFICIO')) || '';
    const __vComunica = idx.get(N('COMUNICARSE CON:')) || idx.get(N('COMUNICARSE CON')) || '';
    const __vInformar = idx.get(N('INFORMAR DE SU DETENCION A:')) || idx.get(N('INFORMAR DE SU DETENCION A')) || idx.get(N('INFORMAR DE SU DETENCIÓN A:')) || idx.get(N('INFORMAR DE DETENCION')) || idx.get(N('INFORMAR DE DETENCIÓN')) || '';

    // Reemplazos específicos (mismos placeholders en todas las plantillas)
    __replSmart('Abogado', __vAbogado);
    __replSmart('COMUNICARSE CON:', __vComunica);
    __replSmart('INFORMAR DE SU DETENCION A:', __vInformar);
    // 🚫 Si el tipo es Indocumentado/a, eliminar el ':' fijo de plantilla que queda tras la palabra
    // (aplica a mayúsculas/minúsculas y a la variante INDOCUMENTADO/A)
    contentXML = contentXML.replace(/(INDOCUMENTADO\/A|INDOCUMENTADA|INDOCUMENTADO)\s*:/gi, '$1');

    zip.file('content.xml', contentXML);
    return await zip.generateAsync({ type:'uint8array' });
  }

  function normUpper(s){ return String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().trim(); }

  // === Capitalización con excepciones (para ODT/JSON) ===
  const SMALL_WORDS = new Set(['de','del','los','las','el','y']);
  function capWords(str){
    const s = String(str ?? '').trim();
    if (!s) return '';
    return s
      .toLowerCase()
      .split(/\s+/)
      .map((w, i) => {
        if (i > 0 && SMALL_WORDS.has(w)) return w;
        return w.charAt(0).toUpperCase() + w.slice(1);
      })
      .join(' ');
  }
  function isDniNie(v){
    const t = String(v||'').trim().toUpperCase();
    return t === 'DNI' || t === 'NIE';
  }
  function capitalizeSentences(str){
    let s = String(str ?? '').trim();
    if (!s) return '';
    s = s.toLowerCase();
    return s.replace(/(^|[\.!?]\s+)([a-záéíóúñü])/g, (_, p1, p2) => p1 + p2.toUpperCase());
  }
  function formatOut(key, val){
    const k = String(key||'').toUpperCase();
    let s = String(val ?? '');
    if (!s) return '';
    if (k.includes('APELLIDOS')) return s.toUpperCase();
    if (k === 'NºDOCUMENTO' || k === 'Nº DOCUMENTO' || k === 'NÚMERO DE DOCUMENTO' || k === 'NUMERO DE DOCUMENTO') return s.toUpperCase();
    if (k.includes('DELITO')) return s.toUpperCase();
    if (k === 'TIPO DOCUMENTO' || k === 'TIPO DE DOCUMENTO') return isDniNie(s) ? s.toUpperCase() : capWords(s);
    if (k.includes('BREVE RESUMEN') || k.includes('INDICIOS POR LOS QUE SE DETIENE')) {
      return capitalizeSentences(s);
    }
    return capWords(s);
  }

  // Recoge valores y prepara variantes espejo / alias para las plantillas
  function colectarDatosParaPlantillas(){
    const form = document.getElementById('registroForm');
    const fd = new FormData(form);
    const data = {}; fd.forEach((v,k)=>data[k]=v);

    // Normalizadores
    const toESDate = (s)=>{
      const t = String(s||'').trim();
      let m = t.match(/^(\d{4})-(\d{2})-(\d{2})$/); // HTML date -> ES
      if (m) return `${m[3]}/${m[2]}/${m[1]}`;
      m = t.match(/^(\d{2})[\/\-](\d{2})[\/\-](\d{4})$/); // ya ES
      if (m) return `${m[1]}/${m[2]}/${m[3]}`;
      return t;
    };

    // Alineación de selects tipo "OTRO" y derivados
    const optTD = data["TIPO DOCUMENTO_OPCION"]; 
    data["TIPO DOCUMENTO"] = (optTD === 'OTRO') ? (data["TIPO DOCUMENTO"]||'') : optTD;
    data["NºDOCUMENTO"]    = (optTD === 'INDOCUMENTADO/A') ? '' : (data["NºDOCUMENTO"]||'');
    data["SEXO"]           = data["SEXO_OPCION"] || '';

    const intOpt = data["INTERPRETE_OPCION"] || 'NO';
    let interpreteDisplay = 'NO';
    if (intOpt === 'OTRO') interpreteDisplay = data["IDIOMA"] || '';
    else if (intOpt !== 'NO') interpreteDisplay = intOpt;
    data["IDIOMA"] = interpreteDisplay;
    data["INTERPRETE"] = interpreteDisplay;
    // === Abogado: mapeo de opción (DE OFICIO / PARTICULAR) a los campos que usan las plantillas ===
    (function normalizarAbogado(){
      const opt = String(data["ABOGADO_OPCION"] || "").toUpperCase();
      const txt = String(data["ABOGADO"] || "").trim();

      if (opt === "DE OFICIO") {
        // No hace falta escribir nada, se vuelca tal cual
        data["ABOGADO"] = "DE OFICIO";
        data["ABOGADO DE OFICIO"] = "DE OFICIO";
      } else if (opt === "OTRO") {
        // Si es PARTICULAR sin texto (por si acaso), que al menos no quede vacío
        if (!txt) {
          data["ABOGADO"] = "PARTICULAR";
        }
      }
    })();
    // DOMICILIO y TELÉFONO (visual)
    const domDisplay = (data["DOMICILIO_OPCION"] === 'APORTA')
      ? ((document.getElementById('direccionDomicilio')?.value)||data["DOMICILIO"]||'')
      : (data["DOMICILIO_OPCION"]||'');
    const telDisplay = (data["TELÉFONO_OPCION"] === 'OTRO')
      ? (data["TELÉFONO"]||'')
      : (data["TELÉFONO_OPCION"]||'');
    data["DOMICILIO"] = domDisplay;
    data["TELÉFONO"]  = telDisplay;
    // === Comunicarse con → display + espejos ===
    (function mirrorComunicarseCon(){
      const cOpt = data["COMUNICARSE CON_OPCION"] || "NADIE";
      let comunicarseDisplay;

      if (cOpt === "NADIE") {
        comunicarseDisplay = "nadie.";
      } else if (cOpt === "OTRO") {
        comunicarseDisplay = data["COMUNICARSE CON:"] || data["COMUNICARSE CON"] || "";
      } else {
        // Por si en el futuro hay más opciones: usamos el texto si existe
        comunicarseDisplay = data["COMUNICARSE CON:"] || data["COMUNICARSE CON"] || "";
      }

      // Campo base + espejos que piden las plantillas
      data["COMUNICARSE CON:"] = comunicarseDisplay;
      data["COMUNICARSE CON"]  = comunicarseDisplay;
      data["Comunicarse con:"] = comunicarseDisplay;
      data["Comunicarse con"]  = comunicarseDisplay;
    })();
    // === Informar de detención → display + espejos como en jasonodtvalido ===
    (function mirrorInformarDe(){
      const infOpt = data["INFORMAR DE DETENCION_OPCION"] || "NADIE";
      const informarDisplay = (infOpt === "NADIE")
        ? "nadie."
        : (infOpt === "OTRO" ? (data["INFORMAR DE DETENCION"]||"") : (data["INFORMAR DE DETENCION"]||""));
      // Fija el campo base
      data["INFORMAR DE DETENCION"] = informarDisplay;
      // Espejos que demandan las plantillas (con/sin dos puntos, con tilde y TitleCase)
      data["INFORMAR DE SU DETENCION A:"] = informarDisplay;
      data["INFORMAR DE SU DETENCION A"]  = informarDisplay;
      data["INFORMAR DE SU DETENCIÓN A:"] = informarDisplay;
      data["Informar de su detención a"]  = informarDisplay;
    })();

    // ➕ DOMICILIO + ", municipio-domicilio" (si existe en formulario/rehidratado)
    (function appendMunicipioDomicilio_fromForm(){
      const dom = String(data["DOMICILIO"]||"").trim();
      if (!dom) return;
      const get = (k)=>String(data[k] ?? "").trim();
      // clave principal según tu JSON
      let muni = get("municipio-domicilio");
      // variantes defensivas
      if (!muni){
        const variants = [
          "MUNICIPIO-DOMICILIO","Municipio-domicilio",
          "municipio_domicilio","MUNICIPIO_DOMICILIO",
          "municipio domicilio","MUNICIPIO DOMICILIO","MUNICIPIO"
        ];
        for (const k of variants){ const v = get(k); if (v){ muni = v; break; } }
      }
      if (!muni) return;
      const norm = (s)=>s.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();
      if (norm(dom).includes(norm(muni))) return; // evita duplicar si ya estaba
      data["DOMICILIO"] = dom + ", " + muni;
    })();

    // Delitos (robusto: mira window, LET global no-anclado a window, y campos importados)
    function __getDelitosArr(){
      try { if (Array.isArray(window.delitosElegidos)) return window.delitosElegidos.slice(); } catch(_){}
      try { if (typeof delitosElegidos !== 'undefined' && Array.isArray(delitosElegidos)) return delitosElegidos.slice(); } catch(_){}
      const cand = (data["DELITOS"] || data["DELITO"] || "").trim();
      if (cand) {
        return String(cand).split(/[,;]+/).map(s => s.trim()).filter(Boolean);
      }
      return [];
    }
    const __d = __getDelitosArr();
    let delitoTexto = '';
    if (__d.length === 1) delitoTexto = __d[0];
    else if (__d.length === 2) delitoTexto = __d[0] + ' y ' + __d[1];
    else if (__d.length > 2)  delitoTexto = __d.slice(0,-1).join(', ') + ' y ' + __d[__d.length-1];
    data["DELITO"]  = delitoTexto;
    data["DELITOS"] = delitoTexto;
    data["PRIMER_DELITO"] = __d[0] || '';

    // Normalizar FECHA DE NACIMIENTO a formato ES para ODT
    if ("FECHA DE NACIMIENTO" in data) {
      data["FECHA DE NACIMIENTO"] = toESDate(data["FECHA DE NACIMIENTO"]);
    }

    // Alias para compatibilidad con plantillas ODT
    const alias = {
      "Nº Documento":               data["NºDOCUMENTO"],
      "NÚMERO DE DOCUMENTO":        data["NºDOCUMENTO"],
      "NUMERO DE DOCUMENTO":        data["NºDOCUMENTO"],            // sin acento
      "Nombre de los Padres":       (data["NOMBRE_PADRES"]||''),
      "NOMBRE DE LOS PADRES":       (data["NOMBRE_PADRES"]||''),
      "Delitos":                    data["DELITO"],
      "DELITOS":                    data["DELITO"],
      "Comunicarse con":            (data["COMUNICARSE CON:"]||data["COMUNICARSE CON"]||''),
      "COMUNICARSE CON":            (data["COMUNICARSE CON:"]||data["COMUNICARSE CON"]||''),
      "INFORMAR DE DETENCION":        (data["INFORMAR DE DETENCION"] || data["INFORMAR DE SU DETENCION A:"] || data["INFORMAR DE SU DETENCIÓN A:"] || ""),
      "Informar de detención":        (data["INFORMAR DE DETENCION"] || ""),
      "Lugar del hecho":            (data["LUGAR DEL HECHO"]||''),
      "Lugar de la detención":      (data["LUGAR DE LA DETENCIÓN"]||''),
      "LUGAR DE LA DETENCION":      (data["LUGAR DE LA DETENCIÓN"]||''), // sin tilde
      "Telefono":                   data["TELÉFONO"],               // sin tilde
      "TIPO DE DOCUMENTO":          data["TIPO DOCUMENTO"],
      "Tipo de documento":          data["TIPO DOCUMENTO"],
      // === Alias extra para plantillas de DERECHOS ===
      // Abogado/a
      "Abogado":                  (data["ABOGADO"] || data["LETRADO"] || data["ABOGADO DE OFICIO"] || ''),
      "ABOGADO":                  (data["ABOGADO"] || data["LETRADO"] || data["ABOGADO DE OFICIO"] || ''),

      // Informar de su detención A: (con y sin dos puntos, con/ sin tilde)
      "INFORMAR DE SU DETENCION A": (data["INFORMAR DE SU DETENCION A:"] || data["INFORMAR DE SU DETENCION A"] || data["INFORMAR DE DETENCION"] || data["INFORMAR DE SU DETENCIÓN A:"] || ''),
      "Informar de su detención a": (data["INFORMAR DE SU DETENCION A:"] || data["INFORMAR DE SU DETENCION A"] || data["INFORMAR DE DETENCION"] || data["INFORMAR DE SU DETENCIÓN A:"] || ''),

      // Comunicarse con:
      "COMUNICARSE CON:":         (data["COMUNICARSE CON:"] || data["COMUNICARSE CON"] || ''),
      "Comunicarse con:":         (data["COMUNICARSE CON:"] || data["COMUNICARSE CON"] || ''),

      // Consulado y Médico
      "CONSULADO":                (data["CONSULADO"] || ''),
      "Medico":                   (data["MEDICO"] || data["MÉDICO"] || ''),
      "MEDICO":                   (data["MEDICO"] || data["MÉDICO"] || ''),

      // Intérprete / Idioma (ya se setea más arriba, pero añadimos espejo literal)
      "IDIOMA":                   (data["IDIOMA"] || ''),
    };
    for (const k in alias){ data[k] = alias[k]; }

    // Salida capitalizada con excepciones
    const upperData = {};
    for (const k in data){ upperData[k] = formatOut(k, data[k]); }

    // Duplicar claves en variantes típicas (espacios <> guiones bajos)
    (function addSpaceUnderscoreMirrors(){
      const extras = {};
      Object.keys(upperData).forEach(k=>{
        if (k.includes('_')) {
          const spaced = k.replace(/_/g,' ');
          if (!(spaced in upperData)) extras[spaced] = upperData[k];
        } else if (/\s/.test(k)) {
          const unders = k.replace(/\s+/g,'_');
          if (!(unders in upperData)) extras[unders] = upperData[k];
        }
      });
      Object.assign(upperData, extras);
    })();

    if (upperData["NOMBRE_PADRES"] && !upperData["Nombre de los Padres"]) {
      upperData["Nombre de los Padres"] = upperData["NOMBRE_PADRES"];
    }

    return { data, upperData, interpreteDisplay };
  }

  // Decide qué ODTs incluir según edad/intérprete/disponibilidad en PLANTILLAS
  function docsAEmitir(interpreteDisplay, edad){
    const docs = [];
    // Amarillas/Azules según edad (regla jasonodtvalido):
    // ≥18 → amarillas ; <18 → azules ; sin edad → ambas
    if (typeof edad === 'number'){
      if (edad >= 18) {
        docs.push({ key:'amarillas', name:'amarillas.odt' });
      } else {
        docs.push({ key:'azules',    name:'azules.odt'    });
      }
    } else {
      docs.push({ key:'amarillas', name:'amarillas.odt' });
      docs.push({ key:'azules',    name:'azules.odt'    });
    }
    docs.push({ key:'derechos_espanol', name:'derechos_espanol.odt' });

    const lang = normUpper(interpreteDisplay);
    if (lang === 'INGLES')   docs.push({ key:'derechos_ingles',   name:'derechos_ingles.odt' });
    if (lang === 'ARABE')    docs.push({ key:'derechos_arabe',    name:'derechos_arabe.odt' });
    if (lang === 'ITALIANO') docs.push({ key:'derechos_italiano', name:'derechos_italiano.odt' });
    if (lang === 'RUSO')     docs.push({ key:'derechos_ruso',     name:'derechos_ruso.odt' });

    if (window.PLANTILLAS && PLANTILLAS.fax) docs.push({ key:'fax', name:'fax.odt' });
    return docs;
  }

  function calcularEdadFlexible(f){
    const t = String(f||'').trim();
    if (!t) return null;
    let d = null;
    // yyyy-mm-dd
    if (/^\d{4}-\d{2}-\d{2}$/.test(t)) {
      d = new Date(t);
    } else {
      // dd/mm/yyyy o dd-mm-yyyy
      const m = t.match(/^(\d{2})[\/\-](\d{2})[\/\-](\d{4})$/);
      if (m) d = new Date(+m[3], +m[2]-1, +m[1]);
    }
    if (!d || isNaN(d)) return null;
    const h = new Date();
    let e = h.getFullYear() - d.getFullYear();
    const md = h.getMonth() - d.getMonth();
    if (md < 0 || (md === 0 && h.getDate() < d.getDate())) e--;
    return e;
  }

  async function exportarODTJSON(){
    // 🔧 Carga perezosa de JSZip si no está disponible
    if (!window.JSZip) {
      await new Promise((resolve, reject) => {
        const s = document.createElement('script');
        s.src = 'js/jszip.min.js';
        s.onload = resolve;
        s.onerror = () => reject(new Error('No se pudo cargar js/jszip.min.js'));
        document.head.appendChild(s);
      });
    }
    const msg = document.getElementById('message');
    if (msg) msg.innerText = 'Generando ZIP (ODTs + JSON)...';
    try{
      await ensurePlantillas();
      if (!window.PLANTILLAS) throw new Error('Faltan PLANTILLAS de ODT');

      const { data, upperData, interpreteDisplay } = colectarDatosParaPlantillas();

      // === Capturar JSON usando la MISMA ruta pública que el botón 💾 ===
      const __prevSave = window.saveBlobJson;
      let __captured = { text:null, name:null };
      window.saveBlobJson = async function(text, filename){
        __captured.text = text;
        __captured.name = filename || 'expediente.json';
        return; // no descargar aquí
      };
      try{
        await window.exportarJSON();
      } finally {
        window.saveBlobJson = __prevSave;
      }
      if (!__captured.text){
        if (msg) msg.innerText = '❌ No se pudo generar el JSON (validación cancelada o error).';
        return;
      }

      // ➕ DOMICILIO + ", municipio-domicilio" desde el JSON capturado (por si no venía en form)
      try{
        const obj = JSON.parse(__captured.text || "{}");
        const baseDom = String(upperData["DOMICILIO"] || data["DOMICILIO"] || "").trim();
        const muni = String(
          obj["municipio-domicilio"] || obj["MUNICIPIO-DOMICILIO"] ||
          obj["municipio_domicilio"] || obj["MUNICIPIO_DOMICILIO"] ||
          obj["municipio domicilio"] || obj["MUNICIPIO DOMICILIO"] ||
          obj["MUNICIPIO"] || ""
        ).trim();
        if (baseDom && muni){
          const norm = (s)=>String(s||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();
          if (!norm(baseDom).includes(norm(muni))){
            const merged = baseDom + ", " + muni;
            data["DOMICILIO"] = merged;
            upperData["DOMICILIO"] = formatOut("DOMICILIO", merged);
          }
        }
      }catch(_){}
      // Construir UPPER_ONLY DESPUÉS de posibles modificaciones de upperData
      const UPPER_ONLY = (function(){
        const o = {};
        for (const k in upperData){ o[k] = String(upperData[k] ?? "").toUpperCase(); }
        return o;
      })();

      // Edad y lista de documentos
      const edad = calcularEdadFlexible(data["FECHA DE NACIMIENTO"]);
      const docs = docsAEmitir(interpreteDisplay, edad).filter(d=>window.PLANTILLAS && PLANTILLAS[d.key]);

      // Base de nombre a partir de DILIGENCIAS + 1er delito + Nombre + 1er apellido
      const base = (__captured.name || '').replace(/\.json$/i,'').trim() || 'expediente';

      const diligRaw = String(data["DILIGENCIAS"] || '').trim();
      const diligPart = diligRaw ? diligRaw.replace(/\//g, '-') : '';

      const delito1Raw = String(data["PRIMER_DELITO"] || data["DELITO"] || '').trim();
      const delitoPart = delito1Raw ? delito1Raw.slice(0, 15).trim() : '';

      const nombrePart = String(upperData["Nombre"] || upperData["NOMBRE"] || data["Nombre"] || '').trim();
      const apes = String(upperData["APELLIDOS"] || data["APELLIDOS"] || '').trim();
      const ape1 = apes.split(/\s+/)[0] || '';

      const nameParts = [diligPart, delitoPart, nombrePart, ape1].filter(Boolean);
      const zipBase = nameParts.length ? nameParts.join(' - ') : 'expediente';

            // Construcción del ZIP con carpeta raíz igual que el nombre del ZIP (sin .zip)
      const zip = new JSZip();

      // Nombre base "bonito" ya saneado (el mismo que se usa para el nombre del ZIP)
      const rootName = sfn(zipBase) || 'expediente';
      const root = zip.folder(rootName);  // carpeta principal dentro del ZIP

      // JSON dentro de la carpeta
      root.file(__captured.name, __captured.text);

      // ODTs dentro de la misma carpeta
      for (const d of docs){
        try{
          const odt = await generarODTUint8(
            PLANTILLAS[d.key],
            ((d.key === 'amarillas' || d.key === 'azules') ? UPPER_ONLY : upperData)
          );
          root.file(`${base} - ${d.name}`, odt);
        }catch(e){
          console.warn('No se generó', d.key, e);
        }
      }

      const blob = await zip.generateAsync({ type:'blob' });
      await saveZipWithPicker(blob, rootName + '.zip');
      if (msg) msg.innerText = '✅ ZIP descargado (ODTs + JSON) ✅';
    }catch(err){
      console.error(err);
      if (msg) msg.innerText = '❌ ' + (err?.message || err);
    }
  }

  // API pública
  window.exportarODTJSON = exportarODTJSON;
})();