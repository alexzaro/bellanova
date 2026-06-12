export let productos = [];
export const setProductos = (v) => productos = v;

export let filtrosCategorias = [];
export const setFiltrosCategorias = (v) => filtrosCategorias = v;

export let filtrosMarcas = [];
export const setFiltrosMarcas = (v) => filtrosMarcas = v;

export let filtrosTiposPiel = [];
export const setFiltrosTiposPiel = (v) => filtrosTiposPiel = v;

export let filtrosObjetivosSalud = [];
export const setFiltrosObjetivosSalud = (v) => filtrosObjetivosSalud = v;

export let soloOfertas = false;
export const setSoloOfertas = (v) => soloOfertas = v;

export let busqueda = '';
export const setBusqueda = (v) => busqueda = v;

export let productosFiltradosGlobal = [];
export const setProductosFiltradosGlobal = (v) => productosFiltradosGlobal = v;

export let currentPage = 1;
export const setCurrentPage = (v) => currentPage = v;

export const ITEMS_PER_PAGE = 12;

export let observerInfiniteScroll = null;
export const setObserverInfiniteScroll = (v) => observerInfiniteScroll = v;

export let filterAccordionCollapsed = {
  groupCategorias: false,
  groupMarcas: false,
  groupSkinType: false,
  groupHealthGoal: false
};

export let carrito = JSON.parse(localStorage.getItem('bellanova_cart')) || [];
export const setCarrito = (v) => carrito = v;
