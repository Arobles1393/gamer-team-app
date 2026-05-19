import { useLocation, useParams } from "react-router-dom";
import { useEffect, useState } from "react";

export default function PostDetail() {
  const { state: post } = useLocation();
  const { id } = useParams();

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
            {post.logo ? (
              <img src={post.logo} alt={post.game} className="game-logo" />
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