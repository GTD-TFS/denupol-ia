# Integracion IA OpenAI

## Objetivo

Añadir una capa IA al final de la predenuncia para:

- hacer preguntas cortas de completitud en el idioma del denunciante,
- redactar la denuncia final siempre en espanol,
- guardar el resultado en Firebase sin exponer la API de OpenAI.

## Regla principal de seguridad

- La API de OpenAI no puede estar en el cliente.
- Este repo debe seguir siendo cliente.
- La llamada a OpenAI debe vivir en backend: `Firebase Functions v2` o `Cloud Run`.
- La clave debe guardarse en `Secret Manager`.

## Flujo

1. El denunciante entra con `token` temporal.
2. Completa el formulario normal.
3. Mientras no exista salida IA, solo se guarda `hechos` y se trabaja con JSON.
4. En el paso final se abre el sandbox IA.
5. El cliente llama a backend IA: `start`, `message`, `finalize`.
6. El backend valida el `token`.
7. El backend pregunta en el idioma de la UI.
8. El backend genera la denuncia final en espanol.
9. Cuando llega la salida global IA, se guarda en Firestore y debe quedar reflejada en Declaracion.

## Validaciones minimas en backend

- `token` existe en `tokenSessions`
- no esta caducado
- no esta ya cerrado o invalidado
- limite de uso por token
- limite de uso por IP
- sesion IA ligada al token y al fingerprint de `hechos`

## Datos a guardar

En `predenuncias/{token}`:

- `hechos`
- `doc`
- `doc_ai` si existe
- `aiStatus`
- `aiLang`
- `aiTurns`
- `aiPromptVersion`
- `doc_source`

## Regla JSON vs Declaracion

- Mientras no haya devolucion global de la IA:
  - la zona principal sigue trabajando solo con `hechos`
  - el contenido visible/util debe quedarse en JSON
  - no se debe rellenar Declaracion con texto incompleto o provisional
- Cuando exista devolucion final de la IA:
  - se guarda el texto completo en `doc_ai`
  - ese texto debe quedar grabado en el area de Declaracion de la consola principal
  - en la consola principal, Declaracion debe resolver con prioridad:
    - `doc_ai`
    - si no existe, `doc`

Campos recomendados:

- `doc`: texto base o fallback sin IA
- `doc_ai`: denuncia final completa generada por IA
- `doc_source`: `manual` o `ai`
- `aiStatus`: `disabled`, `skipped`, `completed` o `error`

Nueva coleccion temporal:

- `aiSessions/{sessionId}`

Campos minimos:

- `token`
- `status`
- `lang`
- `crimeType`
- `fixedAnswersSnapshot`
- `aiTurns`
- `hechosAi`
- `expiresAt`

## Modos de funcionamiento

- `off`: sin IA, flujo actual intacto
- `optional`: si IA falla, se sigue sin bloquear
- `required`: solo si algun dia se quiere obligar

Recomendacion inicial: `optional`.

## Multidioma

- Las preguntas IA deben salir en el idioma de la UI:
  - `es`, `en`, `fr`, `de`, `it`, `ru`, `ja`, `zh`
- La redaccion final debe salir siempre en espanol.
- Si el usuario cambia de idioma a mitad de flujo, reiniciar sesion IA.

## Cosas a tocar en el repo

- crear `functions/` o servicio backend equivalente
- mover la logica de `ai-local/server.mjs` al backend real
- adaptar `ai_assistant.js` para apuntar al backend seguro
- integrar el sandbox IA antes de `saveFinal()`
- guardar `doc` y `doc_ai` por separado
- hacer que la consola principal use `doc_ai` como fuente prioritaria de Declaracion
- anadir reglas Firestore versionadas al repo
- eliminar cualquier bypass de desarrollo en produccion

## No hacer

- no meter `OPENAI_API_KEY` en HTML o JS
- no llamar a OpenAI desde navegador
- no dejar sesiones IA solo en memoria
- no permitir escritura libre de campos `ai_*` desde cliente

## Orden recomendado

1. Definir backend IA seguro.
2. Definir reglas Firestore.
3. Integrar feature flag `off/optional/required`.
4. Conectar sandbox IA al paso final.
5. Probar multidioma.
6. Activar primero en modo `optional`.
