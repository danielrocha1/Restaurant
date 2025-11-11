import React, { useRef, useEffect } from "react";
import Lottie from "lottie-react";
import ramenSushiAnimation from "./Ramen&Sushi.json";
import "./loading.css";

const LoadingScreen = () => {
  const lottieRef = useRef();

  // 🎵 Define a velocidade da animação
  useEffect(() => {
    if (lottieRef.current) {
      lottieRef.current.setSpeed(0.75); // velocidade 75%
    }
  }, []);

  return (
    <div className="loading-overlay gradient-bg">
      <div className="loader-container">
        <Lottie
          lottieRef={lottieRef}
          animationData={ramenSushiAnimation}
          loop
          autoplay
          style={{ width: 200, height: 200 }}
        />
      </div>
    </div>
  );
};

export default LoadingScreen;
