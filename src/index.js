import React from "react";
import ReactDOM from "react-dom/client";
import Menu from "./pages/Menu/Menu";
import { CartProvider } from "./contexts/CartContext";
import { WebSocketProvider } from "./contexts/WebSocketContext";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <WebSocketProvider>
    <CartProvider>
      <Menu />
    </CartProvider>
  </WebSocketProvider>
);
