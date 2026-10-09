// Limpieza de datos viejos u huérfanos (functions/cleanup/cleanupPlan.js,
// auditoría B-21 y B-31): qué se borra y qué no. Sin Firebase.
const path = require("path");
const { RETENTION, planNotifications, planGroupChats, planNonces, planGuideImages } =
  require(path.join(__dirname, "../../functions/cleanup/cleanupPlan.js"));

const results = [];
const check = (name, ok, extra = "") => {
  results.push(ok);
  console.log(`  ${ok ? "OK   " : "FALLA"} ${name}${extra ? ` -> ${extra}` : ""}`);
};

const NOW = Date.UTC(2026, 9, 9, 12);
const DAY = 24 * 60 * 60 * 1000;
const daysAgo = (n) => ({ toMillis: () => NOW - n * DAY });
const ids = (list) => list.map((x) => x.id).sort().join(",");

console.log("\n=== avisos");
const postIds = new Set(["p1"]);
const chatIds = new Set(["a_b"]);
const notifs = [
  { id: "nueva", type: "interested", relatedId: "p1", read: false, createdAt: daysAgo(1) },
  { id: "vieja", type: "friend_request", relatedId: "x", read: false, createdAt: daysAgo(RETENTION.notificationDays + 1) },
  { id: "leidaVieja", type: "friend_accepted", read: true, createdAt: daysAgo(RETENTION.readNotificationDays + 1) },
  { id: "leidaReciente", type: "friend_accepted", read: true, createdAt: daysAgo(5) },
  { id: "noLeida60", type: "friend_accepted", read: false, createdAt: daysAgo(60) },
  { id: "partidaBorrada", type: "comment", relatedId: "pBorrado", read: false, createdAt: daysAgo(1) },
  { id: "grupoBorrado", type: "group_message", relatedId: "pBorrado", read: false, createdAt: daysAgo(1) },
  { id: "chatBorrado", type: "message", relatedId: "c_d", read: false, createdAt: daysAgo(1) },
  { id: "chatVivo", type: "message", relatedId: "a_b", read: false, createdAt: daysAgo(1) },
  { id: "amistad", type: "friend_request", relatedId: "solicitud", read: false, createdAt: daysAgo(1) },
  { id: "sinFecha", type: "friend_request", read: false }
];
const n = planNotifications(notifs, { postIds, chatIds, now: NOW });
check("borra: vieja, leída vieja y las que apuntan a partida o chat borrados",
  ids(n) === "chatBorrado,grupoBorrado,leidaVieja,partidaBorrada,vieja", ids(n));
check("conserva: recientes, no leídas de 60 días, chat vivo, amistad y sin fecha",
  ["nueva", "leidaReciente", "noLeida60", "chatVivo", "amistad", "sinFecha"].every((id) => !n.some((x) => x.id === id)));
check("dice el motivo", n.find((x) => x.id === "partidaBorrada")?.reason === "partida borrada" && n.find((x) => x.id === "vieja")?.reason === "vieja");

console.log("\n=== chats de partida");
const groups = [
  { id: "p1", active: true, lastMessageAt: daysAgo(100) },
  { id: "cerradoViejo", active: false, lastMessageAt: daysAgo(RETENTION.inactiveGroupDays + 1) },
  { id: "cerradoReciente", active: false, lastMessageAt: daysAgo(3) },
  { id: "huerfanoViejo", active: true, createdAt: daysAgo(40) },
  { id: "huerfanoSinFecha", active: true },
  { id: "huerfanoReciente", active: true, createdAt: daysAgo(2) }
];
const g = planGroupChats(groups, { postIds: new Set(["p1", "cerradoViejo", "cerradoReciente"]), now: NOW });
check("borra los cerrados o sin partida sin actividad en 30 días (o sin fecha)",
  ids(g) === "cerradoViejo,huerfanoSinFecha,huerfanoViejo", ids(g));
check("un grupo con partida activa nunca se borra, aunque lleve meses sin mensajes", !g.some((x) => x.id === "p1"));

console.log("\n=== nonces de Steam");
const nonces = planNonces([
  { id: "vencido", expiresAt: daysAgo(1) },
  { id: "vigente", expiresAt: { toMillis: () => NOW + 60000 } },
  { id: "sinFecha" }
], { now: NOW });
check("solo los vencidos", ids(nonces) === "vencido", ids(nonces));

console.log("\n=== imágenes de guías");
const files = [
  { name: "guides/u1/1_usada.png", updated: NOW - 30 * DAY },
  { name: "guides/u1/2_huerfana.png", updated: NOW - 30 * DAY },
  { name: "guides/u1/3_reciente.png", updated: NOW - 1 * DAY },
  { name: "guides/u2/4 con espacio.png", updated: NOW - 30 * DAY },
  { name: "avatars/u1", updated: NOW - 30 * DAY },
  { name: "guides/u1/", updated: NOW - 30 * DAY }
];
const guidesText = [
  "https://firebasestorage.googleapis.com/v0/b/b/o/" + encodeURIComponent("guides/u1/1_usada.png") + "?alt=media",
  '<p><img src="https://firebasestorage.googleapis.com/v0/b/b/o/' + encodeURIComponent("guides/u2/4 con espacio.png") + '?alt=media"></p>'
].join(" ");
const imgs = planGuideImages(files, { guidesText, now: NOW });
check("borra solo la imagen vieja que ninguna guía usa", ids(imgs) === "guides/u1/2_huerfana.png", ids(imgs));
check("respeta las recientes (pueden estar en una guía en edición) y lo que no es de guías",
  !imgs.some((x) => /reciente|avatars|\/$/.test(x.id)));

const failed = results.filter((ok) => !ok).length;
console.log(`\n${results.length - failed}/${results.length} OK`);
process.exit(failed ? 1 : 0);
