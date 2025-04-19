// context/favoriteContext.js
import { createContext, useContext, useState } from "react";

export const FavoriteContext = createContext();

export const FavoriteProvider = ({ children }) => {
  const [favorites, setFavorites] = useState([]);

  const isFavorited = (productName) =>
    favorites.some((item) => item.name === productName);

  const addFavorite = (product) => {
    if (!isFavorited(product.name)) {
      setFavorites([...favorites, product]);
    }
  };

  const removeFavorite = (productName) => {
    setFavorites(favorites.filter((item) => item.name !== productName));
  };

  return (
    <FavoriteContext.Provider
      value={{ favorites, addFavorite, removeFavorite, isFavorited }}
    >
      {children}
    </FavoriteContext.Provider>
  );
};

export const useFavorite = () => useContext(FavoriteContext);
