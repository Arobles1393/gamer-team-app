# Pruebas de GamerMatch

Hay tres tipos de pruebas:

| | Reglas de Firestore | Functions | Interfaz |
|---|---|---|---|
| Comando | `npm run test:rules` | `npm run test:functions` | `npm run test:e2e` |
| Carpeta | `tests/rules/` | `tests/functions/` | `tests/e2e/` |
| Contra qué corre | Emulador de Firestore (proyecto `demo-`) | El código de `functions/` directamente | La app local con el Firebase de **producción** |
| ¿Toca datos reales? | No | No (ni usa internet) | Sí, en las cuentas de prueba `qa_*` |
| ¿Corre sola en GitHub? | Sí, en cada PR y en cada push a `main` y `dev` | Sí, junto con las de reglas | No |
| Tiempo aproximado | 2 minutos | Segundos | 6 minutos |

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

Suites disponibles: `users-privacy`, `public-profiles`, `friends`, `chats`, `blocks`, `counters`, `posts-delete`, `queries`, `text-lengths`, `guides`, `matching`, `email-verification`.

**Cuentas de prueba y guía de bienvenida:** la guía se abre sola a quien no la ha completado (`users/{uid}/private/preferences`). `qa:setup` y `qa:reset` la dejan como vista en las cuentas `qa_*`; las pruebas que crean cuentas temporales la cierran o la marcan igual.

**Cuentas de prueba y verificación de correo:** las reglas piden el correo verificado para crear contenido social (salvo Steam). `npm run qa:setup` crea las cuentas `qa_*` ya verificadas; para marcar otra cuenta: `admin.auth().updateUser(uid, { emailVerified: true })` con el Admin SDK.

**Al cambiar `firestore.rules`:** agrega o ajusta la prueba de lo que cambió en la suite correspondiente (`tests/rules/<suite>.rules.cjs`). Una suite es una función que recibe `{ env, test, expect }`; `env` es el entorno de `@firebase/rules-unit-testing`.

El emulador usa los puertos 8181 (Firestore) y 4410 (hub), distintos de los de `firebase emulators:start`, así que puede correr aunque tengas el emulador de functions abierto.

## Pruebas de functions (`npm run test:functions`)

Comprueban "Unirme en Steam" (`isEligible`, `buildJoinUrl`, `sanitizeGameName`, y que ninguna otra función use `lobbysteamid`, `gameserverip` ni `steam://connect`), la reautenticación reciente que exige `deleteAccount` (menos de 5 minutos), el conteo por país del mapa de la comunidad (`aggregateActiveUsers`: enmascarado, filtro por juego, masa crítica) y la protección contra SSRF de `fetchLinkPreview` (la vista previa de las guías de link externo): IPs internas en IPv4 e IPv6, nombres internos como `metadata.google.internal` o `localhost`, IPs escritas en hexadecimal o decimal, puertos y credenciales en la URL, y la lectura de las etiquetas Open Graph. Ninguna se conecta a internet.

`npm run test:functions:emulator` prueba la autorización completa de `getJoinInfo` (amistad, interés, bloqueos, permiso, sala) contra el emulador de Firestore, con Steam simulado; también corre en el GitHub Action. La llamada real a Steam (una sala de verdad) se prueba a mano.

## Pruebas unitarias del cliente (`npm run test:unit`)

Jest (el de Create React App) sobre funciones puras de `src`, por ejemplo la validación de imágenes de `src/utils/cropImage.js` y la lista cerrada de `src/utils/supportUrl.js` (solo `https://ko-fi.com/...`). El recorte en sí usa canvas, que no existe en jsdom: lo prueba `tests/e2e/profile-crop.e2e.cjs`. También corre en el GitHub Action.

## Pruebas de interfaz (`npm run test:e2e`)

Abren la app en un navegador (Edge por defecto) e inician sesión con las cuentas de prueba para recorrer los flujos principales: registro, amistad, chat 1:1 y de grupo, idioma de la cuenta, bloqueos, reportes y panel de admin, guías (escritura, moderación y HTML malicioso), jugadores compatibles (preferencias, % y que no salgan amigos ni bloqueados), partidas programadas, filtros, estados vacíos, privacidad y la vista en celular.

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
| `E2E_DELETE_ACCOUNT=1` | Incluye eliminar cuenta. Necesita el emulador de functions corriendo; crea cuentas temporales `qa_del_*` con datos cruzados, borra una desde la interfaz y comprueba que no quede rastro. Tarda unos 6 minutos: espera a que una sesión tenga más de 5 para probar que se exige reautenticación |
| `E2E_COMMUNITY=1` | Incluye el mapa de la comunidad. Necesita el emulador de functions corriendo; crea documentos temporales `users/qa_map_*` (sin cuenta) para llegar a 20 activos y los borra al terminar. Tarda unos 3 minutos por la caché de 60 s de la función |
| `E2E_GUIDES_EXTERNAL=1` | Incluye la guía de link externo y el intento de SSRF desde la interfaz. Necesita el emulador de functions corriendo (`firebase emulators:start --only functions`) |
| `E2E_PUBLISH=1` | Incluye la prueba de publicar una partida (crea una partida real en cada corrida, por eso viene apagada) |

Las capturas de cada escenario quedan en `tests/e2e/screenshots/` (ignorada por git).

### Lo que no cubren

El login con Google y con Steam (abren ventanas de terceros), el cambio de correo (necesita un correo real) y subir archivos (Storage no está activo en el plan Spark).
