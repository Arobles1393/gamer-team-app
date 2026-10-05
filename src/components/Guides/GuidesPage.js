import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Button } from "primereact/button";
import { Dropdown } from "primereact/dropdown";
import { Skeleton } from "primereact/skeleton";
import { EmptyState } from "../EmptyState";
import { useApprovedGuides, useRequireVerified } from "../../hooks";
import { useCurrentUser } from "../../context";
import { getIntlLocale } from "../../i18n";
import GuideCard from "./GuideCard";
import "../Posts/Feed.css";
import "./Guides.css";

function GuideCardSkeleton() {
  return (
    <div className="guide-card guide-card--skeleton" aria-hidden="true">
      <Skeleton height="100%" className="guide-card__cover" />
      <span className="guide-card__body">
        <Skeleton width="40%" height="12px" />
        <Skeleton width="85%" height="18px" />
        <Skeleton width="60%" height="14px" />
      </span>
    </div>
  );
}

// /guias: guías aprobadas, filtrables por juego. Se ven sin sesión;
// escribir una pide iniciar sesión.
export default function GuidesPage() {
  const { t, i18n } = useTranslation("guides");
  const navigate = useNavigate();
  const user = useCurrentUser();
  const requireVerified = useRequireVerified(user);
  const [game, setGame] = useState(null);
  // Juegos con guías aprobadas: se aprenden de la lista sin filtro
  const [knownGames, setKnownGames] = useState([]);

  const { guides, loading, error, retry } = useApprovedGuides(user, game);

  useEffect(() => {
    if (game || loading) return;
    setKnownGames([...new Set(guides.map((guide) => guide.game))]);
  }, [game, loading, guides]);

  const gameOptions = useMemo(
    () => [
      { label: t("allGames"), value: null },
      ...[...knownGames]
        .sort((a, b) => a.localeCompare(b, getIntlLocale(), { sensitivity: "base" }))
        .map((name) => ({ label: name, value: name }))
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [knownGames, i18n.resolvedLanguage]
  );

  const handleWrite = () => {
    if (requireVerified()) navigate("/guias/nueva");
  };

  const renderResults = () => {
    if (error) {
      return (
        <EmptyState
          icon="pi-exclamation-triangle"
          title={t("empty.errorTitle")}
          text={t("empty.errorText")}
          actionLabel={t("common:actions.retry")}
          onAction={retry}
          alert
        />
      );
    }

    if (loading) {
      return (
        <div className="guide-grid" aria-busy="true" aria-label={t("loading")}>
          {Array.from({ length: 6 }, (_, i) => <GuideCardSkeleton key={i} />)}
        </div>
      );
    }

    if (guides.length === 0) {
      return game ? (
        <EmptyState
          icon="pi-filter-slash"
          title={t("empty.filteredTitle")}
          text={t("empty.filteredText")}
          actionLabel={t("common:actions.clearFilters")}
          onAction={() => setGame(null)}
        />
      ) : (
        <EmptyState
          icon="pi-book"
          title={t("empty.title")}
          text={t("empty.text")}
          actionLabel={t("write")}
          onAction={handleWrite}
        />
      );
    }

    return (
      <div className="guide-grid">
        {guides.map((guide) => <GuideCard key={guide.id} guide={guide} />)}
      </div>
    );
  };

  return (
    <div className="feed guides">
      <header className="feed-header">
        <div className="feed-header__titles">
          <span className="feed-header__eyebrow">{t("eyebrow")}</span>
          <h1 className="feed-header__title">{t("title")}</h1>
        </div>
        <div className="feed-header__actions">
          <Button
            icon="pi pi-pencil"
            label={t("write")}
            className="gm-btn gm-btn--primary"
            onClick={handleWrite}
          />
        </div>
      </header>

      {knownGames.length > 0 && (
        <div className="feed-filters" role="group" aria-label={t("filterByGame")}>
          <Dropdown
            value={game}
            options={gameOptions}
            onChange={(e) => setGame(e.value)}
            optionLabel="label"
            optionValue="value"
            placeholder={t("allGames")}
            className="feed-chip feed-chip--select"
            panelClassName="feed-select-panel"
            aria-label={t("filterByGame")}
          />
        </div>
      )}

      {renderResults()}
    </div>
  );
}
