import "./SocialLinks.css";
import { platformIcons } from "../../utils/platformIcons";
import { getPlatform } from "../../utils/getPlatform";
import { getLabel } from "../../utils/getLabel";
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";

export default function SocialLinks({
  links = [],
  isEditing = false,
  onLinksChange
}) {

  const handleChange = (index, value) => {
    const newLinks = [...links];
    newLinks[index] = value;

    onLinksChange?.(newLinks);
  };

  const handleRemove = (index) => {
    const newLinks = links.filter((_, i) => i !== index);

    onLinksChange?.(newLinks);
  };

  const handleAdd = () => {
    onLinksChange?.([...links, ""]);
  };

  return (
    <section className="social-links">
      <h4>Redes sociales</h4>

      {isEditing ? (
        <>
          {links.length > 0 ? (
            links.map((link, index) => (
              <div
                key={index}
                className="social-links-edit-row"
              >
                <InputText
                  value={link}
                  onChange={(e) =>
                    handleChange(index, e.target.value)
                  }
                  placeholder="https://..."
                  style={{ flex: 1 }}
                />

                <Button
                  icon="pi pi-trash"
                  className="p-button-danger p-button-text"
                  onClick={() => handleRemove(index)}
                />
              </div>
            ))
          ) : (
            <p className="social-links-empty">
              No hay links
            </p>
          )}

          <Button
            label="Agregar link"
            icon="pi pi-plus"
            className="p-button-text"
            onClick={handleAdd}
          />
        </>
      ) : (
        <>
          {links.length > 0 ? (
            <div className="gamer-links">
              {links.map((link, index) => {
                const platform = getPlatform(link);

                return (
                  <a
                    key={index}
                    href={link}
                    target="_blank"
                    rel="noreferrer"
                    className="gamer-link"
                  >
                    {platformIcons[platform]?.()}
                    {getLabel(platform)}
                  </a>
                );
              })}
            </div>
          ) : (
            <p className="social-links-empty">
              No hay links
            </p>
          )}
        </>
      )}
    </section>
  );
}