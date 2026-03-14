(() => {
  const LEAFLET_CSS = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
  const LEAFLET_JS = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";

  const I18N = {
    es: {
      pick_on_map: "Seleccionar en mapa",
      map_legend: "Si no conoce el nombre de la calle, utilice el mapa.",
      map_title: "Seleccionar ubicación",
      map_hint: "Pulsa en el mapa para fijar el punto.",
      cancel: "Cancelar",
      save: "Guardar ubicación",
      selected_none: "Sin coordenadas seleccionadas",
      selected_prefix: "Coordenadas"
    },
    en: {
      pick_on_map: "Pick on map",
      map_legend: "If you do not know the street name, use the map.",
      map_title: "Select location",
      map_hint: "Tap the map to set the point.",
      cancel: "Cancel",
      save: "Save location",
      selected_none: "No coordinates selected",
      selected_prefix: "Coordinates"
    },
    de: {
      pick_on_map: "Auf Karte wählen",
      map_legend: "Wenn Sie den Straßennamen nicht kennen, nutzen Sie die Karte.",
      map_title: "Ort auswählen",
      map_hint: "Tippe auf die Karte, um den Punkt zu setzen.",
      cancel: "Abbrechen",
      save: "Ort speichern",
      selected_none: "Keine Koordinaten gewählt",
      selected_prefix: "Koordinaten"
    },
    it: {
      pick_on_map: "Seleziona su mappa",
      map_legend: "Se non conosce il nome della via, usi la mappa.",
      map_title: "Seleziona posizione",
      map_hint: "Tocca la mappa per fissare il punto.",
      cancel: "Annulla",
      save: "Salva posizione",
      selected_none: "Nessuna coordinata selezionata",
      selected_prefix: "Coordinate"
    },
    ru: {
      pick_on_map: "Выбрать на карте",
      map_legend: "Если вы не знаете название улицы, используйте карту.",
      map_title: "Выбрать место",
      map_hint: "Нажмите на карту, чтобы установить точку.",
      cancel: "Отмена",
      save: "Сохранить место",
      selected_none: "Координаты не выбраны",
      selected_prefix: "Координаты"
    },
    fr: {
      pick_on_map: "Choisir sur la carte",
      map_legend: "Si vous ne connaissez pas le nom de la rue, utilisez la carte.",
      map_title: "Sélectionner un lieu",
      map_hint: "Touchez la carte pour fixer le point.",
      cancel: "Annuler",
      save: "Enregistrer le lieu",
      selected_none: "Aucune coordonnée sélectionnée",
      selected_prefix: "Coordonnées"
    },
    zh: {
      pick_on_map: "在地图上选择",
      map_legend: "如果不知道街道名称，请使用地图。",
      map_title: "选择地点",
      map_hint: "点击地图以设置位置。",
      cancel: "取消",
      save: "保存位置",
      selected_none: "未选择坐标",
      selected_prefix: "坐标"
    },
    ja: {
      pick_on_map: "地図で選択",
      map_legend: "通り名が分からない場合は地図を使用してください。",
      map_title: "場所を選択",
      map_hint: "地図をタップして地点を設定してください。",
      cancel: "キャンセル",
      save: "場所を保存",
      selected_none: "座標が未選択です",
      selected_prefix: "座標"
    }
  };

  function normLang(lang) {
    const l = String(lang || "es").toLowerCase();
    if (l.startsWith("en")) return "en";
    if (l.startsWith("de")) return "de";
    if (l.startsWith("it")) return "it";
    if (l.startsWith("ru")) return "ru";
    if (l.startsWith("fr")) return "fr";
    if (l.startsWith("zh")) return "zh";
    if (l.startsWith("ja")) return "ja";
    return "es";
  }

  function t(lang, key) {
    const l = normLang(lang);
    return (I18N[l] && I18N[l][key]) || I18N.en[key] || key;
  }

  let leafletPromise = null;
  function ensureLeaflet() {
    if (window.L) return Promise.resolve(window.L);
    if (leafletPromise) return leafletPromise;

    leafletPromise = new Promise((resolve, reject) => {
      if (!document.querySelector('link[data-denupol-leaflet="1"]')) {
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = LEAFLET_CSS;
        link.setAttribute("data-denupol-leaflet", "1");
        document.head.appendChild(link);
      }

      const s = document.createElement("script");
      s.src = LEAFLET_JS;
      s.async = true;
      s.onload = () => resolve(window.L);
      s.onerror = () => reject(new Error("Leaflet load error"));
      document.head.appendChild(s);
    });

    return leafletPromise;
  }

  async function reverseGeocode(lat, lng, lang) {
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lng)}&accept-language=${encodeURIComponent(normLang(lang))}`;
    try {
      const r = await fetch(url, { headers: { Accept: "application/json" } });
      if (!r.ok) return "";
      const j = await r.json();
      return String(j.display_name || "").trim();
    } catch (_) {
      return "";
    }
  }

  async function open(opts = {}) {
    const lang = normLang(opts.lang || document.documentElement.lang || "es");
    await ensureLeaflet();

    return new Promise((resolve) => {
      const back = document.createElement("div");
      back.style.position = "fixed";
      back.style.inset = "0";
      back.style.background = "rgba(0,0,0,.72)";
      back.style.display = "flex";
      back.style.alignItems = "center";
      back.style.justifyContent = "center";
      back.style.padding = "16px";
      back.style.zIndex = "99999";

      const box = document.createElement("div");
      box.style.width = "min(860px, 98vw)";
      box.style.maxHeight = "95vh";
      box.style.overflow = "hidden";
      box.style.background = "#101b31";
      box.style.border = "1px solid rgba(255,255,255,.18)";
      box.style.borderRadius = "14px";
      box.style.padding = "12px";
      box.style.display = "flex";
      box.style.flexDirection = "column";
      box.style.gap = "8px";

      const head = document.createElement("div");
      head.style.fontWeight = "800";
      head.style.color = "#d6b06a";
      head.textContent = opts.title || t(lang, "map_title");

      const hint = document.createElement("div");
      hint.style.fontSize = "12px";
      hint.style.opacity = ".85";
      hint.style.color = "#d4dde9";
      hint.textContent = t(lang, "map_hint");

      const mapEl = document.createElement("div");
      mapEl.style.width = "100%";
      mapEl.style.height = "min(58vh, 520px)";
      mapEl.style.borderRadius = "10px";
      mapEl.style.overflow = "hidden";

      const foot = document.createElement("div");
      foot.style.display = "flex";
      foot.style.justifyContent = "space-between";
      foot.style.gap = "10px";

      const left = document.createElement("div");
      left.style.fontSize = "12px";
      left.style.color = "#d4dde9";
      left.textContent = "";

      const right = document.createElement("div");
      right.style.display = "flex";
      right.style.gap = "8px";

      const btnCancel = document.createElement("button");
      btnCancel.type = "button";
      btnCancel.textContent = t(lang, "cancel");
      btnCancel.style.border = "1px solid rgba(255,255,255,.2)";
      btnCancel.style.borderRadius = "10px";
      btnCancel.style.padding = "9px 12px";
      btnCancel.style.background = "rgba(255,255,255,.06)";
      btnCancel.style.color = "#d6b06a";
      btnCancel.style.fontWeight = "700";

      const btnSave = document.createElement("button");
      btnSave.type = "button";
      btnSave.textContent = t(lang, "save");
      btnSave.style.border = "1px solid rgba(255,255,255,.2)";
      btnSave.style.borderRadius = "10px";
      btnSave.style.padding = "9px 12px";
      btnSave.style.background = "rgba(34,197,94,.22)";
      btnSave.style.color = "#d6b06a";
      btnSave.style.fontWeight = "700";

      right.appendChild(btnCancel);
      right.appendChild(btnSave);
      foot.appendChild(left);
      foot.appendChild(right);

      box.appendChild(head);
      box.appendChild(hint);
      box.appendChild(mapEl);
      box.appendChild(foot);
      back.appendChild(box);
      document.body.appendChild(back);

      // Fallback center: Playa de las Americas (Tenerife)
      const initLat = Number.isFinite(+opts.lat) ? +opts.lat : 28.0586;
      const initLng = Number.isFinite(+opts.lng) ? +opts.lng : -16.7299;

      const map = L.map(mapEl, {
        zoomControl: true,
        attributionControl: true
      }).setView([initLat, initLng], Number.isFinite(+opts.zoom) ? +opts.zoom : 14);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: "&copy; OpenStreetMap"
      }).addTo(map);

      let marker = null;
      let picked = null;

      function setPicked(lat, lng) {
        picked = { lat: +lat, lng: +lng };
        if (!marker) marker = L.marker([lat, lng]).addTo(map);
        else marker.setLatLng([lat, lng]);
        left.textContent = `${t(lang, "selected_prefix")}: ${picked.lat.toFixed(6)}, ${picked.lng.toFixed(6)}`;
      }

      if (Number.isFinite(+opts.lat) && Number.isFinite(+opts.lng)) setPicked(+opts.lat, +opts.lng);

      map.on("click", (e) => setPicked(e.latlng.lat, e.latlng.lng));
      setTimeout(() => map.invalidateSize(), 60);

      let done = false;
      function close(val) {
        if (done) return;
        done = true;
        try { map.remove(); } catch (_) {}
        back.remove();
        resolve(val);
      }

      back.addEventListener("click", (e) => { if (e.target === back) close(null); });
      btnCancel.addEventListener("click", () => close(null));
      btnSave.addEventListener("click", async () => {
        if (!picked) return close(null);
        const label = await reverseGeocode(picked.lat, picked.lng, lang);
        close({ lat: picked.lat, lng: picked.lng, label });
      });
    });
  }

  window.DenupolMapPicker = { open, t, normLang };
})();
