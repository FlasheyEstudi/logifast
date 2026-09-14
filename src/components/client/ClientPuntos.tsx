'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Wallet,
  CreditCard,
  Plus,
  Tag,
  Star,
  Clock,
  CheckCircle2,
  Check,
  Copy,
  ArrowUpRight,
  ShieldCheck,
  RefreshCw,
  Gift,
  ChevronRight,
  AlertCircle,
  Banknote,
  Percent,
} from '@/components/icons';
import { notify } from '@/lib/notify';
import { useMarketplaceStore } from '@/lib/marketplace-store';

interface ClientPuntosProps {
  isDark?: boolean;
  onClose?: () => void;
  onNavigate?: (mod: any) => void;
}

type TabType = 'saldo' | 'cupones' | 'canjear' | 'beneficios' | 'historial';

interface Movimiento {
  id: string;
  tipo: 'recarga' | 'debito' | 'puntos_ganados' | 'puntos_canjeados';
  titulo: string;
  descripcion: string;
  monto?: number;
  puntos?: number;
  fecha: string;
}

interface Cupon {
  id: string;
  codigoPromo: string;
  titulo?: string;
  descripcion?: string;
  tipoDescuento: string;
  valor: number;
  montoMinimo?: number | null;
  estado: string;
  reclamadoEn: string;
}

interface Beneficio {
  titulo: string;
  activo: boolean;
  desc: string;
}

export default function ClientPuntos({ isDark = true, onNavigate }: ClientPuntosProps) {
  const [activeTab, setActiveTab] = useState<TabType>('saldo');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Datos reales obtenidos desde el backend
  const [saldo, setSaldo] = useState<number>(0);
  const [puntos, setPuntos] = useState<number>(0);
  const [nivel, setNivel] = useState<string>('bronce');
  const [siguienteNivel, setSiguienteNivel] = useState<string>('Plata');
  const [puntosParaSiguiente, setPuntosParaSiguiente] = useState<number>(100);
  const [nivelProgreso, setNivelProgreso] = useState<number>(0);
  const [cupones, setCupones] = useState<Cupon[]>([]);
  const [movimientos, setMovimientos] = useState<Movimiento[]>([]);
  const [beneficios, setBeneficios] = useState<Beneficio[]>([]);

  // Modales
  const [modalRecargaOpen, setModalRecargaOpen] = useState(false);
  const [montoRecarga, setMontoRecarga] = useState<string>('100');
  const [metodoRecarga, setMetodoRecarga] = useState<'agente' | 'efectivo'>('agente');
  const [isProcessingRecarga, setIsProcessingRecarga] = useState(false);
  const [isProcessingCanje, setIsProcessingCanje] = useState(false);

  // Copia de cupón feedback
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const cargarBilletera = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const res = await fetch('/api/cliente/billetera');
      if (!res.ok) throw new Error('Error al cargar datos');
      const data = await res.json();
      if (data.ok) {
        setSaldo(Number(data.saldo) || 0);
        setPuntos(Number(data.puntos) || 0);
        setNivel(data.nivel || 'bronce');
        setSiguienteNivel(data.siguienteNivel || 'Plata');
        setPuntosParaSiguiente(Number(data.puntosParaSiguiente) || 0);
        setNivelProgreso(Number(data.nivelProgreso) || 0);
        setCupones(Array.isArray(data.cupones) ? data.cupones : []);
        setMovimientos(Array.isArray(data.movimientos) ? data.movimientos : []);
        setBeneficios(Array.isArray(data.beneficios) ? data.beneficios : []);
      }
    } catch (err) {
      console.error('[cargarBilletera error]', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    cargarBilletera();
  }, [cargarBilletera]);

  const handleRecargar = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(montoRecarga);
    if (!val || val <= 0) {
      notify.error('Ingresa un monto válido para recargar');
      return;
    }

    setIsProcessingRecarga(true);
    try {
      const res = await fetch('/api/cliente/billetera', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'recargar',
          monto: val,
          metodo: metodoRecarga === 'agente' ? 'Punto / Agente Autorizado' : 'Efectivo con Repartidor',
          referencia: `REC-${Date.now().toString().slice(-6)}`,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al procesar la recarga');

      notify.success(`¡Recarga exitosa! Se acreditaron C$ ${val.toFixed(2)} a tu billetera`);
      setModalRecargaOpen(false);
      await cargarBilletera();
    } catch (err: any) {
      notify.error(err.message || 'No se pudo completar la recarga');
    } finally {
      setIsProcessingRecarga(false);
    }
  };

  const handleCanjear = async (recompensa: { titulo: string; puntos: number; valor: number; tipoDescuento?: string }) => {
    if (puntos < recompensa.puntos) {
      notify.error(`Necesitas ${recompensa.puntos} puntos para este canje`);
      return;
    }

    setIsProcessingCanje(true);
    try {
      const res = await fetch('/api/cliente/billetera', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'canjear',
          puntos: recompensa.puntos,
          valor: recompensa.valor,
          titulo: recompensa.titulo,
          tipoDescuento: recompensa.tipoDescuento || 'fijo',
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al canjear puntos');

      notify.success(data.message || `¡Canjeaste ${recompensa.titulo}!`);
      await cargarBilletera();
      setActiveTab('cupones');
    } catch (err: any) {
      notify.error(err.message || 'No se pudo procesar el canje');
    } finally {
      setIsProcessingCanje(false);
    }
  };

  const copyToClipboard = (code: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(code);
      setCopiedCode(code);
      notify.success(`¡Código ${code} copiado al portapapeles!`);
      setTimeout(() => setCopiedCode(null), 2500);
    }
  };

  // Opciones del catálogo de canje real
  const CATALOGO_CANJE = [
    { id: 'c1', titulo: 'C$ 20 OFF en Envíos', puntos: 100, valor: 20, desc: 'Aplica en cualquier servicio de mensajería' },
    { id: 'c2', titulo: 'C$ 50 OFF en Tiendas', puntos: 200, valor: 50, desc: 'Válido para compras en el Marketplace' },
    { id: 'c3', titulo: 'Envío Gratis Managua', puntos: 350, valor: 35, desc: 'Cubre el costo de envío estándar (C$ 35)' },
    { id: 'c4', titulo: 'C$ 100 Super Cupón', puntos: 500, valor: 100, desc: 'Descuento especial en compras y entregas' },
  ];

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        maxWidth: 680,
        margin: '0 auto',
        padding: '0 4px 120px 4px',
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      {/* ─── CABECERA DEL MÓDULO ─── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingTop: 4,
        }}
      >
        <div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 12,
              fontWeight: 700,
              color: 'var(--primario)',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
            }}
          >
            <Wallet size={15} />
            <span>Billetera Digital & Puntos</span>
          </div>
          <h1
            style={{
              fontSize: 24,
              fontWeight: 800,
              fontFamily: "'Syne', sans-serif",
              color: 'var(--text)',
              margin: '4px 0 0 0',
              lineHeight: 1.15,
            }}
          >
            Tus Finanzas & Beneficios
          </h1>
        </div>

        <button
          type="button"
          onClick={() => cargarBilletera(true)}
          title="Actualizar saldo"
          style={{
            width: 38,
            height: 38,
            borderRadius: '50%',
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            color: 'var(--text-secondary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
        >
          <motion.div
            animate={refreshing ? { rotate: 360 } : {}}
            transition={{ repeat: Infinity, duration: 0.9, ease: 'linear' }}
          >
            <RefreshCw size={16} />
          </motion.div>
        </button>
      </div>

      {/* ─── CARD PRINCIPAL: SALDO Y PUNTOS ─── */}
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(0, 102, 255, 0.95), rgba(0, 80, 200, 0.92))',
          borderRadius: 24,
          padding: 22,
          color: '#FFFFFF',
          boxShadow: '0 12px 32px rgba(0, 102, 255, 0.25)',
          position: 'relative',
          overflow: 'hidden',
          border: '1px solid rgba(255, 255, 255, 0.2)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <span
              style={{
                fontSize: 12,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                color: 'rgba(255, 255, 255, 0.8)',
                display: 'block',
              }}
            >
              Saldo Disponible
            </span>
            <div
              style={{
                fontSize: 34,
                fontWeight: 800,
                fontFamily: "'JetBrains Mono', monospace",
                margin: '4px 0 2px 0',
                letterSpacing: '-0.02em',
              }}
            >
              C$ {saldo.toFixed(2)}
            </div>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                fontSize: 11,
                fontWeight: 600,
                background: 'rgba(255, 255, 255, 0.16)',
                padding: '3px 9px',
                borderRadius: 100,
              }}
            >
              <ShieldCheck size={13} />
              <span>Saldo Seguro Verificado</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setModalRecargaOpen(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '10px 16px',
              borderRadius: 100,
              background: '#FFFFFF',
              color: '#0066FF',
              border: 'none',
              fontWeight: 700,
              fontSize: 13,
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(0, 0, 0, 0.15)',
              transition: 'transform 0.15s ease',
            }}
          >
            <Plus size={16} strokeWidth={2.5} />
            <span>Recargar</span>
          </button>
        </div>

        {/* Barra de Fidelización y Nivel integrada */}
        <div
          style={{
            marginTop: 20,
            paddingTop: 16,
            borderTop: '1px solid rgba(255, 255, 255, 0.18)',
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Star size={16} color="#FFD700" fill="#FFD700" />
              <span style={{ fontSize: 13, fontWeight: 700 }}>
                Nivel {nivel.toUpperCase()} • {puntos} Puntos
              </span>
            </div>
            {puntosParaSiguiente > 0 && (
              <span style={{ fontSize: 11, color: 'rgba(255, 255, 255, 0.8)' }}>
                Faltan {puntosParaSiguiente} pts para {siguienteNivel}
              </span>
            )}
          </div>

          <div
            style={{
              height: 6,
              background: 'rgba(255, 255, 255, 0.2)',
              borderRadius: 100,
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                height: '100%',
                width: `${nivelProgreso}%`,
                background: '#FFD700',
                borderRadius: 100,
                transition: 'width 0.5s ease',
              }}
            />
          </div>
        </div>
      </div>

      {/* ─── SELECTOR DE PESTAÑAS (SUB-NAVIGATION) ─── */}
      <div
        style={{
          display: 'flex',
          gap: 6,
          overflowX: 'auto',
          paddingBottom: 4,
          scrollbarWidth: 'none',
        }}
      >
        {[
          { key: 'saldo' as const, label: 'Saldo & Recargas', icon: <Wallet size={15} /> },
          { key: 'cupones' as const, label: `Cupones (${cupones.length})`, icon: <Tag size={15} /> },
          { key: 'canjear' as const, label: 'Canjear Puntos', icon: <Gift size={15} /> },
          { key: 'beneficios' as const, label: 'Beneficios', icon: <Star size={15} /> },
          { key: 'historial' as const, label: 'Historial', icon: <Clock size={15} /> },
        ].map((tab) => {
          const isAct = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '9px 14px',
                borderRadius: 100,
                border: isAct ? '1px solid var(--primario)' : '1px solid var(--border)',
                background: isAct ? 'var(--primario)' : 'var(--surface)',
                color: isAct ? '#FFFFFF' : 'var(--text-secondary)',
                fontWeight: isAct ? 700 : 600,
                fontSize: 13,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease',
              }}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ─── PESTAÑA 1: SALDO & ACCIONES RÁPIDAS ─── */}
      {activeTab === 'saldo' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div
            style={{
              background: 'var(--surface)',
              borderRadius: 20,
              padding: 18,
              border: '1px solid var(--border)',
            }}
          >
            <h3 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 12px 0', color: 'var(--text)' }}>
              Recarga Rápida de Saldo
            </h3>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '0 0 14px 0' }}>
              Selecciona un monto predeterminado para acreditar a tu saldo al instante:
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
              {['50', '100', '200', '500'].map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => {
                    setMontoRecarga(m);
                    setModalRecargaOpen(true);
                  }}
                  style={{
                    padding: '12px 8px',
                    borderRadius: 14,
                    background: 'var(--bg-alt)',
                    border: '1px solid var(--border)',
                    color: 'var(--primario)',
                    fontFamily: "'JetBrains Mono', monospace",
                    fontWeight: 700,
                    fontSize: 14,
                    cursor: 'pointer',
                    textAlign: 'center',
                    transition: 'all 0.2s',
                  }}
                >
                  C$ {m}
                </button>
              ))}
            </div>
          </div>

          <div
            style={{
              background: 'var(--surface)',
              borderRadius: 20,
              padding: 18,
              border: '1px solid var(--border)',
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Banknote size={20} color="var(--primario)" />
              <div>
                <h4 style={{ fontSize: 14, fontWeight: 700, margin: 0, color: 'var(--text)' }}>
                  ¿Cómo usar tu saldo LogiFast?
                </h4>
                <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>
                  Tu saldo se descuenta automáticamente como método de pago prioritario en tus envíos y compras.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── PESTAÑA 2: CUPONES GUARDADOS ─── */}
      {activeTab === 'cupones' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {cupones.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '36px 20px',
                background: 'var(--surface)',
                borderRadius: 20,
                border: '1px solid var(--border)',
              }}
            >
              <Tag size={36} style={{ color: 'var(--text-muted)', margin: '0 auto 12px auto' }} />
              <h4 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', margin: 0 }}>
                No tienes cupones guardados
              </h4>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '6px 0 16px 0' }}>
                Canjea tus puntos acumulados para obtener cupones de descuento válidos en envíos y marketplace.
              </p>
              <button
                type="button"
                onClick={() => setActiveTab('canjear')}
                style={{
                  padding: '10px 18px',
                  borderRadius: 100,
                  background: 'var(--primario)',
                  color: '#FFFFFF',
                  border: 'none',
                  fontWeight: 700,
                  fontSize: 13,
                  cursor: 'pointer',
                }}
              >
                Ir al catálogo de canje
              </button>
            </div>
          ) : (
            cupones.map((c) => {
              const isAvailable = c.estado === 'disponible';
              return (
                <div
                  key={c.id}
                  style={{
                    background: 'var(--surface)',
                    borderRadius: 18,
                    padding: 16,
                    border: isAvailable ? '1px solid var(--primario)' : '1px solid var(--border)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 12,
                    opacity: isAvailable ? 1 : 0.6,
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span
                        style={{
                          fontFamily: "'JetBrains Mono', monospace",
                          fontWeight: 800,
                          fontSize: 14,
                          color: 'var(--primario)',
                          background: 'var(--primario-soft)',
                          padding: '3px 8px',
                          borderRadius: 8,
                          letterSpacing: '0.04em',
                        }}
                      >
                        {c.codigoPromo}
                      </span>
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          color: isAvailable ? '#34C759' : '#94A3B8',
                          textTransform: 'uppercase',
                        }}
                      >
                        {c.estado}
                      </span>
                    </div>

                    <h4 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', margin: '6px 0 2px 0' }}>
                      {c.titulo || `Descuento C$ ${c.valor}`}
                    </h4>
                    <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: 0 }}>
                      {c.descripcion || `Ahorra C$ ${c.valor} en tu siguiente orden`}
                    </p>
                  </div>

                  {isAvailable && (
                    <button
                      type="button"
                      onClick={() => copyToClipboard(c.codigoPromo)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        padding: '8px 14px',
                        borderRadius: 100,
                        background: copiedCode === c.codigoPromo ? '#34C759' : 'var(--bg-alt)',
                        color: copiedCode === c.codigoPromo ? '#FFFFFF' : 'var(--text)',
                        border: '1px solid var(--border)',
                        fontWeight: 700,
                        fontSize: 12,
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      {copiedCode === c.codigoPromo ? <Check size={14} /> : <Copy size={14} />}
                      <span>{copiedCode === c.codigoPromo ? 'Copiado' : 'Copiar'}</span>
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ─── PESTAÑA 3: CANJEAR PUNTOS ─── */}
      {activeTab === 'canjear' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {CATALOGO_CANJE.map((item) => {
            const canAfford = puntos >= item.puntos;
            return (
              <div
                key={item.id}
                style={{
                  background: 'var(--surface)',
                  borderRadius: 18,
                  padding: 16,
                  border: '1px solid var(--border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                }}
              >
                <div style={{ flex: 1 }}>
                  <h4 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', margin: 0 }}>
                    {item.titulo}
                  </h4>
                  <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: '4px 0 6px 0' }}>
                    {item.desc}
                  </p>
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      fontSize: 12,
                      fontWeight: 700,
                      color: canAfford ? 'var(--primario)' : 'var(--text-muted)',
                      fontFamily: "'JetBrains Mono', monospace",
                    }}
                  >
                    <Star size={13} fill="currentColor" />
                    <span>{item.puntos} puntos requeridos</span>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={!canAfford || isProcessingCanje}
                  onClick={() => handleCanjear(item)}
                  style={{
                    padding: '10px 16px',
                    borderRadius: 100,
                    background: canAfford ? 'var(--primario)' : 'var(--bg-alt)',
                    color: canAfford ? '#FFFFFF' : 'var(--text-muted)',
                    border: 'none',
                    fontWeight: 700,
                    fontSize: 13,
                    cursor: canAfford ? 'pointer' : 'not-allowed',
                    opacity: canAfford ? 1 : 0.6,
                    transition: 'all 0.15s ease',
                  }}
                >
                  Canjear
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* ─── PESTAÑA 4: BENEFICIOS POR NIVEL ─── */}
      {activeTab === 'beneficios' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {beneficios.map((ben, idx) => (
            <div
              key={idx}
              style={{
                background: 'var(--surface)',
                borderRadius: 18,
                padding: 16,
                border: ben.activo ? '1px solid var(--primario)' : '1px solid var(--border)',
                display: 'flex',
                alignItems: 'flex-start',
                gap: 12,
                opacity: ben.activo ? 1 : 0.5,
              }}
            >
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  background: ben.activo ? 'var(--primario-soft)' : 'var(--bg-alt)',
                  color: ben.activo ? 'var(--primario)' : 'var(--text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                {ben.activo ? <CheckCircle2 size={18} /> : <Clock size={18} />}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <h4 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', margin: 0 }}>
                    {ben.titulo}
                  </h4>
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      padding: '2px 6px',
                      borderRadius: 4,
                      background: ben.activo ? 'rgba(52, 199, 89, 0.15)' : 'var(--bg-alt)',
                      color: ben.activo ? '#34C759' : 'var(--text-muted)',
                      textTransform: 'uppercase',
                    }}
                  >
                    {ben.activo ? 'Activo' : `Requiere ${siguienteNivel}`}
                  </span>
                </div>
                <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
                  {ben.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ─── PESTAÑA 5: HISTORIAL TRANSACCIONAL ─── */}
      {activeTab === 'historial' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {movimientos.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '36px 20px',
                background: 'var(--surface)',
                borderRadius: 20,
                border: '1px solid var(--border)',
              }}
            >
              <Clock size={32} style={{ color: 'var(--text-muted)', margin: '0 auto 10px auto' }} />
              <h4 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', margin: 0 }}>
                Sin movimientos registrados
              </h4>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
                Tus recargas, compras y canjes se listarán aquí en tiempo real.
              </p>
            </div>
          ) : (
            movimientos.map((m) => {
              const isPositive = m.tipo === 'recarga' || m.tipo === 'puntos_ganados';
              return (
                <div
                  key={m.id}
                  style={{
                    background: 'var(--surface)',
                    borderRadius: 16,
                    padding: '12px 16px',
                    border: '1px solid var(--border)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0, paddingRight: 10 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>
                      {m.titulo}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                      {m.descripcion} • {m.fecha}
                    </div>
                  </div>

                  {m.monto !== undefined && (
                    <div
                      style={{
                        fontFamily: "'JetBrains Mono', monospace",
                        fontWeight: 700,
                        fontSize: 14,
                        color: isPositive ? '#34C759' : '#FF3B30',
                      }}
                    >
                      {isPositive ? '+' : '-'} C$ {m.monto.toFixed(2)}
                    </div>
                  )}

                  {m.puntos !== undefined && (
                    <div
                      style={{
                        fontFamily: "'JetBrains Mono', monospace",
                        fontWeight: 700,
                        fontSize: 13,
                        color: isPositive ? '#34C759' : '#FF9500',
                      }}
                    >
                      {isPositive ? '+' : '-'} {m.puntos} pts
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ─── MODAL RECARGA DE SALDO ─── */}
      <AnimatePresence>
        {modalRecargaOpen && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 99999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 16,
              background: 'rgba(0, 0, 0, 0.65)',
              backdropFilter: 'blur(8px)',
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              style={{
                width: '100%',
                maxWidth: 420,
                background: 'var(--surface)',
                borderRadius: 24,
                padding: 24,
                border: '1px solid var(--border)',
                boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
                color: 'var(--text)',
              }}
            >
              <h3
                style={{
                  fontSize: 18,
                  fontWeight: 800,
                  fontFamily: "'Syne', sans-serif",
                  margin: '0 0 6px 0',
                }}
              >
                Recargar Saldo Digital
              </h3>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '0 0 16px 0' }}>
                Ingresa el monto a abonar en Córdobas (C$):
              </p>

              <form onSubmit={handleRecargar} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>
                    Monto (C$)
                  </label>
                  <input
                    type="number"
                    step="10"
                    min="20"
                    value={montoRecarga}
                    onChange={(e) => setMontoRecarga(e.target.value)}
                    placeholder="Ej. 100"
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      borderRadius: 14,
                      border: '1px solid var(--border)',
                      background: 'var(--bg-alt)',
                      color: 'var(--text)',
                      fontSize: 18,
                      fontWeight: 700,
                      fontFamily: "'JetBrains Mono', monospace",
                      outline: 'none',
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>
                    Canal de Pago
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    <button
                      type="button"
                      onClick={() => setMetodoRecarga('agente')}
                      style={{
                        padding: '10px 8px',
                        borderRadius: 12,
                        border: metodoRecarga === 'agente' ? '2px solid var(--primario)' : '1px solid var(--border)',
                        background: metodoRecarga === 'agente' ? 'var(--primario-soft)' : 'var(--bg-alt)',
                        color: 'var(--text)',
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: 'pointer',
                        textAlign: 'center',
                      }}
                    >
                      Punto / Agente
                    </button>
                    <button
                      type="button"
                      onClick={() => setMetodoRecarga('efectivo')}
                      style={{
                        padding: '10px 8px',
                        borderRadius: 12,
                        border: metodoRecarga === 'efectivo' ? '2px solid var(--primario)' : '1px solid var(--border)',
                        background: metodoRecarga === 'efectivo' ? 'var(--primario-soft)' : 'var(--bg-alt)',
                        color: 'var(--text)',
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: 'pointer',
                        textAlign: 'center',
                      }}
                    >
                      Repartidor
                    </button>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
                  <button
                    type="button"
                    onClick={() => setModalRecargaOpen(false)}
                    style={{
                      flex: 1,
                      padding: '12px',
                      borderRadius: 14,
                      background: 'transparent',
                      border: '1px solid var(--border)',
                      color: 'var(--text)',
                      fontWeight: 600,
                      fontSize: 13,
                      cursor: 'pointer',
                    }}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isProcessingRecarga}
                    style={{
                      flex: 1,
                      padding: '12px',
                      borderRadius: 14,
                      background: 'var(--primario)',
                      color: '#FFFFFF',
                      border: 'none',
                      fontWeight: 700,
                      fontSize: 13,
                      cursor: isProcessingRecarga ? 'wait' : 'pointer',
                      opacity: isProcessingRecarga ? 0.7 : 1,
                    }}
                  >
                    {isProcessingRecarga ? 'Procesando...' : 'Confirmar'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
