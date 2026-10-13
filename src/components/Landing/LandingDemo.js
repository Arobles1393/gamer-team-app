import { useTranslation } from "react-i18next";
import { platformIcons } from "../../utils";

// Demostración de cada razón en la ficha abierta: cómo se ve en la app, con
// datos de ejemplo (marcados como tales: la beta no tiene usuarios reales)
export default function LandingDemo({ id }) {
  const { t } = useTranslation("landing");

  return (
    <figure className={`landing-demo landing-demo--${id}`}>
      <figcaption className="landing-demo__label">{t("demo.example")}</figcaption>
      {id === "parties" && (
        <div className="landing-demo__party">
          <p className="landing-demo__game">{t("demo.parties.game")}</p>
          <p className="landing-demo__text">{t("demo.parties.description")}</p>
          <p className="landing-demo__facts">
            <span className="landing-demo__slots">
              <strong>1</strong>/2 <span className="landing-demo__bar"><span /></span> {t("demo.parties.slots")}
            </span>
            <span className="landing-demo__tag"><i className="pi pi-microphone" aria-hidden="true" />{t("demo.parties.mic")}</span>
            <span className="landing-demo__tag landing-demo__tag--hot"><i className="pi pi-trophy" aria-hidden="true" />{t("demo.parties.competitive")}</span>
          </p>
          <span className="landing-demo__button">{t("demo.parties.join")}</span>
        </div>
      )}
      {id === "compatible" && (
        <div className="landing-demo__match">
          <span className="landing-demo__avatar" aria-hidden="true">N</span>
          <div>
            <p className="landing-demo__game">{t("demo.compatible.player")}</p>
            <p className="landing-demo__score">{t("demo.compatible.score")}</p>
          </div>
          <ul className="landing-demo__signals" aria-label={t("demo.compatible.common")}>
            {["night", "pc", "spanish", "noToxic"].map((key) => (
              <li key={key}>{t(`demo.compatible.signals.${key}`)}</li>
            ))}
          </ul>
        </div>
      )}
      {id === "steam" && (
        <div className="landing-demo__steam">
          <span className="landing-demo__steam-login">
            {platformIcons.steam("landing-demo__steam-icon")}
            {t("demo.steam.login")}
          </span>
          <p className="landing-demo__now">
            <span className="landing-demo__live" aria-hidden="true" />
            {t("demo.steam.playing")}
          </p>
          <span className="landing-demo__button">{t("demo.steam.join")}</span>
        </div>
      )}
      {id === "community" && (
        <ul className="landing-demo__community">
          {["guide", "news", "chat"].map((key) => (
            <li key={key}>
              <i className={`pi ${{ guide: "pi-book", news: "pi-megaphone", chat: "pi-comments" }[key]}`} aria-hidden="true" />
              <span>
                <strong>{t(`demo.community.${key}.kind`)}</strong>
                {t(`demo.community.${key}.text`)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </figure>
  );
}
