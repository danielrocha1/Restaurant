import React, { useEffect, useState } from "react";
import { Layout, Space } from "antd";
import Cart from "../cart/cart";
import CategoryBar from "../header/categoryBar/categorybar";

import Logo from "../logo.png";

import "./header.css";

const { Header } = Layout;

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
    <div className="promo-bar-container">
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

      <Header className={"header-container"}>
        <img alt="logo" src={Logo} className="header-logo" />
        <Space className="header-icons">
          <Cart />
        </Space>
      </Header>

      <CategoryBar hideHeader={hideHeader} />
    </>
  );
};

export default AppHeader;
