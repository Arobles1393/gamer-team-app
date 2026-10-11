import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { EmptyState } from "../EmptyState";
import PlayerCardSkeleton from "../FindPlayers/PlayerCardSkeleton";
import MatchCard from "./MatchCard";
import { useCompatibleMatches } from "../../hooks";
import { useCurrentUserData } from "../../context";
import "./Matching.css";

// Pestaña "Compatibles contigo" de Buscar jugadores
export default function CompatibleMatches({ user, onShowProfile }) {
  const { t } = useTranslation("matching");
  const navigate = useNavigate();
  const userData = useCurrentUserData();
  const { matches, loading, needsSetup, needsGames, error, retry } = useCompatibleMatches(user);

  // Nombres de mis juegos para las señales ("Valorant")
  const gameNames = useMemo(
    () => Object.fromEntries((userData?.games ?? []).map((game) => [String(game.id), game.name])),
    [userData?.games]
  );

  // Abre Mi perfil en modo edición, en la sección de preferencias
  const goToPreferences = () => navigate("/profile", { state: { editPreferences: true } });

  if (needsSetup) {
    return (
      <div className="match-setup">
        <EmptyState
          icon="pi-sliders-h"
          title={t("setup.title")}
          text={t("setup.text")}
          actionLabel={t("setup.action")}
          onAction={goToPreferences}
        />
      </div>
    );
  }

  if (needsGames) {
    return (
      <EmptyState
        icon="pi-star"
        title={t("noGames.title")}
        text={t("noGames.text")}
        actionLabel={t("noGames.action")}
        onAction={goToPreferences}
      />
    );
  }

  if (error) {
    return (
      <EmptyState
        icon="pi-exclamation-triangle"
        title={t("error.title")}
        text={t("error.text")}
        actionLabel={t("error.action")}
        onAction={retry}
        alert
      />
    );
  }

  if (loading) {
    return (
      <div className="players-grid" aria-busy="true" aria-label={t("compatible.loading")}>
        {Array.from({ length: 6 }, (_, i) => <PlayerCardSkeleton key={i} />)}
      </div>
    );
  }

  if (matches.length === 0) {
    return (
      <EmptyState
        icon="pi-users"
        title={t("empty.title")}
        text={t("empty.text")}
        actionLabel={t("empty.action")}
        onAction={goToPreferences}
      />
    );
  }

  return (
    <>
      <p className="players-count" role="status">
        {t("compatible.count", { count: matches.length })}
      </p>
      <div className="players-grid">
        {matches.map((match) => (
          <MatchCard key={match.id} match={match} gameNames={gameNames} onShowProfile={onShowProfile} />
        ))}
      </div>
    </>
  );
}
