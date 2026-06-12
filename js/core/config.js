export const CONFIG = {
  whatsappNumber: '59178804382',
  whatsappMessage: (nombre, marca, id, precio) =>
    `Hola BellaNova VIP 👋✨\n\nQuiero realizar un pedido del siguiente producto:\n\n🧴 ${nombre}\n🏷️ Marca: ${marca}\n🆔 Código: #${id}\n💰 Precio: ${precio} Bs\n\nQuedo atento(a) a la confirmación de disponibilidad y métodos de pago 😊`,
  currency: 'Bs.',
  jsonPath: 'data/productos.json',
  cacheVersion: 'v6',
};

export const CATEGORY_META = {
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
