import React, { useState } from 'react';
import { Badge, Drawer, Button, List, Avatar } from 'antd';
import { ShoppingCartOutlined, MinusOutlined, PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import { useCart } from '../context/cartContext'; // ajuste o caminho
import "./cart.css"

const Cart = () => {
  const [cartOpen, setCartOpen] = useState(false);
  const { cart, addToCart, removeFromCart, clearCart } = useCart();

  const toggleCart = () => {
    setCartOpen(!cartOpen);
  };

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  const totalPrice = cart.reduce(
    (sum, item) => sum + parseFloat(item.price.replace(",", ".")) * item.quantity,
    0
  );

  return (
    <>
        <Badge count={totalItems} size="small" onClick={toggleCart}>
          <ShoppingCartOutlined style={{ fontSize: '32px', color: 'white', cursor: 'pointer' }} />
        </Badge>

      <Drawer
        title="Seu Carrinho"
        placement="right"
        onClose={toggleCart}
        open={cartOpen}
        width={350}
        footer={
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <strong>Total: R$ {totalPrice.toFixed(2).replace(".", ",")}</strong>
            <Button onClick={clearCart} danger>
              Limpar Carrinho
            </Button>
          </div>
        }
      >
        {cart.length === 0 ? (
          <p>Seu carrinho está vazio.</p>
        ) : (
          <List
            itemLayout="horizontal"
            dataSource={cart}
            renderItem={(item) => (
              <List.Item
                actions={[
                  <Button
                    icon={<MinusOutlined />}
                    onClick={() => removeFromCart(item.name, item.weight)}
                    type="text"
                    disabled={item.quantity === 1}
                  />,
                  <Button
                    icon={<PlusOutlined />}
                    onClick={() => addToCart(item, item.weight)}
                    type="text"
                  />,
                  <Button
                    icon={<DeleteOutlined />}
                    onClick={() => removeFromCart(item.name, item.weight, true)}
                    type="text"
                  />
                ]}
              >
                <List.Item.Meta
                  avatar={<Avatar src={item.image} shape="square" size={48} />}
                  title={`${item.name} (${item.weight})`}
                  description={`Qtd: ${item.quantity} | R$ ${item.price}`}
                />
              </List.Item>
            )}
          />
        )}

        {cart.length > 0 && (
          <Button className="finalizar" type=" " block>
            Finalizar Compra
          </Button>
        )}
      </Drawer>
    </>
  );
};

export default Cart;
