import React from "react";
import { Modal, Button, Grid } from "antd";
import { smoothScrollTo, slug } from "../../utils/helpers";
import "./SubcategoryGridModal.css";


const { useBreakpoint } = Grid;

/**
 * Modal para exibir subcategorias em um layout de grid 3x3 no mobile.
 */
const SubcategoryGridModal = ({ isVisible, onClose, category, subcategories }) => {
  const screens = useBreakpoint();
  const isMobile = screens.xs || screens.sm;

  if (!category || !subcategories || subcategories.length === 0) return null;

  const handleSubcategoryClick = (subName) => {
    smoothScrollTo(slug(subName));
    onClose();
  };

  return (
    <Modal
      open={isVisible}
      onCancel={onClose}
      footer={null}
      centered
      width={isMobile ? "100%" : 500}
      className="subcategory-grid-modal"
    >
      {/* Título removido conforme solicitado */}
      <div className="subcategory-grid">
        {subcategories.map((sub) => (
          <Button
            key={sub.ID || sub.Nome}
            className="grid-button"
            onClick={() => handleSubcategoryClick(sub.Nome)}
          >
            {sub.Nome}
          </Button>
        ))}
      </div>
    </Modal>
  );
};

export default SubcategoryGridModal;
