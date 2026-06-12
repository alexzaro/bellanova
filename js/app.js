/* ═══════════════════════════════════════════════════════════════
   BellaNova VIP — Premium Beauty & Suplementos Boutique
   Application Logic — Vanilla JavaScript ES6+
   ═══════════════════════════════════════════════════════════════ */

(() => {
  'use strict';

  // ─── Configuration ───
  const CONFIG = {
    whatsappNumber: '59178804382',
    whatsappMessage: (nombre, marca, id, precio) =>
      `Hola BellaNova VIP 👋✨\n\nQuiero realizar un pedido del siguiente producto:\n\n🧴 ${nombre}\n🏷️ Marca: ${marca}\n🆔 Código: #${id}\n💰 Precio: ${precio} Bs\n\nQuedo atento(a) a la confirmación de disponibilidad y métodos de pago 😊`,
    currency: 'Bs.',
    jsonPath: 'data/productos.json',
    cacheVersion: 'v6',
  };

  // ─── Category metadata ───
  const CATEGORY_META = {
    'Skincare': { icon: '✨', order: 1, isTopCategory: false },
    'Sérum': { icon: '💧', order: 2, isTopCategory: true },
    'Protector Solar': { icon: '☀️', order: 3, isTopCategory: true },
    'Limpiador': { icon: '🫧', order: 4, isTopCategory: true },
    'Hidratante': { icon: '💎', order: 5, isTopCategory: true },
    'Exfoliante': { icon: '🌿', order: 6, isTopCategory: true },
    'Esencia': { icon: '🧴', order: 7, isTopCategory: true },
    'Tónico': { icon: '💦', order: 8, isTopCategory: true },
    'Tratamiento': { icon: '🔬', order: 9, isTopCategory: true },
    'Suplementos': { icon: '🌱', order: 10, isTopCategory: false },
    'Colágeno': { icon: '🦴', order: 11, isTopCategory: true },
    'Vitaminas': { icon: '💊', order: 12, isTopCategory: true },
    'Suplemento': { icon: '🧬', order: 13, isTopCategory: true },
  };

  // ─── State ───
  let productos = [];
  let filtrosCategorias = [];
  let filtrosMarcas = [];
  let filtrosTiposPiel = [];
  let filtrosObjetivosSalud = [];
  let soloOfertas = false;
  let busqueda = '';
  // Pagination State
  let productosFiltradosGlobal = [];
  let currentPage = 1;
  const ITEMS_PER_PAGE = 12;
  let observerInfiniteScroll = null;
  
  let filterAccordionCollapsed = {
    groupCategorias: false,
    groupMarcas: false,
    groupSkinType: false,
    groupHealthGoal: false
  };

  let carrito = JSON.parse(localStorage.getItem('bellanova_cart')) || [];

  // ─── Utilities ───
  const $ = (selector, ctx = document) => ctx.querySelector(selector);
  const $$ = (selector, ctx = document) => [...ctx.querySelectorAll(selector)];

  function generarEnlaceWhatsApp(producto) {
    const msg = CONFIG.whatsappMessage(producto.nombre, producto.marca, producto.id, producto.precio);
    return `https://wa.me/${CONFIG.whatsappNumber}?text=${encodeURIComponent(msg)}`;
  }

  function generarBadge(badge) {
    if (!badge) return '';
    const labels = {
      viral: '🔥 Viral',
      trending: '📈 Trending',
      bestseller: '⭐ Bestseller',
      recomendado: '💎 Recomendado',
      nuevo: '🆕 Nuevo',
    };
    return `<span class="badge badge--${badge}">${labels[badge] || badge}</span>`;
  }

  function generarEstrellas(rating) {
    const full = Math.floor(rating);
    const half = rating % 1 >= 0.5 ? 1 : 0;
    const empty = 5 - full - half;
    return '★'.repeat(full) + (half ? '½' : '') + '☆'.repeat(empty);
  }

  function formatPrecio(precio) {
    return `${CONFIG.currency} ${precio}`;
  }

  function getCategoryIcon(subcategoria, categoria) {
    return CATEGORY_META[subcategoria]?.icon || CATEGORY_META[categoria]?.icon || '📦';
  }

  function getCategorySvg(subcategoria, isDrawer = true) {
    const iconClass = isDrawer ? 'categories-drawer__icon' : 'category-card__svg';
    const size = isDrawer ? "18" : "36";
    const strokeWidth = isDrawer ? "1.8" : "1.2";
    const attrs = `class="${iconClass}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"`;
    
    const svgs = {
      'Skincare': `<svg ${attrs}><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>`,
      'Sérum': `<svg ${attrs}><path d="M12 22a7 7 0 0 0 7-7c0-4.3-7-11-7-11S5 10.7 5 15a7 7 0 0 0 7 7z"/></svg>`,
      'Protector Solar': `<svg ${attrs}><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg>`,
      'Limpiador': `<svg ${attrs}><circle cx="9" cy="9" r="4"/><circle cx="16" cy="15" r="3"/><circle cx="16" cy="8" r="2.5"/><circle cx="10" cy="16" r="2"/></svg>`,
      'Hidratante': `<svg ${attrs}><path d="M19 10H5a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2ZM12 6V10M8 8h8"/></svg>`,
      'Exfoliante': `<svg ${attrs}><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 3.5 1 9.8a7 7 0 0 1-9 8.2z"/><path d="M9 22v-4"/></svg>`,
      'Esencia': `<svg ${attrs}><rect x="7" y="9" width="10" height="12" rx="2"/><path d="M9 9V5a3 3 0 0 1 6 0v4"/></svg>`,
      'Tónico': `<svg ${attrs}><path d="M12 22a7 7 0 0 0 7-7c0-4.3-7-11-7-11S5 10.7 5 15a7 7 0 0 0 7 7z"/><path d="M12 12v3"/></svg>`,
      'Tratamiento': `<svg ${attrs}><path d="M6 2h12v3L14 11v8a2 2 0 0 1-2 2H12a2 2 0 0 1-2-2v-8L6 5V2z"/></svg>`,
      'Suplementos': `<svg ${attrs}><path d="M2 22h20M12 22V12M12 12c0-3.3 2.7-6 6-6M12 12C12 8.7 9.3 6 6 6"/></svg>`,
      'Colágeno': `<svg ${attrs}><path d="M12 22a7 7 0 0 0 7-7c0-4.3-7-11-7-11S5 10.7 5 15a7 7 0 0 0 7 7z"/><path d="M12 12v6M9 15h6"/></svg>`,
      'Vitaminas': `<svg ${attrs}><rect x="2" y="9" width="20" height="6" rx="3" transform="rotate(-45 12 12)"/><line x1="8.5" y1="15.5" x2="15.5" y2="8.5"/></svg>`,
      'Suplemento': `<svg ${attrs}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>`,
      'generic': `<svg ${attrs}><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>`
    };

    if (svgs[subcategoria]) return svgs[subcategoria];
    
    // Herencia: Buscar la categoría padre de este producto
    const parentProd = productos.find(p => p.subcategoria === subcategoria);
    if (parentProd && parentProd.categoria && svgs[parentProd.categoria]) {
      return svgs[parentProd.categoria];
    }
    
    return svgs['generic'];
  }



  // ─── Bottom Navigation Mobile Logic ───
  function initBottomNav() {
    // Bind click events
    $('#bottomNavCategories')?.addEventListener('click', () => {
      if (document.getElementById('categorias')) {
        document.getElementById('categorias').scrollIntoView({ behavior: 'smooth' });
      } else {
        window.location.href = 'index.html#categorias';
      }
    });

    $('#bottomNavSearch')?.addEventListener('click', () => {
      const isCatalogPage = window.location.pathname.includes('catalogo.html');
      if (isCatalogPage) {
        const input = $('#searchInput');
        if (input) {
          input.focus();
          document.getElementById('catalogo')?.scrollIntoView({ behavior: 'smooth' });
        }
      } else {
        window.location.href = 'catalogo.html?focusSearch=true';
      }
    });

    // Mark current item active based on page
    const isCatalog = window.location.pathname.includes('catalogo.html');
    const isProduct = window.location.pathname.includes('producto.html');
    if (isCatalog) {
      $('#bottomNavCatalog')?.classList.add('active');
    } else if (!isProduct) {
      $('#bottomNavHome')?.classList.add('active');
    }
  }

  // ─── Cart Logic ───
  function guardarCarrito() {
    localStorage.setItem('bellanova_cart', JSON.stringify(carrito));
    renderizarCarrito();
  }

  function animarBadges() {
    const badges = document.querySelectorAll('.cart-badge');
    badges.forEach(b => {
      b.classList.remove('pop-animation');
      void b.offsetWidth; // trigger reflow
      b.classList.add('pop-animation');
    });
  }

  function mostrarToast(mensaje) {
    let toast = document.getElementById('bellanovaToast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'bellanovaToast';
      toast.className = 'bellanova-toast';
      document.body.appendChild(toast);
    }
    toast.textContent = mensaje;
    toast.classList.add('show');
    if (toast.timeoutId) clearTimeout(toast.timeoutId);
    toast.timeoutId = setTimeout(() => {
      toast.classList.remove('show');
    }, 2500);
  }

  function agregarAlCarrito(productoId) {
    const prod = productos.find(p => p.id === productoId);
    if (!prod) return;
    const itemEnCarrito = carrito.find(item => item.id === productoId);
    if (itemEnCarrito) {
      itemEnCarrito.cantidad++;
    } else {
      carrito.push({ ...prod, cantidad: 1 });
    }
    guardarCarrito();
    mostrarToast("Producto añadido al carrito");
    animarBadges();
  }

  function eliminarDelCarrito(productoId) {
    carrito = carrito.filter(item => item.id !== productoId);
    guardarCarrito();
    if (carrito.length === 0) {
      cerrarCarrito();
    }
  }

  function actualizarCantidadCarrito(productoId, delta) {
    const item = carrito.find(item => item.id === productoId);
    if (!item) return;
    item.cantidad += delta;
    if (item.cantidad <= 0) {
      eliminarDelCarrito(productoId);
    } else {
      guardarCarrito();
    }
  }

  function renderizarCarrito() {
    const totalQty = carrito.reduce((sum, item) => sum + item.cantidad, 0);
    const totalPrice = carrito.reduce((sum, item) => sum + (item.precio * item.cantidad), 0);
    
    const badgeHeader = $('#cartBadgeHeader');
    const badgeMobile = $('#cartBadgeMobile');
    if (badgeHeader) badgeHeader.textContent = totalQty;
    if (badgeMobile) badgeMobile.textContent = totalQty;

    const itemsContainer = $('#cartItemsContainer');
    const totalPriceEl = $('#cartTotalPrice');
    if (itemsContainer) {
      if (carrito.length === 0) {
        itemsContainer.innerHTML = `
          <div class="cart-drawer__empty">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="color:var(--border-soft)">
              <circle cx="9" cy="21" r="1"></circle>
              <circle cx="20" cy="21" r="1"></circle>
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
            </svg>
            <p>Tu carrito está vacío</p>
          </div>
        `;
      } else {
        itemsContainer.innerHTML = carrito.map(item => `
          <div class="cart-item">
            <img src="${item.imagen || 'assets/img/placeholder.png'}" alt="${item.nombre}" class="cart-item__img">
            <div class="cart-item__info">
              <span class="cart-item__price">${formatPrecio(item.precio)}</span>
              <span class="cart-item__brand">${item.marca}</span>
              <span class="cart-item__name">${item.nombre}</span>
              <div class="cart-item__actions-row">
                <div class="cart-item__controls">
                  <button class="cart-item__btn" onclick="window.bellanova.actualizarCantidadCarrito(${item.id}, -1)">-</button>
                  <span class="cart-item__qty">${item.cantidad}</span>
                  <button class="cart-item__btn" onclick="window.bellanova.actualizarCantidadCarrito(${item.id}, 1)">+</button>
                </div>
                <button class="cart-item__remove-text" aria-label="Eliminar" onclick="window.bellanova.eliminarDelCarrito(${item.id})">
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        `).join('');
      }
    }
    
    if (totalPriceEl) totalPriceEl.textContent = formatPrecio(totalPrice);
  }

  function abrirCarrito() {
    const drawer = $('#cartDrawer');
    const overlay = $('#cartOverlay');
    if (drawer && overlay) {
      drawer.classList.add('active');
      overlay.classList.add('active');
      document.body.classList.add('modal-open');
    }
  }

  function cerrarCarrito() {
    const drawer = $('#cartDrawer');
    const overlay = $('#cartOverlay');
    if (drawer && overlay) {
      drawer.classList.remove('active');
      overlay.classList.remove('active');
      document.body.classList.remove('modal-open');
    }
  }

  function enviarPedidoWhatsApp() {
    if (carrito.length === 0) return;
    const itemsText = carrito.map(i => `• ${i.cantidad}x ${i.nombre} (${i.marca}) - ${formatPrecio(i.precio * i.cantidad)}`).join('\n');
    const totalPrice = carrito.reduce((sum, i) => sum + (i.precio * i.cantidad), 0);
    const msg = `Hola BellaNova VIP 👋✨\n\nQuiero realizar el siguiente pedido:\n\n${itemsText}\n\n💰 *Total: ${formatPrecio(totalPrice)}*\n\nQuedo atento(a) a la confirmación de disponibilidad y métodos de pago 😊`;
    window.open(`https://wa.me/${CONFIG.whatsappNumber}?text=${encodeURIComponent(msg)}`, '_blank', 'noopener');
  }

  // Expose to window for inline onclick handlers in cart drawer
  window.bellanova = { actualizarCantidadCarrito, eliminarDelCarrito };

  // ─── Data Loading ───
  function mostrarSkeletons(selector, count = 4) {
    const grid = $(selector);
    if (!grid) return;
    
    let html = '';
    for (let i = 0; i < count; i++) {
      html += `
        <article class="product-card skeleton-card" style="display:flex; flex-direction:column;">
          <div class="product-card__image-wrapper skeleton skeleton-img"></div>
          <div class="product-card__content" style="flex:1; display:flex; flex-direction:column;">
            <div class="skeleton skeleton-text" style="width: 40%; height: 12px; margin-bottom: 8px;"></div>
            <div class="skeleton skeleton-text" style="width: 80%; height: 20px; margin-bottom: 12px;"></div>
            <div class="skeleton skeleton-text" style="width: 30%; height: 18px; margin-bottom: 16px;"></div>
            <div class="skeleton skeleton-btn" style="width: 100%; height: 40px; border-radius: var(--radius-pill); margin-top: auto;"></div>
          </div>
        </article>
      `;
    }
    grid.innerHTML = html;
  }

  async function cargarProductos() {
    if (window.PRODUCTOS && window.PRODUCTOS.length > 0) {
      productos = window.PRODUCTOS;
      return productos;
    }
    
    const cacheKey = `bellanova_productos_cache_${CONFIG.cacheVersion || 'v1'}`;
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key && key.startsWith('bellanova_productos_cache_') && key !== cacheKey) {
        sessionStorage.removeItem(key);
      }
    }

    const cachedData = sessionStorage.getItem(cacheKey);
    if (cachedData) {
      try {
        productos = JSON.parse(cachedData);
        return productos;
      } catch (e) {
        console.warn('Error parsing cached data', e);
      }
    }

    try {
      const response = await fetch(CONFIG.jsonPath);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      productos = await response.json();
      sessionStorage.setItem(cacheKey, JSON.stringify(productos));
      return productos;
    } catch (error) {
      console.error('Error cargando productos:', error);
      return null;
    }
  }

  // ─── Product Card Renderer ───
  function crearProductCard(producto, delay = 0) {
    const card = document.createElement('article');
    card.className = 'product-card';
    card.style.animationDelay = `${delay * 80}ms`;
    card.setAttribute('data-id', producto.id);
    card.setAttribute('role', 'button');
    card.setAttribute('tabindex', '0');
    card.setAttribute('aria-label', `${producto.nombre} — ${producto.marca}`);

    const precioAnterior = producto.precio_anterior
      ? `<span class="product-card__price-old">${formatPrecio(producto.precio_anterior)}</span>`
      : '';

    let discountBadgeHtml = '';
    if (producto.precio_anterior && producto.precio_anterior > producto.precio) {
      const discountPct = Math.round(((producto.precio_anterior - producto.precio) / producto.precio_anterior) * 100);
      if (discountPct >= 5) {
        discountBadgeHtml = `<span class="product-card__discount">-${discountPct}%</span>`;
      }
    }

    card.innerHTML = `
      <div class="product-card__image">
        <div class="product-card__badge-container">
          ${producto.badge ? `<div class="product-card__badge">${generarBadge(producto.badge)}</div>` : ''}
          ${discountBadgeHtml}
        </div>
        ${producto.stock === false ? '<div class="product-card__out-of-stock-overlay"><span>AGOTADO</span></div>' : ''}
        ${producto.imagen ? `<img src="${producto.imagen}" alt="${producto.nombre}" loading="lazy" ${producto.stock === false ? 'class="img-out-of-stock"' : ''}>` : `
        <div class="product-card__image-placeholder">
          <span class="placeholder-icon">${getCategoryIcon(producto.subcategoria, producto.categoria)}</span>
          <span class="placeholder-brand">${producto.marca}</span>
        </div>`}
        ${producto.stock !== false ? `
        <button class="product-card__quick-add" aria-label="Añadir al carrito" data-id="${producto.id}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="18" height="18">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
        </button>
        ` : ''}
      </div>
      <div class="product-card__info">
        <p class="product-card__brand">${producto.marca}</p>
        <h3 class="product-card__name">${producto.nombre}</h3>
        <div class="product-card__rating">
          <span class="stars">${generarEstrellas(producto.rating)}</span>
          <span>${producto.rating}</span>
          <span>(${producto.reviews_count.toLocaleString()})</span>
        </div>
        <div class="product-card__meta">
          <div>
            <span class="product-card__price">${formatPrecio(producto.precio)}</span>
            ${precioAnterior}
          </div>
          <span class="product-card__volume">${producto.volumen}</span>
        </div>
      </div>
    `;

    // Card click → navigate to PDP
    card.addEventListener('click', () => {
      window.location.href = `producto.html?id=${producto.id}`;
    });

    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        window.location.href = `producto.html?id=${producto.id}`;
      }
    });

    // Quick Add
    const quickAddBtn = card.querySelector('.product-card__quick-add');
    if (quickAddBtn) {
      quickAddBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        agregarAlCarrito(producto.id);
      });
      quickAddBtn.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.stopPropagation();
          agregarAlCarrito(producto.id);
        }
      });
    }

    return card;
  }

  // ─── Header Categories Slider ───
  function renderizarHeaderCategorias() {
    const slider = $('#headerCategoriesSlider');
    if (!slider) return;

    const subcatMap = new Map();
    productos.forEach(p => {
      const key = p.subcategoria;
      subcatMap.set(key, (subcatMap.get(key) || 0) + 1);
    });

    const sorted = [...subcatMap.entries()].sort((a, b) => {
      const orderA = CATEGORY_META[a[0]]?.order || 99;
      const orderB = CATEGORY_META[b[0]]?.order || 99;
      return orderA - orderB;
    });

    slider.innerHTML = '';
    sorted.forEach(([name, count]) => {
      if (CATEGORY_META[name] && CATEGORY_META[name].isTopCategory === false) return;

      const item = document.createElement('div');
      item.className = 'header-category-item';
      item.innerHTML = `
        ${getCategorySvg(name, true)}
        <span>${name}</span>
      `;
      item.addEventListener('click', () => {
        if (!document.getElementById('catalogo')) {
          window.location.href = `catalogo.html?cat=${encodeURIComponent(name)}`;
          return;
        }
        filtrosCategorias = [name];
        $$('#sidebarFiltersContainer input[type="checkbox"]').forEach(cb => {
          cb.checked = (cb.value === name);
        });
        actualizarContextoFiltrosAvanzados();
        filtrarProductos();
        actualizarUrlParameters();
        document.getElementById('catalogo')?.scrollIntoView({ behavior: 'smooth' });
      });
      slider.appendChild(item);
    });
  }

  // ─── Categories Renderer ───
  function renderizarCategorias() {
    const grid = $('#categoriesGrid');
    if (!grid) return;

    // Collect subcategories with counts
    const subcatMap = new Map();
    productos.forEach(p => {
      const key = p.subcategoria;
      subcatMap.set(key, (subcatMap.get(key) || 0) + 1);
    });

    // Sort by defined order
    const sorted = [...subcatMap.entries()].sort((a, b) => {
      const orderA = CATEGORY_META[a[0]]?.order || 99;
      const orderB = CATEGORY_META[b[0]]?.order || 99;
      return orderA - orderB;
    });

    grid.innerHTML = '';
    sorted.forEach(([name, count]) => {
      // Filtrar categorías que no son top para no saturar el home
      if (CATEGORY_META[name] && CATEGORY_META[name].isTopCategory === false) return;

      const card = document.createElement('div');
      card.className = 'category-card';
      card.setAttribute('role', 'button');
      card.setAttribute('tabindex', '0');
      card.innerHTML = `
        <span class="category-card__icon">${getCategorySvg(name, false)}</span>
        <span class="category-card__name">${name}</span>
        <span class="category-card__count">${count}</span>
      `;
      card.addEventListener('click', () => {
        if (!document.getElementById('catalogo')) {
          window.location.href = `catalogo.html?cat=${encodeURIComponent(name)}`;
          return;
        }
        filtrosCategorias = [name];
        $$('#sidebarFiltersContainer input[type="checkbox"]').forEach(cb => {
          cb.checked = (cb.value === name);
        });
        actualizarContextoFiltrosAvanzados();
        filtrarProductos();
        actualizarUrlParameters();
        document.getElementById('catalogo')?.scrollIntoView({ behavior: 'smooth' });
      });
      grid.appendChild(card);
    });

    // Slider logic
    const prevBtn = $('#catSliderPrev');
    const nextBtn = $('#catSliderNext');
    if (prevBtn && nextBtn) {
      prevBtn.addEventListener('click', () => {
        grid.scrollBy({ left: -grid.clientWidth / 2, behavior: 'smooth' });
      });
      nextBtn.addEventListener('click', () => {
        grid.scrollBy({ left: grid.clientWidth / 2, behavior: 'smooth' });
      });
    }
  }
  // ─── Brands Renderer ───
  function renderizarMarcas() {
    const scroll = $('#brandsScroll');
    if (!scroll) return;

    const brandMap = new Map();
    productos.forEach(p => {
      if (!brandMap.has(p.marca)) {
        brandMap.set(p.marca, p.pais_origen);
      }
    });

    scroll.innerHTML = '';
    brandMap.forEach((origen, marca) => {
      const chip = document.createElement('button');
      chip.className = 'brand-chip';
      chip.innerHTML = `
        <span>${marca}</span>
        <span class="brand-chip__origin">${origen}</span>
      `;
      chip.addEventListener('click', () => {
        if (!document.getElementById('catalogo')) {
          window.location.href = `catalogo.html?brand=${encodeURIComponent(marca)}`;
          return;
        }
        filtrosMarcas = [marca];
        $$('#sidebarFiltersContainer input[type="checkbox"]').forEach(cb => {
          cb.checked = (cb.value === marca);
        });
        filtrarProductos();
        actualizarUrlParameters();
        document.getElementById('catalogo')?.scrollIntoView({ behavior: 'smooth' });
      });
      scroll.appendChild(chip);
    });
  }

  // ─── Advanced Filters Logic Helpers ───
  function obtenerObjetivosSuplemento(producto) {
    if (producto.categoria !== 'Suplementos') return [];
    
    const objetivos = [];
    const texto = [
      producto.nombre,
      producto.subcategoria,
      producto.descripcion_editorial,
      ...(producto.beneficios || []),
      ...(producto.ingredientes_activos || [])
    ].join(' ').toLowerCase();

    if (/inmune|inmunidad|defensa|vitamina c|complex|resfrío|infección/i.test(texto)) {
      objetivos.push('Inmunidad y Defensas');
    }
    if (/articular|articulación|huesos|coyuntura|articulaciones/i.test(texto)) {
      objetivos.push('Salud Articular');
    }
    if (/energía|energia|vitalidad|rendimiento|efervescente/i.test(texto)) {
      objetivos.push('Energía y Vitalidad');
    }
    if (/cardiovascular|corazón|corazon|cardio|colesterol|triglicéridos/i.test(texto)) {
      objetivos.push('Salud Cardiovascular');
    }
    if (/cabello|uñas|uña|piel|colágeno|colageno|biotina|elasticidad/i.test(texto)) {
      objetivos.push('Piel, Cabello y Uñas');
    }
    if (/cerebral|cerebro|cognitivo|concentración|memoria|ansiedad/i.test(texto)) {
      objetivos.push('Salud Cerebral');
    }

    return objetivos;
  }

  function obtenerTipoDeCategoria(catName) {
    if (catName === 'all') return 'all';
    const prod = productos.find(p => p.categoria === catName || p.subcategoria === catName);
    return prod ? prod.categoria : 'all';
  }

  // ─── Render Sidebar Filters with Checkboxes ───
  function renderizarSidebarFiltros() {
    const container = $('#sidebarFiltersContainer');
    if (!container) return;

    container.innerHTML = '';

    // Chevron SVG Template
    const chevronSvg = `
      <svg class="filter-group__chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="6 9 12 15 18 9"></polyline>
      </svg>
    `;

    // 1. Group: Categorías (Jerárquicas)
    const categoriasObj = {};
    productos.forEach(p => {
      if (!categoriasObj[p.categoria]) categoriasObj[p.categoria] = new Set();
      if (p.subcategoria) categoriasObj[p.categoria].add(p.subcategoria);
    });

    const catGroup = document.createElement('div');
    catGroup.className = 'filter-group' + (filterAccordionCollapsed.groupCategorias ? ' filter-group--collapsed' : '');
    catGroup.id = 'groupCategorias';

    let optionsHtml = '';
    Object.keys(categoriasObj).sort().forEach(catName => {
      optionsHtml += `<div class="filter-group__subcategory-header">${catName}</div>`;
      const subcats = [...categoriasObj[catName]].sort();
      subcats.forEach(subcat => {
        const count = productos.filter(p => p.subcategoria === subcat).length;
        const isChecked = filtrosCategorias.includes(subcat) ? 'checked' : '';
        optionsHtml += `
          <label class="checkbox-label" data-value="${subcat}">
            <input type="checkbox" value="${subcat}" data-type="category" ${isChecked}>
            <span class="custom-checkbox"></span>
            <span class="filter-name">${subcat}</span>
            <span class="filter-count">(${count})</span>
          </label>
        `;
      });
    });

    catGroup.innerHTML = `
      <button class="filter-group__toggle-btn" aria-expanded="${!filterAccordionCollapsed.groupCategorias}" data-group="groupCategorias">
        <span class="filter-group__title">Categorías</span>
        ${chevronSvg}
      </button>
      <div class="filter-group__options-wrapper">
        <div class="filter-group__options-inner">
          <div class="filter-group__options">
            ${optionsHtml}
          </div>
        </div>
      </div>
    `;
    container.appendChild(catGroup);

    // 2. Group: Marcas
    const marcas = [...new Set(productos.map(p => p.marca))].filter(Boolean).sort();
    const brandGroup = document.createElement('div');
    brandGroup.className = 'filter-group' + (filterAccordionCollapsed.groupMarcas ? ' filter-group--collapsed' : '');
    brandGroup.id = 'groupMarcas';
    brandGroup.innerHTML = `
      <button class="filter-group__toggle-btn" aria-expanded="${!filterAccordionCollapsed.groupMarcas}" data-group="groupMarcas">
        <span class="filter-group__title">Marcas</span>
        ${chevronSvg}
      </button>
      <div class="filter-group__options-wrapper">
        <div class="filter-group__options-inner">
          <div class="filter-group__options">
            ${marcas.map(marca => {
              const count = productos.filter(p => p.marca === marca).length;
              const isChecked = filtrosMarcas.includes(marca) ? 'checked' : '';
              return `
                <label class="checkbox-label" data-value="${marca}">
                  <input type="checkbox" value="${marca}" data-type="brand" ${isChecked}>
                  <span class="custom-checkbox"></span>
                  <span class="filter-name">${marca}</span>
                  <span class="filter-count">(${count})</span>
                </label>
              `;
            }).join('')}
          </div>
        </div>
      </div>
    `;
    container.appendChild(brandGroup);

    // 3. Group: Tipo de Piel (Skincare)
    const skinTypesSet = new Set();
    productos.forEach(p => {
      if (p.categoria === 'Skincare' && Array.isArray(p.tipo_piel)) {
        p.tipo_piel.forEach(t => {
          if (t && t !== 'Todos') skinTypesSet.add(t);
        });
      }
    });
    const skinTypes = [...skinTypesSet].sort();
    const skinGroup = document.createElement('div');
    skinGroup.className = 'filter-group' + (filterAccordionCollapsed.groupSkinType ? ' filter-group--collapsed' : '');
    skinGroup.id = 'groupSkinType';
    skinGroup.innerHTML = `
      <button class="filter-group__toggle-btn" aria-expanded="${!filterAccordionCollapsed.groupSkinType}" data-group="groupSkinType">
        <span class="filter-group__title">Tipo de Piel</span>
        ${chevronSvg}
      </button>
      <div class="filter-group__options-wrapper">
        <div class="filter-group__options-inner">
          <div class="filter-group__options">
            ${skinTypes.map(type => {
              const count = productos.filter(p => p.categoria === 'Skincare' && Array.isArray(p.tipo_piel) && (p.tipo_piel.includes(type) || p.tipo_piel.includes('Todos'))).length;
              const isChecked = filtrosTiposPiel.includes(type) ? 'checked' : '';
              return `
                <label class="checkbox-label" data-value="${type}">
                  <input type="checkbox" value="${type}" data-type="skin" ${isChecked}>
                  <span class="custom-checkbox"></span>
                  <span class="filter-name">${type}</span>
                  <span class="filter-count">(${count})</span>
                </label>
              `;
            }).join('')}
          </div>
        </div>
      </div>
    `;
    container.appendChild(skinGroup);

    // 4. Group: Objetivo de Salud (Suplementos)
    const healthGoalsSet = new Set();
    productos.forEach(p => {
      if (p.categoria === 'Suplementos') {
        const goals = obtenerObjetivosSuplemento(p);
        goals.forEach(g => healthGoalsSet.add(g));
      }
    });
    const healthGoals = [...healthGoalsSet].sort();
    const goalGroup = document.createElement('div');
    goalGroup.className = 'filter-group' + (filterAccordionCollapsed.groupHealthGoal ? ' filter-group--collapsed' : '');
    goalGroup.id = 'groupHealthGoal';
    goalGroup.innerHTML = `
      <button class="filter-group__toggle-btn" aria-expanded="${!filterAccordionCollapsed.groupHealthGoal}" data-group="groupHealthGoal">
        <span class="filter-group__title">Objetivo de Salud</span>
        ${chevronSvg}
      </button>
      <div class="filter-group__options-wrapper">
        <div class="filter-group__options-inner">
          <div class="filter-group__options">
            ${healthGoals.map(goal => {
              const count = productos.filter(p => p.categoria === 'Suplementos' && obtenerObjetivosSuplemento(p).includes(goal)).length;
              const isChecked = filtrosObjetivosSalud.includes(goal) ? 'checked' : '';
              return `
                <label class="checkbox-label" data-value="${goal}">
                  <input type="checkbox" value="${goal}" data-type="goal" ${isChecked}>
                  <span class="custom-checkbox"></span>
                  <span class="filter-name">${goal}</span>
                  <span class="filter-count">(${count})</span>
                </label>
              `;
            }).join('')}
          </div>
        </div>
      </div>
    `;
    container.appendChild(goalGroup);

    // Bind accordion toggles
    $$('.filter-group__toggle-btn', container).forEach(btn => {
      btn.addEventListener('click', () => {
        const groupEl = btn.closest('.filter-group');
        const groupKey = btn.dataset.group;
        const isCollapsed = groupEl.classList.contains('filter-group--collapsed');

        if (isCollapsed) {
          groupEl.classList.remove('filter-group--collapsed');
          btn.setAttribute('aria-expanded', 'true');
          filterAccordionCollapsed[groupKey] = false;
        } else {
          groupEl.classList.add('filter-group--collapsed');
          btn.setAttribute('aria-expanded', 'false');
          filterAccordionCollapsed[groupKey] = true;
        }
      });
    });

    // Bind event listeners to all checkboxes
    $$('input[type="checkbox"]', container).forEach(checkbox => {
      checkbox.addEventListener('change', (e) => {
        const val = e.target.value;
        const type = e.target.dataset.type;
        const checked = e.target.checked;

        if (type === 'category') {
          if (checked) {
            if (!filtrosCategorias.includes(val)) filtrosCategorias.push(val);
          } else {
            filtrosCategorias = filtrosCategorias.filter(x => x !== val);
          }
        } else if (type === 'brand') {
          if (checked) {
            if (!filtrosMarcas.includes(val)) filtrosMarcas.push(val);
          } else {
            filtrosMarcas = filtrosMarcas.filter(x => x !== val);
          }
        } else if (type === 'skin') {
          if (checked) {
            if (!filtrosTiposPiel.includes(val)) filtrosTiposPiel.push(val);
          } else {
            filtrosTiposPiel = filtrosTiposPiel.filter(x => x !== val);
          }
        } else if (type === 'goal') {
          if (checked) {
            if (!filtrosObjetivosSalud.includes(val)) filtrosObjetivosSalud.push(val);
          } else {
            filtrosObjetivosSalud = filtrosObjetivosSalud.filter(x => x !== val);
          }
        }

        actualizarContextoFiltrosAvanzados();
        filtrarProductos();
        actualizarUrlParameters();
      });
    });

    actualizarContextoFiltrosAvanzados();
  }

  // ─── Realtime URL Parameters deep linking ───
  function actualizarUrlParameters() {
    const params = new URLSearchParams();
    if (filtrosCategorias.length > 0) params.set('cat', filtrosCategorias.join(','));
    if (filtrosMarcas.length > 0) params.set('brand', filtrosMarcas.join(','));
    if (filtrosTiposPiel.length > 0) params.set('skin', filtrosTiposPiel.join(','));
    if (filtrosObjetivosSalud.length > 0) params.set('goal', filtrosObjetivosSalud.join(','));
    if (busqueda) params.set('search', busqueda);
    
    const newRelativePathQuery = window.location.pathname + (params.toString() ? '?' + params.toString() : '');
    window.history.replaceState(null, '', newRelativePathQuery);
  }

  // ─── Advanced Filters Context Control ───
  function actualizarContextoFiltrosAvanzados() {
    const colSkin = $('#groupSkinType');
    const colGoal = $('#groupHealthGoal');
    if (!colSkin || !colGoal) return;

    // Determine types of active categories
    const selectedTypes = new Set();
    filtrosCategorias.forEach(cat => {
      const type = obtenerTipoDeCategoria(cat);
      if (type !== 'all') selectedTypes.add(type);
    });

    const hasSkincare = selectedTypes.has('Skincare');
    const hasSuplementos = selectedTypes.has('Suplementos');

    if (filtrosCategorias.length > 0) {
      if (hasSkincare && !hasSuplementos) {
        // Exclusively Skincare category active
        colSkin.classList.remove('filter-group--faded');
        colGoal.classList.add('filter-group--faded');
        
        // Clear active goals state
        if (filtrosObjetivosSalud.length > 0) {
          filtrosObjetivosSalud = [];
          $$('#groupHealthGoal input[type="checkbox"]').forEach(cb => cb.checked = false);
        }
      } else if (hasSuplementos && !hasSkincare) {
        // Exclusively Suplementos category active
        colSkin.classList.add('filter-group--faded');
        colGoal.classList.remove('filter-group--faded');
        
        // Clear active skin types state
        if (filtrosTiposPiel.length > 0) {
          filtrosTiposPiel = [];
          $$('#groupSkinType input[type="checkbox"]').forEach(cb => cb.checked = false);
        }
      } else {
        // Mixed or none - show both
        colSkin.classList.remove('filter-group--faded');
        colGoal.classList.remove('filter-group--faded');
      }
    } else {
      // No categories selected - show both
      colSkin.classList.remove('filter-group--faded');
      colGoal.classList.remove('filter-group--faded');
    }
  }

  // ─── Search ───
  function buscarProductos(query) {
    busqueda = query.toLowerCase().trim();
    filtrarProductos();
    actualizarUrlParameters();
  }

  // ─── Filter & Render ───
  function filtrarProductos() {
    let resultado = [...productos];

    // Global offers filter
    if (soloOfertas) {
      resultado = resultado.filter(p => p.precio_anterior && p.precio_anterior > p.precio);
    }

    // Categories filter (multi-select OR)
    if (filtrosCategorias.length > 0) {
      resultado = resultado.filter(p =>
        filtrosCategorias.includes(p.categoria) || filtrosCategorias.includes(p.subcategoria)
      );
    }

    // Brands filter (multi-select OR)
    if (filtrosMarcas.length > 0) {
      resultado = resultado.filter(p => filtrosMarcas.includes(p.marca));
    }

    // Skin Types filter (multi-select OR / Array intersection)
    if (filtrosTiposPiel.length > 0) {
      resultado = resultado.filter(p => {
        if (p.categoria === 'Skincare') {
          return Array.isArray(p.tipo_piel) && (
            p.tipo_piel.includes('Todos') || 
            p.tipo_piel.some(t => filtrosTiposPiel.includes(t))
          );
        }
        return true;
      });
    }

    // Health Goals filter (multi-select OR / Array intersection)
    if (filtrosObjetivosSalud.length > 0) {
      resultado = resultado.filter(p => {
        if (p.categoria === 'Suplementos') {
          const goals = obtenerObjetivosSuplemento(p);
          return goals.some(g => filtrosObjetivosSalud.includes(g));
        }
        return true;
      });
    }

    // Search query
    if (busqueda) {
      resultado = resultado.filter(p => {
        const searchable = [
          p.nombre,
          p.marca,
          p.categoria,
          p.subcategoria,
          p.descripcion_editorial,
          ...(p.ingredientes_activos || []),
          ...(p.beneficios || []),
        ].join(' ').toLowerCase();
        return searchable.includes(busqueda);
      });
    }

    // Sort so out-of-stock items go to the bottom
    resultado.sort((a, b) => {
      const stockA = a.stock !== false ? 1 : 0;
      const stockB = b.stock !== false ? 1 : 0;
      return stockB - stockA;
    });

    // Update global state and reset pagination
    productosFiltradosGlobal = resultado;
    currentPage = 1;

    renderizarChipsFiltros();
    actualizarConteosFiltros(resultado);
    renderizarProductosPaginados(true);

    // Update count element
    const countEl = $('#productsCount');
    if (countEl) {
      countEl.innerHTML = `Mostrando <span>${resultado.length}</span> de <span>${productos.length}</span> productos`;
    }
  }

  // ─── Reactive Filter Counts ───
  function actualizarConteosFiltros(resultado) {
    const checkboxes = $$('#sidebarFiltersContainer input[type="checkbox"]');
    
    checkboxes.forEach(cb => {
      const valor = cb.value;
      const tipo = cb.getAttribute('data-type');
      let count = 0;

      if (tipo === 'category') {
        count = resultado.filter(p => p.subcategoria === valor).length;
      } else if (tipo === 'brand') {
        count = resultado.filter(p => p.marca === valor).length;
      } else if (tipo === 'skin') {
        count = resultado.filter(p => p.categoria === 'Skincare' && Array.isArray(p.tipo_piel) && (p.tipo_piel.includes('Todos') || p.tipo_piel.includes(valor))).length;
      } else if (tipo === 'goal') {
        count = resultado.filter(p => p.categoria === 'Suplementos' && obtenerObjetivosSuplemento(p).includes(valor)).length;
      }

      const label = cb.closest('.checkbox-label');
      if (label) {
        const countSpan = label.querySelector('.filter-count');
        if (countSpan) countSpan.textContent = `(${count})`;

        if (count === 0 && !cb.checked) {
          label.classList.add('filter-disabled');
        } else {
          label.classList.remove('filter-disabled');
        }
      }
    });
  }

  // ─── Render Active Filter Chips ───
  function renderizarChipsFiltros() {
    const container = $('#activeFiltersChips');
    if (!container) return;

    container.innerHTML = '';
    
    const crearChip = (valor, tipo) => {
      const chip = document.createElement('div');
      chip.className = 'active-filter-chip';
      chip.innerHTML = `
        ${valor}
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      `;
      chip.addEventListener('click', () => {
        if (tipo === 'categoria') filtrosCategorias = filtrosCategorias.filter(v => v !== valor);
        if (tipo === 'marca') filtrosMarcas = filtrosMarcas.filter(v => v !== valor);
        if (tipo === 'piel') filtrosTiposPiel = filtrosTiposPiel.filter(v => v !== valor);
        if (tipo === 'salud') filtrosObjetivosSalud = filtrosObjetivosSalud.filter(v => v !== valor);
        if (tipo === 'ofertas') {
          soloOfertas = false;
          const btnOfertas = $('#btnOfertas');
          if (btnOfertas) {
            btnOfertas.classList.remove('btn--primary');
            btnOfertas.classList.add('btn--outline');
          }
        }
        
        $$('#sidebarFiltersContainer input[type="checkbox"]').forEach(cb => {
          if (cb.value === valor) cb.checked = false;
        });
        
        actualizarContextoFiltrosAvanzados();
        filtrarProductos();
        actualizarUrlParameters();
      });
      container.appendChild(chip);
    };

    filtrosCategorias.forEach(v => crearChip(v, 'categoria'));
    filtrosMarcas.forEach(v => crearChip(v, 'marca'));
    filtrosTiposPiel.forEach(v => crearChip(v, 'piel'));
    filtrosObjetivosSalud.forEach(v => crearChip(v, 'salud'));
    if (soloOfertas) crearChip('Ofertas', 'ofertas');

    // Toggle overlay transparency if there are active filters
    const hasFilters = filtrosCategorias.length > 0 || filtrosMarcas.length > 0 || filtrosTiposPiel.length > 0 || filtrosObjetivosSalud.length > 0 || soloOfertas;
    const overlay = $('#sidebarOverlay');
    if (overlay) {
      overlay.classList.toggle('transparent', hasFilters);
    }
  }

  // ─── Render Products to Grid (Infinite Scroll) ───
  function renderizarProductosPaginados(reset = false) {
    const grid = $('#catalogGrid');
    if (!grid) return;

    if (reset) {
      grid.innerHTML = '';
      if (observerInfiniteScroll) {
        observerInfiniteScroll.disconnect();
      }
    }

    if (productosFiltradosGlobal.length === 0) {
      grid.innerHTML = `
        <div class="no-results">
          <div class="no-results__icon">💎</div>
          <h3 class="no-results__title">No encontramos esta selección</h3>
          <p class="no-results__text">¿Buscas un producto específico? Nuestro Concierge VIP puede importarlo para ti.</p>
          <a href="https://wa.me/${CONFIG.whatsappNumber}?text=Hola%20Concierge%20VIP,%20estoy%20buscando%20un%20producto%20espec%C3%ADfico" target="_blank" rel="noopener" class="btn btn--outline" style="margin-top: var(--space-md);">Contactar Concierge</a>
        </div>
      `;
      return;
    }

    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const itemsToRender = productosFiltradosGlobal.slice(startIndex, endIndex);

    // Remove load more container if exists
    const existingTrigger = $('#loadMoreContainer', grid);
    if (existingTrigger) {
      grid.removeChild(existingTrigger);
    }

    itemsToRender.forEach((producto, i) => {
      grid.appendChild(crearProductCard(producto, i % ITEMS_PER_PAGE));
    });

    // Add intersection observer trigger if there are more items
    if (endIndex < productosFiltradosGlobal.length) {
      const trigger = document.createElement('div');
      trigger.id = 'loadMoreContainer';
      trigger.className = 'load-more-container';
      trigger.innerHTML = `<button class="btn btn--outline" id="loadMoreBtn" style="min-width: 200px;">Cargar más</button>`;
      grid.appendChild(trigger);

      $('#loadMoreBtn', grid).addEventListener('click', () => {
        // Optional: show a quick loading state
        const btn = $('#loadMoreBtn', grid);
        btn.innerHTML = '<div class="loader-spinner" style="width:20px;height:20px;border-width:2px;margin:auto;"></div>';
        setTimeout(() => {
          currentPage++;
          renderizarProductosPaginados(false);
        }, 400); // Simulate network load for premium feel
      });
    }
  }

  // ─── Render Products to Grid ───
  function renderizarProductos(lista, selector) {
    const grid = $(selector);
    if (!grid) return;

    grid.innerHTML = '';

    if (lista.length === 0) {
      grid.innerHTML = `
        <div class="no-results">
          <div class="no-results__icon">💎</div>
          <h3 class="no-results__title">No encontramos esta selección</h3>
          <p class="no-results__text">¿Buscas un producto específico? Nuestro Concierge VIP puede importarlo para ti.</p>
          <a href="https://wa.me/${CONFIG.whatsappNumber}?text=Hola%20Concierge%20VIP,%20estoy%20buscando%20un%20producto%20espec%C3%ADfico" target="_blank" rel="noopener" class="btn btn--outline" style="margin-top: var(--space-md);">Contactar Concierge</a>
        </div>
      `;
      return;
    }

    lista.forEach((producto, i) => {
      grid.appendChild(crearProductCard(producto, i));
    });
  }

  // ─── Featured Products ───
  function renderizarDestacados() {
    const featured = productos
      .filter(p => ['bestseller', 'viral'].includes(p.badge))
      .slice(0, 4);

    renderizarProductos(featured, '#featuredGrid');
  }

  // ─── Ofertas de la Semana ───
  function renderizarOfertas() {
    const ofertas = productos
      .filter(p => p.precio_anterior && p.precio_anterior > p.precio);

    const ofertasSection = $('#ofertas');
    if (ofertas.length === 0 && ofertasSection) {
      const grid = $('#ofertasGrid');
      if (grid) {
        grid.innerHTML = `
          <div class="no-results" style="grid-column: 1 / -1; padding: var(--space-3xl) 1rem;">
            <div class="no-results__icon">✨</div>
            <h3 class="no-results__title">Nuevas Ofertas Próximamente</h3>
            <p class="no-results__text">Estamos preparando promociones increíbles para ti.</p>
          </div>
        `;
      }
      return;
    }

    renderizarProductos(ofertas, '#ofertasGrid');
  }


  // ─── Product Detail Page (PDP) ───
  async function abrirProducto() {
    const main = $('#pdpMain');
    const notFoundHtml = `
      <div class="container" style="text-align:center; padding: 6rem 1rem;">
        <h1 style="font-family:var(--font-heading); font-size:2rem; margin-bottom:1rem;">Producto no encontrado</h1>
        <p style="color:var(--text-secondary); margin-bottom:2rem;">El producto que buscas no existe o ha sido removido.</p>
        <a href="index.html" class="btn btn--primary">Volver al catálogo</a>
      </div>
    `;

    const params = new URLSearchParams(window.location.search);
    const id = parseInt(params.get('id'));
    
    if (!id || isNaN(id)) {
      if (main) main.innerHTML = notFoundHtml;
      return;
    }

    if (productos.length === 0) {
      await cargarProductos();
    }

    const producto = productos.find(p => p.id === id);
    if (!producto) {
      if (main) main.innerHTML = notFoundHtml;
      return;
    }

    // Update page metadata (SEO & Open Graph)
    const pageTitle = `${producto.nombre} — ${producto.marca} | BellaNova VIP`;
    document.title = pageTitle;
    
    const setMetaContent = (selector, content) => {
      const el = document.querySelector(selector);
      if (el && content) el.setAttribute('content', content);
    };

    setMetaContent('meta[name="description"]', producto.descripcion_editorial.slice(0, 160));
    setMetaContent('meta[property="og:title"]', pageTitle);
    setMetaContent('meta[property="og:description"]', producto.descripcion_editorial.slice(0, 200));
    
    // The origin might be empty when running locally from file://
    const origin = window.location.origin !== 'null' ? window.location.origin : 'https://bellanovavip.bo';
    const imageUrl = origin + '/' + producto.imagen;
    setMetaContent('meta[property="og:image"]', imageUrl);
    
    // Add Structured Data (JSON-LD) for Google Rich Snippets
    let existingSchema = document.querySelector('#product-schema');
    if (existingSchema) existingSchema.remove();
    
    const structuredData = {
      "@context": "https://schema.org/",
      "@type": "Product",
      "name": producto.nombre,
      "image": imageUrl,
      "description": producto.descripcion_editorial,
      "brand": {
        "@type": "Brand",
        "name": producto.marca
      },
      "sku": producto.id.toString(),
      "offers": {
        "@type": "Offer",
        "url": window.location.href,
        "priceCurrency": "BOB",
        "price": producto.precio,
        "availability": producto.stock !== false ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
        "itemCondition": "https://schema.org/NewCondition"
      }
    };
    
    if (producto.rating) {
      structuredData.aggregateRating = {
        "@type": "AggregateRating",
        "ratingValue": producto.rating,
        "reviewCount": producto.reviews_count || 1
      };
    }
    
    const scriptLd = document.createElement('script');
    scriptLd.type = 'application/ld+json';
    scriptLd.id = 'product-schema';
    scriptLd.textContent = JSON.stringify(structuredData);
    document.head.appendChild(scriptLd);

    // Breadcrumb
    const breadcrumbCurrent = $('#pdpBreadcrumbCurrent') || $('#breadcrumbName');
    if (breadcrumbCurrent) breadcrumbCurrent.textContent = producto.nombre;

    // Gallery
    const gallery = $('#pdpGallery');
    if (gallery) {
      const images = [producto.imagen, ...(producto.imagenes_secundarias || [])].filter(Boolean);
      
      if (images.length > 1) {
        gallery.innerHTML = `
          <div class="pdp__slider">
            <div class="pdp__slider-track" id="sliderTrack">
              ${images.map(img => `<img src="${img}" alt="${producto.nombre}" loading="lazy">`).join('')}
            </div>
            <div class="pdp__slider-nav">
              <button class="pdp__slider-prev" id="sliderPrev" aria-label="Anterior">❮</button>
              <button class="pdp__slider-next" id="sliderNext" aria-label="Siguiente">❯</button>
            </div>
            <div class="pdp__slider-dots" id="sliderDots">
              ${images.map((_, idx) => `<button class="pdp__slider-dot ${idx === 0 ? 'active' : ''}" data-idx="${idx}" aria-label="Ir a imagen ${idx + 1}"></button>`).join('')}
            </div>
          </div>
        `;
        
        let currentSlide = 0;
        const track = $('#sliderTrack');
        const dots = $$('.pdp__slider-dot', gallery);
        
        const updateSlider = () => {
          track.style.transform = `translateX(-${currentSlide * 100}%)`;
          dots.forEach((dot, idx) => dot.classList.toggle('active', idx === currentSlide));
        };
        
        $('#sliderPrev')?.addEventListener('click', () => {
          currentSlide = (currentSlide > 0) ? currentSlide - 1 : images.length - 1;
          updateSlider();
        });
        
        $('#sliderNext')?.addEventListener('click', () => {
          currentSlide = (currentSlide < images.length - 1) ? currentSlide + 1 : 0;
          updateSlider();
        });
        
        dots.forEach(dot => {
          dot.addEventListener('click', (e) => {
            currentSlide = parseInt(e.target.dataset.idx);
            updateSlider();
          });
        });
        
      } else if (images.length === 1) {
        gallery.innerHTML = `<img src="${images[0]}" alt="${producto.nombre}">`;
      } else {
        gallery.innerHTML = `
          <div class="pdp__gallery-placeholder">
            <span class="placeholder-icon">${getCategoryIcon(producto.subcategoria, producto.categoria)}</span>
            <span class="placeholder-brand">${producto.marca}</span>
          </div>
        `;
      }
    }

    // Product Info & Details
    const info = $('#pdpInfo');
    const details = $('#pdpDetails');
    if (info) {
      const precioAnterior = producto.precio_anterior
        ? `<span class="pdp__price-old">${formatPrecio(producto.precio_anterior)}</span>`
        : '';

      let discountBadgeHtml = '';
      if (producto.precio_anterior && producto.precio_anterior > producto.precio) {
        const discountPct = Math.round(((producto.precio_anterior - producto.precio) / producto.precio_anterior) * 100);
        if (discountPct >= 5) {
          discountBadgeHtml = `<span class="pdp__discount-badge">AHORRA ${discountPct}%</span>`;
        }
      }

      info.innerHTML = `
        ${producto.badge ? `<div class="pdp__badge-row">${generarBadge(producto.badge)}</div>` : ''}
        <p class="pdp__brand">
          ${producto.marca}
          <span class="pdp__origin">· ${producto.pais_origen}</span>
        </p>
        <h1 class="pdp__name">${producto.nombre}</h1>
        <div class="pdp__price-row" style="display:flex; align-items:center; gap:var(--space-md); flex-wrap:wrap;">
          <span class="pdp__price">${formatPrecio(producto.precio)}</span>
          ${precioAnterior}
          ${discountBadgeHtml}
        </div>
        <p class="pdp__volume">${producto.volumen}</p>
        <div class="pdp__rating">
          <span class="stars">${generarEstrellas(producto.rating)}</span>
          <span>${producto.rating}</span>
          <span>· ${producto.reviews_count.toLocaleString()} reseñas</span>
        </div>

        <p class="pdp__description">${producto.descripcion_editorial}</p>

        <!-- WhatsApp CTA -->
        <div class="pdp__actions-row" style="margin-bottom: var(--space-xl);">
          ${producto.stock === false ? `
          <button class="btn btn--secondary btn--lg" style="width:100%; justify-content:center; cursor:not-allowed;" disabled>
            Producto Agotado
          </button>
          ` : `
          <button id="pdpAddToCartBtn" class="btn btn--primary btn--lg" style="width:100%; justify-content:center; gap:var(--space-sm);">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="9" cy="21" r="1"></circle>
              <circle cx="20" cy="21" r="1"></circle>
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
            </svg>
            Añadir al Carrito
          </button>
          `}
        </div>
      `;
    }

    if (details) {
      details.innerHTML = `
        <div class="pdp__details-single-col">
          <!-- Beneficios -->
          <div class="pdp__detail-section">
            <h2 class="pdp__detail-title">Beneficios</h2>
            <div class="pdp__benefits-list">
              ${producto.beneficios.map(b => `
                <div class="pdp__benefit-item">
                  <div class="pdp__benefit-icon">✓</div>
                  <span class="pdp__benefit-text">${b}</span>
                </div>
              `).join('')}
            </div>
          </div>

          <!-- Ingredientes Activos (Acordeón) -->
          <details class="pdp__accordion">
            <summary class="pdp__accordion-summary">
              <span>Ingredientes Activos</span>
              <svg class="pdp__accordion-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>
            </summary>
            <div class="pdp__accordion-content">
              <div class="pdp__ingredients-grid">
                ${producto.ingredientes_activos.map(i => `<span class="pdp__ingredient">${i}</span>`).join('')}
              </div>
            </div>
          </details>

          <!-- Detalles del producto (Acordeón) -->
          <details class="pdp__accordion">
            <summary class="pdp__accordion-summary">
              <span>Detalles del producto & Uso</span>
              <svg class="pdp__accordion-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>
            </summary>
            <div class="pdp__accordion-content">
              <div class="pdp__info-grid">
                <div class="pdp__info-card">
                  <p class="pdp__info-card-label">Textura</p>
                  <p class="pdp__info-card-value">${producto.textura}</p>
                </div>
                <div class="pdp__info-card">
                  <p class="pdp__info-card-label">Tipo de piel</p>
                  <p class="pdp__info-card-value">${producto.tipo_piel.join(', ')}</p>
                </div>
                <div class="pdp__info-card">
                  <p class="pdp__info-card-label">Modo de uso</p>
                  <p class="pdp__info-card-value">${producto.modo_uso}</p>
                </div>
                <div class="pdp__info-card">
                  <p class="pdp__info-card-label">País de origen</p>
                  <p class="pdp__info-card-value">${producto.pais_origen}</p>
                </div>
              </div>
            </div>
          </details>

          <!-- FAQ -->
          ${producto.faq && producto.faq.length > 0 ? `
            <div class="pdp__detail-section" style="margin-top: var(--space-2xl);">
              <h2 class="pdp__detail-title">Preguntas frecuentes</h2>
              <div class="pdp__faq-list">
                ${producto.faq.map((item, i) => `
                  <div class="pdp__faq-item" data-faq="${i}">
                    <button class="pdp__faq-question" aria-expanded="false">
                      <span>${item.pregunta}</span>
                      <svg class="pdp__faq-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="m6 9 6 6 6-6"/>
                      </svg>
                    </button>
                    <div class="pdp__faq-answer">
                      <p class="pdp__faq-answer-inner">${item.respuesta}</p>
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>
          ` : ''}
        </div>
      `;

      // FAQ accordion behavior
      $$('.pdp__faq-question', details).forEach(btn => {
        btn.addEventListener('click', () => {
          const item = btn.closest('.pdp__faq-item');
          const isActive = item.classList.contains('active');
          $$('.pdp__faq-item', details).forEach(el => el.classList.remove('active'));
          if (!isActive) item.classList.add('active');
          btn.setAttribute('aria-expanded', !isActive);
        });
      });

      const addToCartBtn = $('#pdpAddToCartBtn');
      if (addToCartBtn) {
        addToCartBtn.addEventListener('click', () => {
          agregarAlCarrito(producto.id);
        });
      }
    }

    // Sticky CTA
    const stickyName = $('#stickyName');
    const stickyPrice = $('#stickyPrice');
    if (stickyName) stickyName.textContent = producto.nombre;
    if (stickyPrice) stickyPrice.textContent = formatPrecio(producto.precio);

    const stickyBtn = $('#stickyWhatsAppBtn');
    if (stickyBtn) {
      stickyBtn.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="16" height="16" style="margin-right: var(--space-xs)">
          <circle cx="9" cy="21" r="1"></circle>
          <circle cx="20" cy="21" r="1"></circle>
          <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
        </svg>
        Añadir
      `;
      stickyBtn.removeAttribute('href');
      stickyBtn.removeAttribute('target');
      stickyBtn.addEventListener('click', () => {
        agregarAlCarrito(producto.id);
      });
    }

    // Related products
    renderizarRelacionados(producto);
  }

  // ─── Related Products ───
  function renderizarRelacionados(producto) {
    const grid = $('#similarGrid');
    if (!grid) return;

    const related = productos
      .filter(p =>
        p.id !== producto.id &&
        (p.subcategoria === producto.subcategoria || p.categoria === producto.categoria)
      )
      .slice(0, 4);

    grid.innerHTML = '';
    related.forEach((p, i) => {
      grid.appendChild(crearProductCard(p, i));
    });
  }

  // ─── Header Scroll Effect ───
  function initHeaderScroll() {
    const header = $('#header');
    if (!header) return;

    let lastScroll = 0;
    window.addEventListener('scroll', () => {
      const currentScroll = window.scrollY;
      header.classList.toggle('scrolled', currentScroll > 20);
      lastScroll = currentScroll;
    }, { passive: true });
  }

  // ─── Sticky CTA (PDP) ───
  function initStickyCta() {
    const sticky = $('#stickyCta');
    const gallery = $('#pdpGallery');
    if (!sticky || !gallery) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        sticky.classList.toggle('visible', !entry.isIntersecting);
      },
      { rootMargin: '-80px 0px 0px 0px' }
    );

    observer.observe(gallery);
  }

  // ─── Scroll Reveal ───
  function initRevealAnimations() {
    const reveals = $$('.reveal');
    if (reveals.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    );

    reveals.forEach(el => observer.observe(el));
  }

  // ─── Search Toggle (mobile header) ───
  function initSearchToggle() {
    const toggle = $('#mobileSearchToggle') || $('#searchToggle');
    if (!toggle) return;

    toggle.addEventListener('click', () => {
      const isCatalogPage = window.location.pathname.includes('catalogo.html');
      if (isCatalogPage) {
        const input = $('#searchInput');
        if (input) {
          input.focus();
          document.getElementById('catalogo')?.scrollIntoView({ behavior: 'smooth' });
        }
      } else {
        window.location.href = 'catalogo.html?search=focus';
      }
    });
  }

  // ─── Modal Events ───
  function initModalEvents() {
    const overlay = $('#quickModal');
    const closeBtn = $('#modalClose');
    if (!overlay) return;

    if (closeBtn) {
      closeBtn.addEventListener('click', cerrarModal);
    }

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) cerrarModal();
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') cerrarModal();
    });
  }

  // ─── Page Transitions ───
  function initPageTransitions() {
    document.querySelectorAll('a[href]').forEach(link => {
      link.addEventListener('click', (e) => {
        const href = link.getAttribute('href');
        const target = link.getAttribute('target');
        
        // Ignore external links, new tabs, JS actions
        if (!href || href.startsWith('http') || href.startsWith('//') || href.startsWith('javascript:') || target === '_blank') {
          return;
        }

        const [path, hash] = href.split('#');
        const isSamePage = !path || 
                           window.location.pathname.endsWith(path) || 
                           (path === 'index.html' && (window.location.pathname.endsWith('/') || window.location.pathname === ''));

        if (isSamePage && hash) {
          e.preventDefault();
          const targetEl = document.getElementById(hash);
          if (targetEl) {
            targetEl.scrollIntoView({ behavior: 'smooth' });
          }
          return;
        }

        // Prevent immediate navigation
        e.preventDefault();
        
        // Add fade out class
        document.body.classList.add('fade-out');
        
        // Navigate after transition completes
        setTimeout(() => {
          window.location.href = href;
        }, 300);
      });
    });
  }

  // ─── Announcement Bar Ticker ───
  function initAnnouncementBar() {
    const items = $$('.announcement-bar__item');
    if (items.length <= 1) return;
    
    let currentIndex = 0;
    
    // Set first item active
    items[0].classList.add('active');
    
    setInterval(() => {
      items[currentIndex].classList.remove('active');
      currentIndex = (currentIndex + 1) % items.length;
      items[currentIndex].classList.add('active');
    }, 4000);
  }

  // ─── Hero Slider Logic ───
  function initHeroSlider() {
    const slider = $('#heroSlider');
    if (!slider) return;
    
    const slides = $$('.hero-slide', slider);
    const dots = $$('.hero-slider__dot', slider);
    if (slides.length <= 1) return;
    
    let currentIndex = 0;
    let autoplayInterval;
    
    const showSlide = (index) => {
      slides[currentIndex].classList.remove('active');
      dots[currentIndex].classList.remove('active');
      
      currentIndex = index;
      
      slides[currentIndex].classList.add('active');
      dots[currentIndex].classList.add('active');
    };
    
    const nextSlide = () => {
      const nextIndex = (currentIndex + 1) % slides.length;
      showSlide(nextIndex);
    };
    
    const startAutoplay = () => {
      stopAutoplay();
      autoplayInterval = setInterval(nextSlide, 6000);
    };
    
    const stopAutoplay = () => {
      if (autoplayInterval) clearInterval(autoplayInterval);
    };
    
    dots.forEach((dot, idx) => {
      dot.addEventListener('click', () => {
        showSlide(idx);
        startAutoplay(); // Reset autoplay timer
      });
    });
    
    // Start autoplay
    startAutoplay();
    
    // Pause on hover
    slider.addEventListener('mouseenter', stopAutoplay);
    slider.addEventListener('mouseleave', startAutoplay);
  }



  // ─── Detect Page & Initialize ───
  async function init() {
    initAnnouncementBar();
    const isProductPage = window.location.pathname.includes('producto.html');
    const isCatalogPage = window.location.pathname.includes('catalogo.html');

    // Skeletons to improve perceived performance
    if (!isProductPage) {
      mostrarSkeletons('#featuredGrid', 4);
      if (isCatalogPage) {
        mostrarSkeletons('#catalogGrid', 8);
      }
    }

    // Load products
    const loaded = await cargarProductos();
    if (!loaded) {
      const errorHtml = `
        <div class="empty-state" style="grid-column: 1 / -1; padding: 4rem 1rem; text-align: center;">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="color:var(--text-light); margin-bottom: 1rem;">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          <h3 style="margin-bottom: 0.5rem;">Error al cargar productos</h3>
          <p style="color: var(--text-light); margin-bottom: 1.5rem;">Por favor, revisa tu conexión e inténtalo de nuevo.</p>
          <button class="btn btn--primary" onclick="location.reload()">Reintentar</button>
        </div>
      `;
      const ids = ['#catalogGrid', '#ofertasGrid', '#featuredGrid'];
      ids.forEach(id => {
        const grid = $(id);
        if (grid) grid.innerHTML = errorHtml;
      });
      return;
    }

    renderizarHeaderCategorias();

    // Initialize Bottom Navigation Bar
    initBottomNav();

    if (isProductPage) {
      // Product Detail Page
      await abrirProducto();
      initStickyCta();
    } else {
      // Home or Catalog Page
      renderizarCategorias();
      renderizarMarcas();
      
      if (isCatalogPage) {
        // Toggle Ofertas
        const btnOfertas = $('#btnOfertas');
        if (btnOfertas) {
          btnOfertas.addEventListener('click', () => {
            soloOfertas = !soloOfertas;
            if (soloOfertas) {
              btnOfertas.classList.add('btn--primary');
              btnOfertas.classList.remove('btn--outline');
            } else {
              btnOfertas.classList.remove('btn--primary');
              btnOfertas.classList.add('btn--outline');
            }
            filtrarProductos();
          });
        }

        // Toggle mobile sidebar
        const toggleBtn = $('#sidebarToggle');
        const sidebar = $('#catalogSidebar');
        const overlay = $('#sidebarOverlay');
        const closeBtn = $('#sidebarCloseBtn');

        const closeSidebar = () => {
          if (toggleBtn) toggleBtn.setAttribute('aria-expanded', 'false');
          if (sidebar) sidebar.classList.remove('active');
          if (overlay) overlay.classList.remove('active');
          document.body.classList.remove('modal-open');
        };

        if (toggleBtn && sidebar && overlay) {
          toggleBtn.addEventListener('click', () => {
            const isExpanded = toggleBtn.getAttribute('aria-expanded') === 'true';
            toggleBtn.setAttribute('aria-expanded', !isExpanded);
            sidebar.classList.toggle('active', !isExpanded);
            overlay.classList.toggle('active', !isExpanded);
            document.body.classList.toggle('modal-open', !isExpanded);
          });

          if (closeBtn) closeBtn.addEventListener('click', closeSidebar);
          overlay.addEventListener('click', closeSidebar);
        }

        // Reset all filters button
        const resetAllBtn = $('#btnResetAllFilters');
        if (resetAllBtn) {
          resetAllBtn.addEventListener('click', () => {
            filtrosCategorias = [];
            filtrosMarcas = [];
            filtrosTiposPiel = [];
            filtrosObjetivosSalud = [];
            
            // Uncheck all checkboxes in DOM
            $$('#sidebarFiltersContainer input[type="checkbox"]').forEach(cb => cb.checked = false);
            
            actualizarContextoFiltrosAvanzados();
            filtrarProductos();
            actualizarUrlParameters();
            
            closeSidebar();
          });
        }

        // Read URL params
        const params = new URLSearchParams(window.location.search);
        if (params.has('cat')) {
          filtrosCategorias = params.get('cat').split(',').map(s => s.trim()).filter(Boolean);
        }
        if (params.has('brand')) {
          filtrosMarcas = params.get('brand').split(',').map(s => s.trim()).filter(Boolean);
        }
        if (params.has('skin')) {
          filtrosTiposPiel = params.get('skin').split(',').map(s => s.trim()).filter(Boolean);
        }
        if (params.has('goal')) {
          filtrosObjetivosSalud = params.get('goal').split(',').map(s => s.trim()).filter(Boolean);
        }

        if (params.has('search')) {
          const searchQuery = params.get('search');
          if (searchQuery === 'focus') {
            setTimeout(() => {
              const input = $('#searchInput');
              if (input) {
                input.focus();
                document.getElementById('catalogo')?.scrollIntoView({ behavior: 'smooth' });
              }
            }, 300);
          } else {
            busqueda = searchQuery.trim().toLowerCase();
            const searchInput = $('#searchInput');
            const headerSearchInput = $('#headerSearchInput');
            if (searchInput) searchInput.value = searchQuery;
            if (headerSearchInput) headerSearchInput.value = searchQuery;
          }
        }

        // Render dynamic checkboxes in sidebar
        renderizarSidebarFiltros();
      } else {
        renderizarOfertas();
        renderizarDestacados();
        initHeroSlider();
      }

      filtrarProductos();

      // Search input (Catalog Sidebar)
      const searchInput = $('#searchInput');
      if (searchInput) {
        let debounceTimer;
        searchInput.addEventListener('input', (e) => {
          clearTimeout(debounceTimer);
          debounceTimer = setTimeout(() => {
            buscarProductos(e.target.value);
          }, 250);
        });

        // Auto-focus if requested via URL
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('focusSearch') === 'true') {
          setTimeout(() => {
            searchInput.focus();
            document.getElementById('catalogo')?.scrollIntoView({ behavior: 'smooth' });
          }, 500); // Wait for animations and layout
        }
      }
    }

    // Common initializations
    initHeaderScroll();
    initModalEvents();
    initSearchToggle();
    initRevealAnimations();
    initPageTransitions();

    // Handle hash links on load (after dynamic content renders)
    if (window.location.hash) {
      setTimeout(() => {
        const targetEl = document.querySelector(window.location.hash);
        if (targetEl) {
          targetEl.scrollIntoView({ behavior: 'smooth' });
        }
      }, 400); // Wait for grids and images to take up space
    }

    // Cart initialization
    renderizarCarrito();
    
    const checkoutBtn = $('#checkoutBtn');
    if (checkoutBtn) checkoutBtn.addEventListener('click', enviarPedidoWhatsApp);

    const cartCloseBtn = $('#cartCloseBtn');
    if (cartCloseBtn) cartCloseBtn.addEventListener('click', cerrarCarrito);
    
    const cartOverlay = $('#cartOverlay');
    if (cartOverlay) cartOverlay.addEventListener('click', cerrarCarrito);

    const headerCartToggle = $('#headerCartToggle');
    if (headerCartToggle) headerCartToggle.addEventListener('click', abrirCarrito);


  }

  // ─── Start ───
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
