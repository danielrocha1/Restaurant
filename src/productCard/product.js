import { useState } from "react";
import { Card, Button } from "antd";
import { MinusOutlined, PlusOutlined, HeartOutlined, HeartFilled } from "@ant-design/icons";
import { useCart } from "../context/cartContext";
import { useFavorite } from "../context/favoriteContext";
import "./product.css";

const ProductCard = ({ product }) => {
  const [selectedWeight, setSelectedWeight] = useState(product.weights[0]);
  const { addToCart, removeFromCart, getQuantity } = useCart();
  const { isFavorited, addFavorite, removeFavorite } = useFavorite();

  const quantity = getQuantity(product.name, selectedWeight);

  const handleAdd = () => addToCart(product, selectedWeight);
  const handleIncrease = () => addToCart(product, selectedWeight);
  const handleDecrease = () => removeFromCart(product.name, selectedWeight);

  const toggleFavorite = () => {
    if (isFavorited(product.name)) {
      removeFavorite(product.name);
    } else {
      addFavorite(product);
    }
  };

  return (
    <Card className="product-card" hoverable>
      <img src={product.image} alt={product.name} className="product-image" />
      <div className="product-info">
        <h2 className="product-title">{product.name}</h2>

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

        <div className="product-price">{product.price}</div>

        <div className="favorite-button" onClick={toggleFavorite}>
          <div
            className={`heart-circle ${isFavorited(product.name) ? "favorite" : ""}`}
          >
            {isFavorited(product.name) ? (
              <HeartFilled style={{ color: "red" }} />
            ) : (
              <HeartOutlined style={{ color: "red" }} />
            )}
          </div>
        </div>

        <div className={`cart-controls ${quantity > 0 ? "expanded" : "collapsed"}`}>
          {quantity === 0 ? (
            <Button onClick={handleAdd} className="add-to-cart">
              Adicionar ao Carrinho
            </Button>
          ) : (
            <div className="quantity-controls">
              <Button onClick={handleDecrease} className="quantity-button" icon={<MinusOutlined />} shape="circle" />
              <span className="quantity-value">{quantity}</span>
              <Button onClick={handleIncrease} className="quantity-button" icon={<PlusOutlined />} shape="circle" />
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};

export default ProductCard;
