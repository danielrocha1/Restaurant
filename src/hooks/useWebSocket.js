import { useWebSocket as useWebSocketContext } from "../contexts/WebSocketContext";

/**
 * Hook customizado para facilitar o uso do WebSocket
 * Re-exporta o hook do contexto para manter a consistência
 */
export const useWebSocket = () => {
  return useWebSocketContext();
};

export default useWebSocket;
