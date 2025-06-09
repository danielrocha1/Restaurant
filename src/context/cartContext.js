import React, { createContext, useContext, useState, useMemo, useCallback } from "react";
import { message } from "antd"; // importa as mensagens do Ant Design

const CartContext = createContext();

const createKey = (name, weight) => `${name}_${weight}`;

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState([]);

  // quantityMap otimizado
  const quantityMap = useMemo(() => {
    const map = {};
    for (const item of cart) {
      const key = createKey(item.Nome, item.weight);
      map[key] = item.quantity;
    }
    return map;
  }, [cart]);

 const addToCart = useCallback((product, weight) => {
  setCart((prevCart) => {
    const index = prevCart.findIndex(
      (item) => item.Nome === product.Nome && item.weight === weight
    );

    if (index !== -1) {
      const updatedCart = [...prevCart];
      updatedCart[index] = {
        ...updatedCart[index],
        quantity: updatedCart[index].quantity + 1,
      };
      message.success(`Mais 1 unidade de ${product.Nome} (${weight}) adicionada ao carrinho`);
      return updatedCart;
    } else {
      const precoFinal = product.PrecoPromocional || product.Preco;
      message.success(`${product.Nome} (${weight}) adicionado ao carrinho`);
      return [...prevCart, { ...product, Preco: precoFinal, weight, quantity: 1 }];
    }
  });
}, []);

  const removeFromCart = useCallback((name, weight) => {
    setCart((prevCart) => {
      const newCart = prevCart.filter(
        (item) => item.Nome !== name || item.weight !== weight
      );
      if (newCart.length < prevCart.length) {
        message.info(`${name} (${weight}) removido do carrinho`);
      }
      return newCart;
    });
  }, []);

  const decreaseFromCart = useCallback((name, weight) => {
    setCart((prevCart) => {
      let itemRemoved = false;

      const newCart = prevCart
        .map((item) => {
          if (item.Nome === name && item.weight === weight) {
            const newQuantity = item.quantity - 1;
            if (newQuantity > 0) {
              message.info(`1 unidade de ${name} (${weight}) removida`);
              return { ...item, quantity: newQuantity };
            } else {
              itemRemoved = true;
              return null;
            }
          }
          return item;
        })
        .filter(Boolean);

      if (itemRemoved) {
        message.info(`${name} (${weight}) removido do carrinho`);
      }

      return newCart;
    });
  }, []);

  const clearCart = useCallback(() => {
    setCart([]);
    message.warning("Carrinho esvaziado");
  }, []);

  return (
    <CartContext.Provider
      value={{
        cart,
        quantityMap,
        addToCart,
        removeFromCart,
        decreaseFromCart,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
