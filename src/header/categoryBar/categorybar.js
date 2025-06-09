import './categorybar.css';
import { Menu } from 'antd';
import { AppstoreOutlined } from '@ant-design/icons';
import React, { useEffect, useState, useRef } from 'react';

const CategoryBar = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [openKeys, setOpenKeys] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
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

 useEffect(() => {
  fetch("http://localhost:4000/categoriasSub")
    .then((res) => res.json())
    .then((data) => {
      console.log(data)
      const items = data.map((categoria, i) => {
        const subcategorias = categoria.Subcategorias || [];

        // Se só tem "Sem subcategoria", considera item simples
        const isSemSub = subcategorias.length === 1 && subcategorias[0].Nome === "Sem subcategoria";

        if (isSemSub) {
          return {
            key: `${i + 1}`,
            label: categoria.Nome,
            onClick: () => handleScrollTo(categoria.Nome),
          };
        }

        return {
          key: `${i + 1}`,
          icon: <AppstoreOutlined />,
          label: categoria.Nome,
          children: subcategorias.map((sub, idx) => ({
            key: `${i + 1}-${idx}`,
            label: sub.Nome === "Sem subcategoria" ? categoria.Nome : sub.Nome,
            onClick: () => handleScrollTo(sub.Nome === "Sem subcategoria" ? categoria.Nome : sub.Nome),
          }))
        };
      });

      setMenuItems(items);
    })
    .catch((err) => {
      console.error("Erro ao buscar categorias:", err);
    });
}, []);

  const handleScrollTo = (name) => {
    const element = document.getElementById(name);
    if (element) {
      const yOffset = isMobile ? -130 : -150;
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
      setOpenKeys([]);
    }
  };

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
        items={menuItems}
      />
    </div>
  );
};

export default CategoryBar;
