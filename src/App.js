import { Layout, BackTop } from "antd";
import React, { useEffect, useState } from "react";

import LoadingScreen from "./loading/loading";
import AppHeader from "./header/header";
import ProductCarousel from "./carousel/carousel";
import "./App.css";

const { Content } = Layout;

// 🔑 Função slug única para ids
const slug = (s = "") =>
  s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // tira acentos
    .replace(/[^a-zA-Z0-9\s-]/g, "") // tira símbolos
    .trim()
    .replace(/\s+/g, "-") // troca espaço por hífen
    .toLowerCase();

function App() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
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
    if (totalProducts >= 11) {
      setShowLoading(false);
    }
  }, [productData]);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 550;
      if (scroll !== isScrolled) {
        setScroll(isScrolled);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [scroll]);

  const fetchInitialData = async () => {
    try {
      const response = await fetch(
        "https://restaurant-9gdi.onrender.com/categoriasSub"
      );
      const data = await response.json();

      for (const categoria of data) {
        const { Nome: nomeCategoria, Subcategorias } = categoria;

        if (
          Subcategorias.length === 1 &&
          Subcategorias[0].Nome === "Sem subcategoria"
        ) {
          const response = await fetch(
            `https://restaurant-9gdi.onrender.com/produtos-list?categoria=${encodeURIComponent(
              nomeCategoria
            )}&page=1`
          );
          const result = await response.json();
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
          for (const sub of Subcategorias) {
            if (sub.Nome === "Sem subcategoria") continue;

            const response = await fetch(
              `https://restaurant-9gdi.onrender.com/produtos-list?categoria=${encodeURIComponent(
                sub.Nome
              )}&page=1`
            );
            const result = await response.json();
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
    }
  };

  const fetchMoreProducts = async (categoria, nextPage) => {
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
      const response = await fetch(
        `https://restaurant-9gdi.onrender.com/produtos-list?categoria=${encodeURIComponent(
          categoria
        )}&page=${nextPage}`
      );
      const result = await response.json();
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
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  if (showLoading) {
    return <LoadingScreen />;
  }

  return (
    <div
      style={{
        backgroundColor: "black",
        marginTop: isMobile ? "150px" : "130px",
        color: "white",
      }}
    >
      <AppHeader />
      <Layout
        style={{
          backgroundImage:
            "url('https://img.freepik.com/premium-vector/seamless-pattern-with-sushi-isolated-black-background-design-chalkboard_505564-1815.jpg?w=2000')",
          backgroundRepeat: "repeat",
          backgroundSize: "500px 500px",
          backgroundPosition: "center left",
          backgroundAttachment: "fixed",
          width: "98.8vw",
        }}
      >
        <Layout style={{ background: "transparent" }}>
          {Object.entries(productData).map(([categoria, products], index) => {
            const sectionId = slug(categoria); // ✅ usa slug
            return (
              <Content
                key={index}
                id={sectionId} // ✅ id da seção com slug
                className="content-section"
                style={{ margin: isMobile ? 0 : "4px 36px", padding: 24 }}
              >
                {products.length > 0 ? (
                  <>
                    <ProductCarousel
                      id={sectionId}
                      subCategoryName={categoria}
                      products={products}
                      onRequestMore={fetchMoreProducts}
                      currentPage={
                        pagination[categoria]?.currentPage || 1
                      }
                      lastPage={pagination[categoria]?.lastPage || 1}
                    />
                  </>
                ) : (
                  <p style={{ color: "white" }}>
                    ❌ Nenhum produto disponível para a categoria {categoria}.
                  </p>
                )}
              </Content>
            );
          })}
        </Layout>

        {scroll && (
          <BackTop>
            <div className="backtop-custom">↑</div>
          </BackTop>
        )}
      </Layout>
    </div>
  );
}

export default App;
