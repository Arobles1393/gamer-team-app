---
name: GamerMatch
description: Encuentra tu squad. Cuando quieras jugar.
colors:
  void-navy: "#0F0F23"
  smoked-surface: "rgba(30, 28, 53, 0.6)"
  smoked-surface-strong: "rgba(30, 28, 53, 0.9)"
  rail-glass: "rgba(20, 18, 40, 0.65)"
  popover-ink: "#16152E"
  neon-violet: "#7C3AED"
  neon-violet-soft: "rgba(124, 58, 237, 0.22)"
  signal-pink: "#F43F5E"
  signal-pink-deep: "#E11D48"
  signal-pink-soft: "rgba(244, 63, 94, 0.14)"
  signal-pink-text: "#FDA4AF"
  lavender-label: "#A78BFA"
  frost-text: "#E2E8F0"
  slate-muted: "#94A3B8"
  dusk-subtle: "#8A88A2"
  dusk-hint: "#82809A"
  violet-border: "rgba(124, 58, 237, 0.35)"
  violet-border-soft: "rgba(124, 58, 237, 0.2)"
typography:
  display:
    fontFamily: "Russo One, sans-serif"
    fontSize: "clamp(34px, 4.2vw, 58px)"
    fontWeight: 400
    lineHeight: 1.04
    letterSpacing: "0.01em"
  headline:
    fontFamily: "Russo One, sans-serif"
    fontSize: "30px"
    fontWeight: 400
    lineHeight: 1.1
    letterSpacing: "0.5px"
  title:
    fontFamily: "Russo One, sans-serif"
    fontSize: "22px"
    fontWeight: 400
    lineHeight: 1.2
  card-title:
    fontFamily: "Russo One, sans-serif"
    fontSize: "18px"
    fontWeight: 400
    lineHeight: 1.25
    letterSpacing: "0.3px"
  body:
    fontFamily: "Chakra Petch, sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.55
  body-sm:
    fontFamily: "Chakra Petch, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.45
  label:
    fontFamily: "Chakra Petch, sans-serif"
    fontSize: "11px"
    fontWeight: 700
    letterSpacing: "1px"
rounded:
  control: "10px"
  tile: "12px"
  card: "16px"
  pill: "999px"
spacing:
  chip-gap: "6px"
  stack-sm: "12px"
  card-padding: "18px"
  page-x-mobile: "16px"
  page-x-tablet: "28px"
  page-x: "48px"
  rail: "88px"
  rail-expanded: "248px"
  bottom-bar: "68px"
components:
  button-primary:
    backgroundColor: "{colors.neon-violet}"
    textColor: "#FFFFFF"
    rounded: "{rounded.pill}"
    padding: "0 20px"
    height: "42px"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.lavender-label}"
    rounded: "{rounded.pill}"
    padding: "0 20px"
    height: "42px"
  button-ghost-hover:
    backgroundColor: "{colors.neon-violet-soft}"
    textColor: "{colors.frost-text}"
  button-danger:
    backgroundColor: "transparent"
    textColor: "{colors.signal-pink-text}"
    rounded: "{rounded.pill}"
    height: "42px"
  button-danger-hover:
    backgroundColor: "{colors.signal-pink-soft}"
    textColor: "#FFFFFF"
  input:
    backgroundColor: "{colors.smoked-surface}"
    textColor: "{colors.frost-text}"
    rounded: "{rounded.control}"
    padding: "0 16px"
    height: "46px"
  card-post:
    backgroundColor: "{colors.smoked-surface-strong}"
    textColor: "{colors.frost-text}"
    rounded: "{rounded.card}"
    padding: "{spacing.card-padding}"
  chip-fact:
    backgroundColor: "transparent"
    textColor: "{colors.slate-muted}"
    rounded: "{rounded.pill}"
    height: "24px"
    padding: "0 9px"
  rail-item:
    backgroundColor: "transparent"
    textColor: "{colors.slate-muted}"
    rounded: "{rounded.tile}"
    size: "48px"
  rail-item-active:
    backgroundColor: "{colors.neon-violet-soft}"
    textColor: "{colors.frost-text}"
  popover:
    backgroundColor: "{colors.popover-ink}"
    textColor: "{colors.frost-text}"
    rounded: "{rounded.tile}"
---

# Design System: GamerMatch

## Overview

**Creative North Star: "La sala de neón"**

GamerMatch es una sala de juegos de noche: un fondo azul casi negro (void-navy) iluminado desde dos esquinas por resplandores difusos, violeta arriba a la izquierda y rosa abajo a la derecha, y sobre él superficies ahumadas y translúcidas con un filo violeta tenue. La luz viene de la marca, no de la decoración: el violeta es el tono de la interfaz (bordes, etiquetas, foco) y el rosa es la señal (lo que está pasando, lo elegido, lo que falta). Cuando ambos se juntan en el degradado de 135°, es porque hay algo que hacer o algo que es tuyo.

La tipografía tiene dos voces. Russo One, una display gruesa y geométrica de rótulo de arcade, nombra cosas: titulares, juegos, fichas, botones de acción. Chakra Petch, técnica y de esquinas cortadas, lo explica todo lo demás. La densidad es la de una app de uso diario: tarjetas compactas que se deciden sin abrirse, chips pequeños con iconos, y un rail lateral que en móvil se convierte en barra inferior.

La portada sin sesión lleva el mundo a escena sin salir de él: un mando 3D realista (el modelo CC0 "Gamepad" de Poly Haven, sin cable, con luz de estudio, contraluz violeta y un brillo violeta suave detrás; la zona elegida se enciende en rosa) como pantalla de selección de personaje. Es una expresión de la portada, no un patrón para el resto de pantallas.

**Key Characteristics:**
- Fondo void-navy con dos resplandores radiales fijos (violeta 14 %, rosa 9 %).
- Superficies ahumadas translúcidas con borde violeta suave; sin bloques sólidos claros.
- Degradado violeta a rosa solo donde hay acción principal, marca o algo propio.
- Russo One para nombrar, Chakra Petch para leer; mayúsculas solo en display y etiquetas.
- Movimiento con frenado natural (--gm-ease-out) y siempre con alternativa para reducir movimiento.

## Colors

Una paleta de noche: un navy casi negro, un violeta eléctrico como tono de la interfaz y un rosa de señal, con texto frío de alto contraste.

### Primary
- **Violeta neón** (neon-violet): color de marca y del sistema. Bordes (al 20 % y 35 %), fondos de selección (al 22 %), anillo de foco de campos (al 25 %), glow de tarjetas. Nunca como color de texto: sobre las superficies solo da 3,1:1.
- **Lavanda etiqueta** (lavender-label): el violeta legible. Enlaces, etiquetas de campo, iconos de chips, texto de botones fantasma y el contorno de foco de 2 px de todos los controles.

### Secondary
- **Rosa señal** (signal-pink): lo que pide atención. Insignias de no leídos, "Te interesa", ficha elegida, plazas llenas, partidas competitivas, cursor de escritura.
- **Rosa profundo** (signal-pink-deep): el extremo del degradado de marca. Existe para que el texto blanco sobre el degradado llegue a 4,7:1.
- **Rosa texto** (signal-pink-text): rosa legible para texto sobre fondo oscuro (errores, acciones de salir o eliminar, pista de la ficha activa).
- **Rosa velo** (signal-pink-soft): fondo de hover de acciones destructivas y de salida.

### Neutral
- **Navy vacío** (void-navy): fondo del documento, siempre con los dos resplandores de layout.
- **Superficie ahumada** (smoked-surface) y **ahumada fuerte** (smoked-surface-strong): campos, fichas y tarjetas. Las tarjetas de partida usan un degradado vertical de la fuerte a un tinta 85 %.
- **Cristal del rail** (rail-glass): fondo de la navegación lateral e inferior.
- **Tinta de popover** (popover-ink): menús, desplegables y paneles flotantes; opaco para que no se lea lo de debajo.
- **Escarcha** (frost-text): texto principal.
- **Pizarra** (slate-muted): texto secundario y descripciones.
- **Crepúsculo** (dusk-subtle, dusk-hint): metadatos (hora, pistas). Ajustados para pasar 4,5:1 también sobre tarjeta.
- **Borde violeta** (violet-border, violet-border-soft): el filo de todo contenedor; el suave en reposo, el fuerte en hover y en campos.

### Named Rules
**The Gradient Means Yours Rule.** El degradado de marca (135°, violeta neón a rosa profundo) aparece solo en: la acción principal de cada vista ("Crear cuenta", "Quiero jugar", "Publicar", enviar), la marca y la identidad del jugador (logo "GM", avatares sin foto), lo propio o lo elegido (tu burbuja de chat, el icono de la ficha activa) el relleno de progreso (plazas, logros) y el respaldo de portadas sin imagen. Nunca de fondo de panel ni de sección.

**The Violet Is Not Text Rule.** El violeta neón no se usa como color de texto; para texto violeta, lavanda etiqueta. Todo texto cumple AA (4,5:1) sobre tarjeta, no solo sobre el fondo.

## Typography

**Display Font:** Russo One (con sans-serif)
**Body Font:** Chakra Petch (con sans-serif)

**Character:** Russo One es un rótulo de arcade, pesado y sin matices, que se usa a peso 400 y siempre corto. Chakra Petch tiene la geometría recortada de una HUD pero se lee bien a 13-15 px, así que carga todo el texto corrido, los chips y los botones secundarios.

### Hierarchy
- **Display** (Russo One, clamp 34-58 px, interlineado 1,04, mayúsculas, text-wrap balance): el titular de la portada. Uno por pantalla como mucho.
- **Headline** (Russo One, 30 px, 1,1, mayúsculas): título de página de la app (feed, perfil).
- **Title** (Russo One, 22 px, 1,2): título de sección o de ficha abierta.
- **Card title** (Russo One, 18 px, 1,25, una línea con elipsis): nombre del juego en la tarjeta cuando no hay logo; nombres en fichas (16 px, mayúsculas).
- **Body** (Chakra Petch, 15 px, 1,55, máximo 46-56ch): texto de apoyo y campos de formulario.
- **Body small** (Chakra Petch, 14 px, 1,45): descripciones de tarjeta (dos líneas como mucho), autor, listas.
- **Label** (Chakra Petch 700, 11 px, 1 px de tracking, mayúsculas): etiquetas de campo, insignias de plataforma sobre la portada de la tarjeta, la marca "Ejemplo".

### Named Rules
**The Two Voices Rule.** Russo One nombra (titulares, juegos, acciones principales); Chakra Petch explica. Un párrafo nunca va en Russo One y un titular nunca en Chakra Petch.

**The Longest Language Rule.** Todo texto existe en es, en, pt y fr con las mismas claves, y cada layout se comprueba con el idioma más largo: los botones no cambian de tamaño ni de sitio al cambiar de idioma o de ficha.

## Layout

Una columna de contenido de hasta 1440 px junto a un rail fijo a la izquierda. El rail mide 88 px (solo iconos) y se expande a 248 px con etiquetas; el contenido se aparta con una transición de padding de 0,22 s. El padding del contenido es 48 px en escritorio, 28 px por debajo de 1280 px y 16 px por debajo de 768 px, donde el rail pasa a barra inferior fija de 68 px (solo iconos, con el área segura del sistema).

Puntos de corte observados: 767 px (móvil, el principal), 1023 px y 1279 px (tablet y escritorio estrecho), 374 px (teléfonos pequeños: iconos y avatar más pequeños).

Ritmo: 6 px entre chips, 12-14 px entre grupos dentro de una tarjeta, 18 px de padding de tarjeta, 24-28 px entre bloques de página. Las filas del feed son carruseles horizontales de tarjetas.

**The No Nested Cards Rule.** Un panel nunca enmarca una tarjeta. Si hay una tarjeta (una demo, una partida), lo que la rodea va directo sobre el fondo; en la portada, la ficha abierta es texto suelto y la demo es la única tarjeta.

## Elevation & Depth

La profundidad es luz, no sombra gris. Las superficies son translúcidas sobre el fondo con resplandores, se separan por su borde violeta y se levantan con glows coloreados de difusión negativa (la sombra queda bajo el objeto, nunca en un lado). Solo los elementos flotantes (popovers, menús) usan una sombra negra profunda, para despegarse de cualquier cosa.

### Shadow Vocabulary
- **Glow de tarjeta** (--gm-glow): reposo de tarjetas y paneles.
- **Glow de tarjeta en hover**: más violeta y más alto, junto con un desplazamiento de 3 px hacia arriba.
- **Sombra de acción** (--gm-cta-shadow): solo bajo la acción principal con degradado y el logo.
- **Sombra flotante**: popovers, menús y desplegables.
- **Anillo de foco** (--gm-focus-ring): campos enfocados, junto con el borde en violeta neón.

### Named Rules
**The Light Not Shadow Rule.** Los objetos de la marca brillan (glow violeta o rosa con difusión negativa); solo lo que flota sobre la interfaz proyecta sombra negra. Halos y resplandores son degradados radiales difusos, sin borde duro.

## Shapes

Cuatro radios y nada más. Control (10 px) para campos, botones de tarjeta y botones de icono; baldosa (12 px) para iconos enmarcados, botones del rail, logo y popovers; tarjeta (16 px) para tarjetas y fichas; píldora para botones de la app, chips, insignias y contadores. Avatares circulares. Bordes de 1 px en violeta translúcido; los estados de error, lleno o competitivo cambian el borde a rosa al 40 %.

## Components

### Buttons
Píldoras compactas y seguras de sí mismas.
- **Shape:** píldora, 42 px de alto, 20 px de padding horizontal; Chakra Petch 14 px 600.
- **Primary:** degradado de marca, texto blanco y sombra de acción; hover con brillo 1,1. Desactivado al 50 % y sin sombra. Uno por vista.
- **Ghost:** borde violeta, texto lavanda; hover con velo violeta al 14 % y texto escarcha.
- **Danger / salir:** borde rosa al 45 %, texto rosa legible; hover con velo rosa y texto blanco.
- **Icon:** cuadrado de 46 px con radio de control y la misma lógica rosa (quitar un enlace, etc.).
- **Focus:** contorno lavanda de 2 px con 2 px de separación, en todos los controles.
- **Botones de acción en tarjeta:** radio de control y Russo One 14 px para la acción ("Quiero jugar"); las acciones secundarias de la tarjeta vuelven a Chakra Petch 15 px 600.
- **"Quiero jugar":** mientras guarda, un brillo recorre el botón; al confirmar, un destello lo cruza una vez, el botón se comprime al 96 % y aparece "¡Dentro!" con un check que se dibuja.

### Chips
- **Style:** píldoras de 24 px, borde violeta suave, Chakra Petch 12 px 600 en pizarra, icono de 11 px en lavanda.
- **State:** las variantes de alerta (competitivo, lleno) pasan a borde y texto rosa. Las señales en común (compatibilidad) van rellenas de velo violeta con texto lavanda.

### Cards / Containers
- **Corner Style:** tarjeta (16 px).
- **Background:** degradado vertical ahumado, de superficie fuerte a tinta 85 %.
- **Shadow Strategy:** glow de tarjeta; en hover, glow alto y subida de 3 px (ver Elevation).
- **Border:** violeta suave en reposo, violeta en hover.
- **Internal Padding:** 18 px.
- **Tarjeta de partida:** portada de 148 px con imagen del juego (o uno de cuatro degradados violeta/rosa si no hay), insignia de plataforma con cristal esmerilado arriba a la derecha y logo del juego abajo sobre un velo oscuro. Si hay logo, el logo es el título; si no hay, el nombre va en texto en el cuerpo. Debajo: descripción de dos líneas, plazas con barra de progreso, chips y autor. Las tarjetas entran en cascada (40 ms entre una y otra, seis como mucho).

### Inputs / Fields
- **Style:** 46 px de alto, superficie ahumada, borde violeta, radio de control, Chakra Petch 15 px; placeholder en pizarra al 60 %.
- **Focus:** borde violeta neón y anillo de foco.
- **Error:** borde rosa al 70 % y mensaje en rosa legible de 12 px. Las pistas van en crepúsculo de 12 px.
- **Label:** encima del campo, en estilo Label y lavanda.

### Navigation
- **Rail de escritorio:** fijo a la izquierda, cristal del rail con borde derecho violeta suave. Logo "GM" con degradado arriba, botones de icono de 48 px con radio de baldosa, avatar al pie (o "Entrar" con degradado para visitantes). Hover con velo violeta al 12 %; activo con velo violeta al 22 % y un filo interior lavanda. No leídos: punto o insignia rosa con anillo del color del fondo. Se expande a 248 px mostrando etiquetas; la preferencia vive en la clase del documento.
- **Barra inferior móvil:** la misma navegación en una fila de 68 px, siempre solo iconos (46 px, 40 px en teléfonos pequeños); el logo y el botón de expandir desaparecen y aparece Inicio.

### Ficha de selección (portada)
Botón con radio de tarjeta y superficie ahumada, icono en baldosa de 46 px con velo violeta y nombre en Russo One mayúsculas. Activa: borde rosa, fondo con degradado horizontal tenue violeta a rosa, glow rosa y el icono pasa al degradado de marca. Una línea de 2 px con degradado al pie marca el tiempo hasta el avance automático.

### Demo de ejemplo
Tarjeta de muestra (radio 14 px, tinta al 65 %) con la píldora "Ejemplo" arriba a la derecha (estilo Label, borde violeta suave, texto crepúsculo). Sus botones son imitaciones sin interacción.

## Do's and Don'ts

### Do:
- **Do** reserva el degradado de marca para la acción principal, la marca y la identidad del jugador, lo propio o lo elegido, el relleno de progreso y las portadas sin imagen (The Gradient Means Yours Rule).
- **Do** marca todo contenido de muestra con la píldora "Ejemplo"; GamerMatch está en beta y no muestra cifras, usuarios ni testimonios inventados.
- **Do** pon el título del juego en texto en la tarjeta solo cuando no hay logo; con logo, el logo es el título.
- **Do** da a cada animación su versión para reducir movimiento: sin desplazamientos, brillos, parpadeos ni avance automático; los cambios de estado siguen con un fundido corto o sin transición.
- **Do** usa --gm-ease-out (cubic-bezier(0.16, 1, 0.3, 1)) para llegadas y cambios de layout, y anima solo transform y opacity.
- **Do** escribe cada texto en es, en, pt y fr con las mismas claves y comprueba el layout con el idioma más largo a 1440 y 390 px.
- **Do** da foco visible a todo control: contorno lavanda de 2 px.

### Don't:
- **Don't** metas una tarjeta dentro de un panel o de otra tarjeta (The No Nested Cards Rule).
- **Don't** uses el violeta neón como color de texto; usa lavanda etiqueta.
- **Don't** uses el degradado como fondo de panel, sección o página.
- **Don't** pongas sombras negras a tarjetas, fichas ni botones; su profundidad es glow de marca. La sombra negra es para lo que flota (y para despegar un logo de juego de su imagen).
- **Don't** escribas párrafos en Russo One ni titulares en Chakra Petch.
