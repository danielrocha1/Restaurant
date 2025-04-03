import { useState } from "react";
import { Card, Button } from "antd";
import { MinusOutlined, PlusOutlined, HeartOutlined, HeartFilled } from "@ant-design/icons";
import "./product.css";

const ProductCard = ({ product }) => {
  const [selectedWeight, setSelectedWeight] = useState("7.5kg");
  const [quantity, setQuantity] = useState(0);
  const [isFavorited, setIsFavorited] = useState(false);
  const weights = ["7.5kg", "10kg", "15kg"];

  const addToCart = () => {
    setQuantity(1);
  };

  const increaseQuantity = () => setQuantity(quantity + 1);
  const decreaseQuantity = () => setQuantity(quantity > 1 ? quantity - 1 : 0);
  const toggleFavorite = () => setIsFavorited(!isFavorited);

  return (
    <Card className="product-card" hoverable>
      <img src={product.image} alt={product.name} className="product-image" />
      <div className="product-info">
        <h2 className="product-title">{product.name}</h2>
        <p className="product-description">{product.description}</p>

        {/* Opções de peso */}
        <div className="weight-options">
          {weights.map((weight) => (
            <div
              key={weight}
              onClick={() => setSelectedWeight(weight)}
              className={`weight-option ${selectedWeight === weight ? "selected" : ""}`}
            >
              {weight}
            </div>
          ))}
        </div>

        <div className="product-price">R$ {product.price}</div>

        {/* Botão de Favoritar */}
        <div className="favorite-button" onClick={toggleFavorite}>
          <div className={`heart-circle ${isFavorited ? 'favorite' : ''}`}>
            {isFavorited ? <HeartFilled style={{ color: 'red' }} /> : <HeartOutlined style={{ color: 'red' }} />}
          </div>
        </div>

        {/* Controles do carrinho com animação */}
        <div className={`cart-controls ${quantity > 0 ? "expanded" : "collapsed"}`}>
          {quantity === 0 ? (
            <Button onClick={addToCart} className="add-to-cart" type=" ">
              Adicionar ao Carrinho
            </Button>
          ) : (
            <div className="quantity-controls">
              <Button
                onClick={decreaseQuantity}
                className="quantity-button"
                icon={<MinusOutlined />}
                shape="circle"
              />
              <span className="quantity-value">{quantity}</span>
              <Button
                onClick={increaseQuantity}
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
