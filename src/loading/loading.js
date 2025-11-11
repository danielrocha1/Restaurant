import React from "react";
import Lottie from "lottie-react";
import ramenSushiAnimation from "./Ramen&Sushi.json"; // ajuste o caminho conforme onde você salvou o JSON
import "./loading.css";

const LoadingScreen = () => {
  return (
    <div className="loading-overlay">
      <div className="loader-container">
        <Lottie
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
