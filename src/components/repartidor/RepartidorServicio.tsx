'use client';

import React, { useMemo, useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPin,
  Package,
  PackagePlus,
  Navigation,
  Clock,
  Power,
  MessageSquare,
  AlertTriangle,
  CheckCircle2,
  Store,
  TrendingUp,
  Zap,
} from 'lucide-react';
import { useRepartidorStore, type OrdenActiva } from '@/lib/repartidor-store';
import { obtenerRuta, rutaLineaRecta } from '@/lib/osrm';
import { useRepartidorSnackbar } from './RepartidorShell';

/* ═══════════════════════════════════════════════
   REAL LEAFLET MAP (dynamic, ssr:false — Leaflet needs window)
   ═══════════════════════════════════════════════ */

const RepartidorMap = dynamic(() => import('./RepartidorMap'), {
  ssr: false,
  loading: () => (
    <div
      style={{
        height: 300,
        width: '100%',
        background: 'var(--md-surface-variant)',
        borderRadius: 16,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--text-muted)',
        fontSize: 13,
      }}
    >
      Cargando mapa…
    </div>
  ),
});

/* ═══════════════════════════════════════════════
   ESTADO → COLOR MAPPING
   ═══════════════════════════════════════════════ */

const ESTADO_COLOR: Record<string, string> = {
  DESCONECTADO: '#9E9E9E',
  EN_LINEA: '#2979FF',
  ORDEN_ASIGNADA: '#FFB300',
  EN_CAMINO_RECOGER: '#2979FF',
  EN_PUNTO_RECOGIDA: '#FF5722',
  RECOGIDO: '#9C27B0',
  EN_PUNTO_ENTREGA: '#9C27B0',
  INCIDENCIA: '#FF1744',
};

/* ═══════════════════════════════════════════════
   MOCK ORDEN (for "Simular nueva orden" button)
   ═══════════════════════════════════════════════ */

const MOCK_ORDENES: OrdenActiva[] = [
  {
    id: 'LF-2848',
    tipo: 'envio',
    cliente: 'María López',
    clienteTelefono: '+505 8888-1234',
    origen: 'Col. Los Robles, Managua',
    destino: 'Barrio Monseñor Lezcano',
    origenLat: 12.1289,
    origenLng: -86.2451,
    destinoLat: 12.1421,
    destinoLng: -86.2287,
    paquete: 'Documentos importantes',
    tamano: 'Pequeño',
    fragil: false,
    metodoPago: 'efectivo',
    monto: 120,
    ganancia: 45,
    kmEstimados: 3.2,
    tiempoEstimado: 12,
  },
  {
    id: 'LF-2849',
    tipo: 'compra',
    cliente: 'Laura Fernández',
    clienteTelefono: '+505 8888-5678',
    tiendaNombre: 'Pizza Express',
    origen: 'Pizza Express, Rotonda Rubén Darío',
    destino: 'Villa Fontana',
    origenLat: 12.1189,
    origenLng: -86.2551,
    destinoLat: 12.1321,
    destinoLng: -86.2087,
    paquete: 'Pedido de comida',
    tamano: 'Mediano',
    fragil: false,
    metodoPago: 'transferencia',
    monto: 480,
    ganancia: 55,
    kmEstimados: 4.8,
    tiempoEstimado: 18,
  },
  {
    id: 'LF-2850',
    tipo: 'envio',
    cliente: 'Roberto Sáenz',
    clienteTelefono: '+505 8888-9012',
    origen: 'Bello Horizonte',
    destino: 'Monseñor Lezcano',
    origenLat: 12.1389,
    origenLng: -86.2351,
    destinoLat: 12.1421,
    destinoLng: -86.2287,
    paquete: 'Caja de libros',
    tamano: 'Grande',
    fragil: true,
    metodoPago: 'efectivo',
    monto: 200,
    ganancia: 80,
    kmEstimados: 5.4,
    tiempoEstimado: 22,
  },
];

let mockOrdenIndex = 0;

/* ═══════════════════════════════════════════════
   TIEMPO DISPLAY (1s timer, keyed by ordenId)
   ═══════════════════════════════════════════════ */

function TiempoDisplay() {
  const [segundos, setSegundos] = useState(0);
  useEffect(() => {
    const i = setInterval(() => setSegundos((s) => s + 1), 1000);
    return () => clearInterval(i);
  }, []);
  // Format mm:ss
  const m = Math.floor(segundos / 60);
  const s = segundos % 60;
  const texto = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  return (
    <div
      className="font-mono"
      style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)' }}
    >
      {texto}
    </div>
  );
}

/* ═══════════════════════════════════════════════
   KM COUNTER (vertical slide)
   ═══════════════════════════════════════════════ */

function KmCounter({ value }: { value: number }) {
  const formatted = value.toFixed(2);
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'baseline',
        gap: 4,
        fontFamily: "'JetBrains Mono', monospace",
        overflow: 'hidden',
      }}
    >
      <div style={{ position: 'relative', height: 36, overflow: 'hidden', minWidth: 90 }}>
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.div
            key={formatted}
            initial={{ y: 24, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -24, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              fontSize: 28,
              fontWeight: 700,
              color: 'var(--text)',
              lineHeight: 1.2,
            }}
          >
            {formatted}
          </motion.div>
        </AnimatePresence>
      </div>
      <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-muted)' }}>km</span>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════ */

export default function RepartidorServicio() {
  const {
    estado,
    conectado,
    ordenActiva,
    lat,
    lng,
    kmRecorridos,
    eta,
    statsHoy,
    conectar,
    recibirOrdenAsignada,
    llegarRecogida,
    recogerPaquete,
    llegarEntrega,
    confirmarEntrega,
    toggleChat,
    toggleIncidencia,
  } = useRepartidorStore();

  const showSnackbar = useRepartidorSnackbar();

  /* ─── Real route polyline (OSRM, with straight-line fallback) ─── */
  const [rutaCoordenadas, setRutaCoordenadas] = useState<[number, number][]>([]);

  useEffect(() => {
    // Only fetch a route when we have an active order and we're moving
    // towards either the pickup or the delivery point.
    if (!ordenActiva) {
      setRutaCoordenadas([]);
      return;
    }
    if (estado !== 'EN_CAMINO_RECOGER' && estado !== 'RECOGIDO') {
      // Keep the previously-fetched route visible at the pickup/dropoff points
      return;
    }

    let cancelled = false;
    const destino =
      estado === 'EN_CAMINO_RECOGER'
        ? { lat: ordenActiva.origenLat, lng: ordenActiva.origenLng }
        : { lat: ordenActiva.destinoLat, lng: ordenActiva.destinoLng };

    obtenerRuta({ lat, lng }, destino)
      .then((res) => {
        if (cancelled) return;
        if (res.exito && res.coordenadas.length > 1) {
          setRutaCoordenadas(res.coordenadas);
        } else {
          // Fallback to straight line so the map always shows something
          setRutaCoordenadas(rutaLineaRecta({ lat, lng }, destino));
        }
      })
      .catch(() => {
        if (cancelled) return;
        setRutaCoordenadas(rutaLineaRecta({ lat, lng }, destino));
      });

    return () => {
      cancelled = true;
    };
  }, [ordenActiva, estado, lat, lng]);

  /* Origen/destino positions for the map (only when we have an order) */
  const origenPos: [number, number] | undefined = ordenActiva
    ? [ordenActiva.origenLat, ordenActiva.origenLng]
    : undefined;
  const destinoPos: [number, number] | undefined = ordenActiva
    ? [ordenActiva.destinoLat, ordenActiva.destinoLng]
    : undefined;

  /* ─── Handlers ─── */
  const handleConectar = () => {
    conectar();
    showSnackbar({ message: 'Te has conectado. Esperando asignaciones.' });
  };

  const handleSimularOrden = () => {
    const orden = MOCK_ORDENES[mockOrdenIndex % MOCK_ORDENES.length];
    mockOrdenIndex += 1;
    recibirOrdenAsignada(orden);
  };

  const handleLlegarRecogida = () => {
    llegarRecogida();
    showSnackbar({ message: 'Has llegado al punto de recogida.' });
  };

  const handleRecoger = () => {
    recogerPaquete();
    showSnackbar({ message: 'Paquete recogido. En camino a entrega.' });
  };

  const handleLlegarEntrega = () => {
    llegarEntrega();
    showSnackbar({ message: 'Has llegado al punto de entrega.' });
  };

  const handleConfirmarEntrega = () => {
    confirmarEntrega();
    showSnackbar({ message: 'Entrega confirmada. Servicio completado.', action: 'Ver historial' });
  };

  /* ═══════════════════════════════════════════════
     RENDER — STATE MACHINE
     ═══════════════════════════════════════════════ */

  return (
    <div
      style={{
        position: 'fixed',
        top: 'max(24px, env(safe-area-inset-top, 24px))',
        bottom: 'calc(80px + env(safe-area-inset-bottom, 0px))',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '100%',
        maxWidth: 480,
        zIndex: 1,
        overflow: 'hidden',
      }}
    >
      {/* MAP (background, always) — real Leaflet map, wrapped to prevent
          horizontal scroll on mobile and to clip the rounded corners. */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          overflow: 'hidden',
          background: 'var(--md-surface-variant)',
        }}
      >
        <RepartidorMap
          repartidorPos={[lat, lng]}
          origenPos={origenPos}
          destinoPos={destinoPos}
          rutaCoordenadas={rutaCoordenadas.length > 1 ? rutaCoordenadas : undefined}
          estado={estado}
          altura={300}
          seguirRepartidor
        />
      </div>

      {/* FAB: Chat (top-right) when active order */}
      {ordenActiva && (
        <motion.button
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          onClick={() => toggleChat(ordenActiva.id)}
          aria-label="Chat con cliente"
          style={{
            position: 'absolute',
            top: 16,
            right: 16,
            zIndex: 10,
            width: 48,
            height: 48,
            borderRadius: 16,
            border: 'none',
            background: 'var(--md-surface)',
            color: 'var(--primario)',
            boxShadow: 'var(--md-elevation-3)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <MessageSquare size={22} />
        </motion.button>
      )}

      {/* Status chip (top-left) */}
      {conectado && (
        <div
          style={{
            position: 'absolute',
            top: 16,
            left: 16,
            zIndex: 10,
            padding: '6px 12px',
            borderRadius: 100,
            background: 'var(--lf-glass-bg)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            border: '1px solid var(--lf-glass-border)',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 12,
            fontWeight: 600,
            color: 'var(--text)',
          }}
        >
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: ESTADO_COLOR[estado],
              boxShadow: `0 0 8px ${ESTADO_COLOR[estado]}`,
            }}
          />
          {estado === 'EN_LINEA' && 'En línea'}
          {estado === 'EN_CAMINO_RECOGER' && 'Camino a recoger'}
          {estado === 'EN_PUNTO_RECOGIDA' && 'En punto de recogida'}
          {estado === 'RECOGIDO' && 'En camino a entrega'}
          {estado === 'EN_PUNTO_ENTREGA' && 'En punto de entrega'}
        </div>
      )}

      {/* ─── DESCONECTADO ─── */}
      {estado === 'DESCONECTADO' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: 360,
              padding: 28,
              borderRadius: 24,
              background: 'var(--md-surface)',
              boxShadow: 'var(--md-elevation-3)',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                width: 72,
                height: 72,
                borderRadius: 20,
                background: 'color-mix(in srgb, var(--primario) 12%, transparent)',
                color: 'var(--primario)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
              }}
            >
              <Power size={32} />
            </div>
            <h2
              className="font-syne"
              style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}
            >
              Estás desconectado
            </h2>
            <p
              style={{
                fontSize: 14,
                color: 'var(--text-secondary)',
                marginBottom: 24,
                lineHeight: 1.5,
              }}
            >
              Conéctate para empezar a recibir asignaciones de órdenes en tu zona.
            </p>
            <button
              onClick={handleConectar}
              style={{
                width: '100%',
                minHeight: 52,
                borderRadius: 16,
                border: 'none',
                background: 'var(--primario)',
                color: '#fff',
                fontSize: 15,
                fontWeight: 700,
                fontFamily: "'DM Sans', sans-serif",
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
              }}
            >
              <Power size={20} />
              Conectarse
            </button>
          </div>
        </motion.div>
      )}

      {/* ─── EN_LINEA (waiting for assignment) ─── */}
      {estado === 'EN_LINEA' && (
        <>
          {/* Glass card "Esperando asignación" */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            style={{
              position: 'absolute',
              top: '40%',
              left: 16,
              right: 16,
              transform: 'translateY(-50%)',
              padding: 20,
              borderRadius: 20,
              background: 'rgba(255, 255, 255, 0.88)',
              backdropFilter: 'blur(24px)',
              WebkitBackdropFilter: 'blur(24px)',
              border: '1px solid rgba(255, 255, 255, 0.6)',
              boxShadow: '0 12px 36px rgba(0,0,0,0.1)',
              textAlign: 'center',
            }}
          >
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'easeOut' }}
              style={{
                width: 56,
                height: 56,
                borderRadius: 16,
                background: 'color-mix(in srgb, var(--info, #2979FF) 14%, transparent)',
                color: 'var(--info, #2979FF)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 12px',
              }}
            >
              <Zap size={28} />
            </motion.div>
            <h3
              className="font-syne"
              style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}
            >
              Esperando asignación
            </h3>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
              Te notificaremos cuando llegue una nueva orden.
            </p>
          </motion.div>

          {/* Bottom sheet: today's services + simulate button */}
          <motion.div
            initial={{ y: 200 }}
            animate={{ y: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="lf-bottom-sheet open bottom-sheet open"
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              padding: 16,
              paddingBottom: 20,
              borderRadius: '28px 28px 0 0',
              background: 'var(--md-surface)',
              boxShadow: '0 -12px 48px rgba(0,0,0,0.15)',
            }}
          >
            <div
              className="lf-sheet-handle bottom-sheet-handle"
              style={{
                width: 40,
                height: 4,
                borderRadius: 2,
                background: 'var(--md-outline-variant)',
                margin: '0 auto 12px',
              }}
            />
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 12,
              }}
            >
              <div>
                <div
                  className="font-syne"
                  style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)' }}
                >
                  Servicios de hoy
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  {statsHoy.entregas} entregas completadas
                </div>
              </div>
              <div
                className="font-mono"
                style={{
                  fontSize: 22,
                  fontWeight: 700,
                  color: 'var(--primario)',
                }}
              >
                {statsHoy.entregas}
              </div>
            </div>
            <button
              onClick={handleSimularOrden}
              style={{
                width: '100%',
                minHeight: 48,
                borderRadius: 14,
                border: '1px dashed var(--primario)',
                background: 'color-mix(in srgb, var(--primario) 8%, transparent)',
                color: 'var(--primario)',
                fontSize: 14,
                fontWeight: 600,
                fontFamily: "'DM Sans', sans-serif",
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
              }}
            >
              <PackagePlus size={18} />
              Simular nueva orden
            </button>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'center', marginTop: 8 }}>
              Demo: genera una asignación de prueba.
            </p>
          </motion.div>
        </>
      )}

      {/* ─── EN_CAMINO_RECOGER ─── */}
      {estado === 'EN_CAMINO_RECOGER' && ordenActiva && (
        <BottomSheet>
          <SheetHeader
            label="Camino al punto de recogida"
            color={ESTADO_COLOR[estado]}
            icon={<Navigation size={16} />}
          />
          <OrdenMiniCard orden={ordenActiva} showRecogida />
          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            <StatPill icon={<Clock size={14} />} label="ETA" value={`${eta} min`} />
            <StatPill
              icon={<Navigation size={14} />}
              label="Distancia"
              value={`${ordenActiva.kmEstimados.toFixed(1)} km`}
            />
          </div>
          <PrimaryButton onClick={handleLlegarRecogida} icon={<CheckCircle2 size={18} />}>
            Llegué al punto de recogida
          </PrimaryButton>
        </BottomSheet>
      )}

      {/* ─── EN_PUNTO_RECOGIDA ─── */}
      {estado === 'EN_PUNTO_RECOGIDA' && ordenActiva && (
        <BottomSheet>
          <SheetHeader
            label="En punto de recogida"
            color={ESTADO_COLOR[estado]}
            icon={<MapPin size={16} />}
          />
          <OrdenMiniCard orden={ordenActiva} showRecogida />
          <div
            style={{
              padding: 12,
              borderRadius: 12,
              background: 'color-mix(in srgb, var(--warning, #FFB300) 10%, transparent)',
              border: '1px solid color-mix(in srgb, var(--warning, #FFB300) 30%, transparent)',
              marginBottom: 12,
              fontSize: 12,
              color: 'var(--text-secondary)',
            }}
          >
            Verifica el paquete y confirma la recogida con el cliente.
          </div>
          <PrimaryButton
            onClick={handleRecoger}
            icon={ordenActiva.tipo === 'compra' ? <Store size={18} /> : <Package size={18} />}
          >
            {ordenActiva.tipo === 'compra'
              ? `Recoger pedido de ${ordenActiva.tiendaNombre || 'la tienda'}`
              : 'Recoger paquete'}
          </PrimaryButton>
        </BottomSheet>
      )}

      {/* ─── RECOGIDO (en camino a entrega) ─── */}
      {estado === 'RECOGIDO' && ordenActiva && (
        <BottomSheet>
          <SheetHeader
            label="En camino a la entrega"
            color={ESTADO_COLOR[estado]}
            icon={<Navigation size={16} />}
          />
          {/* Km counter with vertical slide */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 0',
              borderBottom: '1px solid var(--md-outline-variant)',
              marginBottom: 12,
            }}
          >
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 }}>
                Recorrido
              </div>
              <KmCounter value={kmRecorridos} />
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 }}>
                Tiempo
              </div>
              <TiempoDisplay key={ordenActiva?.id || 'none'} />
            </div>
          </div>
          {/* Progress bar */}
          <div
            className="lf-progress lf-progress-sm"
            style={{
              height: 6,
              borderRadius: 3,
              background: 'var(--md-outline-variant)',
              overflow: 'hidden',
              marginBottom: 4,
            }}
          >
            <motion.div
              className="lf-progress-fill"
              animate={{
                width: `${Math.min(100, (kmRecorridos / Math.max(0.1, ordenActiva.kmEstimados)) * 100)}%`,
              }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              style={{ height: '100%', background: 'var(--primario)' }}
            />
          </div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: 11,
              color: 'var(--text-muted)',
              marginBottom: 12,
            }}
          >
            <span>{kmRecorridos.toFixed(2)} km</span>
            <span>{ordenActiva.kmEstimados.toFixed(2)} km</span>
          </div>
          {/* ETA chip */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 12px',
              borderRadius: 12,
              background: 'color-mix(in srgb, var(--info, #2979FF) 10%, transparent)',
              marginBottom: 12,
            }}
          >
            <Clock size={16} color="var(--info, #2979FF)" />
            <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
              Llegada estimada en
            </span>
            <span
              className="font-mono"
              style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}
            >
              {eta} min
            </span>
          </div>
          <PrimaryButton onClick={handleLlegarEntrega} icon={<CheckCircle2 size={18} />}>
            Llegué al punto de entrega
          </PrimaryButton>
        </BottomSheet>
      )}

      {/* ─── EN_PUNTO_ENTREGA ─── */}
      {estado === 'EN_PUNTO_ENTREGA' && ordenActiva && (
        <BottomSheet>
          <SheetHeader
            label="En punto de entrega"
            color={ESTADO_COLOR[estado]}
            icon={<MapPin size={16} />}
          />
          <OrdenMiniCard orden={ordenActiva} showEntrega />
          <div
            style={{
              padding: 12,
              borderRadius: 12,
              background: 'color-mix(in srgb, var(--exito, #00C853) 10%, transparent)',
              border: '1px solid color-mix(in srgb, var(--exito, #00C853) 30%, transparent)',
              marginBottom: 12,
              fontSize: 12,
              color: 'var(--text-secondary)',
            }}
          >
            Entrega el paquete a <strong style={{ color: 'var(--text)' }}>{ordenActiva.cliente}</strong> y confirma la entrega.
          </div>
          <PrimaryButton onClick={handleConfirmarEntrega} icon={<CheckCircle2 size={18} />}>
            Confirmar entrega
          </PrimaryButton>
          <button
            onClick={() => toggleIncidencia(true)}
            style={{
              width: '100%',
              minHeight: 44,
              marginTop: 8,
              borderRadius: 14,
              border: '1px solid color-mix(in srgb, var(--peligro, #FF1744) 30%, transparent)',
              background: 'transparent',
              color: 'var(--peligro, #FF1744)',
              fontSize: 14,
              fontWeight: 600,
              fontFamily: "'DM Sans', sans-serif",
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}
          >
            <AlertTriangle size={16} />
            Reportar incidencia
          </button>
        </BottomSheet>
      )}

      {/* ─── ORDEN_ASIGNADA / INCIDENCIA: handled by overlays ─── */}
      {(estado === 'ORDEN_ASIGNADA' || estado === 'INCIDENCIA') && (
        <div
          className="modal-overlay visible lf-modal-overlay visible"
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(6px)',
            WebkitBackdropFilter: 'blur(6px)',
          }}
        >
          <div style={{ textAlign: 'center', color: '#fff' }}>
            <TrendingUp size={28} color="var(--primario)" style={{ margin: '0 auto 8px' }} />
            <div className="font-syne" style={{ fontSize: 14, fontWeight: 700 }}>
              {estado === 'ORDEN_ASIGNADA' ? 'Revisando orden…' : 'Procesando incidencia…'}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════
   REUSABLE UI BITS
   ═══════════════════════════════════════════════ */

function BottomSheet({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ y: 300 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.3, ease: [0.2, 0, 0, 1] }}
      className="lf-bottom-sheet open bottom-sheet open"
      style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 16,
        paddingBottom: 20,
        borderRadius: '28px 28px 0 0',
        background: 'var(--md-surface)',
        boxShadow: '0 -12px 48px rgba(0,0,0,0.15)',
        maxHeight: '70%',
        overflowY: 'auto',
      }}
    >
      <div
        className="lf-sheet-handle bottom-sheet-handle"
        style={{
          width: 40,
          height: 4,
          borderRadius: 2,
          background: 'var(--md-outline-variant)',
          margin: '0 auto 12px',
        }}
      />
      {children}
    </motion.div>
  );
}

function SheetHeader({
  label,
  color,
  icon,
}: {
  label: string;
  color: string;
  icon: React.ReactNode;
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        marginBottom: 12,
      }}
    >
      <div
        style={{
          width: 28,
          height: 28,
          borderRadius: 8,
          background: color,
          color: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        {icon}
      </div>
      <h3 className="font-syne" style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>
        {label}
      </h3>
    </div>
  );
}

function OrdenMiniCard({
  orden,
  showRecogida,
  showEntrega,
}: {
  orden: OrdenActiva;
  showRecogida?: boolean;
  showEntrega?: boolean;
}) {
  return (
    <div
      style={{
        padding: 12,
        borderRadius: 14,
        background: 'var(--md-surface-variant)',
        marginBottom: 12,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 8,
        }}
      >
        <span
          className="font-mono"
          style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}
        >
          {orden.id}
        </span>
        <span
          style={{
            padding: '3px 10px',
            borderRadius: 100,
            background: orden.tipo === 'compra' ? 'var(--md-primary-container)' : 'var(--md-secondary-container)',
            color: orden.tipo === 'compra' ? 'var(--md-on-primary-container)' : 'var(--md-on-secondary-container)',
            fontSize: 11,
            fontWeight: 600,
            textTransform: 'capitalize',
          }}
        >
          {orden.tipo}
        </span>
      </div>
      {(showRecogida || (!showRecogida && !showEntrega)) && (
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 6 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--exito, #00C853)', marginTop: 6, flexShrink: 0 }} />
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.4 }}>
            {orden.origen}
          </div>
        </div>
      )}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--primario)', marginTop: 6, flexShrink: 0 }} />
        <div style={{ fontSize: 13, color: 'var(--text)', fontWeight: 500, lineHeight: 1.4 }}>
          {orden.destino}
        </div>
      </div>
    </div>
  );
}

function StatPill({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div
      style={{
        flex: 1,
        padding: '8px 10px',
        borderRadius: 12,
        background: 'var(--md-surface-variant)',
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--text-muted)', fontSize: 11 }}>
        {icon}
        {label}
      </div>
      <div className="font-mono" style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>
        {value}
      </div>
    </div>
  );
}

function PrimaryButton({
  children,
  onClick,
  icon,
}: {
  children: React.ReactNode;
  onClick: () => void;
  icon?: React.ReactNode;
}) {
  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      style={{
        width: '100%',
        minHeight: 52,
        borderRadius: 16,
        border: 'none',
        background: 'var(--primario)',
        color: '#fff',
        fontSize: 15,
        fontWeight: 700,
        fontFamily: "'DM Sans', sans-serif",
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        boxShadow: 'var(--lf-shadow-fab)',
      }}
    >
      {icon}
      {children}
    </motion.button>
  );
}
