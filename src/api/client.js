/**
 * Cliente HTTP centralizado para comunicação com a API
 */

// Importa as URLs do arquivo de configuração
const API_URL = process.env.REACT_APP_BACKEND_API_URL;
const WS_URL = process.env.REACT_APP_BACKEND_WS_URL;

/**
 * Configuração base para requisições HTTP
 */
const defaultHeaders = {
  "Content-Type": "application/json",
};

/**
 * Realiza uma requisição HTTP genérica
 * @param {string} endpoint - Endpoint da API (sem a URL base)
 * @param {object} options - Opções da requisição (method, headers, body, etc)
 * @returns {Promise<any>} Resposta da API
 */
const request = async (endpoint, options = {}) => {
  const url = `${API_URL}${endpoint}`;
  
  const config = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  };

  try {
    const response = await fetch(url, config);

    if (!response.ok) {
      // Tenta extrair mensagem de erro do backend
      let errorMessage = `Erro na requisição: ${response.status} ${response.statusText}`;
      try {
        const errorData = await response.json();
        if (errorData && errorData.error) {
          errorMessage = errorData.error;
        }
      } catch (e) {
        // Se não conseguir parsear o JSON, usa a mensagem padrão
      }
      throw new Error(errorMessage);
    }

    return await response.json();
  } catch (error) {
    console.error(`Erro na requisição para ${endpoint}:`, error);
    throw error;
  }
};

/**
 * Realiza uma requisição GET
 * @param {string} endpoint - Endpoint da API
 * @param {object} headers - Headers adicionais
 * @returns {Promise<any>} Resposta da API
 */
export const get = (endpoint, headers = {}) => {
  return request(endpoint, {
    method: "GET",
    headers,
  });
};

/**
 * Realiza uma requisição POST
 * @param {string} endpoint - Endpoint da API
 * @param {object} data - Dados a serem enviados
 * @param {object} headers - Headers adicionais
 * @returns {Promise<any>} Resposta da API
 */
export const post = (endpoint, data, headers = {}) => {
  return request(endpoint, {
    method: "POST",
    headers,
    body: JSON.stringify(data),
  });
};

/**
 * Realiza uma requisição PUT
 * @param {string} endpoint - Endpoint da API
 * @param {object} data - Dados a serem enviados
 * @param {object} headers - Headers adicionais
 * @returns {Promise<any>} Resposta da API
 */
export const put = (endpoint, data, headers = {}) => {
  return request(endpoint, {
    method: "PUT",
    headers,
    body: JSON.stringify(data),
  });
};

/**
 * Realiza uma requisição DELETE
 * @param {string} endpoint - Endpoint da API
 * @param {object} headers - Headers adicionais
 * @returns {Promise<any>} Resposta da API
 */
export const del = (endpoint, headers = {}) => {
  return request(endpoint, {
    method: "DELETE",
    headers,
  });
};

/**
 * Exporta as URLs para uso em outros módulos
 */
export { API_URL, WS_URL };

/**
 * Cliente HTTP padrão
 */
const apiClient = {
  get,
  post,
  put,
  delete: del,
};

export default apiClient;
