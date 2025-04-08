import React, { useState } from "react";
import { Layout, Menu, Button } from "antd";
import {
    CloseOutlined,
    RightOutlined,
    SmileOutlined,
    HeartOutlined,
    GiftOutlined,
    HomeOutlined,
    ShoppingOutlined,
    StarOutlined,
  } from "@ant-design/icons";
  

import "./sidebar.css";

const {SubMenu} = Menu;
const { Sider } = Layout;

const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(false);

  const toggleCollapsed = () => {
    setCollapsed(!collapsed);
  };

  return (
    <Sider
      collapsible
      collapsed={collapsed}
      trigger={null}
      style={{
        minHeight: "100%",
        background: "#2E7D32",
      }}
    >
     <div className="sidebar-header">
    <div className="sidebar-logo">{collapsed ? "🐾 " : "🐾"}</div>
    <Button
        type="text"
        icon={collapsed ? <RightOutlined /> : <CloseOutlined />}
        onClick={toggleCollapsed}
        style={{ color: "#fff", fontSize: "26px" }}
    />
    </div>

    <Menu
      mode="inline"
      defaultSelectedKeys={['1']}
      
      style={{
        backgroundColor: '#2E7D32',
        color: 'white',
      }}
    >
     <SubMenu
    key="dog"
    icon={<SmileOutlined style={{ color: 'white' }} />}
    title={<span style={{ color: 'white' }}>Cachorros</span>}
  >
    <Menu.Item key="dog-food" style={{ backgroundColor: '#2E7D32',color: 'white' }}>Rações</Menu.Item>
    <Menu.Item key="dog-snacks" style={{backgroundColor: '#2E7D32', color: 'white' }}>Petiscos</Menu.Item>
    <Menu.Item key="dog-toys" style={{ backgroundColor: '#2E7D32',color: 'white' }}>Brinquedos</Menu.Item>
    <Menu.Item key="dog-hygiene" style={{ backgroundColor: '#2E7D32',color: 'white' }}>Higiene</Menu.Item>
    <Menu.Item key="dog-accessories" style={{ backgroundColor: '#2E7D32',color: 'white' }}>Acessórios</Menu.Item>
  </SubMenu>

  <SubMenu
    key="cat"
    icon={<HeartOutlined style={{ color: 'white' }} />}
    title={<span style={{ color: 'white' }}>Gatos</span>}
  >
    <Menu.Item key="cat-food" style={{backgroundColor: '#2E7D32', color: 'white' }}>Rações</Menu.Item>
    <Menu.Item key="cat-litter" style={{ backgroundColor: '#2E7D32', color: 'white' }}>Areia</Menu.Item>
    <Menu.Item key="cat-toys" style={{backgroundColor: '#2E7D32', color: 'white' }}>Brinquedos</Menu.Item>
    <Menu.Item key="cat-hygiene" style={{backgroundColor: '#2E7D32', color: 'white' }}>Higiene</Menu.Item>
    <Menu.Item key="cat-accessories" style={{ backgroundColor: '#2E7D32', color: 'white' }}>Acessórios</Menu.Item>
  </SubMenu>

  <SubMenu
    key="offers"
    icon={<GiftOutlined style={{ color: 'white' }} />}
    title={<span style={{ color: 'white' }}>Ofertas</span>}
  >
    <Menu.Item key="promotions" style={{backgroundColor: '#2E7D32', color: 'white' }}>Promoções</Menu.Item>
    <Menu.Item key="bestsellers" icon={<StarOutlined style={{  color: 'white' }} />} style={{ backgroundColor: '#2E7D32', color: 'white' }}>Mais vendidos</Menu.Item>
    <Menu.Item key="new" style={{ backgroundColor: '#2E7D32', color: 'white' }}>Novidades</Menu.Item>
  </SubMenu>

  <Menu.Item
    key="shop"
    icon={<ShoppingOutlined style={{ color: 'white' }} />}
    style={{ color: 'white' }}
  >
    Todos os produtos
  </Menu.Item>
</Menu>

    </Sider>
  );
};

export default Sidebar;
