import React, { useState, useEffect } from 'react';
import { Badge, Drawer, Button, List, Avatar, Modal } from 'antd';
import { ShoppingCartOutlined, MinusOutlined, PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import { useCart } from '../context/cartContext';
import { Html5Qrcode } from 'html5-qrcode';
import './cart.css';

const Cart = () => {
  const [cartOpen, setCartOpen] = useState(false);
  const [qrModalVisible, setQrModalVisible] = useState(false);
  const [successModalVisible, setSuccessModalVisible] = useState(false);
  const [errorModalVisible, setErrorModalVisible] = useState(false);
  const { cart, addToCart, removeFromCart, clearCart, decreaseFromCart } = useCart();

  const toggleCart = () => setCartOpen(!cartOpen);

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = cart.reduce((sum, item) => {
    const cleanPrice = parseFloat((item.Preco || "").replace("R$", "").replace(",", ".").trim());
    return sum + (isNaN(cleanPrice) ? 0 : cleanPrice * item.quantity);
  }, 0);

useEffect(() => {
  if (qrModalVisible) {
    const timeout = setTimeout(() => {
      const readerElement = document.getElementById("reader");
      if (!readerElement) {
        console.error("Elemento #reader não encontrado");
        return;
      }

      const html5QrCode = new Html5Qrcode("reader");

      html5QrCode.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: 250 },
        async (decodedText, decodedResult) => {
          console.log("Código QR:", decodedText);
          console.log("Pedido (carrinho):", cart);
          console.log("Total", cart.map(item => item.ID));

          try {
            const response = await fetch('http://localhost:4000/checkout', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                qrCode: decodedText,
                itens: cart.map(item => item.ID),
                total: totalPrice.toFixed(2).replace(".", ","),
              }),
            });

            if (!response.ok) {
                setQrModalVisible(false);
              setErrorModalVisible(true);
              throw new Error(`Erro na requisição: ${response.statusText}`);
              html5QrCode.stop().catch(() => {});

            }

            if(response.ok){
                setQrModalVisible(false);
                setCartOpen(false);
                clearCart();
                setSuccessModalVisible(true);
                html5QrCode.stop().catch(() => {});

                }

            // Pode ler resposta se quiser:
            // const data = await response.json();
            // console.log('Resposta backend:', data);

          } catch (error) {
            console.error('Erro ao enviar pedido para o backend:', error);
          }
          
        },
        (errorMessage) => {
          if (!errorMessage.includes("NotFoundException")) {
            console.warn("Erro QR:", errorMessage);
          }
        }
      ).catch(err => console.error("Erro ao iniciar o leitor:", err));

      return () => {
        html5QrCode.stop().catch(() => {});
      };
    }, 300);

    return () => clearTimeout(timeout);
  }
}, [qrModalVisible, cart, clearCart]);


  return (
    <>
      <Badge count={totalItems} size="small" onClick={toggleCart}>
        <ShoppingCartOutlined
          style={{
            fontSize: '12px',
            color: 'white',
            cursor: 'pointer',
            backgroundColor: 'white',
            borderRadius: '50%',
            width: '40px',
            height: '40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        />
      </Badge>

      <Drawer
        title="Seu Carrinho"
        placement="right"
        onClose={toggleCart}
        open={cartOpen}
        width={470}
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
                    onClick={() => decreaseFromCart(item.Nome, item.weight)}
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
                    onClick={() => removeFromCart(item.Nome, item.weight, true)}
                    type="text"
                  />
                ]}
              >
                <List.Item.Meta
                  avatar={<Avatar src={item.Imagem} shape="square" size={48} />}
                  title={`${item.Nome} (${item.weight})`}
                  description={`Qtd: ${item.quantity} | R$ ${item.Preco}`}
                />
              </List.Item>
            )}
          />
        )}

        {cart.length > 0 && (
          <Button className="finalizar" type="primary" block onClick={() => setQrModalVisible(true)}>
            Finalizar Compra (QR)
          </Button>
        )}
      </Drawer>

      <Modal
        title="Escaneie o QR Code"
        open={qrModalVisible}
        onCancel={() => setQrModalVisible(false)}
        footer={null}
        destroyOnClose
        width={400}
      >
        <div id="reader" style={{ width: "100%" }} />
      </Modal>

      <Modal
        open={successModalVisible} // <-- Adicione isso
        footer={null}
        onCancel={() => setSuccessModalVisible(false)}
        centered
        closable={false}
      >
        <h2 style={{ textAlign: 'center', color: 'green' }}>🎉 Perfeito!</h2>
        <p style={{ textAlign: 'center' }}>Seu pedido foi enviado para a cozinha.</p>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <Button type="primary" onClick={() => setSuccessModalVisible(false)}>
            Ok
          </Button>
        </div>
      </Modal>

      <Modal
        open={errorModalVisible}
        footer={null}
        onCancel={() => setErrorModalVisible(false)}
        centered
        closable={false}
      >
        <h2 style={{ textAlign: 'center', color: 'red' }}>❌ Pedido não autorizado</h2>
        <p style={{ textAlign: 'center', color: '#b30000' }}>
          Houve um problema ao enviar seu pedido. <br />
          Por favor, chame um atendente para ajudar.
        </p>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <Button type="primary" danger onClick={() => setErrorModalVisible(false)}>
            Ok
          </Button>
        </div>
      </Modal>

    </>
  );
};

export default Cart;
