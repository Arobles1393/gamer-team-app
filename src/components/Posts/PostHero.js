export default function PostHero({ post }) {
  return (
    <div className="hero">
      {post.gameClip ? (
        <video
          className="hero-video"
          src={post.gameClip}
          autoPlay
          loop
          muted
        />
      ) : (
        <div
          className="hero-video"
          style={{
            backgroundImage: `url(${post.image})`,
            backgroundSize: "cover"
          }}
        />
      )}
      <div className="hero-overlay" />
    </div>
  );
}