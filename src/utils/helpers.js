/**
 * Gera um slug seguro a partir de uma string
 * Remove acentos, caracteres especiais e substitui espaços por hífens
 * @param {string} s - String para converter em slug
 * @returns {string} Slug normalizado
 */
export const slug = (s = "") =>
  s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove acentos
    .replace(/[^a-zA-Z0-9\s-]/g, "") // Remove símbolos especiais
    .trim()
    .replace(/\s+/g, "-") // Substitui espaços por hífens
    .toLowerCase();

/**
 * Formata um preço em centavos para o formato de moeda brasileira
 * @param {number} price - Preço em centavos
 * @returns {string} Preço formatado (ex: "R$ 12,50")
 */
export const formatPrice = (price) => {
  if (price == null) return "";
  return (price / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
};

/**
 * Normaliza um objeto de produto para garantir consistência de campos
 * @param {object} data - Dados do produto (pode vir em diferentes formatos)
 * @returns {object} Produto normalizado com campos padronizados
 */
export const normalizeProduto = (data) => {
  const prod = data?.produto ?? data;

  return {
    ID: prod.id ?? prod.ID ?? prod.Id,
    Nome: prod.nome ?? prod.Nome ?? "",
    Descricao: prod.descricao ?? prod.Descricao ?? "",
    Preco: prod.preco ?? prod.Preco ?? prod.price ?? 0,
    PrecoPromocional:
      prod.preco_promocional ??
      prod.PrecoPromocional ??
      prod.precoPromocional ??
      0,
    Active: prod.active ?? prod.Active ?? prod.is_active ?? prod.isActive ?? false,
    Imagem: prod.imagem ?? prod.Imagem ?? "",
    SubcategoriaID: prod.subcategoria_id ?? prod.SubcategoriaID ?? null,
    Subcategoria: prod.Subcategoria?.Nome ?? "",
    Categoria: prod.Subcategoria?.Categoria?.Nome ?? "",
    CreatedAt: prod.CreatedAt ?? null,
    UpdatedAt: prod.UpdatedAt ?? null,
  };
};

/**
 * Cria uma chave única para identificar um item no carrinho
 * @param {string} name - Nome do produto
 * @param {string} weight - Peso/tamanho do produto
 * @returns {string} Chave única
 */
export const createCartKey = (name, weight) => `${name}_${weight}`;

/**
 * Verifica se o código está sendo executado no ambiente do navegador
 * @returns {boolean} True se estiver no navegador
 */
export const isBrowser = () => typeof window !== "undefined";

/**
 * Calcula o preço final de um produto (considerando promoção)
 * @param {object} product - Objeto do produto
 * @returns {number} Preço final em centavos
 */
export const getFinalPrice = (product) => {
  return product.PrecoPromocional && product.PrecoPromocional > 0
    ? product.PrecoPromocional
    : product.Preco;
};

/**
 * Rola suavemente até um elemento na página
 * @param {string} elementId - ID do elemento
 */
export const smoothScrollTo = (elementId) => {
  const el = document.getElementById(elementId);
  if (!el) return;

  el.scrollIntoView({ behavior: "smooth", block: "start" });

  // Retry para garantir que o scroll funcione em dispositivos móveis
  setTimeout(() => {
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  }, 180);
};
