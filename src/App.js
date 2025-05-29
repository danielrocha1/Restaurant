import { Layout, Divider } from "antd";
import React, { useEffect, useState, useRef } from "react";
import { BackTop } from "antd";
import productData from "./catalogo_akiro.json"; // <- aqui o seu JSON

import AppHeader from "./header/header";
import ProductCarousel from "./carousel/carousel";
import "./App.css";


//akiro logo https://cdn.neemo.com.br/uploads/item/photo/2039865/photo1690653160.jpeg.webp

 //fundo     https://thumbs.dreamstime.com/b/seamless-sushi-roll-pattern-black-background-vector-seamless-sushi-roll-pattern-black-background-vector-illustration-240039559.jpg
 //fundo     https://img.freepik.com/premium-vector/seamless-pattern-with-sushi-isolated-black-background-design-chalkboard_505564-1815.jpg?w=2000
 //fundo     https://thumbs.dreamstime.com/z/vector-bw-seamless-sushi-pattern-japenese-food-rolls-rice-black-white-90630681.jpg
 //fundo     https://i.pinimg.com/736x/cb/ca/f4/cbcaf474e5d03f5c77dd016c6ad91a43.jpg


const { Content } = Layout;

function App() {
  const [scroll, setScroll] = useState(false);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      setScroll(currentScrollY > 550);
      lastScrollY.current = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  

  return (
    <div style={{ backgroundColor: "black",  marginTop: "100px", color: "white" }}>
      <AppHeader />
      <Layout
        style={{
          backgroundImage: "url('https://img.freepik.com/premium-vector/seamless-pattern-with-sushi-isolated-black-background-design-chalkboard_505564-1815.jpg?w=2000')",
          backgroundRepeat: "repeat",
          backgroundSize: "500px 500px", // tamanho dos blocos
          backgroundPosition: "top left",
          backgroundAttachment: "fixed", // faz a imagem ficar estática
          width: "98.8vw",
        }}
      >
      <Layout style={{ background: "transparent", }}>
 <>
      {Object.entries(productData).map(([categoryName, value], index) => (
        <div key={index}>
          {/* <Divider
            style={{
              border: "1px solid white",
              color: "white",
              fontSize: "20px",
              fontWeight: "bold",
            }}
          >
            {categoryName}
          </Divider> */}

          {/* Se a categoria tiver subcategorias */}
          {Array.isArray(value) ? (
            <Content style={{ margin: "4px 36px", padding: 24 }}>
              <ProductCarousel
                id={categoryName}
                subCategoryName={categoryName}
                products={value}
              />
            </Content>
          ) : (
            Object.entries(value).map(([subCategoryName, products], subIndex) => (
              <Content
                key={subIndex}
                style={{ margin: "4px 36px", padding: 24 }}
              >
                <ProductCarousel
                  id={`${subCategoryName}`}
                  subCategoryName={subCategoryName}
                  products={products}
                />
              </Content>
            ))
          )}
        </div>
      ))}
    </>
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
