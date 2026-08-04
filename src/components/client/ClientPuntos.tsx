'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Star, Gift, ArrowUpRight, TrendingUp, Wallet, CreditCard,
  Plus, CheckCircle2, Clock, Zap, Shield, ArrowRight
} from '@/components/icons';
import { useStore } from '@/lib/store';
import { notify } from '@/lib/notify';

interface ClientPuntosProps {
  isDark?: boolean;
  onClose?: () => void;
  initialTab?: 'puntos' | 'canjear' | 'historial' | 'billetera';
}

type TabType = 'puntos' | 'canjear' | 'historial' | 'billetera';

export default function ClientPuntos({ onClose, initialTab = 'puntos' }: ClientPuntosProps) {
  const { fidelizacion, canjearPuntos } = useStore();
  const [activeTab, setActiveTab] = useState<TabType>(initialTab);
  const [saldoBilletera, setSaldoBilletera] = useState(350.0);
  const [montoRecarga, setMontoRecarga] = useState('');
  const [modalRecargaOpen, setModalRecargaOpen] = useState(false);

  const puntos = fidelizacion?.puntos ?? 2450;
  const nivel = (fidelizacion?.nivel ?? 'oro').toUpperCase();

  const MOVIMIENTOS = [
    { tipo: 'ganado', desc: 'Envío #1024 completado', puntos: 120, fecha: 'Hace 2h' },
    { tipo: 'ganado', desc: 'Reseña de tienda de comida', puntos: 50, fecha: 'Ayer' },
    { tipo: 'canjeado', desc: 'Descuento C$ 50 en envío', puntos: -200, fecha: 'Hace 3 días' },
    { tipo: 'ganado', desc: 'Referir amigo (Juan Pérez)', puntos: 300, fecha: 'Hace 5 días' },
    { tipo: 'ganado', desc: 'Compra en Supermercado #1018', puntos: 180, fecha: 'Hace 1 semana' },
  ];

  const RECOMPENSAS = [
    { id: 1, titulo: 'C$ 20 de saldo en envío', costo: 100, valor: 'C$ 20', color: '#007AFF' },
    { id: 2, titulo: 'C$ 50 de saldo en compras', costo: 200, valor: 'C$ 50', color: '#FF9500' },
    { id: 3, titulo: 'Envío Gratis a Managua', costo: 400, valor: 'Envío Gratis', color: '#34C759' },
    { id: 4, titulo: 'Cupón 20% en Restaurantes', costo: 500, valor: '20% OFF', color: '#AF52DE' },
  ];

  const handleRedimir = (costo: number, titulo: string) => {
    if (puntos < costo) {
      notify.error(`Necesitas ${costo} puntos para canjear esta recompensa`);
      return;
    }
    const ok = canjearPuntos(costo);
    if (ok) {
      notify.success(`¡Felicidades! Canjeaste ${titulo}`);
    } else {
      notify.error('No se pudo procesar el canje');
    }
  };

  const handleRecargarSaldo = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(montoRecarga);
    if (!val || val <= 0) {
      notify.error('Ingresa un monto válido');
      return;
    }
    setSaldoBilletera(prev => prev + val);
    setMontoRecarga('');
    setModalRecargaOpen(false);
    notify.success(`¡Recarga exitosa! Se acreditaron C$ ${val.toFixed(2)} a tu billetera`);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 40 }}
      transition={{ duration: 0.3, ease: [0.2, 0, 0, 1] }}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9000,
        background: '#0B0E14',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: "'DM Sans', sans-serif",
        color: '#F8FAFC',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 20px',
          background: 'rgba(19, 24, 34, 0.95)',
          backdropFilter: 'blur(16px)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            onClick={onClose}
            style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              border: '1px solid rgba(255,255,255,0.15)',
              background: 'rgba(255, 255, 255, 0.08)',
              color: '#F8FAFC',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={20} />
          </button>
          <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 18, color: '#F8FAFC' }}>
            Billetera & Puntos Logifast
          </span>
        </div>
      </div>

      {/* Selector de Pestañas (Sub-navigation) */}
      <div
        style={{
          display: 'flex',
          gap: 6,
          padding: '8px 16px',
          background: 'rgba(15, 23, 42, 0.9)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          overflowX: 'auto',
        }}
      >
        {[
          { key: 'puntos', label: 'Mis Puntos', icon: <Star size={14} /> },
          { key: 'billetera', label: 'Billetera (C$)', icon: <Wallet size={14} /> },
          { key: 'canjear', label: 'Canjear', icon: <Gift size={14} /> },
          { key: 'historial', label: 'Historial', icon: <Clock size={14} /> },
        ].map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as TabType)}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                padding: '8px 14px',
                borderRadius: 100,
                border: 'none',
                background: isActive ? '#007AFF' : 'rgba(255, 255, 255, 0.06)',
                color: isActive ? '#FFFFFF' : '#94A3B8',
                fontSize: 13,
                fontWeight: isActive ? 700 : 500,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.2s',
              }}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Contenido según la Pestaña Seleccionada */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 16px' }}>

        {/* ─── PESTAÑA 1: MIS PUNTOS ─── */}
        {activeTab === 'puntos' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            {/* Points Hero Card */}
            <div
              style={{
                background: 'linear-gradient(135deg, #007AFF 0%, #0056B3 100%)',
                borderRadius: 24,
                padding: 24,
                color: '#FFFFFF',
                marginBottom: 20,
                boxShadow: '0 10px 30px rgba(0, 122, 255, 0.35)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
              }}
            >
              <div style={{ fontSize: 13, fontWeight: 600, opacity: 0.9, marginBottom: 4 }}>
                Balance de Puntos Acumulados
              </div>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 40, fontWeight: 800, lineHeight: 1.1, marginBottom: 12 }}>
                {puntos.toLocaleString()} <span style={{ fontSize: 18, fontWeight: 500 }}>PTS</span>
              </div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', borderRadius: 100, background: 'rgba(255,255,255,0.2)', fontSize: 13, fontWeight: 700 }}>
                <Star size={16} fill="#FFD700" color="#FFD700" />
                <span>Nivel {nivel}</span>
              </div>
            </div>

            {/* Quick Actions */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>
              <button
                onClick={() => setActiveTab('canjear')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  padding: 14,
                  borderRadius: 16,
                  background: 'rgba(52, 199, 89, 0.15)',
                  border: '1px solid rgba(52, 199, 89, 0.3)',
                  color: '#34C759',
                  fontWeight: 700,
                  fontSize: 14,
                  cursor: 'pointer',
                }}
              >
                <Gift size={18} />
                Canjear Puntos
              </button>
              <button
                onClick={() => setActiveTab('historial')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  padding: 14,
                  borderRadius: 16,
                  background: 'rgba(0, 122, 255, 0.15)',
                  border: '1px solid rgba(0, 122, 255, 0.3)',
                  color: '#007AFF',
                  fontWeight: 700,
                  fontSize: 14,
                  cursor: 'pointer',
                }}
              >
                <Clock size={18} />
                Ver Historial
              </button>
            </div>

            {/* Actividad Reciente Resumida */}
            <h3 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 16, color: '#F8FAFC', marginBottom: 12 }}>
              Últimos Movimientos
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {MOVIMIENTOS.slice(0, 3).map((mov, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: 14,
                    borderRadius: 16,
                    background: 'rgba(30, 41, 59, 0.8)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                  }}
                >
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#F8FAFC' }}>{mov.desc}</div>
                    <div style={{ fontSize: 12, color: '#94A3B8', marginTop: 2 }}>{mov.fecha}</div>
                  </div>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 15, fontWeight: 700, color: mov.puntos > 0 ? '#34C759' : '#FF9500' }}>
                    {mov.puntos > 0 ? `+${mov.puntos}` : mov.puntos} pts
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* ─── PESTAÑA 2: BILLETERA (C$) ─── */}
        {activeTab === 'billetera' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <div
              style={{
                background: 'linear-gradient(135deg, #1E293B 0%, #0F172A 100%)',
                borderRadius: 24,
                padding: 24,
                border: '1px solid rgba(255, 255, 255, 0.12)',
                marginBottom: 20,
              }}
            >
              <div style={{ fontSize: 13, color: '#94A3B8', marginBottom: 6 }}>Saldo disponible en tu Billetera</div>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 36, fontWeight: 800, color: '#34C759', marginBottom: 16 }}>
                C$ {saldoBilletera.toFixed(2)}
              </div>
              <button
                onClick={() => setModalRecargaOpen(true)}
                style={{
                  width: '100%',
                  padding: 14,
                  borderRadius: 16,
                  background: '#007AFF',
                  color: '#FFFFFF',
                  fontSize: 15,
                  fontWeight: 700,
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  cursor: 'pointer',
                  boxShadow: '0 4px 16px rgba(0, 122, 255, 0.3)',
                }}
              >
                <Plus size={18} />
                Recargar Saldo
              </button>
            </div>
          </motion.div>
        )}

        {/* ─── PESTAÑA 3: CANJEAR RECOMPENSAS ─── */}
        {activeTab === 'canjear' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <h3 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 16, color: '#F8FAFC', marginBottom: 12 }}>
              Catálogo de Recompensas
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 12 }}>
              {RECOMPENSAS.map((rec) => (
                <div
                  key={rec.id}
                  style={{
                    padding: 16,
                    borderRadius: 18,
                    background: 'rgba(30, 41, 59, 0.8)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: '#F8FAFC' }}>{rec.titulo}</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: rec.color, marginTop: 4 }}>
                      Costo: {rec.costo} puntos
                    </div>
                  </div>
                  <button
                    onClick={() => handleRedimir(rec.costo, rec.titulo)}
                    style={{
                      padding: '10px 16px',
                      borderRadius: 12,
                      background: puntos >= rec.costo ? rec.color : 'rgba(255, 255, 255, 0.1)',
                      color: puntos >= rec.costo ? '#FFFFFF' : '#64748B',
                      border: 'none',
                      fontSize: 13,
                      fontWeight: 700,
                      cursor: puntos >= rec.costo ? 'pointer' : 'not-allowed',
                    }}
                  >
                    Canjear
                  </button>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* ─── PESTAÑA 4: HISTORIAL DE MOVIMIENTOS ─── */}
        {activeTab === 'historial' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <h3 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 16, color: '#F8FAFC', marginBottom: 12 }}>
              Historial de Puntos
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {MOVIMIENTOS.map((mov, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: 14,
                    borderRadius: 16,
                    background: 'rgba(30, 41, 59, 0.8)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 12,
                        background: mov.puntos > 0 ? 'rgba(52, 199, 89, 0.15)' : 'rgba(255, 149, 0, 0.15)',
                        color: mov.puntos > 0 ? '#34C759' : '#FF9500',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <ArrowUpRight size={18} style={{ transform: mov.puntos < 0 ? 'rotate(90deg)' : 'none' }} />
                    </div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: '#F8FAFC' }}>{mov.desc}</div>
                      <div style={{ fontSize: 12, color: '#94A3B8', marginTop: 2 }}>{mov.fecha}</div>
                    </div>
                  </div>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 15, fontWeight: 700, color: mov.puntos > 0 ? '#34C759' : '#FF9500' }}>
                    {mov.puntos > 0 ? `+${mov.puntos}` : mov.puntos} pts
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        )}

      </div>

      {/* Modal para recargar saldo de Billetera */}
      <AnimatePresence>
        {modalRecargaOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setModalRecargaOpen(false)}
            style={{
              position: 'fixed', inset: 0, zIndex: 9999,
              background: 'rgba(15, 23, 42, 0.8)', backdropFilter: 'blur(12px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
            }}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                width: '100%', maxWidth: 380, background: '#1E293B',
                border: '1px solid rgba(255, 255, 255, 0.12)', borderRadius: 24, padding: 24,
                boxShadow: '0 20px 50px rgba(0,0,0,0.6)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: '#F8FAFC', margin: 0 }}>Recargar Billetera</h3>
                <button onClick={() => setModalRecargaOpen(false)} style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer' }}><X size={18} /></button>
              </div>
              <form onSubmit={handleRecargarSaldo} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label style={{ fontSize: 12, color: '#CBD5E1', display: 'block', marginBottom: 6 }}>Monto en Cordobas (C$)</label>
                  <input
                    type="number"
                    required
                    min="10"
                    value={montoRecarga}
                    onChange={(e) => setMontoRecarga(e.target.value)}
                    placeholder="Ej. 100, 200, 500"
                    style={{
                      width: '100%', padding: '12px 14px', borderRadius: 14,
                      background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255, 255, 255, 0.15)',
                      color: '#F8FAFC', fontSize: 16, fontWeight: 600, outline: 'none',
                    }}
                  />
                </div>
                <button
                  type="submit"
                  style={{
                    padding: 14, borderRadius: 14, background: '#007AFF', color: '#FFFFFF',
                    border: 'none', fontSize: 15, fontWeight: 700, cursor: 'pointer', marginTop: 10,
                  }}
                >
                  Confirmar Recarga
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
