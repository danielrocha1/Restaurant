import React, { useEffect, useState } from "react";
import Lottie from "lottie-react";
import ramenSushiAnimation from "../assets/Ramen&Sushi.json";
import "./loading.css";

const LoadingScreen = () => {
  const [show, setShow] = useState(false);

  // ⏱️ Delay de 0.75s antes de mostrar o Lottie
  useEffect(() => {
    const timer = setTimeout(() => setShow(true), 750);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="loading-overlay gradient-bg">
      <div className="loader-container">
        {show && (
          <Lottie
            animationData={ramenSushiAnimation}
            loop
            autoplay
            style={{ width: 500, height: 500 }}
          />
        )}
      </div>
    </div>
  );
};

export default LoadingScreen;
