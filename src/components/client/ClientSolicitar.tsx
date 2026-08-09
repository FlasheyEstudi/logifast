'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPin,
  Package,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Banknote,
  Tag,
  Check,
  Info,
  AlertCircle,
  Copy,
  FileText,
  Box,
  Truck,
  ShieldCheck,
  Map,
  X,
  Zap,
  Calendar,
  ChevronUp,
  Locate,
  Navigation,
} from '@/components/icons';
import { useStore } from '@/lib/store';
import type { DireccionSugerencia, SolicitudEnvio, Order, OrderStatus, PaymentMethod, PaymentStatus } from '@/lib/store';
import { geocodeAddress, buscarUbicacionDinamica, obtenerRuta, reverseGeocode } from '@/lib/osrm';
import { Map as MapComponent, MapMarker, MapRoute, MapControls, MarkerContent, MarkerLabel } from '@/components/ui/map';

/* ═══════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════ */

interface ClientSolicitarProps {
  isDark: boolean;
  userName: string;
  onNavigate: (mod: 'inicio' | 'solicitar' | 'envios' | 'perfil') => void;
  onOpenTracking?: (orderId: string) => void;
  onOpenChat?: (orderId: string) => void;
}

type WizardStep = 1 | 2 | 3 | 4;

interface CostBreakdown {
  base: number;
  distance: number;
  distanceKm: number;
  pickupDistanceKm: number;
  deliveryDistanceKm: number;
  size: number;
  fragile: number;
  subtotal: number;
  promoDiscount: number;
  total: number;
  estimatedTime: string;
}

/* ═══════════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════════ */

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function useCountUp(end: number, duration = 800, start = true) {
  const [value, setValue] = useState(0);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    if (!start) return;
    let startTime: number | null = null;
    const from = value;
    const animate = (ts: number) => {
      if (!startTime) startTime = ts;
      const progress = Math.min((ts - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const nextVal = Math.round(from + (end - from) * eased);
      setValue(nextVal);
      if (progress < 1) rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [end, duration, start]);

  return start ? value : 0;
}

function formatCordobas(n: number): string {
  return `C$ ${n.toLocaleString('es-NI')}`;
}

const DIAS_SEMANA = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const MESES_ES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];
const DIAS_COMPLETOS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

function formatSpanishDate(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00');
  const diaSemana = DIAS_COMPLETOS[d.getDay()];
  const dia = d.getDate();
  const mes = MESES_ES[d.getMonth()];
  return `${diaSemana} ${dia} de ${mes}`;
}

function generateTimeSlots(): string[] {
  const slots: string[] = [];
  for (let h = 7; h <= 20; h++) {
    for (const m of [0, 30]) {
      if (h === 20 && m === 30) break;
      const hour12 = h > 12 ? h - 12 : h;
      const ampm = h >= 12 ? 'PM' : 'AM';
      const hh = hour12 === 0 ? 12 : hour12;
      const mm = m === 0 ? '00' : '30';
      slots.push(`${hh}:${mm} ${ampm}`);
    }
  }
  return slots;
}

const TIME_SLOTS = generateTimeSlots();

/* ═══════════════════════════════════════════════
   STEP LABELS
   ═══════════════════════════════════════════════ */

const STEP_LABELS = ['Dirección', 'Detalles', 'Pago', 'Confirmar'] as const;

/* ═══════════════════════════════════════════════
   SIZE OPTIONS
   ═══════════════════════════════════════════════ */

const SIZE_OPTIONS = [
  { key: 'pequeno' as const, label: 'Pequeño', desc: 'Hasta 1 kg', icon: FileText, surcharge: 0 },
  { key: 'mediano' as const, label: 'Mediano', desc: 'Hasta 5 kg', icon: Package, surcharge: 0 },
  { key: 'grande' as const, label: 'Grande', desc: 'Hasta 15 kg', icon: Box, surcharge: 50 },
];

/* ═══════════════════════════════════════════════
   PROGRESS BAR
   ═══════════════════════════════════════════════ */

function ProgressBar({ currentStep }: { currentStep: WizardStep }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'center', gap: 0, padding: '0 16px', marginBottom: 32 }}>
      {STEP_LABELS.map((label, idx) => {
        const stepNum = (idx + 1) as WizardStep;
        const isCompleted = stepNum < currentStep;
        const isCurrent = stepNum === currentStep;

        return (
          <React.Fragment key={label}>
            {/* Connector line before (not for first) */}
            {idx > 0 && (
              <div style={{ flex: 1, height: 2, marginTop: 17, position: 'relative', overflow: 'hidden', borderRadius: 1 }}>
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'var(--border)',
                    borderRadius: 1,
                  }}
                />
                <motion.div
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: isCompleted || isCurrent ? 1 : 0 }}
                  transition={{ duration: 0.4, ease: 'easeInOut' }}
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'var(--primario)',
                    borderRadius: 1,
                    transformOrigin: 'left',
                  }}
                />
              </div>
            )}

            {/* Circle + label */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, minWidth: 56 }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: isCompleted ? 'var(--primario)' : 'transparent',
                  border: `2px solid ${isCompleted || isCurrent ? 'var(--primario)' : 'var(--border)'}`,
                  transition: 'all 0.3s ease',
                  position: 'relative',
                }}
              >
                {isCompleted ? (
                  <Check size={18} strokeWidth={2.5} color="white" />
                ) : isCurrent ? (
                  <motion.div
                    animate={{ scale: [1, 1.3, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: '50%',
                      background: 'var(--primario)',
                    }}
                  />
                ) : (
                  <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-muted)', fontFamily: "'DM Sans', sans-serif" }}>
                    {stepNum}
                  </span>
                )}
              </div>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: isCurrent ? 600 : 400,
                  color: isCurrent ? 'var(--primario)' : isCompleted ? 'var(--text)' : 'var(--text-muted)',
                  fontFamily: "'DM Sans', sans-serif",
                  whiteSpace: 'nowrap',
                }}
              >
                {label}
              </span>
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );
}

/* ═══════════════════════════════════════════════
   MAP PREVIEW
   ═══════════════════════════════════════════════ */

interface MapPreviewProps {
  origenLat: number;
  origenLng: number;
  destinoLat: number;
  destinoLng: number;
  onDragOrigen: (lat: number, lng: number) => void;
  onDragDestino: (lat: number, lng: number) => void;
}

function SolicitarMapPreview({
  origenLat,
  origenLng,
  destinoLat,
  destinoLng,
  onDragOrigen,
  onDragDestino,
}: MapPreviewProps) {
  const [rutaCoords, setRutaCoords] = useState<[number, number][]>([]);
  const [distanciaKm, setDistanciaKm] = useState(0);
  const [duracionMin, setDuracionMin] = useState(0);
  const mapRef = useRef<any>(null);

  const hasOrigen = origenLat !== 0 && origenLng !== 0;
  const hasDestino = destinoLat !== 0 && destinoLng !== 0;

  const centerLat = hasOrigen ? origenLat : hasDestino ? destinoLat : 12.1364;
  const centerLng = hasOrigen ? origenLng : hasDestino ? destinoLng : -86.2581;

  useEffect(() => {
    if (hasOrigen && hasDestino) {
      obtenerRuta({ lat: origenLat, lng: origenLng }, { lat: destinoLat, lng: destinoLng }).then((res) => {
        if (res.exito && res.coordenadas) {
          setRutaCoords(res.coordenadas);
          setDistanciaKm(res.distanciaKm);
          setDuracionMin(res.duracionMin);
        } else {
          setRutaCoords([[origenLat, origenLng], [destinoLat, destinoLng]]);
          setDistanciaKm(0);
          setDuracionMin(0);
        }
      });
    } else {
      setRutaCoords([]);
      setDistanciaKm(0);
      setDuracionMin(0);
    }
  }, [origenLat, origenLng, destinoLat, destinoLng, hasOrigen, hasDestino]);

  const mapLibreRoute = useMemo(() => {
    return rutaCoords.map(([lat, lng]) => [lng, lat] as [number, number]);
  }, [rutaCoords]);

  useEffect(() => {
    if (mapRef.current && hasOrigen && hasDestino) {
      const minLng = Math.min(origenLng, destinoLng);
      const maxLng = Math.max(origenLng, destinoLng);
      const minLat = Math.min(origenLat, destinoLat);
      const maxLat = Math.max(origenLat, destinoLat);

      try {
        mapRef.current.fitBounds(
          [
            [minLng, minLat],
            [maxLng, maxLat],
          ],
          { padding: 45, duration: 800 }
        );
      } catch (e) {
        // ignore
      }
    }
  }, [hasOrigen, hasDestino, origenLat, origenLng, destinoLat, destinoLng]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', fontFamily: "'DM Sans', sans-serif" }}>
        Vista Previa del Recorrido
      </div>
      <div
        style={{
          position: 'relative',
          height: 270,
          borderRadius: 16,
          border: '1.5px solid var(--border)',
          overflow: 'hidden',
          background: 'var(--bg-alt)',
        }}
      >
        <MapComponent
          ref={mapRef}
          initialViewState={{
            longitude: centerLng,
            latitude: centerLat,
            zoom: hasOrigen && hasDestino ? 12.5 : 13,
          }}
          className="w-full h-full"
        >
          <MapControls position="bottom-right" showZoom showLocate />

          {/* Origen Marker (Verde - Recogida) */}
          {hasOrigen && (
            <MapMarker
              longitude={origenLng}
              latitude={origenLat}
              draggable={true}
              onDragEnd={(lngLat) => {
                onDragOrigen(lngLat.lat, lngLat.lng);
              }}
            >
              <MarkerContent>
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    background: '#34C759',
                    border: '3px solid #FFFFFF',
                    boxShadow: '0 4px 12px rgba(52,199,89,0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#FFFFFF',
                    cursor: 'grab',
                  }}
                >
                  <MapPin size={18} />
                </div>
              </MarkerContent>
              <MarkerLabel position="top">
                <span
                  style={{
                    background: 'rgba(0,0,0,0.75)',
                    color: '#FFFFFF',
                    padding: '2px 6px',
                    borderRadius: 6,
                    fontSize: 11,
                    fontWeight: 600,
                  }}
                >
                  Recogida
                </span>
              </MarkerLabel>
            </MapMarker>
          )}

          {/* Destino Marker (Azul - Entrega) */}
          {hasDestino && (
            <MapMarker
              longitude={destinoLng}
              latitude={destinoLat}
              draggable={true}
              onDragEnd={(lngLat) => {
                onDragDestino(lngLat.lat, lngLat.lng);
              }}
            >
              <MarkerContent>
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    background: '#007AFF',
                    border: '3px solid #FFFFFF',
                    boxShadow: '0 4px 12px rgba(0,122,255,0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#FFFFFF',
                    cursor: 'grab',
                  }}
                >
                  <MapPin size={18} />
                </div>
              </MarkerContent>
              <MarkerLabel position="top">
                <span
                  style={{
                    background: 'rgba(0,0,0,0.75)',
                    color: '#FFFFFF',
                    padding: '2px 6px',
                    borderRadius: 6,
                    fontSize: 11,
                    fontWeight: 600,
                  }}
                >
                  Entrega
                </span>
              </MarkerLabel>
            </MapMarker>
          )}

          {/* Ruta GeoJSON */}
          {hasOrigen && hasDestino && mapLibreRoute.length > 1 && (
            <MapRoute
              coordinates={mapLibreRoute}
              color="#007AFF"
              width={4}
              opacity={0.85}
            />
          )}
        </MapComponent>

        {/* Floating route info overlay */}
        {hasOrigen && hasDestino && (
          <div
            style={{
              position: 'absolute',
              top: 12,
              left: 12,
              zIndex: 10,
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              backdropFilter: 'blur(8px)',
              borderRadius: 12,
              padding: '8px 14px',
              boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700, color: 'var(--text)', fontFamily: "'DM Sans', sans-serif" }}>
              <Navigation size={14} style={{ color: '#007AFF' }} />
              <span>{distanciaKm.toFixed(1)} km</span>
            </div>
            <span style={{ color: 'var(--text-muted)' }}>•</span>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600, fontFamily: "'DM Sans', sans-serif" }}>
              ~{duracionMin > 0 ? Math.round(duracionMin) : Math.round(distanciaKm * 3 + 5)} min
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   AUTOCOMPLETE INPUT
   ═══════════════════════════════════════════════ */

function AddressInput({
  label,
  value,
  onChange,
  onSelect,
  onUseMyLocation,
  dotColor,
  suggestions,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  onSelect: (s: DireccionSugerencia) => void;
  onUseMyLocation?: () => void;
  dotColor: string;
  suggestions: DireccionSugerencia[];
  placeholder: string;
}) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [apiResults, setApiResults] = useState<DireccionSugerencia[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!value || value.trim().length < 2) {
      setApiResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const results = await buscarUbicacionDinamica(value);
        if (results && results.length > 0) {
          const mapped: DireccionSugerencia[] = results.slice(0, 3).map((item, idx) => {
            const parts = item.display_name.split(',');
            const mainName = parts[0] ? parts[0].trim() : item.display_name;
            const subName = parts.slice(1, 3).join(', ').trim() || 'Nicaragua';
            return {
              id: `api-${idx}-${Date.now()}`,
              direccion: mainName,
              barrio: subName,
              lat: item.lat,
              lng: item.lng,
            };
          });
          setApiResults(mapped);
          setShowDropdown(true);
        }
      } catch (e) {}
    }, 300);

    return () => clearTimeout(timer);
  }, [value]);

  const filteredStore = useMemo(() => {
    if (!value || value.trim().length < 2) return [];
    const q = value.toLowerCase();
    return suggestions.filter(
      (s) =>
        s.direccion.toLowerCase().includes(q) ||
        s.barrio.toLowerCase().includes(q)
    );
  }, [value, suggestions]);

  const combinedResults = useMemo(() => {
    const list = [...apiResults, ...filteredStore];
    const seen = new Set();
    const filtered = list.filter((item) => {
      const key = item.direccion.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    return filtered.slice(0, 4);
  }, [filteredStore, apiResults]);

  // Close dropdown when clicking outside
  const handleBlur = useCallback((e: React.FocusEvent) => {
    setTimeout(() => {
      if (containerRef.current && !containerRef.current.contains(document.activeElement)) {
        setShowDropdown(false);
      }
    }, 150);
  }, []);

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6, display: 'block', fontFamily: "'DM Sans', sans-serif" }}>
        {label}
      </label>
      <div style={{ position: 'relative' }}>
        <div
          style={{
            position: 'absolute',
            left: 16,
            top: '50%',
            transform: 'translateY(-50%)',
            width: 12,
            height: 12,
            borderRadius: '50%',
            background: dotColor,
            boxShadow: `0 0 0 3px ${dotColor}33`,
          }}
        />
        <input
          type="text"
          value={value}
          onChange={(e) => {
            const val = e.target.value;
            onChange(val);
            setShowDropdown(true);
          }}
          onFocus={() => {
            setShowDropdown(true);
          }}
          onBlur={handleBlur}
          placeholder={placeholder}
          className="lf-input"
          style={{
            width: '100%',
            padding: '16px 20px 16px 48px',
            borderRadius: 14,
            background: 'var(--surface)',
            color: 'var(--text)',
            fontSize: 15,
          }}
        />
        {value && (
          <button
            onClick={() => { onChange(''); setShowDropdown(false); }}
            style={{
              position: 'absolute',
              right: 12,
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-muted)',
              padding: 4,
              display: 'flex',
            }}
          >
            <X size={16} />
          </button>
        )}
      </div>

      {onUseMyLocation && (
        <button
          type="button"
          onClick={onUseMyLocation}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            background: 'none',
            border: 'none',
            color: 'var(--primario)',
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
            marginTop: 6,
            padding: '2px 0',
            fontFamily: "'DM Sans', sans-serif",
          }}
        >
          <Locate size={14} />
          <span>Usar mi ubicación actual</span>
        </button>
      )}

      <AnimatePresence>
        {showDropdown && combinedResults.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              zIndex: 50,
              marginTop: 4,
              background: 'var(--surface)',
              border: '1.5px solid var(--border)',
              borderRadius: 14,
              boxShadow: 'var(--shadow-md)',
              maxHeight: 220,
              overflowY: 'auto',
            }}
          >
            {combinedResults.map((s) => (
              <button
                key={s.id}
                onMouseDown={() => {
                  onSelect(s);
                  setShowDropdown(false);
                }}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  fontFamily: "'DM Sans', sans-serif",
                  borderBottom: '1px solid var(--border)',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.background = 'var(--primario-soft)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.background = 'transparent';
                }}
              >
                <MapPin size={16} style={{ color: 'var(--primario)', flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{s.direccion}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{s.barrio}</div>
                </div>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   TOGGLE SWITCH
   ═══════════════════════════════════════════════ */

function ToggleSwitch({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }} onClick={() => onChange(!checked)}>
      <div
        style={{
          width: 48,
          height: 26,
          borderRadius: 13,
          background: checked ? 'var(--primario)' : 'var(--border)',
          position: 'relative',
          transition: 'background 0.3s ease',
          flexShrink: 0,
        }}
      >
        <motion.div
          animate={{ x: checked ? 22 : 2 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          style={{
            width: 22,
            height: 22,
            borderRadius: '50%',
            background: 'white',
            position: 'absolute',
            top: 2,
            boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
          }}
        />
      </div>
      <span style={{ fontSize: 15, fontWeight: 500, color: 'var(--text)', fontFamily: "'DM Sans', sans-serif" }}>{label}</span>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   COST BREAKDOWN CARD
   ═══════════════════════════════════════════════ */

function CostCard({ breakdown, showPromo }: { breakdown: CostBreakdown; showPromo?: boolean }) {
  const animatedDistance = useCountUp(Math.round(breakdown.distanceKm * 10) / 10, 600, breakdown.distanceKm > 0);
  const animatedTotal = useCountUp(breakdown.total, 600, breakdown.total > 0);
  const animatedSubtotal = useCountUp(breakdown.subtotal, 600, breakdown.subtotal > 0);

  return (
    <div
      style={{
        background: 'var(--bg-alt)',
        borderRadius: 14,
        padding: 20,
        border: '1px solid var(--border)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: "'DM Sans', sans-serif", marginBottom: 2 }}>Distancia</div>
          <div style={{ fontSize: 18, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", color: 'var(--text)' }}>
            {animatedDistance.toFixed(1)} km
          </div>
        </div>
        <div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: "'DM Sans', sans-serif", marginBottom: 2 }}>Tiempo estimado</div>
          <div style={{ fontSize: 18, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", color: 'var(--text)' }}>
            {breakdown.estimatedTime}
          </div>
        </div>
      </div>

      <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12, marginBottom: 8 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontFamily: "'DM Sans', sans-serif" }}>Recorrido de Recogida (Taller → Origen)</span>
          <span style={{ fontSize: 13, fontFamily: "'JetBrains Mono', monospace", color: 'var(--text)' }}>{breakdown.pickupDistanceKm.toFixed(1)} km</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontFamily: "'DM Sans', sans-serif" }}>Recorrido de Entrega (Origen → Destino)</span>
          <span style={{ fontSize: 13, fontFamily: "'JetBrains Mono', monospace", color: 'var(--text)' }}>{breakdown.deliveryDistanceKm.toFixed(1)} km</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontFamily: "'DM Sans', sans-serif" }}>Distancia Total ({breakdown.distanceKm.toFixed(1)} km × C$ 15)</span>
          <span style={{ fontSize: 13, fontFamily: "'JetBrains Mono', monospace", color: 'var(--text)' }}>{formatCordobas(breakdown.distance)}</span>
        </div>
        {breakdown.size > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontFamily: "'DM Sans', sans-serif" }}>Tamaño del paquete</span>
            <span style={{ fontSize: 13, fontFamily: "'JetBrains Mono', monospace", color: 'var(--text)' }}>+{formatCordobas(breakdown.size)}</span>
          </div>
        )}
        {breakdown.fragile > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontFamily: "'DM Sans', sans-serif" }}>Cargo por fragilidad</span>
            <span style={{ fontSize: 13, fontFamily: "'JetBrains Mono', monospace", color: 'var(--text)' }}>+{formatCordobas(breakdown.fragile)}</span>
          </div>
        )}
        {showPromo && breakdown.promoDiscount > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 13, color: 'var(--exito)', fontFamily: "'DM Sans', sans-serif" }}>Descuento promocional</span>
            <span style={{ fontSize: 13, fontFamily: "'JetBrains Mono', monospace", color: 'var(--exito)' }}>-{formatCordobas(breakdown.promoDiscount)}</span>
          </div>
        )}
      </div>

      <div style={{ borderTop: '1.5px solid var(--border)', paddingTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', fontFamily: "'DM Sans', sans-serif" }}>
          {showPromo ? 'Total' : 'Costo estimado'}
        </span>
        <span style={{ fontSize: 24, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", color: 'var(--primario)' }}>
          {formatCordobas(animatedTotal)}
        </span>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   CHECK ANIMATION (SVG for confirmation)
   ═══════════════════════════════════════════════ */

function CheckAnimation() {
  return (
    <div style={{ width: 80, height: 80, position: 'relative' }}>
      <svg viewBox="0 0 80 80" style={{ width: '100%', height: '100%' }}>
        <motion.circle
          cx="40"
          cy="40"
          r="36"
          fill="none"
          stroke="var(--exito)"
          strokeWidth="3"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.6, ease: 'easeInOut' }}
        />
        <motion.path
          d="M24 42 L34 52 L56 30"
          fill="none"
          stroke="var(--exito)"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.4, delay: 0.5, ease: 'easeOut' }}
        />
      </svg>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════ */

export default function ClientSolicitar({ isDark, userName, onNavigate }: ClientSolicitarProps) {
  const {
    solicitudEnvio,
    setSolicitudEnvio,
    resetSolicitudEnvio,
    confirmarEnvio,
    direccionesSugerencias,
    validateCodigoPromo,
    addOrder,
    orders,
    scheduleMode,
    scheduleDate,
    scheduleTime,
    setScheduleMode,
    setScheduleDate,
    setScheduleTime,
  } = useStore();

  const [currentStep, setCurrentStep] = useState<WizardStep>(1);
  const [direction, setDirection] = useState<1 | -1>(1);
  const [confirmed, setConfirmed] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [confirmedOrderId, setConfirmedOrderId] = useState('');

  // Promo code state
  const [promoInput, setPromoInput] = useState('');
  const [promoExpanded, setPromoExpanded] = useState(false);
  const [promoStatus, setPromoStatus] = useState<'idle' | 'valid' | 'invalid'>('idle');
  const [promoMessage, setPromoMessage] = useState('');
  const [promoDiscount, setPromoDiscount] = useState(0);
  const [promoTipo, setPromoTipo] = useState('');

  // Toast state
  const [toast, setToast] = useState<{ message: string; variant: 'success' | 'error' | 'info' } | null>(null);

  // Change calculation
  const [montoPagoInput, setMontoPagoInput] = useState('');

  // Calendar navigation state
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });

  const showToast = useCallback((message: string, variant: 'success' | 'error' | 'info') => {
    setToast({ message, variant });
    setTimeout(() => setToast(null), 3000);
  }, []);

  /* ─── Cost calculation ─── */
  const costBreakdown = useMemo<CostBreakdown>(() => {
    let PER_KM = 15;
    try {
      const savedTarifas = typeof window !== 'undefined' ? localStorage.getItem('logifast_tarifas') : null;
      if (savedTarifas) {
        const parsed = JSON.parse(savedTarifas);
        if (parsed && parsed.tarifaKm) PER_KM = Number(parsed.tarifaKm);
      }
    } catch {}

    const pickupDist =
      solicitudEnvio.origenLat
        ? haversineKm(12.1364, -86.2581, solicitudEnvio.origenLat, solicitudEnvio.origenLng)
        : 0;

    const deliveryDist =
      solicitudEnvio.origenLat && solicitudEnvio.destinoLat
        ? haversineKm(solicitudEnvio.origenLat, solicitudEnvio.origenLng, solicitudEnvio.destinoLat, solicitudEnvio.destinoLng)
        : 0;

    const totalDist = pickupDist + deliveryDist;
    const distanceCost = Math.round(totalDist * PER_KM);
    const sizeSurcharge = SIZE_OPTIONS.find((s) => s.key === solicitudEnvio.tamano)?.surcharge ?? 0;
    const fragileSurcharge = solicitudEnvio.fragil ? 10 : 0;
    const subtotal = distanceCost + sizeSurcharge + fragileSurcharge;

    let discount = 0;
    if (promoDiscount > 0) {
      if (promoTipo === 'porcentaje') {
        discount = Math.round((subtotal * promoDiscount) / 100);
      } else {
        discount = Math.min(promoDiscount, subtotal);
      }
    }

    const total = Math.max(0, subtotal - discount);
    const estimatedMinutes = Math.max(8, Math.round(totalDist * 4));

    return {
      base: BASE,
      distance: distanceCost,
      distanceKm: totalDist,
      pickupDistanceKm: pickupDist,
      deliveryDistanceKm: deliveryDist,
      size: sizeSurcharge,
      fragile: fragileSurcharge,
      subtotal,
      promoDiscount: discount,
      total,
      estimatedTime: `~${estimatedMinutes} min`,
    };
  }, [solicitudEnvio, promoDiscount, promoTipo]);

  /* ─── Step navigation ─── */
  const goToStep = useCallback(
    (step: WizardStep) => {
      setDirection(step > currentStep ? 1 : -1);
      setCurrentStep(step);
    },
    [currentStep]
  );

  const canContinue = useCallback((): boolean => {
    switch (currentStep) {
      case 1: {
        const hasOrigen = (solicitudEnvio.origen && solicitudEnvio.origen.trim().length > 0) || (solicitudEnvio.origenLat !== 0 && solicitudEnvio.origenLng !== 0);
        const hasDestino = (solicitudEnvio.destino && solicitudEnvio.destino.trim().length > 0) || (solicitudEnvio.destinoLat !== 0 && solicitudEnvio.destinoLng !== 0);
        if (!hasOrigen || !hasDestino) return false;
        if (scheduleMode === 'programar' && (!scheduleDate || !scheduleTime)) return false;
        return true;
      }
      case 2:
        return solicitudEnvio.descripcion.length > 0;
      case 3:
        return true;
      case 4:
        return solicitudEnvio.terminosAceptados;
      default:
        return false;
    }
  }, [currentStep, solicitudEnvio, scheduleMode, scheduleDate, scheduleTime]);

  /* ─── Swap addresses ─── */
  const handleSwap = useCallback(() => {
    const newOrigen = solicitudEnvio.destino;
    const newDestino = solicitudEnvio.origen;
    const newOrigenLat = solicitudEnvio.destinoLat;
    const newOrigenLng = solicitudEnvio.destinoLng;
    const newDestinoLat = solicitudEnvio.origenLat;
    const newDestinoLng = solicitudEnvio.origenLng;
    setSolicitudEnvio({
      origen: newOrigen,
      destino: newDestino,
      origenLat: newOrigenLat,
      origenLng: newOrigenLng,
      destinoLat: newDestinoLat,
      destinoLng: newDestinoLng,
    });
  }, [solicitudEnvio, setSolicitudEnvio]);

  /* ─── Use GPS Location ─── */
  const handleUseMyLocation = useCallback(
    (field: 'origen' | 'destino') => {
      if (typeof window === 'undefined' || !navigator.geolocation) {
        showToast('La geolocalización no está disponible en este navegador.', 'error');
        return;
      }

      showToast('Obteniendo tu posición GPS...', 'info');

      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          const tempLabel = `Ubicación GPS (${lat.toFixed(4)}, ${lng.toFixed(4)})`;

          // Immediately update state so text field and coordinates populate right away
          if (field === 'origen') {
            setSolicitudEnvio({ origen: tempLabel, origenLat: lat, origenLng: lng });
          } else {
            setSolicitudEnvio({ destino: tempLabel, destinoLat: lat, destinoLng: lng });
          }

          // Then reverse geocode to refine address label cleanly
          const realAddress = await reverseGeocode(lat, lng);
          if (field === 'origen') {
            setSolicitudEnvio({ origen: realAddress, origenLat: lat, origenLng: lng });
          } else {
            setSolicitudEnvio({ destino: realAddress, destinoLat: lat, destinoLng: lng });
          }
          showToast('Ubicación actual establecida correctamente.', 'success');
        },
        (err) => {
          console.error('[geolocation error]', err);
          showToast('No se pudo obtener la ubicación GPS. Revisa tus permisos.', 'error');
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    },
    [setSolicitudEnvio, showToast]
  );

  /* ─── Drag Markers on Map ─── */
  const handleDragOrigen = useCallback(
    async (lat: number, lng: number) => {
      const addressName = await reverseGeocode(lat, lng);
      setSolicitudEnvio({
        origen: addressName,
        origenLat: lat,
        origenLng: lng,
      });
    },
    [setSolicitudEnvio]
  );

  const handleDragDestino = useCallback(
    async (lat: number, lng: number) => {
      const addressName = await reverseGeocode(lat, lng);
      setSolicitudEnvio({
        destino: addressName,
        destinoLat: lat,
        destinoLng: lng,
      });
    },
    [setSolicitudEnvio]
  );

  /* ─── Apply promo code ─── */
  const handleApplyPromo = useCallback(async () => {
    if (!promoInput.trim()) return;
    try {
      const res = await fetch('/api/codigos/validar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          codigo: promoInput.trim(),
          montoSubtotal: costBreakdown.subtotal,
        }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        setPromoDiscount(data.descuentoCalculado);
        setPromoTipo(data.tipoDescuento);
        setPromoStatus('valid');
        setSolicitudEnvio({ codigoPromo: data.codigo, descuento: data.descuentoCalculado });
        setPromoMessage(data.mensaje);
        showToast('¡Código promocional aplicado!', 'success');
      } else {
        setPromoDiscount(0);
        setPromoTipo('');
        setPromoStatus('invalid');
        setPromoMessage(data.error || 'Código no válido o expirado');
        showToast(data.error || 'Código no válido', 'error');
      }
    } catch {
      const result = validateCodigoPromo(promoInput.trim());
      if (result.valid) {
        setPromoDiscount(result.descuento);
        setPromoTipo(result.tipo);
        setPromoStatus('valid');
        setSolicitudEnvio({ codigoPromo: promoInput.trim().toUpperCase(), descuento: result.descuento });
        setPromoMessage(`¡${result.descuento}% de descuento aplicado!`);
        showToast('¡Código promocional aplicado!', 'success');
      } else {
        setPromoDiscount(0);
        setPromoTipo('');
        setPromoStatus('invalid');
        setPromoMessage('Código no válido o expirado');
        showToast('Código no válido', 'error');
      }
    }
  }, [promoInput, costBreakdown.subtotal, validateCodigoPromo, setSolicitudEnvio, showToast]);

  /* ─── Copy bank details ─── */
  const handleCopyBank = useCallback(() => {
    const bankDetails = 'Banco BAC - Cta: 1234-5678-90 - LOGIFAST S.A.';
    navigator.clipboard.writeText(bankDetails).then(() => {
      showToast('Datos bancarios copiados al portapapeles', 'success');
    });
  }, [showToast]);

  /* ─── Confirm shipping ─── */
  const handleConfirm = useCallback(() => {
    setConfirming(true);
    // Generate new order ID
    const lastId = orders.length > 0 ? parseInt(orders[0].id.replace('LF-', ''), 10) : 2860;
    const newId = `LF-${lastId + 1}`;
    const randomPin = String(Math.floor(1000 + Math.random() * 9000));

    setTimeout(() => {
      const now = new Date();
      const fecha = now.toISOString().split('T')[0];
      const hora = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

      const isScheduled = scheduleMode === 'programar' && scheduleDate && scheduleTime;
      const scheduleNote = isScheduled
        ? ` [Programado: ${formatSpanishDate(scheduleDate)} a las ${scheduleTime}]`
        : '';

      const newOrder: Order = {
        id: newId,
        codigoPin: randomPin,
        cliente: userName,
        clienteTelefono: '+505 8888-0000',
        origen: solicitudEnvio.origen,
        destino: solicitudEnvio.destino,
        origenLat: solicitudEnvio.origenLat,
        origenLng: solicitudEnvio.origenLng,
        destinoLat: solicitudEnvio.destinoLat,
        destinoLng: solicitudEnvio.destinoLng,
        repartidor: null,
        repartidorInitials: '',
        descripcion: solicitudEnvio.descripcion + scheduleNote,
        monto: costBreakdown.total,
        estado: isScheduled ? 'programada' as OrderStatus : 'pendiente' as OrderStatus,
        metodoPago: solicitudEnvio.metodoPago as PaymentMethod,
        estadoPago: solicitudEnvio.metodoPago === 'transferencia' ? ('pendiente' as PaymentStatus) : ('pendiente' as PaymentStatus),
        fecha: isScheduled ? scheduleDate! : fecha,
        hora: isScheduled ? scheduleTime! : hora,
        timeline: [
          { step: isScheduled ? 'Programada' : 'Orden creada', hora: isScheduled ? scheduleTime! : hora, completado: true },
          { step: 'En camino', hora: '—', completado: false },
          { step: 'Recogida', hora: '—', completado: false },
          { step: 'Entregada', hora: '—', completado: false },
        ],
      };

      // Persistir en la base de datos vía API
      fetch('/api/ordenes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipo: 'envio',
          codigoPin: randomPin,
          origen: solicitudEnvio.origen,
          destino: solicitudEnvio.destino,
          origenLat: solicitudEnvio.origenLat,
          origenLng: solicitudEnvio.origenLng,
          destinoLat: solicitudEnvio.destinoLat,
          destinoLng: solicitudEnvio.destinoLng,
          paquete: solicitudEnvio.descripcion + scheduleNote,
          tamano: solicitudEnvio.tamano || 'Mediano',
          fragil: solicitudEnvio.fragil || false,
          metodoPago: solicitudEnvio.metodoPago,
          monto: costBreakdown.total,
          ganancia: Math.round(costBreakdown.total * 0.7),
          kmEstimados: costBreakdown.distanceKm || 3.5,
          tiempoEstimado: Math.round((costBreakdown.distanceKm || 3.5) * 4) || 15,
        }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data && data.orden) {
            const persistedOrder: Order = {
              ...newOrder,
              id: data.orden.id || newId,
            };
            addOrder(persistedOrder);
            confirmarEnvio(data.orden.id || newId);
            setConfirmedOrderId(data.orden.id || newId);
          } else {
            addOrder(newOrder);
            confirmarEnvio(newId);
            setConfirmedOrderId(newId);
          }
        })
        .catch((err) => {
          console.error('[handleConfirm POST /api/ordenes]', err);
          addOrder(newOrder);
          confirmarEnvio(newId);
          setConfirmedOrderId(newId);
        })
        .finally(() => {
          setConfirming(false);
          setConfirmed(true);
        });
    }, 2000);
  }, [orders, userName, solicitudEnvio, costBreakdown.total, addOrder, confirmarEnvio, scheduleMode, scheduleDate, scheduleTime]);

  /* ─── Slide animation variants ─── */
  const slideVariants = {
    enter: (dir: number) => ({ x: dir > 0 ? 80 : -80, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir > 0 ? -80 : 80, opacity: 0 }),
  };

  /* ─── Render step content ─── */
  const renderStep = () => {
    switch (currentStep) {
      /* ═══ STEP 1: DIRECCIONES ═══ */
      case 1:
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <h2 style={{ fontSize: 24, fontWeight: 700, fontFamily: "'Syne', sans-serif", color: 'var(--text)', margin: 0 }}>
              ¿Dónde recogemos y entregamos?
            </h2>

            <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: 12 }}>
              <AddressInput
                label="Dirección de recogida"
                value={solicitudEnvio.origen}
                onChange={(v) => {
                  setSolicitudEnvio({ origen: v });
                }}
                onSelect={(s) =>
                  setSolicitudEnvio({ origen: s.direccion, origenLat: s.lat, origenLng: s.lng })
                }
                onUseMyLocation={() => handleUseMyLocation('origen')}
                dotColor="var(--exito)"
                suggestions={direccionesSugerencias}
                placeholder="Ej: Metrocentro, Managua"
              />

              {/* Swap button */}
              <div style={{ display: 'flex', justifyContent: 'center', position: 'relative', height: 0, zIndex: 10 }}>
                <motion.button
                  whileTap={{ rotate: 180 }}
                  transition={{ duration: 0.3 }}
                  onClick={handleSwap}
                  disabled={!solicitudEnvio.origen && !solicitudEnvio.destino}
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: '50%',
                    border: '1.5px solid var(--border)',
                    background: 'var(--surface)',
                    cursor: solicitudEnvio.origen || solicitudEnvio.destino ? 'pointer' : 'default',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'absolute',
                    top: -18,
                    boxShadow: 'var(--shadow-sm)',
                    opacity: solicitudEnvio.origen || solicitudEnvio.destino ? 1 : 0.4,
                  }}
                >
                  <ArrowUpDown size={16} style={{ color: 'var(--text-secondary)' }} />
                </motion.button>
              </div>

              <AddressInput
                label="Dirección de entrega"
                value={solicitudEnvio.destino}
                onChange={(v) => {
                  setSolicitudEnvio({ destino: v });
                }}
                onSelect={(s) =>
                  setSolicitudEnvio({ destino: s.direccion, destinoLat: s.lat, destinoLng: s.lng })
                }
                onUseMyLocation={() => handleUseMyLocation('destino')}
                dotColor="var(--primario)"
                suggestions={direccionesSugerencias}
                placeholder="Ej: Col. Los Robles, Managua"
              />
            </div>

            {/* Interactive Map preview */}
            <SolicitarMapPreview
              origenLat={solicitudEnvio.origenLat || 12.1264}
              origenLng={solicitudEnvio.origenLng || -86.2652}
              destinoLat={solicitudEnvio.destinoLat || 12.1402}
              destinoLng={solicitudEnvio.destinoLng || -86.2954}
              onDragOrigen={handleDragOrigen}
              onDragDestino={handleDragDestino}
            />

            {/* Schedule Toggle */}
            <div style={{ marginTop: 24, marginBottom: 16 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 10, fontFamily: "'DM Sans', sans-serif" }}>
                ¿Cuándo?
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() => setScheduleMode('ahora')}
                  style={{
                    flex: 1,
                    padding: '10px 16px',
                    borderRadius: 10,
                    border: scheduleMode === 'ahora' ? '2px solid var(--primario)' : '1px solid var(--border)',
                    background: scheduleMode === 'ahora' ? 'var(--primario-soft)' : 'transparent',
                    color: scheduleMode === 'ahora' ? 'var(--primario)' : 'var(--text-muted)',
                    fontSize: 14,
                    fontWeight: scheduleMode === 'ahora' ? 600 : 500,
                    cursor: 'pointer',
                    fontFamily: "'DM Sans', sans-serif",
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    transition: 'all 0.2s ease',
                  }}
                >
                  <Zap size={16} />
                  Ahora
                </button>
                <button
                  onClick={() => setScheduleMode('programar')}
                  style={{
                    flex: 1,
                    padding: '10px 16px',
                    borderRadius: 10,
                    border: scheduleMode === 'programar' ? '2px solid var(--primario)' : '1px solid var(--border)',
                    background: scheduleMode === 'programar' ? 'var(--primario-soft)' : 'transparent',
                    color: scheduleMode === 'programar' ? 'var(--primario)' : 'var(--text-muted)',
                    fontSize: 14,
                    fontWeight: scheduleMode === 'programar' ? 600 : 500,
                    cursor: 'pointer',
                    fontFamily: "'DM Sans', sans-serif",
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    transition: 'all 0.2s ease',
                  }}
                >
                  <Calendar size={16} />
                  Programar para después
                </button>
              </div>
            </div>

            {/* Schedule Calendar & Time - only when programar */}
            {scheduleMode === 'programar' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
              >
                {/* Calendar */}
                <div
                  style={{
                    background: 'var(--surface)',
                    borderRadius: 14,
                    border: '1.5px solid var(--border)',
                    padding: 16,
                  }}
                >
                  {/* Month navigation */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <button
                      onClick={() => {
                        const m = calendarMonth.month === 0 ? 11 : calendarMonth.month - 1;
                        const y = calendarMonth.month === 0 ? calendarMonth.year - 1 : calendarMonth.year;
                        setCalendarMonth({ year: y, month: m });
                      }}
                      style={{
                        background: 'none',
                        border: '1px solid var(--border)',
                        borderRadius: 8,
                        padding: '4px 8px',
                        cursor: 'pointer',
                        color: 'var(--text)',
                        display: 'flex',
                        alignItems: 'center',
                      }}
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', fontFamily: "'DM Sans', sans-serif" }}>
                      {MESES_ES[calendarMonth.month]} {calendarMonth.year}
                    </span>
                    <button
                      onClick={() => {
                        const m = calendarMonth.month === 11 ? 0 : calendarMonth.month + 1;
                        const y = calendarMonth.month === 11 ? calendarMonth.year + 1 : calendarMonth.year;
                        setCalendarMonth({ year: y, month: m });
                      }}
                      style={{
                        background: 'none',
                        border: '1px solid var(--border)',
                        borderRadius: 8,
                        padding: '4px 8px',
                        cursor: 'pointer',
                        color: 'var(--text)',
                        display: 'flex',
                        alignItems: 'center',
                      }}
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>

                  {/* Day headers */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2, marginBottom: 4 }}>
                    {DIAS_SEMANA.map((d) => (
                      <div
                        key={d}
                        style={{
                          textAlign: 'center',
                          fontSize: 11,
                          fontWeight: 600,
                          color: 'var(--text-muted)',
                          fontFamily: "'DM Sans', sans-serif",
                          padding: '4px 0',
                        }}
                      >
                        {d}
                      </div>
                    ))}
                  </div>

                  {/* Day grid */}
                  {(() => {
                    const firstDay = new Date(calendarMonth.year, calendarMonth.month, 1);
                    let startDow = firstDay.getDay(); // 0=Sun
                    startDow = startDow === 0 ? 6 : startDow - 1; // convert to Mon=0
                    const daysInMonth = new Date(calendarMonth.year, calendarMonth.month + 1, 0).getDate();
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    const maxDate = new Date(today);
                    maxDate.setDate(maxDate.getDate() + 30);

                    const cells: React.ReactNode[] = [];
                    // Empty cells before first day
                    for (let i = 0; i < startDow; i++) {
                      cells.push(<div key={`empty-${i}`} />);
                    }
                    // Day cells
                    for (let day = 1; day <= daysInMonth; day++) {
                      const dateObj = new Date(calendarMonth.year, calendarMonth.month, day);
                      dateObj.setHours(0, 0, 0, 0);
                      const dateStr = `${calendarMonth.year}-${String(calendarMonth.month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                      const isSunday = dateObj.getDay() === 0;
                      const isPast = dateObj < today;
                      const isAfterMax = dateObj > maxDate;
                      const isDisabled = isSunday || isPast || isAfterMax;
                      const isToday = dateObj.getTime() === today.getTime();
                      const isSelected = scheduleDate === dateStr;

                      cells.push(
                        <button
                          key={dateStr}
                          disabled={isDisabled}
                          onClick={() => !isDisabled && setScheduleDate(dateStr)}
                          style={{
                            width: '100%',
                            aspectRatio: '1',
                            borderRadius: '50%',
                            border: isSelected
                              ? 'none'
                              : isToday
                                ? '1.5px solid var(--primario)'
                                : 'none',
                            background: isSelected ? 'var(--primario)' : 'transparent',
                            color: isSelected
                              ? 'white'
                              : isDisabled
                                ? 'var(--text-muted)'
                                : 'var(--text)',
                            fontSize: 13,
                            fontWeight: isSelected ? 600 : 400,
                            fontFamily: "'DM Sans', sans-serif",
                            cursor: isDisabled ? 'default' : 'pointer',
                            opacity: isDisabled ? 0.35 : 1,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          {day}
                        </button>
                      );
                    }

                    return (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}>
                        {cells}
                      </div>
                    );
                  })()}
                </div>

                {/* Time selector */}
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8, display: 'block', fontFamily: "'DM Sans', sans-serif" }}>
                    Hora de recogida
                  </label>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(4, 1fr)',
                      gap: 6,
                      maxHeight: 180,
                      overflowY: 'auto',
                      padding: '4px 0',
                    }}
                  >
                    {(() => {
                      const now = new Date();
                      const isToday = scheduleDate === `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

                      return TIME_SLOTS.map((slot) => {
                        const isSelected = scheduleTime === slot;
                        let isDisabled = false;

                        if (isToday && scheduleDate) {
                          // Parse slot time to compare
                          const parts = slot.match(/(\d+):(\d+)\s*(AM|PM)/);
                          if (parts) {
                            let h = parseInt(parts[1]);
                            const m = parseInt(parts[2]);
                            if (parts[3] === 'PM' && h !== 12) h += 12;
                            if (parts[3] === 'AM' && h === 12) h = 0;
                            const slotMinutes = h * 60 + m;
                            const nowMinutes = now.getHours() * 60 + now.getMinutes();
                            isDisabled = slotMinutes <= nowMinutes;
                          }
                        }

                        return (
                          <button
                            key={slot}
                            disabled={isDisabled}
                            onClick={() => !isDisabled && setScheduleTime(slot)}
                            style={{
                              padding: '8px 4px',
                              borderRadius: 8,
                              border: isSelected
                                ? '2px solid var(--primario)'
                                : '1px solid var(--border)',
                              background: isSelected ? 'var(--primario-soft)' : 'transparent',
                              color: isSelected
                                ? 'var(--primario)'
                                : isDisabled
                                  ? 'var(--text-muted)'
                                  : 'var(--text)',
                              fontSize: 12,
                              fontWeight: isSelected ? 600 : 500,
                              fontFamily: "'JetBrains Mono', monospace",
                              cursor: isDisabled ? 'default' : 'pointer',
                              opacity: isDisabled ? 0.35 : 1,
                              textAlign: 'center',
                              transition: 'all 0.15s ease',
                            }}
                          >
                            {slot}
                          </button>
                        );
                      });
                    })()}
                  </div>
                </div>

                {/* Preview card */}
                {scheduleDate && scheduleTime && (
                  <motion.div
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{
                      marginTop: 4,
                      padding: '12px 16px',
                      background: 'var(--bg-alt)',
                      borderRadius: 12,
                      fontSize: 13,
                      color: 'var(--text)',
                      fontFamily: "'DM Sans', sans-serif",
                      border: '1px solid var(--border)',
                    }}
                  >
                    Tu envío será recogido el <strong>{formatSpanishDate(scheduleDate)}</strong> a las <strong>{scheduleTime}</strong>
                  </motion.div>
                )}
              </motion.div>
            )}

            {/* Auto quote */}
            {solicitudEnvio.origen && solicitudEnvio.destino && costBreakdown.distanceKm > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <CostCard breakdown={costBreakdown} />
              </motion.div>
            )}
          </div>
        );

      /* ═══ STEP 2: DETALLES ═══ */
      case 2:
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <h2 style={{ fontSize: 24, fontWeight: 700, fontFamily: "'Syne', sans-serif", color: 'var(--text)', margin: 0 }}>
              ¿Qué envías?
            </h2>

            {/* Descripción */}
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6, display: 'block', fontFamily: "'DM Sans', sans-serif" }}>
                Descripción del paquete
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  value={solicitudEnvio.descripcion}
                  onChange={(e) => {
                    if (e.target.value.length <= 100) {
                      setSolicitudEnvio({ descripcion: e.target.value });
                    }
                  }}
                  placeholder="Ej: Documentos legales, caja mediana..."
                  className="lf-input"
                  style={{
                    width: '100%',
                    paddingRight: 56,
                  }}
                />
                <span
                  style={{
                    position: 'absolute',
                    right: 14,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    fontSize: 12,
                    fontFamily: "'JetBrains Mono', monospace",
                    color: solicitudEnvio.descripcion.length >= 90 ? 'var(--peligro)' : 'var(--text-muted)',
                  }}
                >
                  {solicitudEnvio.descripcion.length}/100
                </span>
              </div>
            </div>

            {/* Tamaño */}
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8, display: 'block', fontFamily: "'DM Sans', sans-serif" }}>
                Tamaño del paquete
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                {SIZE_OPTIONS.map((opt) => {
                  const isSelected = solicitudEnvio.tamano === opt.key;
                  const Icon = opt.icon;
                  return (
                    <motion.button
                      key={opt.key}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => setSolicitudEnvio({ tamano: opt.key })}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 8,
                        padding: '16px 8px',
                        borderRadius: 14,
                        border: `2px solid ${isSelected ? 'var(--primario)' : 'var(--border)'}`,
                        background: isSelected ? 'var(--primario-soft)' : 'var(--surface)',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        textAlign: 'center',
                      }}
                    >
                      <Icon
                        size={24}
                        style={{
                          color: isSelected ? 'var(--primario)' : 'var(--text-muted)',
                          transition: 'color 0.2s',
                        }}
                      />
                      <span
                        style={{
                          fontSize: 14,
                          fontWeight: 600,
                          color: isSelected ? 'var(--primario)' : 'var(--text)',
                          fontFamily: "'DM Sans', sans-serif",
                          transition: 'color 0.2s',
                        }}
                      >
                        {opt.label}
                      </span>
                      <span
                        style={{
                          fontSize: 12,
                          color: 'var(--text-muted)',
                          fontFamily: "'DM Sans', sans-serif",
                        }}
                      >
                        {opt.desc}
                      </span>
                      {opt.surcharge > 0 && (
                        <span
                          style={{
                            fontSize: 11,
                            fontFamily: "'JetBrains Mono', monospace",
                            color: 'var(--text-secondary)',
                          }}
                        >
                          +C$ {opt.surcharge}
                        </span>
                      )}
                    </motion.button>
                  );
                })}
              </div>
            </div>

            {/* Instrucciones */}
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6, display: 'block', fontFamily: "'DM Sans', sans-serif" }}>
                Instrucciones especiales (opcional)
              </label>
              <textarea
                value={solicitudEnvio.instrucciones}
                onChange={(e) => {
                  if (e.target.value.length <= 200) {
                    setSolicitudEnvio({ instrucciones: e.target.value });
                  }
                }}
                placeholder="Ej: Tocar timbre dos veces, dejar con el portero..."
                rows={3}
                className="lf-textarea"
                style={{
                  width: '100%',
                }}
              />
              <div style={{ textAlign: 'right', marginTop: 4 }}>
                <span
                  style={{
                    fontSize: 11,
                    fontFamily: "'JetBrains Mono', monospace",
                    color: solicitudEnvio.instrucciones.length >= 180 ? 'var(--peligro)' : 'var(--text-muted)',
                  }}
                >
                  {solicitudEnvio.instrucciones.length}/200
                </span>
              </div>
            </div>

            {/* Frágil */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '14px 16px',
                borderRadius: 12,
                border: '1.5px solid var(--border)',
                background: 'var(--surface)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <ShieldCheck size={20} style={{ color: solicitudEnvio.fragil ? 'var(--warning)' : 'var(--text-muted)' }} />
                <div>
                  <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)', fontFamily: "'DM Sans', sans-serif" }}>Paquete frágil</span>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: "'DM Sans', sans-serif", marginLeft: 8 }}>+C$ 10</span>
                </div>
              </div>
              <ToggleSwitch
                checked={solicitudEnvio.fragil}
                onChange={(v) => setSolicitudEnvio({ fragil: v })}
                label=""
              />
            </div>

            {/* Updated quote */}
            {costBreakdown.total > 0 && <CostCard breakdown={costBreakdown} />}
          </div>
        );

      /* ═══ STEP 3: PAGO ═══ */
      case 3:
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <h2 style={{ fontSize: 24, fontWeight: 700, fontFamily: "'Syne', sans-serif", color: 'var(--text)', margin: 0 }}>
              ¿Cómo pagas?
            </h2>

            {/* Payment method cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
              {[
                {
                  key: 'efectivo' as const,
                  label: 'Efectivo',
                  desc: 'Paga al repartidor al recibir',
                  icon: Banknote,
                },
                {
                  key: 'transferencia' as const,
                  label: 'Transferencia',
                  desc: 'Transfiere antes de la entrega',
                  icon: CreditCard,
                },
              ].map((method) => {
                const isSelected = solicitudEnvio.metodoPago === method.key;
                const Icon = method.icon;
                return (
                  <motion.button
                    key={method.key}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setSolicitudEnvio({ metodoPago: method.key })}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 10,
                      padding: '20px 12px',
                      borderRadius: 14,
                      border: `2px solid ${isSelected ? 'var(--primario)' : 'var(--border)'}`,
                      background: isSelected ? 'var(--primario-soft)' : 'var(--surface)',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      textAlign: 'center',
                    }}
                  >
                    <Icon
                      size={28}
                      style={{
                        color: isSelected ? 'var(--primario)' : 'var(--text-muted)',
                        transition: 'color 0.2s',
                      }}
                    />
                    <span
                      style={{
                        fontSize: 15,
                        fontWeight: 600,
                        color: isSelected ? 'var(--primario)' : 'var(--text)',
                        fontFamily: "'DM Sans', sans-serif",
                      }}
                    >
                      {method.label}
                    </span>
                    <span
                      style={{
                        fontSize: 12,
                        color: 'var(--text-muted)',
                        fontFamily: "'DM Sans', sans-serif",
                        lineHeight: 1.3,
                      }}
                    >
                      {method.desc}
                    </span>
                  </motion.button>
                );
              })}
            </div>

            {/* Conditional content for payment method */}
            {solicitudEnvio.metodoPago === 'efectivo' && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
              >
                {/* Info box */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '12px 16px',
                    borderRadius: 12,
                    background: 'rgba(255, 179, 0, 0.08)',
                    border: '1px solid rgba(255, 179, 0, 0.2)',
                  }}
                >
                  <Info size={18} style={{ color: 'var(--warning)', flexShrink: 0 }} />
                  <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontFamily: "'DM Sans', sans-serif" }}>
                    Recuerda tener el monto exacto
                  </span>
                </div>

                {/* Change calculator */}
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6, display: 'block', fontFamily: "'DM Sans', sans-serif" }}>
                    ¿Con cuánto vas a pagar? (opcional)
                  </label>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span style={{ fontSize: 15, color: 'var(--text-muted)', fontFamily: "'JetBrains Mono', monospace" }}>C$</span>
                    <input
                      type="number"
                      value={montoPagoInput}
                      onChange={(e) => setMontoPagoInput(e.target.value)}
                      placeholder="0"
                      min={0}
                      className="lf-input"
                      style={{
                        flex: 1,
                        padding: '12px 14px',
                        borderRadius: 10,
                        fontFamily: "'JetBrains Mono', monospace",
                      }}
                    />
                  </div>
                  {montoPagoInput && parseInt(montoPagoInput) > costBreakdown.total && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      style={{
                        marginTop: 8,
                        padding: '10px 14px',
                        borderRadius: 10,
                        background: 'var(--bg-alt)',
                        fontSize: 13,
                        fontFamily: "'DM Sans', sans-serif",
                        color: 'var(--text-secondary)',
                      }}
                    >
                      Tu cambio:{' '}
                      <span style={{ fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", color: 'var(--exito)' }}>
                        C$ {parseInt(montoPagoInput) - costBreakdown.total}
                      </span>
                    </motion.div>
                  )}
                  {montoPagoInput && parseInt(montoPagoInput) < costBreakdown.total && parseInt(montoPagoInput) > 0 && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      style={{
                        marginTop: 8,
                        padding: '10px 14px',
                        borderRadius: 10,
                        background: 'rgba(255,23,68,0.06)',
                        border: '1px solid rgba(255,23,68,0.15)',
                        fontSize: 13,
                        fontFamily: "'DM Sans', sans-serif",
                        color: 'var(--peligro)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                      }}
                    >
                      <AlertCircle size={14} />
                      Monto insuficiente
                    </motion.div>
                  )}
                </div>
              </motion.div>
            )}

            {solicitudEnvio.metodoPago === 'transferencia' && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
              >
                {/* Info box with bank details */}
                <div
                  style={{
                    padding: '16px',
                    borderRadius: 12,
                    background: 'rgba(41,121,255,0.06)',
                    border: '1px solid rgba(41,121,255,0.15)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                    <CreditCard size={16} style={{ color: 'var(--info)' }} />
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', fontFamily: "'DM Sans', sans-serif" }}>Datos bancarios</span>
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--text-secondary)', fontFamily: "'DM Sans', sans-serif", lineHeight: 1.7 }}>
                    <div><strong>Banco:</strong> BAC</div>
                    <div><strong>Cuenta:</strong> 1234-5678-90</div>
                    <div><strong>Titular:</strong> LOGIFAST S.A.</div>
                  </div>
                </div>

                <button
                  onClick={handleCopyBank}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    padding: '12px 16px',
                    borderRadius: 10,
                    border: '1.5px solid var(--border)',
                    background: 'var(--surface)',
                    color: 'var(--text)',
                    fontSize: 14,
                    fontFamily: "'DM Sans', sans-serif",
                    fontWeight: 500,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  <Copy size={16} />
                  Copiar datos bancarios
                </button>
              </motion.div>
            )}

            {/* Promo code section */}
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16 }}>
              {!promoExpanded ? (
                <button
                  onClick={() => setPromoExpanded(true)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    border: 'none',
                    background: 'none',
                    cursor: 'pointer',
                    color: 'var(--primario)',
                    fontSize: 14,
                    fontWeight: 500,
                    fontFamily: "'DM Sans', sans-serif",
                    padding: 0,
                  }}
                >
                  <Tag size={16} />
                  ¿Tienes un código promocional?
                </button>
              ) : (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  style={{ display: 'flex', flexDirection: 'column', gap: 10 }}
                >
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input
                      type="text"
                      value={promoInput}
                      onChange={(e) => {
                        setPromoInput(e.target.value.toUpperCase());
                        setPromoStatus('idle');
                        setPromoMessage('');
                      }}
                      placeholder="Código promocional"
                      className="lf-input"
                      style={{
                        flex: 1,
                        padding: '12px 14px',
                        borderRadius: 10,
                        fontFamily: "'JetBrains Mono', monospace",
                        textTransform: 'uppercase' as const,
                      }}
                    />
                    <button
                      onClick={handleApplyPromo}
                      disabled={!promoInput.trim()}
                      style={{
                        padding: '12px 20px',
                        borderRadius: 10,
                        border: 'none',
                        background: promoInput.trim() ? 'var(--primario)' : 'var(--border)',
                        color: promoInput.trim() ? 'white' : 'var(--text-muted)',
                        fontSize: 14,
                        fontWeight: 600,
                        fontFamily: "'DM Sans', sans-serif",
                        cursor: promoInput.trim() ? 'pointer' : 'default',
                        transition: 'all 0.2s',
                      }}
                    >
                      Aplicar
                    </button>
                  </div>
                  {promoMessage && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        padding: '10px 14px',
                        borderRadius: 10,
                        background: promoStatus === 'valid' ? 'rgba(0,200,83,0.08)' : 'rgba(255,23,68,0.06)',
                        border: `1px solid ${promoStatus === 'valid' ? 'rgba(0,200,83,0.2)' : 'rgba(255,23,68,0.15)'}`,
                        fontSize: 13,
                        fontFamily: "'DM Sans', sans-serif",
                        color: promoStatus === 'valid' ? 'var(--exito)' : 'var(--peligro)',
                      }}
                    >
                      {promoStatus === 'valid' ? <Check size={14} /> : <AlertCircle size={14} />}
                      {promoMessage}
                    </motion.div>
                  )}
                </motion.div>
              )}
            </div>

            {/* Final cost summary */}
            <CostCard breakdown={costBreakdown} showPromo />
          </div>
        );

      /* ═══ STEP 4: CONFIRMAR ═══ */
      case 4:
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <h2 style={{ fontSize: 24, fontWeight: 700, fontFamily: "'Syne', sans-serif", color: 'var(--text)', margin: 0 }}>
              Confirma tu envío
            </h2>

            {/* Summary card */}
            <div
              style={{
                background: 'var(--surface)',
                borderRadius: 16,
                border: '1.5px solid var(--border)',
                overflow: 'hidden',
              }}
            >
              {/* Route section */}
              <div style={{ padding: 20, borderBottom: '1px solid var(--border)' }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12, fontFamily: "'DM Sans', sans-serif" }}>
                  Ruta
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 12, height: 12, borderRadius: '50%', background: 'var(--exito)', boxShadow: '0 0 0 3px rgba(0,200,83,0.2)', flexShrink: 0 }} />
                    <span style={{ fontSize: 14, color: 'var(--text)', fontFamily: "'DM Sans', sans-serif" }}>{solicitudEnvio.origen}</span>
                  </div>
                  <div style={{ width: 1, height: 12, background: 'var(--border)', marginLeft: 5.5 }} />
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 12, height: 12, borderRadius: '50%', background: 'var(--primario)', boxShadow: '0 0 0 3px rgba(255,87,34,0.2)', flexShrink: 0 }} />
                    <span style={{ fontSize: 14, color: 'var(--text)', fontFamily: "'DM Sans', sans-serif" }}>{solicitudEnvio.destino}</span>
                  </div>
                </div>
                <div style={{ marginTop: 8, fontSize: 12, color: 'var(--text-muted)', fontFamily: "'JetBrains Mono', monospace" }}>
                  {costBreakdown.distanceKm.toFixed(1)} km • {costBreakdown.estimatedTime}
                </div>
              </div>

              {/* Schedule section - only when programar */}
              {scheduleMode === 'programar' && scheduleDate && scheduleTime && (
                <div style={{ padding: 20, borderBottom: '1px solid var(--border)' }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10, fontFamily: "'DM Sans', sans-serif" }}>
                    Programación
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                      width: 32,
                      height: 32,
                      borderRadius: 8,
                      background: 'var(--primario-soft)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}>
                      <Calendar size={16} style={{ color: 'var(--primario)' }} />
                    </div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', fontFamily: "'DM Sans', sans-serif" }}>
                        {formatSpanishDate(scheduleDate)}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: "'JetBrains Mono', monospace" }}>
                        {scheduleTime}
                      </div>
                    </div>
                  </div>
                  <div style={{
                    marginTop: 10,
                    padding: '8px 12px',
                    borderRadius: 8,
                    background: 'rgba(255,179,0,0.08)',
                    border: '1px solid rgba(255,179,0,0.2)',
                    fontSize: 12,
                    color: 'var(--warning)',
                    fontFamily: "'DM Sans', sans-serif",
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}>
                    <Info size={14} />
                    Envío programado — se asignará repartidor en la fecha indicada
                  </div>
                </div>
              )}

              {/* Package section */}
              <div style={{ padding: 20, borderBottom: '1px solid var(--border)' }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10, fontFamily: "'DM Sans', sans-serif" }}>
                  Paquete
                </div>
                <div style={{ fontSize: 14, color: 'var(--text)', fontFamily: "'DM Sans', sans-serif", marginBottom: 8 }}>
                  {solicitudEnvio.descripcion}
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <span
                    style={{
                      padding: '4px 10px',
                      borderRadius: 6,
                      background: 'var(--bg-alt)',
                      fontSize: 12,
                      fontWeight: 500,
                      fontFamily: "'DM Sans', sans-serif",
                      color: 'var(--text-secondary)',
                    }}
                  >
                    {SIZE_OPTIONS.find((s) => s.key === solicitudEnvio.tamano)?.label}
                  </span>
                  {solicitudEnvio.fragil && (
                    <span
                      style={{
                        padding: '4px 10px',
                        borderRadius: 6,
                        background: 'rgba(255,179,0,0.1)',
                        fontSize: 12,
                        fontWeight: 500,
                        fontFamily: "'DM Sans', sans-serif",
                        color: 'var(--warning)',
                      }}
                    >
                      Frágil
                    </span>
                  )}
                </div>
              </div>

              {/* Payment section */}
              <div style={{ padding: 20 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10, fontFamily: "'DM Sans', sans-serif" }}>
                  Pago
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  {solicitudEnvio.metodoPago === 'efectivo' ? (
                    <Banknote size={16} style={{ color: 'var(--exito)' }} />
                  ) : (
                    <CreditCard size={16} style={{ color: 'var(--info)' }} />
                  )}
                  <span style={{ fontSize: 14, color: 'var(--text)', fontFamily: "'DM Sans', sans-serif" }}>
                    {solicitudEnvio.metodoPago === 'efectivo' ? 'Efectivo' : 'Transferencia'}
                  </span>
                </div>
                {solicitudEnvio.codigoPromo && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                    <Tag size={14} style={{ color: 'var(--exito)' }} />
                    <span style={{ fontSize: 13, fontFamily: "'JetBrains Mono', monospace", color: 'var(--exito)' }}>
                      {solicitudEnvio.codigoPromo}
                    </span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, paddingTop: 12, borderTop: '1.5px solid var(--border)' }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', fontFamily: "'DM Sans', sans-serif" }}>Total</span>
                  <span style={{ fontSize: 20, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", color: 'var(--primario)' }}>
                    {formatCordobas(costBreakdown.total)}
                  </span>
                </div>
              </div>
            </div>

            {/* Terms checkbox */}
            <div
              onClick={() => setSolicitudEnvio({ terminosAceptados: !solicitudEnvio.terminosAceptados })}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 10,
                cursor: 'pointer',
                padding: '12px 14px',
                borderRadius: 12,
                border: solicitudEnvio.terminosAceptados ? '1.5px solid var(--primario)' : '1.5px solid var(--border)',
                background: solicitudEnvio.terminosAceptados ? 'var(--primario-soft)' : 'transparent',
                transition: 'all 0.2s',
              }}
            >
              <div
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: 6,
                  border: `2px solid ${solicitudEnvio.terminosAceptados ? 'var(--primario)' : 'var(--border)'}`,
                  background: solicitudEnvio.terminosAceptados ? 'var(--primario)' : 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  marginTop: 1,
                  transition: 'all 0.2s',
                }}
              >
                {solicitudEnvio.terminosAceptados && <Check size={14} strokeWidth={3} color="white" />}
              </div>
              <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontFamily: "'DM Sans', sans-serif", lineHeight: 1.5 }}>
                Acepto los términos de servicio del envío
              </span>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  /* ═══ CONFIRMATION SCREEN ═══ */
  if (confirmed) {
    return (
      <div style={{ maxWidth: 480, margin: '0 auto', padding: '40px 20px', textAlign: 'center' }}>
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}
        >
          <CheckAnimation />
          <h2 style={{ fontSize: 28, fontWeight: 700, fontFamily: "'Syne', sans-serif", color: 'var(--exito)', margin: 0 }}>
            {scheduleMode === 'programar' && scheduleDate && scheduleTime ? '¡Envío programado!' : '¡Envío confirmado!'}
          </h2>
          <p style={{ fontSize: 15, color: 'var(--text-secondary)', fontFamily: "'DM Sans', sans-serif", margin: 0 }}>
            Orden <span style={{ fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", color: 'var(--text)' }}>#{confirmedOrderId}</span> {scheduleMode === 'programar' ? 'programada exitosamente' : 'creada exitosamente'}
          </p>

          {/* Schedule info in confirmation */}
          {scheduleMode === 'programar' && scheduleDate && scheduleTime && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '14px 18px',
                borderRadius: 12,
                background: 'var(--primario-soft)',
                border: '1px solid rgba(255,87,34,0.2)',
                width: '100%',
                textAlign: 'left',
              }}
            >
              <Calendar size={20} style={{ color: 'var(--primario)', flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--primario)', fontFamily: "'DM Sans', sans-serif" }}>
                  Recogida programada
                </div>
                <div style={{ fontSize: 14, color: 'var(--text)', fontFamily: "'DM Sans', sans-serif" }}>
                  {formatSpanishDate(scheduleDate)} a las {scheduleTime}
                </div>
              </div>
            </motion.div>
          )}

          {/* Quick details */}
          <div
            style={{
              background: 'var(--surface)',
              borderRadius: 14,
              border: '1.5px solid var(--border)',
              padding: 20,
              width: '100%',
              textAlign: 'left',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--exito)' }} />
                <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontFamily: "'DM Sans', sans-serif" }}>{solicitudEnvio.origen}</span>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--primario)' }} />
                <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontFamily: "'DM Sans', sans-serif" }}>{solicitudEnvio.destino}</span>
              </div>
            </div>
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                {solicitudEnvio.metodoPago === 'efectivo' ? <Banknote size={14} style={{ color: 'var(--exito)' }} /> : <CreditCard size={14} style={{ color: 'var(--info)' }} />}
                <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontFamily: "'DM Sans', sans-serif" }}>
                  {solicitudEnvio.metodoPago === 'efectivo' ? 'Efectivo' : 'Transferencia'}
                </span>
              </div>
              <span style={{ fontSize: 16, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", color: 'var(--primario)' }}>
                {formatCordobas(costBreakdown.total)}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%', marginTop: 8 }}>
            <button
              onClick={() => onNavigate('envios')}
              style={{
                width: '100%',
                padding: '14px 20px',
                borderRadius: 12,
                border: 'none',
                background: 'var(--primario)',
                color: 'white',
                fontSize: 15,
                fontWeight: 600,
                fontFamily: "'DM Sans', sans-serif",
                cursor: 'pointer',
                transition: 'background 0.2s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--primario-hover)'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--primario)'; }}
            >
              <Truck size={18} />
              Rastrear envío
            </button>
            <button
              onClick={() => {
                resetSolicitudEnvio();
                onNavigate('inicio');
              }}
              style={{
                width: '100%',
                padding: '14px 20px',
                borderRadius: 12,
                border: '1.5px solid var(--border)',
                background: 'transparent',
                color: 'var(--text-secondary)',
                fontSize: 15,
                fontWeight: 500,
                fontFamily: "'DM Sans', sans-serif",
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              Volver al inicio
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  /* ═══ MAIN WIZARD ═══ */
  return (
    <div style={{ maxWidth: 520, margin: '0 auto', padding: '0 16px 24px', position: 'relative' }}>
      {/* Progress Bar */}
      <ProgressBar currentStep={currentStep} />

      {/* Step Content with animation */}
      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={currentStep}
          custom={direction}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.3, ease: 'easeInOut' }}
        >
          {renderStep()}
        </motion.div>
      </AnimatePresence>

      {/* Navigation Buttons */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: 28,
          gap: 12,
        }}
      >
        {currentStep > 1 ? (
          <button
            onClick={() => goToStep((currentStep - 1) as WizardStep)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '12px 20px',
              borderRadius: 12,
              border: '1.5px solid var(--border)',
              background: 'transparent',
              color: 'var(--text-secondary)',
              fontSize: 14,
              fontWeight: 500,
              fontFamily: "'DM Sans', sans-serif",
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            <ChevronLeft size={18} />
            {currentStep === 4 ? 'Modificar' : 'Anterior'}
          </button>
        ) : (
          <div />
        )}

        {currentStep < 4 ? (
          <motion.button
            whileTap={{ scale: canContinue() ? 0.97 : 1 }}
            onClick={() => canContinue() && goToStep((currentStep + 1) as WizardStep)}
            disabled={!canContinue()}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '12px 24px',
              borderRadius: 12,
              border: 'none',
              background: canContinue() ? 'var(--primario)' : 'var(--border)',
              color: canContinue() ? 'white' : 'var(--text-muted)',
              fontSize: 14,
              fontWeight: 600,
              fontFamily: "'DM Sans', sans-serif",
              cursor: canContinue() ? 'pointer' : 'default',
              transition: 'all 0.2s',
            }}
          >
            Continuar
            <ChevronRight size={18} />
          </motion.button>
        ) : (
          <motion.button
            whileTap={{ scale: canContinue() ? 0.97 : 1 }}
            onClick={canContinue() ? handleConfirm : undefined}
            disabled={!canContinue() || confirming}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              padding: '14px 28px',
              borderRadius: 12,
              border: 'none',
              background: canContinue() && !confirming ? 'var(--primario)' : 'var(--border)',
              color: canContinue() && !confirming ? 'white' : 'var(--text-muted)',
              fontSize: 15,
              fontWeight: 700,
              fontFamily: "'DM Sans', sans-serif",
              cursor: canContinue() && !confirming ? 'pointer' : 'default',
              transition: 'all 0.2s',
              minWidth: 160,
            }}
          >
            {confirming ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                style={{
                  width: 20,
                  height: 20,
                  border: '2.5px solid rgba(255,255,255,0.3)',
                  borderTopColor: 'white',
                  borderRadius: '50%',
                }}
              />
            ) : (
              <>
                <Check size={18} />
                Confirmar envío
              </>
            )}
          </motion.button>
        )}
      </div>

      {/* Toast notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            style={{
              position: 'fixed',
              bottom: 24,
              left: '50%',
              transform: 'translateX(-50%)',
              padding: '12px 20px',
              borderRadius: 12,
              background:
                toast.variant === 'success'
                  ? 'var(--exito)'
                  : toast.variant === 'error'
                    ? 'var(--peligro)'
                    : 'var(--info)',
              color: 'white',
              fontSize: 14,
              fontWeight: 500,
              fontFamily: "'DM Sans', sans-serif",
              boxShadow: 'var(--shadow-lg)',
              zIndex: 9999,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              maxWidth: '90vw',
            }}
          >
            {toast.variant === 'success' && <Check size={16} />}
            {toast.variant === 'error' && <AlertCircle size={16} />}
            {toast.variant === 'info' && <Info size={16} />}
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
