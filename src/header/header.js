import React, { useEffect, useState } from "react";
import { Layout, Space, } from "antd";
import Cart from "../cart/cart";
import CategoryBar from "../header/categoryBar/categorybar";

import "./header.css";

const { Header } = Layout;

const AppHeader = () => {
  const [hideHeader, setHideHeader] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);
  const SCROLL_THRESHOLD = 80;

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
      <div className={"promo-bar "}>
      <span style={{padding:"10px", backgroundColor:"black",}}>Mesa 103</span> 
      </div>

      <Header className={"header-container"}>
        <img  alt="logo" src="https://cdn.neemo.com.br/uploads/item/photo/2039865/photo1690653160.jpeg.webp" className="header-logo"/>
        <Space className="header-icons">
          <Cart />
        </Space>
      </Header>

      <CategoryBar  hideHeader={hideHeader}/>
    </>
  );
};

export default AppHeader;
