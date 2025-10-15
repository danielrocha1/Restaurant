import React, { useState, useEffect, useRef } from 'react';
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

  // Flag para evitar múltiplos envios concurrentes (guard rápido, não re-render)
  const isSendingRef = useRef(false);
  // Estado para refletir na UI (desabilitar botão, mostrar loader, etc.)
  const [isSending, setIsSending] = useState(false);

  const { cart, addToCart, removeFromCart, clearCart, decreaseFromCart } = useCart();

  const toggleCart = () => setCartOpen(!cartOpen);

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = cart.reduce((sum, item) => {
    const cleanPrice = parseFloat((item.Preco || "").replace("R$", "").replace(",", ".").trim());
    return sum + (isNaN(cleanPrice) ? 0 : cleanPrice * item.quantity);
  }, 0);

  useEffect(() => {
  if (!qrModalVisible) return;

  let html5QrCode = null;
  const scannerStartedRef = { current: false }; // objeto local — não precisa re-render

  const timeout = setTimeout(() => {
    const readerElement = document.getElementById("reader");
    if (!readerElement) {
      console.error("Elemento #reader não encontrado");
      return;
    }

    html5QrCode = new Html5Qrcode("reader");

    // Inicia o scanner. start() retorna uma Promise que resolve quando a câmera está ativa.
    const startPromise = html5QrCode.start(
      { facingMode: "environment" },
      { fps: 10, qrbox: 250 },
      async (decodedText /*, decodedResult */) => {
        if (isSendingRef.current) {
          console.log("Já enviando pedido — ignorando scan duplicado.");
          return;
        }

        isSendingRef.current = true;
        setIsSending(true);

        try {
          const productList = cart.map(item => ({
            id: item.ID,
            quantity: item.quantity,
            price: item.PrecoPromocional
              ? parseFloat(item.PrecoPromocional)
              : parseFloat(item.Preco)
          }));

          const response = await fetch('http://192.168.0.105:4000/checkout', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              qrCode: decodedText,
              items: productList,
              total: Number(totalPrice.toFixed(2))
            }),
          });

          if (!response.ok) {
            // só tenta parar se o scanner estiver rodando
            if (scannerStartedRef.current) {
              await html5QrCode.stop().catch(err => {
                console.debug("Erro ao parar scanner no erro de requisição (ignorado):", err?.message || err);
              });
              scannerStartedRef.current = false;
            }
            setQrModalVisible(false);
            setErrorModalVisible(true);
            throw new Error(`Erro na requisição: ${response.statusText}`);
          }

          // sucesso: pare o scanner se estiver rodando
          if (scannerStartedRef.current) {
            await html5QrCode.stop().catch(err => {
              console.debug("Erro ao parar scanner após sucesso (ignorado):", err?.message || err);
            });
            scannerStartedRef.current = false;
          }
          setQrModalVisible(false);
          setCartOpen(false);
          clearCart();
          setSuccessModalVisible(true);
        } catch (error) {
          console.error('Erro ao enviar pedido para o backend:', error);
        } finally {
          isSendingRef.current = false;
          setIsSending(false);
        }
      },
      (errorMessage) => {
        if (!errorMessage.includes("NotFoundException")) {
          console.warn("Erro QR:", errorMessage);
        }
      }
    );

    // quando start() resolve, marcamos que o scanner realmente iniciou
    startPromise
      .then(() => {
        scannerStartedRef.current = true;
        console.log("Scanner iniciado.");
      })
      .catch(err => {
        // se o start falhar (ex: permissão negada), garantimos que a flag fique falsa
        scannerStartedRef.current = false;
        console.error("Falha ao iniciar scanner:", err);
      });

  }, 300);

  // cleanup: só chamar stop() se o scanner tiver realmente iniciado
  return () => {
    clearTimeout(timeout);
    if (html5QrCode && scannerStartedRef.current) {
      html5QrCode.stop().catch(err => {
        // ignora o erro "Cannot stop..." e loga só debug
        console.debug("Erro ao parar scanner no cleanup (ignorado):", err?.message || err);
      });
      scannerStartedRef.current = false;
    }
    // garante liberar a flag global de envio
    isSendingRef.current = false;
    setIsSending(false);
  };
}, [qrModalVisible, cart, clearCart, totalPrice]);



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
          <Button
            className="finalizar"
            type="primary"
            block
            onClick={() => setQrModalVisible(true)}
            disabled={isSending} // desabilita botão enquanto estiver enviando
          >
            {isSending ? 'Enviando...' : 'Finalizar Compra (QR)'}
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
        open={successModalVisible}
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
