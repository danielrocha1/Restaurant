import './categorybar.css';
import { Menu } from 'antd';
import { AppstoreOutlined } from '@ant-design/icons';
import React from 'react';
import json from "../../catalogo_akiro.json";

const handleScrollTo = (name) => {
  const element = document.getElementById(name);
  if (element) {
    const yOffset = -130;
    const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
    window.scrollTo({ top: y, behavior: 'smooth' });
  }
};

const buildMenuItems = (data) => {
  const items = [];
  let keyCount = 1;

  Object.entries(data).forEach(([categoria, subcategorias]) => {
    const key = `${keyCount++}`;

    // Categoria sem subcategorias
    if (Array.isArray(subcategorias)) {
      items.push({
        key,
        label: categoria,
        onClick: () => handleScrollTo(categoria),
      });
    } else {
      // Categoria com subcategorias
      const children = Object.keys(subcategorias).map((sub, idx) => ({
        key: `${key}-${idx}`,
        label: sub,
        onClick: () => handleScrollTo(sub),
      }));

      items.push({
        key,
        icon: <AppstoreOutlined />,
        label: categoria,
        children,
      });
    }
  });

  return items;
};

const CategoryBar = () => {
  const items = buildMenuItems(json);

  return (
    <div className="category-bar">
      <Menu
        mode="inline"
        style={{ width: "14vw", backgroundColor: '#2e7d32', color: 'white' }}
        theme="dark"
        items={items}
      />
    </div>
  );
};

export default CategoryBar;
