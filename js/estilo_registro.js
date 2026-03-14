// estilo_registro.js — inyecta el CSS EXACTO del archivo REG JASON.restored.html (sin cambios visuales)
(function () {
  if (document.getElementById('__css_reg_jason')) return;
  const css = `
  :root { --primary:#3498db; --hover:#2980b9; --panel:rgba(0,0,0,0.75); --text:#fff; --field-bg:rgba(255,255,255,0.9); --border:#aaa; --radius:12px; --space:16px; --card-pad:14px; }
  *{box-sizing:border-box}
  body{
    margin:0;padding:0;font-family:Segoe UI,Roboto,Arial,sans-serif;
    min-height:100vh;display:flex;flex-direction:column;justify-content:flex-start;
  }
  form{background:var(--panel);color:var(--text);border-radius:var(--radius);max-width:1400px;margin:0 auto 32px;padding:0 32px;box-shadow:0 10px 28px rgba(0,0,0,.6);}
  h2{font-size:20px;text-transform:uppercase;margin-top:30px;margin-bottom:38px;border-bottom:2px solid var(--primary);padding-bottom:14px;letter-spacing:.5px;}
  .field-card{background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.18);border-radius:10px;padding:var(--card-pad);display:flex;flex-direction:column;gap:8px;min-height:94px;}
  label{font-weight:700;font-size:12px;margin-bottom:2px;text-transform:uppercase;letter-spacing:.6px;}
  input,select,textarea{width:100%;padding:5px;border:1px solid var(--border);border-radius:8px;font-size:14px;background:var(--field-bg);color:#000;}
  textarea{resize:vertical;min-height:56px;}
  input:focus,select:focus,textarea:focus{outline:none;border-color:var(--primary);box-shadow:0 0 0 2px rgba(52,152,219,.25);}
  .actions{text-align:center;margin-top:26px;}
  button{color:#fff;padding:14px 26px;border:none;border-radius:10px;font-weight:800;font-size:15px;text-transform:uppercase;cursor:pointer;letter-spacing:.6px;display:block;width:100%;margin-bottom:20px;}
  button:hover{opacity:0.9;}
  #message{margin-top:12px;text-align:center;font-weight:bold;color:#fff;}

  .field-card { padding: 10px; gap: 6px; min-height: 64px; }
  textarea { min-height: 34px; }

  .grid-rows {
    display: flex;
    flex-wrap: wrap;
    column-gap: .5rem;
    row-gap: 17px;
  }
  .grid-rows .field-card { flex: 1; min-width: 200px; }
  @media (max-width: 768px) {
    .grid-rows { flex-direction: column; }
    .grid-rows .field-card { width: 100% !important; min-width: unset !important; }
  }
  input[type="time"] { width: 100px; text-align: center; }
  .field-card input[type="time"] { width: 100px !important; text-align: center; display: inline-block; }
  .field-card.small-width { max-width: 160px !important; flex: 0 0 160px !important; }
  .field-card.small-width input[type="time"] { width: 100%; text-align: center; }

  /* ACCIONES: botones apilados, centrados y con un único estilo (igual para todos) */
  .actions{
    display:flex;
    flex-direction:column;
    align-items:center;
    justify-content:center;
    gap:12px;
    margin-top:26px;
  }

  .actions button,
  .actions .zip,
  .actions .json,
  .actions .xlsx,
  .actions .refresh,
  .actions #goRoaBtn{
    display:block !important;
    width:min(520px, calc(100% - 36px)) !important;
    margin:0 auto !important;
    padding:14px 18px !important;

    border-radius:14px !important;
    font-weight:900 !important;
    font-size:15px !important;
    letter-spacing:.3px !important;
    text-transform:uppercase !important;

    color:#fff !important;
    border:1px solid rgba(120,160,255,.55) !important;

    background:linear-gradient(135deg, rgba(90,130,255,.35), rgba(40,70,220,.28)) !important;

    box-shadow:
      inset 0 1px 0 rgba(255,255,255,0.16),
      0 10px 26px rgba(40,80,255,.45) !important;

    backdrop-filter: blur(4px) saturate(130%);
    -webkit-backdrop-filter: blur(4px) saturate(130%);

    cursor:pointer;
    transition: transform .08s ease, box-shadow .18s ease, background .25s ease;

    /* neutralizamos estilos anteriores */
    animation:none !important;
  }

  .actions button:hover{
    transform:translateY(-1px);
    box-shadow:
      inset 0 1px 0 rgba(255,255,255,0.22),
      0 0 0 2px rgba(120,160,255,.45),
      0 12px 28px rgba(0,0,0,.55),
      0 0 24px rgba(120,170,255,.28);
  }

  .actions button:active{
    transform:translateY(1px);
    box-shadow:
      inset 0 1px 0 rgba(255,255,255,0.18),
      0 6px 18px rgba(40,80,255,.35);
  }
  
  body::before{
    content: "";
    position: fixed;
    inset: 0;
    background: #020617 url("./b.png") center center / cover no-repeat;
    pointer-events: none;
    z-index: -2;
  }

  body.bg-alt::before{
    background: #020617 url("./b.png") center center / cover no-repeat;
  }

  body.bg-lago::before{
    background: #020617 url("./b.png") center center / cover no-repeat;
  }
    
  body::after{
    content: "";
    position: fixed;
    inset: 0;
    pointer-events: none;
    z-index: -1;
    background: transparent;
  }
  body.paused::before{
    animation-play-state: paused !important;
  }
  body.paused::after{
    animation-play-state: paused !important;
  }

  .star-layer{
    display: none !important;
  }

  body.zoomImpact::before{
    animation: strongZoom 1.2s ease-out forwards;
  }
  body.zoomImpact::after{
    animation: strongZoom 1.2s ease-out forwards;
  }
  @keyframes strongZoom{
    0%{
      background-size: 100% auto;
      background-position: 50% 70%;
    }
    40%{
      background-size: 510% auto;
      background-position: 50% 70%;
    }
    100%{
      background-size: 100% auto;
      background-position: 50% 70%;
    }
  }
  #delitoOtroTexto::placeholder { color:#ff0000; opacity:1; }

  /* Contenedor de chips de delitos: estilo sobrio */
  #delitosSeleccionados{
    border: none !important;
    border-radius: 10px !important;
    padding: 0 !important;
    box-shadow: none !important;
    min-height: 0;
    display: flex;
    flex-direction: column;
    gap: 6px;
    align-items: stretch;
    justify-content: flex-start;
  }

  /* Chips de delitos: cada chip ocupa todo el ancho y texto centrado */
  #delitosSeleccionados span,
  #delitosSeleccionados .chip{
    border: 1px solid rgba(255,255,255,0.30);
    border-radius: 999px;
    padding: 4px 10px;
    background: transparent;
    font-size: 12px;
    font-weight: 600;
    letter-spacing: .4px;
    color: #ffffff;
    display: block;
    width: 100%;
    text-align: center;
    box-sizing: border-box;
  }

  #marca-registro {
    position: fixed; bottom: 0%; right: 5px; font-size: 8px;
    color: rgba(255, 0, 0, 0.5); pointer-events: none; user-select: none; z-index: 9999;
    font-family: Arial, sans-serif; text-align: center; line-height: 1.2;
  }
  .field-card, .field-card * { text-align: center; }
  .field-card { align-items: center; }
  select { text-align-last: center; }

  .titulo-img { text-align:center; margin:0; }
  .titulo-img img { max-width:100%; height:auto; display:inline-block; filter: drop-shadow(2px 2px 8px rgba(0,0,0,0.7)); }

:root { --grid-bottom-gap: 26px; } 
.grid-rows:last-of-type {
  margin-bottom: var(--grid-bottom-gap) !important;
}
:root { --button-height: 80px; }
.actions.actions-outside { margin-top: calc(var(--button-height) / 2) !important; }

  body{
  margin:0;
  font-family: Segoe UI,Roboto,Arial,sans-serif;
  color:#eef2ff !important;
  background-color:#020617 !important;
  min-height:100vh;
  overflow-x:hidden;
  position:relative;
}
  h2, label, .modo-titulo {
    background: linear-gradient(
      120deg,
      #9dbedfff 0%,
      #3e6b9fff 50%,
      #9dbedfff 100%
    );
    background-size: 200% auto;
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
    animation: thinkingShimmer 30s linear infinite;
  }


  @keyframes thinkingShimmer {
    0%   { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }

  #motionToggleLabel{
  position: fixed;
  right: 20px;
  top: 14px;
  font-size: 11px;
  color: rgba(200,200,200,0.55);
  z-index: 9999;
  pointer-events: none;
}
  #selectorModo:not(.is-hidden) ~ #motionToggleLabel{
    display: none;
  }
  body > *{ position: relative; z-index: 1; }

  form {
    background: transparent !important;
    border: 1px solid rgba(255,255,255,0.20) !important;
    box-shadow: 0 8px 28px rgba(0,0,0,0.58), inset 0 1px 0 rgba(255,255,255,0.16) !important;
  }
  .field-card {
    background: transparent !important;
    border: 1px solid rgba(255,255,255,0.18) !important;
    box-shadow: 0 4px 14px rgba(0,0,0,0.48), inset 0 1px 0 rgba(255,255,255,0.18) !important;
    transition: box-shadow .2s ease, border-color .2s ease;
  }
  .field-card:hover {
    border-color: rgba(136,170,255,0.65) !important;
    box-shadow: 0 0 12px rgba(136,170,255,0.38) !important;
  }
  input, textarea {
    background: rgba(255, 255, 255, 0.18) !important;  
    color: #ffffff !important;
    border: 1px solid rgba(255,255,255,0.35) !important;
    border-radius: 8px !important;
    font-size: 15px !important;
    font-weight: 700 !important;
    backdrop-filter: none;
    -webkit-backdrop-filter: none;
  }
  select {
    background: rgba(255, 255, 255, 0.18) !important;
    color: #ffffff !important;
    border: 1px solid rgba(255,255,255,0.35) !important;
    border-radius: 8px !important;
    font-size: 15px !important;
    font-weight: 700 !important;
    appearance: auto !important;
    -webkit-appearance: menulist !important;
    backdrop-filter: none;
    -webkit-backdrop-filter: none;
  }
  input::placeholder, textarea::placeholder { color: rgba(230,230,230,0.75) !important; opacity: 1; }
  #indicativotexto::placeholder{
    color: rgba(230,230,230,0.35) !important;
  }
  input:focus, select:focus, textarea:focus {
    border-color: #88aaff !important; box-shadow: 0 0 0 2px rgba(136,170,255,0.30) !important;
  }
  h2 { 
  border-bottom: none !important; 
  position: relative; 
}
h2::after {
  content: "";
  position: absolute;
  left: 0;
  right: 0;
  bottom: -2px;
  height: 2px;

  /* Tu gradiente original con los extremos que se afinan */
  background: linear-gradient(
    90deg,
    rgba(120,170,255,0) 0%,
    rgba(120,170,255,0.9) 35%,
    rgba(120,170,255,0.9) 65%,
    rgba(120,170,255,0) 100%
  );

  /* SIN background-size extra, para no cargarse la forma */
  opacity: 0.5;
  animation: h2LinePulse 12s ease-in-out infinite;
}
form { margin-bottom: 0 !important; padding-bottom: 0 !important; }
.actions { margin-bottom: 20px !important; }
   
#selectorModo{
  position:fixed;
  inset:0;
  background:#020617 url("./b.png") center center / cover no-repeat;
  display:flex;
  flex-direction:column;
  justify-content:center;
  align-items:center;
  z-index:9999;
  opacity:1;
  transition:opacity .4s ease;
}
#selectorModo.is-hidden{
  opacity:0;
  pointer-events:none;
}
.modo-contenedor{
  display:flex;
  flex-direction:row;
  gap:80px;
  text-align:center;
  margin-top:76px;
}
.modo-subtitulo{
  margin-top:64px;
  font-size:18px;
  font-weight:600;
  letter-spacing:.04em;
  text-align:center;
  background: linear-gradient(
    120deg,
    rgba(255,255,255,0.95) 0%,
    rgba(123, 117, 117, 0.85) 50%,
    rgba(255,255,255,0.95) 100%
  );
  background-size: 200% auto;
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  animation: thinkingShimmer 5s linear infinite;
}
.modo-header{
  position:absolute;
  top:32px;
  left:0;
  right:0;
  font-size:32px;
  font-weight:800;
  text-transform:uppercase;
  letter-spacing:.12em;
  text-align:center;
  pointer-events:none;
  background: linear-gradient(
    120deg,
    #eef2ff 0%,
    #9dbedfff 40%,
    #3e6b9fff 60%,
    #eef2ff 100%
  );
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  text-shadow:
    0 0 10px rgba(15,23,42,0.9),
    0 0 22px rgba(15,23,42,0.9);
}

.modo-header::after{
  content:"";
  display:block;
  margin:10px auto 0;
  width:260px;
  height:2px;
  border-radius:999px;
  background: linear-gradient(
    90deg,
    rgba(148,163,255,0) 0%,
    rgba(148,163,255,0.9) 40%,
    rgba(148,163,255,0.9) 60%,
    rgba(148,163,255,0) 100%
  );
  box-shadow:0 0 16px rgba(15,23,42,0.9);
  opacity:0.9;
}
.modo-item{
  cursor:pointer;
  display:flex;
  flex-direction:column;
  align-items:center;
}
.modo-titulo{
  font-size:28px;
  font-weight:800;
  margin-bottom:16px;
}
.modo-img{
  max-width:260px;
  height:auto;
  border-radius:16px;
  box-shadow:0 0 20px rgba(0,0,0,0.9);
  transition:transform .2s ease, box-shadow .2s ease;
}
.modo-item:hover .modo-img{
  transform:scale(1.06);
  box-shadow:0 0 28px rgba(120,170,255,0.9);
}
/* Quitar flechas en Chrome / Edge / Safari */
input[type="number"]::-webkit-outer-spin-button,
input[type="number"]::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
select option{background:#0f1221 !important; color: #ffffff !important;}
  `;
  const style = document.createElement('style');
  style.id = '__css_reg_jason';
  style.textContent = css;
  document.head.appendChild(style);

})();

function triggerZoomImpact() {
  document.body.classList.add("zoomImpact");
  setTimeout(() => {
    document.body.classList.remove("zoomImpact");
  }, 900);
}

document.addEventListener("DOMContentLoaded", () => {
  // Selección aleatoria de fondo al iniciar (atardecer / a.jpg / lagoselva.png)
  (function () {
    const body = document.body;
    const r = Math.floor(Math.random() * 3);  // 0, 1 ó 2
    if (r === 1) {
      body.classList.add("bg-alt");      // usa a.jpg
    } else if (r === 2) {
      body.classList.add("bg-lago");     // usa lagoselva.png
    }
    // r === 0 -> sin clase: atardecer por defecto
  })();

  // Toggle de fondo con Ctrl + Y (ciclo entre 3 fondos)
  document.addEventListener("keydown", (e) => {
    if (e.ctrlKey && (e.key === "y" || e.key === "Y")) {
      const body = document.body;
      if (body.classList.contains("bg-alt")) {
        // Pasar de a.jpg a lagoselva.png
        body.classList.remove("bg-alt");
        body.classList.add("bg-lago");
      } else if (body.classList.contains("bg-lago")) {
        // Volver a atardecer (sin clases)
        body.classList.remove("bg-lago");
      } else {
        // Pasar de atardecer a a.jpg
        body.classList.add("bg-alt");
      }
    }
  });

  const dlButtons = document.querySelectorAll(".actions .zip, .actions .xlsx, .actions .refresh");
  dlButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      triggerZoomImpact();
    });
  });
});