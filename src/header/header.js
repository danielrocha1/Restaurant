import React, { useEffect, useState } from "react";
import { Layout, Input, Space, Avatar } from "antd";
import { UserOutlined } from "@ant-design/icons";
import Cart from "../cart/cart";
import Favorite from "../favorite/favorite";
import CategoryBar from "../header/categoryBar/categorybar";

import "./header.css";

const { Header } = Layout;
const { Search } = Input;

const AppHeader = () => {
  const [hideHeader, setHideHeader] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);
  const SCROLL_THRESHOLD = 100;

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      if (currentScrollY > lastScrollY && currentScrollY > SCROLL_THRESHOLD) {
        // Scrollando pra baixo E passou do threshold
        setHideHeader(true);
      } else if (currentScrollY < lastScrollY) {
        // Scrollando pra cima
        setHideHeader(false);
      }

      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll);

    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);


  return (
    <>
      {/* Promo Bar */}
      <div className={`promo-bar ${hideHeader ? "header-hidden" : ""}`}>
        🔥 Promoção especial! Frete grátis para compras acima de R$ 100!
      </div>

      <Header className={`header-container ${hideHeader ? "header-hidden" : ""}`}>
        <div className="header-logo">Minha Loja</div>
        <Search placeholder="Buscar produtos..." allowClear className="header-search" />
        <Space className="header-icons">
          <Avatar size="large" icon={<UserOutlined />} className="header-avatar" />
          <Favorite />
          <Cart />
        </Space>
      </Header>

      <CategoryBar  hideHeader={hideHeader}/>
    </>
  );
};

export default AppHeader;
