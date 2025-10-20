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

  const isSendingRef = useRef(false);
  const [isSending, setIsSending] = useState(false);

  const { cart, addToCart, removeFromCart, clearCart, decreaseFromCart } = useCart();

  const toggleCart = () => setCartOpen(!cartOpen);

  // Total de itens no carrinho
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Total do carrinho em reais (Apenas para exibição)
  const totalPrice = cart.reduce((sum, item) => {
    const price = item.PrecoPromocional ? item.PrecoPromocional : item.Preco;
    return sum + (price / 100) * item.quantity;
  }, 0);

  // Effect para QR Code
  useEffect(() => {
    if (!qrModalVisible) return;

    let html5QrCode = null;
    const scannerStartedRef = { current: false };

    const timeout = setTimeout(() => {
      const readerElement = document.getElementById("reader");
      if (!readerElement) {
        console.error("Elemento #reader não encontrado");
        return;
      }

      html5QrCode = new Html5Qrcode("reader");

      const startPromise = html5QrCode.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: 250 },
        async (decodedText) => {
          if (isSendingRef.current) return;

          isSendingRef.current = true;
          setIsSending(true);

          try {
            // Mapeia os produtos para enviar ao backend
            const productList = cart.map(item => ({
              id: item.ID,
              quantity: item.quantity,
              // ✅ CORREÇÃO APLICADA: Enviar o preço em CENTAVOS (inteiro)
              price: (item.PrecoPromocional ?? item.Preco) 
            }));

            const response = await fetch('https://restaurant-sw98.onrender.com/checkout', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                qrCode: decodedText,
                items: productList, // Agora os itens têm "price" como inteiro
                total: Math.round(totalPrice * 100), // "total" também como inteiro
              }),
            });

            if (!response.ok) {
              // Tenta ler a mensagem de erro do backend
              let errorMsg = `Erro na requisição: ${response.status} ${response.statusText}`;
              try {
                const errorData = await response.json();
                if (errorData && errorData.error) {
                  errorMsg = errorData.error;
                }
              } catch (e) { /* Ignora se a resposta não for JSON */ }

              if (scannerStartedRef.current) {
                await html5QrCode.stop().catch(err => console.debug("Erro ao parar scanner no erro:", err?.message || err));
                scannerStartedRef.current = false;
              }
              setQrModalVisible(false);
              setErrorModalVisible(true);
              throw new Error(errorMsg); // Joga o erro com a msg do backend
            }

            if (scannerStartedRef.current) {
              await html5QrCode.stop().catch(err => console.debug("Erro ao parar scanner após sucesso:", err?.message || err));
              scannerStartedRef.current = false;
            }

            setQrModalVisible(false);
            setCartOpen(false);
            clearCart();
            setSuccessModalVisible(true);

          } catch (error) {
            // Log de erro melhorado (que você já tinha aplicado)
            console.error('Erro detalhado ao enviar pedido:', {
              message: error.message,
              stack: error.stack,
              errorObject: error
            });

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

      startPromise
        .then(() => { scannerStartedRef.current = true; console.log("Scanner iniciado."); })
        .catch(err => { scannerStartedRef.current = false; console.error("Falha ao iniciar scanner:", err); });

    }, 300);

    return () => {
      clearTimeout(timeout);
      if (html5QrCode && scannerStartedRef.current) {
        html5QrCode.stop().catch(err => console.debug("Erro ao parar scanner no cleanup:", err?.message || err));
        scannerStartedRef.current = false;
      }
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
            <strong>Total: {totalPrice.toLocaleString('pt-BR', { style: 'currency', 'currency': 'BRL' })}</strong>
            <Button onClick={clearCart} danger>Limpar Carrinho</Button>
          </div>
        }
      >
        {cart.length === 0 ? (
          <p>Seu carrinho está vazio.</p>
        ) : (
          <List
            itemLayout="horizontal"
            dataSource={cart}
            renderItem={item => (
              <List.Item
                actions={[
                  <Button icon={<MinusOutlined />} onClick={() => decreaseFromCart(item.Nome, item.weight)} type="text" disabled={item.quantity === 1} />,
                  <Button icon={<PlusOutlined />} onClick={() => addToCart(item, item.weight)} type="text" />,
                  <Button icon={<DeleteOutlined />} onClick={() => removeFromCart(item.Nome, item.weight, true)} type="text" />
                ]}
              >
                <List.Item.Meta
                  avatar={<Avatar src={item.Imagem} shape="square" size={48} />}
                  title={`${item.Nome} (${item.weight})`}
                  description={`Qtd: ${item.quantity} | ${((item.PrecoPromocional ? item.PrecoPromocional : item.Preco) / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`}
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
            disabled={isSending}
          >
            {isSending ? 'Enviando...' : 'Finalizar Compra (QR)'}
          </Button>
        )}
      </Drawer>

      <Modal title="Escaneie o QR Code" open={qrModalVisible} onCancel={() => setQrModalVisible(false)} footer={null} destroyOnClose width={400}>
        <div id="reader" style={{ width: "100%" }} />
      </Modal>

      <Modal open={successModalVisible} footer={null} onCancel={() => setSuccessModalVisible(false)} centered closable={false}>
        <h2 style={{ textAlign: 'center', color: 'green' }}>🎉 Perfeito!</h2>
        <p style={{ textAlign: 'center' }}>Seu pedido foi enviado para a cozinha.</p>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <Button type="primary" onClick={() => setSuccessModalVisible(false)}>Ok</Button>
        </div>
      </Modal>

      <Modal open={errorModalVisible} footer={null} onCancel={() => setErrorModalVisible(false)} centered closable={false}>
        <h2 style={{ textAlign: 'center', color: 'red' }}>❌ Pedido não autorizado</h2>
        <p style={{ textAlign: 'center', color: '#b30000' }}>
          Houve um problema ao enviar seu pedido. <br />
          Por favor, chame um atendente para ajudar.
        </p>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <Button type="primary" danger onClick={() => setErrorModalVisible(false)}>Ok</Button>
        </div>
      </Modal>
    </>
  );
};

export default Cart;