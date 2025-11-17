import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { CartProvider } from "./context/cartContext";
import { WSProvider } from "./context/wsContext"

ReactDOM.createRoot(document.getElementById("root")).render(
  <WSProvider>
    <CartProvider>
      <App />
    </CartProvider>
  </WSProvider>

);
