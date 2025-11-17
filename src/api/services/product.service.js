import { get } from "../client";

/**
 * Serviço para gerenciamento de produtos
 */

/**
 * Busca produtos por categoria com paginação
 * @param {string} categoria - Nome da categoria
 * @param {number} page - Número da página (padrão: 1)
 * @returns {Promise<object>} Dados dos produtos com informações de paginação
 */
export const fetchProductsByCategory = async (categoria, page = 1) => {
  try {
    const data = await get(
      `/produtos-list?categoria=${encodeURIComponent(categoria)}&page=${page}`
    );
    return data;
  } catch (error) {
    console.error(`Erro ao buscar produtos da categoria ${categoria}:`, error);
    throw error;
  }
};

/**
 * Busca um produto específico por ID
 * @param {number} productId - ID do produto
 * @returns {Promise<object>} Dados do produto
 */
export const fetchProductById = async (productId) => {
  try {
    const data = await get(`/produtos/${productId}`);
    return data;
  } catch (error) {
    console.error(`Erro ao buscar produto ${productId}:`, error);
    throw error;
  }
};

/**
 * Busca todos os produtos (sem filtro)
 * @param {number} page - Número da página (padrão: 1)
 * @returns {Promise<object>} Dados dos produtos com informações de paginação
 */
export const fetchAllProducts = async (page = 1) => {
  try {
    const data = await get(`/produtos-list?page=${page}`);
    return data;
  } catch (error) {
    console.error("Erro ao buscar todos os produtos:", error);
    throw error;
  }
};

/**
 * Busca produtos por subcategoria
 * @param {number} subcategoryId - ID da subcategoria
 * @param {number} page - Número da página (padrão: 1)
 * @returns {Promise<object>} Dados dos produtos com informações de paginação
 */
export const fetchProductsBySubcategory = async (subcategoryId, page = 1) => {
  try {
    const data = await get(
      `/produtos-list?subcategoria=${subcategoryId}&page=${page}`
    );
    return data;
  } catch (error) {
    console.error(`Erro ao buscar produtos da subcategoria ${subcategoryId}:`, error);
    throw error;
  }
};

const productService = {
  fetchProductsByCategory,
  fetchProductById,
  fetchAllProducts,
  fetchProductsBySubcategory,
};

export default productService;
