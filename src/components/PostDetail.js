import { useLocation, useParams } from "react-router-dom";

export default function PostDetail() {
  const { state: post } = useLocation();
  const { id } = useParams();

  console.log("POST:", post);
  console.log("ID:", id);

  return (
    <div className="post-detail">  
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
      <div className="post-content">
        <div className="left-panel">
            <img src={post.image} className="game-cover" />
        </div>
        <div className="right-panel">
            <h2>{post.game}</h2>
            <p>{post.content}</p>
        </div>
      </div>  
    </div>
  );
}