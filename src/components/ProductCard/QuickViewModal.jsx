import React, { useState, useEffect } from "react";
import { Modal, Button, Typography, Image, Space } from "antd";
import { MinusOutlined, PlusOutlined, ShoppingCartOutlined } from "@ant-design/icons";
import { useCart } from "../../contexts/CartContext";
import { formatPrice, createCartKey } from "../../utils/helpers";
import "./QuickViewModal.css";

const { Title, Text, Paragraph } = Typography;

/**
 * Modal de visualização rápida do produto
 * Exibe detalhes maiores e permite adicionar ao carrinho
 */
const QuickViewModal = ({ product, isVisible, onClose }) => {
  const { addToCart, decreaseFromCart, quantityMap } = useCart();

  // Encontra o peso padrão ou o primeiro peso
  const defaultWeight =
    Array.isArray(product?.weights) && product.weights.length > 0
      ? product.weights[0]
      : "Único";

  const [selectedWeight, setSelectedWeight] = useState(defaultWeight);

  // Reseta o peso selecionado ao abrir o modal
  useEffect(() => {
    if (isVisible) {
      setSelectedWeight(defaultWeight);
    }
  }, [isVisible, defaultWeight]);

  if (!product) return null;

  const key = createCartKey(product.Nome, selectedWeight);
  const quantity = quantityMap[key] || 0;

  const handleAdd = () => addToCart(product, selectedWeight);
  const handleIncrease = () => addToCart(product, selectedWeight);
  const handleDecrease = () => decreaseFromCart(product.Nome, selectedWeight);

  const isPromotional = product.PrecoPromocional && product.PrecoPromocional < product.Preco;
  const priceToDisplay = isPromotional ? product.PrecoPromocional : product.Preco;

  return (
    <Modal
      open={isVisible}
      onCancel={onClose}
      footer={null}
      centered
      width={600}
      className="quick-view-modal"
    >
      <div className="modal-content-wrapper">
        <div className="modal-image-container">
          <Image
            src={product.Imagem}
            alt={product.Nome}
            className="modal-product-image"
            preview={false}
          />
        </div>

        <div className="modal-details-container">
          <Title level={3} className="modal-product-title">
            {product.Nome}
          </Title>
          <Paragraph className="modal-product-description">
            {product.Descricao || "Descrição não disponível."}
          </Paragraph>

          {/* Opções de Peso/Tamanho */}
          {Array.isArray(product.weights) && product.weights.length > 0 && (
            <div className="modal-weight-options">
              <Text strong>Opções:</Text>
              <Space wrap>
                {product.weights.map((weight) => (
                  <Button
                    key={weight}
                    onClick={() => setSelectedWeight(weight)}
                    type={selectedWeight === weight ? "primary" : "default"}
                    className="modal-weight-button"
                  >
                    {weight}
                  </Button>
                ))}
              </Space>
            </div>
          )}

          {/* Preço */}
          <div className="modal-price-container">
            {isPromotional && (
              <Text delete className="modal-price original">
                {formatPrice(product.Preco)}
              </Text>
            )}
            <Text className="modal-price current">
              {formatPrice(priceToDisplay)}
            </Text>
          </div>

          {/* Controles do Carrinho */}
          <div className="modal-cart-controls">
            {quantity === 0 ? (
              <Button
                type="primary"
                size="large"
                icon={<ShoppingCartOutlined />}
                onClick={handleAdd}
                className="modal-add-to-cart"
              >
                Adicionar ao Carrinho
              </Button>
            ) : (
              <div className="modal-quantity-controls">
                <Button
                  onClick={handleDecrease}
                  icon={<MinusOutlined />}
                  shape="circle"
                  size="large"
                />
                <span className="modal-quantity-value">{quantity}</span>
                <Button
                  onClick={handleIncrease}
                  icon={<PlusOutlined />}
                  shape="circle"
                  size="large"
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default QuickViewModal;
