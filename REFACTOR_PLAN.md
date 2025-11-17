# Plano de Refatoração - Restaurant Frontend

## Estrutura Atual vs Nova Estrutura

### Estrutura Atual
```
src/
├── carousel/
│   ├── carousel.css
│   └── carousel.js
├── cart/
│   ├── cart.css
│   └── cart.js
├── config/
│   └── config.js
├── context/
│   ├── cartContext.js
│   └── wsContext.js
├── header/
│   ├── categoryBar/
│   │   ├── categorybar.css
│   │   └── categorybar.js
│   ├── header.css
│   └── header.js
├── loading/
│   ├── Ramen&Sushi.json
│   ├── loading.css
│   └── loading.js
├── productCard/
│   ├── product.css
│   └── product.js
├── App.css
├── App.js
└── index.js
```

### Nova Estrutura Proposta
```
src/
├── api/
│   ├── client.js
│   └── services/
│       ├── product.service.js
│       ├── category.service.js
│       └── order.service.js
├── hooks/
│   ├── useProducts.js
│   ├── useCategories.js
│   └── useWebSocket.js
├── contexts/
│   ├── CartContext.js
│   └── WebSocketContext.js
├── components/
│   ├── ProductCard/
│   │   ├── ProductCard.jsx
│   │   └── ProductCard.css
│   ├── ProductCarousel/
│   │   ├── ProductCarousel.jsx
│   │   └── ProductCarousel.css
│   ├── Header/
│   │   ├── Header.jsx
│   │   └── Header.css
│   ├── CategoryBar/
│   │   ├── CategoryBar.jsx
│   │   └── CategoryBar.css
│   ├── Cart/
│   │   ├── Cart.jsx
│   │   └── Cart.css
│   └── LoadingScreen/
│       ├── LoadingScreen.jsx
│       ├── LoadingScreen.css
│       └── Ramen&Sushi.json
├── utils/
│   ├── helpers.js
│   └── validators.js
└── pages/
    └── Menu/
        ├── Menu.jsx
        └── Menu.css
```

## Mapeamento de Arquivos

### 1. API Layer (Nova)
- **api/client.js**: Cliente HTTP centralizado com configuração base
- **api/services/product.service.js**: Serviços relacionados a produtos
- **api/services/category.service.js**: Serviços relacionados a categorias
- **api/services/order.service.js**: Serviços relacionados a pedidos/checkout

### 2. Hooks (Nova)
- **hooks/useProducts.js**: Lógica de gerenciamento de produtos (extraída do App.js)
- **hooks/useCategories.js**: Lógica de gerenciamento de categorias (extraída do App.js)
- **hooks/useWebSocket.js**: Hook customizado para WebSocket (refatorado de wsContext.js)

### 3. Contexts
- **contexts/CartContext.js**: context/cartContext.js → contexts/CartContext.js
- **contexts/WebSocketContext.js**: context/wsContext.js → contexts/WebSocketContext.js

### 4. Components
- **components/ProductCard/**: productCard/ → components/ProductCard/
- **components/ProductCarousel/**: carousel/ → components/ProductCarousel/
- **components/Header/**: header/header.* → components/Header/
- **components/CategoryBar/**: header/categoryBar/ → components/CategoryBar/
- **components/Cart/**: cart/ → components/Cart/
- **components/LoadingScreen/**: loading/ → components/LoadingScreen/

### 5. Utils (Nova)
- **utils/helpers.js**: Funções utilitárias (slug, formatPrice, normalizeProduto)
- **utils/validators.js**: Funções de validação

### 6. Pages (Nova)
- **pages/Menu/Menu.jsx**: App.js → pages/Menu/Menu.jsx (refatorado)
- **pages/Menu/Menu.css**: App.css → pages/Menu/Menu.css

### 7. Root Files
- **index.js**: Mantido com ajustes de imports
- **index.css**: Mantido

## Melhorias Implementadas

### 1. Separação de Responsabilidades
- ✅ Lógica de API separada em services
- ✅ Lógica de estado separada em hooks customizados
- ✅ Componentes focados apenas em UI

### 2. Nomenclatura Consistente
- ✅ PascalCase para componentes (.jsx)
- ✅ camelCase para utilitários e services
- ✅ Estrutura de pastas clara e organizada

### 3. Reutilização de Código
- ✅ Funções utilitárias centralizadas em utils/
- ✅ Cliente HTTP reutilizável em api/client.js
- ✅ Hooks customizados para lógica compartilhada

### 4. Manutenibilidade
- ✅ Cada componente em sua própria pasta
- ✅ Estilos colocalizados com componentes
- ✅ Imports organizados e claros

## Ordem de Implementação

1. ✅ Criar estrutura de pastas
2. ✅ Implementar utils/helpers.js
3. ✅ Implementar api/client.js e services
4. ✅ Refatorar contexts
5. ✅ Criar hooks customizados
6. ✅ Migrar componentes
7. ✅ Refatorar página Menu
8. ✅ Atualizar index.js
9. ✅ Testar e validar
