# Auditoría de GamerMatch

Fecha: 2026-10-08 · Rama `dev`, commit `a6e8b73` · Alcance: frontend (raíz), `functions/`, `firestore.rules`, `storage.rules`, `firestore.indexes.json`, `firebase.json` y configuración.

**Auditoría de solo lectura**: no se modificó código, reglas, configuración ni datos. Las pruebas efímeras se hicieron en el emulador con el proyecto `demo-gamermatch` (base vacía; los scripts quedaron fuera del proyecto). Las pruebas e2e no se corrieron porque escriben en producción. **No existe `docs/inventario-datos.md`**.

Confianza: **[VERIFICADO]** lo confirma el código o una prueba · **[INFERIDO]** se deduce pero no está explícito · **[NO VERIFICABLE EN EL CÓDIGO]** depende de la consola de Firebase u otro servicio.

Severidad: **Crítica** explotable por cualquiera con pérdida/exposición de datos o costos descontrolados · **Alta** debe corregirse antes de la beta · **Media** corregir pronto · **Baja** mejora menor · **Informativa**.

> Contexto importante: hoy **están desplegadas en producción las reglas de Firestore** y los índices; **no** están desplegadas las Cloud Functions ni Storage (plan Spark). Por eso los hallazgos de reglas de Firestore son explotables **ya**, y los de Functions/Storage lo serán **en cuanto se desplieguen**.

---

## 1. Resumen ejecutivo

### Estado por área

| Área | Estado | Comentario |
|---|---|---|
| A. Firestore | **Crítico** | Reglas sólidas en amistad, chats 1:1, contadores, guías y admin, pero **casi ninguna colección limita tamaño ni claves**, las notificaciones aceptan cualquier destinatario y el bloqueo no cubre el chat de partida. |
| B. Storage | Atención | Reglas razonables; el problema grave viene de Functions (borrado por `mediaPath`). |
| C. Functions | **Crítico** | `syncGamingNews` es un endpoint público sin protección; `cleanupCommentMedia` borra la ruta que diga el cliente. Buen trabajo en SSRF, login con Steam, `deleteAccount` y `getJoinInfo`. |
| D. Cliente | Bueno | Sin XSS encontrado: DOMPurify bien configurado, `rel` en todos los `_blank`, `postMessage` con origen comprobado. Faltan CSP y hay source maps públicos. |
| E. Autenticación | Atención | Flujos bien resueltos; el registro a medias deja cuentas sin perfil. |
| F. Datos | Aceptable | Batches y transacciones donde hacen falta; retención sin límite. |
| G. Costos | Atención | Un video de 18,9 MB en el login es el mayor costo previsible; sondeos sin pausa. |
| H. Arquitectura | Bueno | Componente → hook → servicio respetado; sin `console.log`; falta ErrorBoundary. |
| I. Funciones grandes | Aceptable | Bloqueos bien filtrados en la interfaz; huecos en reglas (ver A). |
| J. Accesibilidad | Atención | Buena base (aria, foco, reduced-motion en la mitad del CSS); contraste insuficiente en violeta como texto, `--gm-hint` y botón con degradado. |
| K. i18n | Aceptable | 981 claves en paridad exacta en 4 idiomas; 7 textos fijos en español. |
| L. Privacidad | Atención | Perfiles públicos, intereses y actividad (`lastSeen`) legibles sin sesión; textos legales pendientes; sin edad mínima. |
| M. Dependencias y pruebas | Atención | 431 pruebas automáticas y CI; vulnerabilidades corregibles en `functions`; CRA deprecado. |
| N. Producción | **Crítico** | Sin sección `hosting` en `firebase.json` y lint de `functions` que bloquea el `predeploy`. |

### Los 10 hallazgos más importantes

1. **C-01 (Crítica)**: `syncGamingNews` es una función HTTP pública: cualquiera puede invocarla en bucle y cada llamada borra y reescribe todas las noticias.
2. **C-02 (Crítica)**: cualquier usuario verificado puede **borrar cualquier archivo de Storage** (avatares, adjuntos de chats ajenos) poniendo esa ruta en `mediaPath` de un comentario y borrándolo.
3. **A-03 (Alta)**: las reglas no limitan tamaño ni claves en perfiles públicos, posts, comentarios, mensajes, notificaciones y reportes: un usuario puede inflar documentos que **todos** descargan (incluso sin sesión).
4. **A-04 (Alta)**: cualquiera puede crear notificaciones para **cualquier usuario**, de cualquier tipo y tamaño, **incluso estando bloqueado**.
5. **A-05 (Alta)**: `firebase.json` no tiene `hosting`: sin redirección SPA (recargar `/profile` daría 404), sin cabeceras de seguridad ni caché.
6. **A-06 (Alta)**: el lint de `functions` tiene 2.095 errores y corre como `predeploy`: hoy no se pueden desplegar las funciones.
7. **M-07 (Media)**: un usuario bloqueado sigue leyendo y escribiendo en el chat de la partida de quien lo bloqueó (la interfaz solo oculta sus mensajes a la víctima).
8. **M-08 (Media)**: los nombres de usuario no son únicos: suplantar a otro (nombre + avatar) es trivial.
9. **M-09 / M-10 (Media)**: funciones que llaman APIs externas sin límite por usuario ni `maxInstances`, y registros de error que incluirían las claves de API.
10. **M-17 (Media)**: el login reproduce un video de 18,9 MB: lento en móvil y el mayor costo de transferencia de Hosting.

### Veredicto

**No abrir la beta tal como está.** Se puede abrir una **beta cerrada** (personas invitadas) cuando se cumplan estas condiciones:

1. Corregir **C-01** y **C-02** antes de desplegar Functions y habilitar Storage. Son las dos únicas Críticas y ambas se arreglan con poco esfuerzo.
2. Corregir **A-03** y **A-04** en las reglas, que ya están en producción.
3. Resolver los bloqueantes de despliegue **A-05** y **A-06**.
4. Activar Blaze con **alertas de presupuesto** y fijar `maxInstances` (M-09).
5. Publicar al menos un aviso de privacidad real (área L; decisión fuera del código).

El resto (Media y Baja) puede ir durante la beta.

---

## 2. Tabla de hallazgos

| ID | Área | Severidad | Título | Evidencia | Impacto | Recomendación | Esfuerzo | Confianza |
|---|---|---|---|---|---|---|---|---|
| C-01 | C | **Crítica** (al desplegar) | `syncGamingNews` HTTP pública sin autenticación ni programación | `functions/gamingNews/gamingNews.functions.js:4` (`onRequest`), `:32` (devuelve `error.message`); `gamingNews.service.js:82,100` | Cualquiera en internet la invoca en bucle: cada llamada lee y borra todas las noticias y escribe ~35; con instancias sin tope, costo e indisponibilidad del feed de noticias. Además, nada la ejecuta periódicamente. | Convertirla en función programada (scheduler) sin endpoint público, o exigir un secreto/autenticación de administrador; no devolver mensajes internos. | S | [VERIFICADO] |
| C-02 | C/A/B | **Crítica** (al habilitar Storage y Functions) | Borrado arbitrario de archivos vía `mediaPath` de comentarios | `firestore.rules:246-249` (sin validar `mediaPath`); `functions/postComments/postComments.functions.js:10,15`; `functions/account/account.service.js:94,113,189` | Usuario verificado B comenta con `mediaPath: "avatars/{A}"` (o la ruta de un adjunto de un chat ajeno) y borra su comentario → el trigger borra ese archivo con privilegios de administrador. También ocurre al eliminar cuenta. Emulador: la regla **PERMITE** crear y borrar ese comentario. | Validar en reglas que `mediaPath` empiece por `comments/{uid}/` del autor, y en la función volver a comprobar el prefijo antes de borrar. | S | [VERIFICADO] reglas (emulador) y código de la función |
| A-03 | A | **Alta** (explotable ya) | Documentos sin límite de tamaño ni lista de claves | `firestore.rules:58-60` (users), `:86-93` (publicProfiles: `username` solo `is string`; `links`, `games`, `avatar`, `banner` libres), `:187-192` (posts), `:246-249` (comentarios), `:390-392`/`:475-479` (mensajes, `createdAt` del cliente), `:503-508` (reports); `src/services/profile/profileService.js:67` (`createdAt` del cliente) | Emulador: username de 100.000 caracteres, 5.000 juegos, `game` de 50.000 caracteres, campos libres de 100-200 KB y mensajes fechados en 2099 → **PERMITE**. Un perfil de ~1 MB lo descargan todos los que ven sus posts (también sin sesión) y se reenvía con cada `lastSeen` (cada 2 min); los mensajes con fecha futura quedan fijos al final del chat; `authorRegion` falsificable. En Spark, agotar la cuota deja la app caída para todos. | Añadir `hasOnly` y tamaños máximos (strings y listas) en cada `create`/`update`, y exigir `request.time` en `createdAt`. | M | [VERIFICADO] (emulador) |
| A-04 | A | **Alta** (explotable ya) | Notificaciones sin validar destinatario, tipo, campos ni bloqueos | `firestore.rules:358-359` | B crea notificaciones ilimitadas para cualquier usuario, de cualquier tipo, con documentos grandes, **aunque A lo haya bloqueado** (emulador: PERMITE). La interfaz oculta las de bloqueados (`useNotifications.js:58`), pero el listener de A igual las descarga (hasta 100 no leídas). | Validar `userId` ≠ `senderId`, `type` en lista cerrada, `hasOnly` de claves, `relatedId` con tamaño, y `noBlockBetween`. | S | [VERIFICADO] (emulador) |
| A-05 | N | **Alta** | `firebase.json` sin sección `hosting` | `firebase.json` (solo `functions`, `firestore`, `storage`) | Sin redirección de la SPA a `index.html`, recargar cualquier ruta (`/profile`, `/post/x`) devolvería 404; sin cabeceras de seguridad (CSP, `X-Content-Type-Options`, `Referrer-Policy`, `frame-ancestors`) ni caché larga para `/static`. | Agregar `hosting` con `public: build`, rewrite `**` → `/index.html`, cabeceras de seguridad y caché inmutable para archivos con hash. | S | [VERIFICADO] |
| A-06 | M/N | **Alta** | El lint de `functions` bloquea el despliegue | `firebase.json` (`predeploy: npm --prefix "$RESOURCE_DIR" run lint`); 2.095 errores en 32 archivos | `firebase deploy --only functions` falla hoy. Ningún error es de lógica: 1.978 se corrigen solos (`linebreak-style` 1.054, `indent` 441…). | Corregir con `eslint --fix` (y ajustar `linebreak-style` a Windows o `.gitattributes`), o relajar las reglas de estilo. | S | [VERIFICADO] |
| M-07 | A/I | Media (explotable ya) | El bloqueo no saca del chat de partida | `firestore.rules:472-479` (mensajes de grupo sin `noBlockBetween`) | Si A bloquea a B después de que B entró a su partida, B sigue leyendo los mensajes de A y escribiendo (emulador: PERMITE). La interfaz de A oculta los de B (`GroupChatWindow.js:55`), pero los demás participantes sí los ven. | Al bloquear, sacar al bloqueado de los grupos del bloqueador (o comprobar bloqueo con el autor en la regla). | M | [VERIFICADO] (emulador) |
| M-08 | A/E | Media (explotable ya) | Nombres de usuario no únicos: suplantación | Sin comprobación en `src/` (grep de `usernameLower` solo en escrituras y búsqueda); `firestore.rules:91` | B se pone el mismo nombre que A (emulador: PERMITE) y puede copiar su avatar (URL arbitraria): mensajes, solicitudes y comentarios aparecen como "A". | Reservar nombres con una colección `usernames/{lower}` creada en la misma transacción (o Cloud Function), y validar formato y largo. | M | [VERIFICADO] |
| M-09 | C/G | Media | Funciones con APIs externas sin límite por usuario, sin caché y sin `maxInstances` | `functions/steam/steam.functions.js:4` (getSteamStats: 1-4 llamadas a Steam por invocación), `steamgrid.functions.js:14,30`, `games.functions.js:5` (logGameSearch infla tendencias), `guides.functions.js:7`; ninguna función fija `maxInstances` | Un usuario con un script puede agotar la cuota diaria de la clave de Steam (afecta a todos), inflar tendencias y escalar instancias sin tope. | Límite por usuario (como `getJoinInfo`), caché corta de respuestas, `maxInstances` global y App Check. | M | [VERIFICADO] |
| M-10 | C | Media | Claves de API en los registros de errores | `steam.functions.js:17,49`, `steamgrid.functions.js:9`, `twitch.functions.js:18` (`console.error(..., error)` con el error de axios completo) | El error de axios incluye `config.params.key` (Steam) y `config.headers.Authorization` (SteamGridDB, Twitch): acabarían en Cloud Logging, visibles para quien tenga acceso a los logs. | Registrar solo `error.code`/`status`/`message`, nunca el objeto. | S | [INFERIDO] (depende de la serialización del logger) |
| M-11 | A/L | Media (explotable ya) | Lectura masiva sin sesión | `firestore.rules:101` (publicProfiles), `:245` (post_comments), `:271` (post_interested), `:225` (game_stats), `:184` (posts) | Sin sesión se puede listar a **todos** los usuarios con región, redes, juegos y `lastSeen` (actividad en línea), y quién se interesó en qué partida (emulador: PERMITE). | Si el feed sin sesión es necesario, limitar `list` a consultas acotadas o servir una vista pública reducida; exigir sesión para `publicProfiles` y `post_interested`. | M | [VERIFICADO] (emulador) |
| M-12 | A | Media (explotable ya) | Solicitudes de amistad reenviables en bucle | `firestore.rules:344-349` | Tras un rechazo, el emisor puede reenviarla de inmediato una y otra vez (emulador: PERMITE), cada vez con notificación. | Esperar un tiempo mínimo antes de reenviar (comparar `createdAt` con `request.time`). Mientras tanto, bloquear sirve como defensa. | S | [VERIFICADO] (emulador) |
| M-13 | E | Media | El registro a medias deja la cuenta sin perfil | `src/services/auth/authService.js:26` (crea en Auth), `:32` (crea perfil después); `src/components/Profile/Profile.js:139` | Si falla la escritura del perfil tras crear la cuenta, el login por correo nunca lo recrea (Google y Steam sí) y Mi perfil queda en el esqueleto de carga para siempre. | Al iniciar sesión, si no existe `users/{uid}`, ofrecer completar el perfil (como Google/Steam). | S | [VERIFICADO] |
| M-14 | H | Media | Sin ErrorBoundary | Ningún `componentDidCatch`/`getDerivedStateFromError` en `src/` | Cualquier error de render deja la pantalla en blanco sin forma de recuperarse ni registro. | ErrorBoundary global (y por ruta) con pantalla de "algo salió mal" y botón de recargar. | S | [VERIFICADO] |
| M-15 | M | Media | Dependencias vulnerables en `functions` | `npm audit` (producción): 2 críticas (`proxy-addr`, `websocket-driver`), 8 altas (`axios`, `firebase-admin`→`node-forge`, `@grpc/grpc-js`, `protobufjs`, `fast-xml-builder`, `form-data`, `@fastify/busboy`) | Todas tienen arreglo sin cambio de versión mayor. Alcanzabilidad: `axios` y `node-forge` se usan; `proxy-addr` solo afecta si se configura `trust proxy` [INFERIDO no explotable]. | `npm audit fix` en `functions` y actualizar `firebase-admin`/`firebase-functions` a la última menor. | S | [VERIFICADO] (audit) |
| M-16 | D | Media | Clave de RAWG en el bundle | `src/utils/searchGames.js:1` (`REACT_APP_RAWG_API_KEY`) | Cualquiera la extrae del JS y consume la cuota de la cuenta. | Pasar la búsqueda de RAWG por una Cloud Function con caché, o aceptarlo para la beta vigilando el uso. | M | [VERIFICADO] |
| M-17 | G/N | Media | Video de 18,9 MB en la pantalla de login | `public/video/vidControl.mp4`; `src/components/Auth/ui/AuthLayout.js:41` (autoplay) | Carga lenta en móvil y consumo de datos; es el mayor costo de transferencia previsible de Hosting (ver sección 7). También `public/imagenotfound.png` pesa 1,7 MB. | Comprimir (≤ 2 MB), `preload="none"`/póster y no reproducirlo en móvil o con `prefers-reduced-motion`. | S | [VERIFICADO] |
| M-18 | N | Media | Sin App Check ni monitoreo de errores | Sin `initializeAppCheck` ni servicio de errores en `src/` | Scripts pueden llamar a Firestore y Functions como si fueran la app (agrava A-03, A-04, M-09); los errores de los usuarios de la beta no llegan a nadie. | Activar App Check (reCAPTCHA Enterprise) en modo monitor y luego forzado; añadir un reporte de errores (p. ej. desde el ErrorBoundary). | M | [VERIFICADO] |
| M-19 | J | Media | Contraste insuficiente | `src/styles/theme.css` (`--gm-primary #7C3AED`, `--gm-hint #5E5C78`, `--gm-subtle #7C7A94`, degradado violeta→rosa en `buttons.css`) | Violeta como texto: 3,31:1 sobre fondo; `--gm-hint`: 2,95:1 (falla incluso para texto grande; 7 usos); `--gm-subtle` sobre tarjeta: 4,22:1 (52 usos de color); blanco sobre el extremo rosa del botón primario: 3,67:1 (texto de 14 px). | Usar `--gm-label` (#A78BFA, 6,9:1) para texto violeta, aclarar `--gm-hint` y `--gm-subtle`, y oscurecer el rosa del degradado detrás del texto. | S | [VERIFICADO] (cálculo) |
| B-20 | D | Baja | Source maps públicos en producción | `build/static/js/*.map` (9 archivos) | Exponen el código fuente legible (no hay secretos en él, pero facilita buscar fallos). | `GENERATE_SOURCEMAP=false` en el build de producción o subirlos solo al servicio de errores. | S | [VERIFICADO] |
| B-21 | B | Baja | Storage: SVG aceptado, URLs con token permanentes y archivos huérfanos | `storage.rules` (`image/.*`); `messageMedia.js:18`, `commentsService.js:47`; `group_chats` sin borrado (`firestore.rules:465`) | Un SVG subido saltándose el cliente se aceptaría en avatar (se sirve desde otro origen, impacto bajo); quien sale de un chat de partida conserva las URLs de los adjuntos; los archivos de partidas borradas y las imágenes de guías no publicadas quedan para siempre. | Lista cerrada de tipos (sin SVG); limpieza programada de grupos inactivos y de imágenes huérfanas. | M | [VERIFICADO] reglas / [INFERIDO] URLs |
| B-22 | A | Baja | Chats 1:1 con id arbitrario | `firestore.rules:371-374` | B puede crear varios chats con A (`chats/random1`, `random2`; emulador: PERMITE); escribir a no amigos es intencional en la interfaz. | Exigir `chatId == uidMenor_uidMayor`. | S | [VERIFICADO] (emulador) |
| B-23 | A/D | Baja | URLs externas arbitrarias en avatar, portada y medios | `firestore.rules:86-93`; `ProfileHero.js:54` (`url(${bannerImage})`); `MessageBubble.js`, `CommentItem.js` | Permite píxeles de rastreo (IP de quien mira) y contenido sin moderar; la portada admite varias URLs por la interpolación en CSS. `javascript:` lo bloquea React 19. Un "adjunto" puede apuntar a un `.exe` con nombre `factura.pdf`. | Restringir esas URLs al dominio de Storage del proyecto en las reglas. | S | [VERIFICADO] (emulador) |
| B-24 | C | Baja | `http://localhost:3000` permitido como `return_to` del login con Steam en producción | `functions/steamAuth/steamAuth.service.js:42` | Amplía los orígenes válidos sin necesidad en producción. | Incluir localhost solo cuando corre en el emulador. | S | [VERIFICADO] |
| B-25 | A/C | Baja | Tendencias manipulables | `firestore.rules:226-236` (id no ligado a `game`); `games.service.js` (sin límite) | Documentos duplicados de `game_stats` para el mismo juego; búsquedas infladas sin límite. | Exigir `gameId == encode(game)`; limitar `logGameSearch` por usuario. | S | [VERIFICADO] (emulador) |
| B-26 | C | Baja | Secretos de Functions como variables de entorno | `functions/.env` (STEAM_API_KEY, STEAMGRID_API_KEY, TWITCH_CLIENT_ID, TWITCH_CLIENT_SECRET) | Al desplegar quedan en texto plano en la configuración de la función. | Usar `defineSecret` (Secret Manager). | S | [VERIFICADO] (nombres; valores no leídos) |
| B-27 | G | Baja | Sondeos sin pausa con la pestaña oculta | `useSteamPresenceBatch.js:53`, `useTwitchPresenceBatch.js:54` (90 s), `useCommunityStats.js:38` (60 s) | Invocaciones de Functions y llamadas a Steam/Twitch con la pestaña en segundo plano. | Pausar con `visibilitychange` como ya hacen `useUserPresence` y `useSteamJoinInfo`. | S | [VERIFICADO] |
| B-28 | K | Baja | Textos fijos en español | `GamingNews.js:48`, `NewsCard.js:45` ("Leer en"), `PostDetailHero.js:65,78`, `PostInfoCard.js:48`, `GameAchievements.js:91-93` | Se ven en español en en/pt/fr. | Pasarlos a `t()`. | S | [VERIFICADO] |
| B-29 | M | Baja | Dependencias sin uso (y listadas en Créditos) | `package.json`: `axios`, `framer-motion`, `world-atlas` sin import en `src/`; aparecen en `/creditos` | Ruido en `npm audit` (axios) y créditos inexactos. | Quitarlas y regenerar créditos. | S | [VERIFICADO] |
| B-30 | N | Baja | Metadatos de plantilla | `public/manifest.json` ("React App", "Create React App Sample", colores blancos); `public/index.html` (`lang="en"` inicial, título "Gamer Match", sin Open Graph) | Al instalar la app o compartir enlaces aparece la plantilla de CRA. | Completar manifest, `lang="es"`, Open Graph y título. | S | [VERIFICADO] |
| B-31 | F | Baja | Retención sin límite y notificaciones huérfanas | `postService.js` (`deleteNotificationsAbout` solo borra las propias); sin limpieza de `notifications`, `group_chats` inactivos ni `steamNonces` (TTL pendiente de Blaze) | Crecimiento indefinido y notificaciones que apuntan a partidas borradas. | Limpieza programada y TTL. | M | [VERIFICADO] |
| I-32 | M | Informativa | Create React App está deprecado | `react-scripts` 5.0.1 | 73 vulnerabilidades altas de herramientas de build (no llegan al navegador) y sin mantenimiento futuro. | Planificar migración a Vite después de la beta. | L | [VERIFICADO] |
| I-33 | L | Informativa | Sin comprobación de edad mínima | Sin campos ni validación de edad en `src/` | Hecho a tener en cuenta al redactar los términos. | Decisión de producto/legal. | — | [VERIFICADO] |
| I-34 | H | Informativa | Comentarios desactualizados | `src/services/profile/publicProfileService.js:4-6` (dice que `users` guarda correo y teléfono, ya no) | Confunde a quien mantenga el código. | Actualizar el comentario. | S | [VERIFICADO] |

---

## 3. Detalle por área

### Paso 0. Mapa del proyecto

**Stack:** React 19 + Create React App 5 + PrimeReact 10 + i18next (es/en/pt/fr) + Firebase 12. Cloud Functions con `firebase-functions` 7.2.5 (API v2), Node 24 (`functions/package.json`). La raíz no declara `engines` ni `.nvmrc` (local: Node 24.11).

**Estructura:** `src/components` (34 carpetas), `src/hooks` y `src/services` por dominio, `src/utils`, `src/context`, `src/routes`, `src/locales`, `src/legal`, `src/credits`, `src/onboarding`; `functions/` (12 módulos); `tests/` (rules, functions, e2e); `scripts/`. 360 archivos JS en `src`, 33 en `functions`.

**Rutas** (`src/routes/RootRoutes.js`, `AppRoutes.js`): públicas `/`, `/explorar`, `/post/:id`, `/news`, `/guias`, `/guias/:id`, `/privacidad`, `/terminos`, `/creditos`, `/login`, `/recuperar`, `/auth/steam/return`, `*` (404); con sesión (solo cliente, `RequireAuth`) `/profile`, `/myposts`, `/myparties`, `/chat`, `/notifications`, `/friends`, `/findPlayers`, `/comunidad`, `/guias/nueva`; admin (`RequireAdmin`, claim `admin`) `/admin/reports`, `/admin/guides`.

**Colecciones** (uso cruzado con reglas): users (+`private`), publicProfiles, matchProfiles, posts, game_stats, post_comments, post_interested, friends, friend_requests, notifications, chats (+`messages`), group_chats (+`messages`), gaming_news, blocks, reports, guides, steamNonces. **Todas tienen regla y todas las reglas tienen uso** [VERIFICADO].

**Storage:** `avatars/{uid}`, `banners/{uid}`, `comments/{uid}/*`, `chats/{chatId}/{uid}/*`, `group_chats/{postId}/{uid}/*`, `guides/{authorId}/*`; todo lo demás denegado. Bucket inexistente hoy [NO VERIFICABLE EN EL CÓDIGO].

**Funciones:** 11 callables + `syncGamingNews` (HTTP) + `cleanupCommentMedia` (trigger). Todas v2, región por defecto, sin `maxInstances`.

**Servicios externos:** RAWG (desde el cliente), Steam Web API y OpenID, SteamGridDB, Twitch Helix, RSS de IGN y GameSpot, YouTube (youtube-nocookie), Google Sign-In, Google Fonts, Ko-fi (enlace).

### Paso 1. Línea base

| Comando | Resultado |
|---|---|
| `npm run build` | ✅ `main.js` 497,86 kB gzip; chunks diferidos 131,5 kB (TipTap + emojis), 73,8 kB, 39,6 kB, 10,2 kB (recorte), 8,7 kB; CSS 44,6 kB. 9 source maps. |
| ESLint `src` | ✅ 0 errores, 0 advertencias. |
| ESLint `functions` | ❌ 2.095 errores (1.978 auto-corregibles), 0 de lógica. |
| `test:unit` | ✅ 48/48 |
| `test:functions` | ✅ 126/126 |
| `test:rules` | ✅ 231/231 |
| `test:functions:emulator` | ✅ 19/19 |
| e2e | No ejecutadas (escriben en producción); última corrida completa 2026-10-08 en verde. |
| `npm audit` raíz | 99 (4 críticas, 78 altas, 12 moderadas, 5 bajas); ver M. |
| `npm audit` functions | Producción 20 (2 críticas, 8 altas); total 29. |

### A. Seguridad de Firestore

**Matriz por colección**

| Colección | Lee | Crea | Actualiza | Borra | Validación |
|---|---|---|---|---|---|
| users | dueño | dueño | dueño | nadie | solo `description` ≤ 500 y sin `phone`/`email`; sin `hasOnly` |
| users/private | dueño | dueño | dueño | nadie | `hasOnly` y tipos ✅ |
| publicProfiles | **todos** | dueño | dueño | nadie | `hasOnly` ✅; `username` sin tamaño ni unicidad; `avatar`/`banner`/`links`/`games` libres; `lastSeen` del servidor ✅; `createdAt` inmutable ✅ (pero del cliente al crear) |
| matchProfiles | con sesión | dueño | dueño | dueño | completa ✅ |
| posts | **todos** | `canWriteSocial`, autor propio, `createdAt` del servidor, contador 0 | dueño (sin tocar contador/autor/fecha/juego) o ±1 ligado a su interés | dueño | `comments` ≤ 300; sin `hasOnly`; `game` sin tamaño |
| game_stats | todos | ligado a crear un post propio | ±1 ligado a crear/borrar post propio | nadie | `hasOnly` ✅; id libre |
| post_comments | **todos** | `canWriteSocial`, autor propio, sin bloqueo con el autor del post | nadie | autor del comentario o del post | `text` ≤ 500; `mediaPath`/`mediaUrl`/`mediaType` libres |
| post_interested | **todos** | `canWriteSocial`, id fijo, sin bloqueo, +1 en la misma transacción | nadie | dueño (−1) o autor al borrar el post | ✅ |
| friends | integrantes | solo quien acepta la solicitud, en el mismo batch | nadie | integrantes | ✅ |
| friend_requests | emisor/receptor | `canWriteSocial`, id fijo, sin bloqueo | aceptar/rechazar; reenviar | nadie | ✅ salvo reenvío en bucle |
| notifications | destinatario | **solo `senderId` propio** | destinatario | destinatario | ninguna |
| chats | participantes | 2 participantes con quien crea, sin bloqueo | solo `lastMessage*` firmados | nadie | id libre |
| chats/messages | participantes | participante, sin bloqueo, `text` ≤ 1000 | nadie | nadie | `createdAt` y medios libres |
| group_chats | participantes de grupo activo | autor del post en el mismo batch | entrar/salir ligado al interés; `lastMessage`; desactivar | nadie | ✅ |
| group_chats/messages | participantes de grupo activo | participante | nadie | nadie | sin bloqueo; `createdAt` libre |
| gaming_news | todos | Admin SDK | Admin SDK | Admin SDK | ✅ |
| blocks | integrantes | quien bloquea | nadie | quien bloqueó | ✅ |
| reports | admin | con sesión, listas cerradas | admin (`status`, `reviewedAt`) | nadie | `note` ≤ 500; campos extra libres |
| guides | aprobadas: todos; otras: autor y admin | `hasOnly`, `pending`, tipos y tamaños | admin | nadie | completa ✅ |
| steamNonces | nadie | nadie | nadie | nadie | ✅ |

**Escenarios de abuso (prueba efímera en el emulador; B autenticado y verificado, A víctima)**

| Escenario | Resultado | Hallazgo |
|---|---|---|
| B comenta con `mediaPath: "avatars/{A}"` y borra el comentario | PERMITE | C-02 |
| B crea notificación para A (tipo inventado, 200 KB) | PERMITE | A-04 |
| B bloqueado por A crea notificación para A | PERMITE | A-04 |
| B bloqueado por A lee y escribe en el chat de la partida de A | PERMITE | M-07 |
| B crea `chats/random1` y `chats/random2` con A | PERMITE | B-22 |
| B envía mensaje con `createdAt` 2099 | PERMITE | A-03 |
| B envía adjunto falso (`mediaUrl` externa, `fileName: factura.pdf`) | PERMITE | B-23 |
| B usa el username de A | PERMITE | M-08 |
| B pone username de 100.000 caracteres, 500 links (uno `javascript:`) y 5.000 juegos | PERMITE | A-03 |
| B pone `banner` con `x), url(https://evil…` | PERMITE | B-23 |
| B crea post con `authorRegion` falsa, `game` de 50.000 caracteres y campos extra; lo edita | PERMITE | A-03 |
| B reenvía en bucle una solicitud rechazada | PERMITE | M-12 |
| Sin sesión lista `publicProfiles`, `post_interested`, `post_comments`, `game_stats` | PERMITE | M-11 |
| Sin sesión lee `users/A` | RECHAZA ✅ | |
| B consulta notificaciones de A | RECHAZA ✅ | |
| B escribe `users/B` con `isAdmin: true` | PERMITE, sin efecto (el admin es un claim) ✅ | |
| B crea reporte con 100 KB de campos libres | PERMITE | A-03 |
| B crea `game_stats/cualquier-id` con `game: "Valorant"` | PERMITE | B-25 |
| B crea una guía ya `approved` | RECHAZA ✅ | |

**Bien protegido** (lectura y 231 pruebas existentes): nadie se agrega a la lista de amigos de otro; nadie cambia participantes de un chat 1:1; los contadores solo se mueven ±1 ligados a la propia acción; nadie aprueba sus guías; nadie lee chats, mensajes ni notificaciones ajenos; no se puede escalar a admin desde el cliente.

**Consistencia reglas ↔ cliente:** `canWriteSocial` se aplica en todas las escrituras sociales y la interfaz lo refleja (`useRequireVerified`, diálogo de verificación) [VERIFICADO]. Los bloqueos en listas (feed, búsqueda, comentarios, notificaciones) son de cliente; las reglas los imponen en comentarios, intereses, amistad, solicitudes y chat 1:1. No se encontraron consultas que las reglas rechacen (las e2e corren contra las reglas de producción).

**Pruebas de reglas automatizadas:** sí, 231 en 13 suites, en GitHub Actions. Faltan casos para los huecos de esta auditoría (tamaños, notificaciones, `mediaPath`, bloqueo en grupo).

### B. Storage

| Ruta | Lee | Escribe | Tipo y tamaño |
|---|---|---|---|
| avatars/{uid}, banners/{uid} | con sesión | dueño | `image/.*` < 5 MB (incluye SVG) |
| comments/{uid}/* | con sesión | dueño + `canWriteSocial` | imagen/video < 20 MB |
| chats/{chatId}/{uid}/* | participantes (`firestore.get`) | dueño participante | imagen, video, PDF, ZIP, Word < 20 MB; sin update/delete |
| group_chats/{postId}/{uid}/* | participantes de grupo activo | dueño participante | igual |
| guides/{authorId}/* | con sesión | autor + `canWriteSocial` | PNG/JPEG/WebP < 5 MB |

- El tipo se valida por el `contentType` declarado, no por el contenido. Los nombres de archivo los genera el cliente.
- **URLs con token**: adjuntos de chats 1:1 y de partida, comentarios y avatares se guardan como `mediaUrl` de `getDownloadURL`. No pasan por `storage.rules` ni caducan; Firestore limita quién lee el mensaje que contiene la URL, pero quien ya la vio la conserva.
- **Huérfanos**: grupos de partidas borradas (desactivados, nunca borrados), imágenes de guías no publicadas; `deleteAccount` sí borra las carpetas del usuario. El borrado de comentarios depende de `cleanupCommentMedia` (C-02).

### C. Cloud Functions

| Función | Auth | Validación | Errores | Límite | Caché |
|---|---|---|---|---|---|
| syncGamingNews (HTTP) | **ninguna** | solo GET | devuelve `error.message` | no | no |
| cleanupCommentMedia | trigger | **confía en `mediaPath`** | — | — | — |
| getSteamStats | sí | `steamId`/`appid` sin formato | genérico | **no** | no |
| getSteamPresence | sí | regex, ≤ 100 | genérico | no | vanity en memoria |
| getGameLogo/Portada | sí | mínima | genérico | **no** | no |
| getTwitchPresence | sí | regex, ≤ 100 | genérico | no | token |
| logGameSearch | sí | tipo y largo | genérico | **no** | — |
| fetchLinkPreview | sí | completa | vacía | no | no |
| loginWithSteam | es el login | completa | genérico | no | — |
| getCommunityStats | sí | ✅ | genérico | no | 60 s |
| deleteAccount | sí + login reciente (servidor) | ✅ | ✅ | — | — |
| getJoinInfo | sí + verificado | ✅ | `{available:false}` | 30/min | 20 s |

- **SSRF** (`fetchLinkPreview`, `functions/guides/guides.service.js`): bloquea IPv4/IPv6 privadas, link-local (metadatos 169.254.169.254), CGNAT, mapeadas, NAT64, 6to4 y Teredo; valida en la conexión (`lookup` propio, sin hueco de DNS rebinding); revalida cada redirección (máx. 3); solo http/https sin credenciales ni puertos; 1 MB y 5 s totales. Muy bien resuelto [VERIFICADO + 51 pruebas].
- **loginWithSteam**: valida forma, `ns`, `mode`, `op_endpoint`, `claimed_id == identity`, campos firmados obligatorios, `return_to` contra orígenes permitidos, antigüedad ≤ 5 min, verificación con Steam (`check_authentication`) y nonce de un solo uso (`create()` en `steamNonces`). Solo objeción: localhost permitido (B-24).
- **v1/v2**: todo v2. Región por defecto (us-central1) [VERIFICADO]; Firestore puede estar en otra región [NO VERIFICABLE EN EL CÓDIGO].
- **Secretos**: `functions/.env` (4 nombres) y `.env.local` (1). Nunca versionados (`git log --all`) ✅.
- **Logs con datos personales**: `fetchLinkPreview` registra la URL completa pedida; el resto registra códigos o conteos, salvo el objeto de axios (M-10).
- **Idempotencia**: `syncGamingNews` borra y luego inserta en dos commits: si falla en medio, deja el feed vacío; dos ejecuciones simultáneas compiten. `cleanupCommentMedia` sin reintentos configurados.
- **CORS**: las callables lo manejan solas; `syncGamingNews` no lo necesita (GET directo), justamente lo que la hace invocable por cualquiera.

### D. Seguridad del cliente

- **XSS**: dos `dangerouslySetInnerHTML` (`GuideDetail.js:112`, `AdminGuideItem.js:57`), ambos con `sanitizeGuideHtml` (`src/utils/guideHtml.js`): instancia propia de DOMPurify, etiquetas y atributos en lista cerrada, sin `data-*`, `href` solo http(s) con `target`/`rel` forzados, imágenes solo https. Se sanitiza al guardar y al mostrar ✅. La prueba e2e de guías intenta `onclick`/`style` y no pasan ✅.
- **URLs de usuario en `href`**: redes sociales (`SocialLinks.js:111`), medios de mensajes y comentarios. La validación `https://` de las redes es solo de cliente (`SocialLinks.js:19`); React 19 bloquea `javascript:` en `href`, y la navegación a `data:` está bloqueada por los navegadores [INFERIDO]. Riesgo residual: enlaces de phishing (B-23).
- **YouTube**: id validado con regex en cliente y reglas (`firestore.rules:532-533`), iframe de `youtube-nocookie.com` con `referrerPolicy` y `allow` acotado; sin `sandbox` (aceptable para YouTube).
- **Popup de Steam**: `event.origin` comprobado y `postMessage` dirigido al propio origen; `BroadcastChannel` de respaldo es del mismo origen ✅ (`event.source` no se comprueba; innecesario con el origen fijado).
- **Redirecciones**: tras el login, `location.state.from` (interna); notificaciones navegan dentro de la app; sin redirecciones abiertas ✅.
- **`target="_blank"`**: todos con `rel` ✅ (el de RAWG lleva solo `noopener`, a propósito).
- **Secretos `REACT_APP_*`**: Firebase (públicos por diseño), RAWG (M-16), Ko-fi (pública). `.env` y `functions/.env*` en `.gitignore`, nunca versionados; solo `.env.example` (sin valores) ✅.
- **Almacenamiento local**: idioma (`localStorage`), guía de bienvenida y avisos (`sessionStorage`); nada sensible; se limpia al eliminar cuenta ✅.
- **Archivos subidos**: validación de tipo/tamaño en cliente (recorte, adjuntos, guías) y en `storage.rules`.
- **Cabeceras y CSP**: no existen (no hay `hosting`) → A-05.
- **Source maps**: B-20.

### E. Autenticación y cuentas

- **Correo/contraseña**: verificación de correo con reenvío y enfriamiento; recuperación con protección contra enumeración (misma respuesta exista o no la cuenta); cambio de correo con `verifyBeforeUpdateEmail` ✅.
- **Google**: crea el perfil solo la primera vez; si falla, se reintenta en el siguiente login ✅.
- **Steam**: ver C; cuentas sin correo pueden escribir por la excepción `sign_in_provider == 'custom'` (coherente en reglas y cliente).
- **Registro a medias**: M-13.
- **Eliminar cuenta** (`functions/account/account.service.js`): exige reautenticación de 5 min **en el servidor**; borra partidas propias (con comentarios, intereses, grupo y su carpeta, notificaciones, −1 en `game_stats`), comentarios, intereses (−1 y salida del grupo), mensajes de partida (`collectionGroup`), chats 1:1 completos con sus archivos, amistades, solicitudes, bloqueos, notificaciones enviadas y recibidas, guías, `matchProfiles`, `publicProfiles`, `users` (con `private`) y la cuenta de Auth. Comparado con la lista actual de colecciones y rutas: **no queda nada personal huérfano** salvo lo conservado a propósito (`reports`, `game_stats`) y los `steamNonces` (hash, no personales) [VERIFICADO]. Riesgo: usa `mediaPath` de comentarios (C-02).
- **Rutas protegidas**: `RequireAuth`/`RequireAdmin` son de cliente, pero las reglas protegen los datos (reportes y guías pendientes exigen el claim `admin`) ✅.
- **Cierre de sesión**: limpia la guía de bienvenida, el idioma y el estado; al eliminar cuenta limpia `localStorage`/`sessionStorage` ✅.

### F. Modelo de datos y consistencia

- **Índices**: 16 compuestos + 1 `fieldOverride` (`messages.senderId`, para `deleteAccount`). Cubren todas las consultas con `where` + `orderBy`; las de solo igualdades usan índices simples [VERIFICADO].
- **Atomicidad**: aceptar amistad, "Quiero jugar" (interés + contador + entrada al grupo), enviar mensaje (mensaje + notificación + último mensaje), crear y borrar post (con `game_stats` y grupo) van en batch o transacción, y las reglas lo exigen ✅.
- **Fechas**: `createdAt` del servidor exigido en posts, guías y `matchProfiles`; del cliente en mensajes y `users`/`publicProfiles` (A-03).
- **Denormalización**: notificaciones y tarjetas leen nombre y avatar en vivo (no copian) ✅; `authorRegion` de los posts es una copia falsificable (A-03).
- **Partidas programadas**: no son publicaciones ocultas; son partidas con hora futura que se muestran en "Próximamente" (`postService.js:235`). Sin problema.
- **Huérfanos y retención**: B-31. `steamNonces` sin TTL hasta Blaze.

### G. Rendimiento y costos

**Listeners en tiempo real** (28 en `src/services`): los hooks revisados (`useAuth`, `useUserProfile`, `useUserProfiles`, `useNotifications`, `useLiveMessages`) devuelven la cancelación en la limpieza del efecto [VERIFICADO en esos]; en el resto se asume el mismo patrón [INFERIDO]. Sin límite: comentarios de un post, intereses de un post, chats y grupos del usuario, amigos, bloqueos, guías propias y pendientes, reportes pendientes; razonable por tamaño esperado, salvo comentarios en partidas muy activas. Con límite: feed (5 categorías × 30), tendencias, noticias (20), notificaciones (10 + 100 no leídas), mensajes (50, `limitToLast`), candidatos compatibles (50).

**Perfiles por tarjeta**: `useUserProfile` abre un listener por componente; el SDK comparte la suscripción si el documento es el mismo [INFERIDO], pero **cada `lastSeen` (cada 2 min por usuario activo) reenvía el perfil a todos sus observadores**. Es el principal multiplicador de lecturas (ver sección 7).

**Escrituras periódicas**: `lastSeen` cada 2 min solo con la pestaña visible, en 2 documentos (`users` + `publicProfiles`) ✅ (≈ 60 escrituras por hora activa).

**Sondeos**: presencia Steam/Twitch 90 s y comunidad 60 s sin pausa en segundo plano (B-27); `useSteamJoinInfo` 45/120 s con pausa ✅.

**Re-renders**: contextos separados para usuario y datos (`AuthContext.js:5-7`, para no re-renderizar todo con cada `lastSeen`) ✅; claves estables en `useUserProfiles` ✅.

**Bundle**: `main.js` 498 kB gzip (grande para una SPA; incluye PrimeReact completo y Firebase). Diferidos ✅: editor TipTap, selector de emojis, mapa, recorte. Paneles admin no diferidos. Fuentes con `display=swap` ✅. Video de 18,9 MB (M-17). Imágenes: varias con `loading="lazy"`, no todas.

### H. Arquitectura y calidad

- **Componente → hook → servicio**: ningún import de `firebase/*` en `components/` ni `hooks/` [VERIFICADO].
- **Sin `console.log`, `alert` ni `debugger`** en `src` ni en `functions` (fuera de `scripts/`) ✅.
- **TODO**: `src/firebase/config.js:8` (plantilla de Firebase), `src/services/auth/authService.js:78` (consentimiento legal en Google/Steam), `src/services/posts/interestService.js:79` (recordatorio de partida). No hay FIXME/HACK.
- **Tamaño**: el archivo más grande tiene 344 líneas (`PostDetail.js`); sin componentes desmesurados.
- **Código muerto**: casi nulo; `PENDING_MARK` y `LEGAL_FALLBACK_LANGUAGE` (`src/legal/legalConfig.js`) sin uso; dependencias sin uso (B-29).
- **Errores tragados**: solo 2, intencionales y comentados (`accountService.js:42`, `guideService.js:84`).
- **ErrorBoundary**: no existe (M-14). **404**: sí (`NotFound`).

### I. Corrección funcional

- **Bloqueos**: la interfaz excluye a los bloqueados en el feed, Explorar, el detalle de la partida, comentarios, interesados, guías, búsqueda de jugadores, compatibilidad, notificaciones y mensajes del chat de partida (`excludeBlockedAuthors`, `useBlockedIds`). El chat 1:1 con un bloqueado sigue en la lista, pero la ventana lo indica y las reglas impiden escribir. Las reglas no cubren: notificaciones (A-04) y chat de partida (M-07).
- **Chat de partida**: entrar y salir ligados al interés, el autor no puede salir, el grupo se desactiva al borrar el post ✅; el bloqueo no expulsa (M-07).
- **Notificaciones**: 6 tipos con texto fijo y remitente en vivo (sin suplantación de texto) ✅; spam posible (A-04).
- **Solicitudes de amistad**: ids determinísticos evitan duplicados; aceptar exige la solicitud pendiente ✅; reenvío en bucle (M-12).
- **Feed y Explorar**: paginación por cursor; filtros de bloqueados en cliente.
- **Compatibilidad** (`src/utils/computeCompatibility.js`): pesos que suman 100, neutral 0,5 sin datos, sin división por cero, candidatos por `gameIds` con `array-contains-any` y límite 50 ✅. **Sin pruebas unitarias**.
- **Guías**: aprobación solo admin, sanitización doble ✅. **Stickers: No implementado.**
- **Unirme en Steam**: solo `getJoinInfo` lee `lobbysteamid`; ninguna función devuelve `gameserverip`; comprueba consentimiento, bloqueos y amistad o interés; respuesta negativa uniforme ✅ (33 + 19 pruebas).
- **Mapa de la comunidad**: países con menos de 5 jugadores enmascarados, caché de 60 s ✅.
- **Recorte de imágenes**: tipos en lista cerrada sin SVG, 10 MB, 40 MP, salida WebP/JPEG sin EXIF ✅. **Botón de apoyo**: URL solo `https://ko-fi.com` ✅.
- **Legales y créditos**: contenido pendiente marcado con `[PENDIENTE]` y aviso de borrador ✅.

### J. Accesibilidad

**Contraste (WCAG 2.x, calculado; tarjeta = rgba(30,28,53,0,6) sobre #0F0F23 = rgb(24,23,46))**

| Combinación | Contraste | AA normal (4,5) | AA grande (3) |
|---|---|---|---|
| #E2E8F0 sobre #0F0F23 | 15,31:1 | ✓ | ✓ |
| #E2E8F0 sobre tarjeta | 14,19:1 | ✓ | ✓ |
| #94A3B8 sobre #0F0F23 | 7,36:1 | ✓ | ✓ |
| #94A3B8 sobre tarjeta | 6,82:1 | ✓ | ✓ |
| #7C3AED como texto sobre fondo | **3,31:1** | ✗ | ✓ |
| #7C3AED como texto sobre tarjeta | **3,07:1** | ✗ | ✓ |
| #F43F5E como texto sobre fondo | 5,14:1 | ✓ | ✓ |
| #F43F5E como texto sobre tarjeta | 4,76:1 | ✓ | ✓ |
| Blanco sobre #7C3AED | 5,70:1 | ✓ | ✓ |
| Blanco sobre #F43F5E | **3,67:1** | ✗ | ✓ |
| `--gm-subtle` #7C7A94 sobre fondo | 4,55:1 | ✓ | ✓ |
| `--gm-subtle` sobre tarjeta | **4,22:1** | ✗ | ✓ |
| `--gm-hint` #5E5C78 sobre fondo | **2,95:1** | ✗ | ✗ |
| `--gm-label` #A78BFA sobre tarjeta | 6,43:1 | ✓ | ✓ |

**Lo demás**: sin `<img>` sin `alt`; sin botones solo-icono sin `aria-label` [VERIFICADO por heurística]; 68 reglas `:focus-visible`; los 3 `outline: none` lo sustituyen por un anillo visible; `prefers-reduced-motion` en 21 de 40 hojas (faltan `FindPlayers.css`, `SocialLinks.css`, `buttons.css`, `confirm.css`, `forms.css`); `lang` del `<html>` se actualiza con el idioma (`i18n.js`), aunque el HTML inicial dice `lang="en"` (B-30); diálogos de PrimeReact con Escape y foco inicial [INFERIDO]; 48 tamaños < 24 px en CSS que conviene revisar a mano como objetivos táctiles.

### K. Internacionalización

- **Paridad**: 981 claves idénticas en es/en/pt/fr, 13 plurales (`_one`/`_other`) en cada idioma ✅.
- **Claves sin usar**: el script de revisión no encontró sobrantes relevantes; los 2 "faltantes" que reporta son falsos positivos conocidos (`friends:presence.*` armadas dinámicamente).
- **Textos fijos**: B-28.
- **Fechas y números**: `Intl` vía `formatDates` y `getIntlLocale` ✅; `toDateString()` en `MessageList.js:43` solo agrupa por día (no se muestra).
- **Errores de Firebase**: 12 códigos traducidos en `auth.json` ✅.
- **Textos concatenados**: "Leer en {fuente}" sin `t()` (B-28).

### L. Privacidad y cumplimiento (hechos, sin conclusiones legales)

- **No existe `docs/inventario-datos.md`.**
- **Visible sin sesión**: perfiles públicos completos de todos (username, avatar, portada, región, descripción, juegos, redes, `lastSeen`, `createdAt`), posts, comentarios (con su usuario), quién se interesó en cada partida, tendencias, noticias, guías aprobadas (con autor) (M-11).
- **Datos que existen hoy**: perfil público y privado (idioma, preferencias, consentimiento, `allowSteamJoin`), preferencias de compatibilidad (horario, plataformas, idiomas, valores, micrófono, nivel), amistades, solicitudes, bloqueos, reportes (con nota libre), mensajes 1:1 y de partida con adjuntos, comentarios con medios, intereses, guías, presencia (`lastSeen` cada 2 min), SteamID (enlace de Steam), usuario de Twitch.
- **Terceros que reciben datos**: Steam (SteamID para estadísticas, presencia y salas), Twitch (usuario), SteamGridDB (nombre del juego), RAWG (búsquedas del usuario, directo desde su navegador, con su IP), YouTube (embeds sin cookies), Google Fonts (IP del visitante), sitios de las guías externas (los visita la función, no el usuario), Ko-fi (solo enlace saliente).
- **Eliminar cuenta**: cubre todo lo personal salvo `reports` (conservados a propósito, incluyen `reporterId`/`targetId`).
- **Logs**: URL pedida en `fetchLinkPreview`; posibles claves en errores de axios (M-10); el resto sin datos personales.
- **Edad mínima**: no se pide (I-33). **Textos legales**: pendientes (`[PENDIENTE]`), con consentimiento preparado detrás de `REQUIRE_LEGAL_CONSENT = false`.

### M. Dependencias, pruebas y build

- **`npm audit` raíz** (99): lo que llega al navegador según el árbol de dependencias de producción: `react-router`/`react-router-dom` 7.13.2 (alta; las vulnerabilidades son del modo servidor/framework, **no alcanzables** en una SPA con `BrowserRouter` [INFERIDO]), `axios` (declarada pero sin uso, B-29), y `protobufjs`, `@grpc/grpc-js`, `websocket-driver` (vía `firebase`, pero de su parte para Node; el paquete del navegador usa WebChannel [INFERIDO no incluidas en el bundle]). El resto (2 críticas, 73 altas) son herramientas de build/pruebas de CRA que no llegan al navegador.
- **`npm audit` functions** (producción 20): M-15.
- **`npm outdated`** (raíz): `firebase` 12.11 → 12.19 (13.0 mayor), `react-router-dom` 7.13.2 → 7.18.4, `primereact` 10.9.7 → 10.9.9 (11 mayor), `react` 19.2.4 → 19.3, `axios`, `framer-motion`, `emoji-picker-react`, `web-vitals` 2 → 6. (functions): `firebase-admin` 13.8 → 13.10 (14 mayor), `firebase-functions` 7.2.5 → 7.4, `axios` 1.15 → 1.20, `eslint` 8 → 10.
- **engines**: `functions` fija Node 24; la raíz no fija versión.
- **Lockfiles**: presentes en raíz y `functions` ✅.
- **Licencias**: solo `dompurify` (MPL-2.0 OR Apache-2.0, elegible Apache) ✅.
- **CRA deprecado**: I-32.
- **Pruebas existentes** (431 automáticas + e2e): reglas 231, funciones 126 + 19 de emulador, unitarias 48, e2e con Playwright contra producción. **CI**: `.github/workflows/rules.yml` corre reglas, funciones, emulador y unitarias (no corre build ni lint).
- **Utilidades sin pruebas**: `computeCompatibility`, `formatDates`, `getNotificationMeta`/`navigateNotification`, `excludeBlockedAuthors`, `filterPosts`, `searchGames`, `guideHtml` (sanitización, solo cubierta por e2e). Con pruebas: `aggregateActiveUsers` y demás de comunidad (26), `buildJoinUrl` (33), `getSupportUrl` (13), `cropImage` (15).
- **Plan mínimo de pruebas propuesto** (sin implementar): (1) reglas para cada hueco de esta auditoría (tamaños, notificaciones, `mediaPath`, bloqueo en grupo, unicidad de nombre); (2) unitarias de `computeCompatibility`, `formatDates`, `excludeBlockedAuthors`/`filterPosts`, `sanitizeGuideHtml` (con cargas XSS conocidas); (3) build y lint en el CI; (4) una prueba de humo de despliegue (rutas recargadas devuelven la app).

### N. Preparación para producción

- `firebase.json`: sin `hosting` (A-05); `predeploy` de functions falla (A-06).
- `firestore.indexes.json`: completo para las consultas actuales ✅; falta el TTL de `steamNonces` (requiere Blaze).
- `.env.example` ✅ (sin valores). Separación de entornos: un solo proyecto (`.firebaserc` → `gamerteam-4ed20`); el entorno local usa la base de **producción** con el emulador solo para Functions (`config.js:32-34`, guardado por `NODE_ENV === "development"` ✅).
- App Check y monitoreo de errores: no (M-18). Copias de seguridad: no configuradas en el código [NO VERIFICABLE EN EL CÓDIGO].
- SEO: título "Gamer Match", descripción en español ✅; sin Open Graph; `robots.txt` permite todo; `manifest.json` de plantilla (B-30); favicon propio ✅.
- Páginas legales y créditos accesibles sin sesión ✅ (contenido legal pendiente).

---

## 4. Fortalezas (no deshacer)

1. **Reglas de amistad, chats 1:1, contadores y guías** muy bien pensadas: la amistad solo nace al aceptar; los participantes de un chat no cambian; `interestedCount` y `postCount` solo se mueven ±1 ligados a la acción del propio usuario en la misma transacción.
2. **`users` privado + `publicProfiles` público**, con `hasOnly` en lo público y `lastSeen` forzado a la hora del servidor.
3. **SSRF de `fetchLinkPreview`**: protección de nivel profesional (IPs internas en IPv4/IPv6, DNS en la conexión, redirecciones revalidadas, límites de tamaño y tiempo) con 51 pruebas.
4. **Login con Steam**: verificación completa de OpenID con nonce de un solo uso y orígenes permitidos.
5. **`deleteAccount`**: reautenticación exigida en el servidor, pasos idempotentes, cobertura completa de colecciones y archivos, logs sin datos personales.
6. **`getJoinInfo`**: respuesta negativa uniforme, límite por usuario, caché, y prueba estática de que ninguna otra función expone salas o IPs.
7. **Sanitización de guías** con DOMPurify en lista cerrada, al guardar y al mostrar.
8. **Verificación de correo** aplicada de forma coherente en reglas e interfaz.
9. **Arquitectura limpia**: componente → hook → servicio sin excepciones; sin `console.log`; i18n completo en 4 idiomas con paridad exacta.
10. **Costos ya cuidados**: presencia cada 2 min y solo con la pestaña visible, contextos separados para no re-renderizar con cada `lastSeen`, carga diferida de piezas pesadas, notificaciones con remitente en vivo (sin denormalizar).
11. **431 pruebas automáticas** y CI.

---

## 5. Bloqueantes para la beta (Críticos y Altos, en orden)

1. **C-02**: validar `mediaPath` en reglas y en `cleanupCommentMedia`/`deleteAccount` (antes de habilitar Storage y desplegar Functions).
2. **C-01**: quitar el endpoint público de `syncGamingNews` y programarla.
3. **A-04**: validar notificaciones en las reglas (destinatario, tipo, claves, bloqueo).
4. **A-03**: tamaños y `hasOnly` en las demás colecciones; `createdAt` del servidor.
5. **A-06**: dejar el lint de `functions` en verde.
6. **A-05**: sección `hosting` con rewrite SPA, cabeceras y caché.

(Más los pasos de consola de la sección 9: Blaze, presupuesto, `maxInstances`.)

---

## 6. Mejoras rápidas (esfuerzo S, impacto alto)

- C-01, C-02, A-04, A-05, A-06 (todas S).
- M-10: registrar solo el código del error de axios.
- M-12: espera mínima para reenviar solicitudes.
- M-13: recrear el perfil si falta al iniciar sesión.
- M-14: ErrorBoundary global.
- M-15: `npm audit fix` en `functions`.
- M-17: comprimir el video del login.
- M-19: ajustar tres tokens de color.
- B-20: desactivar source maps.

---

## 7. Estimación de costos (**ESTIMACIÓN**, no medición)

**Supuestos:** 100 usuarios activos al día, 2 sesiones diarias de 20 min con la pestaña visible, ~10 usuarios conectados a la vez en hora pico; cada sesión abre el feed, un chat y un perfil. Precios de referencia de Firebase (Blaze) con su capa gratuita diaria: Firestore 50.000 lecturas, 20.000 escrituras y 20.000 borrados al día; Functions 2 millones de invocaciones al mes; Hosting 10 GB de transferencia al mes.

**Lecturas por sesión (aprox.)**

| Origen | Cálculo | Lecturas |
|---|---|---|
| Feed inicial | 5 categorías × 30 posts + tendencias ~20 + lista de juegos hasta 100 + ~40 perfiles de autores | ~310 |
| Perfiles que cambian por `lastSeen` | ~10 autores en pantalla conectados × 10 actualizaciones en 20 min | ~100 |
| Notificaciones | 10 + hasta 100 no leídas | ~60 (promedio) |
| Abrir un chat | 50 mensajes + lista de chats y grupos ~15 | ~65 |
| Ver un perfil y compatibles | 1 + 50 candidatos + amigos ~20 | ~70 |
| Propios (usuario, bloqueos, amigos) | | ~25 |
| **Total** | | **~630** |

- **Lecturas/día**: 630 × 2 × 100 ≈ **126.000** → superan las 50.000 gratuitas (por eso Spark se queda corto). Exceso ~76.000/día ≈ 2,3 M/mes → **≈ 1–2 USD/mes**.
- **Escrituras/día**: presencia 10 por sesión × 2 documentos × 2 sesiones × 100 = 4.000; más mensajes, notificaciones e intereses ≈ 2.000 → **~6.000/día**, dentro de lo gratuito.
- **Functions**: presencia Steam/Twitch (cada 90 s en pantallas con jugadores), comunidad (60 s), Unirme en Steam (45 s) ≈ 40 invocaciones por sesión → 8.000/día ≈ 240.000/mes, **dentro de los 2 M gratuitos**. Llamadas a Steam ≈ 10.000/día, muy por debajo del límite de 100.000 de la clave.
- **Hosting**: el video del login (18,9 MB) por visita sin caché: 100 visitas/día ≈ 1,9 GB/día ≈ 57 GB/mes → **≈ 7 USD/mes** solo por el video (con caché del navegador, menos). El bundle (~1 MB por visita nueva) es despreciable en comparación.
- **Total estimado**: **≈ 5–10 USD/mes**, dominado por el video; sin él, **≈ 1–2 USD/mes**.
- **Riesgo fuera de la estimación**: abuso (C-01, A-03, A-04, M-09) puede multiplicar estas cifras; de ahí las alertas de presupuesto y `maxInstances`.

---

## 8. Plan de remediación sugerido (sin implementar)

**Antes de la beta**
1. C-02 y C-01 (Functions/Storage).
2. A-04 y A-03 (reglas, con sus pruebas en `tests/rules`).
3. A-06 y A-05 (desplegabilidad).
4. M-10, M-15 (logs y dependencias de Functions), `maxInstances` (M-09).
5. M-13, M-14 (cuentas sin perfil y pantalla en blanco).
6. Consola: Blaze, alertas de presupuesto, Storage, App Check en modo monitor.

**Durante la beta**
1. M-07, M-08, M-12 (bloqueo en grupos, nombres únicos, reenvío de solicitudes).
2. M-11 (lectura sin sesión) según lo que se decida mostrar sin cuenta.
3. M-17, M-19, B-27, B-28, B-30 (rendimiento, contraste, i18n, metadatos).
4. M-16, M-18 (RAWG por función, App Check forzado, monitoreo).
5. Pruebas unitarias del plan mínimo y build/lint en el CI.

**Después**
1. B-21, B-31 (limpieza programada de Storage y datos).
2. B-20, B-22 … B-26, B-29.
3. I-32 (migrar de CRA a Vite).

---

## 9. Comprobaciones manuales pendientes (no verificables en el código)

- Activar **Blaze**, crear **alertas de presupuesto** y revisar la **región** de Firestore y Functions (idealmente la misma).
- Habilitar **Storage** y desplegar `storage.rules` (pedirá dar acceso a Firestore al agente de reglas).
- **Dominios autorizados** de Authentication: agregar el dominio de producción.
- Confirmar que la **protección contra enumeración de correos** sigue activa.
- **Plantillas de correo** (verificación y recuperación) y remitente; probar que no caen en spam.
- Rol **Service Account Token Creator** para la cuenta de servicio de Functions (login con Steam).
- **TTL** de `steamNonces` (requiere Blaze).
- **App Check** y su proveedor (reCAPTCHA Enterprise).
- **Retención de logs** de Cloud Logging y quién tiene acceso al proyecto (las claves de M-10).
- **Copias de seguridad** programadas de Firestore (Point-in-time recovery o exportaciones).
- Cuota y uso de la **clave de RAWG** en su panel.
- Verificar en producción las pruebas que nunca se pudieron hacer: subida y reemplazo de avatar/portada, eliminar cuenta de Steam, "Unirme en Steam" con una sala real, Twitch con un canal en vivo.

---

## 10. Preguntas abiertas

1. ¿El feed y los perfiles **deben** verse sin sesión? De eso depende cuánto se puede cerrar M-11.
2. ¿Escribir por chat a quien no es amigo es intencional a largo plazo? (Hoy lo permiten la interfaz y las reglas.)
3. ¿Cada cuánto deben sincronizarse las noticias? Hoy nada llama a `syncGamingNews` (C-01).
4. ¿Se quiere conservar `reports` tras eliminar una cuenta, y por cuánto tiempo?
5. ¿Qué edad mínima tendrá la app? (Afecta registro y textos legales.)
6. ¿Habrá un proyecto de Firebase separado para desarrollo/pruebas? Hoy local y e2e usan la base de producción.
7. ¿Qué servicio de monitoreo de errores se prefiere (o ninguno durante la beta)?
8. ¿Se acepta la clave de RAWG en el cliente durante la beta (M-16)?
