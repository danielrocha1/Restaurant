package models

// ProductUpdate é a estrutura que representa a alteração no produto.
// Os campos com tags `json:"..."` serão usados na serialização para o cliente.
type ProductUpdate struct {
	ID               int     `json:"id"`
	Nome             string  `json:"nome"`
	Active           bool    `json:"active"`
	Preco            uint `json:"preco"`
	PrecoPromocional uint `json:"preco_promocional"`
}