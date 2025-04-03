import ProductCard from './productCard/product';
import AppHeader from './header/header';
import './App.css';

function App() {
  const product = {
    name: "Ração Premium para Cães",
    description: "Ração premium de alta qualidade, ideal para cães de todas as idades.",
    image: "https://cdn.awsli.com.br/203/203612/produto/127471573/910d53c05f.jpg", // Substitua por uma URL de imagem real
    price: "129,90"
  };



  return (
    <>
    <AppHeader/>
  
      <ProductCard  product={product}/>
    
    </>
  );
}

export default App;
