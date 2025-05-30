import React, { useRef, useEffect, useState } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';

import ProductCard from '../productCard/product';
import './carousel.css';

const ProductCarousel = ({ id, subCategoryName, products }) => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const prevRef = useRef(null);
  const nextRef = useRef(null);

  // Atualiza quando a tela for redimensionada
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div id={id} className="category">
      <div className="category-header">
        <h2>{subCategoryName}</h2>
        {!isMobile && (
          <div className="navigation-buttons">
            <button ref={prevRef} className="custom-prev">‹</button>
            <button ref={nextRef} className="custom-next">›</button>
          </div>
        )}
      </div>

      <Swiper
        modules={[Navigation]}
        direction={isMobile ? 'vertical' : 'horizontal'}
        spaceBetween={10}
        slidesPerView={isMobile ? 1 : 3}
        navigation={
          !isMobile
            ? {
                prevEl: prevRef.current,
                nextEl: nextRef.current,
              }
            : false
        }
        onBeforeInit={(swiper) => {
          if (!isMobile) {
            swiper.params.navigation.prevEl = prevRef.current;
            swiper.params.navigation.nextEl = nextRef.current;
          }
        }}
        className="swiper-wrapper"
      >
        {products.map((product, index) => (
          <SwiperSlide key={index}>
            <ProductCard product={product} />
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
};

export default ProductCarousel;
