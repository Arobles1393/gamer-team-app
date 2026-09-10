import { Card } from "primereact/card";
import { Button } from "primereact/button";
import { useGamingNews } from "../../hooks";
import { formatDates } from "../../utils";
import "./GamingNews.css";

export default function GamingNews() {
  const { news, loading } = useGamingNews();

  if (loading) {
    return (
      <div className="news-loading">
        <i className="pi pi-spin pi-spinner" />
        <p>Cargando noticias gamer...</p>
      </div>
    );
  }

  return (
    <div className="gaming-news">

      <h2 className="news-title">
        📰 Noticias Gamer
      </h2>

      <div className="news-grid">

        {news.map((item) => (

          <Card
            key={item.id}
            className="news-card"
          >

            <img
              src={
                item.image ||
                "/imagenotfound.png"
              }
              alt={item.title}
              className="news-image"
            />

            <div className="news-content">

              <h3>
                {item.title}
              </h3>

              <p>
                {item.description}
              </p>

              <div className="news-footer">

                <small>
                  {item.source}
                  {" • "}
                  {formatDates.formatDate(
                    item.publishedAt
                  )}
                </small>

                <Button
                  label="Leer más"
                  icon="pi pi-external-link"
                  className="p-button-sm"
                  onClick={() =>
                    window.open(
                      item.link,
                      "_blank"
                    )
                  }
                />

              </div>

            </div>

          </Card>

        ))}

      </div>

    </div>
  );
}