import React, { useState, useEffect, useRef } from "react";
import { Badge, Drawer, Button, List, Avatar, Modal } from "antd";
import {
  ShoppingCartOutlined,
  MinusOutlined,
  PlusOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import { Html5Qrcode } from "html5-qrcode";
import { useCart } from "../../contexts/CartContext";
import { createOrder } from "../../api/services/order.service";
import { formatPrice, getFinalPrice } from "../../utils/helpers";
import "./Cart.css";

/**
 * Componente de carrinho de compras
 * Exibe os itens do carrinho e permite finalizar o pedido
 */
const Cart = () => {
  const [cartOpen, setCartOpen] = useState(false);
  const [qrModalVisible, setQrModalVisible] = useState(false);
  const [successModalVisible, setSuccessModalVisible] = useState(false);
  const [errorModalVisible, setErrorModalVisible] = useState(false);

  const isSendingRef = useRef(false);
  const [isSending, setIsSending] = useState(false);

  const {
    cart,
    addToCart,
    removeFromCart,
    clearCart,
    decreaseFromCart,
    getCartTotal,
    getCartItemsCount,
  } = useCart();

  const toggleCart = () => {
    setCartOpen(!cartOpen);
  };

  // Total de itens no carrinho
  const totalItems = getCartItemsCount();

  // Total do carrinho em reais (para exibição)
  const totalPrice = getCartTotal() / 100;

  // Effect para QR Code Scanner
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
            const productList = cart.map((item) => ({
              id: item.ID,
              quantity: item.quantity,
              price: getFinalPrice(item), // Preço em centavos
            }));

            const totalInCents = Math.round(totalPrice * 100);

            await createOrder(productList, totalInCents, decodedText);

            if (scannerStartedRef.current) {
              await html5QrCode
                .stop()
                .catch((err) =>
                  console.debug("Erro ao parar scanner após sucesso:", err?.message || err)
                );
              scannerStartedRef.current = false;
            }

            setQrModalVisible(false);
            setCartOpen(false);
            clearCart();
            setSuccessModalVisible(true);
          } catch (error) {
            console.error("Erro detalhado ao enviar pedido:", {
              message: error.message,
              stack: error.stack,
              errorObject: error,
            });

            if (scannerStartedRef.current) {
              await html5QrCode
                .stop()
                .catch((err) =>
                  console.debug("Erro ao parar scanner no erro:", err?.message || err)
                );
              scannerStartedRef.current = false;
            }
            setQrModalVisible(false);
            setErrorModalVisible(true);
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
        .then(() => {
          scannerStartedRef.current = true;
          console.log("Scanner iniciado.");
        })
        .catch((err) => {
          scannerStartedRef.current = false;
          console.error("Falha ao iniciar scanner:", err);
        });
    }, 300);

    return () => {
      clearTimeout(timeout);
      if (html5QrCode && scannerStartedRef.current) {
        html5QrCode
          .stop()
          .catch((err) =>
            console.debug("Erro ao parar scanner no cleanup:", err?.message || err)
          );
        scannerStartedRef.current = false;
      }
      isSendingRef.current = false;
      setIsSending(false);
    };
  }, [qrModalVisible, cart, clearCart, totalPrice]);

  return (
    <>
      <Badge
        style={{ marginRight: "25px", marginTop: "20px" }}
        count={totalItems}
        size="medium"
        onClick={toggleCart}
      >
        <div className="cart-btn">
          <ShoppingCartOutlined className="cart-icon" />
        </div>
      </Badge>

      <Drawer
        title="Seu Carrinho"
        placement="right"
        onClose={toggleCart}
        open={cartOpen}
        width={470}
        footer={
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <strong>
              Total: {totalPrice.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
            </strong>
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
                  />,
                ]}
              >
                <List.Item.Meta
                  avatar={<Avatar src={item.Imagem} shape="square" size={48} />}
                  title={`${item.Nome} (${item.weight})`}
                  description={`Qtd: ${item.quantity} | ${formatPrice(getFinalPrice(item))}`}
                />
              </List.Item>
            )}
          />
        )}

        {cart.length > 0 && (
          <Button
            className="finalizar"
            type=" "
            block
            onClick={() => setQrModalVisible(true)}
            disabled={isSending}
          >
            {isSending ? "Enviando..." : "Finalizar Compra (QR)"}
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
        <h2 style={{ textAlign: "center", color: "green" }}>🎉 Perfeito!</h2>
        <p style={{ textAlign: "center" }}>Seu pedido foi enviado para a cozinha.</p>
        <div style={{ display: "flex", justifyContent: "center" }}>
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
        <h2 style={{ textAlign: "center", color: "red" }}>❌ Pedido não autorizado</h2>
        <p style={{ textAlign: "center", color: "#b30000" }}>
          Houve um problema ao enviar seu pedido. <br />
          Por favor, chame um atendente para ajudar.
        </p>
        <div style={{ display: "flex", justifyContent: "center" }}>
          <Button type="primary" danger onClick={() => setErrorModalVisible(false)}>
            Ok
          </Button>
        </div>
      </Modal>
    </>
  );
};

export default Cart;
