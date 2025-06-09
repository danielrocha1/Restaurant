import { useState } from "react";
import { Card, Button } from "antd";
import { MinusOutlined, PlusOutlined } from "@ant-design/icons";
import { useCart } from "../context/cartContext";
import "./product.css";

const createKey = (name, weight) => `${name}_${weight}`;

const ProductCard = ({ product }) => {
  const defaultWeight =
    Array.isArray(product.weights) && product.weights.length > 0
      ? product.weights[0]
      : "Único";

  const [selectedWeight, setSelectedWeight] = useState(defaultWeight);

  const {
    addToCart,
    decreaseFromCart,
    quantityMap,
  } = useCart();

  const key = createKey(product.Nome, selectedWeight);
  const quantity = quantityMap[key] || 0;

  const handleAdd = () => addToCart(product, selectedWeight);
  const handleIncrease = () => addToCart(product, selectedWeight);
  const handleDecrease = () => decreaseFromCart(product.Nome, selectedWeight);

  return (
    <Card className="product-card" hoverable>
      <img src={product.Imagem} alt={product.Nome} className="product-image" />
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
            <div className="product-price original">{product.Preco}</div>
            <div className="product-price promocional">{product.PrecoPromocional}</div>
          </div>
        ) : (
          <div className="product-price">{product.Preco}</div>
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
  );
};

export default ProductCard;
