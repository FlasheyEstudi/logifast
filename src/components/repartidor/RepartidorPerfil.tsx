'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { notify } from '@/lib/notify';
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
  FileText,
  Shield,
  CreditCard,
  Plus,
  Check,
  Zap,
  DollarSign,
  Camera,
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
  const {
    perfil,
    moto,
    calificaciones,
    actualizarConfig,
    zonasDisponibles,
    recargarSaldo,
    aceptarContrato,
    syncFromBackend,
    reportarProblemaMotoAsync,
  } = useRepartidorStore();
  const [zonaOpen, setZonaOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [rechargeCode, setRechargeCode] = useState('');
  const [rechargeMsg, setRechargeMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [recargasHistorial, setRecargasHistorial] = useState<Array<{ id: string; monto: number; metodo: string; codigo?: string | null; createdAt: string }>>([]);

  // Profile edit states
  const [showEditModal, setShowEditModal] = useState(false);
  const [editNombre, setEditNombre] = useState('');
  const [editTelefono, setEditTelefono] = useState('');
  const [editFotoUrl, setEditFotoUrl] = useState('');
  const [editCedula, setEditCedula] = useState('');
  const [editLicenciaConducir, setEditLicenciaConducir] = useState('');
  const [editVehiculoMarca, setEditVehiculoMarca] = useState('Honda');
  const [editVehiculoModelo, setEditVehiculoModelo] = useState('Wave 110');
  const [editVehiculoPlaca, setEditVehiculoPlaca] = useState('');
  const [editMunicipio, setEditMunicipio] = useState('Managua');
  const [editZona, setEditZona] = useState('Todas las Zonas');
  const [isSavingPerfil, setIsSavingPerfil] = useState(false);

  // Motorcycle problem report states (Vinculación con rol Mantenimiento / Ingeniero)
  const [showReportarMotoModal, setShowReportarMotoModal] = useState(false);
  const [categoriaProblema, setCategoriaProblema] = useState('FRENOS');
  const [prioridadProblema, setPrioridadProblema] = useState<'NORMAL' | 'ALTA' | 'URGENTE'>('ALTA');
  const [descripcionProblema, setDescripcionProblema] = useState('');
  const [kmReporte, setKmReporte] = useState<string>('');
  const [observacionesReporte, setObservacionesReporte] = useState('');
  const [isSubmittingReporte, setIsSubmittingReporte] = useState(false);
  const [reportesTab, setReportesTab] = useState<'nuevo' | 'historial'>('nuevo');
  const [showHelpModal, setShowHelpModal] = useState(false);

  useEffect(() => {
    if (moto?.kmAcumulados !== undefined) {
      setKmReporte(String(moto.kmAcumulados));
    }
  }, [moto?.kmAcumulados]);

  const handleEnviarReporteMoto = async () => {
    if (!descripcionProblema.trim()) {
      notify.error('Por favor describe detalladamente la falla observada en la moto.');
      return;
    }

    setIsSubmittingReporte(true);
    try {
      const res = await reportarProblemaMotoAsync({
        categoria: categoriaProblema,
        prioridad: prioridadProblema,
        tipo: prioridadProblema === 'URGENTE' ? 'EMERGENCIA' : 'CORRECTIVO',
        descripcion: descripcionProblema.trim(),
        kmAlMomento: kmReporte ? Number(kmReporte) : (moto?.kmAcumulados ?? 0),
        observaciones: observacionesReporte.trim() || undefined,
      });

      if (res.ok) {
        notify.success('¡Reporte enviado exitosamente al equipo de Mantenimiento / Taller!');
        setDescripcionProblema('');
        setObservacionesReporte('');
        setReportesTab('historial');
        await syncFromBackend();
      } else {
        notify.error(res.error || 'Error al enviar el reporte a mantenimiento.');
      }
    } catch (err) {
      console.error(err);
      notify.error('Error al conectar con el servidor.');
    } finally {
      setIsSubmittingReporte(false);
    }
  };

  useEffect(() => {
    if (perfil) {
      setEditNombre(perfil.nombre || userName || '');
      setEditTelefono(perfil.telefono || '');
      setEditFotoUrl((perfil as any).fotoUrl || '');
      setEditCedula((perfil as any).cedulaRepartidor || '');
      setEditLicenciaConducir((perfil as any).licenciaConducir || '');
      setEditVehiculoMarca((perfil as any).vehiculoMarca || 'Honda');
      setEditVehiculoModelo((perfil as any).vehiculoModelo || moto?.modelo || 'Wave 110');
      setEditVehiculoPlaca((perfil as any).vehiculoPlaca || moto?.placa || '');
      setEditZona(perfil.zonaPreferida || 'Todas las Zonas');
    }
  }, [perfil, userName, moto]);

  const handleSavePerfil = async () => {
    if (!editNombre.trim()) {
      notify.error('El nombre completo es obligatorio.');
      return;
    }
    if (!editTelefono.trim()) {
      notify.error('El número de teléfono móvil es obligatorio.');
      return;
    }

    setIsSavingPerfil(true);
    try {
      const res = await fetch('/api/repartidor/perfil', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: editNombre.trim(),
          telefono: editTelefono.trim(),
          fotoUrl: editFotoUrl.trim() || undefined,
          cedula: editCedula.trim(),
          licenciaConducir: editLicenciaConducir.trim(),
          vehiculoMarca: editVehiculoMarca.trim(),
          vehiculoModelo: editVehiculoModelo.trim(),
          vehiculoPlaca: editVehiculoPlaca.trim(),
          municipio: editMunicipio.trim(),
          zonaPreferida: editZona,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        notify.success('¡Perfil de repartidor actualizado con éxito!');
        setShowEditModal(false);
        await syncFromBackend();
      } else {
        notify.error(data?.error || 'Error al actualizar el perfil.');
      }
    } catch (err) {
      console.error(err);
      notify.error('Error al conectar con el servidor.');
    } finally {
      setIsSavingPerfil(false);
    }
  };

  const avatarInputRef = React.useRef<HTMLInputElement>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  /* Driver photo upload handler with direct backend sync */
  const handleDriverPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingAvatar(true);

    // Instant local preview
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) setEditFotoUrl(event.target.result as string);
    };
    reader.readAsDataURL(file);

    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/repartidor/foto-perfil', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (res.ok && data.ok && data.fotoUrl) {
        setEditFotoUrl(data.fotoUrl);
        notify.success('¡Foto de perfil actualizada con éxito!');
        await syncFromBackend();
      } else {
        notify.error(data?.error || 'Error al actualizar foto de perfil.');
      }
    } catch {
      notify.error('Error al conectar con el servidor.');
    } finally {
      setUploadingAvatar(false);
      if (avatarInputRef.current) avatarInputRef.current.value = '';
    }
  };

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
          onClick={() => avatarInputRef.current?.click()}
          style={{
            position: 'relative',
            width: 76,
            height: 76,
            borderRadius: 22,
            background: `linear-gradient(135deg, ${perfil.color}, color-mix(in srgb, ${perfil.color} 70%, #000))`,
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: "'Syne', sans-serif",
            fontSize: 22,
            fontWeight: 700,
            flexShrink: 0,
            boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
            overflow: 'hidden',
            cursor: 'pointer',
            border: '2.5px solid #FF5722',
          }}
          title="Toca para cambiar foto de perfil"
        >
          {(perfil.fotoUrl || editFotoUrl) ? (
            <img src={perfil.fotoUrl || editFotoUrl} alt={perfil.nombre} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            perfil.initials
          )}
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              right: 0,
              left: 0,
              height: 26,
              background: 'rgba(0, 0, 0, 0.55)',
              backdropFilter: 'blur(4px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFF',
            }}
          >
            <Camera size={14} />
          </div>
          <input
            ref={avatarInputRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handleDriverPhotoUpload}
          />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h1
            className="font-syne"
            style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.3px' }}
          >
            {perfil?.nombre || userName}
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
        <button
          type="button"
          onClick={() => setShowEditModal(true)}
          style={{
            padding: '6px 12px',
            borderRadius: 10,
            border: '1px solid rgba(255, 255, 255, 0.15)',
            background: 'rgba(255, 255, 255, 0.08)',
            color: '#F8FAFC',
            fontSize: 12,
            fontWeight: 700,
            cursor: 'pointer',
            flexShrink: 0,
          }}
        >
          Editar Perfil
        </button>
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
        <div style={{ height: 110, width: '100%', minWidth: 0, minHeight: 110 }}>
          <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={110}>
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
      <SectionCard
        title="Moto asignada"
        action={
          <button
            onClick={() => {
              setReportesTab('nuevo');
              setShowReportarMotoModal(true);
            }}
            style={{
              padding: '6px 12px',
              borderRadius: 10,
              background: 'color-mix(in srgb, var(--primario) 15%, transparent)',
              border: '1px solid var(--primario)',
              color: 'var(--primario)',
              fontSize: 12,
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              cursor: 'pointer',
              fontFamily: "'DM Sans', sans-serif",
              transition: 'all 0.2s',
            }}
          >
            <Wrench size={13} />
            Reportar problema
          </button>
        }
      >
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
              {(moto?.kmAcumulados ?? 0).toLocaleString('es-NI')} km
            </div>
          </div>
          <div>
            <div style={{ color: 'var(--text-muted)', marginBottom: 2 }}>Último mantenimiento</div>
            <div style={{ color: 'var(--text)', fontWeight: 600 }}>
              {moto?.ultimoMantenimiento
                ? new Date(moto.ultimoMantenimiento).toLocaleDateString('es-NI', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  })
                : '—'}
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
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 8,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
              <AlertTriangle size={16} color="var(--warning, var(--warning))" style={{ flexShrink: 0, marginTop: 1 }} />
              <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                <strong style={{ color: 'var(--text)' }}>
                  {moto.estado === 'EN_MANTENIMIENTO' ? 'En Mantenimiento.' : 'Alerta de Mantenimiento Activa.'}
                </strong>{' '}
                {moto.estado === 'EN_MANTENIMIENTO'
                  ? 'La moto se encuentra en revisión o reparación por el equipo técnico.'
                  : 'Reportes activos vinculados con el taller de ingeniería.'}
              </div>
            </div>
            <button
              onClick={() => {
                setReportesTab('historial');
                setShowReportarMotoModal(true);
              }}
              style={{
                padding: '6px 12px',
                borderRadius: 8,
                background: 'var(--warning, #F59E0B)',
                color: '#000',
                fontSize: 11,
                fontWeight: 700,
                border: 'none',
                cursor: 'pointer',
                flexShrink: 0,
              }}
            >
              Ver Taller
            </button>
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
            setReportesTab('nuevo');
            setShowReportarMotoModal(true);
          }}
        />
        <ConfigLink
          icon={<HelpCircle size={16} />}
          label="Centro de ayuda y soporte técnico"
          onClick={() => setShowHelpModal(true)}
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

      {/* ─── MODAL EDITAR PERFIL COMPLETO ─── */}
      <AnimatePresence>
        {showEditModal && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              width: '100vw',
              height: '100vh',
              zIndex: 999999,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              padding: 16,
            }}
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowEditModal(false)}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                width: '100%',
                height: '100%',
                background: 'rgba(15, 23, 42, 0.82)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
              }}
            />

            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 12 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 12 }}
              style={{
                position: 'relative',
                width: '100%',
                maxWidth: 500,
                maxHeight: '85vh',
                overflowY: 'auto',
                background: 'rgba(19, 24, 34, 0.98)',
                backdropFilter: 'blur(24px)',
                WebkitBackdropFilter: 'blur(24px)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: 28,
                padding: 24,
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)',
                zIndex: 1000000,
                color: '#F8FAFC',
              }}
            >
              {/* Header Modal */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, paddingBottom: 12, borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
                <div>
                  <h2 style={{ fontSize: 18, fontWeight: 800, margin: 0, color: '#F8FAFC' }}>
                    Configuración de Perfil
                  </h2>
                  <span style={{ fontSize: 12, color: '#94A3B8' }}>Datos personales y vehículo asignado</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  style={{
                    background: 'rgba(255, 255, 255, 0.08)',
                    border: 'none',
                    borderRadius: '50%',
                    width: 32,
                    height: 32,
                    cursor: 'pointer',
                    fontSize: 16,
                    color: '#94A3B8',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  ✕
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {/* Avatar Preview & Photo Picker */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, background: 'rgba(30, 41, 59, 0.5)', padding: 14, borderRadius: 16, border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                  <div
                    style={{
                      width: 64,
                      height: 64,
                      borderRadius: 20,
                      background: editFotoUrl ? `url(${editFotoUrl}) center/cover` : `linear-gradient(135deg, ${perfil.color}, #000)`,
                      color: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontFamily: "'Syne', sans-serif",
                      fontSize: 22,
                      fontWeight: 700,
                      flexShrink: 0,
                      boxShadow: '0 4px 14px rgba(0,0,0,0.4)',
                      border: '2px solid #007AFF',
                    }}
                  >
                    {!editFotoUrl && perfil.initials}
                  </div>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <label style={{ fontSize: 12, fontWeight: 700, color: '#F8FAFC' }}>
                      Foto de Perfil del Repartidor
                    </label>
                    <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 10, background: '#007AFF', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer', width: 'fit-content', boxShadow: '0 4px 12px rgba(0,122,255,0.3)' }}>
                      <Camera size={15} />
                      Subir / Tomar Foto
                      <input type="file" accept="image/*" capture="environment" onChange={handleDriverPhotoUpload} style={{ display: 'none' }} />
                    </label>
                  </div>
                </div>

                {/* Seccion 1: Datos Personales Obligatorios */}
                <div style={{ background: 'rgba(30, 41, 59, 0.5)', padding: 14, borderRadius: 16, border: '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#007AFF', textTransform: 'uppercase' }}>
                    Información Personal
                  </div>

                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: '#F8FAFC', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <span>Nombre Completo</span>
                      <span style={{ color: '#EF4444' }}>*Obligatorio</span>
                    </label>
                    <input
                      type="text"
                      value={editNombre}
                      onChange={(e) => setEditNombre(e.target.value)}
                      placeholder="Ej: Carlos Mendoza"
                      required
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        borderRadius: 12,
                        background: 'rgba(15, 23, 42, 0.6)',
                        border: !editNombre.trim() ? '1.5px solid #EF4444' : '1px solid rgba(255, 255, 255, 0.15)',
                        color: '#F8FAFC',
                        fontSize: 13,
                        fontWeight: 600,
                        outline: 'none',
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: '#F8FAFC', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <span>Número de Teléfono Móvil</span>
                      <span style={{ color: '#EF4444' }}>*Obligatorio</span>
                    </label>
                    <input
                      type="text"
                      value={editTelefono}
                      onChange={(e) => setEditTelefono(e.target.value)}
                      placeholder="Ej: +505 8888 8888"
                      required
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        borderRadius: 12,
                        background: 'rgba(15, 23, 42, 0.6)',
                        border: !editTelefono.trim() ? '1.5px solid #EF4444' : '1px solid rgba(255, 255, 255, 0.15)',
                        color: '#F8FAFC',
                        fontSize: 13,
                        fontWeight: 600,
                        outline: 'none',
                      }}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 600, color: '#94A3B8', marginBottom: 4, display: 'block' }}>
                        N° de Cédula / DNI
                      </label>
                      <input
                        type="text"
                        value={editCedula}
                        onChange={(e) => setEditCedula(e.target.value.toUpperCase())}
                        placeholder="001-000000-0000A"
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          borderRadius: 10,
                          background: 'rgba(15, 23, 42, 0.6)',
                          border: '1px solid rgba(255, 255, 255, 0.15)',
                          color: '#F8FAFC',
                          fontSize: 12,
                          outline: 'none',
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: 11, fontWeight: 600, color: '#94A3B8', marginBottom: 4, display: 'block' }}>
                        N° Licencia de Conducir
                      </label>
                      <input
                        type="text"
                        value={editLicenciaConducir}
                        onChange={(e) => setEditLicenciaConducir(e.target.value.toUpperCase())}
                        placeholder="LIC-948102"
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          borderRadius: 10,
                          background: 'rgba(15, 23, 42, 0.6)',
                          border: '1px solid rgba(255, 255, 255, 0.15)',
                          color: '#F8FAFC',
                          fontSize: 12,
                          outline: 'none',
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Seccion 2: Datos de Vehiculo / Moto */}
                <div style={{ background: 'rgba(30, 41, 59, 0.5)', padding: 14, borderRadius: 16, border: '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#FF9500', textTransform: 'uppercase' }}>
                    Vehículo Operativo
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 600, color: '#94A3B8', marginBottom: 4, display: 'block' }}>
                        Marca de Moto
                      </label>
                      <input
                        type="text"
                        value={editVehiculoMarca}
                        onChange={(e) => setEditVehiculoMarca(e.target.value)}
                        placeholder="Honda / Yamaha"
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          borderRadius: 10,
                          background: 'rgba(15, 23, 42, 0.6)',
                          border: '1px solid rgba(255, 255, 255, 0.15)',
                          color: '#F8FAFC',
                          fontSize: 12,
                          outline: 'none',
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: 11, fontWeight: 600, color: '#94A3B8', marginBottom: 4, display: 'block' }}>
                        Modelo de Moto
                      </label>
                      <input
                        type="text"
                        value={editVehiculoModelo}
                        onChange={(e) => setEditVehiculoModelo(e.target.value)}
                        placeholder="Wave 110"
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          borderRadius: 10,
                          background: 'rgba(15, 23, 42, 0.6)',
                          border: '1px solid rgba(255, 255, 255, 0.15)',
                          color: '#F8FAFC',
                          fontSize: 12,
                          outline: 'none',
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: 11, fontWeight: 600, color: '#94A3B8', marginBottom: 4, display: 'block' }}>
                      N° de Placa (Matrícula)
                    </label>
                    <input
                      type="text"
                      value={editVehiculoPlaca}
                      onChange={(e) => setEditVehiculoPlaca(e.target.value.toUpperCase())}
                      placeholder="Ej: M-94812"
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: 10,
                        background: 'rgba(15, 23, 42, 0.6)',
                        border: '1px solid rgba(255, 255, 255, 0.15)',
                        color: '#F8FAFC',
                        fontSize: 12,
                        fontWeight: 700,
                        fontFamily: 'monospace',
                        outline: 'none',
                      }}
                    />
                  </div>
                </div>

                {/* Seccion 3: Zona y Ubicacion */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 600, color: '#94A3B8', marginBottom: 4, display: 'block' }}>
                      Municipio
                    </label>
                    <input
                      type="text"
                      value={editMunicipio}
                      onChange={(e) => setEditMunicipio(e.target.value)}
                      placeholder="Managua"
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: 10,
                        background: 'rgba(15, 23, 42, 0.6)',
                        border: '1px solid rgba(255, 255, 255, 0.15)',
                        color: '#F8FAFC',
                        fontSize: 12,
                        outline: 'none',
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: 11, fontWeight: 600, color: '#94A3B8', marginBottom: 4, display: 'block' }}>
                      Zona Cobertura
                    </label>
                    <select
                      value={editZona}
                      onChange={(e) => setEditZona(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: 10,
                        background: 'rgba(15, 23, 42, 0.6)',
                        border: '1px solid rgba(255, 255, 255, 0.15)',
                        color: '#F8FAFC',
                        fontSize: 12,
                        outline: 'none',
                      }}
                    >
                      <option value="Todas las Zonas">Todas las Zonas</option>
                      <option value="Managua Centro">Managua Centro</option>
                      <option value="Carretera a Masaya">Carretera a Masaya</option>
                      <option value="Linda Vista">Linda Vista</option>
                      <option value="Bello Horizonte">Bello Horizonte</option>
                    </select>
                  </div>
                </div>

                {/* Footer Actions */}
                <div style={{ marginTop: 10, display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    style={{
                      padding: '12px 20px',
                      borderRadius: 12,
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      background: 'transparent',
                      color: '#F8FAFC',
                      cursor: 'pointer',
                      fontSize: 13,
                      fontWeight: 600,
                    }}
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleSavePerfil}
                    disabled={isSavingPerfil}
                    style={{
                      padding: '12px 24px',
                      borderRadius: 12,
                      border: 'none',
                      background: '#007AFF',
                      color: '#FFFFFF',
                      cursor: 'pointer',
                      fontSize: 13,
                      fontWeight: 700,
                      boxShadow: '0 4px 14px rgba(0, 122, 255, 0.4)',
                    }}
                  >
                    {isSavingPerfil ? 'Guardando...' : 'Guardar Cambios'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ─── MODAL REPORTAR PROBLEMA CON MOTO (VINCULADO CON MANTENIMIENTO) ─── */}
      <AnimatePresence>
        {showReportarMotoModal && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              width: '100vw',
              height: '100vh',
              zIndex: 999999,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              padding: 16,
            }}
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowReportarMotoModal(false)}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                width: '100%',
                height: '100%',
                background: 'rgba(15, 23, 42, 0.82)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
              }}
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 16 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              style={{
                position: 'relative',
                zIndex: 10,
                width: '100%',
                maxWidth: 540,
                maxHeight: '90vh',
                background: '#1E293B',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: 24,
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
              }}
            >
              {/* Header */}
              <div
                style={{
                  padding: '18px 20px',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: 'rgba(30, 41, 59, 0.95)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div
                    style={{
                      width: 42,
                      height: 42,
                      borderRadius: 12,
                      background: 'color-mix(in srgb, var(--primario) 15%, transparent)',
                      color: 'var(--primario)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Wrench size={22} />
                  </div>
                  <div>
                    <h3
                      className="font-syne"
                      style={{ margin: 0, fontSize: 17, fontWeight: 700, color: '#F8FAFC' }}
                    >
                      Reportar Falla Mecánica
                    </h3>
                    <div style={{ fontSize: 12, color: '#94A3B8' }}>
                      Enlace directo con el Ingeniero de Mantenimiento & Taller
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowReportarMotoModal(false)}
                  style={{
                    background: 'rgba(255, 255, 255, 0.06)',
                    border: 'none',
                    borderRadius: 10,
                    width: 32,
                    height: 32,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#94A3B8',
                    cursor: 'pointer',
                  }}
                >
                  ✕
                </button>
              </div>

              {/* Moto Badge Summary & Tabs */}
              <div
                style={{
                  padding: '12px 20px',
                  background: 'rgba(15, 23, 42, 0.5)',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: 10,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
                  <span style={{ color: '#94A3B8' }}>Moto:</span>
                  <span style={{ color: '#F8FAFC', fontWeight: 700 }}>
                    {moto.nombre || 'Moto Asignada'} ({moto.placa || 'Sin placa'})
                  </span>
                  <span
                    style={{
                      padding: '2px 8px',
                      borderRadius: 6,
                      fontSize: 10,
                      fontWeight: 700,
                      background: 'rgba(255,255,255,0.08)',
                      color: 'var(--primario)',
                    }}
                  >
                    {(moto.kmAcumulados || 0).toLocaleString('es-NI')} km
                  </span>
                </div>

                {/* Tabs */}
                <div style={{ display: 'flex', gap: 4, background: 'rgba(0,0,0,0.25)', padding: 3, borderRadius: 10 }}>
                  <button
                    type="button"
                    onClick={() => setReportesTab('nuevo')}
                    style={{
                      padding: '5px 12px',
                      borderRadius: 7,
                      border: 'none',
                      fontSize: 11,
                      fontWeight: 700,
                      cursor: 'pointer',
                      background: reportesTab === 'nuevo' ? 'var(--primario)' : 'transparent',
                      color: reportesTab === 'nuevo' ? '#fff' : '#94A3B8',
                      transition: 'all 0.2s',
                    }}
                  >
                    📝 Nuevo Reporte
                  </button>
                  <button
                    type="button"
                    onClick={() => setReportesTab('historial')}
                    style={{
                      padding: '5px 12px',
                      borderRadius: 7,
                      border: 'none',
                      fontSize: 11,
                      fontWeight: 700,
                      cursor: 'pointer',
                      background: reportesTab === 'historial' ? 'var(--primario)' : 'transparent',
                      color: reportesTab === 'historial' ? '#fff' : '#94A3B8',
                      transition: 'all 0.2s',
                    }}
                  >
                    🔧 Historial ({moto.mantenimientos?.length || 0})
                  </button>
                </div>
              </div>

              {/* Modal Body */}
              <div style={{ padding: 20, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
                {reportesTab === 'nuevo' ? (
                  <>
                    {/* Selector de Categoría de Falla */}
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 700, color: '#F8FAFC', marginBottom: 8, display: 'block' }}>
                        1. Selecciona el componente o falla principal
                      </label>
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: '1fr 1fr',
                          gap: 8,
                        }}
                      >
                        {[
                          { id: 'FRENOS', label: 'Frenos', icon: '🛑', desc: 'Pastillas, zapatas, líquido' },
                          { id: 'MOTOR', label: 'Motor & Aceite', icon: '⚙️', desc: 'Ruido, fuga, recalentamiento' },
                          { id: 'LLANTAS', label: 'Neumáticos / Llantas', icon: '🛞', desc: 'Pinchazo, baja presión' },
                          { id: 'ELECTRICO', label: 'Sistema Eléctrico', icon: '⚡', desc: 'Batería, arranque, pito' },
                          { id: 'TRANSMISION', label: 'Cadena & Clutch', icon: '⛓️', desc: 'Cadena floja, piñón' },
                          { id: 'SUSPENSION', label: 'Suspensión & Chasis', icon: '🔩', desc: 'Amortiguadores, barras' },
                          { id: 'LUCES', label: 'Luces & Focos', icon: '💡', desc: 'Foco delantero, direccionales' },
                          { id: 'OTRO', label: 'Otro Problema', icon: '🔧', desc: 'Carrocería, espejos, etc.' },
                        ].map((cat) => {
                          const isSelected = categoriaProblema === cat.id;
                          return (
                            <button
                              key={cat.id}
                              type="button"
                              onClick={() => setCategoriaProblema(cat.id)}
                              style={{
                                padding: '10px 12px',
                                borderRadius: 12,
                                border: isSelected
                                  ? '1.5px solid var(--primario)'
                                  : '1px solid rgba(255, 255, 255, 0.1)',
                                background: isSelected
                                  ? 'color-mix(in srgb, var(--primario) 16%, rgba(15, 23, 42, 0.6))'
                                  : 'rgba(15, 23, 42, 0.6)',
                                textAlign: 'left',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 10,
                                transition: 'all 0.15s',
                              }}
                            >
                              <span style={{ fontSize: 20 }}>{cat.icon}</span>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div
                                  style={{
                                    fontSize: 12,
                                    fontWeight: isSelected ? 700 : 600,
                                    color: isSelected ? 'var(--primario)' : '#F8FAFC',
                                    lineHeight: 1.2,
                                  }}
                                >
                                  {cat.label}
                                </div>
                                <div
                                  style={{
                                    fontSize: 10,
                                    color: '#94A3B8',
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    marginTop: 2,
                                  }}
                                >
                                  {cat.desc}
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Selector de Nivel de Urgencia */}
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 700, color: '#F8FAFC', marginBottom: 8, display: 'block' }}>
                        2. Nivel de gravedad / urgencia
                      </label>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                        {[
                          { id: 'NORMAL', label: 'Normal', color: '#10B981', desc: 'Moto operativa' },
                          { id: 'ALTA', label: 'Alta', color: '#F59E0B', desc: 'Revisión hoy' },
                          { id: 'URGENTE', label: 'Urgente', color: '#EF4444', desc: 'Inmovilizada' },
                        ].map((prio) => {
                          const isSelected = prioridadProblema === prio.id;
                          return (
                            <button
                              key={prio.id}
                              type="button"
                              onClick={() => setPrioridadProblema(prio.id as any)}
                              style={{
                                padding: '10px 8px',
                                borderRadius: 12,
                                border: isSelected
                                  ? `1.5px solid ${prio.color}`
                                  : '1px solid rgba(255, 255, 255, 0.1)',
                                background: isSelected
                                  ? `color-mix(in srgb, ${prio.color} 18%, rgba(15, 23, 42, 0.6))`
                                  : 'rgba(15, 23, 42, 0.6)',
                                textAlign: 'center',
                                cursor: 'pointer',
                                transition: 'all 0.15s',
                              }}
                            >
                              <div style={{ fontSize: 12, fontWeight: 700, color: isSelected ? prio.color : '#F8FAFC' }}>
                                {prio.label}
                              </div>
                              <div style={{ fontSize: 10, color: '#94A3B8', marginTop: 2 }}>{prio.desc}</div>
                            </button>
                          );
                        })}
                      </div>

                      {prioridadProblema === 'URGENTE' && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          style={{
                            marginTop: 8,
                            padding: '10px 12px',
                            borderRadius: 10,
                            background: 'rgba(239, 68, 68, 0.12)',
                            border: '1px solid rgba(239, 68, 68, 0.3)',
                            fontSize: 11,
                            color: '#FCA5A5',
                            lineHeight: 1.4,
                          }}
                        >
                          ⚠️ <strong>Atención:</strong> Al marcar como <strong>Urgente</strong>, la moto se colocará automáticamente en estado <strong>EN MANTENIMIENTO</strong> en el sistema de despacho y el taller de ingeniería recibirá una alerta prioritaria de emergencia.
                        </motion.div>
                      )}
                    </div>

                    {/* Kilometraje y Descripción */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 12 }}>
                      <div>
                        <label style={{ fontSize: 12, fontWeight: 700, color: '#F8FAFC', marginBottom: 4, display: 'block' }}>
                          3. Kilometraje actual aproximado (km)
                        </label>
                        <input
                          type="number"
                          value={kmReporte}
                          onChange={(e) => setKmReporte(e.target.value)}
                          placeholder="Ej: 15300"
                          style={{
                            width: '100%',
                            padding: '10px 14px',
                            borderRadius: 12,
                            background: 'rgba(15, 23, 42, 0.7)',
                            border: '1px solid rgba(255, 255, 255, 0.15)',
                            color: '#F8FAFC',
                            fontSize: 13,
                            fontFamily: 'monospace',
                            fontWeight: 700,
                            outline: 'none',
                          }}
                        />
                      </div>

                      <div>
                        <label style={{ fontSize: 12, fontWeight: 700, color: '#F8FAFC', marginBottom: 4, display: 'block' }}>
                          4. Descripción detallada del problema <span style={{ color: '#EF4444' }}>*</span>
                        </label>
                        <textarea
                          rows={3}
                          value={descripcionProblema}
                          onChange={(e) => setDescripcionProblema(e.target.value)}
                          placeholder="Ej: El freno delantero perdió presión y hace un chirrido agudo al frenar en bajadas. La manigueta llega casi al fondo."
                          style={{
                            width: '100%',
                            padding: '10px 14px',
                            borderRadius: 12,
                            background: 'rgba(15, 23, 42, 0.7)',
                            border: '1px solid rgba(255, 255, 255, 0.15)',
                            color: '#F8FAFC',
                            fontSize: 13,
                            outline: 'none',
                            resize: 'none',
                            fontFamily: "'DM Sans', sans-serif",
                            lineHeight: 1.4,
                          }}
                        />
                      </div>

                      <div>
                        <label style={{ fontSize: 12, fontWeight: 600, color: '#94A3B8', marginBottom: 4, display: 'block' }}>
                          5. Notas u observaciones adicionales para el mecánico (opcional)
                        </label>
                        <input
                          type="text"
                          value={observacionesReporte}
                          onChange={(e) => setObservacionesReporte(e.target.value)}
                          placeholder="Ej: Disponible para llevarla al taller después de las 2:00 PM."
                          style={{
                            width: '100%',
                            padding: '10px 14px',
                            borderRadius: 12,
                            background: 'rgba(15, 23, 42, 0.7)',
                            border: '1px solid rgba(255, 255, 255, 0.15)',
                            color: '#F8FAFC',
                            fontSize: 12,
                            outline: 'none',
                          }}
                        />
                      </div>
                    </div>

                    {/* Submit Actions */}
                    <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 6 }}>
                      <button
                        type="button"
                        onClick={() => setShowReportarMotoModal(false)}
                        style={{
                          padding: '12px 18px',
                          borderRadius: 12,
                          border: '1px solid rgba(255, 255, 255, 0.15)',
                          background: 'transparent',
                          color: '#F8FAFC',
                          cursor: 'pointer',
                          fontSize: 13,
                          fontWeight: 600,
                        }}
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        onClick={handleEnviarReporteMoto}
                        disabled={isSubmittingReporte || !descripcionProblema.trim()}
                        style={{
                          padding: '12px 24px',
                          borderRadius: 12,
                          border: 'none',
                          background: 'var(--primario, #FF5722)',
                          color: '#FFFFFF',
                          cursor: isSubmittingReporte || !descripcionProblema.trim() ? 'not-allowed' : 'pointer',
                          opacity: isSubmittingReporte || !descripcionProblema.trim() ? 0.6 : 1,
                          fontSize: 13,
                          fontWeight: 700,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                          boxShadow: '0 4px 14px rgba(255, 87, 34, 0.4)',
                        }}
                      >
                        <Wrench size={15} />
                        {isSubmittingReporte ? 'Enviando a Mantenimiento...' : 'Enviar Reporte a Mantenimiento'}
                      </button>
                    </div>
                  </>
                ) : (
                  /* Historial de mantenimientos / reportes de la moto */
                  <div>
                    <div style={{ fontSize: 13, color: '#94A3B8', marginBottom: 14 }}>
                      Registro de intervenciones y reportes técnicos enviados al taller de Mantenimiento / Ingeniería.
                    </div>

                    {(!moto.mantenimientos || moto.mantenimientos.length === 0) && (!moto.alertas || moto.alertas.length === 0) ? (
                      <div
                        style={{
                          padding: '32px 16px',
                          textAlign: 'center',
                          borderRadius: 14,
                          background: 'rgba(15, 23, 42, 0.5)',
                          border: '1px dashed rgba(255, 255, 255, 0.15)',
                          color: '#94A3B8',
                          fontSize: 13,
                        }}
                      >
                        <Wrench size={32} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
                        <div>No hay reportes ni mantenimientos registrados para esta moto.</div>
                        <button
                          type="button"
                          onClick={() => setReportesTab('nuevo')}
                          style={{
                            marginTop: 14,
                            padding: '8px 16px',
                            borderRadius: 10,
                            background: 'var(--primario)',
                            color: '#fff',
                            border: 'none',
                            fontSize: 12,
                            fontWeight: 700,
                            cursor: 'pointer',
                          }}
                        >
                          Crear primer reporte
                        </button>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {moto.mantenimientos?.map((m) => (
                          <div
                            key={m.id}
                            style={{
                              padding: 14,
                              borderRadius: 14,
                              background: 'rgba(15, 23, 42, 0.6)',
                              border: '1px solid rgba(255, 255, 255, 0.1)',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: 6,
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <span
                                  style={{
                                    fontSize: 11,
                                    fontWeight: 700,
                                    padding: '3px 8px',
                                    borderRadius: 6,
                                    background:
                                      m.tipo === 'EMERGENCIA'
                                        ? 'rgba(239, 68, 68, 0.2)'
                                        : 'rgba(59, 130, 246, 0.2)',
                                    color: m.tipo === 'EMERGENCIA' ? '#EF4444' : '#3B82F6',
                                  }}
                                >
                                  {m.tipo} • {m.categoria}
                                </span>
                                <span
                                  style={{
                                    fontSize: 10,
                                    fontWeight: 600,
                                    padding: '2px 6px',
                                    borderRadius: 4,
                                    background: 'rgba(255, 255, 255, 0.08)',
                                    color: '#94A3B8',
                                  }}
                                >
                                  {m.prioridad}
                                </span>
                              </div>

                              <span
                                style={{
                                  fontSize: 11,
                                  fontWeight: 700,
                                  padding: '3px 8px',
                                  borderRadius: 6,
                                  background:
                                    m.estado === 'COMPLETADO'
                                      ? 'rgba(16, 185, 129, 0.2)'
                                      : m.estado === 'EN_PROCESO'
                                        ? 'rgba(245, 158, 11, 0.2)'
                                        : 'rgba(59, 130, 246, 0.2)',
                                  color:
                                    m.estado === 'COMPLETADO'
                                      ? '#10B981'
                                      : m.estado === 'EN_PROCESO'
                                        ? '#F59E0B'
                                        : '#3B82F6',
                                }}
                              >
                                {m.estado.replace('_', ' ')}
                              </span>
                            </div>

                            <div style={{ fontSize: 13, color: '#F8FAFC', fontWeight: 600 }}>
                              {m.descripcion}
                            </div>

                            {m.observaciones && (
                              <div style={{ fontSize: 11, color: '#94A3B8', fontStyle: 'italic' }}>
                                {m.observaciones}
                              </div>
                            )}

                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 11, color: '#64748B', marginTop: 4 }}>
                              <span>Km: {m.kmAlMomento?.toLocaleString('es-NI') || 0} km</span>
                              <span>{new Date(m.createdAt).toLocaleDateString('es-NI', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ─── MODAL CENTRO DE AYUDA Y SOPORTE AL REPARTIDOR ─── */}
      <AnimatePresence>
        {showHelpModal && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              width: '100vw',
              height: '100vh',
              zIndex: 999999,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              padding: 16,
            }}
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowHelpModal(false)}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                width: '100%',
                height: '100%',
                background: 'rgba(15, 23, 42, 0.82)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
              }}
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 16 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              style={{
                position: 'relative',
                zIndex: 10,
                width: '100%',
                maxWidth: 520,
                maxHeight: '85vh',
                background: '#1E293B',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: 24,
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
              }}
            >
              {/* Header */}
              <div
                style={{
                  padding: '18px 20px',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: 'rgba(30, 41, 59, 0.95)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div
                    style={{
                      width: 42,
                      height: 42,
                      borderRadius: 12,
                      background: 'rgba(41, 121, 255, 0.15)',
                      color: '#2979FF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <HelpCircle size={22} />
                  </div>
                  <div>
                    <h3
                      className="font-syne"
                      style={{ margin: 0, fontSize: 17, fontWeight: 700, color: '#F8FAFC' }}
                    >
                      Centro de Ayuda al Repartidor
                    </h3>
                    <div style={{ fontSize: 12, color: '#94A3B8' }}>
                      Soporte operativo y emergencias en ruta
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowHelpModal(false)}
                  style={{
                    background: 'rgba(255, 255, 255, 0.06)',
                    border: 'none',
                    borderRadius: 10,
                    width: 32,
                    height: 32,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#94A3B8',
                    cursor: 'pointer',
                  }}
                >
                  ✕
                </button>
              </div>

              {/* Body */}
              <div style={{ padding: 20, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
                {/* Emergency Contact SOS */}
                <div
                  style={{
                    padding: 14,
                    borderRadius: 16,
                    background: 'rgba(239, 68, 68, 0.12)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 12,
                  }}
                >
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#FCA5A5', display: 'flex', alignItems: 'center', gap: 6 }}>
                      Central de Despacho y Emergencias
                    </div>
                    <div style={{ fontSize: 11, color: '#F8FAFC', marginTop: 2 }}>
                      Asistencia inmediata para accidentes, extravíos o soporte en vivo.
                    </div>
                  </div>

                  <a
                    href="tel:+50522705000"
                    style={{
                      padding: '8px 14px',
                      borderRadius: 10,
                      background: '#EF4444',
                      color: '#fff',
                      fontSize: 12,
                      fontWeight: 700,
                      textDecoration: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      flexShrink: 0,
                    }}
                  >
                    Llamar SOS
                  </a>
                </div>

                {/* FAQ list */}
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#F8FAFC', marginBottom: 10 }}>
                    Preguntas Frecuentes de Motorizados
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {[
                      {
                        q: '¿Cómo reporto una avería o falla en la moto?',
                        a: 'En esta misma sección de perfil, pulsa en "Reportar problema". Selecciona la falla (frenos, motor, llantas, etc.) y la prioridad. El taller de mantenimiento la recibirá al instante.',
                      },
                      {
                        q: '¿Qué hacer si el cliente no responde o la dirección no existe?',
                        a: 'Tienes el chat directo y el botón de llamada dentro de la orden activa. Si tras 5 minutos no consigues contacto, reporta la incidencia desde el botón de alerta para que la central intervenga.',
                      },
                      {
                        q: '¿Cómo se calculan mis comisiones y ganancias?',
                        a: 'Recibes el pago íntegro de la entrega menos la comisión de plataforma del 15%. Las propinas de los clientes son 100% tuyas y se suman directamente.',
                      },
                      {
                        q: '¿Por qué no suena la alerta cuando llega un pedido?',
                        a: 'Verifica en tu perfil que el interruptor de Sonido esté activo y que tu teléfono no esté en modo "No Molestar" o silencio.',
                      },
                    ].map((faq, idx) => (
                      <div
                        key={idx}
                        style={{
                          padding: 12,
                          borderRadius: 14,
                          background: 'rgba(15, 23, 42, 0.6)',
                          border: '1px solid rgba(255, 255, 255, 0.08)',
                        }}
                      >
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#F8FAFC', marginBottom: 4 }}>
                          {faq.q}
                        </div>
                        <div style={{ fontSize: 12, color: '#94A3B8', lineHeight: 1.45 }}>
                          {faq.a}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowHelpModal(false)}
                  style={{
                    padding: '12px 20px',
                    borderRadius: 12,
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    background: 'transparent',
                    color: '#F8FAFC',
                    cursor: 'pointer',
                    fontSize: 13,
                    fontWeight: 600,
                    width: '100%',
                    marginTop: 6,
                  }}
                >
                  Cerrar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
        </div>
      )}
    </PullToRefresh>
  );
}
