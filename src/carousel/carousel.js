import React, { useRef, useEffect } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';

import ProductCard from '../productCard/product';
import './carousel.css';

const ProductCarousel = ({ id, subCategoryName, products }) => {
  const prevRef = useRef(null);
  const nextRef = useRef(null);

  return (
    <div id={id} className="category">
      <div className="category-header">
        <h2>{subCategoryName}</h2>
        <div className="navigation-buttons">
          <button ref={prevRef} className="custom-prev">‹</button>
          <button ref={nextRef} className="custom-next">›</button>
        </div>
      </div>

      <Swiper
        modules={[Navigation]}
        spaceBetween={0}
        slidesPerView={3}
        navigation={{
          prevEl: prevRef.current,
          nextEl: nextRef.current,
        }}
        onBeforeInit={(swiper) => {
          // Necessário para ligar os botões customizados
          swiper.params.navigation.prevEl = prevRef.current;
          swiper.params.navigation.nextEl = nextRef.current;
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
