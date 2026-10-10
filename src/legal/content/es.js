// Contenido de los documentos legales en español. Versión provisional: los
// marcadores "[PENDIENTE: ...]" quedan hasta que se resuelvan, y mientras
// haya alguno la página muestra el aviso de versión provisional.
// Cada documento: { updatedAt: "AAAA-MM-DD" | null, sections: [{ id, title, body: [párrafos] }] }

export const privacy = {
  updatedAt: "2026-10-10",
  sections: [
    {
      id: "datos",
      title: "Qué datos recopilamos",
      body: [
        "Los que tú nos das: correo electrónico (lo gestiona Firebase Authentication; nosotros nunca vemos tu contraseña), apodo, país o región, foto de perfil y portada, biografía, juegos favoritos, enlaces a tus redes (por ejemplo Steam, Discord o Twitch), preferencias de juego y lo que publicas o escribes: partidas, comentarios, mensajes de chat y archivos adjuntos. También los que se generan al usar la app: amistades y solicitudes, bloqueos y reportes, notificaciones, tus intereses en partidas, tu estado de conexión (“última vez activo”) y tus preferencias (idioma, guía de bienvenida, privacidad). Si entras con Google, recibimos de Google tu correo, tu nombre y tu foto: el nombre (o, si no lo hay, lo que va antes de la @ de tu correo) se usa como apodo inicial y la foto como foto de perfil; el correo queda solo en Firebase Authentication. Si entras con Steam, recibimos tu identificador de Steam (SteamID), tu nombre público y tu avatar de Steam: se usan como apodo y foto de perfil iniciales y tu perfil de Steam se agrega a tus enlaces. Google (Firebase) procesa además datos técnicos, como la dirección IP y el dispositivo, para operar el servicio. No pedimos número de teléfono ni datos de pago."
      ]
    },
    {
      id: "uso",
      title: "Para qué los usamos",
      body: [
        "Para crear y mantener tu cuenta, mostrarte partidas y jugadores, permitir chats y amistades, mostrar tu presencia, moderar contenido y proteger a la comunidad. No vendemos tus datos. No mostramos anuncios ni usamos enlaces de afiliados ni herramientas de analítica."
      ]
    },
    {
      id: "visibilidad",
      title: "Quién puede ver qué",
      body: [
        "Tu apodo, foto, portada, biografía, país, juegos, enlaces, tu última vez activo y la fecha en que te uniste son visibles para otros usuarios, y también sin iniciar sesión para quien abra tu perfil. Sin iniciar sesión se pueden ver las partidas, las guías publicadas y las noticias, con el apodo y la foto de quien las publicó, y a partir de ellas tu perfil público; los comentarios, quién se interesó en cada partida y la búsqueda de jugadores requieren iniciar sesión. Si completas tus preferencias de juego (horario, plataformas, idiomas, micrófono, nivel y valores), las pueden ver los usuarios con sesión: se usan para sugerir jugadores compatibles y se muestran las que tienen en común. Los chats solo los ven sus participantes, y los chats de partida, los miembros de esa partida. Tu correo no es visible para otros usuarios. Quienes administran la plataforma ven los reportes (quién reporta, el motivo, la nota opcional y el perfil, la partida o el comentario reportado) y las guías antes de publicarlas; los mensajes de chat no se pueden reportar y la app no les da acceso a los chats. Si activas “Permitir que mis amigos y quienes se interesen en mis partidas se unan a mi partida de Steam” (viene desactivado y requiere tu enlace de Steam), tus amigos y quienes se interesaron en tus partidas verán que estás en una sala y en qué juego, y podrán usar un enlace para entrar, salvo que haya un bloqueo entre ustedes; puedes apagarlo cuando quieras."
      ]
    },
    {
      id: "terceros",
      title: "Con quién se comparten",
      body: [
        "Usamos Google Firebase (autenticación, base de datos, archivos y funciones), cuyos servidores pueden estar fuera de tu país [PENDIENTE: región de Firestore, Storage y Functions, a confirmar en la consola de Firebase]. Si entras con Google o con Steam, ese servicio participa en el inicio de sesión. Consultamos Steam (con tu enlace de Steam, para mostrar estadísticas, juego en curso y, si lo activaste, tu sala), Twitch (tu usuario, para saber si estás en directo), SteamGridDB (nombres de juegos, para logos y portadas) y RAWG (lo que buscas, para datos e imágenes de juegos). Las noticias vienen de IGN y GameSpot y enlazan al artículo original. Si una guía enlaza a otra página, nuestro servidor la visita para mostrar su vista previa. Si la app falla, puede enviar a Sentry un reporte técnico del error (el error, la página y el navegador, sin tu nombre, tu correo ni lo que escribes) para que podamos corregirlo. Los videos de YouTube de las guías se insertan desde youtube-nocookie.com y, al reproducirlos, se aplican las políticas de YouTube. El enlace de apoyo (Ko-fi) sale de la app: al abrirlo se aplican sus propias políticas. No compartimos tus datos con anunciantes."
      ]
    },
    {
      id: "conservacion",
      title: "Cuánto tiempo los conservamos",
      body: [
        "Mientras tu cuenta exista, salvo los avisos, que se borran a los 90 días (a los 30 si ya los leíste), y los chats de partida cerrados o cuya partida ya no existe, que se borran con sus mensajes y archivos tras 30 días sin actividad. Si eliminas tu cuenta, borramos tu perfil, tus partidas (con sus comentarios, interesados y chat de grupo), tus comentarios, tus “Quiero jugar”, tus mensajes en chats de partida, tus chats privados (para las dos personas), tus amistades, solicitudes y bloqueos, tus avisos, tus guías, tus preferencias, tus archivos y tu cuenta de acceso, y tu apodo queda libre [PENDIENTE: hoy se conserva el texto del último mensaje que hayas enviado a un chat de partida ajena, como vista previa del chat; corregir en el código o mencionarlo aquí]. Se conservan los reportes de moderación (los que hiciste y los que te señalan) como registro de seguridad, y los contadores de partidas por juego, que no son datos personales. [PENDIENTE: copias de seguridad de la base de datos y registros (logs) del proveedor: si existen y cuánto tiempo se guardan, a confirmar en la consola de Firebase y Google Cloud]."
      ]
    },
    {
      id: "derechos",
      title: "Tus derechos y cómo eliminar tu cuenta",
      body: [
        "Puedes ver y editar los datos de tu perfil desde Mi perfil y eliminar tu cuenta en Mi perfil → “Eliminar mi cuenta”. Para cualquier otra solicitud (acceso, copia, corrección, oposición), escríbenos a [PENDIENTE: correo de contacto, lo decide el responsable del servicio]."
      ]
    },
    {
      id: "menores",
      title: "Menores de edad",
      body: [
        "GamerMatch está dirigido a personas de 18 años o más. No recopilamos a sabiendas datos de personas menores de 18 años; si descubrimos una cuenta de una persona menor de 18 años, la eliminaremos."
      ]
    },
    {
      id: "almacenamiento",
      title: "Almacenamiento en tu navegador",
      body: [
        "Usamos el almacenamiento de tu navegador para mantener tu sesión iniciada (Firebase), recordar el idioma que elijas y, mientras la pestaña esté abierta, mostrar avisos temporales y recordar si ya viste la guía de bienvenida; estos últimos se borran al cerrar la pestaña. Al eliminar tu cuenta se borra también lo guardado en ese navegador. No usamos analítica, publicidad ni cookies de seguimiento. Al usar la app, tu navegador también se conecta directamente con otros servicios, que reciben tu dirección IP: Google Fonts (las fuentes tipográficas, en todas las páginas), RAWG, SteamGridDB, Steam y Google (imágenes de juegos y fotos de perfil), los sitios de IGN y GameSpot (imágenes de las noticias), YouTube (al abrir una guía con video), los sitios de donde vienen las imágenes de las guías (las elige quien escribe la guía) y RAWG cuando buscas un juego."
      ]
    },
    {
      id: "cambios",
      title: "Cambios y contacto",
      body: [
        "Si cambiamos esta política, actualizaremos la fecha y, si el cambio es importante, te avisaremos en la app. Contacto: [PENDIENTE: correo de contacto, lo decide el responsable del servicio]."
      ]
    }
  ]
};

export const terms = {
  updatedAt: "2026-10-10",
  sections: [
    {
      id: "quien",
      title: "Quién puede usar el servicio",
      body: [
        "Debes tener 18 años o más para usar el servicio. Es para uso personal y con información veraz."
      ]
    },
    {
      id: "cuenta",
      title: "Tu cuenta",
      body: [
        "Eres responsable de tu contraseña y de lo que ocurra en tu cuenta. Avísanos si sospechas un acceso no autorizado. No puedes vender ni ceder tu cuenta."
      ]
    },
    {
      id: "contenido",
      title: "Contenido que publicas",
      body: [
        "Sigue siendo tuyo. Nos das permiso, gratuito y no exclusivo, para almacenarlo y mostrarlo dentro del servicio. Declaras que tienes derecho a publicarlo."
      ]
    },
    {
      id: "conductas",
      title: "Conductas no permitidas",
      body: [
        "Acoso, amenazas, discurso de odio, contenido sexual explícito o que involucre a menores, violencia gráfica, suplantación de identidad, spam o estafas, compartir datos personales de otras personas sin permiso, malware, uso automatizado abusivo y cualquier actividad contraria a la ley o a los términos de Steam, Twitch u otros servicios que uses con la app."
      ]
    },
    {
      id: "moderacion",
      title: "Moderación, reportes y bloqueos",
      body: [
        "Puedes reportar a otros usuarios, sus partidas y sus comentarios, y bloquear a otros usuarios. Revisamos los reportes, y las guías antes de publicarlas. Podemos quitar contenido y limitar o cerrar cuentas que incumplan estos términos, sin aviso previo en casos graves [PENDIENTE: la app todavía no tiene herramientas para quitar contenido ajeno ni para suspender o cerrar cuentas; hoy solo se puede hacer a mano desde la consola de Firebase]. No garantizamos una revisión inmediata."
      ]
    },
    {
      id: "seguridad",
      title: "Seguridad entre jugadores",
      body: [
        "No verificamos identidades. No compartas datos sensibles (domicilio, teléfono, contraseñas) y ten cuidado en cualquier encuentro fuera de la plataforma: eres responsable de tus interacciones."
      ]
    },
    {
      id: "terceros",
      title: "Servicios de terceros",
      body: [
        "Steam, Twitch, Google, RAWG, Ko-fi y otros se rigen por sus propios términos y no están afiliados a nosotros. El apoyo voluntario por Ko-fi no da funciones ni derechos adicionales."
      ]
    },
    {
      id: "responsabilidad",
      title: "Servicio en beta y responsabilidad",
      body: [
        "El servicio se ofrece “tal cual”, puede tener errores, cambiar o interrumpirse. En la medida permitida por la ley, no respondemos por daños indirectos. [PENDIENTE: revisión por un abogado de todo el texto (privacidad y términos), en especial esta sección, la ley aplicable y la edad mínima, según el país desde el que se ofrece el servicio]."
      ]
    },
    {
      id: "eliminacion",
      title: "Eliminación de cuentas",
      body: [
        "Puedes eliminar tu cuenta cuando quieras. Podemos suspenderla o eliminarla si incumples estos términos."
      ]
    },
    {
      id: "cambios",
      title: "Cambios, ley aplicable y contacto",
      body: [
        "Podemos actualizar estos términos; si sigues usando el servicio después, los aceptas, y avisaremos de los cambios importantes. Ley aplicable: [PENDIENTE: país o jurisdicción cuya ley se aplica, lo decide el responsable del servicio con revisión legal]. Contacto: [PENDIENTE: correo de contacto, lo decide el responsable del servicio]."
      ]
    }
  ]
};
