import { useState } from "react";
import { Card, Button } from "antd";
import {
  MinusOutlined,
  PlusOutlined,
  HeartOutlined,
  HeartFilled,
} from "@ant-design/icons";
import { useCart } from "../context/cartContext"; // ajuste o caminho se necessário
import "./product.css";

const ProductCard = ({ product }) => {
  const [selectedWeight, setSelectedWeight] = useState(product.weights[0]);
  const [isFavorited, setIsFavorited] = useState(false);
  const { addToCart, removeFromCart, getQuantity } = useCart();

  const quantity = getQuantity(product.name, selectedWeight);

  const handleAdd = () => {
    addToCart(product, selectedWeight);
  };

  const handleIncrease = () => {
    addToCart(product, selectedWeight);
  };

  const handleDecrease = () => {
    removeFromCart(product.name, selectedWeight);
  };

  const toggleFavorite = () => setIsFavorited(!isFavorited);

  return (
    <Card className="product-card" hoverable>
      <img src={product.image} alt={product.name} className="product-image" />
      <div className="product-info">
        <h2 className="product-title">{product.name}</h2>
        <p className="product-description">{product.description}</p>

        {/* Pesos */}
        <div className="weight-options">
          {product.weights.map((weight) => (
            <div
              key={weight}
              onClick={() => setSelectedWeight(weight)}
              className={`weight-option ${
                selectedWeight === weight ? "selected" : ""
              }`}
            >
              {weight}
            </div>
          ))}
        </div>

        <div className="product-price">{product.price}</div>

        {/* Favorito */}
        <div className="favorite-button" onClick={toggleFavorite}>
          <div className={`heart-circle ${isFavorited ? "favorite" : ""}`}>
            {isFavorited ? (
              <HeartFilled style={{ color: "red" }} />
            ) : (
              <HeartOutlined style={{ color: "red" }} />
            )}
          </div>
        </div>

        {/* Carrinho */}
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
