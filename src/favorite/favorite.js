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
            style={{ fontSize: '12px', color: 'white', cursor: 'pointer', backgroundColor: 'white', borderRadius: '50%' , width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          />
        </Badge>
      </div>

      <Drawer
        title="Seus Favoritos"
        placement="right"
        onClose={toggleFavorite}
        open={favoriteOpen}
        width={300}
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
