import './categorybar.css';

const CategoryBar = () => {
  const categories = ['Cães', 'Gatos', 'Pássaros', 'Peixes', 'Rações', 'Brinquedos'];

  return (
    <div className="category-bar">
      {categories.map((cat, index) => (
        <div key={index} className="category-item">
          {cat}
        </div>
      ))}
    </div>
  );
};

export default CategoryBar;
