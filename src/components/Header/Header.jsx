import React, { useEffect, useState } from "react";
import { Space } from "antd";
import Cart from "../Cart/Cart";
import CategoryBar from "../CategoryBar/CategoryBar";
import "./Header.css";

/**
 * Componente de cabeçalho
 * Exibe barra de promoções, carrinho e barra de categorias
 */
const Header = () => {
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

      // A lógica de esconder/mostrar será mantida para a nova barra de categorias no topo
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
      {/* 1. Barra de Promoções Superior */}
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

      {/* 3. CategoryBar no Bottom */}
      <div className={`bottom-bar-container ${hideHeader ? "bottom-bar-hidden" : ""}`}>
        <CategoryBar />
      </div>

      {/* 4. Barra de Promoções Inferior (desabilitada) */}
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

export default Header;
