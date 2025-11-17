import { useState, useEffect, useCallback } from "react";
import { fetchProductsByCategory } from "../api/services/product.service";
import { fetchCategoriesWithSubcategories } from "../api/services/category.service";
import { normalizeProduto } from "../utils/helpers";
import { useWebSocket } from "./useWebSocket";
import { useCart } from "../contexts/CartContext";

/**
 * Hook customizado para gerenciar produtos
 * Integra carregamento inicial, paginação e atualizações via WebSocket
 */
export const useProducts = () => {
  const [productData, setProductData] = useState({});
  const [pagination, setPagination] = useState({});
  const [loadingByCategory, setLoadingByCategory] = useState({});
  const [loading, setLoading] = useState(true);

  const { messages } = useWebSocket();
  const { setCart } = useCart();

  /**
   * Carrega os produtos iniciais de todas as categorias
   */
  const fetchInitialData = useCallback(async () => {
    try {
      setLoading(true);
      const categories = await fetchCategoriesWithSubcategories();

      for (const categoria of categories) {
        const { Nome: nomeCategoria, Subcategorias } = categoria;

        if (
          Subcategorias.length === 1 &&
          Subcategorias[0].Nome === "Sem subcategoria"
        ) {
          // Categoria sem subcategorias
          const result = await fetchProductsByCategory(nomeCategoria, 1);
          const produtos = Array.isArray(result.data) ? result.data : [];

          setProductData((prev) => ({
            ...prev,
            [nomeCategoria]: produtos,
          }));

          setPagination((prev) => ({
            ...prev,
            [nomeCategoria]: {
              currentPage: result.page || 1,
              lastPage: result.last_page || 1,
            },
          }));
        } else {
          // Categoria com subcategorias
          for (const sub of Subcategorias) {
            if (sub.Nome === "Sem subcategoria") continue;

            const result = await fetchProductsByCategory(sub.Nome, 1);
            const produtos = Array.isArray(result.data) ? result.data : [];

            setProductData((prev) => ({
              ...prev,
              [sub.Nome]: produtos,
            }));

            setPagination((prev) => ({
              ...prev,
              [sub.Nome]: {
                currentPage: result.page || 1,
                lastPage: result.last_page || 1,
              },
            }));
          }
        }
      }
    } catch (error) {
      console.error("❌ Erro ao carregar categorias e subcategorias:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Carrega mais produtos de uma categoria específica (paginação)
   */
  const fetchMoreProducts = useCallback(async (categoria, nextPage) => {
    if (loadingByCategory[categoria]) {
      console.log(
        `⏳ Já está carregando a categoria ${categoria}... ignorando`
      );
      return;
    }

    setLoadingByCategory((prev) => ({ ...prev, [categoria]: true }));
    console.log(
      `⏳ Carregando mais produtos para categoria ${categoria}, página ${nextPage}...`
    );

    try {
      const result = await fetchProductsByCategory(categoria, nextPage);
      const newProducts = Array.isArray(result.data) ? result.data : [];

      setProductData((prevData) => ({
        ...prevData,
        [categoria]: [...(prevData[categoria] || []), ...newProducts],
      }));

      setPagination((prev) => ({
        ...prev,
        [categoria]: {
          currentPage: result.page || nextPage,
          lastPage:
            result.last_page || prev[categoria]?.lastPage || nextPage,
        },
      }));
    } catch (error) {
      console.error(`❌ Erro ao carregar mais produtos para ${categoria}:`, error);
    } finally {
      setLoadingByCategory((prev) => ({ ...prev, [categoria]: false }));
    }
  }, [loadingByCategory]);

  /**
   * Processa atualizações de produtos via WebSocket
   */
  useEffect(() => {
    if (messages.length === 0) return;

    const lastMsg = messages[messages.length - 1];
    console.log("📩 [WS] Processando última mensagem:", lastMsg);

    if (!lastMsg.produto) {
      console.log("⚠️ [WS] Mensagem não contém produto. Ignorando.");
      return;
    }

    const prod = normalizeProduto(lastMsg.produto);
    console.log("🔧 [WS] Produto normalizado:", prod);

    // Atualiza productData
    setProductData((prevData) => {
      const newData = { ...prevData };
      const categoria = prod.Categoria;

      // Inicializa categoria se não existir
      if (!newData[categoria]) newData[categoria] = [];

      // Remove de todas as categorias se estiver inativo
      if (!prod.Active) {
        Object.keys(newData).forEach((cat) => {
          newData[cat] = newData[cat].filter((p) => p.ID !== prod.ID);
        });
        console.log(`❌ Produto ${prod.ID} removido de todas as categorias (inativo)`);
      } else {
        // Atualiza ou adiciona na categoria correta
        const exists = newData[categoria].some((p) => p.ID === prod.ID);
        if (exists) {
          newData[categoria] = newData[categoria].map((p) =>
            p.ID === prod.ID ? { ...p, ...prod } : p
          );
          console.log(`✏️ Produto ${prod.ID} atualizado na categoria "${categoria}"`);
        } else {
          newData[categoria] = [...newData[categoria], prod];
          console.log(`✅ Produto ${prod.ID} adicionado na categoria "${categoria}"`);
        }
      }

      console.log("🗂️ [WS] Novo estado do productData:", newData);
      return newData;
    });

    // Atualiza o cart
    setCart((prevCart) => {
      let newCart = [...prevCart];

      if (!prod.Active) {
        // Remove produto inativo do cart
        newCart = newCart.filter((p) => p.ID !== prod.ID);
        console.log(`❌ Produto ${prod.ID} removido do cart (inativo)`);
      } else {
        // Atualiza produto no cart se existir
        const existsInCart = newCart.some((p) => p.ID === prod.ID);
        if (existsInCart) {
          newCart = newCart.map((p) => (p.ID === prod.ID ? { ...p, ...prod } : p));
          console.log(`✏️ Produto ${prod.ID} atualizado no cart`);
        }
      }

      console.log("🛒 [WS] Novo estado do cart:", newCart);
      return newCart;
    });
  }, [messages, setCart]);

  /**
   * Carrega os dados iniciais na montagem do componente
   */
  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  return {
    productData,
    pagination,
    loading,
    fetchMoreProducts,
    reloadProducts: fetchInitialData,
  };
};

export default useProducts;
