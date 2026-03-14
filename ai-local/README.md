# AI Local (DENUPOL)

Servidor local para pruebas de IA sin VPS, usando Ollama (modelo en nube para no calentar el Mac).

## 1) Arrancar

Desde esta carpeta:

```bash
npm start
```

Para forzar nube aunque luego cambies `.env`:

```bash
npm run start:cloud
```

Debe mostrar:

```text
AI local API escuchando en http://127.0.0.1:8787
```

Si vas a usar modelo cloud, inicia sesion una vez en Ollama:

```bash
ollama signin
```

## 2) Probar salud

En otra terminal:

```bash
curl http://127.0.0.1:8787/health
```

## 3) Probar inicio de sesion IA

```bash
curl -X POST http://127.0.0.1:8787/ai/session/start \
  -H "Content-Type: application/json" \
  -d '{
    "token":"demo",
    "crimeType":"AGRESION_FAMILIAR_AFECTIVO",
    "lang":"es",
    "fixedAnswers":{
      "vg_que_ocurrio_tras_intento":"Cuando intente separarme me persiguio y me amenazo.",
      "vg_consumo_detalle":"Alcohol diario y cannabis fines de semana",
      "hecho_resumen":"Discusion en domicilio con amenazas"
    }
  }'
```

## 4) Variables

Archivo `.env`:

```env
PORT=8787
OLLAMA_URL=http://127.0.0.1:11434
OLLAMA_MODEL=gpt-oss:20b-cloud
OLLAMA_KEEP_ALIVE=0s
OLLAMA_NUM_THREAD=1
OLLAMA_NUM_CTX=1024
OLLAMA_TEMPERATURE=0.1
OLLAMA_NUM_PREDICT=160
```

## 5) Endpoints disponibles

- `GET /health`
- `POST /ai/session/start`
- `POST /ai/session/message`
- `POST /ai/session/finalize`

## 6) Nota de diseno

Antes de preguntar al modelo, el servidor traduce claves ambiguas de `hechos` a claves clarificadas para IA (`hechos_ai`), por ejemplo:

- `vg_que_ocurrio_tras_intento` -> `vg_resultado_tras_intento_separacion_victima`
- `vg_consumo_detalle` -> `vg_consumo_autor_detalle_sustancias_frecuencia`

## 7) Evaluación automática (modo frío)

Ejecución secuencial con pausas para no calentar el equipo:

```bash
npm run eval:batch
```

Modo ultra-frío (solo preguntas, sin redacción final):

```bash
EVAL_MODE=questions EVAL_COOLDOWN_MS=9000 EVAL_CASE_LIMIT=1 npm run eval:batch
```

Opcional:

```bash
EVAL_COOLDOWN_MS=2500 npm run eval:batch
```

Salida:

- `tests/out/latest.json`
