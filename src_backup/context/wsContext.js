import { createContext, useContext, useState, useEffect } from "react";
import { WS_URL } from "../config/config";

const WSContext = createContext();

export const WSProvider = ({ children }) => {
  const [messages, setMessages] = useState([]);

 useEffect(() => {
  const ws = new WebSocket(WS_URL);
   const MAX_MESSAGES = 100;
 
 

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
      setMessages((prev) => {
      const newMessages = [...prev, data];
      return newMessages.slice(-MAX_MESSAGES); // mantém só últimas 100
    });
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
