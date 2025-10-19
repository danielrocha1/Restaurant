import { Layout, BackTop } from "antd";
import React, { useEffect, useState } from "react";

import LoadingScreen from "./loading/loading";
import AppHeader from "./header/header";
import ProductCarousel from "./carousel/carousel";
import "./App.css";

import { useWS } from "./context/wsContext";

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
  const [isTablet, setIsTablet] = useState(
  window.innerWidth > 768 && window.innerWidth <= 1024
);


const { messages } = useWS(); // 📡 aqui pega todas as mensagens WS
const normalizeProduto = (prod) => ({
    ID: prod.id ?? prod.ID ?? prod.Id,
    Nome: prod.nome ?? prod.Nome ?? prod.title ?? "",
    Preco: prod.preco ?? prod.Preco ?? prod.price ?? 0,
    PrecoPromocional:
      prod.preco_promocional ??
      prod.PrecoPromocional ??
      prod.precoPromocional ??
      0,
    Active: prod.active ?? prod.Active ?? prod.is_active ?? prod.isActive ?? false,
    // demais campos se precisar
  });
  
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

  setProductData((prevData) => {
    const newData = { ...prevData };
    console.log("🗂️ [WS] Estado anterior do productData:", prevData);

    Object.keys(newData).forEach((categoria) => {
      const exists = newData[categoria].some((p) => p.ID === prod.ID);
      console.log(`📌 [WS] Categoria "${categoria}": produto existe?`, exists);

      if (!prod.Active) {
        // remove produto inativo
        newData[categoria] = newData[categoria].filter((p) => p.ID !== prod.ID);
        console.log(`❌ [WS] Produto ${prod.ID} removido da categoria "${categoria}"`);
      } else if (exists) {
        // atualiza produto existente
        newData[categoria] = newData[categoria].map((p) =>
          p.ID === prod.ID ? { ...p, ...prod } : p
        );
        console.log(`✏️ [WS] Produto ${prod.ID} atualizado na categoria "${categoria}"`);
      } else {
        // adiciona produto novo
        newData[categoria] = [...newData[categoria], prod];
        console.log(`✅ [WS] Produto ${prod.ID} adicionado à categoria "${categoria}"`);
      }
    });

    console.log("🗂️ [WS] Novo estado do productData:", newData);
    return newData;
  });
}, [messages]);





useEffect(() => {
  const handleResize = () => {
    setIsMobile(window.innerWidth <= 768);
    setIsTablet(window.innerWidth > 768 && window.innerWidth <= 1024);
  };
  window.addEventListener("resize", handleResize);
  return () => window.removeEventListener("resize", handleResize);
}, []);

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
        "https://restaurant-sw98.onrender.com/categoriasSub"
      );
      const data = await response.json();

      for (const categoria of data) {
        const { Nome: nomeCategoria, Subcategorias } = categoria;

        if (
          Subcategorias.length === 1 &&
          Subcategorias[0].Nome === "Sem subcategoria"
        ) {
          const response = await fetch(
            `https://restaurant-sw98.onrender.com/produtos-list?categoria=${encodeURIComponent(
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
              `https://restaurant-sw98.onrender.com/produtos-list?categoria=${encodeURIComponent(
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
        `https://restaurant-sw98.onrender.com/produtos-list?categoria=${encodeURIComponent(
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
        marginTop: isMobile ? "170px" : isTablet ? "80px" : "130px",
        color: "white",
      }}
    >
      <AppHeader />
      <div className="bg-fixed" aria-hidden />

      <Layout
      className="app-shell"
     
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
