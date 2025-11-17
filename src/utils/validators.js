/**
 * Valida se um produto é válido
 * @param {object} product - Objeto do produto
 * @returns {boolean} True se o produto é válido
 */
export const isValidProduct = (product) => {
  return (
    product &&
    product.ID &&
    product.Nome &&
    product.Preco > 0
  );
};

/**
 * Valida se um carrinho tem itens válidos
 * @param {array} cart - Array de itens do carrinho
 * @returns {boolean} True se o carrinho é válido
 */
export const isValidCart = (cart) => {
  return Array.isArray(cart) && cart.length > 0 && cart.every(isValidProduct);
};

/**
 * Valida se uma categoria tem produtos
 * @param {array} products - Array de produtos
 * @returns {boolean} True se há produtos válidos
 */
export const hasValidProducts = (products) => {
  return Array.isArray(products) && products.length > 0;
};

/**
 * Valida se um token é válido (não vazio)
 * @param {string} token - Token para validar
 * @returns {boolean} True se o token é válido
 */
export const isValidToken = (token) => {
  return typeof token === "string" && token.trim().length > 0;
};
