import './categorybar.css';
import React, { useEffect, useState, useRef } from 'react';

// Custom category bar without Ant Design
// Fetches categories and displays a floating submenu similar to iFood
const CategoryBar = ({ hideHeader }) => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [categories, setCategories] = useState([]);
  const [submenu, setSubmenu] = useState(null); // { name, sub: [], style: {top,left,position} }
  const barRef = useRef(null);
  const submenuRef = useRef(null);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Close submenu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        submenuRef.current &&
        !submenuRef.current.contains(e.target) &&
        barRef.current &&
        !barRef.current.contains(e.target)
      ) {
        setSubmenu(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch categories and subcategories
  useEffect(() => {
    fetch('https://restaurant-9gdi.onrender.com/categoriasSub')
      .then((res) => res.json())
      .then((data) => setCategories(data))
      .catch((err) => console.error('Erro ao buscar categorias:', err));
  }, []);

  const handleScrollTo = (name) => {
    const element = document.getElementById(name);
    if (element) {
      const yOffset = isMobile ? -130 : -150;
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
    setSubmenu(null);
  };

  const openSubmenu = (categoria, rect) => {
    const barRect = barRef.current.getBoundingClientRect();
    const sub = categoria.Subcategorias || [];
    if (isMobile) {
      setSubmenu({
        name: categoria.Nome,
        sub,
        style: {
          position: 'absolute',
          top: barRect.height,
          left: rect.left - barRect.left,
        },
      });
    } else {
      setSubmenu({
        name: categoria.Nome,
        sub,
        style: {
          position: 'fixed',
          top: rect.top,
          left: barRect.width,
        },
      });
    }
  };

  const handleCategoryClick = (categoria, e) => {
    const subcategorias = categoria.Subcategorias || [];
    const isSemSub =
      subcategorias.length === 1 && subcategorias[0].Nome === 'Sem subcategoria';

    if (isSemSub || subcategorias.length === 0) {
      handleScrollTo(categoria.Nome);
    } else {
      const rect = e.currentTarget.getBoundingClientRect();
      openSubmenu(categoria, rect);
    }
  };

  const renderSubmenu = () => {
    if (!submenu) return null;
    return (
      <div
        className={`submenu ${isMobile ? 'mobile' : ''}`}
        ref={submenuRef}
        style={submenu.style}
      >
        {submenu.sub.map((sub) => {
          const label =
            sub.Nome === 'Sem subcategoria' ? submenu.name : sub.Nome;
          return (
            <div
              key={label}
              className="submenu-item"
              onClick={() => handleScrollTo(label)}
            >
              {label}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div
      className={`category-bar ${isMobile ? 'mobile' : ''} ${
        hideHeader ? 'category-bar-up' : ''
      }`}
      ref={barRef}
    >
      {categories.map((cat) => (
        <div
          key={cat.Nome}
          className="category-item"
          onClick={(e) => handleCategoryClick(cat, e)}
        >
          {cat.Nome}
        </div>
      ))}
      {renderSubmenu()}
    </div>
  );
};

export default CategoryBar;

