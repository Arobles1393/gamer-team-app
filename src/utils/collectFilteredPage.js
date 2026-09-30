import { filterPosts } from "./postFilters";

// Pide páginas crudas a Firestore y les aplica los filtros del feed
// (plataforma con multiplataforma, juego) hasta juntar `pageSize` posts
// visibles, o hasta que no haya más. Así un filtro estrecho no deja páginas
// casi vacías. `maxRawPages` acota las lecturas por clic en "Cargar más".
//
// fetchRawPage(cursor) -> { posts, lastVisibleDoc, hasMore }
export const collectFilteredPage = async ({
  fetchRawPage,
  cursor,
  filters,
  pageSize,
  maxRawPages = 4
}) => {
  const posts = [];
  let nextCursor = cursor;
  let hasMore = true;

  for (let page = 0; page < maxRawPages && hasMore && posts.length < pageSize; page++) {
    const result = await fetchRawPage(nextCursor);

    posts.push(...filterPosts(result.posts, filters));
    nextCursor = result.lastVisibleDoc;
    hasMore = result.hasMore;
  }

  return { posts, cursor: nextCursor, hasMore };
};
