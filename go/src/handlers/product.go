package handlers

import (
	"log"
	"strconv"
	"encoding/json"
	"Restaurant/src/database"
	"Restaurant/src/models"
	"errors"
	"gorm.io/gorm"
	// Importamos o pacote main para acessar a função de broadcast
	"Restaurant/src/broadcast"

	"github.com/gofiber/fiber/v2"
)

// GetProdutos retorna todos os produtos cadastrados.
func GetProdutos(c *fiber.Ctx) error {
	var produtos []models.Produto
	if err := database.DB.Find(&produtos).Error; err != nil {
		log.Printf("[GetProdutos] Erro ao buscar produtos: %v", err)
		return c.Status(500).JSON(fiber.Map{"error": "Erro ao buscar produtos"})
	}
	return c.JSON(produtos)
}

// GetProduto retorna um produto pelo ID.
func GetProduto(c *fiber.Ctx) error {
	id := c.Params("id")
	var produto models.Produto
	if id == "" {
		return c.Status(400).JSON(fiber.Map{"error": "ID do produto é obrigatório"})
	}
	if err := database.DB.First(&produto, id).Error; err != nil {
		log.Printf("[GetProduto] Produto ID %s não encontrado: %v", id, err)
		return c.Status(404).JSON(fiber.Map{"error": "Produto não encontrado"})
	}
	return c.JSON(produto)
}

// CreateProduto cria um novo produto após validar os campos obrigatórios.
func CreateProduto(c *fiber.Ctx) error {
	var produto models.Produto
	if err := c.BodyParser(&produto); err != nil {
		log.Printf("[CreateProduto] Erro ao fazer parse do body: %v", err)
		return c.Status(400).JSON(fiber.Map{"error": "JSON inválido"})
	}
	// Validação de campos obrigatórios
	if produto.Nome == "" || produto.Preco == 0 || produto.SubcategoriaID == 0 {
		return c.Status(400).JSON(fiber.Map{"error": "Nome, preço e subcategoria são obrigatórios"})
	}
	if err := database.DB.Create(&produto).Error; err != nil {
		log.Printf("[CreateProduto] Erro ao criar produto: %v", err)
		return c.Status(500).JSON(fiber.Map{"error": "Erro ao criar produto"})
	}
	log.Printf("[Handler] Novo produto criado e broadcast enviado. ID: %d", produto.ID)
	broadcast.BroadcastProductUpdate(produto, map[string]interface{}{"create": true})
	return c.JSON(produto)
}

// UpdateProduto atualiza um produto existente e envia broadcast.
func UpdateProduto(c *fiber.Ctx) error {
	id := c.Params("id")
	var produto models.Produto
	if id == "" {
		return c.Status(400).JSON(fiber.Map{"error": "ID do produto é obrigatório"})
	}
	if err := database.DB.First(&produto, id).Error; err != nil {
		log.Printf("[UpdateProduto] Produto ID %s não encontrado.", id)
		return c.Status(404).JSON(fiber.Map{"error": "Produto não encontrado"})
	}

	// Lê o body raw para podermos decodificar tanto em struct quanto em map
	body := c.Body()

	// Decodifica em struct (opcional)
	var updatedData models.Produto
	if err := json.Unmarshal(body, &updatedData); err != nil {
		log.Printf("[UpdateProduto] Falha ao unmarshal para struct: %v", err)
	}

	// Decodifica em map para capturar valores zero explicitamente
	var updatesMap map[string]interface{}
	if err := json.Unmarshal(body, &updatesMap); err != nil {
		log.Printf("[UpdateProduto] Falha ao unmarshal para map: %v", err)
		return c.Status(400).JSON(fiber.Map{"error": "Corpo inválido"})
	}

	// Validação de campos obrigatórios para update (exemplo: nome não pode ser vazio se enviado)
	if v, ok := updatesMap["nome"]; ok && v == "" {
		return c.Status(400).JSON(fiber.Map{"error": "Nome não pode ser vazio"})
	}
	if v, ok := updatesMap["preco"]; ok && v == 0 {
		return c.Status(400).JSON(fiber.Map{"error": "Preço não pode ser zero"})
	}
	if v, ok := updatesMap["subcategoria_id"]; ok && v == 0 {
		return c.Status(400).JSON(fiber.Map{"error": "Subcategoria é obrigatória"})
	}

	if err := database.DB.Model(&produto).Updates(updatesMap).Error; err != nil {
		log.Printf("[UpdateProduto] Falha ao atualizar produto: %v", err)
		return c.Status(500).JSON(fiber.Map{"error": "Erro ao atualizar produto"})
	}

	// Recarrega o produto do banco após atualização
	if err := database.DB.Preload("Subcategoria.Categoria").First(&produto, id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return c.Status(404).JSON(fiber.Map{"error": "Produto não encontrado após update"})
		}
		log.Printf("[UpdateProduto] Falha ao recarregar produto %s após update: %v", id, err)
		return c.Status(500).JSON(fiber.Map{"error": "Erro ao recarregar produto"})
	}

	log.Printf("[UpdateProduto] Produto atualizado (ID %s): Nome=%s | Preço=%d | Promo=%d | Active=%t", id, produto.Nome, produto.Preco, produto.PrecoPromocional, produto.Active)
	broadcast.BroadcastProductUpdate(produto, updatesMap)
	log.Printf("[BROADCAST] Produto ID %s enviado para os clientes WebSocket.", id)
	return c.JSON(produto)
}



// DeleteProduto remove um produto pelo ID.
func DeleteProduto(c *fiber.Ctx) error {
	id := c.Params("id")
	if id == "" {
		return c.Status(400).JSON(fiber.Map{"error": "ID do produto é obrigatório"})
	}
	result := database.DB.Delete(&models.Produto{}, id)
	if result.RowsAffected == 0 {
		return c.Status(404).JSON(fiber.Map{"error": "Produto não encontrado"})
	}
	// Opcional: Enviar um broadcast específico para DELETAR o produto na UI
	// broadcast.BroadcastProductDelete(id)
	return c.SendString("Produto removido com sucesso")
}

func GetProdutosList(c *fiber.Ctx) error {
	categoria := c.Query("categoria", "")
	pageStr := c.Query("page", "1")

	page, err := strconv.Atoi(pageStr)
	if err != nil || page < 1 {
		page = 1
	}

	const limit = 6
	offset := (page - 1) * limit

	var produtos []models.Produto
	var total int64

	db := database.DB.Model(&models.Produto{}).
		Joins("JOIN subcategorias ON subcategorias.id = produtos.subcategoria_id").
		Joins("JOIN categorias ON categorias.id = subcategorias.categoria_id").
		Where("produtos.active = ?", true) // FILTRO PARA PRODUTOS ATIVOS

	if categoria != "" {
		db = db.Where("subcategorias.nome = ? OR categorias.nome = ?", categoria, categoria)
	}

	if err := db.Count(&total).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Erro ao contar produtos"})
	}

	if err := db.Preload("Subcategoria.Categoria").Limit(limit).Offset(offset).Find(&produtos).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Erro ao buscar produtos"})
	}

	return c.JSON(fiber.Map{
		"data":      produtos,
		"total":     total,
		"page":      page,
		"last_page": (total + int64(limit) - 1) / int64(limit),
	})
}

func GetProdutosListAdmin(c *fiber.Ctx) error {
	// 1. Recebe o filtro de categoria da query string
	categoria := c.Query("categoria", "")

	var produtos []models.Produto

	// 2. Inicializa a query no banco de dados
	db := database.DB.Model(&models.Produto{}).
		Joins("JOIN subcategorias ON subcategorias.id = produtos.subcategoria_id").
		Joins("JOIN categorias ON categorias.id = subcategorias.categoria_id") // FILTRO OBRIGATÓRIO PARA PRODUTOS ATIVOS

	// 3. Aplica o filtro de categoria, se fornecido
	if categoria != "" {
		db = db.Where("subcategorias.nome = ? OR categorias.nome = ?", categoria, categoria)
	}

	// 4. Executa a busca (agora sem Limit e Offset) e pré-carrega os dados relacionados
	if err := db.Preload("Subcategoria.Categoria").Find(&produtos).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Erro ao buscar produtos"})
	}

	// 5. Retorna a lista completa de produtos (sem informações de paginação)
	return c.JSON(fiber.Map{
		"data": produtos,
		// O campo "total" é opcional, mas se quiser mantê-lo, precisa de um Count separado.
		// Para uma resposta limpa, o ideal é retornar apenas os dados.
	})
}

func GetProdutosLists(c *fiber.Ctx) error {
	var produtos []models.Produto

	if err := database.DB.
		Preload("Subcategoria.Categoria").
		Order("subcategoria_id, id DESC").
		Find(&produtos).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Erro ao buscar produtos"})
	}

	agrupado := make(map[uint][]models.Produto) // chave: SubcategoriaID
	for _, p := range produtos {
		if len(agrupado[p.SubcategoriaID]) < 6 {
			agrupado[p.SubcategoriaID] = append(agrupado[p.SubcategoriaID], p)
		}
	}

	return c.JSON(agrupado)
}

func GetProdutosAgrupadosPorCategoria(c *fiber.Ctx) error {
	const limit = 9

	var subcategorias []models.Subcategoria
	err := database.DB.Preload("Categoria").Find(&subcategorias).Error
	if err != nil {
		return c.Status(500).JSON(fiber.Map{
			"error": "Erro ao buscar subcategorias",
		})
	}

	resultado := make(map[string]fiber.Map)

	for _, subcat := range subcategorias {
		var produtos []models.Produto
		var total int64

		nome := subcat.Nome
		if nome == "Sem subcategoria" {
			nome = subcat.Categoria.Nome
		}

		query := database.DB.Model(&models.Produto{}).
			Where("subcategoria_id = ?", subcat.ID).
			Preload("Subcategoria.Categoria")

		if err := query.Count(&total).Error; err != nil {
			continue
		}

		if err := query.Limit(limit).Offset(0).Find(&produtos).Error; err != nil {
			continue
		}

		resultado[nome] = fiber.Map{
			"data": produtos,
			"total": total,
			"page": 1,
			"last_page": (total + int64(limit) - 1) / int64(limit),
		}
	}

	return c.JSON(resultado)
}
