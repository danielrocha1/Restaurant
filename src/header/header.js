import React, { useEffect, useState } from "react";
// ❌ Corrigido: Removida a importação de 'Layout'
import { Space } from "antd"; 
import Cart from "../cart/cart";
// ✅ Corrigido: Ajuste o caminho para CategoryBar. Se categorybar.js está em uma subpasta, o caminho deve ser assim:
import CategoryBarMui from "../header/categoryBar/categorybar";
import Logo from "../logo.png";
import "./header.css";

const AppHeader = () => {
  const [hideHeader, setHideHeader] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);
  const SCROLL_THRESHOLD = 80;

  const promoMessages = [
    "🎉 Promoção: Na compra de 2 Temakis, ganhe 1 refrigerante!",
    "🍣 Sashimi em dobro toda terça!",
    "🤑 Akiro sushi tem o melhor Uramaki e Gyoza da Região, aproveite!!",
  ];

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      if (currentScrollY > lastScrollY && currentScrollY > SCROLL_THRESHOLD) {
        setHideHeader(true);
      } else if (currentScrollY < lastScrollY) {
        setHideHeader(false);
      }

      setLastScrollY(currentScrollY);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  return (
    <>
      {/* 1. Barra de Promoções Superior (Mantida) */}
      <div className="promo-bar-container top">
        <div className="promo-bar">
          <div className="promo-bar-track">
            {promoMessages.map((msg, index) => (
              <span key={index} className="promo-bar-message">
                {msg}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* 2. Cart flutuante no topo */}
      <div className="cart-floating-top">
        <Space className="header-icons">
          <Cart />
        </Space>
      </div>

      {/* 3. Logo e CategoryBar no Bottom */}
      <div className={`bottom-bar-container ${hideHeader ? "bottom-bar-hidden" : ""}`}>
        <CategoryBarMui />
      </div>

      {/* 4. Barra de Promoções Inferior */}
      <div className="promo-bar-container bottom">
        <div className="promo-bar">
          <div className="promo-bar-track">
            {promoMessages.map((msg, index) => (
              <span key={index} className="promo-bar-message">
                {msg}
              </span>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default AppHeader;