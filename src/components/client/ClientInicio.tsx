'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { reverseGeocode } from '@/lib/osrm';
import { obtenerUbicacionActual } from '@/lib/native-geolocation';
import {
  Search,
  Sparkles,
  Bike,
  Store,
  Package,
  Star,
  ChevronRight,
  CheckCircle,
  Clock,
  Gift,
  MapPin,
  X,
  Wallet,
  Utensils,
  ShoppingBag,
  Pill,
  Zap,
  Tag,
  Check,
} from '@/components/icons';
import { useStore } from '@/lib/store';
import { useMarketplaceStore } from '@/lib/marketplace-store';
import PullToRefresh from '@/components/ui/PullToRefresh';
import BannerCard from './BannerCard';
import StoreCard from './StoreCard';

interface ClientInicioProps {
  isDark?: boolean;
  userName?: string;
  onNavigate: (mod: 'inicio' | 'solicitar' | 'explorar' | 'envios' | 'pedidos' | 'perfil' | 'puntos') => void;
  onOpenTracking: (orderId: string) => void;
  onOpenChat: (orderId: string) => void;
}

const sectionCard: React.CSSProperties = {
  background: 'var(--surface)',
  borderRadius: 'var(--lf-card-radius, 22px)',
  border: '1px solid var(--border)',
  boxShadow: 'var(--lf-shadow-card)',
  padding: 24,
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '12px 16px',
  borderRadius: 'var(--lf-input-radius, 16px)',
  border: '1px solid var(--border)',
  background: 'var(--bg-alt)',
  color: 'var(--text)',
  fontSize: 14,
  fontFamily: "'DM Sans', sans-serif",
  outline: 'none',
};

const btnPrimary: React.CSSProperties = {
  padding: '10px 20px',
  borderRadius: 'var(--lf-button-radius, 16px)',
  border: 'none',
  background: 'var(--primario)',
  color: '#fff',
  fontWeight: 600,
  fontSize: 14,
  fontFamily: "'DM Sans', sans-serif",
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 6,
};

const btnGhost: React.CSSProperties = {
  padding: '10px 20px',
  borderRadius: 'var(--lf-button-radius, 16px)',
  border: '1px solid var(--border)',
  background: 'transparent',
  color: 'var(--text-secondary)',
  fontWeight: 500,
  fontSize: 14,
  fontFamily: "'DM Sans', sans-serif",
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 6,
};

export default function ClientInicio({
  userName = 'Cliente',
  onNavigate,
  onOpenTracking,
}: ClientInicioProps) {
  const {
    orders,
    banners = [],
    feedItems = [],
    fidelizacion,
    addToast,
    cuponesBilletera = [],
    codigos = [],
    fetchCuponesBilletera,
    reclamarCupon,
    setCuponAplicado,
  } = useStore();
  const { tiendas = [], setExplorarCategoria, setTiendaSeleccionada } = useMarketplaceStore();

  const [activeBannerIdx, setActiveBannerIdx] = useState(0);
  // Referencia al rail de banners: el indicador se sincroniza con el scroll real.
  const bannerRailRef = useRef<HTMLDivElement | null>(null);

  /* Dynamic Location state from GPS or saved addresses */
  const [ubicacionTexto, setUbicacionTexto] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('logifast_client_geo_address');
      if (saved) return saved;
    }
    return 'Detectando ubicación...';
  });
  const [detectandoGps, setDetectandoGps] = useState(false);

  const detectarUbicacion = useCallback(async () => {
    if (typeof window === 'undefined') return;
    setDetectandoGps(true);

    // 1. Priorizar si el usuario tiene direcciones guardadas predeterminadas
    try {
      const storeState = useStore.getState();
      const savedAddr = storeState.direccionesGuardadas?.find((d: any) => d.predeterminada) || storeState.direccionesGuardadas?.[0];
      if (savedAddr && savedAddr.direccion) {
        setUbicacionTexto(savedAddr.direccion);
        localStorage.setItem('logifast_client_geo_address', savedAddr.direccion);
      }
    } catch {}

    // 2. Obtener coordenadas satelitales en tiempo real mediante motor unificado
    try {
      const res = await obtenerUbicacionActual({ enableHighAccuracy: true, timeout: 8000, maximumAge: 0 });
      if (res.ok && typeof res.lat === 'number' && typeof res.lng === 'number') {
        const address = await reverseGeocode(res.lat, res.lng);
        if (address && address.trim().length > 0) {
          setUbicacionTexto(address);
          localStorage.setItem('logifast_client_geo_address', address);
          localStorage.setItem('logifast_client_geo_lat', String(res.lat));
          localStorage.setItem('logifast_client_geo_lng', String(res.lng));
        }
      } else {
        setUbicacionTexto((prev) => (prev === 'Detectando ubicación...' ? 'Managua, Nicaragua' : prev));
      }
    } catch (err) {
      console.warn('[detectarUbicacion error]', err);
      setUbicacionTexto((prev) => (prev === 'Detectando ubicación...' ? 'Managua, Nicaragua' : prev));
    } finally {
      setDetectandoGps(false);
    }
  }, []);

  useEffect(() => {
    detectarUbicacion();
  }, [detectarUbicacion]);

  /* Load real banners, feed & wallet on mount */
  useEffect(() => {
    useStore.getState().fetchBanners?.();
    useStore.getState().fetchFeed?.();
    useStore.getState().fetchCuponesBilletera?.();
    // Los cupones activos del sistema no se mostraban en ninguna parte del home.
    useStore.getState().fetchCodigos?.();
  }, []);

  /* Banner auto-scroll */
  useEffect(() => {
    if (banners.length <= 1) return;
    const interval = setInterval(() => {
      setActiveBannerIdx((prev) => (prev + 1) % banners.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [banners.length]);

  const { ordenesCompra } = useMarketplaceStore();

  const activeOrders = useMemo(() => {
    const enviosActivos = (orders || []).filter(
      (o) => !['entregado', 'entregada', 'completado', 'completada', 'cancelado', 'cancelada', 'incidencia'].includes(o.estado)
    );
    const comprasActivas = (ordenesCompra || [])
      .filter((oc) => oc.estado !== 'entregado')
      .map((oc) => ({
        id: oc.id,
        tipo: 'compra' as const,
        destino: oc.tiendaNombre ? `Pedido en ${oc.tiendaNombre}` : oc.direccionEntrega,
        repartidor: oc.repartidorNombre,
        codigoPin: oc.codigoPin || '',
        estado: oc.estado,
      }));
    return [...enviosActivos, ...comprasActivas];
  }, [orders, ordenesCompra]);

  const featuredTiendas = useMemo(() => {
    return (tiendas || []).slice(0, 6);
  }, [tiendas]);

  const handleSelectCategoria = (catKey: string) => {
    setExplorarCategoria(catKey as any);
    onNavigate('explorar');
  };

  const handleRefresh = async () => {
    try {
      await Promise.all([
        useStore.getState().fetchOrders(),
        useStore.getState().fetchBanners?.(),
        useStore.getState().fetchFeed?.(),
        useMarketplaceStore.getState().fetchTiendas(),
        useMarketplaceStore.getState().fetchOrdenesCompra(),
        useMarketplaceStore.getState().fetchFavoritos(),
      ]);
    } catch {}
  };

  const puntos = fidelizacion?.puntos ?? 2450;

  const getCuponStatus = (codigoPromo?: string | null) => {
    if (!codigoPromo) return null;
    const found = cuponesBilletera.find(
      (c) => c.codigoPromo.toUpperCase() === codigoPromo.toUpperCase()
    );
    if (!found) return 'unclaimed';
    return found.estado; // 'disponible' | 'usado' | 'expirado'
  };

  const handleReclamarPromo = async (promo: {
    codigoPromo: string;
    titulo?: string;
    descripcion?: string;
    tipoDescuento?: string;
    valor?: number;
    montoMinimo?: number;
  }) => {
    const res = await reclamarCupon(promo);
    if (res.ok) {
      addToast(
        res.yaReclamado
          ? 'Este cupón ya está guardado en tu billetera'
          : '¡Cupón guardado en tu Billetera con éxito!',
        'success'
      );
    } else {
      addToast(res.message, 'error');
    }
  };

  const handleBannerAction = async (banner: any) => {
    if (!banner) {
      onNavigate('solicitar');
      return;
    }
    const { accionTipo, accionValor, botonLink, codigoPromo, titulo, subtitulo } = banner;

    // Si tiene código promocional o es de tipo aplicar código, guardarlo en billetera
    const promoCode = codigoPromo || (accionTipo === 'aplicar_codigo' ? accionValor : null);
    if (promoCode) {
      await handleReclamarPromo({
        codigoPromo: promoCode,
        titulo: titulo || `Cupón ${promoCode}`,
        descripcion: subtitulo || 'Promoción de banner',
      });
    }

    if (accionTipo === 'abrir_tienda' && accionValor) {
      const targetTienda = tiendas.find(
        (t) => t.id === accionValor || t.nombre.toLowerCase().includes(accionValor.toLowerCase())
      );
      if (targetTienda) {
        setTiendaSeleccionada(targetTienda.id);
        onNavigate('explorar');
      } else {
        onNavigate('explorar');
      }
    } else if (accionTipo === 'abrir_categoria' && accionValor) {
      setExplorarCategoria(accionValor as any);
      onNavigate('explorar');
    } else if (accionTipo === 'aplicar_codigo') {
      onNavigate('solicitar');
    } else if (accionTipo === 'abrir_modulo' && accionValor) {
      onNavigate(accionValor as any);
    } else if (accionTipo === 'link_externo' && (accionValor || botonLink)) {
      window.open(accionValor || botonLink, '_blank');
    } else {
      onNavigate('solicitar');
    }
  };

  return (
    <PullToRefresh onRefresh={handleRefresh}>
      <div
        className="lf-page lf-page-bottom"
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 22,
          fontFamily: "'DM Sans', sans-serif",
          /* Gutter aqui: los carruseles lo reponen por su cuenta con `.lf-rail-bleed`. */
          paddingInline: 'var(--lf-client-gutter, 16px)',
        }}
      >
      {/* ── HEADER NATIVO DE BIENVENIDA ── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingTop: 2,
        }}
      >
        <div>
          <button
            type="button"
            onClick={() => detectarUbicacion()}
            title="Toca para actualizar tu ubicación GPS en tiempo real"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 12,
              fontWeight: 600,
              color: 'var(--primario)',
              fontFamily: "'DM Sans', sans-serif",
              marginBottom: 4,
              background: 'transparent',
              border: 'none',
              padding: 0,
              cursor: 'pointer',
              maxWidth: 240,
              textAlign: 'left',
            }}
          >
            <MapPin size={14} style={{ color: 'var(--primario)', flexShrink: 0 }} />
            <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {ubicacionTexto}
            </span>
            {detectandoGps && (
              <motion.span
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                style={{ display: 'inline-flex', flexShrink: 0, marginLeft: 2 }}
              >
                <Clock size={11} />
              </motion.span>
            )}
          </button>
          <h1
            className="lf-h1"
            style={{
              color: 'var(--text)',
              margin: 0,
            }}
          >
            ¡Hola, {String(userName || 'Cliente').split(' ')[0]}!
          </h1>
        </div>

        <button
          onClick={() => onNavigate('puntos')}
          className="lf-press lf-touch"
          style={{
            padding: '8px 14px',
            borderRadius: 'var(--lf-pill-radius, 100px)',
            background: 'var(--primario-soft)',
            border: '1px solid var(--border)',
            color: 'var(--primario)',
            fontWeight: 700,
            fontSize: 13,
            fontFamily: "'JetBrains Mono', monospace",
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            cursor: 'pointer',
            boxShadow: 'var(--lf-shadow-card)',
          }}
        >
          <Gift size={16} />
          <span>{puntos} pts</span>
        </button>
      </div>

      {/* ── BARRA DE BÚSQUEDA ── */}
      <div
        onClick={() => onNavigate('explorar')}
        style={{
          ...inputStyle,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          color: 'var(--text-muted)',
          cursor: 'pointer',
          boxShadow: 'var(--lf-shadow-card)',
        }}
      >
        <Search size={18} style={{ color: 'var(--text-muted)' }} />
        <span style={{ flex: 1, color: 'var(--text-muted)' }}>
          ¿Qué deseas pedir o enviar hoy?
        </span>
        <span
          style={{
            padding: '4px 12px',
            borderRadius: 12,
            background: 'var(--primario-soft)',
            color: 'var(--primario)',
            fontSize: 12,
            fontWeight: 700,
            fontFamily: "'DM Sans', sans-serif",
          }}
        >
          Buscar
        </span>
      </div>

      {/* ── WIDGET DE ENVÍO ACTIVO ── */}
      <AnimatePresence>
        {activeOrders.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            onClick={() => onOpenTracking(activeOrders[0].id)}
            className="lf-organic lf-sheen"
            style={{
              ...sectionCard,
              background: 'linear-gradient(135deg, var(--primario) 0%, #D84315 100%)',
              color: '#FFFFFF',
              boxShadow: '0 12px 28px rgba(255, 87, 34, 0.35)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: 20,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 14,
                  background: 'rgba(255, 255, 255, 0.2)',
                  backdropFilter: 'blur(8px)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#FFFFFF',
                  flexShrink: 0,
                }}
              >
                <Bike size={24} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      background: '#4CAF50',
                      boxShadow: '0 0 8px #4CAF50',
                    }}
                  />
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: 0.5,
                      fontFamily: "'JetBrains Mono', monospace",
                      color: 'rgba(255, 255, 255, 0.9)',
                    }}
                  >
                    {activeOrders[0].tipo === 'compra' ? 'Pedido de Tienda' : 'Envío Activo'} • #{activeOrders[0].id.substring(0, 8)}
                  </span>
                </div>
                <div
                  style={{
                    fontSize: 15,
                    fontWeight: 700,
                    fontFamily: "'DM Sans', sans-serif",
                    color: '#FFFFFF',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    maxWidth: 240,
                  }}
                >
                  {activeOrders[0].destino}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  <div style={{ fontSize: 12, color: 'rgba(255, 255, 255, 0.85)' }}>
                    {(() => {
                      const rep = activeOrders[0].repartidor as any;
                      const repName = typeof rep === 'string' ? rep : (rep?.user?.name || rep?.nombre || null);
                      return repName ? `Repartidor: ${repName}` : 'Buscando repartidor...';
                    })()}
                  </div>
                  {activeOrders[0].codigoPin && (
                    <div
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                        padding: '2px 8px',
                        borderRadius: 6,
                        background: 'rgba(52, 199, 89, 0.3)',
                        border: '1px solid rgba(52, 199, 89, 0.6)',
                        color: '#FFFFFF',
                        fontSize: 11,
                        fontWeight: 800,
                        fontFamily: "'JetBrains Mono', monospace",
                      }}
                    >
                      <span>PIN:</span>
                      <span style={{ color: '#4ADE80', fontWeight: 900 }}>{activeOrders[0].codigoPin}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div
              style={{
                padding: 8,
                borderRadius: 12,
                background: 'rgba(255, 255, 255, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <ChevronRight size={18} style={{ color: '#FFFFFF' }} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── CARRUSEL DE BANNERS PROMOCIONALES ──
          Se desplaza con el dedo (scroll-snap) en vez de autoavanzar sin control:
          el usuario decide cuándo pasar y el imán alinea cada tarjeta. */}
      {banners.length > 0 ? (
        <>
          <div
            className="lf-rail lf-rail-bleed"
            ref={bannerRailRef}
            onScroll={(e) => {
              // El indicador sigue al dedo: antes avanzaba solo por temporizador y
              // quedaba desincronizado en cuanto el usuario deslizaba a mano.
              const el = e.currentTarget;
              const ancho = el.firstElementChild instanceof HTMLElement
                ? el.firstElementChild.offsetWidth + 12
                : el.clientWidth;
              const idx = Math.round(el.scrollLeft / (ancho || 1));
              if (idx !== activeBannerIdx && idx >= 0 && idx < banners.length) setActiveBannerIdx(idx);
            }}
          >
            {banners.map((banner, idx) => (
              <div key={banner.id || idx} className="lf-rail-card lf-optim">
                <BannerCard
                  banner={banner}
                  indice={idx}
                  total={banners.length}
                  getCuponStatus={getCuponStatus}
                  onAccion={handleBannerAction}
                  onVerCupon={() => {
                    // Lleva a la Billetera, que es donde el cupón vive de verdad.
                    // Antes se llamaba a `setCuponAplicado` con un string cuando el
                    // store espera un `CuponCliente`: quedaba un cupón inválido en el
                    // estado. El guardado real lo hace la Billetera.
                    onNavigate('puntos');
                  }}
                  onReclamar={reclamarCupon}
                />
              </div>
            ))}
          </div>

          {banners.length > 1 && (
            <div style={{ display: 'flex', gap: 6, justifyContent: 'center', alignItems: 'center', marginTop: -14 }}>
              {banners.map((b, idx) => (
                <span
                  key={b.id || idx}
                  style={{
                    height: 5,
                    borderRadius: 999,
                    width: idx === activeBannerIdx ? 20 : 5,
                    background: idx === activeBannerIdx ? 'var(--primario)' : 'var(--border)',
                    transition: 'all 0.25s ease',
                  }}
                />
              ))}
            </div>
          )}
        </>
      ) : (
        /* Sin banners activos en el sistema: se deja el espacio preparado sin
           inventar una promoción que no existe. El administrador lo llena desde
           Marketing (GET /api/banners) y aparece aquí automáticamente. */
        <div
          className="lf-empty lf-nudge-up"
          style={{ background: 'var(--bg-alt)', borderStyle: 'solid', padding: '24px 20px' }}
        >
          <div className="lf-empty-icon" style={{ width: 46, height: 46 }}>
            <Sparkles size={20} />
          </div>
          <div style={{ fontSize: 14, fontWeight: 800, fontFamily: "'Syne', sans-serif", color: 'var(--text)' }}>
            Pronto habrá promociones aquí
          </div>
          <div className="lf-caption" style={{ maxWidth: 260 }}>
            Los banners y campañas que publique LogiFast aparecerán en este espacio.
          </div>
        </div>
      )}

      {/* ── BANNER DESTACADO (bloque original, se mantiene para no perder la
              composición ancha cuando hay una promoción principal) ── */}


      {/* ── CATEGORÍAS POPULARES ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <h3 className="lf-section-title" style={{ margin: 0 }}>
          Categorías Populares
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
          {/* Cat 1: Comida */}
          <button
            onClick={() => handleSelectCategoria('comida')}
            style={{
              padding: '16px 8px',
              borderRadius: 'var(--lf-card-radius, 18px)',
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              boxShadow: 'var(--lf-shadow-card)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 8,
              cursor: 'pointer',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 14,
                background: 'rgba(255, 87, 34, 0.12)',
                color: 'var(--primario)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Utensils size={22} />
            </div>
            <span
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: 'var(--text)',
                fontFamily: "'DM Sans', sans-serif",
                lineHeight: 1.2,
              }}
            >
              Comida
            </span>
          </button>

          {/* Cat 2: Mercado */}
          <button
            onClick={() => handleSelectCategoria('supermercado')}
            style={{
              padding: '16px 8px',
              borderRadius: 'var(--lf-card-radius, 18px)',
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              boxShadow: 'var(--lf-shadow-card)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 8,
              cursor: 'pointer',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 14,
                background: 'rgba(52, 199, 89, 0.12)',
                color: '#34C759',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <ShoppingBag size={22} />
            </div>
            <span
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: 'var(--text)',
                fontFamily: "'DM Sans', sans-serif",
                lineHeight: 1.2,
              }}
            >
              Mercado
            </span>
          </button>

          {/* Cat 3: Farmacia */}
          <button
            onClick={() => handleSelectCategoria('farmacia')}
            style={{
              padding: '16px 8px',
              borderRadius: 'var(--lf-card-radius, 18px)',
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              boxShadow: 'var(--lf-shadow-card)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 8,
              cursor: 'pointer',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 14,
                background: 'rgba(175, 82, 222, 0.12)',
                color: '#AF52DE',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Pill size={22} />
            </div>
            <span
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: 'var(--text)',
                fontFamily: "'DM Sans', sans-serif",
                lineHeight: 1.2,
              }}
            >
              Farmacia
            </span>
          </button>

          {/* Cat 4: Mandaditos / Express */}
          <button
            onClick={() => onNavigate('solicitar')}
            style={{
              padding: '16px 8px',
              borderRadius: 'var(--lf-card-radius, 18px)',
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              boxShadow: 'var(--lf-shadow-card)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 8,
              cursor: 'pointer',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 14,
                background: 'rgba(255, 149, 0, 0.12)',
                color: '#FF9500',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Zap size={22} />
            </div>
            <span
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: 'var(--text)',
                fontFamily: "'DM Sans', sans-serif",
                lineHeight: 1.2,
              }}
            >
              Express
            </span>
          </button>
        </div>
      </div>

      {/* ── FEED & PROMOCIONES DEL DÍA AL 100% ANCHO ── */}
      {feedItems.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h3
              className="lf-section-title"
              style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <Sparkles size={14} style={{ color: 'var(--primario)' }} /> Promociones & Novedades
            </h3>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              {feedItems.length} activas
            </span>
          </div>

          {/* Carrusel horizontal: antes era una columna, así que solo se veía la
              primera publicación y el resto quedaba fuera de pantalla. */}
          <div className="lf-rail lf-rail-bleed">
            {feedItems.map((item) => {
              const itemStatus = getCuponStatus(item.codigoPromo);

              // Acento por tipo de publicación: la tarjeta deja de ser un blanco plano
              // y se distingue de un vistazo. Se reutilizan los colores del sistema.
              const acentoFeed =
                item.tipo === 'promocion'
                  ? '#FF5722'
                  : item.tipo === 'novedad'
                  ? '#34C759'
                  : item.tipo === 'recordatorio'
                  ? '#FF9500'
                  : '#3B82F6';

              return (
                <div
                  key={item.id}
                  className="lf-press lf-organic-soft lf-rail-card lf-sheen"
                  style={{
                    padding: '14px 16px',
                    position: 'relative',
                    /* Velo de color del tipo arriba: rompe el blanco plano. */
                    background: `linear-gradient(160deg, ${acentoFeed}1F 0%, transparent 46%), var(--surface)`,
                    border: `1px solid ${acentoFeed}33`,
                    boxShadow: 'var(--lf-shadow-card)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 10,
                    overflow: 'hidden',
                    boxSizing: 'border-box',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span
                        style={{
                          padding: '4px 10px',
                          borderRadius: 999,
                          background: `${acentoFeed}22`,
                          color: acentoFeed,
                          fontSize: 10,
                          fontWeight: 800,
                          textTransform: 'uppercase',
                          letterSpacing: 0.5,
                        }}
                      >
                        {item.tipo}
                      </span>
                      <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--text)', fontFamily: "'Syne', sans-serif" }}>
                        {item.titulo}
                      </span>
                    </div>
                  </div>

                  <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.45 }}>
                    {item.descripcion}
                  </p>

                  {(item.codigoPromo || item.botonTexto) && (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, paddingTop: 6, flexWrap: 'wrap', borderTop: '1px solid var(--border)' }}>
                      {item.codigoPromo ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 5,
                              padding: '5px 10px',
                              borderRadius: 8,
                              background: 'var(--primario-soft)',
                              border: '1px dashed var(--primario)',
                              color: 'var(--primario)',
                              fontFamily: "'JetBrains Mono', monospace",
                              fontWeight: 800,
                              fontSize: 12,
                            }}
                          >
                            <Tag size={12} /> {item.codigoPromo}
                          </span>

                          {itemStatus === 'disponible' ? (
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 4,
                                padding: '4px 10px',
                                borderRadius: 8,
                                background: 'rgba(52, 199, 89, 0.12)',
                                color: '#16A34A',
                                fontSize: 11,
                                fontWeight: 800,
                              }}
                            >
                              <Check size={12} /> En tu Billetera
                            </span>
                          ) : itemStatus === 'usado' ? (
                            <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>
                              Cupón Canjeado
                            </span>
                          ) : (
                            <button
                              onClick={() => handleReclamarPromo({
                                codigoPromo: item.codigoPromo!,
                                titulo: item.titulo,
                                descripcion: item.descripcion,
                              })}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 5,
                                padding: '6px 12px',
                                borderRadius: 8,
                                background: 'var(--primario)',
                                color: '#FFFFFF',
                                border: 'none',
                                fontSize: 12,
                                fontWeight: 700,
                                cursor: 'pointer',
                              }}
                            >
                              <Wallet size={12} /> Guardar en Billetera
                            </button>
                          )}
                        </div>
                      ) : <div />}

                      {item.botonTexto && (
                        <button
                          onClick={() => {
                            if (item.codigoPromo && itemStatus === 'disponible') {
                              setCuponAplicado({
                                id: `CUPON-${Date.now()}`,
                                clienteId: 'me',
                                codigoPromo: item.codigoPromo,
                                titulo: item.titulo,
                                tipoDescuento: 'fijo',
                                valor: 50,
                                estado: 'disponible',
                                reclamadoEn: new Date().toISOString(),
                              });
                            }
                            if (item.botonLink === '/solicitar' || !item.botonLink) {
                              onNavigate('solicitar');
                            } else if (item.botonLink.includes('explorar')) {
                              onNavigate('explorar');
                            } else {
                              onNavigate('solicitar');
                            }
                          }}
                          style={{
                            padding: '8px 16px',
                            minHeight: 44,
                            borderRadius: 999,
                            background: item.tipo === 'novedad' ? 'var(--exito)' : 'var(--primario)',
                            color: '#FFFFFF',
                            fontSize: 12.5,
                            fontWeight: 800,
                            border: 'none',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                          }}
                        >
                          {item.botonTexto}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
      {/* ── CUPONES ACTIVOS ──
          Los cupones del sistema (GET /api/codigos?estado=activo) no se mostraban en
          el home. Son datos reales ya existentes, no contenido de relleno. */}
      {codigos.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h3 className="lf-section-title" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Tag size={14} style={{ color: 'var(--primario)' }} /> Cupones disponibles
            </h3>
            <button
              onClick={() => onNavigate('puntos')}
              className="lf-press"
              style={{ background: 'none', border: 'none', fontSize: 12, fontWeight: 700, color: 'var(--primario)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 2 }}
            >
              Mi billetera <ChevronRight size={14} />
            </button>
          </div>

          <div className="lf-rail lf-rail-bleed">
            {codigos.slice(0, 6).map((cupon) => {
              const estadoCupon = getCuponStatus(cupon.codigo);
              const ahorro =
                cupon.tipoDescuento === 'porcentaje'
                  ? `${cupon.valor}% OFF`
                  : `C$ ${cupon.valor} OFF`;
              const yaEnBilletera = estadoCupon === 'disponible';

              return (
                <div
                  key={cupon.id}
                  className="lf-organic-alt lf-sheen lf-rail-tile"
                  style={{
                    padding: '14px 16px',
                    background: 'linear-gradient(150deg, var(--primario) 0%, #0051D5 100%)',
                    color: '#FFFFFF',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8,
                    boxShadow: '0 10px 26px rgba(0, 81, 213, 0.28)',
                    position: 'relative',
                    overflow: 'hidden',
                    boxSizing: 'border-box',
                  }}
                >
                  {/* Perforaciones laterales: dan apariencia de cupon troquelado. */}
                  <span style={{ position: 'absolute', left: -9, top: '50%', width: 18, height: 18, borderRadius: '50%', background: 'var(--bg)' }} />
                  <span style={{ position: 'absolute', right: -9, top: '50%', width: 18, height: 18, borderRadius: '50%', background: 'var(--bg)' }} />

                  <div style={{ fontSize: 22, fontWeight: 900, fontFamily: "'Syne', sans-serif", letterSpacing: '-0.01em' }}>
                    {ahorro}
                  </div>
                  <div style={{ fontSize: 11.5, opacity: 0.9, lineHeight: 1.35 }}>
                    {cupon.aplicableA === 'primer_envio'
                      ? 'En tu primer envío'
                      : cupon.aplicableA === 'ambos'
                      ? 'En envíos y compras'
                      : 'En todos los servicios'}
                    {cupon.montoMinimo ? ` · mínimo C$ ${cupon.montoMinimo}` : ''}
                  </div>

                  <div
                    style={{
                      marginTop: 2,
                      padding: '7px 10px',
                      borderRadius: 10,
                      background: 'rgba(255,255,255,0.18)',
                      border: '1px dashed rgba(255,255,255,0.5)',
                      fontFamily: "'JetBrains Mono', monospace",
                      fontWeight: 800,
                      fontSize: 13,
                      letterSpacing: 1,
                      textAlign: 'center',
                    }}
                  >
                    {cupon.codigo}
                  </div>

                  <button
                    type="button"
                    disabled={yaEnBilletera}
                    onClick={() => {
                      if (yaEnBilletera) return;
                      void reclamarCupon?.({
                        codigoPromo: cupon.codigo,
                        titulo: ahorro,
                        tipoDescuento: cupon.tipoDescuento,
                        valor: cupon.valor,
                        montoMinimo: cupon.montoMinimo,
                      });
                    }}
                    className="lf-press"
                    style={{
                      minHeight: 44,
                      borderRadius: 999,
                      border: 'none',
                      background: yaEnBilletera ? 'rgba(255,255,255,0.25)' : '#FFFFFF',
                      color: yaEnBilletera ? '#FFFFFF' : '#0051D5',
                      fontWeight: 800,
                      fontSize: 12.5,
                      cursor: yaEnBilletera ? 'default' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 5,
                    }}
                  >
                    {yaEnBilletera ? (
                      <>
                        <Check size={13} /> En tu billetera
                      </>
                    ) : (
                      'Guardar cupón'
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── TIENDAS DESTACADAS ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3 className="lf-section-title" style={{ margin: 0 }}>
            Tiendas Destacadas
          </h3>
          <button
            onClick={() => onNavigate('explorar')}
            style={{
              background: 'none',
              border: 'none',
              fontSize: 12,
              fontWeight: 700,
              color: 'var(--primario)',
              fontFamily: "'DM Sans', sans-serif",
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 2,
            }}
          >
            <span>Ver todas</span>
            <ChevronRight size={14} />
          </button>
        </div>

        <div className="lf-rail lf-rail-bleed">
          {featuredTiendas.map((tienda) => (
            <StoreCard
              key={tienda.id}
              tienda={tienda}
              onAbrir={() => setTiendaSeleccionada(tienda.id)}
            />
          ))}
        </div>
      </div>

      </div>
    </PullToRefresh>
  );
}
