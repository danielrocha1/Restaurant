import './categorybar.css';
import React, { useEffect, useRef, useState } from 'react';
import { Menu, Dropdown } from 'antd';
import { AppstoreOutlined, DownOutlined } from '@ant-design/icons';

const SAFE_WINDOW = typeof window !== 'undefined';

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
    fetch('https://restaurant-9gdi.onrender.com/categoriasSub')
      .then((res) => res.json())
      .then((data) => {
        const items = (data || []).map((categoria, i) => {
          const catId = String(categoria.ID ?? i + 1);
          const catLabel = categoria.Nome;

          // subcategorias reais (ignora "Sem subcategoria")
          const subs = (categoria.Subcategorias || []).filter(
            (s) => s?.Nome && s.Nome !== 'Sem subcategoria'
          );

          if (subs.length === 0) {
            // categoria simples (sem dropdown)
            return {
              key: `cat-${catId}`,
              label: catLabel,
              onClick: () => handleScrollTo(catLabel),
            };
          }

          // categoria com dropdown (tem subcategorias)
          return {
            key: `cat-${catId}`,
            icon: <AppstoreOutlined />,
            label: catLabel,
            children: subs.map((sub) => ({
              key: `sub-${catId}-${sub.ID ?? sub.Nome}`,
              label: sub.Nome,
              onClick: () => handleScrollTo(sub.Nome),
            })),
          };
        });

        setMenuItems(items);
      })
      .catch((err) => {
        console.error('Erro ao buscar categorias:', err);
      });
  }, []);

  // acha o contêiner que realmente rola (ou a janela)
const getScrollableParent = (node) => {
  if (!node) return window;
  let cur = node.parentElement;
  while (cur && cur !== document.body) {
    const cs = getComputedStyle(cur);
    const canScrollY = (cs.overflowY === "auto" || cs.overflowY === "scroll") && cur.scrollHeight > cur.clientHeight;
    if (canScrollY) return cur;
    cur = cur.parentElement;
  }
  return document.scrollingElement || document.documentElement || window;
};

const handleScrollTo = (name) => {
  const el = document.getElementById(name);
  if (!el) return;

  // espera o dropdown fechar/reflow (evita “não rolou”)
  requestAnimationFrame(() => {
    el.scrollIntoView({ behavior: 'smooth', block: 'start', inline: 'nearest' });
  });

  setOpenKeys([]);
};



  // desktop: manter só um submenu aberto (opcional)
  const onOpenChange = (keys) => {
    const latest = keys.find((k) => !openKeys.includes(k));
    if (!latest) return setOpenKeys(keys);
    setOpenKeys([latest]);
  };

  return (
    <div className={`category-bar ${isMobile ? 'mobile' : ''}`} ref={menuRef}>
      {isMobile ? (
        // MOBILE: TODAS as categorias expostas como "chips" roláveis.
        // Somente quem tem children abre Dropdown.
        <nav className="cat-scroll" aria-label="Categorias">
          {menuItems.map((item) => {
            const hasChildren = Array.isArray(item.children) && item.children.length > 0;

            if (!hasChildren) {
              return (
                <button
                  key={item.key}
                  className="cat-chip"
                  onClick={() => handleScrollTo(item.label)}
                  type="button"
                >
                  {item.label}
                </button>
              );
            }

            // Dropdown só para categorias com subcategorias (ex.: Pratos Quentes/Frios)
            const dropdownMenu = {
              items: item.children, // cada child já tem onClick
            };

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
        // DESKTOP: Menu vertical inline (como já estava)
        <Menu
          mode="inline"
          theme="dark"
          rootClassName="category-menu-root"
          style={{ width: '14vw', backgroundColor: '#2e7d32' }}
          items={menuItems}
          openKeys={openKeys}
          onOpenChange={onOpenChange}
        />
      )}
    </div>
  );
};

export default CategoryBar;
