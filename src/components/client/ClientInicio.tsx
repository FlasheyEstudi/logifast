'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Sparkles,
  Bike,
  Store,
  Package,
  Star,
  ChevronRight,
  Megaphone,
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
} from '@/components/icons';
import { useStore } from '@/lib/store';
import { useMarketplaceStore } from '@/lib/marketplace-store';

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
  const { orders, banners = [], fidelizacion } = useStore();
  const { tiendas = [], setExplorarCategoria, setTiendaSeleccionada } = useMarketplaceStore();

  const [activeBannerIdx, setActiveBannerIdx] = useState(0);
  const [adModalOpen, setAdModalOpen] = useState(false);
  const [adSuccessMsg, setAdSuccessMsg] = useState('');

  /* Banner auto-scroll */
  useEffect(() => {
    if (banners.length <= 1) return;
    const interval = setInterval(() => {
      setActiveBannerIdx((prev) => (prev + 1) % banners.length);
    }, 4500);
    return () => clearInterval(interval);
  }, [banners.length]);

  const { ordenesCompra } = useMarketplaceStore();

  const activeOrders = useMemo(() => {
    const enviosActivos = orders.filter(
      (o) => o.estado === 'pendiente' || o.estado === 'encamino' || o.estado === 'recogido'
    );
    const comprasActivas = ordenesCompra
      .filter((oc) => oc.estado !== 'entregado' && oc.estado !== 'cancelado')
      .map((oc) => ({
        id: oc.id,
        tipo: 'compra' as const,
        destino: oc.tiendaNombre ? `Pedido en ${oc.tiendaNombre}` : oc.direccionEntrega,
        repartidor: oc.repartidorNombre,
        codigoPin: oc.codigoPin || '1234',
        estado: oc.estado,
      }));
    return [...enviosActivos, ...comprasActivas];
  }, [orders, ordenesCompra]);

  const featuredTiendas = useMemo(() => {
    return tiendas.slice(0, 6);
  }, [tiendas]);

  const handleAdSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAdSuccessMsg('¡Solicitud enviada! Nuestro equipo comercial te contactará en breve.');
    setTimeout(() => {
      setAdSuccessMsg('');
      setAdModalOpen(false);
    }, 2500);
  };

  const handleSelectCategoria = (catKey: string) => {
    setExplorarCategoria(catKey as any);
    onNavigate('explorar');
  };

  const puntos = fidelizacion?.puntos ?? 2450;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 20,
        maxWidth: 600,
        margin: '0 auto',
        padding: '0 4px 120px 4px',
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      {/* ── HEADER NATIVO DE BIENVENIDA ── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingTop: 8,
        }}
      >
        <div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 12,
              fontWeight: 600,
              color: 'var(--primario)',
              fontFamily: "'DM Sans', sans-serif",
              marginBottom: 4,
            }}
          >
            <MapPin size={14} style={{ color: 'var(--primario)' }} />
            <span>Managua, Nicaragua</span>
          </div>
          <h1
            style={{
              fontSize: 24,
              fontWeight: 700,
              fontFamily: "'Syne', sans-serif",
              color: 'var(--text)',
              lineHeight: 1.2,
              margin: 0,
            }}
          >
            ¡Hola, {userName.split(' ')[0]}! 👋
          </h1>
        </div>

        <button
          onClick={() => onNavigate('puntos')}
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
                    {activeOrders[0].repartidor ? `Repartidor: ${activeOrders[0].repartidor}` : 'Buscando repartidor...'}
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

      {/* ── CARRUSEL BANNER PROMOCIONAL ── */}
      <div
        style={{
          ...sectionCard,
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span
            style={{
              padding: '4px 12px',
              borderRadius: 'var(--lf-pill-radius, 100px)',
              background: 'var(--primario-soft)',
              color: 'var(--primario)',
              fontSize: 11,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: 0.5,
              fontFamily: "'DM Sans', sans-serif",
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <Sparkles size={13} /> Promoción
          </span>
          <div style={{ display: 'flex', gap: 6 }}>
            {banners.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setActiveBannerIdx(idx)}
                style={{
                  height: 6,
                  borderRadius: 100,
                  width: activeBannerIdx === idx ? 22 : 6,
                  background: activeBannerIdx === idx ? 'var(--primario)' : 'var(--border)',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                }}
              />
            ))}
          </div>
        </div>

        <div>
          <h2
            style={{
              fontSize: 18,
              fontWeight: 700,
              fontFamily: "'Syne', sans-serif",
              color: 'var(--text)',
              margin: '0 0 6px 0',
              lineHeight: 1.3,
            }}
          >
            {banners[activeBannerIdx]?.titulo || 'Envíos Express & Compras Rápidas'}
          </h2>
          <p
            style={{
              fontSize: 13,
              color: 'var(--text-muted)',
              fontFamily: "'DM Sans', sans-serif",
              margin: 0,
              lineHeight: 1.4,
            }}
          >
            {(banners[activeBannerIdx] as any)?.descripcion || 'Tu mensajería y delivery de confianza en toda Managua con cobertura total.'}
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 6 }}>
          <button
            onClick={() => onNavigate('solicitar')}
            style={btnPrimary}
          >
            <span>Pedir Ahora</span>
            <ChevronRight size={14} />
          </button>
          <span style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: "'DM Sans', sans-serif" }}>
            LogiFast Nicaragua
          </span>
        </div>
      </div>

      {/* ── CATEGORÍAS POPULARES ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <h3
          style={{
            fontSize: 13,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: 0.8,
            color: 'var(--text-muted)',
            fontFamily: "'DM Sans', sans-serif",
            margin: 0,
          }}
        >
          Categorías Populares
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
          {/* Cat 1: Comida */}
          <button
            onClick={() => handleSelectCategoria('restaurantes')}
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
            onClick={() => handleSelectCategoria('supermercados')}
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
            onClick={() => handleSelectCategoria('farmacias')}
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

      {/* ── TIENDAS DESTACADAS ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3
            style={{
              fontSize: 13,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: 0.8,
              color: 'var(--text-muted)',
              fontFamily: "'DM Sans', sans-serif",
              margin: 0,
            }}
          >
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

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12 }}>
          {featuredTiendas.map((tienda) => (
            <div
              key={tienda.id}
              onClick={() => setTiendaSeleccionada(tienda.id)}
              style={{
                padding: 16,
                borderRadius: 'var(--lf-card-radius, 18px)',
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                boxShadow: 'var(--lf-shadow-card)',
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                cursor: 'pointer',
                transition: 'transform 0.2s',
              }}
            >
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 14,
                  background: 'var(--primario-soft)',
                  color: 'var(--primario)',
                  fontFamily: "'Syne', sans-serif",
                  fontWeight: 800,
                  fontSize: 17,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                {tienda.nombre.substring(0, 2).toUpperCase()}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 700,
                    fontFamily: "'Syne', sans-serif",
                    color: 'var(--text)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {tienda.nombre}
                </div>
                <div
                  style={{
                    fontSize: 12,
                    color: 'var(--text-muted)',
                    fontFamily: "'DM Sans', sans-serif",
                    textTransform: 'capitalize',
                  }}
                >
                  {tienda.categoria} • C$ {tienda.costoEnvio} envío
                </div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    fontSize: 11,
                    marginTop: 4,
                  }}
                >
                  <span
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 3,
                      color: '#FF9500',
                      fontWeight: 700,
                      fontFamily: "'JetBrains Mono', monospace",
                    }}
                  >
                    <Star size={12} fill="currentColor" /> {(tienda.calificacion || 4.8).toFixed(1)}
                  </span>
                  <span style={{ color: 'var(--border)' }}>•</span>
                  <span style={{ color: 'var(--text-muted)', fontFamily: "'DM Sans', sans-serif" }}>
                    <Clock size={12} style={{ display: 'inline', marginRight: 3 }} />
                    {(tienda as any).tiempoEntrega || tienda.tiempoEstimado || '20 min'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── BANNER PARA NEGOCIOS ── */}
      <div
        style={{
          ...sectionCard,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span
            style={{
              padding: '3px 8px',
              borderRadius: 6,
              background: 'var(--primario-soft)',
              color: 'var(--primario)',
              fontSize: 10,
              fontWeight: 700,
              textTransform: 'uppercase',
              width: 'fit-content',
            }}
          >
            Para Negocios
          </span>
          <h4
            style={{
              fontSize: 15,
              fontWeight: 700,
              fontFamily: "'Syne', sans-serif",
              color: 'var(--text)',
              margin: 0,
            }}
          >
            ¿Tienes una tienda o restaurante?
          </h4>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>
            Regístrate en LogiFast y vende a miles de clientes.
          </p>
        </div>

        <button
          onClick={() => setAdModalOpen(true)}
          style={{
            ...btnPrimary,
            padding: '10px 16px',
            fontSize: 13,
            flexShrink: 0,
          }}
        >
          <Megaphone size={14} /> Anunciarme
        </button>
      </div>

      {/* ── MODAL ANUNCIAR NEGOCIO ── */}
      <AnimatePresence>
        {adModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 9999,
              background: 'rgba(0, 0, 0, 0.65)',
              backdropFilter: 'blur(8px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 16,
            }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              style={{
                width: '100%',
                maxWidth: 400,
                borderRadius: 'var(--lf-card-radius, 22px)',
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                boxShadow: '0 20px 50px rgba(0,0,0,0.4)',
                padding: 24,
                display: 'flex',
                flexDirection: 'column',
                gap: 16,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderBottom: '1px solid var(--border)',
                  paddingBottom: 12,
                }}
              >
                <h3
                  style={{
                    fontSize: 16,
                    fontWeight: 700,
                    fontFamily: "'Syne', sans-serif",
                    color: 'var(--text)',
                    margin: 0,
                  }}
                >
                  Anuncia tu Negocio en LogiFast
                </h3>
                <button
                  onClick={() => setAdModalOpen(false)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                  }}
                >
                  <X size={20} />
                </button>
              </div>

              {adSuccessMsg ? (
                <div style={{ padding: '24px 0', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <CheckCircle size={40} style={{ color: '#34C759', margin: '0 auto' }} />
                  <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', margin: 0 }}>
                    {adSuccessMsg}
                  </p>
                </div>
              ) : (
                <form onSubmit={handleAdSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>
                      Nombre del Negocio
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ej: Taquería Los Comadres"
                      style={inputStyle}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>
                      Teléfono de Contacto
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="+505 8888-8888"
                      style={inputStyle}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>
                      Categoría
                    </label>
                    <select style={inputStyle}>
                      <option value="restaurante">Restaurante / Comida</option>
                      <option value="supermercado">Mercado / Licorería</option>
                      <option value="farmacia">Farmacia / Salud</option>
                      <option value="tienda">Tienda / Comercio</option>
                    </select>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, paddingTop: 8 }}>
                    <button
                      type="button"
                      onClick={() => setAdModalOpen(false)}
                      style={btnGhost}
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      style={btnPrimary}
                    >
                      Enviar Solicitud
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
