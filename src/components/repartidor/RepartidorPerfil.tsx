'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, ResponsiveContainer, Cell, Tooltip } from 'recharts';
import {
  Star,
  Bike,
  Route as RouteIcon,
  Clock,
  Wrench,
  AlertTriangle,
  ChevronDown,
  Vibrate,
  MapPin,
  Bell,
  Mail,
  HelpCircle,
  LogOut,
  TrendingUp,
  ChevronRight,
} from '@/components/icons';
import { useRepartidorStore } from '@/lib/repartidor-store';
import { useConfigStore } from '@/store/configStore';
import { TemaToggle } from '@/components/ui/TemaToggle';
import { SonidoToggle } from '@/components/ui/SonidoToggle';
import { Switch } from '@/components/ui/switch';
import PullToRefresh from '@/components/ui/PullToRefresh';
import { PerfilSkeleton } from '@/components/ui/Skeletons';

/* ═══════════════════════════════════════════════
   STAR RATING (exported for reuse)
   ═══════════════════════════════════════════════ */

export function StarRating({ value, size = 16 }: { value: number; size?: number }) {
  return (
    <div style={{ display: 'inline-flex', gap: 2 }} aria-label={`${value} de 5 estrellas`}>
      {[0, 1, 2, 3, 4].map((i) => {
        const filled = i < Math.floor(value);
        const half = !filled && i < value;
        return (
          <span key={i} style={{ position: 'relative', display: 'inline-flex' }}>
            <Star size={size} color="var(--warning, var(--warning))" fill="none" strokeWidth={2} />
            {(filled || half) && (
              <span
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: half ? '50%' : '100%',
                  overflow: 'hidden',
                  display: 'inline-flex',
                }}
              >
                <Star size={size} color="var(--warning, var(--warning))" fill="var(--warning, var(--warning))" strokeWidth={2} />
              </span>
            )}
          </span>
        );
      })}
    </div>
  );
}

/* ═══════════════════════════════════════════════
   PROPS
   ═══════════════════════════════════════════════ */

interface RepartidorPerfilProps {
  /** Kept for backward-compat with the parent shell — theme is now owned by configStore. */
  isDark?: boolean;
  /** Kept for backward-compat — toggling routes through configStore.setTema via <TemaToggle/>. */
  toggleTheme?: () => void;
  onLogout: () => void;
  userName: string;
}

/* ═══════════════════════════════════════════════
   SECTION CARD
   ═══════════════════════════════════════════════ */

function SectionCard({
  title,
  children,
  action,
}: {
  title: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <section
      style={{
        padding: 16,
        borderRadius: 20,
        background: 'rgba(30, 41, 59, 0.8)',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        backdropFilter: 'blur(16px)',
        marginBottom: 12,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 12,
        }}
      >
        <h2
          className="font-syne"
          style={{ fontSize: 15, fontWeight: 700, color: '#F8FAFC', letterSpacing: '-0.2px' }}
        >
          {title}
        </h2>
        {action}
      </div>
      {children}
    </section>
  );
}

function StatBox({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  color: string;
}) {
  return (
    <div
      style={{
        padding: 12,
        borderRadius: 14,
        background: 'rgba(15, 23, 42, 0.6)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          fontSize: 11,
          color: 'var(--text-muted)',
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.03em',
        }}
      >
        <span style={{ color }}>{icon}</span>
        {label}
      </div>
      <div
        className="font-mono"
        style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)', lineHeight: 1.1 }}
      >
        {value}
      </div>
    </div>
  );
}

function ConfigToggle({
  icon,
  label,
  desc,
  checked,
  onChange,
}: {
  icon: React.ReactNode;
  label: string;
  desc?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '12px 0',
        borderBottom: '1px solid var(--md-outline-variant)',
      }}
    >
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: 10,
          background: 'var(--md-surface-variant)',
          color: 'var(--text-secondary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        {icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{label}</div>
        {desc && <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{desc}</div>}
      </div>
      <Switch checked={checked} onCheckedChange={onChange} aria-label={label} />
    </div>
  );
}

function ConfigLink({
  icon,
  label,
  onClick,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  color?: string;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '12px 0',
        background: 'transparent',
        border: 'none',
        borderBottom: '1px solid var(--md-outline-variant)',
        cursor: 'pointer',
        fontFamily: "'DM Sans', sans-serif",
        textAlign: 'left',
      }}
    >
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: 10,
          background: color ? `color-mix(in srgb, ${color} 12%, transparent)` : 'var(--md-surface-variant)',
          color: color || 'var(--text-secondary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        {icon}
      </div>
      <span style={{ flex: 1, fontSize: 14, fontWeight: 600, color: color || 'var(--text)' }}>
        {label}
      </span>
      <ChevronRight size={16} color="var(--text-muted)" />
    </button>
  );
}

/* ═══════════════════════════════════════════════
   BAR CHART DATA — entregas por día (última semana)
   ═══════════════════════════════════════════════ */

const ENTREGAS_SEMANA = [
  { x: 'L', v: 5 },
  { x: 'M', v: 7 },
  { x: 'X', v: 6 },
  { x: 'J', v: 8 },
  { x: 'V', v: 9 },
  { x: 'S', v: 2 },
  { x: 'D', v: 1 },
];

/* Rating distribution (mock percentages) */
const RATING_DIST = [
  { stars: 5, pct: 78 },
  { stars: 4, pct: 14 },
  { stars: 3, pct: 5 },
  { stars: 2, pct: 2 },
  { stars: 1, pct: 1 },
];

/* ═══════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════ */

export default function RepartidorPerfil({ onLogout, userName }: RepartidorPerfilProps) {
  const { perfil, moto, calificaciones, actualizarConfig, zonasDisponibles, recargarSaldo, aceptarContrato, syncFromBackend } = useRepartidorStore();
  const [zonaOpen, setZonaOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [rechargeCode, setRechargeCode] = useState('');
  const [rechargeMsg, setRechargeMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [recargasHistorial, setRecargasHistorial] = useState<Array<{ id: string; monto: number; metodo: string; codigo?: string | null; createdAt: string }>>([]);

  // Cargar historial de recargas real
  useEffect(() => {
    fetch('/api/recargas')
      .then((r) => r.json())
      .then((data) => {
        if (data?.recargas) setRecargasHistorial(data.recargas);
      })
      .catch(() => null);
  }, [perfil.saldo]);

  const handleRedeem = async () => {
    if (!rechargeCode.trim()) return;
    const cleanCode = rechargeCode.trim().toUpperCase();
    setLoading(true);
    try {
      const res = await fetch('/api/recargas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          monto: 0, // se ignora si es código
          metodo: 'codigo',
          codigo: cleanCode,
        }),
      });
      const data = await res.json();
      setLoading(false);
      if (res.ok && data.ok) {
        setRechargeMsg({ type: 'success', text: `¡Éxito! Se han recargado C$ ${data.nuevoSaldo - perfil.saldo} a tu cuenta.` });
        setRechargeCode('');
        // Recargar perfil + historial
        await syncFromBackend();
        const histRes = await fetch('/api/recargas');
        const histData = await histRes.json();
        if (histData?.recargas) setRecargasHistorial(histData.recargas);
        setTimeout(() => setRechargeMsg(null), 4000);
      } else {
        setRechargeMsg({ type: 'error', text: data.error || 'Código inválido o ya utilizado.' });
        setTimeout(() => setRechargeMsg(null), 4000);
      }
    } catch {
      setLoading(false);
      setRechargeMsg({ type: 'error', text: 'Error de conexión' });
      setTimeout(() => setRechargeMsg(null), 4000);
    }
  };

  /* ─── Configuración global (configStore) ─── */
  const vibracionActiva = useConfigStore((s) => s.vibracionActiva);
  const toggleVibracion = useConfigStore((s) => s.toggleVibracion);
  const compartirUbicacion = useConfigStore((s) => s.compartirUbicacion);
  const toggleCompartirUbicacion = useConfigStore((s) => s.toggleCompartirUbicacion);
  const notificacionesPush = useConfigStore((s) => s.notificacionesPush);
  const toggleNotificacionesPush = useConfigStore((s) => s.toggleNotificacionesPush);
  const notificacionesEmail = useConfigStore((s) => s.notificacionesEmail);
  const toggleNotificacionesEmail = useConfigStore((s) => s.toggleNotificacionesEmail);

  const handleRefresh = async () => {
    setLoading(true);
    try {
      // Sincroniza datos reales desde la API (perfil, moto, calificaciones, etc.)
      await syncFromBackend();
    } catch (err) {
      console.error('[RepartidorPerfil.handleRefresh]', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <PullToRefresh onRefresh={handleRefresh}>
      {loading ? (
        <PerfilSkeleton />
      ) : (
        <div style={{ paddingBottom: 16 }}>
      {/* ─── HEADER ─── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          padding: 16,
          borderRadius: 20,
          background: 'var(--md-surface)',
          border: '1px solid var(--md-outline-variant)',
          marginBottom: 12,
        }}
      >
        <div
          style={{
            width: 72,
            height: 72,
            borderRadius: 20,
            background: `linear-gradient(135deg, ${perfil.color}, color-mix(in srgb, ${perfil.color} 70%, #000))`,
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: "'Syne', sans-serif",
            fontSize: 22,
            fontWeight: 700,
            flexShrink: 0,
            boxShadow: 'var(--md-elevation-2)',
          }}
        >
          {perfil.initials}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h1
            className="font-syne"
            style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.3px' }}
          >
            {userName || perfil.nombre}
          </h1>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              marginTop: 4,
              flexWrap: 'wrap',
            }}
          >
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                padding: '3px 8px',
                borderRadius: 100,
                background: 'var(--md-primary-container)',
                color: 'var(--md-on-primary-container)',
                fontSize: 11,
                fontWeight: 700,
              }}
            >
              <Bike size={11} />
              Repartidor
            </span>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              {moto.modelo}
            </span>
          </div>
        </div>
      </div>

      {/* ─── 1. ESTADÍSTICAS GENERALES ─── */}
      <SectionCard title="Estadísticas generales">
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 8,
            marginBottom: 12,
          }}
        >
          <StatBox
            label="Entregas totales"
            value={perfil.totalEntregas.toString()}
            icon={<Bike size={12} />}
            color="var(--primario)"
          />
          <StatBox
            label="Km totales"
            value={`${perfil.totalKm.toFixed(0)}`}
            icon={<RouteIcon size={12} />}
            color="var(--info, #2979FF)"
          />
          <StatBox
            label="Calificación"
            value={perfil.calificacion.toFixed(1)}
            icon={<Star size={12} />}
            color="var(--warning, var(--warning))"
          />
          <StatBox
            label="Tiempo prom."
            value={`${perfil.tiempoPromedio} min`}
            icon={<Clock size={12} />}
            color="var(--exito, var(--exito))"
          />
        </div>
        <div
          style={{
            fontSize: 11,
            color: 'var(--text-muted)',
            marginBottom: 8,
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.03em',
          }}
        >
          Entregas últimos 7 días
        </div>
        <div style={{ height: 110, width: '100%' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={ENTREGAS_SEMANA} margin={{ top: 4, right: 0, bottom: 0, left: -24 }}>
              <XAxis
                dataKey="x"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: 'var(--text-muted)', fontFamily: "'JetBrains Mono', monospace" }}
              />
              <Tooltip
                cursor={{ fill: 'color-mix(in srgb, var(--primario) 8%, transparent)' }}
                contentStyle={{
                  borderRadius: 8,
                  border: '1px solid var(--md-outline-variant)',
                  background: 'var(--md-surface)',
                  fontSize: 12,
                }}
                formatter={(v: any) => [`${v} entregas`, '']}
              />
              <Bar dataKey="v" radius={[6, 6, 0, 0]} maxBarSize={24}>
                {ENTREGAS_SEMANA.map((_, i) => (
                  <Cell key={`cell-${i}`} fill="var(--primario)" />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </SectionCard>

      {/* ─── 2. MOTO ASIGNADA ─── */}
      <SectionCard title="Moto asignada">
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            marginBottom: 12,
          }}
        >
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: 14,
              background: 'color-mix(in srgb, var(--primario) 12%, transparent)',
              color: 'var(--primario)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Bike size={26} />
          </div>
          <div style={{ flex: 1 }}>
            <div
              className="font-mono"
              style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)' }}
            >
              {moto.nombre}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{moto.modelo}</div>
          </div>
          <span
            className={`lf-badge ${
              moto.estado === 'DISPONIBLE'
                ? 'lf-badge-disponible'
                : moto.estado === 'EN_SERVICIO'
                  ? 'lf-badge-en-servicio'
                  : 'lf-badge-mantenimiento'
            }`}
            style={{
              padding: '4px 10px',
              borderRadius: 100,
              background:
                moto.estado === 'DISPONIBLE'
                  ? 'color-mix(in srgb, var(--exito, var(--exito)) 14%, transparent)'
                  : moto.estado === 'EN_SERVICIO'
                    ? 'color-mix(in srgb, var(--primario) 14%, transparent)'
                    : 'color-mix(in srgb, var(--warning, var(--warning)) 14%, transparent)',
              color:
                moto.estado === 'DISPONIBLE'
                  ? 'var(--exito, var(--exito))'
                  : moto.estado === 'EN_SERVICIO'
                    ? 'var(--primario)'
                    : 'var(--warning, var(--warning))',
              fontSize: 11,
              fontWeight: 700,
            }}
          >
            {moto.estado.replace('_', ' ')}
          </span>
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 8,
            fontSize: 12,
            color: 'var(--text-secondary)',
          }}
        >
          <div>
            <div style={{ color: 'var(--text-muted)', marginBottom: 2 }}>Placa</div>
            <div className="font-mono" style={{ color: 'var(--text)', fontWeight: 700 }}>
              {moto.placa}
            </div>
          </div>
          <div>
            <div style={{ color: 'var(--text-muted)', marginBottom: 2 }}>Km acumulados</div>
            <div className="font-mono" style={{ color: 'var(--text)', fontWeight: 700 }}>
              {moto.kmAcumulados.toLocaleString('es-NI')} km
            </div>
          </div>
          <div>
            <div style={{ color: 'var(--text-muted)', marginBottom: 2 }}>Último mantenimiento</div>
            <div style={{ color: 'var(--text)', fontWeight: 600 }}>
              {new Date(moto.ultimoMantenimiento).toLocaleDateString('es-NI', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
              })}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{moto.tipoUltimoMantenimiento}</div>
          </div>
          <div>
            <div style={{ color: 'var(--text-muted)', marginBottom: 2 }}>Próximo mantenimiento</div>
            <div className="font-mono" style={{ color: 'var(--text)', fontWeight: 700 }}>
              {moto.proximoMantenimientoKm?.toLocaleString('es-NI') || '—'} km
            </div>
          </div>
        </div>
        {moto.alertaMantenimiento && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              marginTop: 12,
              padding: 12,
              borderRadius: 12,
              background: 'color-mix(in srgb, var(--warning, var(--warning)) 10%, transparent)',
              border: '1px solid var(--warning, var(--warning))',
              display: 'flex',
              alignItems: 'flex-start',
              gap: 8,
            }}
          >
            <AlertTriangle size={16} color="var(--warning, var(--warning))" style={{ flexShrink: 0, marginTop: 1 }} />
            <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
              <strong style={{ color: 'var(--text)' }}>Mantenimiento pronto.</strong> La moto está
              cerca del próximo servicio programado.
            </div>
          </motion.div>
        )}
      </SectionCard>

      {/* ─── 3. CALIFICACIÓN ─── */}
      <SectionCard title="Calificación">
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            marginBottom: 16,
          }}
        >
          <div
            className="font-syne"
            style={{ fontSize: 48, fontWeight: 700, color: 'var(--text)', lineHeight: 1 }}
          >
            {perfil.calificacion.toFixed(1)}
          </div>
          <div>
            <StarRating value={perfil.calificacion} size={18} />
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
              ({perfil.totalEntregas} reseñas)
            </div>
          </div>
        </div>
        {/* Distribution */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 }}>
          {RATING_DIST.map((d) => (
            <div key={d.stars} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span
                style={{
                  fontSize: 11,
                  color: 'var(--text-muted)',
                  width: 24,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 2,
                }}
              >
                {d.stars}
                <Star size={10} color="var(--warning, var(--warning))" fill="var(--warning, var(--warning))" />
              </span>
              <div
                style={{
                  flex: 1,
                  height: 6,
                  borderRadius: 3,
                  background: 'var(--md-outline-variant)',
                  overflow: 'hidden',
                }}
              >
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${d.pct}%` }}
                  transition={{ duration: 0.6, ease: 'easeOut' }}
                  style={{
                    height: '100%',
                    background: 'var(--warning, var(--warning))',
                  }}
                />
              </div>
              <span
                className="font-mono"
                style={{ fontSize: 11, color: 'var(--text-muted)', width: 32, textAlign: 'right' }}
              >
                {d.pct}%
              </span>
            </div>
          ))}
        </div>
        {/* Last 3 reviews */}
        <div
          style={{
            fontSize: 11,
            color: 'var(--text-muted)',
            marginBottom: 8,
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.03em',
          }}
        >
          Últimas reseñas
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {calificaciones.slice(0, 3).map((c) => (
            <div
              key={c.id}
              style={{
                padding: 12,
                borderRadius: 12,
                background: 'var(--md-surface-variant)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 4,
                }}
              >
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>
                  {c.cliente}
                </span>
                <StarRating value={c.estrellas} size={12} />
              </div>
              {c.comentario && (
                <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                  {c.comentario}
                </p>
              )}
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                {c.fecha}
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* ─── BILLETERA DIGITAL Y RECARGAS ─── */}
      <SectionCard title="Billetera Digital y Comisiones">
        <div
          style={{
            padding: '16px',
            borderRadius: '16px',
            background: 'linear-gradient(135deg, var(--primario) 0%, #d4af37 100%)',
            color: '#fff',
            marginBottom: '16px',
            boxShadow: 'var(--md-elevation-1)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div>
            <div style={{ fontSize: '11px', opacity: 0.8, textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.5px' }}>Saldo disponible</div>
            <div style={{ fontSize: '26px', fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", marginTop: '2px' }}>
              C$ {perfil.saldo.toLocaleString('es-NI')}
            </div>
          </div>
          <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="4" width="20" height="16" rx="2" />
              <line x1="12" y1="4" x2="12" y2="20" />
            </svg>
          </div>
        </div>

        <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
          La comisión de la plataforma es del <strong>15% por cada pedido completado</strong>. Debes mantener saldo positivo para poder conectarte.
        </div>

        {/* Canje de Código */}
        <div style={{ marginTop: '12px', borderBottom: '1px solid var(--md-outline-variant)', paddingBottom: '16px' }}>
          <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)', display: 'block', marginBottom: '6px' }}>
            Canjear Código de Recarga
          </label>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              type="text"
              placeholder="Ej: LF-RECARGA-500"
              value={rechargeCode}
              onChange={(e) => setRechargeCode(e.target.value)}
              style={{
                flex: 1,
                padding: '10px 12px',
                borderRadius: '12px',
                background: 'var(--md-surface-variant)',
                border: '1px solid var(--md-outline-variant)',
                color: 'var(--text)',
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '13px',
              }}
            />
            <button
              onClick={handleRedeem}
              style={{
                padding: '10px 16px',
                borderRadius: '12px',
                background: 'var(--primario)',
                color: '#fff',
                border: 'none',
                fontWeight: 700,
                fontSize: '13px',
                cursor: 'pointer',
              }}
            >
              Canjear
            </button>
          </div>

          <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
            <button
              onClick={() => setRechargeCode('LF-RECARGA-500')}
              style={{
                padding: '4px 8px',
                fontSize: '11px',
                borderRadius: '6px',
                border: '1px dashed var(--primario)',
                color: 'var(--primario)',
                background: 'transparent',
                cursor: 'pointer',
              }}
            >
              Recargar C$ 500
            </button>
            <button
              onClick={() => setRechargeCode('LF-RECARGA-1000')}
              style={{
                padding: '4px 8px',
                fontSize: '11px',
                borderRadius: '6px',
                border: '1px dashed var(--primario)',
                color: 'var(--primario)',
                background: 'transparent',
                cursor: 'pointer',
              }}
            >
              Recargar C$ 1000
            </button>
          </div>

          {rechargeMsg && (
            <div
              style={{
                marginTop: '10px',
                padding: '8px 12px',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: 600,
                background: rechargeMsg.type === 'success' ? 'rgba(0, 200, 83, 0.1)' : 'rgba(255, 23, 68, 0.1)',
                color: rechargeMsg.type === 'success' ? 'var(--exito)' : 'var(--peligro)',
                border: `1px solid ${rechargeMsg.type === 'success' ? 'var(--exito)' : 'var(--peligro)'}`,
              }}
            >
              {rechargeMsg.text}
            </div>
          )}
        </div>

        {/* Historial de recargas */}
        <div style={{ marginTop: '16px' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.03em', marginBottom: '8px' }}>
            Historial de Recargas
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {recargasHistorial.length > 0 ? (
              recargasHistorial.map((r) => (
                <div
                  key={r.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '10px 12px',
                    borderRadius: '12px',
                    background: 'var(--md-surface-variant)',
                    border: '1px solid rgba(0,200,83,0.1)',
                  }}
                >
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>
                      Recarga confirmada
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                      {r.codigo ? `Código: ${r.codigo} · ` : ''}
                      {new Date(r.createdAt).toLocaleDateString('es-NI', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--exito)', fontFamily: "'JetBrains Mono', monospace" }}>
                    +C$ {r.monto}
                  </div>
                </div>
              ))
            ) : (
              <div style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', padding: 16 }}>
                No hay recargas registradas aún.
                <br />
                <span style={{ fontSize: 11, opacity: 0.7 }}>
                  Usa códigos como <code style={{ background: 'rgba(0,0,0,0.05)', padding: '2px 6px', borderRadius: 4 }}>LOGI20</code> o <code style={{ background: 'rgba(0,0,0,0.05)', padding: '2px 6px', borderRadius: 4 }}>BIENVENIDA</code>
                </span>
              </div>
            )}
          </div>
        </div>
      </SectionCard>

      {/* ─── CONTRATO DIGITAL OBLIGATORIO ─── */}
      <SectionCard title="Contrato Digital Obligatorio">
        <div
          style={{
            padding: '12px',
            borderRadius: '12px',
            background: 'var(--md-surface-variant)',
            border: '1px solid var(--md-outline-variant)',
            maxHeight: '140px',
            overflowY: 'auto',
            fontSize: '11.5px',
            color: 'var(--text-secondary)',
            lineHeight: 1.5,
            marginBottom: '12px',
          }}
        >
          <strong style={{ color: 'var(--text)', display: 'block', marginBottom: '4px' }}>
            CONTRATO DE INTERMEDIACIÓN TECNOLÓGICA (LOGIFAST)
          </strong>
          Logifast Delivery funciona únicamente como un intermediario tecnológico entre el comercio/cliente y el motorizado prestador de servicios.
          <br /><br />
          Al activar su cuenta, el motorizado declara conocer y aceptar que LOGIFAST NO ASUME RESPONSABILIDAD de ningún tipo sobre:
          <ul style={{ paddingLeft: '16px', margin: '4px 0' }}>
            <li>Seguro médico o gastos de hospitalización.</li>
            <li>Seguro contra terceros o daños del vehículo.</li>
            <li>Accidentes de tránsito o incapacidad personal.</li>
            <li>Depreciación mecánica o repuestos de la motocicleta.</li>
            <li>Multas de tránsito o retenciones del vehículo.</li>
            <li>Cualquier relación laboral de dependencia directa.</li>
          </ul>
          Este documento de deslinde legal se formula tomando en cuenta la legislación de comercio electrónico y civil aplicable en la República de Nicaragua.
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0' }}>
          <div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)' }}>
              Aceptar Términos de Deslinde
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              Obligatorio para recibir asignaciones
            </div>
          </div>
          <div>
            {perfil.contratoAceptado ? (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '4px 10px',
                  borderRadius: '100px',
                  background: 'rgba(0, 200, 83, 0.12)',
                  color: 'var(--exito)',
                  fontSize: '11px',
                  fontWeight: 700,
                }}
              >
                ✓ FIRMADO
              </span>
            ) : (
              <button
                onClick={aceptarContrato}
                style={{
                  padding: '6px 12px',
                  borderRadius: '8px',
                  background: 'var(--primario)',
                  color: '#fff',
                  border: 'none',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Firmar Contrato
              </button>
            )}
          </div>
        </div>
      </SectionCard>

      {/* ─── 4. CONFIGURACIÓN ─── */}
      <SectionCard title="Configuración">
        {/* Tema — 3-state segmented control wired to configStore */}
        <div style={{ padding: '12px 0', borderBottom: '1px solid var(--md-outline-variant)' }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>
            Tema
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 10 }}>
            Claro, oscuro o seguir al sistema
          </div>
          <TemaToggle />
        </div>

        {/* Sonido — toggle + volume slider + test button wired to configStore */}
        <div style={{ padding: '12px 0', borderBottom: '1px solid var(--md-outline-variant)' }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 10 }}>
            Sonido
          </div>
          <SonidoToggle />
        </div>

        <ConfigToggle
          icon={<Vibrate size={16} />}
          label="Vibración"
          desc="Vibrar al recibir notificaciones"
          checked={vibracionActiva}
          onChange={() => toggleVibracion()}
        />
        <ConfigToggle
          icon={<MapPin size={16} />}
          label="Compartir ubicación"
          desc="Compartir ubicación en tiempo real durante servicio"
          checked={compartirUbicacion}
          onChange={() => toggleCompartirUbicacion()}
        />
        <ConfigToggle
          icon={<Bell size={16} />}
          label="Notificaciones push"
          desc="Recibir alertas push en el dispositivo"
          checked={notificacionesPush}
          onChange={() => toggleNotificacionesPush()}
        />
        <ConfigToggle
          icon={<Mail size={16} />}
          label="Notificaciones por email"
          desc="Recibir copia de notificaciones por correo"
          checked={notificacionesEmail}
          onChange={() => toggleNotificacionesEmail()}
        />

        {/* Zona preferida */}
        <div style={{ padding: '12px 0', borderBottom: '1px solid var(--md-outline-variant)' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: 'var(--md-surface-variant)',
                color: 'var(--text-secondary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <MapPin size={16} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>Zona preferida</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                Recibirás órdenes prioritarias en esta zona
              </div>
            </div>
          </div>
          <div style={{ position: 'relative', marginTop: 8 }}>
            <button
              onClick={() => setZonaOpen((o) => !o)}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: 12,
                background: 'var(--md-surface-variant)',
                border: '1px solid var(--md-outline-variant)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 13,
                fontWeight: 600,
                color: 'var(--text)',
              }}
            >
              {perfil.zonaPreferida}
              <ChevronDown
                size={16}
                color="var(--text-muted)"
                style={{
                  transform: zonaOpen ? 'rotate(180deg)' : 'none',
                  transition: 'transform 0.2s ease',
                }}
              />
            </button>
            {zonaOpen && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.15 }}
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 4px)',
                  left: 0,
                  right: 0,
                  padding: 6,
                  borderRadius: 12,
                  background: 'var(--md-surface)',
                  border: '1px solid var(--md-outline-variant)',
                  boxShadow: 'var(--md-elevation-2)',
                  zIndex: 10,
                  maxHeight: 220,
                  overflowY: 'auto',
                }}
              >
                {zonasDisponibles.map((z) => (
                  <button
                    key={z}
                    onClick={() => {
                      actualizarConfig('zonaPreferida', z);
                      setZonaOpen(false);
                    }}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      borderRadius: 8,
                      border: 'none',
                      background:
                        z === perfil.zonaPreferida
                          ? 'color-mix(in srgb, var(--primario) 10%, transparent)'
                          : 'transparent',
                      color:
                        z === perfil.zonaPreferida ? 'var(--primario)' : 'var(--text)',
                      fontSize: 13,
                      fontWeight: z === perfil.zonaPreferida ? 700 : 500,
                      textAlign: 'left',
                      cursor: 'pointer',
                      fontFamily: "'DM Sans', sans-serif",
                    }}
                  >
                    {z}
                  </button>
                ))}
              </motion.div>
            )}
          </div>
        </div>

        <ConfigLink
          icon={<Wrench size={16} />}
          label="Reportar problema con moto"
          onClick={() => {
            /* abriría un formulario */
          }}
        />
        <ConfigLink
          icon={<HelpCircle size={16} />}
          label="Centro de ayuda"
          onClick={() => {
            /* abriría FAQ */
          }}
        />

        {/* Cerrar sesión */}
        <button
          onClick={onLogout}
          style={{
            width: '100%',
            padding: '14px 0',
            marginTop: 12,
            background: 'transparent',
            border: 'none',
            color: 'var(--peligro, var(--peligro))',
            fontSize: 14,
            fontWeight: 700,
            fontFamily: "'DM Sans', sans-serif",
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
          }}
        >
          <LogOut size={16} />
          Cerrar sesión
        </button>
      </SectionCard>

      <div
        style={{
          textAlign: 'center',
          fontSize: 11,
          color: 'var(--text-muted)',
          marginTop: 8,
        }}
      >
        LOGIFAST Repartidor v2.0
      </div>
        </div>
      )}
    </PullToRefresh>
  );
}
