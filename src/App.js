import { Layout, Divider } from "antd";
import React, { useEffect, useState } from "react";
import {  BackTop } from "antd";

import AppHeader from "./header/header";

import ProductCarousel from "./carousel/carousel";
import "./App.css";

const { Content } = Layout;

function App() {

  const dogsProducts = [
    {
      name: "Ração Golden Special para Cães Adultos Frango e Carne",
      price: "R$134,91",
      brand: "Golden",
      weights: ["15 kg", "20 kg"],
      image: "https://cobasi.vteximg.com.br/arquivos/ids/939251-368-368/racao-golden-special-para-caes-adultos-frango-e-carne-3310549-15kg-Lado.jpg?v=638757374687300000"
    },
    {
      name: "Ração GranPlus Choice Cães Adultos Frango e Carne",
      price: "R$98,91",
      brand: "Gran Plus",
      weights: ["10,1 kg", "15 kg", "20 kg"],
      image: "https://cobasi.vteximg.com.br/arquivos/ids/1037683-368-368/Choice-Frango-e-Carne-Caes-Adultos-Frente.jpg?v=638127624391270000"
    },
    {
      name: "Ração Golden Formula Cães Adultos Raças Pequenas Carne e Arroz Mini Bits",
      price: "R$19,35",
      brand: "Golden",
      weights: ["1 kg", "3 kg", "15 kg"],
      image: "https://cobasi.vteximg.com.br/arquivos/ids/819537-368-368/racao-golden-formula-caes-adultos-racas-pequenas-carne-arroz-mini-bits-1kg.jpg?v=637667907205070000"
    },
    {
      name: "Ração Úmida GranPlus Gourmet Cães Adultos Carne",
      price: "R$2,87",
      brand: "Gran Plus",
      weights: ["100 g"],
      image: "https://cobasi.vteximg.com.br/arquivos/ids/1032335-368-368/racao-umida-gran-plus-cachorro-adulto-carne-sache-100g-frente.jpg?v=638043755031470000"
    },
    {
      name: "Ração Golden Fórmula Cães Adultos Raças Pequenas Frango e Arroz Mini Bits",
      price: "R$19,35",
      brand: "Golden",
      weights: ["1 kg", "3 kg", "10,1 kg", "15 kg"],
      image: "https://cobasi.vteximg.com.br/arquivos/ids/939211-368-368/racao-golden-formula-caes-adultos-racas-pequenas-frango-arroz-mini-bits-3626279-1kg-lado.jpg?v=638127640564670000"
    },
    {
      name: "Ração Origens Class Cães Adultos Carne e Frango",
      price: "R$130,41",
      brand: "Origens",
      weights: ["15 kg", "10,1kg", "20 kg"],
      image: "https://cobasi.vteximg.com.br/arquivos/ids/1066622-368-368/racao-origens-class-caes-adultos-carne-e-frango-1.png.png?v=638717891887430000"
    },
    {
      name: "Ração Premier Nattu Cães Adultos Mandioca Pequeno Porte",
      price: "R$38,61",
      brand: "Premier",
      weights: ["1 kg", "2,5 kg", "10,1 kg"],
      image: "https://cobasi.vteximg.com.br/arquivos/ids/1044894-368-368/Racao-Premier-Nattu-Caes-Adultos-Mandioca-Pequeno-Porte-1kg-lateral.png?v=638167330363100000"
    },
    {
      name: "Ração Premier Nutrição Clínica Cães Hipoalergênico Raças Pequenas",
      price: "R$84,51",
      brand: "Premier",
      weights: ["2 kg", "10,1 kg"],
      image: "https://cobasi.vteximg.com.br/arquivos/ids/1044749-368-368/Racao-Premier-Nutricao-Clinica-Gastrointestinal-Caes-Racas-Medio-e-Grande-2kg-lateral.png?v=638163826761500000"
    },
    {
      name: "Ração Fórmula Natural Fresh Meat Cães Adultos Mini e Pequeno Frango",
      price: "R$231,96",
      brand: "Formula Natural",
      weights: ["1 kg", "2,5 kg", "7 kg pac. Indiv. de 500g"],
      image: "https://cobasi.vteximg.com.br/arquivos/ids/1062004-368-368/Racao-Formula-Natural-Fresh-Meat-Caes-Adultos-Mini-e-Pequeno-Frango.png?v=638634913337500000"
    }
  ];

  const [scroll, setScroll] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setScroll(true);
      } else {
        setScroll(false);
      }
      setLastScrollY(currentScrollY);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);


  return (
    <div style={{ marginTop: "180px",   }}>
      <AppHeader />
      <Layout style={{  }}>
        <Layout style={{   backgroundColor: "#4CAF50"   }}>

          <Content style={{ margin: "24px 16px", padding: 30 }}>
          <ProductCarousel categoryName="Cães" products={dogsProducts} />
          </Content>

          <Divider type="horizontal" />


          <Content style={{ margin: "24px 16px", padding: 24 }}>
          <ProductCarousel categoryName="Gatos" products={dogsProducts} />
          </Content>

          <Divider type="horizontal" />

          <Content style={{ margin: "24px 16px", padding: 24 }}>
          <ProductCarousel categoryName="Pássaros" products={dogsProducts} />
          </Content>
          
          <Divider type="horizontal" />

          <Content style={{ margin: "24px 16px", padding: 24 }}>
          <ProductCarousel categoryName="Peixes" products={dogsProducts} />
          </Content>

          <Divider type="horizontal" />

          <Content style={{ margin: "24px 16px", padding: 24 }}>
          <ProductCarousel categoryName="Rações" products={dogsProducts} />
          </Content>

          <Divider type="horizontal" style={{backgroundColor:"white", }} />

          <Content style={{ margin: "24px 16px", padding: 24 }}>
          <ProductCarousel categoryName="Brinquedos" products={dogsProducts} />
          </Content>

          <Divider type="horizontal" />


        </Layout>
      </Layout>

      {scroll && (
        <BackTop>
          <div className="backtop-custom">↑</div>
        </BackTop>
      )}
    </div>
  );
}

export default App;
