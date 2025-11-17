import React, { createContext, useContext, useState, useMemo, useCallback } from "react";
import { message } from "antd";
import { createCartKey } from "../utils/helpers";

const CartContext = createContext();

/**
 * Provider do contexto do carrinho
 * Gerencia o estado do carrinho e fornece métodos para manipulá-lo
 */
export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState([]);

  // Mapa otimizado de quantidades por produto
  const quantityMap = useMemo(() => {
    const map = {};
    for (const item of cart) {
      const key = createCartKey(item.Nome, item.weight);
      map[key] = item.quantity;
    }
    return map;
  }, [cart]);

  /**
   * Adiciona um produto ao carrinho ou incrementa sua quantidade
   */
  const addToCart = useCallback((product, weight) => {
    setCart((prevCart) => {
      const index = prevCart.findIndex(
        (item) => item.Nome === product.Nome && item.weight === weight
      );

      if (index !== -1) {
        // Produto já existe no carrinho, incrementa quantidade
        const updatedCart = [...prevCart];
        updatedCart[index] = {
          ...updatedCart[index],
          quantity: updatedCart[index].quantity + 1,
        };
        message.success(`Mais 1 unidade de ${product.Nome} (${weight}) adicionada ao carrinho`);
        return updatedCart;
      } else {
        // Produto novo no carrinho
        const precoFinal = product.PrecoPromocional || product.Preco;
        message.success(`${product.Nome} (${weight}) adicionado ao carrinho`);
        return [...prevCart, { ...product, Preco: precoFinal, weight, quantity: 1 }];
      }
    });
  }, []);

  /**
   * Remove completamente um produto do carrinho
   */
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

  /**
   * Decrementa a quantidade de um produto no carrinho
   * Remove o produto se a quantidade chegar a zero
   */
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

  /**
   * Limpa todo o carrinho
   */
  const clearCart = useCallback(() => {
    setCart([]);
    message.warning("Carrinho esvaziado");
  }, []);

  /**
   * Calcula o total do carrinho em centavos
   */
  const getCartTotal = useCallback(() => {
    return cart.reduce((sum, item) => {
      const price = item.PrecoPromocional && item.PrecoPromocional > 0
        ? item.PrecoPromocional
        : item.Preco;
      return sum + price * item.quantity;
    }, 0);
  }, [cart]);

  /**
   * Calcula o número total de itens no carrinho
   */
  const getCartItemsCount = useCallback(() => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  }, [cart]);

  return (
    <CartContext.Provider
      value={{
        cart,
        quantityMap,
        addToCart,
        removeFromCart,
        decreaseFromCart,
        clearCart,
        setCart,
        getCartTotal,
        getCartItemsCount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

/**
 * Hook para acessar o contexto do carrinho
 */
export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart deve ser usado dentro de um CartProvider");
  }
  return context;
};

export default CartContext;
