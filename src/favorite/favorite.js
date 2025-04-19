import React, { useState } from 'react';
import { Badge, Drawer } from 'antd';
import { HeartOutlined } from '@ant-design/icons';
import "./favorite.css";
import ProductCard from '../productCard/product';
import { useFavorite } from '../context/favoriteContext'; // <--- Novo

const Favorite = () => {
  const [favoriteOpen, setFavoriteOpen] = useState(false);
  const { favorites } = useFavorite(); // <--- Pega favoritos do contexto

  const toggleFavorite = () => {
    setFavoriteOpen(!favoriteOpen);
  };

  return (
    <>
      <div>
        <Badge count={favorites.length} size="small" onClick={toggleFavorite}>
          <HeartOutlined
            style={{ fontSize: '32px', color: 'white', cursor: 'pointer' }}
          />
        </Badge>
      </div>

      <Drawer
        title="Seus Favoritos"
        placement="top"
        onClose={toggleFavorite}
        open={favoriteOpen}
        width={800} // Aumenta a largura pra caber mais cards
        height={700}
      >
        {favorites.length === 0 ? (
          <p>Você ainda não adicionou favoritos.</p>
        ) : (
          <div className="favorite-list">
            {favorites.map((product, index) => (
              <ProductCard key={index} product={product} />
            ))}
          </div>
        )}
      </Drawer>
    </>
  );
};

export default Favorite;
