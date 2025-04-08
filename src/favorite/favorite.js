import React, { useState } from 'react';
import { Badge, Drawer, Button } from 'antd';
import { HeartOutlined } from '@ant-design/icons';
import "./favorite.css"
import ProductCard from '../productCard/product';

const Favorite = () => {
    const product = {
        name: "Ração Premium para Cães",
        description: "Ração premium de alta qualidade, ideal para cães de todas as idades.",
        image: "https://cdn.awsli.com.br/203/203612/produto/127471573/910d53c05f.jpg", // Substitua por uma URL de imagem real
        price: "129,90"
    };

  const [favoriteOpen, setFavoriteOpen] = useState(false);

  const toggleFavorite = () => {
    setFavoriteOpen(!favoriteOpen);
  };

  return (
    <>
      <div className= "">
        <Badge count={5} size="small" onClick={toggleFavorite}>
          <HeartOutlined style={{ fontSize: '32px', color: 'white', cursor: 'pointer' }} />
        </Badge>
      </div>

      <Drawer
        title="Seus Favoritos"
        placement="top"
        onClose={toggleFavorite}
        open={favoriteOpen}
        width={350}
        height={700}
      >
        <> 
        
            <ProductCard product={product}/>
        
        </>
        
      </Drawer>
    </>
  );
};

export default Favorite;
