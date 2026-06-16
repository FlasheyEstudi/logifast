'use client';

import React, { useState } from 'react';
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
} from 'lucide-react';
import { useRepartidorStore } from '@/lib/repartidor-store';
import { useConfigStore } from '@/store/configStore';
import { TemaToggle } from '@/components/ui/TemaToggle';
import { SonidoToggle } from '@/components/ui/SonidoToggle';
import { Switch } from '@/components/ui/switch';

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
            <Star size={size} color="var(--warning, #FFB300)" fill="none" strokeWidth={2} />
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
                <Star size={size} color="var(--warning, #FFB300)" fill="var(--warning, #FFB300)" strokeWidth={2} />
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
        background: 'var(--md-surface)',
        border: '1px solid var(--md-outline-variant)',
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
          style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.2px' }}
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
        background: 'var(--md-surface-variant)',
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
  const { perfil, moto, calificaciones, actualizarConfig, zonasDisponibles } = useRepartidorStore();
  const [zonaOpen, setZonaOpen] = useState(false);

  /* ─── Configuración global (configStore) ─── */
  const vibracionActiva = useConfigStore((s) => s.vibracionActiva);
  const toggleVibracion = useConfigStore((s) => s.toggleVibracion);
  const compartirUbicacion = useConfigStore((s) => s.compartirUbicacion);
  const toggleCompartirUbicacion = useConfigStore((s) => s.toggleCompartirUbicacion);
  const notificacionesPush = useConfigStore((s) => s.notificacionesPush);
  const toggleNotificacionesPush = useConfigStore((s) => s.toggleNotificacionesPush);
  const notificacionesEmail = useConfigStore((s) => s.notificacionesEmail);
  const toggleNotificacionesEmail = useConfigStore((s) => s.toggleNotificacionesEmail);

  return (
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
            color="var(--warning, #FFB300)"
          />
          <StatBox
            label="Tiempo prom."
            value={`${perfil.tiempoPromedio} min`}
            icon={<Clock size={12} />}
            color="var(--exito, #00C853)"
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
                  ? 'color-mix(in srgb, var(--exito, #00C853) 14%, transparent)'
                  : moto.estado === 'EN_SERVICIO'
                    ? 'color-mix(in srgb, var(--primario) 14%, transparent)'
                    : 'color-mix(in srgb, var(--warning, #FFB300) 14%, transparent)',
              color:
                moto.estado === 'DISPONIBLE'
                  ? 'var(--exito, #00C853)'
                  : moto.estado === 'EN_SERVICIO'
                    ? 'var(--primario)'
                    : 'var(--warning, #FFB300)',
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
              background: 'color-mix(in srgb, var(--warning, #FFB300) 10%, transparent)',
              border: '1px solid var(--warning, #FFB300)',
              display: 'flex',
              alignItems: 'flex-start',
              gap: 8,
            }}
          >
            <AlertTriangle size={16} color="var(--warning, #FFB300)" style={{ flexShrink: 0, marginTop: 1 }} />
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
                <Star size={10} color="var(--warning, #FFB300)" fill="var(--warning, #FFB300)" />
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
                    background: 'var(--warning, #FFB300)',
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
            color: 'var(--peligro, #FF1744)',
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
  );
}
