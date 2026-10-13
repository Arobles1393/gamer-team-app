import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "primereact/button";
import { platformIcons } from "../../utils";
import LandingDemo from "./LandingDemo";
import "./Landing.css";

// Las cuatro razones de GamerMatch (PRODUCT.md), como personajes alrededor
// del mando: dos a la izquierda y dos a la derecha. El orden coincide con
// las partes del mando que se encienden (controller3d.js, PART_ORDER)
const REASONS = [
  { id: "parties", icon: "pi-bolt" },
  { id: "compatible", icon: "pi-sliders-h" },
  { id: "steam", icon: "steam" },
  { id: "community", icon: "pi-comments" }
];

// Sin interacción, la selección avanza sola cada AUTO_MS (se detiene al
// tocar, pasar el ratón o enfocar, y no existe con reducir movimiento)
const AUTO_MS = 6000;

const prefersReducedMotion = () =>
  typeof window !== "undefined" && Boolean(window.matchMedia?.("(prefers-reduced-motion: reduce)").matches);

function ReasonIcon({ icon }) {
  if (icon === "steam") return platformIcons.steam("landing-reason__steam");
  return <i className={`pi ${icon}`} aria-hidden="true" />;
}

/**
 * Portada para quien no tiene sesión ("/"): la pantalla de elegir personaje.
 * El mando 3D (three.js, cargado aparte) gira hacia la razón elegida y
 * enciende su botón. Si no hay WebGL, se muestra la imagen fija del mando.
 */
export default function LandingPage() {
  const { t } = useTranslation("landing");
  const navigate = useNavigate();
  const [reducedMotion] = useState(prefersReducedMotion);
  const [selected, setSelected] = useState(0);
  const [autoplay, setAutoplay] = useState(() => !prefersReducedMotion());
  const [hovering, setHovering] = useState(false);
  const [scene3d, setScene3d] = useState("loading"); // loading | ready | failed
  const canvasRef = useRef(null);
  const sceneRef = useRef(null);
  const tabRefs = useRef([]);

  useEffect(() => {
    const previous = document.title;
    document.title = t("pageTitle");
    return () => {
      document.title = previous;
    };
  }, [t]);

  // Mando 3D: three.js solo se descarga aquí (import dinámico)
  useEffect(() => {
    let cancelled = false;
    import("./controller3d")
      .then(async ({ createControllerScene }) => {
        if (cancelled || !canvasRef.current) return;
        try {
          // Resuelve cuando el modelo ha cargado; hasta entonces, la imagen fija
          const controller = await createControllerScene(canvasRef.current, { reducedMotion });
          if (cancelled) {
            controller.dispose();
            return;
          }
          sceneRef.current = controller;
          setScene3d("ready");
        } catch (error) {
          console.error("Sin WebGL o sin modelo: se muestra la imagen fija del mando", error.message);
          setScene3d("failed");
        }
      })
      .catch(() => !cancelled && setScene3d("failed"));
    return () => {
      cancelled = true;
      sceneRef.current?.dispose();
      sceneRef.current = null;
    };
  }, [reducedMotion]);

  useEffect(() => {
    sceneRef.current?.select(selected);
  }, [selected, scene3d]);

  // Avance automático mientras nadie interactúa
  useEffect(() => {
    if (!autoplay || hovering) return undefined;
    const timer = setTimeout(() => setSelected((value) => (value + 1) % REASONS.length), AUTO_MS);
    return () => clearTimeout(timer);
  }, [autoplay, hovering, selected]);

  const choose = useCallback((index) => {
    setAutoplay(false);
    setSelected(index);
  }, []);

  // Pestañas con flechas (patrón de tabs: Inicio/Fin y flechas)
  const handleTabKey = (event, index) => {
    const keys = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };
    let next = null;
    if (event.key in keys) next = (index + keys[event.key] + REASONS.length) % REASONS.length;
    if (event.key === "Home") next = 0;
    if (event.key === "End") next = REASONS.length - 1;
    if (next === null) return;
    event.preventDefault();
    choose(next);
    tabRefs.current[next]?.focus();
  };

  const handlePointer = (event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    sceneRef.current?.setPointer(
      ((event.clientX - rect.left) / rect.width) * 2 - 1,
      ((event.clientY - rect.top) / rect.height) * 2 - 1
    );
  };

  const renderTab = (item, index) => {
    const active = index === selected;
    return (
      <button
        key={item.id}
        ref={(el) => { tabRefs.current[index] = el; }}
        type="button"
        role="tab"
        id={`landing-tab-${item.id}`}
        aria-selected={active}
        aria-controls={`landing-panel-${item.id}`}
        tabIndex={active ? 0 : -1}
        className={`landing-reason${active ? " landing-reason--active" : ""}`}
        onClick={() => choose(index)}
        onKeyDown={(event) => handleTabKey(event, index)}
      >
        <span className="landing-reason__icon"><ReasonIcon icon={item.icon} /></span>
        <span className="landing-reason__text">
          <span className="landing-reason__name">{t(`reasons.${item.id}.name`)}</span>
          <span className="landing-reason__hint">{t(`reasons.${item.id}.hint`)}</span>
        </span>
        {/* Cuánto falta para la siguiente (solo con avance automático) */}
        {active && autoplay && !hovering && <span key={selected} className="landing-reason__timer" aria-hidden="true" />}
      </button>
    );
  };

  return (
    <article className="landing">
      <header className="landing__header">
        <h1 className="landing__title">{t("title")}</h1>
        <p className="landing__lead">{t("lead")}</p>
      </header>

      <section
        className="landing__select"
        aria-label={t("selectLabel")}
        onMouseEnter={() => setHovering(true)}
        onMouseLeave={() => setHovering(false)}
        onFocus={() => setHovering(true)}
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget)) setHovering(false);
        }}
      >
        <div className="landing__stage" onPointerMove={handlePointer}>
          <div className="landing__tabs" role="tablist" aria-label={t("tabsLabel")}>
            {REASONS.map(renderTab)}
          </div>

          <div className={`landing__controller landing__controller--${scene3d}`} aria-hidden="true">
            <img className="landing__poster" src="/landing/controller.png" alt="" />
            <canvas ref={canvasRef} className="landing__canvas" />
          </div>

          {/* Pausar o reanudar el avance automático (bajo el mando) */}
          {!reducedMotion && (
            <button
              type="button"
              className="landing__autoplay"
              onClick={() => setAutoplay((value) => !value)}
            >
              <i className={`pi ${autoplay ? "pi-pause" : "pi-play"}`} aria-hidden="true" />
              {autoplay ? t("autoplay.pause") : t("autoplay.play")}
            </button>
          )}
        </div>

        {/* Las cuatro fichas en la misma celda: la altura es siempre la de la
            más alta y "Crear cuenta" no se mueve al cambiar de razón */}
        <div className="landing__panels">
          {REASONS.map((item, index) => {
            const active = index === selected;
            return (
              <div
                key={item.id}
                id={`landing-panel-${item.id}`}
                role="tabpanel"
                aria-labelledby={`landing-tab-${item.id}`}
                aria-hidden={!active}
                inert={!active}
                className={`landing__panel${active ? " landing__panel--active" : ""}`}
              >
                <div className="landing__panel-text">
                  <h2 className="landing__panel-title">{t(`reasons.${item.id}.title`)}</h2>
                  <p className="landing__panel-body">{t(`reasons.${item.id}.body`)}</p>
                </div>
                <LandingDemo id={item.id} />
              </div>
            );
          })}
        </div>

      </section>

      <div className="landing__actions">
        <Button
          label={t("actions.register")}
          icon="pi pi-user-plus"
          className="gm-btn gm-btn--primary landing__cta"
          onClick={() => navigate("/login", { state: { from: "/", mode: "register" } })}
        />
        <Link to="/explorar" className="landing__secondary">
          <i className="pi pi-th-large" aria-hidden="true" />
          {t("actions.browse")}
        </Link>
        <p className="landing__login">
          {t("actions.haveAccount")}{" "}
          <Link to="/login" state={{ from: "/" }}>{t("actions.login")}</Link>
        </p>
      </div>
    </article>
  );
}
