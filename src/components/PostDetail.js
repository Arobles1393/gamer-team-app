import { useLocation, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { httpsCallable } from "firebase/functions";
import { functions } from "../firebase/config";

export default function PostDetail() {
  const { state: post } = useLocation();
  const { id } = useParams();
  const [logo, setLogo] = useState(null);
  const getGameLogo = httpsCallable(
    functions,
    "getGameLogo"
  );

  useEffect(() => {
    async function fetchLogo() {

      if (!post?.game) return;

      const logoUrl = await getGameLogo({ gameName: post.game });
      console.log("Logo URL:", logoUrl.data.logo);
      setLogo(logoUrl);
    }
    fetchLogo();
  }, [post]);

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
            {logo ? (
              <img src={logo.data.logo} alt={post.game} className="game-logo" />
            ) : (
              <h2>{post.game}</h2>
            )}
        </div>
        <div className="right-panel">
            
        </div>
      </div>  
    </div>
  );
}