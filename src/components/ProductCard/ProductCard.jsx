import React, { useState, forwardRef } from "react";
import { Card, Button, Typography } from "antd";
import QuickViewModal from "./QuickViewModal";
import { MinusOutlined, PlusOutlined } from "@ant-design/icons";
import { useCart } from "../../contexts/CartContext";
import { formatPrice, createCartKey } from "../../utils/helpers";
import "./ProductCard.css";

const { Text } = Typography;

const ProductCard = forwardRef(({ product }, ref) => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  
  const defaultWeight =
    Array.isArray(product.weights) && product.weights.length > 0
      ? product.weights[0]
      : "Único";

  const [selectedWeight, setSelectedWeight] = useState(defaultWeight);

  const { addToCart, decreaseFromCart, quantityMap } = useCart();

  const key = createCartKey(product.Nome, selectedWeight);
  const quantity = quantityMap[key] || 0;

  const handleAdd = () => addToCart(product, selectedWeight);
  const handleIncrease = () => addToCart(product, selectedWeight);
  const handleDecrease = () => decreaseFromCart(product.Nome, selectedWeight);

  const showModal = () => setIsModalVisible(true);
  const handleCloseModal = () => setIsModalVisible(false);
  
  return (
    <>
      <Card className="product-card" hoverable ref={ref}>
        <img
          src={product.Imagem}
          alt={product.Nome}
          className="product-image"
          onClick={showModal}
        />
        <div className="product-info">
          <h2 className="product-title">{product.Nome}</h2>

          {Array.isArray(product.weights) && product.weights.length > 0 && (
            <div className="weight-options">
              {product.weights.map((weight) => (
                <div
                  key={weight}
                  onClick={() => setSelectedWeight(weight)}
                  className={`weight-option ${selectedWeight === weight ? "selected" : ""}`}
                >
                  {weight}
                </div>
              ))}
            </div>
          )}

          {product.PrecoPromocional ? (
            <div className="price-container">
              <Text delete className="product-price original">
                {formatPrice(product.Preco)}
              </Text>
              <Text className="product-price promocional">
                {formatPrice(product.PrecoPromocional)}
              </Text>
            </div>
          ) : (
            <div className="product-price">{formatPrice(product.Preco)}</div>
          )}

          <div className={`cart-controls ${quantity > 0 ? "expanded" : "collapsed"}`}>
            {quantity === 0 ? (
              <Button onClick={handleAdd} className="add-to-cart">
                Adicionar ao Carrinho
              </Button>
            ) : (
              <div className="quantity-controls">
                <Button
                  onClick={handleDecrease}
                  className="quantity-button"
                  icon={<MinusOutlined />}
                  shape="circle"
                />
                <span className="quantity-value">{quantity}</span>
                <Button
                  onClick={handleIncrease}
                  className="quantity-button"
                  icon={<PlusOutlined />}
                  shape="circle"
                />
              </div>
            )}
          </div>
        </div>
      </Card>
      <QuickViewModal
        product={product}
        isVisible={isModalVisible}
        onClose={handleCloseModal}
      />
    </>
  );
});

export default ProductCard;
