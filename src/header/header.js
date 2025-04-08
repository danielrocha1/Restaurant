import React from "react";
import { Layout, Input, Space, Avatar } from "antd";
import { UserOutlined } from "@ant-design/icons";
import Cart from "../cart/cart"; // Importando o componente de carrinho   
import "./header.css"; // Importando o CSS atualizado
import Favorite from "../favorite/favorite";



const { Header } = Layout;
const { Search } = Input;

const AppHeader = () => {
  return (
    <>
      {/* Barra de Promoção */}
      <div className="promo-bar">🔥 Promoção especial! Frete grátis para compras acima de R$ 100!</div>

      <Header className="header-container">
        {/* Logo */}
        <div className="header-logo">Minha Loja</div>

        {/* Barra de busca */}
        <Search placeholder="Buscar produtos..." allowClear className="header-search" />

        {/* Ícones de Açõs */}

        <Space className="header-icons">
        <Avatar size="large" icon={<UserOutlined />} className="header-avatar" />
        <Favorite />
        <Cart />
        </Space>
      </Header>
    </>
  );
};

export default AppHeader;
