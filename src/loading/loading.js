import React, { useRef, useEffect } from "react";
import Lottie from "lottie-react";
import ramenSushiAnimation from "./Ramen&Sushi.json";
import "./loading.css";

const LoadingScreen = () => {
  const lottieRef = useRef();

  useEffect(() => {
    if (lottieRef.current) {
      lottieRef.current.setSpeed(0.75);
    }
  }, []);

  return (
    <div className="loading-overlay">
      <div className="loader-container">
        <div className="lottie-bg">
          <Lottie
            lottieRef={lottieRef}
            animationData={ramenSushiAnimation}
            loop
            autoplay
            style={{ width: 200, height: 200 }}
          />
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen;
