// Quita los elementos cuyo autor está bloqueado (en cualquier dirección).
// Filtro del cliente sobre lo ya traído de Firestore.
export const excludeBlockedAuthors = (items, blockedIds, authorField = "userId") => {
  if (!blockedIds?.length) return items;

  const blocked = new Set(blockedIds);
  return items.filter((item) => !blocked.has(item[authorField]));
};
