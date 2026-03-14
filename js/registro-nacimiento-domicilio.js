// ===== Provincias: cargar desde provincias-es.json con fallback =====
let PROVINCIAS_ES = [];
let PAISES_FULL = [];
(async function cargarProvinciasES(){
  try{
    // SOLO JS: prioriza variables globales definidas en js/provincias_es.js
    if (Array.isArray(window.PROVINCIAS_ES) && window.PROVINCIAS_ES.length){
      PROVINCIAS_ES = window.PROVINCIAS_ES.slice();
    } else if (Array.isArray(window.PROVINCIAS_ES_GLOBAL) && window.PROVINCIAS_ES_GLOBAL.length){
      PROVINCIAS_ES = window.PROVINCIAS_ES_GLOBAL.slice();
    } else {
      throw new Error('No hay global de provincias (usa js/provincias_es.js)');
    }
    }catch(_e){
    // Fallback mínimo para no romper la UI
    PROVINCIAS_ES = [
      "SANTA CRUZ DE TENERIFE",
      "LA CORUÑA","ALAVA","ALBACETE","ALICANTE","ALMERIA","ASTURIAS","AVILA","BADAJOZ",
      "BALEARES","BARCELONA","BURGOS","CACERES","CADIZ","CANTABRIA","CASTELLON/CASTELLO",
      "CIUDAD REAL","CORDOBA","CUENCA","GIRONA","GRANADA","GUADALAJARA","GUIPUZCOA",
      "HUELVA","HUESCA","JAEN","LA RIOJA","LAS PALMAS","LEON","LLEIDA","LUGO","MADRID",
      "MALAGA","MURCIA","NAVARRA","ORENSE","PALENCIA","PONTEVEDRA","SALAMANCA","SEGOVIA",
      "SEVILLA","SORIA","TARRAGONA","TERUEL","TOLEDO","VALENCIA","VALLADOLID","VIZCAYA",
      "ZAMORA","ZARAGOZA","CEUTA","MELILLA","-"
    ];
    console.warn('⚠️ Usando fallback de provincias al no encontrar globals.');
  }
  poblarProvincias('provNacimiento');
  poblarProvincias('provDomicilio');
})();

// ===== Municipios: robusto (objeto por provincias o array plano) =====
let MUNICIPIOS_ES = { type:null, data:null, ready:false };

function __normUp(s){
  return String(s||'')
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g,'')
    .toUpperCase();
}
(async function cargarMunicipios(){
  try{
    // SOLO JS: prioriza variables globales definidas en js/municipios.js
    // Admite: window.MUNICIPIOS_ES (mapa o array), window.MUNICIPIOS_MAP, window.MUNICIPIOS_FLAT, window.MUNICIPIOS
    let g = null;
    if (typeof window.MUNICIPIOS_ES   !== 'undefined') g = window.MUNICIPIOS_ES;
    else if (typeof window.MUNICIPIOS_MAP  !== 'undefined') g = window.MUNICIPIOS_MAP;
    else if (typeof window.MUNICIPIOS_FLAT !== 'undefined') g = window.MUNICIPIOS_FLAT;
    else if (typeof window.MUNICIPIOS      !== 'undefined') g = window.MUNICIPIOS;

    if (!g) throw new Error('No hay global de municipios (usa js/municipios.js)');

    if (Array.isArray(g)){
      // Array plano -> autocompletar sin provincia
      MUNICIPIOS_ES = { type:'flat', data:new Set(g.map(__normUp)), ready:true };
    } else if (g && typeof g === 'object'){
      // Mapa { PROV: [mun,...] }
      const map = {};
      for (const [k,v] of Object.entries(g)){
        map[__normUp(k)] = Array.isArray(v) ? v.slice() : [];
      }
      MUNICIPIOS_ES = { type:'map', data:map, ready:true };
    } else {
      throw new Error('Formato de municipios global inválido');
    }
  }catch(e){
    console.error("No se pudo cargar municipios (globals):", e);
    MUNICIPIOS_ES = { type:'map', data:{}, ready:true };
  }
  // Si ya hay provincia elegida, repoblar
  try{
    const pN = document.getElementById('provNacimiento')?.value;
    if (pN) poblarMunicipios('munNacimiento', pN);
    const pD = document.getElementById('provDomicilio')?.value;
    if (pD) poblarMunicipios('munDomicilio', pD);
  }catch(_e){}
})();

function getMunicipios(prov){
  if (!MUNICIPIOS_ES.ready) return null;
  if (MUNICIPIOS_ES.type === 'flat'){
    return Array.from(MUNICIPIOS_ES.data); // sin orden automático
  }
  const key = __normUp(prov);
  return (MUNICIPIOS_ES.data[key] || []).slice();}

// ===== Países: rellenar DATALISTS (SOLO JS) =====
(async function poblarPaisesDatalist(){
  const conf = [
    { inputId: 'paisNacimiento', listId: 'listaPaisNacimiento' },
    { inputId: 'nacionalidadInput', listId: 'listaNacionalidad' }
  ];
  const pairs = conf
    .map(c => ({ inp: document.getElementById(c.inputId), dl: document.getElementById(c.listId) }))
    .filter(o => o.inp && o.dl);
  if (!pairs.length) return;

  function fillList(datalist, values){
    datalist.innerHTML = values.map(v => `<option value="${String(v)}"></option>`).join('');
  }

  // SOLO JS: usar window.PAISES
  let values = [];
  const data = (typeof window.PAISES !== 'undefined') ? window.PAISES : (typeof window.paises !== 'undefined' ? window.paises : null);
  if (data){
    if (Array.isArray(data)){
      values = data.slice();
    } else if (data && typeof data === 'object'){
      const featured = Array.isArray(data.featured) ? data.featured.slice() : [];
      const grouped  = Array.isArray(data.groups) ? data.groups.flatMap(g => (Array.isArray(g.items) ? g.items : [])) : [];
      values = [...featured, ...grouped];
    }
  }

  // Store full countries list for explicit filtering
  PAISES_FULL = values.slice();

  // Si no hay valores, avisa pero no rompe
  if (!values.length){
    console.warn('⚠️ No hay window.PAISES definido en js/paises.js');
  }

  // Mover ESPAÑA al inicio si existe
  if (values.length){
    const idx = values.findIndex(x => String(x).toUpperCase() === 'ESPAÑA');
    if (idx > 0){ const sp = values.splice(idx,1)[0]; values.unshift(sp); }
  }

  pairs.forEach(({dl}) => fillList(dl, values));
  pairs.forEach(({inp}) => { inp.setAttribute('autocomplete','off'); });
})();

// Explicit filtering for paisNacimiento input
document.addEventListener('DOMContentLoaded', function(){
  const inp = document.getElementById('paisNacimiento');
  const dl  = document.getElementById('listaPaisNacimiento');
  if (!inp || !dl) return;

  inp.addEventListener('input', function(){
    const q = String(inp.value || '').trim().toLowerCase();
    const base = Array.isArray(PAISES_FULL) && PAISES_FULL.length ? PAISES_FULL : [];
    const list = q
      ? base.filter(function(v){ return String(v).toLowerCase().includes(q); })
      : base;
    dl.innerHTML = list.map(function(v){
      return '<option value="'+String(v).replace(/"/g,'&quot;')+'"></option>';
    }).join('');
  }, {passive:true});
});

// ===== Utilidades UI =====
function poblarProvincias(selectId){
  const sel = document.getElementById(selectId);
  if (!sel) return;
  let arr = Array.isArray(PROVINCIAS_ES) ? PROVINCIAS_ES.slice() : [];
  const idx = arr.findIndex(p => String(p).toUpperCase() === 'SANTA CRUZ DE TENERIFE');
  if (idx > -1){ const sc = arr.splice(idx,1)[0]; arr.unshift(sc); }
  const opts = ['<option value="">-- Provincia --</option>']
    .concat(arr.map(p => `<option value="${p}">${p}</option>`)).join('');
  sel.innerHTML = opts;
}
function poblarMunicipios(selectId, prov){
  const el = document.getElementById(selectId);
  if (!el) return;

  // Espera a que MUNICIPIOS_ES esté listo
  if (!MUNICIPIOS_ES.ready){
    if (el.tagName === 'SELECT'){
      el.innerHTML = '<option value="">Cargando municipios…</option>';
      el.disabled = true;
    }
    const t = setInterval(()=>{
      if (MUNICIPIOS_ES.ready){
        clearInterval(t);
        poblarMunicipios(selectId, prov);
      }
    }, 200);
    return;
  }

  const lista = getMunicipios(prov) || [];

  if (el.tagName === 'SELECT'){
    el.disabled = false;
    const opts = ['<option value="">-- Municipio --</option>']
      .concat(lista.map(m => `<option value="${m}">${m}</option>`))
      .join('');
    el.innerHTML = opts;
    return;
  }
  if (el.tagName === 'INPUT' && el.getAttribute('list')){
    const dl = document.getElementById(el.getAttribute('list'));
    if (!dl) return;
    dl.innerHTML = lista.map(m => `<option value="${m}"></option>`).join('');
    el.value = '';
    return;
  }
}
function isSpain(v){
  const t = String(v||'').trim().normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase();
  return t === 'ESPAÑA' || t === 'ESPANA' || t === 'ES';
}

// ===== Enlaces y sincronización =====
const paisInp = document.getElementById('paisNacimiento');
const provNac = document.getElementById('provNacimiento');
const munNac  = document.getElementById('munNacimiento');
const lugarNacHidden = document.getElementById('lugarNacimientoHidden');

const domSel = document.getElementById('domicilioOpcion');
const domBlk = document.getElementById('domicilioBloque');
const provDom = document.getElementById('provDomicilio');
const munDom  = document.getElementById('munDomicilio');
const dirDom  = document.getElementById('direccionDomicilio');
const domHidden = document.getElementById('domicilioTextoHidden');

function recomputeLugarNacimiento(){
  const pais = (paisInp.value||'').trim();
  if (isSpain(pais)){
    const p = (provNac.value||'').trim();
    const m = (munNac.value||'').trim();
    lugarNacHidden.value = (m && p) ? `${m}, ${p}` : (p || m || 'ESPAÑA');
  } else {
    lugarNacHidden.value = pais || '';
  }
}

function handlePaisNacimientoChange(){
  const esES = isSpain(paisInp.value);
  provNac.style.display = esES ? 'block' : 'none';
  munNac.style.display  = esES ? 'block' : 'none';
  provNac.required = esES;
  munNac.required  = esES;
  if (!esES){ provNac.value=''; munNac.value=''; provNac.required=false; munNac.required=false; }
  recomputeLugarNacimiento();
}
paisInp.addEventListener('change', handlePaisNacimientoChange, {passive:true});
paisInp.addEventListener('input',  handlePaisNacimientoChange, {passive:true});
provNac.addEventListener('change', ()=>{
  poblarMunicipios('munNacimiento', provNac.value);
  munNac.value='';
  recomputeLugarNacimiento();
}, {passive:true});
munNac.addEventListener('input', recomputeLugarNacimiento, {passive:true});
munNac.addEventListener('change', recomputeLugarNacimiento, {passive:true});

// Domicilio
domSel.addEventListener('change', ()=>{
  const v = domSel.value;
  const aporta = (v === 'APORTA');

  if (aporta){
    // Mostrar bloque como columna con separación de 8px
    domBlk.style.display = 'flex';
    domBlk.style.flexDirection = 'column';
    domBlk.style.gap = '8px';

    // Mostrar campos inmediatamente
    if (provDom) provDom.style.display = 'block';
    if (munDom)  munDom.style.display  = 'block';
    if (dirDom)  dirDom.style.display  = 'block';

    // Requeridos
    provDom.required = true;
    munDom.required  = true;
    dirDom.required  = true;
  } else {
    // Ocultar todo y limpiar valores/requisitos
    domBlk.style.display = (v ? 'none' : 'none');
    if (provDom){ provDom.value=''; provDom.required=false; }
    if (munDom){  munDom.value='';  munDom.required=false;  munDom.style.display='none'; }
    if (dirDom){  dirDom.value='';  dirDom.required=false;  dirDom.style.display='none'; }
  }

  // Sincronizar hidden clásico
  domHidden.value = (v === 'NO APORTA') ? 'NO APORTA' : (aporta ? (dirDom.value||'') : '');
}, {passive:true});
provDom.addEventListener('change', ()=>{ poblarMunicipios('munDomicilio', provDom.value); munDom.value=''; }, {passive:true});
dirDom.addEventListener('input', ()=>{ if (domSel.value === 'APORTA'){ domHidden.value = dirDom.value; } }, {passive:true});

// --- AUTO-APERTURA DE DIRECCIÓN (abre el bloque y enfoca tras seleccionar municipio/provincia) ---
function abrirDomicilioYEnfocar(campo){
  if (domSel.value !== 'APORTA'){
    domSel.value = 'APORTA';
    domSel.dispatchEvent(new Event('change'));
  } else {
    domBlk.style.display = 'flex';
    domBlk.style.flexDirection = 'column';
    domBlk.style.gap = '8px';
    provDom.required = true; munDom.required = true; dirDom.required = true;
  }
  /* no auto-focus in domicilio; user will decide */
  if (campo === 'dir'  && dirDom)  { dirDom.style.display='block'; }
}

provDom.addEventListener('mousedown', ()=>abrirDomicilioYEnfocar('prov'), {passive:true});
munDom.addEventListener('mousedown', ()=>abrirDomicilioYEnfocar('mun'),  {passive:true});
provDom.addEventListener('change',   ()=>abrirDomicilioYEnfocar('mun'),  {passive:true});

function _abrirDirSiHayMunSinFoco(){
  if ((munDom.value||'').trim().length){
    if (domSel.value !== 'APORTA'){
      domSel.value = 'APORTA';
      domSel.dispatchEvent(new Event('change'));
    } else {
      domBlk.style.display = 'flex';
      domBlk.style.flexDirection = 'column';
      domBlk.style.gap = '8px';
      provDom.required = true; munDom.required = true; dirDom.required = true;
    }
    dirDom.style.display = 'block';
  }
}
munDom.addEventListener('change', _abrirDirSiHayMunSinFoco, {passive:true});
munDom.addEventListener('blur',   _abrirDirSiHayMunSinFoco, {passive:true});

document.addEventListener('DOMContentLoaded', ()=>{
  const tieneMun  = (munDom.value||'').trim().length>0;
  const tieneProv = (provDom.value||'').trim().length>0;
  if (tieneMun || tieneProv) abrirDomicilioYEnfocar(tieneMun ? 'dir' : 'mun');
}, {once:true});

// ===== Rehidratación de DOMICILIO desde JSON (usado por importarJSON) =====
window.configureDomicilioFromJson = function(options){
  options = options || {};
  const domSel   = document.getElementById('domicilioOpcion');
  const provDom  = document.getElementById('provDomicilio');
  const munDom   = document.getElementById('munDomicilio');
  const dirDom   = document.getElementById('direccionDomicilio');
  const domHidden = document.getElementById('domicilioTextoHidden');

  if (!domSel) return;

  const rawDom = options.domicilioTexto != null ? String(options.domicilioTexto).trim() : '';
  const pD     = options.provincia != null ? String(options.provincia).trim() : '';
  const mD     = options.municipio != null ? String(options.municipio).trim() : '';

  const dNorm = rawDom
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '')
    .toUpperCase();

  // Caso explícito: NO APORTA → forzar select y limpiar resto
  if (dNorm === 'NOAPORTA' || dNorm === 'NOAPORTA'){
    domSel.value = 'NO APORTA';
    domSel.dispatchEvent(new Event('change'));
    if (provDom) provDom.value = '';
    if (munDom)  munDom.value  = '';
    if (dirDom){
      dirDom.value = '';
      dirDom.dispatchEvent(new Event('input'));
    }
    if (domHidden) domHidden.value = 'NO APORTA';
    return;
  }

  // Si hay algún dato de domicilio → APORTA
  if (pD || mD || rawDom){
    if (domSel.value !== 'APORTA'){
      domSel.value = 'APORTA';
      domSel.dispatchEvent(new Event('change'));
    }

    // Helper local para casar selects con opciones existentes (similar a ESV del patch importarJSON)
    function setSelectValue(sel, val){
      if (!sel || !val) return;
      const sVal = String(val).trim();
      if (!sVal) return;
      let opt = Array.from(sel.options).find(o => o.value === sVal) ||
                Array.from(sel.options).find(o => o.textContent === sVal);
      if (!opt){
        opt = document.createElement('option');
        opt.value = sVal;
        opt.textContent = sVal;
        sel.appendChild(opt);
      }
      sel.value = sVal;
      sel.dispatchEvent(new Event('change'));
    }

    if (provDom && pD){
      setSelectValue(provDom, pD);
    }
    if (munDom && mD){
      munDom.value = mD;
      munDom.dispatchEvent(new Event('input'));
      munDom.dispatchEvent(new Event('change'));
    }
    if (dirDom && rawDom){
      dirDom.value = rawDom;
      dirDom.dispatchEvent(new Event('input'));
    }
  }
};

// ===== Inyección al JSON exportado (añade campos extendidos) =====
(function installExportWrapper(){
  function hook(){
    if (typeof window.exportarJSON !== 'function'){ return setTimeout(hook, 50); }
    const prev = window.exportarJSON;
    window.exportarJSON = async function(){
      const form = document.getElementById('registroForm');
      form.setAttribute('data-pais-nac', (paisInp.value||'').trim());
      form.setAttribute('data-prov-nac', (provNac.value||'').trim());
      form.setAttribute('data-mun-nac',  (munNac.value||'').trim());
      form.setAttribute('data-prov-dom', (provDom.value||'').trim());
      form.setAttribute('data-mun-dom',  (munDom.value||'').trim());
      const __save = window.saveBlobJson;
      window.saveBlobJson = async function(text, filename){
        try{
          const obj = JSON.parse(text);
          obj["Nacionalidad"] = (function(v){
            return String(v || "").trim();
          })(document.getElementById('nacionalidadInput')?.value ?? obj["Nacionalidad"]);
          const P  = String(form.getAttribute('data-pais-nac')||'').trim();
          const Pr = String(form.getAttribute('data-prov-nac')||'').trim();
          const Mu = String(form.getAttribute('data-mun-nac')||'');
          const PD = String(form.getAttribute('data-prov-dom')||'').trim();
          const MD = String(form.getAttribute('data-mun-dom')||'');

          obj["pais-nacimiento"]      = P;
          obj["provincia-nacimiento"] = Pr;
          obj["municipio-nacimiento"] = Mu;

          obj["provincia-domicilio"]  = PD;
          obj["municipio-domicilio"]  = MD;

          const esES = (P === 'ESPAÑA' || P === 'ESPANA' || P === 'ES' || P === 'SPAIN' || P === 'REINO DE ESPANA');
          if (P){
            obj["Lugar de nacimiento"] = esES ? ((Mu && Pr) ? `${Mu}, ${Pr}` : (Pr || Mu || 'ESPAÑA')) : P;
          }
          text = JSON.stringify(obj, null, 2);
        }catch(_e){}
        return __save.call(this, text, filename);
      };
      try{
        return await prev.apply(this, arguments);
      } finally {
        window.saveBlobJson = __save;
      }
    };
  }
  hook();
})();