import { post } from "../client";

/**
 * Serviço para gerenciamento de pedidos
 */

/**
 * Envia um pedido para o backend (checkout)
 * @param {Array} items - Lista de itens do pedido
 * @param {number} total - Total do pedido em centavos
 * @param {string} token - Token de autenticação da mesa
 * @returns {Promise<object>} Resposta do backend
 */
export const createOrder = async (items, total, token) => {
  try {
    const data = await post(
      "/checkout",
      { items, total },
      { Authorization: `Bearer ${token}` }
    );
    return data;
  } catch (error) {
    console.error("Erro ao criar pedido:", error);
    throw error;
  }
};

/**
 * Busca o status de um pedido
 * @param {number} orderId - ID do pedido
 * @returns {Promise<object>} Status do pedido
 */
export const fetchOrderStatus = async (orderId) => {
  try {
    const data = await post(`/pedidos/${orderId}/status`);
    return data;
  } catch (error) {
    console.error(`Erro ao buscar status do pedido ${orderId}:`, error);
    throw error;
  }
};

/**
 * Cancela um pedido
 * @param {number} orderId - ID do pedido
 * @returns {Promise<object>} Resposta do backend
 */
export const cancelOrder = async (orderId) => {
  try {
    const data = await post(`/pedidos/${orderId}/cancelar`);
    return data;
  } catch (error) {
    console.error(`Erro ao cancelar pedido ${orderId}:`, error);
    throw error;
  }
};

const orderService = {
  createOrder,
  fetchOrderStatus,
  cancelOrder,
};

export default orderService;
