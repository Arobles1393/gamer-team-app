# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Jugadores de habla hispana, sobre todo de México y Latinoamérica, de 18 años o más, que quieren jugar en línea y no tienen con quién o quieren ampliar su grupo ("buscar squad"). Buscan gente para jugar ya o a una hora programada, en PC, consolas o móvil.

## Product Purpose

GamerMatch conecta jugadores para formar partidas: alguien publica una partida (juego, plataforma, plazas, micrófono, nivel, idioma, hora) y otros se unen con "Quiero jugar", que los mete en el chat de grupo de esa partida. Éxito: que un jugador encuentre con quién jugar en poco tiempo y vuelva a hacerlo.

## Positioning

Frente a buscar grupo en Discord o en el chat del propio juego, GamerMatch reúne cuatro cosas en un solo sitio, en español:

- **Partidas publicadas con todo claro:** cada partida dice juego, plataforma, plazas, micrófono, nivel, idioma y hora, y "Quiero jugar" lleva directo a su chat de grupo.
- **Compatibilidad:** "Compatibles contigo" sugiere jugadores según horario, plataformas, idiomas y valores de juego (sin tóxicos, sin abandonar, etc.). Las preferencias son privadas.
- **Integración con Steam:** entrar con Steam, ver qué juega alguien y, si lo permite, unirse a su sala de Steam.
- **Comunidad en español:** guías escritas por jugadores, noticias de videojuegos, amigos y chats.

## Operating Context

- Interfaz en español por defecto, también en inglés, portugués y francés.
- Se usa en escritorio y móvil (barra lateral en escritorio, barra inferior en móvil).
- Sin sesión se pueden ver partidas, guías publicadas y noticias; buscar jugadores, comentar, unirse y chatear piden cuenta.
- Cuenta con correo, Google o Steam; confirmación de 18 años o más en el registro y en el primer inicio.

## Capabilities and Constraints

- Firebase (Firestore, Authentication, Cloud Functions, Storage). Plan Spark hoy: las Cloud Functions solo corren en el emulador local y Storage no está activado (no se pueden subir imágenes). El despliegue a Blaze está pendiente.
- Imágenes de juegos de RAWG y SteamGridDB; noticias de IGN y GameSpot; estado en directo de Twitch.
- React (Create React App) con PrimeReact; sin librerías de animación ni 3D instaladas a 2026-10-13.
- Terminología: "partida" (publicación para jugar), "Quiero jugar" (unirse), "squad", "nickname" (nombre público; "pseudo" en francés), "Compatibles contigo".
- Buscar jugadores abre en "Buscar por nickname" por decisión del usuario.

## Brand Commitments

- Nombre: GamerMatch (logo "GM").
- Voz: cercana y gamer, en segunda persona ("Encuentra tu squad. Cuando quieras jugar.", "Tu próxima partida empieza aquí.", "Quiero jugar", "¡Dentro!").
- Correo de contacto: el de `src/config/contact.js`.

## Evidence on Hand

- Etapa: beta cerrada próxima. La app no está publicada; solo hay cuentas de prueba (qa_*).
- No hay usuarios reales, cifras, testimonios, reseñas ni prensa: ninguna página puede inventarlos.
- Vídeo y póster del login en `public/video/`; logo en `public/logo.png`.
- Textos legales provisionales en `src/legal/content/es.js`.

## Product Principles

1. Encontrar con quién jugar es la tarea central: todo lo demás (guías, noticias) la acompaña, no la sustituye.
2. Decidir rápido: cada partida debe dar la información necesaria para unirse o pasar sin abrirla.
3. Privacidad por defecto: preferencias privadas, nada de nombre real ni correo públicos, datos de terceros solo bajo acción del usuario.
4. Honestidad: nada de cifras, testimonios ni promesas que el producto no cumpla hoy.

## Accessibility & Inclusion

Mayores de 18 años. Respetar "reducir movimiento" (la app ya lo hace en vídeos y animaciones), contraste mínimo WCAG AA y uso con teclado y lector de pantalla.
