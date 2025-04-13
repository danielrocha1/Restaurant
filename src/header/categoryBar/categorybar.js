import './categorybar.css';

const CategoryBar = ({ hideHeader }) => {
  const categories = ['Cães', 'Gatos', 'Pássaros', 'Peixes', 'Rações', 'Brinquedos'];

  return (
    <div className={`category-bar ${hideHeader ? 'category-bar-up' : ''}`}>
      {categories.map((cat, index) => (
        <div key={index} className="category-item">
          {cat}
        </div>
      ))}
    </div>
  );
};

export default CategoryBar;
