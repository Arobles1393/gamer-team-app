import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "primereact/button";
import { MultiSelect } from "primereact/multiselect";
import { ProfileSection } from "../ProfileSection";
import ChoiceChips from "./ChoiceChips";
import {
  GROUP_SIZES,
  MATCH_SKILL_LEVELS,
  MAX_MATCH_LANGUAGES,
  MIC_OPTIONS,
  PLAYER_VALUES,
  TIME_BLOCKS,
  getLanguageLabel,
  getLanguageOptions,
  hasMatchPreferences,
  platforms
} from "../../constants";
import "./Matching.css";

export const MATCH_PREFERENCES_ID = "preferencias";

const platformLabel = (value) => platforms.find((platform) => platform.value === value)?.label ?? value;

function Group({ title, hint, children }) {
  return (
    <div className="match-prefs__group">
      <h3 className="match-prefs__label">{title}</h3>
      {hint && <p className="match-prefs__hint">{hint}</p>}
      {children}
    </div>
  );
}

// Resumen fuera del modo edición: solo lo que el usuario eligió
function PreferencesSummary({ preferences }) {
  const { t } = useTranslation("matching");

  const rows = [
    { key: "schedule", items: preferences.schedule.map((value) => t(`time.${value}`)) },
    { key: "platforms", items: preferences.platforms.map(platformLabel) },
    { key: "mic", items: typeof preferences.requiresMic === "boolean" ? [t(`mic.${preferences.requiresMic ? "yes" : "no"}`)] : [] },
    { key: "groupSize", items: preferences.groupSize ? [t(`group.${preferences.groupSize}`)] : [] },
    { key: "skillLevel", items: preferences.skillLevel ? [t(`level.${preferences.skillLevel}`)] : [] },
    { key: "languages", items: preferences.languages.map((value) => getLanguageLabel(value) ?? value) },
    { key: "values", items: preferences.values.map((value) => t(`values.${value}`)) }
  ].filter((row) => row.items.length > 0);

  return (
    <dl className="match-prefs__summary">
      {rows.map((row) => (
        <div key={row.key} className="match-prefs__row">
          <dt>{t(`prefs.${row.key}`)}</dt>
          <dd>
            <ul className="match-prefs__tags">
              {row.items.map((item) => (
                <li key={item} className="match-prefs__tag">{item}</li>
              ))}
            </ul>
          </dd>
        </div>
      ))}
    </dl>
  );
}

/**
 * Mis preferencias de juego (Mi perfil). Son privadas: no aparecen en el
 * perfil que ven los demás, solo se usan para "Compatibles contigo".
 * Se guardan con el botón Guardar del perfil (useProfileForm).
 */
export default function MatchPreferences({ preferences, isEditing, onChange, onConfigure }) {
  const { t, i18n } = useTranslation("matching");
  const configured = hasMatchPreferences(preferences);

  const languageOptions = useMemo(
    () => getLanguageOptions(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [i18n.resolvedLanguage]
  );

  const set = (field) => (value) => onChange({ ...preferences, [field]: value });

  const options = {
    schedule: TIME_BLOCKS.map(({ value }) => ({ value, label: t(`time.${value}`) })),
    platforms: platforms.map(({ value, label }) => ({ value, label })),
    mic: MIC_OPTIONS.map(({ value, key }) => ({ value, label: t(`mic.${key}`) })),
    groupSize: GROUP_SIZES.map((value) => ({ value, label: t(`group.${value}`) })),
    skillLevel: MATCH_SKILL_LEVELS.map((value) => ({ value, label: t(`level.${value}`) })),
    values: PLAYER_VALUES.map(({ value }) => ({ value, label: t(`values.${value}`) }))
  };

  return (
    <div id={MATCH_PREFERENCES_ID} className="match-prefs-anchor">
      <ProfileSection title={t("prefs.title")} icon="pi-sliders-h" className="match-prefs">
        <p className="match-prefs__private">
          <i className="pi pi-lock" aria-hidden="true" />
          {t("prefs.private")}
        </p>

        {!isEditing && (
          configured ? (
            <PreferencesSummary preferences={preferences} />
          ) : (
            <div className="match-prefs__empty">
              <p className="gm-section__empty">{t("prefs.empty")}</p>
              <Button
                label={t("prefs.configure")}
                icon="pi pi-sliders-h"
                className="gm-btn gm-btn--ghost"
                onClick={onConfigure}
              />
            </div>
          )
        )}

        {isEditing && (
          <div className="match-prefs__form">
            <Group title={t("prefs.schedule")}>
              <ChoiceChips label={t("prefs.schedule")} options={options.schedule} value={preferences.schedule} multiple onChange={set("schedule")} />
            </Group>
            <Group title={t("prefs.platforms")}>
              <ChoiceChips label={t("prefs.platforms")} options={options.platforms} value={preferences.platforms} multiple onChange={set("platforms")} />
            </Group>
            <Group title={t("prefs.mic")}>
              <ChoiceChips label={t("prefs.mic")} options={options.mic} value={preferences.requiresMic} onChange={set("requiresMic")} />
            </Group>
            <Group title={t("prefs.groupSize")}>
              <ChoiceChips label={t("prefs.groupSize")} options={options.groupSize} value={preferences.groupSize} onChange={set("groupSize")} />
            </Group>
            <Group title={t("prefs.skillLevel")}>
              <ChoiceChips label={t("prefs.skillLevel")} options={options.skillLevel} value={preferences.skillLevel} onChange={set("skillLevel")} />
            </Group>
            <Group title={t("prefs.languages")}>
              <MultiSelect
                inputId="match-languages"
                value={preferences.languages}
                options={languageOptions}
                optionLabel="label"
                optionValue="value"
                onChange={(e) => set("languages")(e.value ?? [])}
                selectionLimit={MAX_MATCH_LANGUAGES}
                showSelectAll={false}
                display="chip"
                filter
                placeholder={t("prefs.languagesPlaceholder", { count: MAX_MATCH_LANGUAGES })}
                aria-label={t("prefs.languages")}
                className="gm-select match-prefs__languages"
                panelClassName="gm-panel"
              />
            </Group>
            <Group title={t("prefs.values")} hint={t("prefs.valuesHint")}>
              <ChoiceChips label={t("prefs.values")} options={options.values} value={preferences.values} multiple onChange={set("values")} />
            </Group>
          </div>
        )}
      </ProfileSection>
    </div>
  );
}
