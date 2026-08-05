'use client';

import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, ResponsiveContainer, Tooltip } from 'recharts';
import {
  TrendingUp,
  Package,
  AlertTriangle,
  ChevronRight,
  Bike,
  Clock,
  DollarSign,
  CheckCircle,
  X,
  MessageSquare,
  MapPin,
  CheckCircle2,
  Store,
  User,
  Phone,
  Maximize2,
  Zap,
} from '@/components/icons';
import { useRepartidorStore, type ServicioHistorial, type OrdenActiva } from '@/lib/repartidor-store';

type ModuloSubTab = 'activos' | 'ofertas' | 'historial';

export default function RepartidorHistorial() {
  const {
    ordenesActivas = [],
    ofertasDisponibles = [],
    ordenAsignadaPendiente,
    serviciosHoy = [],
    obtenerStats,
    verServicioDetalle,
    aceptarOfertaDirecta,
    rechazarOfertaDirecta,
  } = useRepartidorStore();

  const [activeSubTab, setActiveSubTab] = useState<ModuloSubTab>('activos');
  const stats = obtenerStats('hoy');

  const ofertasLista = useMemo(() => {
    const lista: OrdenActiva[] = [];
    if (ordenAsignadaPendiente && !lista.some((o) => o.id === ordenAsignadaPendiente.id)) {
      lista.push(ordenAsignadaPendiente);
    }
    (ofertasDisponibles || []).forEach((of) => {
      if (!lista.some((o) => o.id === of.id)) {
        lista.push(of);
      }
    });
    return lista;
  }, [ordenAsignadaPendiente, ofertasDisponibles]);

  const weeklyData = [
    { dia: 'Lun', ganancias: 450 },
    { dia: 'Mar', ganancias: 580 },
    { dia: 'Mié', ganancias: 620 },
    { dia: 'Jue', ganancias: 710 },
    { dia: 'Vie', ganancias: 890 },
    { dia: 'Sáb', ganancias: 950 },
    { dia: 'Dom', ganancias: 680 },
  ];

  return (
    <div className="w-full max-w-md mx-auto px-3.5 sm:px-4 py-3 space-y-4 pb-28 font-sans">
      {/* Top Header */}
      <div className="flex items-center justify-between pt-1">
        <div>
          <h1 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">
            Gestión & Historial
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Resumen de servicios, entregas y ganancias
          </p>
        </div>
      </div>

      {/* Stats Summary Cards Row */}
      <div className="grid grid-cols-3 gap-2">
        <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm text-center">
          <p className="text-[10px] font-bold text-slate-400 uppercase">Ganancias</p>
          <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
            C$ {(stats.ganancias || 0).toFixed(0)}
          </p>
        </div>

        <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm text-center">
          <p className="text-[10px] font-bold text-slate-400 uppercase">Completados</p>
          <p className="text-sm font-bold text-blue-600 dark:text-blue-400 mt-0.5">
            {stats.entregas || 0}
          </p>
        </div>

        <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm text-center">
          <p className="text-[10px] font-bold text-slate-400 uppercase">Recorrido</p>
          <p className="text-sm font-bold text-amber-500 mt-0.5">
            {(stats.km || 0).toFixed(1)} km
          </p>
        </div>
      </div>

      {/* Segmented Control Tabs */}
      <div className="w-full p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 grid grid-cols-3 gap-1 text-xs font-semibold">
        <button
          onClick={() => setActiveSubTab('activos')}
          className={`py-1.5 rounded-lg transition-all text-center ${
            activeSubTab === 'activos'
              ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm font-bold'
              : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          Activos ({ordenesActivas.length})
        </button>

        <button
          onClick={() => setActiveSubTab('ofertas')}
          className={`py-1.5 rounded-lg transition-all text-center ${
            activeSubTab === 'ofertas'
              ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm font-bold'
              : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          Ofertas ({ofertasLista.length})
        </button>

        <button
          onClick={() => setActiveSubTab('historial')}
          className={`py-1.5 rounded-lg transition-all text-center ${
            activeSubTab === 'historial'
              ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm font-bold'
              : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          Historial
        </button>
      </div>

      {/* Tab Content: ACTIVOS */}
      {activeSubTab === 'activos' && (
        <div className="space-y-2.5">
          {ordenesActivas.length === 0 ? (
            <div className="py-8 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
              <Bike size={28} className="mx-auto text-slate-400 mb-1" />
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                No tienes servicios activos en este momento
              </p>
            </div>
          ) : (
            ordenesActivas.map((ord) => (
              <div
                key={ord.id}
                className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-2 hover:border-blue-300 transition-all"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                    #{ord.id.substring(0, 8)}
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 text-[10px] font-bold">
                    En Servicio
                  </span>
                </div>
                <p className="text-xs text-slate-700 dark:text-slate-300 font-medium">
                  {ord.origen} → {ord.destino}
                </p>
                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                  <span>Ganancia: C$ {ord.ganancia.toFixed(2)}</span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab Content: OFERTAS */}
      {activeSubTab === 'ofertas' && (
        <div className="space-y-2.5">
          {ofertasLista.length === 0 ? (
            <div className="py-8 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
              <Zap size={28} className="mx-auto text-slate-400 mb-1" />
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                No hay ofertas disponibles cercanas en este instante
              </p>
            </div>
          ) : (
            ofertasLista.map((of) => (
              <div
                key={of.id}
                className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                    Oferta #{of.id.substring(0, 8)}
                  </span>
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    +C$ {of.ganancia.toFixed(2)}
                  </span>
                </div>

                <p className="text-xs text-slate-700 dark:text-slate-300">
                  {of.origen} → {of.destino}
                </p>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={() => rechazarOfertaDirecta(of.id)}
                    className="flex-1 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs"
                  >
                    Rechazar
                  </button>
                  <button
                    onClick={() => aceptarOfertaDirecta(of)}
                    className="flex-1 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm"
                  >
                    Aceptar
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab Content: HISTORIAL & GRÁFICO */}
      {activeSubTab === 'historial' && (
        <div className="space-y-3.5">
          {/* Earnings Bar Chart */}
          <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-2">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px]">
              Ganancias Semanales (C$)
            </h3>
            <div className="h-32 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyData}>
                  <XAxis dataKey="dia" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{
                      background: '#0f172a',
                      border: 'none',
                      borderRadius: 8,
                      color: '#fff',
                      fontSize: 11,
                    }}
                  />
                  <Bar dataKey="ganancias" fill="#2563eb" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Service History List */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px] px-0.5">
              Servicios Recientes
            </h3>

            {serviciosHoy.length === 0 ? (
              <div className="py-6 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Aún no se registran entregas completadas hoy.
                </p>
              </div>
            ) : (
              serviciosHoy.map((s) => (
                <div
                  key={s.id}
                  onClick={() => verServicioDetalle(s)}
                  className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-1.5 cursor-pointer hover:border-blue-300 transition-all text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 dark:text-white">#{s.id.substring(0, 8)}</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                      +C$ {s.ganancia.toFixed(2)}
                    </span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-300 truncate">
                    {s.origen} → {s.destino}
                  </p>
                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                    <span>{s.hora} • {s.kmRecorridos} km</span>
                    <span className="text-amber-500 font-bold">★ {s.calificacion || 5.0}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
