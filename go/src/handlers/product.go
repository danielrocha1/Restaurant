package handlers

import (
	"log"
	"strconv"

	"Restaurant/src/database"
	"Restaurant/src/models"
	
	// Importamos o pacote main para acessar a função de broadcast
	"Restaurant/src/broadcast" 

	"github.com/gofiber/fiber/v2"
)

func GetProdutos(c *fiber.Ctx) error {
	var produtos []models.Produto
	database.DB.Find(&produtos)
	return c.JSON(produtos)
}

func GetProduto(c *fiber.Ctx) error {
	id := c.Params("id")
	var produto models.Produto
	result := database.DB.First(&produto, id)
	if result.Error != nil {
		return c.Status(404).SendString("Produto não encontrado")
	}
	return c.JSON(produto)
}

func CreateProduto(c *fiber.Ctx) error {
	var produto models.Produto
	if err := c.BodyParser(&produto); err != nil {
		return err
	}
	
	// 1. Salva o novo produto no DB
	database.DB.Create(&produto)
	
	// 2. Notifica todos os clientes do novo produto
	// (Assumimos status ATIVO e preço definido)
	broadcast.BroadcastProductUpdate(
		int(produto.ID), 
		produto.Nome, // Se o nome do produto for 'Nome' na struct models.Produto
		produto.Active, // Se o status do produto for 'Status' na struct models.Produto
		produto.Preco, // Se o preço do produto for 'Price' na struct models.Produto
		produto.PrecoPromocional, // Se o preço do produto for 'Price' na struct models.Produto

	)
	log.Printf("[Handler] Novo produto criado e broadcast enviado. ID: %d", produto.ID)

	return c.JSON(produto)
}

func UpdateProduto(c *fiber.Ctx) error {
	id := c.Params("id")
	var produto models.Produto
	
	// Salva o estado atual do produto para comparar se houver necessidade (opcional)
	if err := database.DB.First(&produto, id).Error; err != nil {
		return c.Status(404).SendString("Produto não encontrado")
	}
	
	// Cria uma cópia temporária para o BodyParser, se você não quiser
	// que o BodyParser sobrescreva o ID (embora o GORM lide com isso)
	var updatedData models.Produto
	if err := c.BodyParser(&updatedData); err != nil {
		return err
	}

	// Atualiza o produto existente com os novos dados
	database.DB.Model(&produto).Updates(updatedData)
	
	// Atualiza o objeto 'produto' após o Save para garantir que tenhamos o estado mais recente (com ID, etc.)
	// E garante que campos como Preco e Status foram atualizados no objeto 'produto' original
	// Se você usou c.BodyParser(&produto) acima, 'produto' já está atualizado.
	// Vamos assumir que 'produto' tem os dados mais recentes após o Save acima.
	
	// 1. Notifica todos os clientes sobre a mudança de status/preço
	broadcast.BroadcastProductUpdate(
		int(updatedData.ID), 
		updatedData.Nome, 
		updatedData.Active, 
		updatedData.Preco,
		updatedData.PrecoPromocional, 
	)
	log.Printf("[Handler] Produto ID %s atualizado e broadcast enviado.", id)

	return c.JSON(produto)
}

func DeleteProduto(c *fiber.Ctx) error {
	id := c.Params("id")
	result := database.DB.Delete(&models.Produto{}, id)
	if result.RowsAffected == 0 {
		return c.Status(404).SendString("Produto não encontrado")
	}

    // Opcional: Enviar um broadcast específico para DELETAR o produto na UI
    // main.BroadcastProductDelete(id) // Se você criar uma função BroadcastProductDelete
    // Por enquanto, o status DESATIVADO cobre a maioria dos casos de remoção do cardápio.

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
