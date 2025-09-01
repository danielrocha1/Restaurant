import './categorybar.css';
import { Menu } from 'antd';
import { AppstoreOutlined } from '@ant-design/icons';
import React, { useEffect, useState, useRef } from 'react';

const CategoryBar = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [openKeys, setOpenKeys] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const menuRef = useRef(null);

  const onOpenChange = (keys) => {
    const latest = keys.find((key) => !openKeys.includes(key));
    setOpenKeys(latest ? [latest] : []);
  };

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const handleOutsideSubmenu = (e) => {
      const submenu = menuRef.current?.querySelector('.custom-submenu');
      if (submenu && !submenu.contains(e.target)) {
        setOpenKeys([]);
      }
    };
    document.addEventListener('mousedown', handleOutsideSubmenu);
    return () => document.removeEventListener('mousedown', handleOutsideSubmenu);
  }, []);

  const handleMenuClick = () => {
    setOpenKeys([]);
  };

 useEffect(() => {
  fetch("https://restaurant-9gdi.onrender.com/categoriasSub")
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
        mode={isMobile ? "horizontal" : "vertical"}
        theme="dark"
        popupClassName="custom-submenu"
        openKeys={openKeys}
        onOpenChange={onOpenChange}
        onClick={handleMenuClick}
        getPopupContainer={() => menuRef.current}
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
