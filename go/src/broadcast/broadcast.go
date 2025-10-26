package broadcast

import (
	"Restaurant/src/models"
	"encoding/json"
	"log"
	"sync"

	"github.com/gofiber/fiber/v2"

	"github.com/gorilla/websocket"
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
				client.conn.Close()
			}
			h.mu.Unlock()
			log.Println("Cliente WebSocket desconectado.")

		case update := <-h.broadcast:
			msg, err := json.Marshal(update)
			if err != nil {
				log.Println("Erro ao serializar ProductUpdate:", err)
				continue
			}

			h.mu.Lock()
			for client := range h.clients {
				select {
				case client.send <- msg:
				default:
					close(client.send)
					delete(h.clients, client)
					client.conn.Close()
				}
			}
			h.mu.Unlock()
			log.Printf("Broadcast: Produto %d enviado para %d clientes.\n", update, len(h.clients))
		}
	}
}

// BroadcastProductUpdate envia uma atualização de produto para todos os clientes
func BroadcastNewOrder(order models.Order, mesaID uint ) {
	message := fiber.Map{
		"action":  "newOrder",
		"mesaid":   mesaID,
		"order": order,
	}

	GlobalHub.broadcast <- message
	log.Printf("[BROADCAST] Produto ID %d enviado com ação 'update'.", mesaID)
}
func BroadcastProductUpdate(produto models.Produto, label map[string]interface{}) {
	message := fiber.Map{
		"action":  "update",
		"label":   label,
		"produto": produto,
	}

	GlobalHub.broadcast <- message
	log.Printf("[BROADCAST] Produto ID %d enviado com ação 'update'.", produto.ID)
}

func BroadcastNewTable(MesaID map[string]uint) {
	message := fiber.Map{
		"action": "addTable",
		"table":  MesaID,
	}

	GlobalHub.broadcast <- message
	log.Printf("[BROADCAST Table] Mesa ID %d enviado com ação 'addTable'.", MesaID)
}

// readPump lê mensagens do WebSocket (principalmente para detectar desconexão)
func (c *Client) readPump() {
	defer func() {
		GlobalHub.unregister <- c
		c.conn.Close()
	}()

	for {
		if _, _, err := c.conn.ReadMessage(); err != nil {
			return
		}
		// Processar mensagens recebidas do cliente aqui, se necessário
	}
}

// writePump escreve mensagens para o WebSocket
func (c *Client) writePump() {
	defer c.conn.Close()
	for {
		select {
		case msg, ok := <-c.send:
			if !ok {
				c.conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}
			if err := c.conn.WriteMessage(websocket.TextMessage, msg); err != nil {
				return
			}
		}
	}
}

// HandleConnection cria um cliente e inicia read/write pumps
func HandleConnection(conn *websocket.Conn) {
	client := &Client{
		conn: conn,
		send: make(chan []byte, 256),
	}
	GlobalHub.register <- client

	go client.writePump()
	go client.readPump()
}
