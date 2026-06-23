import { useEffect, useState } from "react";
import { Card } from "primereact/card";
import { Button } from "primereact/button";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  limit
} from "firebase/firestore";
import { db } from "../firebase/config";
import "./GamingNews.css";

export default function GamingNews() {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {

    const q = query(
      collection(db, "gaming_news"),
      orderBy("publishedAt", "desc"),
      limit(20)
    );

    const unsubscribe =
      onSnapshot(q, (snapshot) => {

        const data =
          snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));

        setNews(data);
        setLoading(false);

      });

    return () => unsubscribe();

  }, []);

  const formatDate = (timestamp) => {

    if (!timestamp) return "";

    const date =
      timestamp.toDate
        ? timestamp.toDate()
        : new Date(timestamp);

    return date.toLocaleDateString(
      "es-MX",
      {
        day: "numeric",
        month: "short",
        year: "numeric"
      }
    );
  };

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
                  {formatDate(
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