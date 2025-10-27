import './categorybar.css';
import React, { useEffect, useRef, useState } from 'react';
import { Menu, Dropdown } from 'antd';
import { AppstoreOutlined, DownOutlined } from '@ant-design/icons';

const SAFE_WINDOW = typeof window !== 'undefined';

// gera id seguro (sem acento/espaço)
const slug = (s = '') =>
  s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // tira acentos
    .replace(/[^a-zA-Z0-9\s-]/g, '') // tira símbolos estranhos
    .trim()
    .replace(/\s+/g, '-') // troca espaço por "-"
    .toLowerCase();

const CategoryBar = () => {
  const [isMobile, setIsMobile] = useState(SAFE_WINDOW ? window.innerWidth < 768 : false);
  const [openKeys, setOpenKeys] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleResize = () => setIsMobile(SAFE_WINDOW ? window.innerWidth < 768 : false);
    if (SAFE_WINDOW) {
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpenKeys([]);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    fetch('https://restaurant-2dfg.onrender.com/categoriasSub')
      .then((res) => res.json())
      .then((data) => {
        const items = (data || []).map((categoria, i) => {
          const catId = String(categoria.ID ?? i + 1);
          const catLabel = categoria.Nome;
          const catSlug = slug(catLabel);

          const subs = (categoria.Subcategorias || []).filter(
            (s) => s?.Nome && s.Nome !== 'Sem subcategoria'
          );

          if (subs.length === 0) {
            return {
              key: `cat-${catId}`,
              label: catLabel,
              onClick: () => handleScrollTo(catSlug),
            };
          }

          return {
            key: `cat-${catId}`,
            icon: <AppstoreOutlined />,
            label: catLabel,
            children: subs.map((sub) => {
              const subSlug = slug(sub.Nome);
              return {
                key: `sub-${catId}-${sub.ID ?? sub.Nome}`,
                label: sub.Nome,
                onClick: () => handleScrollTo(subSlug),
              };
            }),
          };
        });

        setMenuItems(items);
      })
      .catch((err) => {
        console.error('Erro ao buscar categorias:', err);
      });
  }, []);

 const handleScrollTo = (id) => {
  const el = document.getElementById(id);
  if (!el) return;
  console.log(el)
  // 1) usa o nativo (funciona melhor em iOS/Android)
  el.scrollIntoView({ behavior: 'smooth', block: 'start' });

  // 2) dá um retry rapidinho (fecha dropdown/reflow e tenta de novo)
  setTimeout(() => {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, 180);

  // 3) se ainda quiser compensar header fixo, deixa pelo CSS (abaixo)
  setOpenKeys([]);
};


  const onOpenChange = (keys) => {
    const latest = keys.find((k) => !openKeys.includes(k));
    if (!latest) return setOpenKeys(keys);
    setOpenKeys([latest]);
  };

  return (
    <div className={`category-bar ${isMobile ? 'mobile' : ''}`} ref={menuRef}>
      {isMobile ? (
        <nav className="cat-scroll" aria-label="Categorias">
          {menuItems.map((item) => {
            const hasChildren = Array.isArray(item.children) && item.children.length > 0;

            if (!hasChildren) {
              return (
                <button
                  key={item.key}
                  className="cat-chip"
                  onClick={item.onClick}
                  type="button"
                >
                  {item.label}
                </button>
              );
            }

            const dropdownMenu = { items: item.children };

            return (
              <Dropdown key={item.key} menu={dropdownMenu} trigger={['click']} placement="bottom">
                <button className="cat-chip has-sub" onClick={(e) => e.preventDefault()} type="button">
                  {item.label} <DownOutlined />
                </button>
              </Dropdown>
            );
          })}
        </nav>
      ) : (
        <Menu
          mode="inline"
          theme="dark"
          rootClassName="category-menu-root"
          items={menuItems}
          openKeys={openKeys}
          onOpenChange={onOpenChange}
        />
      )}
    </div>
  );
};

export default CategoryBar;
