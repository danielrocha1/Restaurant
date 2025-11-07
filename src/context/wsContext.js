import { createContext, useContext, useState, useEffect } from "react";

const WSContext = createContext();

export const WSProvider = ({ children }) => {
  const [messages, setMessages] = useState([]);

 useEffect(() => {
  const ws = new WebSocket("wss://restaurant-2dfg.onrender.com/ws");

  ws.onopen = () => console.log("📡 [WS] Conectado");
  ws.onerror = (err) => console.error("💥 [WS] Erro:", err);
  ws.onclose = () => console.log("📴 [WS] Desconectado");

  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);

      if (data.type === "ping") {
        console.log("🏓 [WS] Ping recebido → enviando Pong");
        ws.send(JSON.stringify({ type: "pong" }));
        return;
      }

      console.log("📩 [WS] Mensagem recebida:", data);
      setMessages((prev) => [...prev, data]);
    } catch (err) {
      console.error("💥 [WS] Erro ao processar mensagem:", err, event.data);
    }
  };

  return () => {
    console.log("🔌 [WS] Fechando conexão...");
    ws.close();
  };
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
