import { getCoverVariant } from "../../utils";

// Miniatura del juego de un chat de grupo: la portada de la partida o, sin
// ella (o si la partida ya no existe), su portada decorativa con la inicial
export default function GameThumb({ postId, post, title }) {
  const initial = (post?.game || title || "?").trim().charAt(0).toUpperCase();

  return (
    <span className={`game-thumb game-thumb--${getCoverVariant(postId)}`} aria-hidden="true">
      {post?.image
        ? <img src={post.image} alt="" className="game-thumb__img" loading="lazy" />
        : <span className="game-thumb__initial">{initial}</span>}
    </span>
  );
}
