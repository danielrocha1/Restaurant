import React from "react";
import { Layout, Input, Space, Badge, Avatar } from "antd";
import { HeartOutlined, ShoppingCartOutlined, UserOutlined } from "@ant-design/icons";
import "./header.css"; // Importando o CSS atualizado

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
          <Badge count={2} size="small">
            <HeartOutlined />
          </Badge>
          <Badge count={5} size="small">
            <ShoppingCartOutlined />
          </Badge>
        </Space>
      </Header>
    </>
  );
};

export default AppHeader;
