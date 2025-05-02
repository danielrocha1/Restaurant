import './categorybar.css';
import { Menu } from 'antd';
import { AppstoreOutlined } from '@ant-design/icons';
import React from 'react';

const { SubMenu } = Menu;

const CategoryBar = ({ hideHeader }) => {
  return (
    <div className={`category-bar ${hideHeader ? 'category-bar-up' : ''}`}>
      <Menu
        mode="inline"
        style={{ width: "15.4vw", backgroundColor: '#2e7d32', color: 'white' }}
        defaultSelectedKeys={['1']}
        theme="dark"
      >
        <Menu.Item key="1">Combinados</Menu.Item>

        <SubMenu key="2" icon={<AppstoreOutlined />} title="Comidas Frias">
          <Menu.Item key="2-1">Sushis</Menu.Item>
          <Menu.Item key="2-2">Sashimis</Menu.Item>
          <Menu.Item key="2-3">Temakis</Menu.Item>
        </SubMenu>

        <SubMenu key="3" icon={<AppstoreOutlined />} title="Comidas Quentes">
          <Menu.Item key="3-1">Yakissoba</Menu.Item>
          <Menu.Item key="3-2">Lámen</Menu.Item>
          <Menu.Item key="3-3">Donburi</Menu.Item>
        </SubMenu>

        <Menu.Item key="4">Entradas</Menu.Item>
        <Menu.Item key="5">Robatas</Menu.Item>
        <Menu.Item key="6">Acompanhamentos</Menu.Item>
        <Menu.Item key="7">Bebidas</Menu.Item>
        <Menu.Item key="8">Sobremesas</Menu.Item>
      </Menu>
    </div>
  );
};

export default CategoryBar;
