(function(){
  const SpeechRecognitionCtor = window.SpeechRecognition || window.webkitSpeechRecognition || null;
  const RESTART_BASE_DELAY_MS = 700;
  const RESTART_MAX_DELAY_MS = 2500;
  const MIN_START_GAP_MS = 450;
  const FATAL_ERRORS = new Set(["not-allowed", "service-not-allowed", "audio-capture", "network"]);
  const I18N = {
    es: {
      start: "Iniciar dictado",
      stop: "Detener dictado",
      listening: "Escuchando...",
      reconnecting: "Reconectando microfono...",
      processing: "Procesando voz...",
      ready: "Texto de voz incorporado.",
      unsupported: "El dictado por voz no está disponible en este dispositivo.",
      error_generic: "No se pudo iniciar el dictado por voz.",
      error_no_permission: "Debe conceder permiso al micrófono para usar el dictado.",
      error_no_speech: "No se ha detectado voz.",
      error_network: "Error de red al procesar la voz.",
      error_audio: "No se ha podido capturar el audio del micrófono."
    },
    en: {
      start: "Start dictation",
      stop: "Stop dictation",
      listening: "Listening...",
      reconnecting: "Reconnecting microphone...",
      processing: "Processing voice...",
      ready: "Voice text inserted.",
      unsupported: "Voice dictation is not available on this device.",
      error_generic: "Voice dictation could not be started.",
      error_no_permission: "Microphone permission is required to use dictation.",
      error_no_speech: "No speech was detected.",
      error_network: "Network error while processing voice.",
      error_audio: "Microphone audio could not be captured."
    },
    de: {
      start: "Diktat starten",
      stop: "Diktat stoppen",
      listening: "Spracheingabe läuft...",
      reconnecting: "Mikrofon wird neu verbunden...",
      processing: "Sprache wird verarbeitet...",
      ready: "Gesprochener Text eingefügt.",
      unsupported: "Spracheingabe ist auf diesem Gerät nicht verfügbar.",
      error_generic: "Die Spracheingabe konnte nicht gestartet werden.",
      error_no_permission: "Für die Spracheingabe ist Mikrofonzugriff erforderlich.",
      error_no_speech: "Es wurde keine Sprache erkannt.",
      error_network: "Netzwerkfehler bei der Sprachverarbeitung.",
      error_audio: "Das Mikrofonaudio konnte nicht erfasst werden."
    },
    it: {
      start: "Avvia dettatura",
      stop: "Ferma dettatura",
      listening: "In ascolto...",
      reconnecting: "Ricollegamento microfono...",
      processing: "Elaborazione voce...",
      ready: "Testo vocale inserito.",
      unsupported: "La dettatura vocale non e disponibile su questo dispositivo.",
      error_generic: "Impossibile avviare la dettatura vocale.",
      error_no_permission: "Serve il permesso del microfono per usare la dettatura.",
      error_no_speech: "Nessuna voce rilevata.",
      error_network: "Errore di rete durante l'elaborazione della voce.",
      error_audio: "Impossibile acquisire l'audio del microfono."
    },
    fr: {
      start: "Demarrer la dictee",
      stop: "Arreter la dictee",
      listening: "Ecoute en cours...",
      reconnecting: "Reconnexion du micro...",
      processing: "Traitement de la voix...",
      ready: "Texte vocal insere.",
      unsupported: "La dictee vocale n'est pas disponible sur cet appareil.",
      error_generic: "Impossible de demarrer la dictee vocale.",
      error_no_permission: "L'autorisation du micro est necessaire pour utiliser la dictee.",
      error_no_speech: "Aucune voix n'a ete detectee.",
      error_network: "Erreur reseau pendant le traitement de la voix.",
      error_audio: "Impossible de capter l'audio du microphone."
    },
    ru: {
      start: "Начать диктовку",
      stop: "Остановить диктовку",
      listening: "Идет прослушивание...",
      reconnecting: "Повторное подключение микрофона...",
      processing: "Обработка речи...",
      ready: "Распознанный текст добавлен.",
      unsupported: "Голосовой ввод недоступен на этом устройстве.",
      error_generic: "Не удалось запустить голосовой ввод.",
      error_no_permission: "Для голосового ввода требуется доступ к микрофону.",
      error_no_speech: "Речь не обнаружена.",
      error_network: "Сетевая ошибка при обработке речи.",
      error_audio: "Не удалось получить звук с микрофона."
    },
    zh: {
      start: "开始语音输入",
      stop: "停止语音输入",
      listening: "正在监听...",
      reconnecting: "正在重新连接麦克风...",
      processing: "正在处理语音...",
      ready: "语音文字已插入。",
      unsupported: "此设备不支持语音输入。",
      error_generic: "无法启动语音输入。",
      error_no_permission: "使用语音输入需要麦克风权限。",
      error_no_speech: "未检测到语音。",
      error_network: "处理语音时发生网络错误。",
      error_audio: "无法采集麦克风音频。"
    },
    ja: {
      start: "音声入力を開始",
      stop: "音声入力を停止",
      listening: "音声を聞き取っています...",
      reconnecting: "マイクを再接続しています...",
      processing: "音声を処理しています...",
      ready: "音声テキストを挿入しました。",
      unsupported: "この端末では音声入力を利用できません。",
      error_generic: "音声入力を開始できませんでした。",
      error_no_permission: "音声入力にはマイクの許可が必要です。",
      error_no_speech: "音声が検出されませんでした。",
      error_network: "音声処理中にネットワークエラーが発生しました。",
      error_audio: "マイクの音声を取得できませんでした。"
    }
  };

  let activeSession = null;

  function normalizeLang(lang){
    const value = String(lang || document.documentElement.lang || "es").toLowerCase();
    if (value.startsWith("es")) return "es";
    if (value.startsWith("de")) return "de";
    if (value.startsWith("it")) return "it";
    if (value.startsWith("fr")) return "fr";
    if (value.startsWith("ru")) return "ru";
    if (value.startsWith("zh")) return "zh";
    if (value.startsWith("ja")) return "ja";
    return "en";
  }

  function localeForSpeech(lang){
    const map = {
      es: "es-ES",
      en: "en-US",
      de: "de-DE",
      it: "it-IT",
      fr: "fr-FR",
      ru: "ru-RU",
      zh: "zh-CN",
      ja: "ja-JP"
    };
    return map[normalizeLang(lang)] || map.en;
  }

  function t(lang, key){
    const pack = I18N[normalizeLang(lang)] || I18N.en;
    return pack[key] || I18N.en[key] || key;
  }

  function injectStyles(){
    if (document.getElementById("denupolSpeechStyles")) return;
    const style = document.createElement("style");
    style.id = "denupolSpeechStyles";
    style.textContent = [
      ".voiceTools{display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin-top:10px}",
      ".voiceTools .btn{flex:0 0 auto}",
      ".voiceStatus{min-height:18px}"
    ].join("");
    document.head.appendChild(style);
  }

  function speechErrorMessage(lang, code){
    const map = {
      "not-allowed": "error_no_permission",
      "service-not-allowed": "error_no_permission",
      "no-speech": "error_no_speech",
      "network": "error_network",
      "audio-capture": "error_audio"
    };
    return t(lang, map[code] || "error_generic");
  }

  function syncTextarea(textarea, value){
    textarea.value = value;
    textarea.dispatchEvent(new Event("input", { bubbles: true }));
  }

  function composeValue(session, interimText){
    const parts = [];
    const baseText = String(session.baseText || "").trim();
    const finalText = String(session.finalText || "").trim();
    const interim = String(interimText || "").trim();
    if (baseText) parts.push(baseText);
    if (finalText) parts.push(finalText);
    if (interim) parts.push(interim);
    return parts.join("\n").trim();
  }

  function refreshButton(session){
    if (!session || !session.button) return;
    session.button.textContent = session.listening ? t(session.lang, "stop") : t(session.lang, "start");
    session.button.setAttribute("aria-pressed", session.listening ? "true" : "false");
  }

  function clearRestartTimer(session){
    if (!session || !session.restartTimer) return;
    clearTimeout(session.restartTimer);
    session.restartTimer = null;
  }

  function resetSessionForFreshStart(session){
    session.baseText = String(session.textarea.value || "").trim();
    session.finalText = "";
    session.lastError = "";
    session.fatalError = false;
    session.restartAttempts = 0;
    session.manualStop = false;
    session.shouldContinue = true;
  }

  function stopCurrentRecognition(session, useAbort){
    if (!session || !session.recognition) return;
    try{
      if (useAbort) session.recognition.abort();
      else session.recognition.stop();
    }catch(_){}
  }

  function scheduleRestart(session){
    if (!session || !session.shouldContinue || session.manualStop || session.fatalError) return;
    clearRestartTimer(session);
    const attempt = session.restartAttempts || 0;
    const delay = Math.min(RESTART_BASE_DELAY_MS * Math.pow(1.6, attempt), RESTART_MAX_DELAY_MS);
    session.restartAttempts = attempt + 1;
    if (session.status) session.status.textContent = t(session.lang, "reconnecting");
    session.restartTimer = setTimeout(function(){
      if (!session.shouldContinue || session.manualStop || session.fatalError) return;
      start(session);
    }, delay);
  }

  function stop(options){
    const session = activeSession;
    if (!session) return;
    session.shouldContinue = false;
    session.manualStop = true;
    session.fatalError = false;
    clearRestartTimer(session);
    if (session.status && typeof (options && options.message) === "string"){
      session.status.textContent = options.message;
    }
    stopCurrentRecognition(session, !!(options && options.abort));
    session.listening = false;
    session.starting = false;
    refreshButton(session);
    if (options && options.immediate){
      activeSession = null;
    }
  }

  function start(session){
    if (!SpeechRecognitionCtor){
      if (session.status) session.status.textContent = t(session.lang, "unsupported");
      if (session.button) session.button.disabled = true;
      return;
    }

    const now = Date.now();
    if (session.starting || session.listening) return;
    if (now - session.lastStartAt < MIN_START_GAP_MS){
      scheduleRestart(session);
      return;
    }

    if (activeSession && activeSession !== session){
      stop({ abort: true, immediate: true });
    }

    clearRestartTimer(session);
    session.starting = true;
    session.lastError = "";
    session.lastStartAt = now;

    const recognition = new SpeechRecognitionCtor();
    session.recognition = recognition;
    activeSession = session;

    recognition.lang = localeForSpeech(session.lang);
    recognition.interimResults = true;
    recognition.continuous = true;
    recognition.maxAlternatives = 1;

    recognition.onstart = function(){
      session.starting = false;
      session.listening = true;
      session.restartAttempts = 0;
      refreshButton(session);
      if (session.status) session.status.textContent = t(session.lang, "listening");
    };

    recognition.onresult = function(event){
      if (activeSession !== session) return;
      let finalChunk = "";
      let interimChunk = "";
      for (let i = event.resultIndex; i < event.results.length; i++){
        const alt = event.results[i][0];
        const transcript = String(alt && alt.transcript || "").trim();
        if (!transcript) continue;
        if (event.results[i].isFinal) finalChunk += (finalChunk ? " " : "") + transcript;
        else interimChunk += (interimChunk ? " " : "") + transcript;
      }
      if (finalChunk){
        session.finalText = [session.finalText, finalChunk].filter(Boolean).join(" ").trim();
      }
      syncTextarea(session.textarea, composeValue(session, interimChunk));
    };

    recognition.onerror = function(event){
      if (activeSession !== session) return;
      session.starting = false;
      session.listening = false;
      session.lastError = String(event.error || "");
      session.fatalError = FATAL_ERRORS.has(session.lastError);
      refreshButton(session);

      if (session.lastError === "aborted" && session.manualStop) return;
      if (session.lastError === "no-speech"){
        if (session.status) session.status.textContent = t(session.lang, "reconnecting");
        return;
      }
      if (session.status) session.status.textContent = speechErrorMessage(session.lang, session.lastError);
      if (session.fatalError){
        session.shouldContinue = false;
      }
    };

    recognition.onend = function(){
      if (activeSession !== session) return;
      session.starting = false;
      session.listening = false;
      refreshButton(session);

      if (session.shouldContinue && !session.manualStop && !session.fatalError){
        scheduleRestart(session);
        return;
      }

      if (!session.manualStop && !session.fatalError && session.status){
        session.status.textContent = session.finalText ? t(session.lang, "ready") : "";
      }
      activeSession = null;
    };

    try{
      recognition.start();
    }catch(err){
      session.starting = false;
      session.listening = false;
      session.lastError = String(err && err.name || "start-failed");
      refreshButton(session);
      if (session.status) session.status.textContent = t(session.lang, "reconnecting");
      scheduleRestart(session);
    }
  }

  function attach(options){
    if (!options || !options.container || !options.textarea) return;
    if (options.textarea.dataset.denupolSpeechAttached === "1") return;
    injectStyles();

    const lang = normalizeLang(options.lang);
    const row = document.createElement("div");
    row.className = "voiceTools";

    const button = document.createElement("button");
    button.type = "button";
    button.className = "btn secondary";
    button.textContent = t(lang, "start");

    const status = document.createElement("div");
    status.className = "muted voiceStatus";
    status.setAttribute("aria-live", "polite");

    const session = {
      lang: lang,
      textarea: options.textarea,
      button: button,
      status: status,
      recognition: null,
      baseText: "",
      finalText: "",
      lastError: "",
      restartTimer: null,
      restartAttempts: 0,
      shouldContinue: false,
      manualStop: false,
      fatalError: false,
      starting: false,
      listening: false,
      lastStartAt: 0
    };

    if (!SpeechRecognitionCtor){
      button.disabled = true;
      status.textContent = t(lang, "unsupported");
    }

    button.addEventListener("click", function(){
      if (!SpeechRecognitionCtor) return;
      if (activeSession === session && (session.listening || session.starting || session.shouldContinue)){
        stop({ message: t(lang, "processing") });
        return;
      }
      resetSessionForFreshStart(session);
      refreshButton(session);
      start(session);
    });

    row.appendChild(button);
    row.appendChild(status);
    options.container.appendChild(row);
    options.textarea.dataset.denupolSpeechAttached = "1";
  }

  window.DenupolSpeechToText = {
    attach: attach,
    stop: stop,
    supported: !!SpeechRecognitionCtor
  };
})();
