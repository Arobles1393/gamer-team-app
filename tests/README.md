# Pruebas de GamerMatch

Hay dos tipos de pruebas:

| | Reglas de Firestore | Interfaz |
|---|---|---|
| Comando | `npm run test:rules` | `npm run test:e2e` |
| Carpeta | `tests/rules/` | `tests/e2e/` |
| Contra qué corre | Emulador de Firestore (proyecto `demo-`) | La app local con el Firebase de **producción** |
| ¿Toca datos reales? | No | Sí, en las cuentas de prueba `qa_*` |
| ¿Corre sola en GitHub? | Sí, en cada PR y en cada push a `main` y `dev` | No |
| Tiempo aproximado | 2 minutos | 5 minutos |

## Pruebas de reglas (`npm run test:rules`)

Comprueban que `firestore.rules` protege lo que debe proteger: privacidad de `users`, amistad con consentimiento, bloqueos, contadores, chats, límites de texto, etc. Cada suite empieza con la base vacía.

**Requisitos:** Java 11 o superior (el emulador corre sobre Java). El comando usa `firebase-tools@13.35.1` con `npx`, así que no depende de la versión de firebase-tools que tengas instalada (la 15 pide Java 21).

**Correr solo algunas suites:**

```bash
# Git Bash
RULES_SUITES=chats,friends npm run test:rules
```

```powershell
# PowerShell
$env:RULES_SUITES="chats,friends"; npm run test:rules; Remove-Item Env:RULES_SUITES
```

Suites disponibles: `users-privacy`, `public-profiles`, `friends`, `chats`, `blocks`, `counters`, `posts-delete`, `queries`, `text-lengths`.

**Al cambiar `firestore.rules`:** agrega o ajusta la prueba de lo que cambió en la suite correspondiente (`tests/rules/<suite>.rules.cjs`). Una suite es una función que recibe `{ env, test, expect }`; `env` es el entorno de `@firebase/rules-unit-testing`.

El emulador usa los puertos 8181 (Firestore) y 4410 (hub), distintos de los de `firebase emulators:start`, así que puede correr aunque tengas el emulador de functions abierto.

## Pruebas de interfaz (`npm run test:e2e`)

Abren la app en un navegador (Edge por defecto) e inician sesión con las cuentas de prueba para recorrer los flujos principales: registro, amistad, chat 1:1 y de grupo, idioma de la cuenta, bloqueos, reportes y panel de admin, partidas programadas, filtros, estados vacíos, privacidad y la vista en celular.

> **Importante:** la app local se conecta al Firebase de producción, así que estas pruebas **escriben datos reales** en las cuentas `qa_*` (siempre las mismas, y al terminar se dejan como estaban). Para probar el panel de admin le dan permiso de admin a `qa_diego` y se lo quitan al terminar.

### Requisitos

1. La app corriendo: `npm start`.
2. Credenciales del proyecto en `GOOGLE_APPLICATION_CREDENTIALS` (por ejemplo las de `firebase login`):

   ```powershell
   $env:GOOGLE_APPLICATION_CREDENTIALS="$env:APPDATA\firebase\<tu-correo>_application_default_credentials.json"
   $env:GOOGLE_CLOUD_QUOTA_PROJECT="gamerteam-4ed20"
   ```

3. Las cuentas de prueba creadas (una sola vez): `npm run qa:setup`. Crea `qa_ana`, `qa_bruno`, `qa_carla` y `qa_diego` con datos de ejemplo; `qa_eva` la registra la propia prueba desde el formulario. Las contraseñas quedan en `tests/e2e/.qa-users.json`, que git ignora.

### Comandos

| Comando | Qué hace |
|---|---|
| `npm run test:e2e` | Corre todas las pruebas de interfaz |
| `npm run qa:setup` | Crea las cuentas `qa_*` y sus datos (una sola vez) |
| `npm run qa:reset` | Devuelve las cuentas `qa_*` a su estado inicial |
| `npm run qa:cleanup` | Muestra todo lo que borraría de las cuentas `qa_*` |
| `npm run qa:cleanup -- --write` | Borra las cuentas `qa_*` y todos sus datos |

### Variables opcionales

| Variable | Para qué |
|---|---|
| `E2E_BROWSER` | Navegador: `msedge` (por defecto), `chrome`... |
| `E2E_BASE_URL` | URL de la app (por defecto `http://localhost:3000`) |
| `E2E_PUBLISH=1` | Incluye la prueba de publicar una partida (crea una partida real en cada corrida, por eso viene apagada) |

Las capturas de cada escenario quedan en `tests/e2e/screenshots/` (ignorada por git).

### Lo que no cubren

El login con Google y con Steam (abren ventanas de terceros), el cambio de correo (necesita un correo real) y subir archivos (Storage no está activo en el plan Spark).
