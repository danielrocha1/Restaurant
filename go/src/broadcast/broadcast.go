package broadcast

import (
	"Restaurant/src/models"
	"encoding/json"
	"log"
	"sync"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/gorilla/websocket"
)

// --- Configurações de timeout / limites ---
const (
	// tempo máximo para escrita de uma mensagem
	writeWait = 10 * time.Second
	// tempo máximo para receber um PONG (considera conexão viva)
	pongWait = 60 * time.Second
	// intervalo entre PINGs — deve ser menor do que pongWait
	pingPeriod = (pongWait * 9) / 10
	// limite máximo de bytes por mensagem recebida
	maxMessageSize = 512 << 10 // 512KB (ajuste se precisar)
)

// Client representa um cliente WebSocket conectado.
type Client struct {
	conn *websocket.Conn
	send chan []byte
}

// Hub mantém todos os clientes conectados e distribui mensagens.
type Hub struct {
	clients    map[*Client]bool
	broadcast  chan interface{}
	register   chan *Client
	unregister chan *Client
	mu         sync.Mutex
}

// Instância global do Hub
var GlobalHub = NewHub()

// NewHub cria um novo Hub
func NewHub() *Hub {
	return &Hub{
		clients:    make(map[*Client]bool),
		broadcast:  make(chan interface{}),
		register:   make(chan *Client),
		unregister: make(chan *Client),
	}
}

// Run inicia o Hub e processa os canais
func (h *Hub) Run() {
	for {
		select {
		case client := <-h.register:
			h.mu.Lock()
			h.clients[client] = true
			h.mu.Unlock()
			log.Println("Novo cliente WebSocket conectado.")

		case client := <-h.unregister:
			h.mu.Lock()
			if _, ok := h.clients[client]; ok {
				delete(h.clients, client)
				close(client.send)
				_ = client.conn.Close()
			}
			h.mu.Unlock()
			log.Println("Cliente WebSocket desconectado.")

		case update := <-h.broadcast:
			msg, err := json.Marshal(update)
			if err != nil {
				log.Printf("Erro ao serializar payload de broadcast: %v\n", err)
				continue
			}

			h.mu.Lock()
			n := 0
			for client := range h.clients {
				select {
				case client.send <- msg:
					n++
				default:
					// canal bloqueado -> considerar cliente morto
					close(client.send)
					delete(h.clients, client)
					_ = client.conn.Close()
				}
			}
			h.mu.Unlock()
			// log com info segura: número de clientes e tipo do payload
			log.Printf("Broadcast enviado para %d clientes. Tipo do payload: %T\n", n, update)
		}
	}
}

// BroadcastNewOrder envia uma atualização de novo pedido para todos os clientes
func BroadcastNewOrder(order models.Order, mesaID uint) {
	message := fiber.Map{
		"action": "newOrder",
		"mesaid": mesaID,
		"order":  order,
	}

	GlobalHub.broadcast <- message
	log.Printf("[BROADCAST] newOrder mesaID=%d enviado.\n", mesaID)
}


func BroadcastProductUpdate(produto models.Produto, label map[string]interface{}) {
	message := fiber.Map{
		"action":  "update",
		"label":   label,
		"produto": produto,
	}

	GlobalHub.broadcast <- message
	log.Printf("[BROADCAST] Produto ID %d enviado com ação 'update'.\n", produto.ID)
}

func BroadcastNewTable(MesaID map[string]uint) {
	message := fiber.Map{
		"action": "addTable",
		"table":  MesaID,
	}

	GlobalHub.broadcast <- message
	log.Printf("[BROADCAST] addTable enviado. MesaID: %v\n", MesaID)
}

func BroadcastCloseTable(MesaID map[string]uint) {
	message := fiber.Map{
		"action": "closeTable",
		"table":  MesaID,
	}

	GlobalHub.broadcast <- message
	log.Printf("[BROADCAST] addTable enviado. MesaID: %v\n", MesaID)
}
// readPump lê mensagens do WebSocket (principalmente para detectar desconexão)
func (c *Client) readPump() {
	// configurar limites e handler de PONG
	c.conn.SetReadLimit(maxMessageSize)
	_ = c.conn.SetReadDeadline(time.Now().Add(pongWait))
	c.conn.SetPongHandler(func(appData string) error {
		// ao receber PONG, extendemos o deadline de leitura
		_ = c.conn.SetReadDeadline(time.Now().Add(pongWait))
		return nil
	})

	defer func() {
		GlobalHub.unregister <- c
		_ = c.conn.Close()
	}()

	for {
		// aqui não processamos mensagens de aplicação; apenas mantemos leitura
		_, _, err := c.conn.ReadMessage()
		if err != nil {
			// log opcional para debugging (não poluir logs em produção)
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Printf("Read error (unexpected): %v\n", err)
			}
			return
		}
		// se quiser processar mensagens vindas do cliente, faça aqui
	}
}

// writePump escreve mensagens para o WebSocket e envia pings periódicos
func (c *Client) writePump() {
	ticker := time.NewTicker(pingPeriod)
	defer func() {
		ticker.Stop()
		_ = c.conn.Close()
	}()

	for {
		select {
		case msg, ok := <-c.send:
			_ = c.conn.SetWriteDeadline(time.Now().Add(writeWait))
			if !ok {
				// hub fechou o canal -> enviamos close
				_ = c.conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}

			// usamos NextWriter para evitar escrever mensagens fragmentadas de forma insegura
			w, err := c.conn.NextWriter(websocket.TextMessage)
			if err != nil {
				return
			}
			if _, err := w.Write(msg); err != nil {
				_ = w.Close()
				return
			}
			if err := w.Close(); err != nil {
				return
			}

		case <-ticker.C:
			// enviar PING para cliente
			_ = c.conn.SetWriteDeadline(time.Now().Add(writeWait))
			if err := c.conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				// falha no ping -> encerrar conexão
				return
			}
		}
	}
}

// HandleConnection cria um cliente e inicia read/write pumps
func HandleConnection(conn *websocket.Conn) {
	// inicializar prazos básicos imediatamente (defensivo)
	conn.SetReadLimit(maxMessageSize)
	_ = conn.SetReadDeadline(time.Now().Add(pongWait))
	conn.SetPongHandler(func(appData string) error {
		_ = conn.SetReadDeadline(time.Now().Add(pongWait))
		return nil
	})

	client := &Client{
		conn: conn,
		send: make(chan []byte, 256),
	}
	GlobalHub.register <- client

	// iniciar goroutines
	go client.writePump()
	go client.readPump()
}
