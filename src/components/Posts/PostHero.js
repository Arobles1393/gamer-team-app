export default function PostHero({ post }) {
  return (
    <div className="hero">
      {post.clip ? (
        <video
          className="hero-video"
          src={post.clip}
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