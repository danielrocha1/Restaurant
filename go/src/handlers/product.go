package handlers

import (
	"strconv"
    "github.com/gofiber/fiber/v2"
    "Restaurant/src/database"
    "Restaurant/src/models"
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
    database.DB.Create(&produto)
    return c.JSON(produto)
}

func UpdateProduto(c *fiber.Ctx) error {
    id := c.Params("id")
    var produto models.Produto
    if err := database.DB.First(&produto, id).Error; err != nil {
        return c.Status(404).SendString("Produto não encontrado")
    }
    if err := c.BodyParser(&produto); err != nil {
        return err
    }
    database.DB.Save(&produto)
    return c.JSON(produto)
}

func DeleteProduto(c *fiber.Ctx) error {
    id := c.Params("id")
    result := database.DB.Delete(&models.Produto{}, id)
    if result.RowsAffected == 0 {
        return c.Status(404).SendString("Produto não encontrado")
    }
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
			"data":      produtos,
			"total":     total,
			"page":      1,
			"last_page": (total + int64(limit) - 1) / int64(limit),
		}
	}

	return c.JSON(resultado)
}
