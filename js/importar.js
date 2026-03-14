

/* PATCH compacto: importarJSON + rehidratación completa (mismo comportamiento, menos código) */
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
        // DOMICILIO_OPCION se gestiona en configureDomicilioFromJson (registro-nacimiento-domicilio.js).
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

          // DOMICILIO: delegamos la lógica de rehidratación en registro-nacimiento-domicilio.js
          const pD = gv('provincia-domicilio');
          const mD = gv('municipio-domicilio');
          const dD = gv('direccion-domicilio', 'Domicilio', 'DOMICILIO');
          if (typeof configureDomicilioFromJson === 'function') {
            configureDomicilioFromJson({
              provincia: pD,
              municipio: mD,
              domicilioTexto: dD
            });
          }
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
})();