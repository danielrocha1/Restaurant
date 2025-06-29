// src/components/LoadingScreen.jsx
import React from 'react';
import { PuffLoader } from 'react-spinners';
import './loading.css';

const LoadingScreen = () => {
  return (
    <div className="loading-overlay">
      <div className="pulse-circle"></div>
      <div className="loader-container">
        <PuffLoader color="#36d7b7" size={80} />
      </div>
    </div>
  );
};

export default LoadingScreen;
