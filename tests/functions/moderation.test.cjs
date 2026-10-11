// moderate: validación de la petición (functions/moderation/moderation.service.js).
// Sin Firebase ni internet.
const path = require("path");
const { parseModerationRequest, ACTIONS, ValidationError } = require(path.join(__dirname, "../../functions/moderation/moderation.service.js"));

const results = [];
const check = (name, ok) => {
  results.push(ok);
  console.log(`  ${ok ? "OK   " : "FALLA"} ${name}`);
};
const rejects = (data) => {
  try {
    parseModerationRequest(data);
    return false;
  } catch (error) {
    return error instanceof ValidationError;
  }
};

console.log("\n=== petición de moderación");
check("cinco acciones con su tipo", JSON.stringify(ACTIONS) === JSON.stringify({ deletePost: "post", deleteComment: "comment", suspendUser: "user", unsuspendUser: "user", deleteUser: "user" }));
const ok = parseModerationRequest({ action: "deletePost", targetId: "abc123", reportId: "r1" });
check("borrar partida: tipo post", ok.targetType === "post" && ok.targetId === "abc123" && ok.reportId === "r1");
check("sin reportId: null", parseModerationRequest({ action: "suspendUser", targetId: "uid1" }).reportId === null);
check("uid de Steam (steam:...) válido", parseModerationRequest({ action: "deleteUser", targetId: "steam:76561197960287930" }).targetType === "user");
check("acción desconocida: no", rejects({ action: "banForever", targetId: "x" }));
check("acción heredada de Object (toString): no", rejects({ action: "toString", targetId: "x" }));
check("sin targetId: no", rejects({ action: "deletePost" }));
check("targetId con /: no (no se sale de la colección)", rejects({ action: "deletePost", targetId: "a/b" }));
check("targetId muy largo: no", rejects({ action: "deletePost", targetId: "a".repeat(129) }));
check("reportId inválido: no", rejects({ action: "deletePost", targetId: "x", reportId: 5 }));
check("sin datos: no", rejects(undefined));

const failed = results.filter((r) => !r).length;
console.log(`\n${results.length - failed}/${results.length} pruebas OK${failed ? ` (${failed} fallaron)` : ""}`);
process.exit(failed ? 1 : 0);
