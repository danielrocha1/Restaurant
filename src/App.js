import { Layout, Divider } from "antd";
import React, { useEffect, useState, useRef } from "react";
import { BackTop } from "antd";

import AppHeader from "./header/header";
import ProductCarousel from "./carousel/carousel";
import "./App.css";


 //fundo     https://thumbs.dreamstime.com/b/seamless-sushi-roll-pattern-black-background-vector-seamless-sushi-roll-pattern-black-background-vector-illustration-240039559.jpg
 //fundo     https://img.freepik.com/premium-vector/seamless-pattern-with-sushi-isolated-black-background-design-chalkboard_505564-1815.jpg?w=2000
 //fundo     https://thumbs.dreamstime.com/z/vector-bw-seamless-sushi-pattern-japenese-food-rolls-rice-black-white-90630681.jpg


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

  // Produtos de exemplo - substitua por produtos reais de culinária japonesa
  const japaneseProducts = [
    {
      name: "Sushi de Salmão",
      price: "R$18,00",
      brand: "Tokyo Sushi",
      weights: ["6 un", "12 un"],
      image: "https://th.bing.com/th/id/OIP.Xh0wnGqu46y0WkM9RveatgHaE7?w=800&h=533&rs=1&pid=ImgDetMain",
    },
    {
      name: "Yakissoba de Frango",
      price: "R$25,00",
      brand: "Nippon Wok",
      weights: ["pequeno", "grande"],
      image: "https://www.guiadasemana.com.br/contentFiles/image/opt_w1180h738/2019/01/FEA/58657_shutterstock-1019534467.jpg",
    },
    // Adicione mais produtos conforme necessário
  ];

  return (
    <div style={{ backgroundColor: "black", minHeight: "100vh", marginTop: "90px", color: "white" }}>
      <AppHeader />
      <Layout style={{ backgroundColor: "black", width: "98.5vw" }}>
      <Layout style={{ background: "transparent", }}>
          <Content style={{ margin: "4px 36px", padding: 30 }}>
            <ProductCarousel categoryName="Combinados" products={japaneseProducts} />
          </Content>
          <Divider style={{ border: "1px solid white", color:"white", fontSize:"20px", fontWeight:"bold" }} >Comidas Frias</Divider>



          <Content style={{ margin: "4px 36px", padding: 24 }}>
            <ProductCarousel categoryName="Sushis" products={japaneseProducts} />
          </Content>
          <Divider style={{ border: "1px solid white" }} />

          <Content style={{ margin: "4px 36px", padding: 24 }}>
            <ProductCarousel categoryName="Sashimis" products={japaneseProducts} />
          </Content>
          <Divider style={{ border: "1px solid white" }} />

          <Content style={{ margin: "4px 36px", padding: 24  }}>
            <ProductCarousel categoryName="Temakis" products={japaneseProducts} />
          </Content>
          <Divider style={{ border: "1px solid white", color:"white", fontSize:"22px", fontWeight:"bold" }} >Comidas Quentes</Divider>

          <Content style={{ margin: "4px 36px", padding: 24 }}>
            <ProductCarousel categoryName="Yakissoba" products={japaneseProducts} />
          </Content>
          <Divider style={{ border: "1px solid white" }} />

          <Content style={{ margin: "4px 36px", padding: 24 }}>
            <ProductCarousel categoryName="Lámen" products={japaneseProducts} />
          </Content>
          <Divider style={{ border: "1px solid white" }} />

          <Content style={{ margin: "4px 36px", padding: 24 }}>
            <ProductCarousel categoryName="Donburi" products={japaneseProducts} />
          </Content>
          <Divider style={{ border: "1px solid white" }} />

          <Content style={{ margin: "4px 36px", padding: 24 }}>
            <ProductCarousel categoryName="Entradas" products={japaneseProducts} />
          </Content>
          <Divider style={{ border: "1px solid white" }} />

          <Content style={{ margin: "4px 36px", padding: 24 }}>
            <ProductCarousel categoryName="Robatas (grelhados japoneses)" products={japaneseProducts} />
          </Content>
          <Divider style={{ border: "1px solid white" }} />

          <Content style={{ margin: "4px 36px", padding: 24 }}>
            <ProductCarousel categoryName="Acompanhamentos" products={japaneseProducts} />
          </Content>
          <Divider style={{ border: "1px solid white" }} />

          <Content style={{ margin: "4px 36px", padding: 24 }}>
            <ProductCarousel categoryName="Bebidas" products={japaneseProducts} />
          </Content>
          <Divider style={{ border: "1px solid white" }} />

          <Content style={{ margin: "4px 36px", padding: 24 }}>
            <ProductCarousel categoryName="Sobremesas" products={japaneseProducts} />
          </Content>
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
