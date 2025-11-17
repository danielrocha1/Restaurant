import React, { useEffect, useRef, useState } from "react";
import { Menu } from "antd";
import SubcategoryGridModal from "./SubcategoryGridModal";
import { AppstoreOutlined, DownOutlined } from "@ant-design/icons";
import { useCategories } from "../../hooks/useCategories";
import { slug, smoothScrollTo, isBrowser } from "../../utils/helpers";
import "./CategoryBar.css";

/**
 * Componente de barra de categorias
 * Exibe menu lateral (desktop) ou horizontal (mobile) com categorias e subcategorias
 */
const CategoryBar = () => {
  const [isMobile, setIsMobile] = useState(
    isBrowser() ? window.innerWidth < 768 : false
  );
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [openKeys, setOpenKeys] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const menuRef = useRef(null);

  const { categories, loading } = useCategories();

  // Detecta mudanças de tamanho da tela
  useEffect(() => {
    const handleResize = () =>
      setIsMobile(isBrowser() ? window.innerWidth < 768 : false);
    if (isBrowser()) {
      window.addEventListener("resize", handleResize);
      return () => window.removeEventListener("resize", handleResize);
    }
  }, []);

  // Fecha o menu ao clicar fora (desktop)
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpenKeys([]);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Constrói os itens do menu a partir das categorias
  useEffect(() => {
    if (loading || !categories.length) return;

    const items = categories.map((categoria, i) => {
      const catId = String(categoria.ID ?? i + 1);
      const catLabel = categoria.Nome;
      const catSlug = slug(catLabel);

      const subs = (categoria.Subcategorias || []).filter(
        (s) => s?.Nome && s.Nome !== "Sem subcategoria"
      );

      if (subs.length === 0) {
        // Categoria sem subcategorias
        return {
          key: `cat-${catId}`,
          label: catLabel,
          onClick: () => smoothScrollTo(catSlug),
        };
      }

      // Categoria com subcategorias
      return {
        key: `cat-${catId}`,
        icon: <AppstoreOutlined />,
        label: catLabel,
        children: subs.map((sub) => {
          const subSlug = slug(sub.Nome);
          return {
            key: `sub-${catId}-${sub.ID ?? sub.Nome}`,
            label: sub.Nome,
            onClick: () => smoothScrollTo(subSlug),
          };
        }),
      };
    });

    setMenuItems(items);
  }, [categories, loading]);

  const onOpenChange = (keys) => {
    const latest = keys.find((k) => !openKeys.includes(k));
    if (!latest) return setOpenKeys(keys);
    setOpenKeys([latest]);
  };

  if (loading) {
    return <div className="category-bar">Carregando...</div>;
  }

  return (
    <>
      <div className={`category-bar ${isMobile ? "mobile" : ""}`} ref={menuRef}>
      {isMobile ? (
        <nav className="cat-scroll" aria-label="Categorias">
          {menuItems.map((item) => {
            const hasChildren =
              Array.isArray(item.children) && item.children.length > 0;

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

            // No mobile, abre o modal de grid de subcategorias
            return (
              <button
                key={item.key}
                className="cat-chip has-sub"
                onClick={() => {
                  const originalCategory = categories.find(c => c.Nome === item.label);
                  setSelectedCategory(originalCategory);
                  setIsModalVisible(true);
                }}
                type="button"
              >
                {item.label} <DownOutlined />
              </button>
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
    <SubcategoryGridModal
      isVisible={isModalVisible}
      onClose={() => setIsModalVisible(false)}
      category={selectedCategory}
      subcategories={selectedCategory?.Subcategorias?.filter(s => s?.Nome && s.Nome !== "Sem subcategoria")}
    />
    </>
  );
};export default CategoryBar;
