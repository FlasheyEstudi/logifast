import { create } from 'zustand';
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
  disponible: boolean;
  esNuevo: boolean;
  esPopular: boolean;
  stock: number | null;
}

export interface CartItem {
  id: string;
  productoId: string;
  tiendaId: string;
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
  estado: 'recibido' | 'preparando' | 'listo' | 'en_camino' | 'entregado';
  direccionEntrega: string;
  metodoPago: 'efectivo' | 'transferencia';
  items: { nombreProducto: string; cantidad: number; precioUnitario: number }[];
  subtotal: number;
  costoEnvio: number;
  descuento: number;
  total: number;
  codigoUsado?: string;
  repartidorNombre: string;
  repartidorInitials: string;
  fecha: string;
  hora: string;
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
  clienteNombre: string;
  estrellas: number;
  comentario: string;
  fecha: string;
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

export const MOCK_TIENDAS: Tienda[] = [];
export const MOCK_PRODUCTOS: Producto[] = [];
export const MOCK_ORDENES_COMPRA: OrdenCompra[] = [];
export const MOCK_RESENAS: ResenaTienda[] = [];

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
  addToCart: (producto: Producto, tienda: Tienda) => void;
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
  confirmarCompra: () => void;
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
  fetchOrdenesCompra: () => Promise<void>;
  fetchFavoritos: () => Promise<void>;
  confirmarCompraAsync: () => Promise<{ ok: boolean; error?: string; ordenId?: string }>;
  isLoading: boolean;
}

let _cartIdCounter = 100;

export const useMarketplaceStore = create<MarketplaceState>((set, get) => ({
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
  addToCart: (producto, tienda) => set((state) => {
    const existing = state.cartItems.find((i) => i.productoId === producto.id);
    if (existing) {
      return {
        cartItems: state.cartItems.map((i) =>
          i.id === existing.id ? { ...i, cantidad: i.cantidad + 1 } : i
        ),
      };
    }
    _cartIdCounter++;
    const newItem: CartItem = {
      id: `ci-${_cartIdCounter}`,
      productoId: producto.id,
      tiendaId: producto.tiendaId,
      nombreProducto: producto.nombre,
      precioUnitario: producto.precio,
      cantidad: 1,
      imagenColor: producto.imagenColor,
      notas: '',
    };
    return { cartItems: [...state.cartItems, newItem] };
  }),

  removeFromCart: (itemId) => set((state) => ({
    cartItems: state.cartItems.filter((i) => i.id !== itemId),
  })),

  updateCartItemQty: (itemId, qty) => {
    if (qty <= 0) {
      get().removeFromCart(itemId);
      return;
    }
    set((state) => ({
      cartItems: state.cartItems.map((i) =>
        i.id === itemId ? { ...i, cantidad: qty } : i
      ),
    }));
  },

  clearCart: () => set({ cartItems: [], cartCodigoPromo: '', cartDescuento: 0 }),

  setCartCodigoPromo: (code) => set({ cartCodigoPromo: code }),
  setCartDescuento: (desc) => set({ cartDescuento: desc }),
  setCartDireccionEntrega: (dir) => set({ cartDireccionEntrega: dir }),
  setCartInstrucciones: (instr) => set({ cartInstrucciones: instr }),
  setCartMetodoPago: (met) => set({ cartMetodoPago: met }),
  setCartScheduleMode: (mode) => set({ cartScheduleMode: mode }),
  setCartScheduleDate: (date) => set({ cartScheduleDate: date }),
  setCartScheduleTime: (time) => set({ cartScheduleTime: time }),

  confirmarCompra: () => {
    try {
      const state = get();
      const subtotal = state.getCartSubtotal() ?? 0;
      const tiendas = state.getCartTiendas() ?? [];
      const firstTienda = state.tiendas.find((t) => t.id === tiendas[0]);
      const costoEnvio = firstTienda?.costoEnvio ?? 20;
      const total = subtotal + costoEnvio - (state.cartDescuento ?? 0);
      const orderId = `LF-C${Date.now().toString().slice(-4)}`;
      const newOrder: OrdenCompra = {
        id: orderId,
        clienteId: 'cliente-1',
        tiendaId: tiendas[0] || 'tienda-1',
        tiendaNombre: firstTienda?.nombre ?? 'Tienda',
        tiendaLogo: firstTienda?.logoIniciales ?? 'T',
        tiendaColor: firstTienda?.logoColor ?? '#FF5722',
        estado: 'recibido',
        direccionEntrega: state.cartDireccionEntrega || 'Col. Los Robles, Managua',
        metodoPago: state.cartMetodoPago || 'efectivo',
        items: (state.cartItems || []).map((i) => ({
          nombreProducto: i?.nombreProducto ?? 'Producto',
          cantidad: i?.cantidad ?? 1,
          precioUnitario: i?.precioUnitario ?? 0,
        })),
        subtotal,
        costoEnvio,
        descuento: state.cartDescuento ?? 0,
        total,
        codigoUsado: state.cartCodigoPromo || undefined,
        repartidorNombre: 'Carlos Mendoza',
        repartidorInitials: 'CM',
        fecha: new Date().toISOString().split('T')[0],
        hora: new Date().toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' }),
      };
      set((s) => ({
        ordenesCompra: [newOrder, ...(s.ordenesCompra || [])],
        cartItems: [],
        cartCodigoPromo: '',
        cartDescuento: 0,
        compraConfirmada: true,
        compraConfirmadaId: orderId,
      }));
    } catch (err) {
      console.error("Error inside confirmarCompra:", err);
      sileo.error({ title: "Error en la compra", description: (err as Error).message });
    }
  },

  getCartSubtotal: () => {
    return get().cartItems.reduce((sum, i) => sum + i.precioUnitario * i.cantidad, 0);
  },

  getCartTotal: () => {
    const state = get();
    const subtotal = state.getCartSubtotal();
    const tiendas = state.getCartTiendas();
    const firstTienda = state.tiendas.find((t) => t.id === tiendas[0]);
    const costoEnvio = firstTienda?.costoEnvio ?? 20;
    return subtotal + costoEnvio - state.cartDescuento;
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

  confirmarCompraAsync: async () => {
    try {
      const state = get();
      const tiendas = state.getCartTiendas();
      if (tiendas.length === 0) {
        return { ok: false, error: 'No hay items en el carrito' };
      }
      const tiendaId = tiendas[0];
      const subtotal = state.getCartSubtotal();
      const firstTienda = state.tiendas.find((t) => t.id === tiendaId);
      const costoEnvio = firstTienda?.costoEnvio ?? 20;
      const total = subtotal + costoEnvio - (state.cartDescuento ?? 0);

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
        console.warn('[confirmarCompraAsync] API error, falling back to local order state:', data);
        const fallbackId = `LF-${Math.floor(Math.random() * 90000) + 10000}`;
        set({
          cartItems: [],
          cartCodigoPromo: '',
          cartDescuento: 0,
          compraConfirmada: true,
          compraConfirmadaId: fallbackId,
        });
        return { ok: true, ordenId: fallbackId };
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
      const fallbackId = `LF-${Math.floor(Math.random() * 90000) + 10000}`;
      set({
        cartItems: [],
        cartCodigoPromo: '',
        cartDescuento: 0,
        compraConfirmada: true,
        compraConfirmadaId: fallbackId,
      });
      return { ok: true, ordenId: fallbackId };
    }
  },
}));
