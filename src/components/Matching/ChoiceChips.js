// Chips para elegir opciones del formulario de preferencias.
// multiple: varias a la vez (role checkbox); si no, una sola (role radio).
// options: [{ value, label }]
export default function ChoiceChips({ label, options, value, multiple = false, onChange }) {
  const isSelected = (option) =>
    multiple ? value.includes(option.value) : value === option.value;

  const toggle = (option) => {
    if (!multiple) {
      onChange(option.value);
      return;
    }

    onChange(
      value.includes(option.value)
        ? value.filter((item) => item !== option.value)
        : [...value, option.value]
    );
  };

  return (
    <div className="match-chips" role={multiple ? "group" : "radiogroup"} aria-label={label}>
      {options.map((option) => {
        const selected = isSelected(option);

        return (
          <button
            key={String(option.value)}
            type="button"
            role={multiple ? "checkbox" : "radio"}
            aria-checked={selected}
            className={`match-chip${selected ? " match-chip--active" : ""}`}
            onClick={() => toggle(option)}
          >
            {multiple && (
              <i className={`pi ${selected ? "pi-check" : "pi-plus"}`} aria-hidden="true" />
            )}
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
