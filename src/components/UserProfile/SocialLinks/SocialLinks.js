//import "./SocialLinks.css"; descomentar cuando en el index.css se quiten los estilos que ya estan en el archivo SocialLinks.css

import { platformIcons } from "../../../utils/platformIcons";
import { getPlatform } from "../../../utils/getPlatform";
import { getLabel } from "../../../utils/getLabel";

export default function SocialLinks({ links }) {
  return (
    <section className="social-links">
      <h4>Redes sociales</h4>

      {links?.length > 0 ? (
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
    </section>
  );
}