import React, { useRef, useEffect, useState } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';

import ProductCard from '../productCard/product';
import './carousel.css';

const ProductCarousel = ({
  id,
  subCategoryName,
  products,
  onRequestMore,
  currentPage = 1,
  lastPage = 1
}) => {
  const [isMobile, setIsMobile] = useState(false);
  const [swiperInstance, setSwiperInstance] = useState(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isBeginning, setIsBeginning] = useState(true);
  const [isEnd, setIsEnd] = useState(false);

  const prevRef = useRef(null);
  const nextRef = useRef(null);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (
      swiperInstance &&
      activeIndex >= products.length - (isMobile ? 2 : 4) &&
      currentPage < lastPage
    ) {
      onRequestMore(subCategoryName, currentPage + 1);
    }
  }, [activeIndex, swiperInstance, products.length, currentPage, lastPage, subCategoryName, isMobile, onRequestMore]);

  // Força atualização visual quando novos produtos forem carregados
  useEffect(() => {
    if (swiperInstance) {
      swiperInstance.update();
    }
  }, [products, swiperInstance]);

  useEffect(() => {
  const swiperContainer = document.getElementById(id);

  if (!swiperContainer || isMobile) return;

  const handleWheel = (e) => {
    if (!swiperInstance) return;

    if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
      e.preventDefault(); // bloqueia scroll da página

      const speed = 500; // em milissegundos

      if (e.deltaX > 0 && !swiperInstance.isEnd) {
        swiperInstance.slideTo(swiperInstance.activeIndex + 1, speed);
      } else if (e.deltaX < 0 && !swiperInstance.isBeginning) {
        swiperInstance.slideTo(swiperInstance.activeIndex - 1, speed);
      }
    }
  };

  swiperContainer.addEventListener('wheel', handleWheel, { passive: false });

  return () => {
    swiperContainer.removeEventListener('wheel', handleWheel);
  };
}, [swiperInstance, id, isMobile]);


  const handleSlideChange = (swiper) => {
    setActiveIndex(swiper.activeIndex);
    setIsBeginning(swiper.isBeginning);
    setIsEnd(swiper.isEnd);
  };

  return (
    <div id={id} className="category">
      <div className="category-header">
        <h2>{subCategoryName}</h2>
        {!isMobile && (
          <div className="navigation-buttons">
            <button
              ref={prevRef}
              className="custom-prev"
              aria-label="Página anterior"
              disabled={isBeginning}
            >
              ‹
            </button>
            <button
              ref={nextRef}
              className="custom-next"
              aria-label="Próxima página"
              disabled={isEnd}
            >
              ›
            </button>
          </div>
        )}
      </div>

      <Swiper
        modules={[Navigation]}
        direction={isMobile ? 'vertical' : 'horizontal'}
        spaceBetween={10}
        slidesPerView={isMobile ? 1 : 3}
        observer={true}
        observeParents={true}
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
        onSwiper={setSwiperInstance}
        onSlideChange={handleSlideChange}
        className="swiper-wrapper"
      >
        {products.map((product, index) => (
          <SwiperSlide key={product.id || index}>
            <ProductCard product={product} />
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
};

export default ProductCarousel;
