import React, { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Menu,
  MenuItem,
  useMediaQuery,
  useTheme,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Collapse,
} from '@mui/material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import CategoryIcon from '@mui/icons-material/Category';
import { ExpandLess, ExpandMore } from '@mui/icons-material';

// --- Constantes de Estilo (Baseadas no seu CSS) ---
const COLOR_FUNDO_BARRA = '#1c1c1c';     // Fundo preto suave
const COLOR_FUNDO_HOVER = '#e9e5dc';     // "Tom arroz"
const COLOR_TEXTO_HOVER = '#b71c1c';     // "Vermelho sakura"
const COLOR_TEXTO_PADRAO = '#e0e0e0';    // Cinza claro
const OFFSET_TOPO_DESKTOP = '123px';    // Distância do topo
const LARGURA_DESKTOP = '13vw';         // Largura da barra

// gera id seguro (sem acento/espaço)
const slug = (s = '') =>
  s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .toLowerCase();

const CategoryBarMui = () => {
  const theme = useTheme();
  // MUI breakpoints: down('md') é geralmente <= 900px
  const isMobile = useMediaQuery(theme.breakpoints.down('md')); 
  const isTablet = useMediaQuery(theme.breakpoints.between('md', 'lg'));

  // --- ESTADOS ---
  const [menuItems, setMenuItems] = useState([]);
  const [selectedTab, setSelectedTab] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const openMenu = Boolean(anchorEl);

  const handleScrollTo = (id) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    console.log(el);
  };
  
  // --- FETCH DE DADOS ---
  useEffect(() => {
    fetch('https://restaurant-sw98.onrender.com/categoriasSub')
      .then((res) => res.json())
      .then((data) => {
        const items = (data || []).map((categoria, i) => {
          const catId = String(categoria.ID ?? i + 1);
          const catLabel = categoria.Nome;
          const catSlug = slug(catLabel);
          const catKey = `cat-${catId}`;

          const subs = (categoria.Subcategorias || []).filter(
            (s) => s?.Nome && s.Nome !== 'Sem subcategoria'
          );

          return {
            key: catKey,
            label: catLabel,
            onClick: () => handleScrollTo(catSlug),
            children: subs.length > 0
              ? subs.map((sub) => ({
                key: `sub-${catId}-${sub.ID ?? sub.Nome}`,
                label: sub.Nome,
                onClick: () => handleScrollTo(slug(sub.Nome)),
              }))
              : null,
          };
        });
        setMenuItems(items);
      })
      .catch((err) => {
        console.error('Erro ao buscar categorias:', err);
      });
  }, []);

  // --- Lógica de Abertura e Fechamento do Menu ---
  const handleOpenMenu = (event, item) => {
    if (item.children) {
      setAnchorEl(event.currentTarget);
      setSelectedTab(item.key);
    } else {
      item.onClick();
      setSelectedTab(item.key);
    }
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
    setSelectedTab(false);
  };

  const handleMenuItemClick = (onClick) => {
    onClick();
    handleCloseMenu();
  };

  // --- CORREÇÃO DO SCROLL BUG (Fechamento do Menu ao Rolar) ---
  const handleScrollAttempt = (event) => {
    if (openMenu) {
        // Rolagem com mouse/trackpad
        if (event.type === 'wheel' && Math.abs(event.deltaX) > Math.abs(event.deltaY)) {
            handleCloseMenu();
        }
        // Rolagem com toque
        else if (event.type === 'touchmove') {
             handleCloseMenu();
        }
    }
  };

  // --- Renderização Mobile ---
  if (isMobile) {
    // LAYOUT MOBILE: Chips horizontais fixados no bottom
    return (
      <Box 
        onWheel={handleScrollAttempt}
        onTouchMove={handleScrollAttempt}
        sx={{
          // agora fixo em bottom no mobile
          position: 'fixed',
          bottom: 0,
          top: 'unset',
          left: 0,
          width: '100vw',
          height: '11vh',
          minHeight: '70px',
          bgcolor: COLOR_FUNDO_BARRA,
          boxShadow: '0 -2px 6px rgba(0, 0, 0, 0.25)',
          zIndex: 1400,
          overflowX: 'auto',
          overflowY: 'hidden',
          whiteSpace: 'nowrap',
          padding: '8px 0',
          display: 'flex',
          flexDirection: 'row',
          gap: '12px',
          scrollBehavior: 'smooth',
          // garante que fique acima das barras do sistema (iOS/Android)
          paddingBottom: 'calc(env(safe-area-inset-bottom) + 8px)',

          // SCROLLBAR MOBILE:
          '&::-webkit-scrollbar': { height: '4px' },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: 'rgba(255, 255, 255, 0.2)',
            borderRadius: '2px',
          },
        }}
      >
        <Box sx={{ display: 'flex', gap: '12px', padding: '0 12px' }}>
          {menuItems.map((item) => {
            const hasChildren = item.children && item.children.length > 0;
            const isSelected = selectedTab === item.key;

            const ChipContent = (
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                {item.label}
                {hasChildren && <KeyboardArrowDownIcon sx={{ ml: 0.5, fontSize: '1rem' }} />}
              </Box>
            );

            // Estilos de Chip Mobile
            const chipSx = {
                flex: '0 0 auto',
                border: 'none',
                background: isSelected ? COLOR_FUNDO_HOVER : '#2a2a2a',
                color: isSelected ? COLOR_TEXTO_HOVER : COLOR_TEXTO_PADRAO,
                padding: '10px 18px',
                marginBottom: '8px',
                borderRadius: '20px',
                fontFamily: 'Inter, sans-serif',
                fontSize: '1rem',
                fontWeight: 500,
                whiteSpace: 'nowrap',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                textTransform: 'none',
                '&:hover': {
                    background: COLOR_FUNDO_HOVER,
                    color: COLOR_TEXTO_HOVER,
                },
                '&:focus-visible': {
                    outline: `2px solid ${COLOR_FUNDO_HOVER}`,
                    outlineOffset: '2px',
                }
            };

            return (
              <Button
                key={item.key}
                sx={chipSx}
                onClick={hasChildren ? (e) => handleOpenMenu(e, item) : () => { item.onClick(); setSelectedTab(item.key); }}
              >
                {ChipContent}
              </Button>
            );
          })}
        </Box>

        {/* Menu para Subcategorias (Dropdown Mobile) */}
        {menuItems.map((item) => item.children && item.key === selectedTab && (
          <Menu
            key={`menu-${item.key}`}
            anchorEl={anchorEl}
            open={openMenu && selectedTab === item.key}
            onClose={handleCloseMenu}
            // Faz o menu abrir acima do botão (útil quando a barra está no bottom)
            anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
            transformOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            sx={{
                '& .MuiPaper-root': {
                    background: '#2a2a2a !important',
                    borderRadius: '8px',
                    padding: '6px 0',
                    zIndex: 1600,
                },
            }}
          >
            {item.children.map((sub) => (
              <MenuItem
                key={sub.key}
                onClick={() => handleMenuItemClick(sub.onClick)}
                sx={{
                    color: COLOR_TEXTO_PADRAO,
                    fontFamily: 'Inter, sans-serif',
                    
                    // 🚀 AJUSTE PARA ALTURA ~70PX NO MOBILE
                    padding: '12px 16px', 
                    fontSize: '1.2rem', 
                    minHeight: '70px', // Garante a altura
                    
                    '&:hover': {
                        background: `${COLOR_FUNDO_HOVER} !important`,
                        color: `${COLOR_TEXTO_HOVER} !important`,
                    }
                }}
              >
                <ListItemText 
                    primary={sub.label} 
                    sx={{ '& .MuiListItemText-primary': { fontSize: '1.2rem' } }} 
                />
              </MenuItem>
            ))}
          </Menu>
        ))}
      </Box>
    );
  }

  // --- Renderização Desktop (e Tablet) ---
  const larguraFinal = isTablet ? '20vw' : LARGURA_DESKTOP;
  const itemWidth = isTablet ? '18vw' : LARGURA_DESKTOP;
  const subItemWidth = isTablet ? '16vw' : '11vw';

  return (
    <Box
      sx={{
        // REPLICAÇÃO DO CSS: .category-bar (desktop)
        position: 'fixed',
        top: isTablet ? '16vh' : '50px',
        left: 0,
        width: larguraFinal,
        height: 'calc(100vh - 15px)',
        bgcolor: COLOR_FUNDO_BARRA,
        boxShadow: '3px 0 6px rgba(0, 0, 0, 0.2)',
        zIndex: 998,
        overflowY: 'auto',
        transition: 'transform 0.4s ease-in-out',
        fontFamily: 'Inter, sans-serif',

        // SCROLLBAR DESKTOP:
        '&::-webkit-scrollbar': { width: '6px' },
        '&::-webkit-scrollbar-thumb': {
            backgroundColor: 'rgba(255, 255, 255, 0.2)',
            borderRadius: '3px',
        },
      }}
    >
      <List component="nav" sx={{ padding: '8px 0', backgroundColor: 'transparent' }}>
        {menuItems.map((item) => {
          const hasChildren = item.children && item.children.length > 0;
          const isSelected = selectedTab === item.key;
          
          // Estilos base de Item Principal
          const listItemSx = {
            width: itemWidth,
            fontSize: isTablet ? '1.3rem' : '1.2rem',
            fontWeight: 500,
            paddingLeft: '24px',
            color: COLOR_TEXTO_PADRAO,
            borderRadius: '4px',
            margin: '8px auto',
            transition: 'all 0.3s ease',
            backgroundColor: 'transparent',
            textTransform: 'none',

            '&:hover': {
              backgroundColor: `${COLOR_FUNDO_HOVER} !important`,
              color: `${COLOR_TEXTO_HOVER} !important`,
              '& .MuiListItemIcon-root': { color: `${COLOR_TEXTO_HOVER} !important` }
            },
            ...(isSelected && {
              backgroundColor: `${COLOR_FUNDO_HOVER} !important`,
              color: `${COLOR_TEXTO_HOVER} !important`,
              '& .MuiListItemIcon-root': { color: `${COLOR_TEXTO_HOVER} !important` }
            }),
          };

          if (hasChildren) {
            return (
              <Box key={item.key}>
                <ListItemButton 
                  sx={listItemSx}
                  onClick={(e) => handleOpenMenu(e, item)}
                  disableRipple
                >
                  <ListItemIcon sx={{ color: 'inherit', minWidth: '40px' }}>
                    <CategoryIcon />
                  </ListItemIcon>
                  <ListItemText primary={item.label} />
                  {openMenu && selectedTab === item.key ? <ExpandLess /> : <ExpandMore />}
                </ListItemButton>
                
                {/* Submenus (Collapse) Desktop/Tablet */}
                <Collapse in={openMenu && selectedTab === item.key} timeout="auto" unmountOnExit>
                  <List component="div" disablePadding>
                    {item.children.map((sub) => (
                      <ListItemButton 
                        key={sub.key} 
                        onClick={() => handleMenuItemClick(sub.onClick)}
                        sx={{
                            width: subItemWidth,
                            marginLeft: '33px',
                            
                            // Espaçamento para o item desktop (aumentado para manter o design)
                            paddingRight: '70px', 
                            paddingTop: '6px', 
                            paddingBottom: '6px', 
                            
                            backgroundColor: '#2a2a2a !important',
                            paddingLeft: '36px !important',
                            color: COLOR_TEXTO_PADRAO,
                            fontSize: isTablet ? '1rem' : '1.4rem', 
                            fontWeight: 400,
                            borderRadius: '4px',
                            margin: '4px auto',
                            '&:hover': {
                                backgroundColor: `${COLOR_FUNDO_HOVER} !important`,
                                color: `${COLOR_TEXTO_HOVER} !important`,
                            },
                        }}
                      >
                        <ListItemText 
                            primary={sub.label} 
                            sx={{ '& .MuiListItemText-primary': { fontSize: isTablet ? '1rem' : '1.4rem' } }}
                        />
                      </ListItemButton>
                    ))}
                  </List>
                </Collapse>
              </Box>
            );
          }

          // Item simples (Desktop/Tablet)
          return (
            <ListItemButton 
              key={item.key} 
              onClick={() => { item.onClick(); setSelectedTab(item.key); }}
              sx={listItemSx}
              disableRipple
            >
              <ListItemIcon sx={{ color: 'inherit', minWidth: '40px' }}>
                <CategoryIcon />
              </ListItemIcon>
              <ListItemText primary={item.label} />
            </ListItemButton>
          );
        })}
      </List>
    </Box>
  );
};

export default CategoryBarMui;
