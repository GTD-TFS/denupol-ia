# Activacion Final Firebase

## Ya preparado

- repo publicado
- hosting configurado
- functions configuradas
- cliente IA integrado
- `doc_ai` grabado y mostrado en Declaracion
- Firestore rules versionadas
- Firebase CLI instalada y autenticada

## Falta para activarlo de verdad

1. Crear el secreto:

```bash
$HOME/.local/firebase-cli/bin/firebase functions:secrets:set OPENAI_API_KEY
```

2. Desplegar functions:

```bash
$HOME/.local/firebase-cli/bin/firebase deploy --only functions
```

3. Desplegar hosting:

```bash
$HOME/.local/firebase-cli/bin/firebase deploy --only hosting
```

4. Aplicar reglas Firestore:

```bash
$HOME/.local/firebase-cli/bin/firebase deploy --only firestore:rules
```

## Estado recomendado antes de la clave

- IA apagada por defecto
- no se llama a OpenAI si no hay backend operativo
- el flujo sigue funcionando solo con JSON

## Comprobacion funcional

1. Crear token en consola principal.
2. Abrir una UI global con ese token.
3. Completar hechos.
4. Ver que aparece sandbox IA en el ultimo paso.
5. Finalizar.
6. Comprobar en Firestore:
   - `doc` sigue siendo resumen/base
   - `doc_ai` contiene la denuncia completa
   - `aiStatus` queda en `completed`
7. Comprobar en consola principal:
   - JSON sigue mostrando `hechos`
   - Declaracion muestra `doc_ai`

## Si quieres dejar la IA apagada temporalmente

No pongas la clave y no despliegues `functions`.

El proyecto seguira funcionando sin IA.
