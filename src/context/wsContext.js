import { createContext, useContext, useState, useEffect } from "react";

const WSContext = createContext();

export const WSProvider = ({ children }) => {
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    const ws = new WebSocket("wss://restaurant-2dfg.onrender.com/ws");

    ws.onopen = () => console.log("📡 [WS] Conectado");
    ws.onerror = (err) => console.error("💥 [WS] Erro", err);
    ws.onclose = () => console.log("📡 [WS] Desconectado");

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log("📩 [WS] Mensagem recebida:", data);
        setMessages((prev) => [...prev, data]);
      } catch (err) {
        console.error("💥 [WS] Falha ao processar mensagem:", err, event.data);
      }
    };

    return () => ws.close();
  }, []);

  return (
    <WSContext.Provider value={{ messages }}>
      {children}
    </WSContext.Provider>
  );
};

export const useWS = () => {
  console.log("📡 [useWS] Hook chamado");
  return useContext(WSContext);
};
