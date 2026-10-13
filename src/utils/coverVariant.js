// Portada decorativa para un post sin imagen: una de cuatro (--gm-cover-0..3
// en theme.css), siempre la misma para el mismo post
export const COVER_VARIANTS = 4;

export const getCoverVariant = (id = "") => {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash + id.charCodeAt(i)) % COVER_VARIANTS;
  }
  return hash;
};
