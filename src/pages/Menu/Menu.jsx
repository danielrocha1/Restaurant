import { Layout, BackTop, Divider } from "antd";
import React, { useEffect, useState } from "react";

import LoadingScreen from "../../components/LoadingScreen/LoadingScreen";
import Header from "../../components/Header/Header";
import ProductCarousel from "../../components/ProductCarousel/ProductCarousel";
import { useProducts } from "../../hooks/useProducts";
import { slug } from "../../utils/helpers";
import "./Menu.css";

const { Content } = Layout;

/**
 * Página principal do menu
 * Exibe categorias e produtos em carrosséis
 */
function Menu() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [scroll] = useState(false);
  const [showLoading, setShowLoading] = useState(true);
  const [isTablet, setIsTablet] = useState(
    window.innerWidth > 768 && window.innerWidth <= 1024
  );

  const { productData, pagination, fetchMoreProducts } = useProducts();

  // Detecta mudanças de tamanho da tela
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      setIsMobile(width <= 768);
      setIsTablet(width > 768 && width <= 1024);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Esconde a tela de loading quando houver produtos suficientes
  useEffect(() => {
    const minProductShow = 11;
    const totalProducts = Object.values(productData).reduce(
      (sum, produtos) => sum + produtos.length,
      0
    );
    if (totalProducts >= minProductShow) {
      setShowLoading(false);
    }
  }, [productData]);

  if (showLoading) {
    return <LoadingScreen />;
  }

  return (
    <div
      style={{
        backgroundColor: "black",
        // 50px (promo bar) no topo
        marginTop: isMobile ? "70px" : isTablet ? "80px" : "60px",
        color: "white",
      }}
    >
      <Header />
      <div className="bg-fixed" aria-hidden />

      <Layout className="app-shell">
        <Layout style={{ background: "transparent" }}>
          {Object.entries(productData).map(([categoria, products], index) => {
            const sectionId = slug(categoria);
            return (
              <Content
                key={index}
                className="content-section"
                style={{ marginLeft: isMobile ? 0 : 20, padding: 4 }}
              >
                {products.length > 0 ? (
                  <>
                    <Divider id={sectionId} style={{ marginBottom: "50px" }} />

                    <ProductCarousel
                      id={sectionId}
                      subCategoryName={categoria}
                      products={products}
                      onRequestMore={fetchMoreProducts}
                      currentPage={pagination[categoria]?.currentPage || 1}
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

export default Menu;
