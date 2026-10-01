import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { AutoComplete } from "primereact/autocomplete";
import { InputTextarea } from "primereact/inputtextarea";
import { Button } from "primereact/button";
import { Calendar } from "primereact/calendar";
import { Dropdown } from "primereact/dropdown";
import { useGameSearch, useCreatePost } from "../../hooks";
import { SKILL_LEVELS, getLanguageOptions, platforms } from "../../constants";
import { getPlatformKey, platformIcons, platformLabels } from "../../utils";
import { useCurrentUser, useCurrentUserData } from "../../context";
import "./CreatePost.css";

const MULTI = "multi";
const MIN_PLAYERS = 1;
const MAX_PLAYERS = 20;
const MAX_DESCRIPTION = 300;

// "Cuándo": por defecto ahora mismo; programar muestra el calendario
const WHEN_OPTIONS = [
  { value: false, labelKey: "create.now", icon: "pi-bolt" },
  { value: true, labelKey: "create.schedule", icon: "pi-calendar" }
];

const suggestionTemplate = (item) => (
  <div className="create-post__suggestion">
    {item.image ? (
      <img src={item.image} alt="" className="create-post__suggestion-img" />
    ) : (
      <span className="create-post__suggestion-img" aria-hidden="true" />
    )}
    <span>{item.label}</span>
  </div>
);

// "PC · PS5 · XBOX" a partir de los nombres de plataforma de RAWG
const getAvailableLabel = (gamePlatforms) => {
  const keys = [...new Set((gamePlatforms ?? []).map(getPlatformKey).filter(Boolean))];
  return keys.map((key) => platformLabels[key]).join(" · ");
};

function Field({ id, label, error, hint, children }) {
  return (
    <div className="gm-field create-post__field">
      <span className="gm-field__label" id={`${id}-label`}>{label}</span>
      {children}
      {hint && !error && <p className="gm-field__hint">{hint}</p>}
      {error && <p className="gm-field__error" role="alert">{error}</p>}
    </div>
  );
}

function SelectedGame({ name, image, gamePlatforms, locked, onClear }) {
  const { t } = useTranslation("posts");
  const available = getAvailableLabel(gamePlatforms);

  return (
    <div className="create-post__game">
      <span className="create-post__game-cover">
        {image && <img src={image} alt="" />}
      </span>
      <span className="create-post__game-info">
        <span className="create-post__game-name">{name}</span>
        <span className="create-post__game-meta">
          {locked
            ? t("create.gameLocked")
            : available
              ? t("create.gameAvailable", { platforms: available })
              : t("create.gameSelected")}
        </span>
      </span>
      {!locked && (
        <button
          type="button"
          className="create-post__game-clear"
          aria-label={t("create.changeGame")}
          onClick={onClear}
        >
          <i className="pi pi-times" aria-hidden="true" />
        </button>
      )}
    </div>
  );
}

export default function CreatePost({ editingPost, onClose, onSuccess, onError }) {
  const { t, i18n } = useTranslation("posts");
  const user = useCurrentUser();
  const userData = useCurrentUserData();
  const [submitted, setSubmitted] = useState(false);
  const isEditing = Boolean(editingPost);

  const {
    game,
    setGame,
    players,
    setPlayers,
    comments,
    setComments,
    platform,
    setPlatform,
    multiplatform,
    setMultiplatform,
    scheduled,
    setScheduled,
    scheduledAt,
    setScheduledAt,
    requiresMic,
    setRequiresMic,
    skillLevel,
    setSkillLevel,
    language,
    setLanguage,
    loading,
    handleSubmit
  } = useCreatePost({
    user,
    authorRegion: userData?.region,
    editingPost,
    onSuccess,
    onError
  });

  const { suggestions, handleSearch } = useGameSearch();

  const gameName = (typeof game === "string" ? game : game?.value ?? "").trim();

  // Juego elegido de la lista de RAWG (o el del post, al editar)
  const selectedGame = isEditing
    ? { name: editingPost.game, image: editingPost.image, platforms: editingPost.platforms }
    : typeof game === "object" && game?.value
      ? { name: game.value, image: game.image, platforms: game.platforms }
      : null;

  const playerCount = Number(players) || MIN_PLAYERS;
  const selectedPlatform = multiplatform ? MULTI : platform;
  const description = comments ?? "";

  const errors = {
    game: !gameName && t("create.errors.game"),
    platform: !selectedPlatform && t("create.errors.platform"),
    description: !description.trim() && t("create.errors.description"),
    // Que sea futura lo valida useCreatePost (con aviso)
    schedule: scheduled && !scheduledAt && t("create.errors.schedule")
  };

  // Nombres de idioma en el idioma de la interfaz
  const languageOptions = useMemo(() => getLanguageOptions(), [i18n.resolvedLanguage]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSelectPlatform = (value) => {
    setMultiplatform(value === MULTI);
    setPlatform(value === MULTI ? "" : value);
  };

  const onSubmit = (event) => {
    event.preventDefault();
    setSubmitted(true);

    if (Object.values(errors).some(Boolean)) return;

    handleSubmit(event);
  };

  const platformOptions = [
    ...platforms,
    { label: t("create.multiplatform"), value: MULTI }
  ];

  return (
    <form className="gm-form create-post" onSubmit={onSubmit} noValidate>
      <Field id="create-game" label={t("create.game")} error={submitted && errors.game}>
        {selectedGame ? (
          <SelectedGame
            name={selectedGame.name}
            image={selectedGame.image}
            gamePlatforms={selectedGame.platforms}
            locked={isEditing}
            onClear={() => setGame("")}
          />
        ) : (
          <AutoComplete
            inputId="create-game"
            value={game}
            suggestions={suggestions}
            completeMethod={handleSearch}
            onChange={(e) => setGame(e.value)}
            field="value"
            itemTemplate={suggestionTemplate}
            placeholder={t("create.gamePlaceholder")}
            aria-labelledby="create-game-label"
            className="gm-autocomplete"
            inputClassName={`gm-input${submitted && errors.game ? " gm-input--invalid" : ""}`}
            panelClassName="gm-panel"
            autoFocus
          />
        )}
      </Field>

      <Field id="create-platform" label={t("create.platform")} error={submitted && errors.platform}>
        <div
          className="create-post__platforms"
          role="radiogroup"
          aria-labelledby="create-platform-label"
        >
          {platformOptions.map(({ label, value }) => {
            const active = selectedPlatform === value;

            return (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={active}
                className={`create-post__platform${active ? " create-post__platform--active" : ""}`}
                onClick={() => handleSelectPlatform(value)}
              >
                {value === MULTI ? (
                  <i className="pi pi-th-large" aria-hidden="true" />
                ) : (
                  platformIcons[value]?.("create-post__platform-icon")
                )}
                {label}
              </button>
            );
          })}
        </div>
      </Field>

      <Field
        id="create-details"
        label={t("create.details")}
        hint={t("create.detailsHint")}
      >
        <div className="create-post__details">
          {/* Sin tocar = sin especificar (null), no "no hace falta" */}
          <button
            type="button"
            role="switch"
            aria-checked={requiresMic === true}
            className={`create-post__platform${requiresMic ? " create-post__platform--active" : ""}`}
            onClick={() => setRequiresMic(requiresMic ? null : true)}
          >
            <i className="pi pi-microphone" aria-hidden="true" />
            {t("create.micRequired")}
          </button>

          <div className="create-post__platforms" role="radiogroup" aria-label={t("create.level")}>
            {SKILL_LEVELS.map(({ value }) => {
              const active = skillLevel === value;

              return (
                <button
                  key={value}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  className={`create-post__platform${active ? " create-post__platform--active" : ""}`}
                  // Clic en el activo lo quita (sin especificar)
                  onClick={() => setSkillLevel(active ? null : value)}
                >
                  <i className={`pi ${value === "competitive" ? "pi-trophy" : "pi-face-smile"}`} aria-hidden="true" />
                  {t(`skill.${value}`)}
                </button>
              );
            })}
          </div>

          <Dropdown
            inputId="create-language"
            value={language}
            options={languageOptions}
            onChange={(e) => setLanguage(e.value ?? null)}
            optionLabel="label"
            optionValue="value"
            placeholder={t("create.languagePlaceholder")}
            filter
            filterPlaceholder={t("moreFilters.searchLanguage")}
            emptyFilterMessage={t("moreFilters.noLanguage")}
            showClear
            aria-label={t("create.languageLabel")}
            className="gm-select create-post__language"
            panelClassName="gm-panel"
          />
        </div>
      </Field>

      <Field
        id="create-players"
        label={t("create.players")}
        hint={t("create.playersHint")}
      >
        <div className="create-post__stepper" role="group" aria-labelledby="create-players-label">
          <button
            type="button"
            className="create-post__stepper-btn"
            aria-label={t("create.fewerPlayers")}
            disabled={playerCount <= MIN_PLAYERS}
            onClick={() => setPlayers(playerCount - 1)}
          >
            <i className="pi pi-minus" aria-hidden="true" />
          </button>
          <span className="create-post__stepper-value" aria-live="polite">
            {playerCount}
            <span className="create-post__stepper-unit">
              {t("create.playerUnit", { count: playerCount })}
            </span>
          </span>
          <button
            type="button"
            className="create-post__stepper-btn"
            aria-label={t("create.morePlayers")}
            disabled={playerCount >= MAX_PLAYERS}
            onClick={() => setPlayers(playerCount + 1)}
          >
            <i className="pi pi-plus" aria-hidden="true" />
          </button>
        </div>
      </Field>

      <Field
        id="create-when"
        label={t("create.when")}
        error={submitted && errors.schedule}
        hint={scheduled ? t("create.scheduleHint") : undefined}
      >
        <div className="create-post__platforms" role="radiogroup" aria-labelledby="create-when-label">
          {WHEN_OPTIONS.map(({ value, labelKey, icon }) => {
            const active = scheduled === value;

            return (
              <button
                key={labelKey}
                type="button"
                role="radio"
                aria-checked={active}
                className={`create-post__platform${active ? " create-post__platform--active" : ""}`}
                onClick={() => setScheduled(value)}
              >
                <i className={`pi ${icon}`} aria-hidden="true" />
                {t(labelKey)}
              </button>
            );
          })}
        </div>

        {scheduled && (
          <Calendar
            inputId="create-when-date"
            value={scheduledAt}
            onChange={(e) => setScheduledAt(e.value)}
            showTime
            hourFormat="24"
            minDate={new Date()}
            dateFormat="dd/mm/yy"
            placeholder={t("create.datePlaceholder")}
            showIcon
            readOnlyInput
            aria-labelledby="create-when-label"
            className="create-post__calendar"
            inputClassName={`gm-input${submitted && errors.schedule ? " gm-input--invalid" : ""}`}
            panelClassName="gm-panel create-post__calendar-panel"
          />
        )}
      </Field>

      <Field id="create-description" label={t("create.description")} error={submitted && errors.description}>
        <InputTextarea
          id="create-description"
          value={description}
          onChange={(e) => setComments(e.target.value)}
          placeholder={t("create.descriptionPlaceholder")}
          aria-labelledby="create-description-label"
          rows={4}
          autoResize
          maxLength={MAX_DESCRIPTION}
          className={`gm-input${submitted && errors.description ? " gm-input--invalid" : ""}`}
        />
        <p className="gm-field__hint create-post__counter">
          {description.length}/{MAX_DESCRIPTION}
        </p>
      </Field>

      <div className="create-post__footer">
        <Button
          type="button"
          label={t("common:actions.cancel")}
          className="gm-btn gm-btn--ghost"
          onClick={onClose}
          disabled={loading}
        />
        <Button
          type="submit"
          label={loading ? t("create.publishing") : isEditing ? t("create.submitEdit") : t("create.submitNew")}
          icon={isEditing ? "pi pi-check" : "pi pi-send"}
          className="gm-btn gm-btn--primary"
          loading={loading}
        />
      </div>
    </form>
  );
}
