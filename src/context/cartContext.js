import React, { createContext, useContext, useState } from "react";

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState([]);

  const getQuantity = (name, weight) => {
    const item = cart.find((item) => item.name === name && item.weight === weight);
    return item ? item.quantity : 0;
  };
  

  const addToCart = (product, weight) => {
    const existingIndex = cart.findIndex(
      (item) => item.name === product.name && item.weight === weight
    );

    if (existingIndex !== -1) {
      const updatedCart = [...cart];
      updatedCart[existingIndex].quantity += 1;
      setCart(updatedCart);
    } else {
      setCart([
        ...cart,
        {
          ...product,
          weight,
          quantity: 1,
        },
      ]);
    }
  };

  const removeFromCart = (name, weight) => {
    setCart(cart.filter((item) => item.name !== name || item.weight !== weight));
  };

  const clearCart = () => {
    setCart([]);
  };

  return (
    <CartContext.Provider value={{ cart, addToCart, removeFromCart, clearCart, getQuantity }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
