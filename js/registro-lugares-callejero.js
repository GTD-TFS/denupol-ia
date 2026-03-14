

/**
 * =============================
 * LUGARES (HECHO / DETENCIÓN)
 * + CALLEJERO ADEJE/ARONA
 * Archivo externo: registro-lugares-callejero.js
 * =============================
 */

// --- Lógica de selección de municipio, vía y resto para HECHO / DETENCIÓN ---
(function(){
  const form = document.getElementById('registroForm');

  const selH = document.getElementById('munHechoSel');
  const viaH = document.getElementById('viaHecho');
  const otroH = document.getElementById('munHechoOtro');
  const hidH = document.getElementById('lugarHechoHidden');
  const restoH = document.getElementById('restoHecho');

  const selD = document.getElementById('munDetSel');
  const viaD = document.getElementById('viaDet');
  const otroD = document.getElementById('munDetOtro');
  const hidD = document.getElementById('lugarDetHidden');
  const restoD = document.getElementById('restoDet');

  function compose(via, resto, _muni){
    const v = String(via||'').trim();
    const r = String(resto||'').trim();
    return v ? (r ? (v + ' ' + r) : v) : (r || '');
  }

  function muniFromSelection(selEl, otroEl){
    if (!selEl) return '';
    const v = selEl.value;
    if (v === 'OTRO') return (otroEl?.value||'');
    return v || '';
  }

  function updateHecho(evt){
    if (!selH || !viaH || !hidH) return;
    const choice = selH.value;
    const fromTyping = evt && evt.type === 'input' && (evt.target === viaH || evt.target === otroH);

    otroH.style.display = (choice === 'OTRO') ? 'block' : 'none';
    viaH.style.display  = choice ? 'block' : 'none';
    if (restoH) { restoH.style.display = (viaH.value || restoH.value) ? 'block' : 'none'; }

    const muni = muniFromSelection(selH, otroH);
    hidH.value = compose(viaH.value, (restoH?.value||''), muni);
    if (form) form.setAttribute('data-mun-hecho', String(muni).toUpperCase());

    if (!fromTyping) {
      if (choice === 'OTRO') {
        if (otroH) { try{ otroH.focus(); }catch(_){} }
      } else if (choice === 'ADEJE' || choice === 'ARONA') {
        if (viaH) { try{ viaH.focus(); }catch(_){} }
      }
    }
  }

  function updateDet(evt){
    if (!selD || !viaD || !hidD) return;
    const choice = selD.value;
    const fromTyping = evt && evt.type === 'input' && (evt.target === viaD || evt.target === otroD);

    otroD.style.display = (choice === 'OTRO') ? 'block' : 'none';
    viaD.style.display  = choice ? 'block' : 'none';
    if (restoD) { restoD.style.display = (viaD.value || restoD.value) ? 'block' : 'none'; }

    const muni = muniFromSelection(selD, otroD);
    hidD.value = compose(viaD.value, (restoD?.value||''), muni);
    if (form) form.setAttribute('data-mun-detencion', String(muni).toUpperCase());

    if (!fromTyping) {
      if (choice === 'OTRO') {
        if (otroD) { try{ otroD.focus(); }catch(_){} }
      } else if (choice === 'ADEJE' || choice === 'ARONA') {
        if (viaD) { try{ viaD.focus(); }catch(_){} }
      }
    }
  }

  if (selH) {
    selH.addEventListener('input',  updateHecho, {passive:true});
    selH.addEventListener('change', updateHecho, {passive:true});
  }
  if (viaH) {
    viaH.addEventListener('input',  (e)=>updateHecho(e), {passive:true});
  }
  if (otroH){
    otroH.addEventListener('input', (e)=>updateHecho(e), {passive:true});
  }

  if (selD) {
    selD.addEventListener('input',  updateDet, {passive:true});
    selD.addEventListener('change', updateDet, {passive:true});
  }
  if (viaD) {
    viaD.addEventListener('input',  (e)=>updateDet(e), {passive:true});
  }
  if (otroD){
    otroD.addEventListener('input', (e)=>updateDet(e), {passive:true});
  }

  updateHecho();
  updateDet();

  if (selH && viaH) {
    selH.addEventListener('click', ()=>{ viaH.style.display = 'block'; }, {passive:true});
    selH.addEventListener('change', ()=>{
      updateHecho();
      if (selH.value === 'OTRO') {
        if (otroH) { try{ otroH.focus(); }catch(_){} }
      } else {
        if (viaH) { try{ viaH.focus(); }catch(_){} }
      }
    }, {passive:true});
  }

  if (selD && viaD) {
    selD.addEventListener('click', ()=>{ viaD.style.display = 'block'; }, {passive:true});
    selD.addEventListener('change', ()=>{
      updateDet();
      if (selD.value === 'OTRO') {
        if (otroD) { try{ otroD.focus(); }catch(_){} }
      } else {
        if (viaD) { try{ viaD.focus(); }catch(_){} }
      }
    }, {passive:true});
  }

  function esValidaEnCallejero(muni, via){
    try {
      if (typeof window.esCalleValida === 'function') return !!window.esCalleValida(muni, via);
    } catch(_) {}
    return true;
  }

  function validarViaYMostrarResto(selEl, viaEl, restoEl, hidEl, otroEl){
    const muni = muniFromSelection(selEl, otroEl);
    if (!selEl || !viaEl || !hidEl) return;

    if (!muni || String(muni).toUpperCase() === 'OTRO'){
      if (restoEl) restoEl.style.display = (viaEl.value.trim() || (restoEl?.value||'').trim()) ? 'block' : 'none';
      hidEl.value = compose(viaEl.value, (restoEl?.value||''), '');
      return;
    }

    const ok = esValidaEnCallejero(muni, viaEl.value);
    if (!ok){
      if (restoEl) restoEl.style.display = (viaEl.value.trim() || (restoEl?.value||'').trim()) ? 'block' : 'none';
      hidEl.value = compose(viaEl.value, (restoEl?.value||''), '');
      const panel = document.getElementById('message');
      if (panel){
        panel.textContent = '⚠️ La vía debe existir en el callejero de ' + String(muni).toUpperCase() + '⚠️';
        panel.style.color = '#ffcc66';
      }
      return;
    }

    if (restoEl){
      restoEl.style.display = 'block';
    }
    hidEl.value = compose(viaEl.value, (restoEl?.value||''), '');
  }

  if (viaH) {
    viaH.addEventListener('blur',  ()=>validarViaYMostrarResto(selH, viaH, restoH, hidH, otroH), {passive:true});
  }
  if (viaD) {
    viaD.addEventListener('blur',  ()=>validarViaYMostrarResto(selD, viaD, restoD, hidD, otroD), {passive:true});
  }
  if (restoH) {
    restoH.addEventListener('input', ()=>{
      const m = muniFromSelection(selH, otroH);
      hidH.value = compose(viaH.value, restoH.value, m);
    }, {passive:true});
  }
  if (restoD) {
    restoD.addEventListener('input', ()=>{
      const m = muniFromSelection(selD, otroD);
      hidD.value = compose(viaD.value, restoD.value, m);
    }, {passive:true});
  }

  document.addEventListener('DOMContentLoaded', ()=> {
    try {
      updateHecho();
      updateDet();
      if (selH && viaH && selH.value) { viaH.style.display = 'block'; }
      if (selD && viaD && selD.value) { viaD.style.display = 'block'; }
      setTimeout(()=>{ try{ updateHecho(); }catch(_){} }, 0);
      setTimeout(()=>{ try{ updateDet(); }catch(_){} }, 0);
    } catch(_e){}
  }, {once:true});

})();

// --- CALLEJERO ADEJE / ARONA ---
(function callesMunicipales(){
  const viaH = document.getElementById('viaHecho');
  const viaD = document.getElementById('viaDet');
  const selH = document.getElementById('munHechoSel');
  const selD = document.getElementById('munDetSel');
  const restoH = document.getElementById('restoHecho');
  const restoD = document.getElementById('restoDet');
  if (!viaH && !viaD) return;

  let dlH = document.getElementById('listaViaHecho');
  if (!dlH){ dlH = document.createElement('datalist'); dlH.id = 'listaViaHecho'; document.body.appendChild(dlH); }
  let dlD = document.getElementById('listaViaDet');
  if (!dlD){ dlD = document.createElement('datalist'); dlD.id = 'listaViaDet'; document.body.appendChild(dlD); }
  if (viaH) viaH.setAttribute('list','listaViaHecho');
  if (viaD) viaD.setAttribute('list','listaViaDet');

  let DB = null;

  async function loadDB(){
    if (DB) return DB;
    if (typeof window.CALLEJERO !== 'undefined' && window.CALLEJERO){
      DB = window.CALLEJERO;
      return DB;
    }
    DB = {};
    try{
      const panel = document.getElementById('message');
      if (panel){
        panel.textContent = '⚠️ No se ha cargado ./calles.js (callejero). Abre este archivo con calles.js en la misma carpeta.';
        panel.style.color = '#ffcc66';
      }
    }catch(_){ }
    return DB;
  }

  function buildOptionsForMunicipio(muni, frag){
    const U = (s)=>String(s||'').trim().toUpperCase();
    const src = (DB && DB[U(muni)]) ? DB[U(muni)] : null;
    if (!src) return [];
    const f = String(frag||'').trim().toLowerCase();
    const out = [];
    Object.keys(src).forEach(tipo=>{
      const arr = Array.isArray(src[tipo]) ? src[tipo] : [];
      for (const nombre of arr){
        const base = String(nombre).replace(new RegExp('^'+tipo+'\\s+','i'), '');
        const full = `${tipo} ${base}`;
        if (!f || full.toLowerCase().includes(f)) out.push(full);
      }
    });
    out.sort((a,b)=>a.localeCompare(b,'es'));
    return out;
  }

  function renderList(dl, items){
    if (!dl) return;
    dl.innerHTML = '';
    const frag = document.createDocumentFragment();
    for (const v of items){
      const o = document.createElement('option');
      o.value = v;
      frag.appendChild(o);
    }
    dl.appendChild(frag);
  }

  function unionCalles(frag){
    const a = buildOptionsForMunicipio('ADEJE', frag || null);
    const b = buildOptionsForMunicipio('ARONA', frag || null);
    const set = new Set([...(a||[]), ...(b||[])]);
    return Array.from(set).sort((x,y)=>x.localeCompare(y,'es'));
  }

  function refreshHecho(frag){
    if (!dlH) return;
    const muni = selH ? String(selH.value || '').toUpperCase() : '';
    let items;
    if (muni === 'ADEJE' || muni === 'ARONA') {
      items = buildOptionsForMunicipio(muni, frag || null);
    } else {
      // Si no hay municipio seleccionado o es OTRO, usamos el conjunto unido (ADEJE+ARONA) como antes
      items = unionCalles(frag);
    }
    renderList(dlH, items);
  }
  function refreshDet(frag){
    if (!dlD) return;
    const muni = selD ? String(selD.value || '').toUpperCase() : '';
    let items;
    if (muni === 'ADEJE' || muni === 'ARONA') {
      items = buildOptionsForMunicipio(muni, frag || null);
    } else {
      // Si no hay municipio seleccionado o es OTRO, usamos el conjunto unido (ADEJE+ARONA) como antes
      items = unionCalles(frag);
    }
    renderList(dlD, items);
  }

  loadDB().then(()=>{
    try {
      window.callejeroOpciones = (muni, frag) => buildOptionsForMunicipio(muni, frag);
      window.esCalleValida = (muni, via) => {
        const opts = buildOptionsForMunicipio(muni, null);
        const U = s=>String(s||'').trim().toUpperCase();
        return opts.some(o => U(o) === U(via));
      };
    } catch(_) { }

    refreshHecho();
    refreshDet();

    if (selH) {
      selH.addEventListener('change', ()=>refreshHecho(viaH?.value||''), {passive:true});
    }
    if (selD) {
      selD.addEventListener('change', ()=>refreshDet(viaD?.value||''), {passive:true});
    }

    if (viaH) viaH.addEventListener('input', ()=>refreshHecho(viaH.value), {passive:true});
    if (viaD) viaD.addEventListener('input', ()=>refreshDet(viaD.value), {passive:true});
  });
})();