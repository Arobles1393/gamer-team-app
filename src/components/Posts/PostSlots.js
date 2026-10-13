import { memo } from "react";
import { useTranslation } from "react-i18next";

/**
 * Plazas de la partida en la card: "1/3 plazas" con una barra que se llena.
 * interested = quienes tocaron "Quiero jugar"; needed = jugadores que busca.
 * La barra crece con una transición cuando alguien se une (PostCard.css).
 */
function PostSlots({ interested, needed }) {
  const { t } = useTranslation("posts");
  const full = interested >= needed;
  const ratio = Math.min(interested / needed, 1);

  return (
    <p
      className={`post-card__slots${full ? " post-card__slots--full" : ""}`}
      aria-label={t("card.slotsLabel", { interested, needed })}
    >
      <span className="post-card__slots-count" aria-hidden="true">
        <strong>{interested}</strong>/{needed}
      </span>
      <span className="post-card__slots-bar" aria-hidden="true">
        <span className="post-card__slots-fill" style={{ transform: `scaleX(${ratio})` }} />
      </span>
      <span className="post-card__slots-word" aria-hidden="true">
        {full ? t("card.slotsFull") : t("card.slotsWord", { count: needed })}
      </span>
    </p>
  );
}

export default memo(PostSlots);
