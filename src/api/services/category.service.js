import { get } from "../client";

/**
 * Serviço para gerenciamento de categorias e subcategorias
 */

/**
 * Busca todas as categorias com suas subcategorias
 * @returns {Promise<Array>} Lista de categorias com subcategorias
 */
export const fetchCategoriesWithSubcategories = async () => {
  try {
    const data = await get("/categoriasSub");
    return data;
  } catch (error) {
    console.error("Erro ao buscar categorias e subcategorias:", error);
    throw error;
  }
};

/**
 * Busca uma categoria específica por ID
 * @param {number} categoryId - ID da categoria
 * @returns {Promise<object>} Dados da categoria
 */
export const fetchCategoryById = async (categoryId) => {
  try {
    const data = await get(`/categorias/${categoryId}`);
    return data;
  } catch (error) {
    console.error(`Erro ao buscar categoria ${categoryId}:`, error);
    throw error;
  }
};

/**
 * Busca subcategorias de uma categoria específica
 * @param {number} categoryId - ID da categoria
 * @returns {Promise<Array>} Lista de subcategorias
 */
export const fetchSubcategoriesByCategory = async (categoryId) => {
  try {
    const data = await get(`/categorias/${categoryId}/subcategorias`);
    return data;
  } catch (error) {
    console.error(`Erro ao buscar subcategorias da categoria ${categoryId}:`, error);
    throw error;
  }
};

const categoryService = {
  fetchCategoriesWithSubcategories,
  fetchCategoryById,
  fetchSubcategoriesByCategory,
};

export default categoryService;
