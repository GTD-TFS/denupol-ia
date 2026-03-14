process.env.DENUPOL_NO_LISTEN = "1";
process.env.OLLAMA_MODEL = "mock-audit";
process.env.AI_PROVIDER = "mock";
process.env.QUESTION_MODE = "model";

const { startSessionCore, messageSessionCore, finalizeSessionCore } = await import("../server.mjs");

function lineCount(txt) {
  return String(txt || "")
    .split("\n")
    .map((x) => x.trim())
    .filter((x) => x.startsWith("– ")).length;
}

async function run() {
  const fixedAnswers = {
    hecho_conocimiento: "DESCUBRIMIENTO POSTERIOR AL HECHO",
    camaras_hay: "NO",
    sustraccion_donde: "EN DOMICILIO / ESTABLECIMIENTO",
    danos_tipologia: "PUERTA",
    hecho_hora_desde: "12:07",
    hecho_lugar: "calle gomez 2, madrid",
    hecho_caracteristicas: "SUSTRACCIÓN",
    sustraccion_objetos: [{ tipo_catalogo: "JOYAS", descripcion: "oro y plata", tipo: "JOYAS" }],
    denunciante_calidad: "PERJUDICADO",
    sustraccion_hay: "SI",
    hecho_fecha: "2026-02-20",
    danos_descripcion: "puerta rota",
    acceso_metodo: "FORZAMIENTO PUERTA",
    hecho_hora: "12:07 - 16:05",
    hecho_hora_hasta: "16:05",
    hecho_manipulacion_lugar: "SI",
    danos_aporta_presupuesto: "NO",
    hecho_resumen: "robaron de los cajones",
    danos_hay: "SI"
  };

  const started = await startSessionCore({
    token: "demo",
    crimeType: "ROBO_FUERZA",
    lang: "es",
    fixedAnswers
  });
  if (started.status !== "ASK" || !started.sessionId) throw new Error("start no devuelve ASK/sessionId");

  let status = started.status;
  let loops = 0;
  while (status === "ASK" && loops < 8) {
    loops += 1;
    const m = await messageSessionCore({
      sessionId: started.sessionId,
      userAnswer: "No consta en este momento."
    });
    status = m.status;
  }
  if (status !== "READY_TO_DRAFT") throw new Error("no llega a READY_TO_DRAFT");

  const fin = await finalizeSessionCore({ sessionId: started.sessionId });
  if (fin.status !== "OK") throw new Error("finalize no devuelve OK");
  if (!/^– Se persona en estas dependencias en calidad de /m.test(String(fin.declaracionFinal || ""))) {
    throw new Error("primer párrafo obligatorio ausente");
  }
  if (lineCount(fin.declaracionFinal) < 6) {
    throw new Error("redacción insuficiente (<6 párrafos)");
  }

  console.log(JSON.stringify({
    ok: true,
    checks: {
      startAsk: true,
      readyToDraft: true,
      finalizeOk: true,
      firstParagraph: true,
      minParagraphs: true
    }
  }, null, 2));
}

run().catch((err) => {
  console.error(`E2E FAIL: ${err.message || err}`);
  process.exit(1);
});
