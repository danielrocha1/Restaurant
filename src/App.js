import React, { useEffect, useState } from "react";
import { BackTop } from "antd";
import LoadingScreen from "./loading/loading";
import AppHeader from "./header/header";
import ProductCarousel from "./carousel/carousel";
import "./App.css";

function App() {
  const safeWindow = typeof window !== "undefined";
  const [isMobile, setIsMobile] = useState(safeWindow ? window.innerWidth < 768 : true);
  const [scroll, setScroll] = useState(false);
  const [productData, setProductData] = useState({});
  const [pagination, setPagination] = useState({});
  const [loadingByCategory, setLoadingByCategory] = useState({});
  const [showLoading, setShowLoading] = useState(true);

  useEffect(() => {
    const totalProducts = Object.values(productData).reduce(
      (sum, produtos) => sum + produtos.length,
      0
    );
    if (totalProducts >= 11) setShowLoading(false);
  }, [productData]);

  useEffect(() => {
    if (!safeWindow) return;
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [safeWindow]);

  useEffect(() => {
    if (!safeWindow) return;
    const handleScroll = () => setScroll(window.scrollY > 550);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [safeWindow]);

  const fetchInitialData = async () => {
    try {
      const response = await fetch("https://restaurant-9gdi.onrender.com/categoriasSub");
      const data = await response.json();

      for (const categoria of data) {
        const { Nome: nomeCategoria, Subcategorias } = categoria;

        // Apenas categoria
        if (
          Subcategorias.length === 1 &&
          Subcategorias[0].Nome === "Sem subcategoria"
        ) {
          const r = await fetch(
            `https://restaurant-9gdi.onrender.com/produtos-list?categoria=${encodeURIComponent(
              nomeCategoria
            )}&page=1`
          );
          const result = await r.json();
          const produtos = Array.isArray(result.data) ? result.data : [];

          setProductData((prev) => ({ ...prev, [nomeCategoria]: produtos }));
          setPagination((prev) => ({
            ...prev,
            [nomeCategoria]: {
              currentPage: result.page || 1,
              lastPage: result.last_page || 1,
            },
          }));
        } else {
          // Subcategorias
          for (const sub of Subcategorias) {
            if (sub.Nome === "Sem subcategoria") continue;

            const r = await fetch(
              `https://restaurant-9gdi.onrender.com/produtos-list?categoria=${encodeURIComponent(
                sub.Nome
              )}&page=1`
            );
            const result = await r.json();
            const produtos = Array.isArray(result.data) ? result.data : [];

            setProductData((prev) => ({ ...prev, [sub.Nome]: produtos }));
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
    }
  };

  const fetchMoreProducts = async (categoria, nextPage) => {
    if (loadingByCategory[categoria]) {
      console.log(`⏳ Já está carregando ${categoria}...`);
      return;
    }
    setLoadingByCategory((prev) => ({ ...prev, [categoria]: true }));
    console.log(`⏳ Carregando ${categoria}, página ${nextPage}...`);

    try {
      const response = await fetch(
        `https://restaurant-9gdi.onrender.com/produtos-list?categoria=${encodeURIComponent(
          categoria
        )}&page=${nextPage}`
      );
      const result = await response.json();
      const newProducts = Array.isArray(result.data) ? result.data : [];

      setProductData((prev) => ({
        ...prev,
        [categoria]: [...(prev[categoria] || []), ...newProducts],
      }));

      setPagination((prev) => ({
        ...prev,
        [categoria]: {
          currentPage: result.page || nextPage,
          lastPage: result.last_page || prev[categoria]?.lastPage || nextPage,
        },
      }));
    } catch (error) {
      console.error(`❌ Erro ao carregar mais produtos para ${categoria}:`, error);
    } finally {
      setLoadingByCategory((prev) => ({ ...prev, [categoria]: false }));
    }
  };

  useEffect(() => {
    fetchInitialData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (showLoading) return <LoadingScreen />;

  return (
    <div className="app-root">
      <AppHeader />

      <div
        className="page-bg"
        style={{
          marginTop: isMobile ? "150px" : "100px",
        }}
      >
       <div className="sections">
          {Object.entries(productData).map(([categoria, products]) => (
            <section id={categoria} key={categoria} className="content-section">
              {products.length > 0 ? (
                <ProductCarousel
                  id={categoria}
                  subCategoryName={categoria}
                  products={products}
                  onRequestMore={fetchMoreProducts}
                  currentPage={pagination[categoria]?.currentPage || 1}
                  lastPage={pagination[categoria]?.lastPage || 1}
                />
              ) : (
                <p className="empty-text">❌ Nenhum produto disponível para a categoria {categoria}.</p>
              )}
            </section>
          ))}
        </div>

        {scroll && (
          <BackTop>
            <div className="backtop-custom">↑</div>
          </BackTop>
        )}
      </div>
    </div>
  );
}

export default App;
