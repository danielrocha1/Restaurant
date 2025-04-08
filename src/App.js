import React from "react";
import { Layout } from "antd";
import AppHeader from "./header/header";
import Sidebar from "./sidebar/sidebar";
import ProductCard from "./productCard/product";
import "./App.css";

const { Content } = Layout;

function App() {
  const product = {
    name: "Ração Premium para Cães",
    description: "Ração premium de alta qualidade, ideal para cães de todas as idades.",
    image: "https://cdn.awsli.com.br/203/203612/produto/127471573/910d53c05f.jpg",
    price: "129,90",
  };

  return (
    <>
      <AppHeader />
      <Layout style={{ minHeight: "100vh" }}>
        <Sidebar />
        <Layout>
          <Content style={{ margin: "24px 16px", padding: 24 }}>
          <ProductCard product={product} />
          </Content>
        </Layout>
      </Layout>
    </>
  );
}

export default App;
