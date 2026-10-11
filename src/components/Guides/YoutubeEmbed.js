import { youtubeEmbedUrl } from "../../utils";

// Video de YouTube desde youtube-nocookie.com (sin cookies de seguimiento
// hasta que se reproduce). videoId ya viene validado (extractYoutubeId).
export default function YoutubeEmbed({ videoId, title }) {
  if (!videoId) return null;

  return (
    <div className="guide-video">
      <iframe
        src={youtubeEmbedUrl(videoId)}
        title={title}
        loading="lazy"
        referrerPolicy="strict-origin-when-cross-origin"
        allow="accelerometer; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
      />
    </div>
  );
}
