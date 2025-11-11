import React, { useRef, useEffect } from "react";
import Lottie from "lottie-react";
import ramenSushiAnimation from "./Ramen&Sushi.json";
import "./loading.css";

const LoadingScreen = () => {
  const lottieRef = useRef();

  useEffect(() => {
    if (lottieRef.current) {
      lottieRef.current.setSpeed(0.75); // animação 25% mais lenta
    }
  }, []);

  return (
    <div className="loading-overlay">
      <div className="loader-container">
        <Lottie
          lottieRef={lottieRef}
          animationData={ramenSushiAnimation}
          loop
          autoplay
          style={{ width: 500, height: 500, filter: "invert(1)",  }}
        />
      </div>
    </div>
  );
};

export default LoadingScreen;
