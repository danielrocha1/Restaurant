import { useState, useEffect } from "react";
import { fetchCategoriesWithSubcategories } from "../api/services/category.service";

/**
 * Hook customizado para gerenciar categorias
 * @returns {object} Estado e métodos relacionados a categorias
 */
export const useCategories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        setLoading(true);
        const data = await fetchCategoriesWithSubcategories();
        setCategories(data);
        setError(null);
      } catch (err) {
        console.error("Erro ao carregar categorias:", err);
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    loadCategories();
  }, []);

  /**
   * Recarrega as categorias
   */
  const reloadCategories = async () => {
    try {
      setLoading(true);
      const data = await fetchCategoriesWithSubcategories();
      setCategories(data);
      setError(null);
    } catch (err) {
      console.error("Erro ao recarregar categorias:", err);
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  return {
    categories,
    loading,
    error,
    reloadCategories,
  };
};

export default useCategories;
