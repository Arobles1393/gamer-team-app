import { Suspense, lazy, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Toast } from "primereact/toast";
import { EmptyState } from "../EmptyState";
import CommunityGameFilter from "./CommunityGameFilter";
import CommunityBuildingState from "./CommunityBuildingState";
import CommunitySkeleton from "./CommunitySkeleton";
import CountryRankList, { sortCountries } from "./CountryRankList";
import CountryPanel from "./CountryPanel";
import { useCommunityStats } from "../../hooks";
import "../Posts/Feed.css";
import "./Community.css";

// d3-geo y el mapa (105 KB) solo se descargan al abrir esta página
const WorldMap = lazy(() => import("./WorldMap"));

/**
 * /comunidad: cuántos jugadores activos hay por país (solo conteos
 * agregados de la Cloud Function getCommunityStats, nunca usuarios).
 */
export default function CommunityPage() {
  const { t, i18n } = useTranslation("community");
  const toast = useRef(null);
  const [game, setGame] = useState(null);
  const [selectedCode, setSelectedCode] = useState(null);
  // En pantallas chicas la lista es la vista principal; el mapa, opcional
  const [mobileView, setMobileView] = useState("list");

  const { data, loading, error, refetch } = useCommunityStats(game?.id ?? null);
  const countries = useMemo(() => data?.countries ?? {}, [data]);
  // Los nombres (y su orden alfabético) dependen del idioma
  const rows = useMemo(
    () => sortCountries(countries),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [countries, i18n.resolvedLanguage]
  );
  const minCount = data?.minCount ?? 5;
  const ready = Boolean(data?.ready);

  // Si el país elegido deja de tener actividad (otro juego, refresco), se cierra
  useEffect(() => {
    if (selectedCode && !countries[selectedCode]) setSelectedCode(null);
  }, [countries, selectedCode]);

  // Error en un refresco con datos ya visibles: aviso sin quitar el mapa
  useEffect(() => {
    if (error && data) {
      toast.current?.show({ severity: "error", summary: t("common:status.error"), detail: t("error.toast"), life: 3000 });
    }
  }, [error, data, t]);

  const toggleCountry = (code) => setSelectedCode((current) => (current === code ? null : code));

  const renderContent = () => {
    if (loading && !data) return <CommunitySkeleton />;

    if (error && !data) {
      return (
        <EmptyState
          icon="pi-exclamation-triangle"
          title={t("error.title")}
          text={t("error.text")}
          actionLabel={t("common:actions.retry")}
          onAction={refetch}
          alert
        />
      );
    }

    if (!ready) {
      return <CommunityBuildingState gameName={game?.name} onShowAll={() => setGame(null)} />;
    }

    return (
      <>
        <div className="community-views" role="group" aria-label={t("view.label")}>
          {["list", "map"].map((view) => (
            <button
              key={view}
              type="button"
              className={`feed-chip${mobileView === view ? " feed-chip--active" : ""}`}
              aria-pressed={mobileView === view}
              onClick={() => setMobileView(view)}
            >
              <i className={`pi ${view === "list" ? "pi-list" : "pi-map"}`} aria-hidden="true" />
              {t(`view.${view}`)}
            </button>
          ))}
        </div>

        <div className={`community-layout community-layout--${mobileView}`} aria-busy={loading}>
          <div className="community-map">
            <Suspense fallback={<div className="community-map__loading" />}>
              <WorldMap countries={countries} selectedCode={selectedCode} onSelect={toggleCountry} />
            </Suspense>
          </div>

          <div className="community-side">
            {selectedCode && countries[selectedCode] && (
              <CountryPanel
                code={selectedCode}
                country={countries[selectedCode]}
                minCount={minCount}
                onClose={() => setSelectedCode(null)}
              />
            )}
            <CountryRankList rows={rows} minCount={minCount} selectedCode={selectedCode} onSelect={toggleCountry} />
          </div>
        </div>
      </>
    );
  };

  return (
    <div className="feed community">
      <header className="feed-header">
        <div className="feed-header__titles">
          <span className="feed-header__eyebrow">{t("eyebrow")}</span>
          <h1 className="feed-header__title">{t("title")}</h1>
          {ready && (
            <p className="community__total" role="status">
              <span className="community__live" aria-hidden="true" />
              {t(data.approximate ? "activeNowApprox" : "activeNow", { count: data.total })}
            </p>
          )}
        </div>
      </header>

      <CommunityGameFilter
        game={game}
        onChange={(next) => {
          setGame(next);
          setSelectedCode(null);
        }}
      />

      {renderContent()}

      <p className="community__privacy">
        <i className="pi pi-lock" aria-hidden="true" />
        {t("privacy")}
      </p>

      <Toast ref={toast} />
    </div>
  );
}
