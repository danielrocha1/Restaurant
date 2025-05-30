import './categorybar.css';
import { Menu } from 'antd';
import { AppstoreOutlined } from '@ant-design/icons';
import React, { useEffect, useState, useRef } from 'react';
import json from "../../catalogo_akiro.json";

const CategoryBar = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [openKeys, setOpenKeys] = useState([]);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpenKeys([]);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleScrollTo = (name) => {
    const element = document.getElementById(name);
    if (element) {
      const yOffset = isMobile ? -130 : -100;
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
      setOpenKeys([]); // Fecha submenu após clique
    }
  };

  const buildMenuItems = (data) => {
    const items = [];
    let keyCount = 1;

    Object.entries(data).forEach(([categoria, subcategorias]) => {
      const key = `${keyCount++}`;

      if (Array.isArray(subcategorias)) {
        items.push({
          key,
          label: categoria,
          onClick: () => handleScrollTo(categoria),
        });
      } else {
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

  const items = buildMenuItems(json);

  return (
    <div className={`category-bar ${isMobile ? 'mobile' : ''}`} ref={menuRef}>
      <Menu
  mode={isMobile ? "horizontal" : "inline"}
  theme="dark"
  popupclassname="custom-submenu"
  style={{
    width: isMobile ? 'max-content' : "14vw",
    display: isMobile ? "flex" : "block",
    backgroundColor: isMobile ? 'transparent' : '#2e7d32',
  }}
  items={items}
/>
    </div>
  );
};

export default CategoryBar;
