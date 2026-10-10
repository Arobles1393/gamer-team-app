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
        "Los que tú nos das: correo electrónico (lo gestiona Firebase Authentication; nosotros nunca vemos tu contraseña), apodo, país o región, foto de perfil y portada, biografía, juegos favoritos, enlaces a tus redes (por ejemplo Steam, Discord o Twitch), preferencias de juego y lo que publicas o escribes: partidas, comentarios, mensajes de chat y archivos adjuntos. También los que se generan al usar la app: amistades y solicitudes, bloqueos y reportes, notificaciones, tus intereses en partidas, tu estado de conexión (“última vez activo”) y tus preferencias (idioma, guía de bienvenida, privacidad). Si entras con Google o Steam, recibimos el identificador de esa cuenta. [PENDIENTE: confirmar qué más llega de cada proveedor]. Google (Firebase) procesa además datos técnicos, como la dirección IP y el dispositivo, para operar el servicio. No pedimos número de teléfono ni datos de pago."
      ]
    },
    {
      id: "uso",
      title: "Para qué los usamos",
      body: [
        "Para crear y mantener tu cuenta, mostrarte partidas y jugadores, permitir chats y amistades, mostrar tu presencia, moderar contenido y proteger a la comunidad. No vendemos tus datos. [PENDIENTE: actualizar si se añaden anuncios, afiliados o analítica]."
      ]
    },
    {
      id: "visibilidad",
      title: "Quién puede ver qué",
      body: [
        "Tu apodo, foto, portada, biografía, país, juegos y enlaces son visibles para otros usuarios. Sin iniciar sesión se pueden ver las partidas, las guías publicadas y las noticias, con el apodo y la foto de quien las publicó, y a partir de ellas tu perfil público; los comentarios, quién se interesó en cada partida y la búsqueda de jugadores requieren iniciar sesión. Los chats solo los ven sus participantes, y los chats de partida, los miembros de esa partida. Tu correo no es visible para otros usuarios. Quienes administran la plataforma pueden revisar los reportes [PENDIENTE: confirmar si pueden leer mensajes reportados]. Si activas “Permitir que mis amigos y quienes se interesen en mis partidas se unan a mi partida de Steam” (viene desactivado), tus amigos y quienes se interesaron en tus partidas verán que estás en una sala y podrán usar un enlace para entrar, salvo que haya un bloqueo entre ustedes; puedes apagarlo cuando quieras."
      ]
    },
    {
      id: "terceros",
      title: "Con quién se comparten",
      body: [
        "Usamos Google Firebase (autenticación, base de datos, archivos y funciones), cuyos servidores pueden estar fuera de tu país. Consultamos Steam (con tu enlace de Steam, para mostrar estadísticas y estado de juego públicos), Twitch (tu usuario, para saber si estás en directo), y RAWG y SteamGridDB (nombres de juegos, para datos e imágenes). Si la app falla, puede enviar a Sentry un reporte técnico del error (el error, la página y el navegador, sin tu nombre, tu correo ni lo que escribes) para que podamos corregirlo. Los enlaces de apoyo (Ko-fi) y los videos de YouTube salen de la app: al abrirlos se aplican sus propias políticas. No compartimos tus datos con anunciantes."
      ]
    },
    {
      id: "conservacion",
      title: "Cuánto tiempo los conservamos",
      body: [
        "Mientras tu cuenta exista. Si la eliminas, borramos tu perfil, publicaciones, comentarios, mensajes y archivos [PENDIENTE: confirmar contra el inventario de datos]. Los reportes de moderación pueden conservarse como registro de seguridad. [PENDIENTE: copias de seguridad y registros del proveedor]."
      ]
    },
    {
      id: "derechos",
      title: "Tus derechos y cómo eliminar tu cuenta",
      body: [
        "Puedes ver y editar tus datos desde tu perfil y eliminar tu cuenta en Perfil → “Eliminar mi cuenta”. Para cualquier otra solicitud (acceso, copia, corrección, oposición), escríbenos a [PENDIENTE: correo de contacto]."
      ]
    },
    {
      id: "menores",
      title: "Menores de edad",
      body: [
        "GamerMatch está dirigido a personas de [PENDIENTE: edad mínima] años o más. Si crees que una persona menor tiene una cuenta, escríbenos y la eliminaremos."
      ]
    },
    {
      id: "almacenamiento",
      title: "Almacenamiento en tu navegador",
      body: [
        "Usamos el almacenamiento de tu navegador para mantener tu sesión iniciada (Firebase), recordar tu idioma y mostrar avisos temporales que se borran al cerrar la pestaña. No usamos cookies de publicidad ni de seguimiento. Al usar la app, tu navegador también se conecta directamente con otros servicios, que reciben tu dirección IP: Google Fonts (las fuentes tipográficas), RAWG, SteamGridDB, Steam y Google (imágenes de juegos y fotos de perfil) y RAWG cuando buscas un juego."
      ]
    },
    {
      id: "cambios",
      title: "Cambios y contacto",
      body: [
        "Si cambiamos esta política, actualizaremos la fecha y, si el cambio es importante, te avisaremos en la app. Contacto: [PENDIENTE: correo de contacto]."
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
        "Personas de [PENDIENTE: edad mínima] años o más, para uso personal y con información veraz."
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
        "Puedes reportar y bloquear a otros usuarios. Podemos quitar contenido y limitar o cerrar cuentas que incumplan estos términos, sin aviso previo en casos graves. No garantizamos una revisión inmediata."
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
        "El servicio se ofrece “tal cual”, puede tener errores, cambiar o interrumpirse. En la medida permitida por la ley, no respondemos por daños indirectos. [PENDIENTE: revisar con abogado según tu país]."
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
        "Podemos actualizar estos términos; si sigues usando el servicio después, los aceptas, y avisaremos de los cambios importantes. Ley aplicable: [PENDIENTE: país o jurisdicción]. Contacto: [PENDIENTE: correo de contacto]."
      ]
    }
  ]
};
