import React, { useRef, useEffect, useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";

import ProductCard from "../ProductCard/ProductCard";
import "./ProductCarousel.css";

/**
 * Componente de carrossel de produtos
 * Exibe produtos em um carrossel horizontal (desktop) ou vertical (mobile)
 */
const ProductCarousel = ({
  id,
  subCategoryName,
  products,
  onRequestMore,
  currentPage = 1,
  lastPage = 1,
}) => {
  const [isMobile, setIsMobile] = useState(false);
  const [swiperInstance, setSwiperInstance] = useState(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isBeginning, setIsBeginning] = useState(true);
  const [isEnd, setIsEnd] = useState(false);
  const [swiperHeight, setSwiperHeight] = useState("auto"); // Novo estado para altura dinâmica
  const cardRef = useRef(null); // Referência para o primeiro card para medir a altura

  const prevRef = useRef(null);
  const nextRef = useRef(null);

  // Detecta se é mobile e calcula a altura do Swiper
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);

      // Lógica para calcular a altura do Swiper (apenas para desktop/tablet)
      // Adicionando uma margem de segurança maior (ex: 40px) para evitar quebras
      if (!mobile && cardRef.current) {
        // Altura do card + margem/padding (aproximadamente 40px de margem vertical)
        const cardHeight = cardRef.current.offsetHeight;
        setSwiperHeight(`${cardHeight + 40}px`);
      } else {
        // No mobile, a altura é fixa em 70px, conforme solicitado.
        setSwiperHeight("70px");
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [products.length]); // Recalcula quando os produtos mudam ou a tela redimensiona

  // Carrega mais produtos quando chega perto do final
  useEffect(() => {
    if (
      swiperInstance &&
      activeIndex >= products.length - (isMobile ? 2 : 4) &&
      currentPage < lastPage
    ) {
      onRequestMore(subCategoryName, currentPage + 1);
    }
  }, [
    activeIndex,
    swiperInstance,
    products.length,
    currentPage,
    lastPage,
    subCategoryName,
    isMobile,
    onRequestMore,
  ]);

  // Atualiza o swiper quando novos produtos são carregados
  useEffect(() => {
    if (swiperInstance) {
      swiperInstance.update();
    }
  }, [products, swiperInstance]);

  // Permite scroll horizontal com o mouse wheel (desktop)
  useEffect(() => {
    const swiperContainer = document.getElementById(id);

    // Desativa o wheel scroll no mobile (isMobile)
    if (!swiperContainer || isMobile) return;

    const handleWheel = (e) => {
      if (!swiperInstance) return;

      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
        e.preventDefault();

        const speed = 500;

        if (e.deltaX > 0 && !swiperInstance.isEnd) {
          swiperInstance.slideTo(swiperInstance.activeIndex + 1, speed);
        } else if (e.deltaX < 0 && !swiperInstance.isBeginning) {
          swiperInstance.slideTo(swiperInstance.activeIndex - 1, speed);
        }
      }
    };

    swiperContainer.addEventListener("wheel", handleWheel, { passive: false });

    return () => {
      swiperContainer.removeEventListener("wheel", handleWheel);
    };
  }, [swiperInstance, id, isMobile]);

	  const handleSlideChange = (swiper) => {
	    setActiveIndex(swiper.activeIndex);
	    setIsBeginning(swiper.isBeginning);
	    setIsEnd(swiper.isEnd);
	  };
	
	  return (
	    <div id={id} className="category">
	      {/* Adiciona o estilo de altura dinâmico ao Swiper */}
	      {/* A altura será aplicada diretamente no componente Swiper via prop style */}
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
	        direction="horizontal" // Manter horizontal para simplificar o layout
	        spaceBetween={10}
	        style={{ height: swiperHeight }} // Aplica a altura calculada
	        // ... (restante das props)
        breakpoints={{
          0: {
            slidesPerView: 1, // mobile: 1 slide por vez para evitar quebra de layout
            direction: "vertical", // Força o Swiper a se comportar como uma lista vertical
          },
          769: {
            slidesPerView: 2, // tablet
            direction: "horizontal",
          },
          1025: {
            slidesPerView: 3, // desktop
            direction: "horizontal",
          },
        }}
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
	          <SwiperSlide key={index} data-produto-id={`${product.ID}`}>
	            <ProductCard product={product} ref={index === 0 ? cardRef : null} />
	          </SwiperSlide>
	        ))}
	      </Swiper>
    </div>
  );
};

export default ProductCarousel;
