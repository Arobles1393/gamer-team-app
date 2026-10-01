import { useTranslation } from "react-i18next";
import { Skeleton } from "primereact/skeleton";
import { useGameAchievements } from "../../hooks";

// Rareza según el % global de jugadores que lo desbloquearon
const RARITIES = [
  { max: 1, key: "ultra-rare", labelKey: "achievements.rarity.ultraRare" },
  { max: 5, key: "very-rare", labelKey: "achievements.rarity.veryRare" },
  { max: 10, key: "rare", labelKey: "achievements.rarity.rare" }
];

const getRarity = (percent) =>
  RARITIES.find((rarity) => percent > 0 && percent < rarity.max) ?? null;

function AchievementItem({ achievement, unlocked }) {
  const { t } = useTranslation("profile");
  const rarity = getRarity(achievement.percent);

  return (
    <li className={`achievement${unlocked ? "" : " achievement--locked"}`}>
      <img
        src={unlocked ? achievement.icon : achievement.iconGray}
        alt=""
        loading="lazy"
        className="achievement__icon"
      />
      <span className="achievement__body">
        <span className="achievement__name">{achievement.name}</span>
        {achievement.description && (
          <span className="achievement__description">{achievement.description}</span>
        )}
      </span>
      <span className={`achievement__rarity${rarity ? ` achievement__rarity--${rarity.key}` : ""}`}>
        {achievement.percent.toFixed(1)}%
        {rarity && <span className="achievement__rarity-label">{t(rarity.labelKey)}</span>}
      </span>
    </li>
  );
}

export default function GameAchievements({ game, steamId }) {
  const { t } = useTranslation("profile");
  const { achievements, loading, error } = useGameAchievements(game, steamId);

  if (loading) {
    return (
      <div className="achievements" aria-busy="true" aria-label={t("achievements.loading")}>
        <Skeleton height="56px" borderRadius="12px" className="steam-skeleton" />
        <ul className="achievements__list">
          {Array.from({ length: 4 }, (_, i) => (
            <li key={i}>
              <Skeleton height="64px" borderRadius="12px" className="steam-skeleton" />
            </li>
          ))}
        </ul>
      </div>
    );
  }

  if (error) {
    return (
      <p className="achievements__message">{t("achievements.error")}</p>
    );
  }

  if (achievements.length === 0) {
    return (
      <p className="achievements__message">{t("achievements.empty")}</p>
    );
  }

  // Los más raros primero dentro de cada grupo
  const byRarity = (a, b) => a.percent - b.percent;
  const unlocked = achievements.filter((a) => a.achieved === 1).sort(byRarity);
  const locked = achievements.filter((a) => a.achieved === 0).sort(byRarity);
  const progress = Math.round((unlocked.length / achievements.length) * 100);

  return (
    <div className="achievements">
      <div className="achievements__progress">
        <div className="achievements__progress-top">
          <span className="achievements__progress-count">
            {t("achievements.progress", { unlocked: unlocked.length, total: achievements.length })}
          </span>
          <span className="achievements__progress-percent">{progress}%</span>
        </div>
        <span className="achievements__bar" aria-hidden="true">
          <span style={{ width: `${progress}%` }} />
        </span>
        <span className="achievements__legend">
          <span className="achievements__legend-item achievements__legend-item--rare">Raro &lt;10%</span>
          <span className="achievements__legend-item achievements__legend-item--very-rare">Muy raro &lt;5%</span>
          <span className="achievements__legend-item achievements__legend-item--ultra-rare">Ultra raro &lt;1%</span>
        </span>
      </div>

      {unlocked.length > 0 && (
        <section>
          <h3 className="achievements__title">Desbloqueados ({unlocked.length})</h3>
          <ul className="achievements__list">
            {unlocked.map((achievement) => (
              <AchievementItem key={achievement.name} achievement={achievement} unlocked />
            ))}
          </ul>
        </section>
      )}

      {locked.length > 0 && (
        <section>
          <h3 className="achievements__title">Bloqueados ({locked.length})</h3>
          <ul className="achievements__list">
            {locked.map((achievement) => (
              <AchievementItem key={achievement.name} achievement={achievement} />
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
