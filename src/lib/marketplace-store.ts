import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { sileo } from 'sileo';

/* ═══════════════════════════════════════════════
   MARKETPLACE TYPES
   ═══════════════════════════════════════════════ */

export type TiendaCategoria = 'comida' | 'tienda' | 'farmacia' | 'regalos' | 'supermercado' | 'tecnologia' | 'deportes';

export interface Tienda {
  id: string;
  nombre: string;
  descripcion: string;
  categoria: TiendaCategoria;
  logoColor: string;
  logoIniciales: string;
  imagenUrl?: string | null;
  bannerUrl?: string | null;
  portadaColor: string;
  direccion: string;
  lat: number;
  lng: number;
  telefono: string;
  email: string;
  calificacion: number;
  totalPedidos: number;
  tiempoEstimado: string;
  costoEnvio: number;
  pedidoMinimo: number;
  horario: Record<string, { abre: string; cierra: string }>;
  zonaCobertura: string[];
  verificado: boolean;
  popular: boolean;
  estado: 'activo' | 'inactivo' | 'cerrado';
  badges: string[]; // "Nuevo", "Popular", "Promo"
}

export interface Producto {
  id: string;
  tiendaId: string;
  categoriaNombre: string;
  nombre: string;
  descripcion: string;
  precio: number;
  precioOriginal?: number;
  imagenColor: string;
  imagenUrl?: string | null;
  portadaUrl?: string | null;
  disponible: boolean;
  esNuevo: boolean;
  esPopular: boolean;
  stock: number | null;
  stockMinimo?: number;
  unidadMedida?: string;
}

export interface CartItem {
  id: string;
  productoId: string;
  tiendaId: string;
  // Nombre de la tienda dueña del item: lo usa ClientCarrito para el encabezado
  // de cada grupo (antes siempre caía en el literal 'Tienda LogiFast' porque
  // nadie asignaba este campo).
  tiendaNombre?: string;
  nombreProducto: string;
  precioUnitario: number;
  cantidad: number;
  imagenColor: string;
  notas: string;
}

export interface OrdenCompra {
  id: string;
  clienteId: string;
  tiendaId: string;
  tiendaNombre: string;
  tiendaLogo: string;
  tiendaColor: string;
  estado: 'recibido' | 'preparando' | 'listo' | 'en_camino' | 'entregado' | 'cancelado';
  /** "reparto" | "retiro": el retiro se recoge en el local con el PIN. */
  modoEntrega?: string;
  direccionEntrega: string;
  metodoPago: 'efectivo' | 'transferencia';
  items: { nombreProducto: string; cantidad: number; precioUnitario: number }[];
  subtotal: number;
  costoEnvio: number;
  descuento: number;
  total: number;
  codigoUsado?: string;
  codigoPin?: string;
  repartidorNombre: string;
  repartidorInitials: string;
  fecha: string;
  hora: string;
  /** Factura de la compra (se emite al entregar o al retirar en el local). */
  facturaUrlPdf?: string | null;
  numeroComprobante?: string | null;
  calificacion?: number;
}

export interface FavoritoTienda {
  tiendaId: string;
}

export interface FavoritoProducto {
  productoId: string;
}

export interface ResenaTienda {
  id: string;
  tiendaId: string;
  clienteId?: string;
  clienteNombre: string;
  clienteFoto?: string | null;
  clienteInitials?: string;
  clienteColor?: string;
  estrellas: number;
  comentario: string;
  fecha: string;
  createdAt?: string;
}

export interface CategoriaInfo {
  key: TiendaCategoria;
  icon: string;
  label: string;
}

/* ═══════════════════════════════════════════════
   CATEGORIES
   ═══════════════════════════════════════════════ */

export const CATEGORIAS: CategoriaInfo[] = [
  { key: 'comida', icon: 'utensils', label: 'Comida rápida' },
  { key: 'tienda', icon: 'store', label: 'Tiendas' },
  { key: 'farmacia', icon: 'pill', label: 'Farmacias' },
  { key: 'regalos', icon: 'gift', label: 'Regalos / Flores' },
  { key: 'supermercado', icon: 'shopping-cart', label: 'Supermercado' },
  { key: 'tecnologia', icon: 'smartphone', label: 'Tecnología' },
  { key: 'deportes', icon: 'dumbbell', label: 'Deportes' },
];

/* ═══════════════════════════════════════════════
   INITIAL DATA CONSTANTS (CLEAN / PRODUCTION-READY)
   ═══════════════════════════════════════════════ */

// (Legacy MOCK arrays removed — data now comes from /api/tiendas, /api/productos, etc.)

/* ═══════════════════════════════════════════════
   ZUSTAND CART STORE
   ═══════════════════════════════════════════════ */

interface MarketplaceState {
  /* Data */
  tiendas: Tienda[];
  productos: Producto[];
  ordenesCompra: OrdenCompra[];
  resenas: ResenaTienda[];
  favoritosTiendas: FavoritoTienda[];
  favoritosProductos: FavoritoProducto[];

  /* Cart */
  cartItems: CartItem[];
  cartCodigoPromo: string;
  cartDescuento: number;
  cartDireccionEntrega: string;
  cartInstrucciones: string;
  cartMetodoPago: 'efectivo' | 'transferencia';
  cartScheduleMode: 'ahora' | 'programar';
  cartScheduleDate: string | null;
  cartScheduleTime: string | null;

  /* UI State */
  explorarCategoria: TiendaCategoria | 'todos';
  explorarFiltros: string[];
  explorarSearch: string;
  tiendaSeleccionada: string | null;
  productoDetalleId: string | null;
  carritoOpen: boolean;
  compraConfirmada: boolean;
  compraConfirmadaId: string;

  /* Actions */
  setExplorarCategoria: (cat: TiendaCategoria | 'todos') => void;
  toggleExplorarFiltro: (filtro: string) => void;
  setExplorarSearch: (q: string) => void;
  setTiendaSeleccionada: (id: string | null) => void;
  setProductoDetalleId: (id: string | null) => void;
  setCarritoOpen: (open: boolean) => void;

  /* Cart Actions */
  addToCart: (producto: Producto, tienda: Tienda) => boolean;
  removeFromCart: (itemId: string) => void;
  updateCartItemQty: (itemId: string, qty: number) => void;
  clearCart: () => void;
  setCartCodigoPromo: (code: string) => void;
  setCartDescuento: (desc: number) => void;
  setCartDireccionEntrega: (dir: string) => void;
  setCartInstrucciones: (instr: string) => void;
  setCartMetodoPago: (met: 'efectivo' | 'transferencia') => void;
  setCartScheduleMode: (mode: 'ahora' | 'programar') => void;
  setCartScheduleDate: (date: string | null) => void;
  setCartScheduleTime: (time: string | null) => void;
  // P0: confirmarCompra eliminado (usar confirmarCompraAsync)
  getCartSubtotal: () => number;
  getCartTotal: () => number;
  getCartItemCount: () => number;
  getCartTiendas: () => string[];
  getCartItemsByTienda: (tiendaId: string) => CartItem[];

  /* Favorites */
  toggleFavoritoTienda: (tiendaId: string) => void;
  toggleFavoritoProducto: (productoId: string) => void;
  isFavoritoTienda: (tiendaId: string) => boolean;
  isFavoritoProducto: (productoId: string) => boolean;

  /* Async API sync */
  fetchTiendas: () => Promise<void>;
  fetchProductosTienda: (tiendaId: string) => Promise<void>;
  fetchResenasTienda: (tiendaId: string) => Promise<void>;
  crearResenaAsync: (tiendaId: string, estrellas: number, comentario: string) => Promise<{ ok: boolean; error?: string }>;
  fetchOrdenesCompra: () => Promise<void>;
  fetchFavoritos: () => Promise<void>;
  fetchCarrito: () => Promise<void>;
  confirmarCompraAsync: () => Promise<{ ok: boolean; error?: string; ordenId?: string }>;
  isLoading: boolean;
}

let _cartIdCounter = 100;

export const useMarketplaceStore = create<MarketplaceState>()(
  persist(
    (set, get) => ({
  /* Data */
  tiendas: [],
  productos: [],
  ordenesCompra: [],
  resenas: [],
  favoritosTiendas: [],
  favoritosProductos: [],

  /* Cart */
  cartItems: [],
  cartCodigoPromo: '',
  cartDescuento: 0,
  cartDireccionEntrega: 'Col. Los Robles, Managua',
  cartInstrucciones: '',
  cartMetodoPago: 'efectivo',
  cartScheduleMode: 'ahora',
  cartScheduleDate: null,
  cartScheduleTime: null,

  /* UI State */
  explorarCategoria: 'todos',
  explorarFiltros: [],
  explorarSearch: '',
  tiendaSeleccionada: null,
  productoDetalleId: null,
  carritoOpen: false,
  compraConfirmada: false,
  compraConfirmadaId: '',

  /* Actions */
  setExplorarCategoria: (cat) => set({ explorarCategoria: cat }),
  toggleExplorarFiltro: (filtro) => set((state) => ({
    explorarFiltros: state.explorarFiltros.includes(filtro)
      ? state.explorarFiltros.filter((f) => f !== filtro)
      : [...state.explorarFiltros, filtro],
  })),
  setExplorarSearch: (q) => set({ explorarSearch: q }),
  setTiendaSeleccionada: (id) => set({ tiendaSeleccionada: id }),
  setProductoDetalleId: (id) => set({ productoDetalleId: id }),
  setCarritoOpen: (open) => set({ carritoOpen: open }),

  /* Cart Actions */
  // P1: addToCart persiste en BD vía POST /api/carrito (no solo memoria).
  // Valida disponibilidad y stock en tiempo real con alertas Sileo.
  addToCart: (producto, tienda) => {
    // Validar disponibilidad activa
    if (producto.disponible === false) {
      sileo.warning({
        title: 'Producto no disponible',
        description: `"${producto.nombre}" no está disponible temporalmente.`,
      });
      return false;
    }

    // Validar stock disponible
    if (producto.stock !== null && producto.stock !== undefined && producto.stock <= 0) {
      sileo.warning({
        title: 'Sin stock disponible',
        description: `Lo sentimos, "${producto.nombre}" se encuentra agotado.`,
      });
      return false;
    }

    // P1: guarda anti-mezcla de tiendas. El checkout usa `cartItems[0].tiendaId`
    // (/api/ordenes-compra rechaza con 400 los productos de otra tienda), así que
    // agregar un producto de otra tienda reventaba al final del flujo: se bloquea
    // aquí, antes de dejar el carrito incoherente.
    const itemEnCarrito = get().cartItems[0];
    const tiendaIdEnCarrito = itemEnCarrito?.tiendaId;
    if (tiendaIdEnCarrito && producto.tiendaId && producto.tiendaId !== tiendaIdEnCarrito) {
      const tiendaEnCarrito =
        itemEnCarrito?.tiendaNombre ||
        get().tiendas.find((t) => t.id === tiendaIdEnCarrito)?.nombre ||
        'otra tienda';
      sileo.warning({
        title: 'Producto de otra tienda',
        description: `Tu carrito ya tiene productos de "${tiendaEnCarrito}". Vacía el carrito para comprar en "${tienda?.nombre || 'esta tienda'}".`,
      });
      return false;
    }

    const existing = get().cartItems.find((i) => i.productoId === producto.id);
    if (existing) {
      if (producto.stock !== null && producto.stock !== undefined && existing.cantidad >= producto.stock) {
        sileo.warning({
          title: 'Límite de stock alcanzado',
          description: `Solo hay ${producto.stock} unidad${producto.stock > 1 ? 'es' : ''} disponible${producto.stock > 1 ? 's' : ''} de "${producto.nombre}".`,
        });
        return false;
      }
      // Item ya existe: incrementar cantidad
      set((state) => ({
        cartItems: state.cartItems.map((i) =>
          i.id === existing.id ? { ...i, cantidad: i.cantidad + 1 } : i
        ),
      }));
      // Persistir incremento en BD
      fetch('/api/carrito', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productoId: producto.id, cantidad: existing.cantidad + 1 }),
      })
        .then(async (r) => {
          if (!r.ok) {
            const data = await r.json().catch(() => ({}));
            sileo.warning({
              title: 'Stock insuficiente',
              description: data?.error || 'Inventario insuficiente para agregar más unidades.',
            });
            get().fetchCarrito();
          }
        })
        .catch((err) => console.error('[addToCart PATCH error]', err));
      return true;
    } else {
      // Item nuevo: crear en BD
      _cartIdCounter++;
      const newItem: CartItem = {
        id: `ci-${_cartIdCounter}`,
        productoId: producto.id,
        tiendaId: producto.tiendaId,
        tiendaNombre: tienda?.nombre || '',
        nombreProducto: producto.nombre,
        precioUnitario: producto.precio,
        cantidad: 1,
        imagenColor: producto.imagenColor,
        notas: '',
      };
      set((state) => ({ cartItems: [...state.cartItems, newItem] }));
      // Persistir en BD
      fetch('/api/carrito', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productoId: producto.id,
          tiendaId: producto.tiendaId,
          cantidad: 1,
        }),
      })
        .then(async (r) => {
          if (!r.ok) {
            const data = await r.json().catch(() => ({}));
            sileo.warning({
              title: 'Stock insuficiente',
              description: data?.error || 'No se pudo agregar al carrito por falta de disponibilidad.',
            });
            get().fetchCarrito();
            return null;
          }
          return r.json();
        })
        .then((data) => {
          // Actualizar el ID local con el real de la BD
          if (data?.item?.id) {
            set((state) => ({
              cartItems: state.cartItems.map((i) =>
                i.id === newItem.id ? { ...i, id: data.item.id } : i
              ),
            }));
          }
        })
        .catch((err) => console.error('[addToCart POST error]', err));
      return true;
    }
  },

  // P1: removeFromCart persiste en BD vía DELETE /api/carrito?productoId=
  removeFromCart: (itemId) => {
    const item = get().cartItems.find((i) => i.id === itemId);
    // Actualización optimista
    set((state) => ({ cartItems: state.cartItems.filter((i) => i.id !== itemId) }));
    // Persistir en BD
    if (item?.productoId) {
      fetch(`/api/carrito?productoId=${encodeURIComponent(item.productoId)}`, {
        method: 'DELETE',
      }).catch((err) => console.error('[removeFromCart DELETE error]', err));
    }
  },

  // P1: updateCartItemQty persiste en BD vía PATCH /api/carrito
  updateCartItemQty: (itemId, qty) => {
    const item = get().cartItems.find((i) => i.id === itemId);
    if (!item) return;
    if (qty <= 0) {
      get().removeFromCart(itemId);
      return;
    }

    // Validar contra el stock disponible en memoria si existe
    const prod = get().productos.find((p) => p.id === item.productoId);
    if (prod && prod.stock !== null && prod.stock !== undefined && qty > prod.stock) {
      sileo.warning({
        title: 'Stock insuficiente',
        description: `Solo hay ${prod.stock} unidad${prod.stock > 1 ? 'es' : ''} disponible${prod.stock > 1 ? 's' : ''} de "${item.nombreProducto}".`,
      });
      return;
    }

    // Actualización optimista
    set((state) => ({
      cartItems: state.cartItems.map((i) =>
        i.id === itemId ? { ...i, cantidad: qty } : i
      ),
    }));
    // Persistir en BD
    fetch('/api/carrito', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productoId: item.productoId, cantidad: qty }),
    })
      .then(async (r) => {
        if (!r.ok) {
          const data = await r.json().catch(() => ({}));
          sileo.warning({
            title: 'Stock insuficiente',
            description: data?.error || 'Inventario insuficiente para esta cantidad.',
          });
          get().fetchCarrito();
        }
      })
      .catch((err) => console.error('[updateCartItemQty PATCH error]', err));
  },

  // P1: clearCart persiste en BD vía DELETE /api/carrito (sin productoId = limpiar todo)
  clearCart: () => {
    set({ cartItems: [], cartCodigoPromo: '', cartDescuento: 0 });
    fetch('/api/carrito', { method: 'DELETE' }).catch((err) =>
      console.error('[clearCart DELETE error]', err)
    );
  },

  setCartCodigoPromo: (code) => set({ cartCodigoPromo: code }),
  setCartDescuento: (desc) => set({ cartDescuento: desc }),
  setCartDireccionEntrega: (dir) => set({ cartDireccionEntrega: dir }),
  setCartInstrucciones: (instr) => set({ cartInstrucciones: instr }),
  setCartMetodoPago: (met) => set({ cartMetodoPago: met }),
  setCartScheduleMode: (mode) => set({ cartScheduleMode: mode }),
  setCartScheduleDate: (date) => set({ cartScheduleDate: date }),
  setCartScheduleTime: (time) => set({ cartScheduleTime: time }),

  // P0: confirmarCompra (sync, con datos falsos 'Carlos Mendoza'/'cliente-1') ELIMINADO.
  // Usar confirmarCompraAsync() que hace POST real a /api/ordenes-compra con transacción BD.

  getCartSubtotal: () => {
    return get().cartItems.reduce((sum, i) => {
      const price = Number(i.precioUnitario ?? (i as any).precio ?? 0) || 0;
      const qty = Math.max(1, Number(i.cantidad ?? 1) || 1);
      return sum + (price * qty);
    }, 0);
  },

  getCartTotal: () => {
    const state = get();
    const subtotal = Number(state.getCartSubtotal()) || 0;
    const tiendas = state.getCartTiendas();
    const firstTienda = state.tiendas.find((t) => t.id === tiendas[0]);
    const costoEnvio = Number(firstTienda?.costoEnvio ?? 35) || 35;
    const descuento = Number(state.cartDescuento) || 0;
    return Math.max(0, subtotal + costoEnvio - descuento);
  },

  getCartItemCount: () => get().cartItems.reduce((sum, i) => sum + i.cantidad, 0),

  getCartTiendas: () => [...new Set(get().cartItems.map((i) => i.tiendaId))],

  getCartItemsByTienda: (tiendaId) => get().cartItems.filter((i) => i.tiendaId === tiendaId),

  /* Favorites */
  toggleFavoritoTienda: (tiendaId) => {
    set((state) => ({
      favoritosTiendas: state.favoritosTiendas.some((f) => f.tiendaId === tiendaId)
        ? state.favoritosTiendas.filter((f) => f.tiendaId !== tiendaId)
        : [...state.favoritosTiendas, { tiendaId }],
    }));
    fetch('/api/cliente/favoritos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ target: 'tienda', id: tiendaId }),
    }).catch((err) => console.error('[toggleFavoritoTienda API error]', err));
  },

  toggleFavoritoProducto: (productoId) => {
    set((state) => ({
      favoritosProductos: state.favoritosProductos.some((f) => f.productoId === productoId)
        ? state.favoritosProductos.filter((f) => f.productoId !== productoId)
        : [...state.favoritosProductos, { productoId }],
    }));
    fetch('/api/cliente/favoritos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ target: 'producto', id: productoId }),
    }).catch((err) => console.error('[toggleFavoritoProducto API error]', err));
  },

  isFavoritoTienda: (tiendaId) => get().favoritosTiendas.some((f) => f.tiendaId === tiendaId),
  isFavoritoProducto: (productoId) => get().favoritosProductos.some((f) => f.productoId === productoId),

  /* Async API sync */
  isLoading: false,

  fetchTiendas: async () => {
    try {
      set({ isLoading: true });
      const res = await fetch('/api/tiendas');
      if (!res.ok) return;
      const data = await res.json();
      set({ tiendas: Array.isArray(data) ? data : (data.tiendas ?? []), isLoading: false });
    } catch (err) {
      console.error('[fetchTiendas]', err);
      set({ isLoading: false });
    }
  },

  fetchProductosTienda: async (tiendaId) => {
    try {
      const res = await fetch(`/api/tiendas/${tiendaId}/productos`);
      if (!res.ok) return;
      const data = await res.json();
      const productosTienda: Producto[] = data.productos ?? [];
      set((state) => {
        // Reemplazar productos de esa tienda
        const otros = state.productos.filter((p) => p.tiendaId !== tiendaId);
        return { productos: [...productosTienda, ...otros] };
      });
    } catch (err) {
      console.error('[fetchProductosTienda]', err);
    }
  },

  fetchResenasTienda: async (tiendaId) => {
    try {
      const res = await fetch(`/api/tiendas/${tiendaId}/resenas`);
      if (!res.ok) return;
      const data = await res.json();
      const resenasTienda: ResenaTienda[] = data.resenas ?? [];
      set((state) => {
        const otras = state.resenas.filter((r) => r.tiendaId !== tiendaId);
        return { resenas: [...resenasTienda, ...otras] };
      });
    } catch (err) {
      console.error('[fetchResenasTienda]', err);
    }
  },

  crearResenaAsync: async (tiendaId, estrellas, comentario) => {
    try {
      const res = await fetch(`/api/tiendas/${tiendaId}/resenas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estrellas, comentario }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        return { ok: false, error: data?.error || 'No se pudo guardar la reseña.' };
      }

      // Actualizar la reseña en el store
      if (data.resena) {
        set((state) => ({
          resenas: [data.resena, ...state.resenas],
          tiendas: state.tiendas.map((t) =>
            t.id === tiendaId ? { ...t, calificacion: data.nuevaCalificacion ?? t.calificacion } : t
          ),
        }));
      }

      return { ok: true };
    } catch (err) {
      console.error('[crearResenaAsync]', err);
      return { ok: false, error: 'Error de conexión al enviar reseña.' };
    }
  },

  fetchOrdenesCompra: async () => {
    try {
      const res = await fetch('/api/ordenes-compra');
      if (!res.ok) return;
      const data = await res.json();
      set({ ordenesCompra: data.ordenes ?? [] });
    } catch (err) {
      console.error('[fetchOrdenesCompra]', err);
    }
  },

  fetchFavoritos: async () => {
    try {
      const res = await fetch('/api/cliente/favoritos');
      if (!res.ok) return;
      const data = await res.json();
      const tiendasFavs = (data.tiendas ?? []).map((tId: string) => ({ tiendaId: tId }));
      const prodsFavs = (data.productos ?? []).map((pId: string) => ({ productoId: pId }));
      set({ favoritosTiendas: tiendasFavs, favoritosProductos: prodsFavs });
    } catch (err) {
      console.error('[fetchFavoritos]', err);
    }
  },

  fetchCarrito: async () => {
    try {
      const res = await fetch('/api/carrito');
      if (!res.ok) return;
      const data = await res.json();
      const items: CartItem[] = Array.isArray(data.items)
        ? data.items.map((it: any, index: number) => ({
            id: String(it.id || it.productoId || `ci-${Date.now()}-${index}`),
            productoId: String(it.productoId || it.producto?.id || ''),
            tiendaId: String(it.tiendaId ?? it.producto?.tiendaId ?? ''),
            // GET /api/carrito ya devuelve `tiendaNombre` (producto → tienda),
            // así que se mapea sin hacer un fetch extra por item.
            tiendaNombre: String(it.tiendaNombre ?? it.producto?.tienda?.nombre ?? ''),
            nombreProducto: String(it.nombreProducto ?? it.producto?.nombre ?? it.nombre ?? 'Producto'),
            precioUnitario: Number(it.precioUnitario ?? it.producto?.precio ?? it.precio ?? 0) || 0,
            cantidad: Math.max(1, Number(it.cantidad ?? 1) || 1),
            imagenColor: String(it.imagenColor ?? it.producto?.imagenColor ?? it.producto?.imagenUrl ?? ''),
            notas: String(it.notas ?? ''),
          }))
        : [];
      set({ cartItems: items });
    } catch (err) {
      console.error('[fetchCarrito]', err);
    }
  },

  confirmarCompraAsync: async () => {
    try {
      const state = get();
      const tiendas = state.getCartTiendas();
      if (tiendas.length === 0) {
        return { ok: false, error: 'No hay items en el carrito' };
      }
      const tiendaId = tiendas[0];
      const subtotal = Number(state.getCartSubtotal()) || 0;
      const firstTienda = state.tiendas.find((t) => t.id === tiendaId);
      const costoEnvio = Number(firstTienda?.costoEnvio ?? 35) || 35;
      const descuento = Number(state.cartDescuento) || 0;
      const total = Math.max(0, subtotal + costoEnvio - descuento);

      const body = {
        tiendaId,
        items: state.cartItems.map((i) => ({
          productoId: i.productoId,
          cantidad: i.cantidad,
          notas: i.notas,
        })),
        direccionEntrega: state.cartDireccionEntrega || 'Col. Los Robles, Managua',
        metodoPago: state.cartMetodoPago || 'efectivo',
        codigoPromo: state.cartCodigoPromo || undefined,
        descuento: state.cartDescuento ?? 0,
        instrucciones: state.cartInstrucciones || undefined,
      };

      const res = await fetch('/api/ordenes-compra', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        // P0-15: NO crear fallback silencioso. Reportar error real al usuario.
        const errorMsg = data?.error || 'No se pudo completar la compra. Inténtalo de nuevo.';
        console.error('[confirmarCompraAsync] API error:', data);
        return { ok: false, error: errorMsg };
      }

      // Recargar órdenes desde el backend
      await get().fetchOrdenesCompra();

      set({
        cartItems: [],
        cartCodigoPromo: '',
        cartDescuento: 0,
        compraConfirmada: true,
        compraConfirmadaId: data.orden?.id ?? '',
      });

      return { ok: true, ordenId: data.orden?.id };
    } catch (err) {
      console.error('[confirmarCompraAsync]', err);
      // P0-15: NO crear fallback. Reportar error de red al usuario.
      return {
        ok: false,
        error: 'Error de conexión. Verifica tu internet e inténtalo de nuevo.',
      };
    }
  },
    }),
    {
      name: 'logifast-marketplace-store',
      // Persistir carrito y favoritos (datos del usuario), NO tiendas ni órdenes
      // (esos se rehidratan desde el backend al montar ClientShell).
      partialize: (state) => ({
        cartItems: state.cartItems,
        cartDireccionEntrega: state.cartDireccionEntrega,
        cartMetodoPago: state.cartMetodoPago,
        cartInstrucciones: state.cartInstrucciones,
        favoritosTiendas: state.favoritosTiendas,
        favoritosProductos: state.favoritosProductos,
      }),
    }
  )
);
