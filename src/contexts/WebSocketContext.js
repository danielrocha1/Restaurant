import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { WS_URL } from "../api/client";

const WebSocketContext = createContext();

const MAX_MESSAGES = 100;

/**
 * Provider do contexto do WebSocket
 * Gerencia a conexão WebSocket e as mensagens recebidas
 */
export const WebSocketProvider = ({ children }) => {
  const [messages, setMessages] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [ws, setWs] = useState(null);

  useEffect(() => {
    const websocket = new WebSocket(WS_URL);

    websocket.onopen = () => {
      console.log("📡 [WS] Conectado");
      setIsConnected(true);
    };

    websocket.onerror = (err) => {
      console.error("💥 [WS] Erro:", err);
      setIsConnected(false);
    };

    websocket.onclose = () => {
      console.log("📴 [WS] Desconectado");
      setIsConnected(false);
    };

    websocket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        // Responde a pings automaticamente
        if (data.type === "ping") {
          console.log("🏓 [WS] Ping recebido → enviando Pong");
          websocket.send(JSON.stringify({ type: "pong" }));
          return;
        }

        console.log("📩 [WS] Mensagem recebida:", data);
        setMessages((prev) => {
          const newMessages = [...prev, data];
          // Mantém apenas as últimas MAX_MESSAGES mensagens
          return newMessages.slice(-MAX_MESSAGES);
        });
      } catch (err) {
        console.error("💥 [WS] Erro ao processar mensagem:", err, event.data);
      }
    };

    setWs(websocket);

    return () => {
      console.log("🔌 [WS] Fechando conexão...");
      websocket.close();
    };
  }, []);

  /**
   * Envia uma mensagem através do WebSocket
   */
  const sendMessage = useCallback(
    (message) => {
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(message));
        console.log("📤 [WS] Mensagem enviada:", message);
      } else {
        console.warn("⚠️ [WS] WebSocket não está conectado");
      }
    },
    [ws]
  );

  /**
   * Limpa o histórico de mensagens
   */
  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  return (
    <WebSocketContext.Provider
      value={{
        messages,
        isConnected,
        sendMessage,
        clearMessages,
      }}
    >
      {children}
    </WebSocketContext.Provider>
  );
};

/**
 * Hook para acessar o contexto do WebSocket
 */
export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error("useWebSocket deve ser usado dentro de um WebSocketProvider");
  }
  return context;
};

export default WebSocketContext;
