# DENUPOL + IA DE COMPLETITUD (PREDENUNCIAS)

Documento de referencia para implementar una capa de IA conversacional en DENUPOL que complemente el motor fijo de preguntas, cierre gaps de información y genere texto final policial coherente.

## Estado de Compatibilidad (GPT <-> API)

- **Sí, es compatible** con el enfoque actual de pruebas en GPT.
- La estrategia recomendada para producción es usar **el mismo prompt funcional** en:
  - GPT de pruebas (validación de comportamiento),
  - backend API (ejecución real en app).
- Regla de oro: si el comportamiento en GPT es aceptable, congelar versión como `promptVersion` y desplegar idéntico en API.

### Condiciones de paridad obligatorias

1. Pregunta atómica: una pregunta por turno y un solo objetivo.
2. Validación de lugar condicional: preguntar solo si la ubicación es ambigua/genérica.
3. Indagación contextual/motivacional obligatoria: debe preguntarse al menos una vez antes del cierre.
4. Si el compareciente no sabe/no puede/no quiere concretar el motivo: **se puede cerrar**, dejando constancia expresa.
5. Redacción final directa: no hacer doble paso JSON->texto->JSON->texto.

## 1) Objetivo funcional

- Mantener el **motor fijo** como columna vertebral (estructura y mínimos de diligencia).
- Añadir una **IA de repregunta inteligente** que:
  - detecte faltas de información relevantes para esclarecimiento,
  - formule preguntas útiles y contextuales al denunciante,
  - incorpore esas respuestas al contexto final,
  - ayude a redactar una declaración más completa y accionable.

El resultado no sustituye el criterio policial: lo refuerza con mejor captura de datos.

---

## 2) Estado actual de DENUPOL (sección predenuncias)

### 2.1 Flujo actual (resumen)

1. `index.html` genera enlaces con token para formularios (`global_esp.html`, `global_en_ui.html`, etc.).
2. El denunciante completa formulario por tipo de hecho (motor fijo).
3. El formulario construye payload (`buildPayload`) y guarda en Firestore:
   - colección `predenuncias`,
   - documento `token`,
   - `estado: "FINALIZADA"`,
   - `hechos` (JSON estructurado),
   - `filiacion_enc` y `label_publico`.
4. En DENUPOL (`index.html`) se listan predenuncias finalizadas y se trabaja con JSON + redacción.

### 2.2 Colecciones Firestore observadas en código

- `tokenSessions`: sesión de token público para acceso a formulario.
- `predenuncias`: salida final del denunciante (JSON estructurado).
- `registros`: registros cifrados.
- `denupolInbox`: comparecencias/entradas JSON.

### 2.3 Caducidades y limpieza observadas

- En `index.html` hay purga automática cliente de:
  - tokens expirados,
  - predenuncias antiguas,
  - registros antiguos,
  - inbox antiguo.
- Actualmente en código se usa ventana de 8h para varias purgas de colecciones.

Importante: la purga desde cliente depende de que haya cliente ejecutando; la purga robusta de producción debe estar respaldada por TTL/cron en backend cuando aplique.

---

## 3) Qué problema resuelve la capa IA

Aunque el motor fijo recoja estructura, puede quedar corto cuando:

- el denunciante escribe resumen pobre o ambiguo,
- hay interacción con autor y no queda detallada,
- faltan elementos probatorios (testigos/cámaras/evidencia digital),
- falta secuencia temporal útil para investigación,
- no queda clara la trazabilidad del hecho.

La IA debe cubrir esos huecos con preguntas orientadas a:

1. **esclarecimiento del hecho**,
2. **identificación útil del autor**,
3. **conservación/ubicación de prueba**.

---

## 4) Principios de diseño (clave para que funcione bien)

1. **No chat libre sin carriles**.
2. IA con salida estructurada para control (estado/gap/pregunta), pero con **redacción final directa** (sin doble paso JSON->texto).
3. Preguntas IA limitadas (ej. 1 por turno, máximo 5-8 turnos).
4. Priorizar gaps de alto valor probatorio.
5. No preguntar datos implausibles por contexto.
6. No inventar nunca; si falta dato, marcarlo como no disponible.

Ejemplo de plausibilidad:

- No preguntar nombre del autor en un robo de oportunidad en vía pública salvo indicios de conocimiento previo.
- Sí preguntar nombre si el contexto indica vínculo previo (pareja, vecino, compañero, conocido, cliente habitual).

---

## 5) Arquitectura técnica recomendada

## 5.1 Componentes

- **Frontend DENUPOL** (HTML actual):
  - mantiene motor fijo,
  - añade widget de conversación IA (textarea + historial + enviar + finalizar).

- **Backend IA en VPS** (nuevo):
  - API propia (Node/FastAPI/Go),
  - orquesta prompts y estado conversacional,
  - llama a OpenAI API,
  - valida respuestas,
  - guarda trazabilidad.

- **OpenAI API** (pago por uso):
  - modelo para análisis de gaps + repregunta,
  - modelo para redacción final.

- **Firestore**:
  - persiste estado de sesión IA y resultado final (o en DB separada).

## 5.2 Por qué backend intermedio obligatorio

No llamar modelo desde navegador directamente porque:

- expones credenciales API,
- pierdes control de límites y coste,
- no puedes aplicar validaciones duras,
- no queda auditoría completa.

---

## 6) Endpoints sugeridos (contrato mínimo)

## 6.1 `POST /ai/session/start`

Entrada:

```json
{
  "token": "...",
  "crimeType": "GLOBAL",
  "fixedAnswers": { "...": "..." },
  "lang": "es"
}
```

Salida:

```json
{
  "sessionId": "uuid",
  "status": "ASK",
  "nextQuestion": "...",
  "targetGap": "mecanica_hecho",
  "remainingQuestions": 5
}
```

## 6.2 `POST /ai/session/message`

Entrada:

```json
{
  "sessionId": "uuid",
  "userAnswer": "..."
}
```

Salida:

```json
{
  "status": "ASK | READY_TO_DRAFT | NEED_REVIEW",
  "nextQuestion": "...",
  "targetGap": "identificacion_autor",
  "answerApplied": true,
  "remainingQuestions": 4
}
```

## 6.3 `POST /ai/session/finalize`

Entrada:

```json
{
  "sessionId": "uuid"
}
```

Salida:

```json
{
  "status": "OK",
  "declaracionFinal": "texto final diligencia...",
  "gapsRemaining": []
}
```

---

## 7) Modelo de datos para sesión IA

Guardar por sesión:

- `sessionId`
- `token`
- `crimeType`
- `fixedAnswersSnapshot`
- `aiTurns[]` (pregunta/respuesta/timestamp)
- `gapsDetected`
- `gapsResolved`
- `status`
- `model`
- `promptVersion`
- `createdAt` / `updatedAt` / `expiresAt`

Esto permite trazabilidad y auditoría.

---

## 8) Integración en los `global_*.html`

## 8.1 UX mínima

- Panel colapsable: `Asistente IA`.
- Historial corto de turnos.
- Input de respuesta del denunciante.
- Botones:
  - `Enviar respuesta`,
  - `Finalizar con IA`.

## 8.2 Flujo en frontend

1. Finalizado motor fijo base, se habilita IA.
2. `start` envía JSON fijo.
3. Renderiza `nextQuestion`.
4. Cada respuesta del usuario -> `message`.
5. Si `READY_TO_DRAFT`, habilitar finalizar.
6. Al finalizar, backend genera directamente `declaracionFinal` usando:
   - respuestas de motor fijo (`hechos`),
   - historial de repreguntas IA (`aiTurns`).

## 8.3 Recomendación de implementación limpia

- Crear módulo JS compartido: `ai_assistant.js`.
- Inyectarlo en todos los globales para evitar divergencias.
- Mapeo único de claves (`fixed -> canonical`) para todos los idiomas.

---

## 9) Compatibilidad con motor fijo de preguntas

La IA no reemplaza; opera **después** o **en paralelo controlado**.

Regla práctica:

- Motor fijo = captura estructural primaria.
- IA = cierre de gaps detectados sobre esa estructura.

Compatibilidad:

- Usar `EXPORT_KEY_MAP` ya existente para base semántica común.
- No convertir de nuevo a otro JSON “intermedio” para redactar.
- El motor fijo aporta base estructural y la IA aporta contexto adicional en conversación.
- Opcionalmente guardar una huella mínima para auditoría (no para redacción), por ejemplo:

```json
{
  "sessionId": "uuid",
  "gapsResolved": ["mecanica_hecho", "pruebas"],
  "qaCount": 4
}
```

Luego fusionar en backend para redacción.

---

## 10) Reglas de gaps (compactas, no 1000 reglas)

Definir un set corto de `targetGap` universales:

- `cronologia`
- `mecanica_hecho`
- `interaccion_autor`
- `identificacion_autor`
- `resultado_hecho`
- `pruebas`
- `lesiones`
- `perjuicio`
- `riesgo_actual`

La IA solo puede preguntar para cerrar uno de esos gaps.

Priorización sugerida:

1. mecánica + cronología,
2. identificación autor,
3. pruebas,
4. lesiones/perjuicio,
5. riesgo actual.

---

## 11) Ejemplo aplicado (carácter sexual)

Caso base recibido:

- lugar/hora definidos,
- acercamiento + conversación,
- tocamientos en glúteos,
- incomodidad + salida del lugar.

Gaps típicos que IA debe cubrir:

1. oposición expresa (verbal/física) y momento,
2. mecánica concreta (número de veces, duración, secuencia),
3. testigos potenciales,
4. cámaras disponibles,
5. huida/posición final del autor,
6. evidencia posterior (mensajes, llamadas, ubicación),
7. riesgo de reiteración.

Preguntas IA de alto valor (ejemplo):

- "Cuando ocurrió el contacto, ¿le dijo claramente que parara o se apartó físicamente?"
- "¿Recuerda cuántas veces ocurrió y en qué intervalo aproximado?"
- "¿Había personas cerca que pudieran verlo u oírla?"
- "¿El lugar tenía cámaras (local, calle o transporte)?"
- "Tras marcharse, ¿el autor la siguió o volvió a contactar?"

---

## 12) Prompt de sistema recomendado (análisis y repregunta)

```text
Eres un asistente de apoyo a predenuncias policiales.
Tu objetivo es cerrar gaps de información para mejorar el esclarecimiento de los hechos y la identificación útil del autor.

Reglas:
- No inventes nunca hechos.
- No hagas valoraciones jurídicas concluyentes.
- Formula una sola pregunta por turno.
- Pregunta solo lo imprescindible y con lenguaje ciudadano.
- Prioriza: mecánica, cronología, identificación autor, pruebas.
- Evita preguntas implausibles por contexto (p.ej. nombre del autor en hecho oportunista sin vínculo previo).
- Si ya hay información suficiente para redactar, responde READY_TO_DRAFT.

Devuelve SIEMPRE JSON válido con este esquema:
{
  "status": "ASK|READY_TO_DRAFT|NEED_REVIEW",
  "targetGap": "cronologia|mecanica_hecho|interaccion_autor|identificacion_autor|resultado_hecho|pruebas|lesiones|perjuicio|riesgo_actual",
  "nextQuestion": "string",
  "reasonShort": "string",
  "confidence": 0.0,
  "answerApplied": true
}
```

---

## 13) Prompt operativo recomendado (unificado para GPT y API)

Recomendación actual: usar **un único prompt** para ambos modos (completitud + redacción final), no dos prompts separados.

Checklist mínimo que debe contener ese prompt unificado:

- modo completitud + modo redacción final;
- estilo policial (3ª persona, presente, párrafos con “– ”);
- diferenciación perjudicado/víctima;
- primer párrafo obligatorio;
- puerta de cierre por cobertura;
- pregunta atómica;
- validación condicional de lugar;
- indagación contextual/motivacional obligatoria y neutra;
- cierre permitido si el motivo no puede concretarse, con constancia expresa;
- regla de estancia eventual en Tenerife;
- salida: pregunta única o redacción final completa.

Si se decide mantener dos prompts en API:

- `prompt_qa` (solo repregunta),
- `prompt_draft` (solo redacción),

deben compartir exactamente las mismas reglas de estilo y cierre para evitar divergencias.

---

## 14) Prompt de redacción final recomendado (solo si se separa en dos)

```text
Redacta una declaración policial en español, en tercera persona, tiempo presente, lenguaje formal y objetivo.
Usa exclusivamente la información de `fixedAnswers` y del historial de conversación `aiTurns`.
No inventes datos.
Si falta un dato crítico, indícalo de forma neutra (sin suponer).
No menciones JSON, sistema, IA ni formularios.
Integra cronología, mecánica, autor/es, pruebas, lesiones/perjuicios y actuaciones posteriores si existen.
```

---

## 15) Guardrails y validaciones backend

- Validar esquema JSON de salida IA (si no, reintento controlado).
- Limitar preguntas por sesión (ej. max 6).
- Limitar tamaño de respuesta usuario.
- Bloquear prompt injection del usuario (tratar input como dato, no instrucción).
- Registrar `promptVersion` y `model` para auditoría.
- Timeout y fallback seguro a redacción con datos disponibles.

---

## 16) Seguridad y cumplimiento (mínimo exigible)

- Secretos API solo en servidor (nunca cliente).
- TLS extremo a extremo.
- Control de acceso por token/session firmada.
- Pseudonimizar/anonimizar cuando sea posible antes de LLM.
- Política de retención clara para sesiones IA.
- Log de auditoría sin exponer más PII de la necesaria.

---

## 17) Infraestructura VPS recomendada

Stack simple y robusto:

- `Nginx` (reverse proxy + TLS)
- `API` (Node.js Fastify / Python FastAPI)
- `Redis` (estado conversación TTL)
- `PostgreSQL` (auditoría persistente)
- `Worker` opcional (tareas asíncronas)

Operación:

- Docker Compose para despliegue inicial.
- Backups diarios DB.
- Monitorización básica (uptime + logs + alertas).

---

## 18) Costes: suscripción vs API

- **ChatGPT Plus**: no sirve para integrar backend propio de app web.
- **OpenAI API**: sí, pago por uso.

Precios de referencia (verificar siempre antes de pasar a producción):

- `gpt-5-mini`: input $0.25 / 1M tokens, output $2.00 / 1M.
- `gpt-4.1-mini`: input $0.40 / 1M tokens, output $1.60 / 1M.

Fuentes:

- https://openai.com/api/pricing/
- https://platform.openai.com/docs/pricing/

Estimación orientativa por denuncia (fijo + 1-10 repreguntas + redacción):

- tramo habitual: ~10k a 60k tokens de entrada totales + 1k a 5k de salida.
- coste aproximado por denuncia con `gpt-5-mini`: céntimos bajos de USD.

Recomendación: monitorizar consumo real por sesión y aplicar límites por caso.

---

## 19) Plan de implantación por fases

Paso 1 (obligatorio, antes de Fase 1):

- Implementar una **capa de traducción semántica de `hechos` a `hechos_ai`** antes de enviar datos a la API en VPS.
- Objetivo: que la IA reciba claves autoexplicativas y no ambiguas (ejemplo: `vg_que_ocurrio_tras_intento` -> `vg_resultado_tras_intento_separacion_victima`, `vg_consumo_detalle` -> `vg_consumo_autor_detalle_sustancias_frecuencia`).
- Este paso evita tener que renombrar todos los formularios y permite evolución progresiva sin romper el flujo actual.
- Durante transición, conservar ambos objetos para trazabilidad: `hechos_original` y `hechos_ai`.
- La API debe consumir `hechos_ai` para repreguntas de completitud y redacción final.

Fase 1 (piloto interno):

- Solo análisis de gaps + sugerencias al agente (sin preguntar al denunciante).

Fase 2 (chat controlado al denunciante):

- 1 pregunta por turno, máximo 5,
- trazabilidad completa.

Fase 3 (producción):

- redacción final asistida,
- métricas de calidad,
- revisión periódica de prompts.

---

## 20) Métricas de calidad recomendadas

- `% denuncias con gaps críticos cerrados`
- `preguntas IA por denuncia` (media)
- `tiempo extra por denuncia`
- `% sesiones READY_TO_DRAFT sin intervención adicional`
- `% correcciones manuales posteriores`
- `% preguntas IA consideradas útiles por agente`

---

## 21) Criterio operativo final

La IA debe comportarse como un **asistente de ampliación probatoria**, no como un formulario paralelo ni como un redactor autónomo sin control.

Fórmula práctica:

- motor fijo asegura base,
- IA cierra huecos relevantes,
- backend valida,
- salida final coherente para diligencia en **una sola redacción final**.

---

## 22) Criterios de aceptación (para nuevo hilo / validación rápida)

Usar estos checks en cualquier conversación nueva para verificar que el comportamiento está bien:

1. Si el lugar es genérico, pregunta por lugar exacto.
2. Si el lugar ya es concreto, no vuelve a preguntarlo.
3. No hace preguntas múltiples en una sola frase.
4. Formula al menos una pregunta de contexto motivacional.
5. Si el compareciente desconoce/no quiere el motivo, continúa y lo hace constar.
6. No cierra tras una sola repregunta si siguen gaps críticos.
7. Redacción final sin mencionar JSON/sistema/IA.
