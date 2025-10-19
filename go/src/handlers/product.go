package handlers

import (
	"log"
	"strconv"
	"encoding/json"
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
	// broadcast.BroadcastProductUpdate(produto, updatesMap )
	log.Printf("[Handler] Novo produto criado e broadcast enviado. ID: %d", produto.ID)

	return c.JSON(produto)
}

func UpdateProduto(c *fiber.Ctx) error {
	id := c.Params("id")
	var produto models.Produto

	// Busca o produto atual no banco
	if err := database.DB.First(&produto, id).Error; err != nil {
		log.Printf("[UpdateProduto] Produto ID %s não encontrado.", id)
		return c.Status(404).SendString("Produto não encontrado")
	}

	// Mostra o estado atual do produto
	log.Printf("[ANTES] Produto atual (ID %d): Nome=%s | Preço=%d | Promo=%d | Active=%t",
		c.JSON(produto), produto.Nome, produto.Preco, produto.PrecoPromocional, produto.Active)
	
	// Lê o body raw para podermos decodificar tanto em struct quanto em map
	body := c.Body()

	// Decodifica em struct (opcional)
	var updatedData models.Produto
	if err := json.Unmarshal(body, &updatedData); err != nil {
		log.Printf("[ERRO] Falha ao unmarshal para struct: %v", err)
		// não retorna ainda; vamos tentar decodificar em map a seguir
	}

	// Decodifica em map para capturar valores zero explicitamente
	var updatesMap map[string]interface{}
	if err := json.Unmarshal(body, &updatesMap); err != nil {
		log.Printf("[ERRO] Falha ao unmarshal para map: %v", err)
		return c.Status(400).SendString("Corpo inválido")
	}

	// LOG do que chegou como map
	log.Printf("[RECEBIDO MAP] %+v", updatesMap)
	log.Printf("[RECEBIDO STRUCT] Nome=%s | Preço=%d | Promo=%d | Active=%t",
		updatedData.Nome, updatedData.Preco, updatedData.PrecoPromocional, updatedData.Active)

	// Opcional: normalize keys (se enviar JSON em snake_case -> map terá "preco_promocional", seu DB usa PrecoPromocional)
	// Exemplo simples: transformar keys comuns para o nome do campo GORM (ajuste conforme seu JSON)
	if v, ok := updatesMap["preco_promocional"]; ok {
		updatesMap["preco_promocional"] = v // se seu DB/columns usam esses nomes, ok. Caso contrário, use "preco_promocional" => "preco_promocional" conforme GORM tag
	}
	// Se você usa JSON tags como "preco_promocional" no struct, GORM/DB vai trabalhar com struct -> map translation automaticamente.
	// Aqui assumimos que updatesMap usa as keys do JSON (ex: "preco", "preco_promocional", "nome", "active")

	// Faz a atualização usando o map (aceita false/0/"")
	if err := database.DB.Model(&produto).Updates(updatesMap).Error; err != nil {
		log.Printf("[ERRO] Falha ao atualizar produto: %v", err)
		return c.Status(500).SendString("Erro ao atualizar produto")
	}

	// Recarrega o produto do banco após atualização
	if err := database.DB.First(&produto, id).Error; err != nil {
		log.Printf("[ERRO] Falha ao recarregar produto após update: %v", err)
		// apesar disso, segue pra retornar algo
	}

	// Mostra o produto final após o update
	log.Printf("[DEPOIS] Produto atualizado (ID %d): Nome=%s | Preço=%d | Promo=%d | Active=%t",
		produto, produto.Nome, produto.Preco, produto.PrecoPromocional, produto.Active)

	// Envia broadcast com as novas informações
	broadcast.BroadcastProductUpdate(produto, updatesMap )

	log.Printf("[BROADCAST] Produto ID %s enviado para os clientes WebSocket.", id)

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
