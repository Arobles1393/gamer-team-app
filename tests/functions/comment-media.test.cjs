// Archivos de comentarios: cleanupCommentMedia y deleteAccount solo borran
// rutas de la carpeta de quien comentó (functions/postComments/commentMedia.js,
// auditoría C-02). Sin Firebase ni internet.
const path = require("path");
const { isOwnCommentMediaPath } = require(path.join(__dirname, "../../functions/postComments/commentMedia.js"));

const results = [];
const check = (name, ok) => {
  results.push(ok);
  console.log(`  ${ok ? "OK   " : "FALLA"} ${name}`);
};

const B = "bbbUser2";
const STEAM = "steam:76561198000000000";

console.log("\n=== rutas de archivos de comentarios");
check("su propio archivo: sí", isOwnCommentMediaPath(`comments/${B}/1700000000_foto.png`, B));
check("cuenta de Steam con su propio archivo: sí", isOwnCommentMediaPath(`comments/${STEAM}/1_clip.mp4`, STEAM));
check("avatar de otro: no", !isOwnCommentMediaPath("avatars/aaaUser1", B));
check("adjunto de un chat ajeno: no", !isOwnCommentMediaPath("chats/aaa_bbb/aaaUser1/1_factura.pdf", B));
check("carpeta de comentarios de otro: no", !isOwnCommentMediaPath("comments/aaaUser1/1_foto.png", B));
check("prefijo engañoso (uid + x): no", !isOwnCommentMediaPath(`comments/${B}x/1_foto.png`, B));
check("subcarpeta propia: no", !isOwnCommentMediaPath(`comments/${B}/x/1_foto.png`, B));
check("toda la carpeta (sin archivo): no", !isOwnCommentMediaPath(`comments/${B}/`, B));
check("ruta de más de 300 caracteres: no", !isOwnCommentMediaPath(`comments/${B}/${"x".repeat(300)}`, B));
check("sin ruta, o no es texto: no", !isOwnCommentMediaPath("", B) && !isOwnCommentMediaPath(null, B) && !isOwnCommentMediaPath({}, B));
check("sin autor: no", !isOwnCommentMediaPath(`comments/${B}/1_a.png`, undefined) && !isOwnCommentMediaPath("comments//1_a.png", ""));

const failed = results.filter((ok) => !ok).length;
console.log(`\n${results.length - failed}/${results.length} OK`);
process.exit(failed ? 1 : 0);
