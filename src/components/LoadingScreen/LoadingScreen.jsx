import React from "react";
import Lottie from "lottie-react";
import animationData from "./Ramen&Sushi.json";
import "./LoadingScreen.css";

/**
 * Componente de tela de carregamento
 * Exibe uma animação Lottie enquanto os dados estão sendo carregados
 */
const LoadingScreen = () => {
  return (
    <div className="loading-overlay">
      <div className="loader-container">
        <div className="lottie-bg">
          <Lottie
            animationData={animationData}
            loop={true}
            style={{ width: 300, height: 300 }}
          />
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen;
