'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  X,
  Wrench,
  UserX,
  AlertOctagon,
  MoreHorizontal,
  AlertTriangle,
  Send,
  CheckCircle,
} from '@/components/icons';
import { useRepartidorStore, type TipoIncidencia } from '@/lib/repartidor-store';

interface TipoOpcion {
  key: TipoIncidencia;
  label: string;
  desc: string;
  icon: React.ReactNode;
  color: string;
}

const TIPO_OPCIONES: TipoOpcion[] = [
  {
    key: 'mecanica',
    label: 'Falla Mecánica',
    desc: 'Pinchazo o avería de la moto',
    icon: <Wrench size={18} />,
    color: 'text-amber-500 bg-amber-50 dark:bg-amber-950/60',
  },
  {
    key: 'cliente',
    label: 'Problema con Cliente',
    desc: 'No responde o dirección errónea',
    icon: <UserX size={18} />,
    color: 'text-blue-500 bg-blue-50 dark:bg-blue-950/60',
  },
  {
    key: 'accidente',
    label: 'Accidente o Emergencia',
    desc: 'Colisión o percance en ruta',
    icon: <AlertOctagon size={18} />,
    color: 'text-rose-500 bg-rose-50 dark:bg-rose-950/60',
  },
  {
    key: 'otro',
    label: 'Otro Inconveniente',
    desc: 'Situación no listada',
    icon: <MoreHorizontal size={18} />,
    color: 'text-slate-500 bg-slate-100 dark:bg-slate-800',
  },
];

export default function RepartidorIncidencia() {
  const { reportarIncidencia, toggleIncidencia } = useRepartidorStore();

  const [tipo, setTipo] = useState<TipoIncidencia>('mecanica');
  const [descripcion, setDescripcion] = useState('');
  const [enviado, setEnviado] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!descripcion.trim()) return;

    reportarIncidencia(tipo, descripcion);

    setEnviado(true);
    setTimeout(() => {
      toggleIncidencia();
    }, 1500);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 font-sans"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="w-full max-w-sm rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 shadow-2xl space-y-4"
      >
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <AlertTriangle size={18} className="text-rose-500" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Reportar Incidencia
            </h3>
          </div>
          <button
            onClick={() => toggleIncidencia()}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X size={18} />
          </button>
        </div>

        {enviado ? (
          <div className="py-6 text-center space-y-2">
            <CheckCircle size={40} className="mx-auto text-emerald-500" />
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">
              Incidencia Reportada
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              El equipo de soporte y central de LogiFast responderá de inmediato.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2 uppercase text-[10px]">
                Selecciona la Categoría
              </label>

              <div className="grid grid-cols-2 gap-2">
                {TIPO_OPCIONES.map((op) => {
                  const isSelected = tipo === op.key;
                  return (
                    <button
                      key={op.key}
                      type="button"
                      onClick={() => setTipo(op.key)}
                      className={`p-2.5 rounded-2xl border text-left flex flex-col gap-1 transition-all ${
                        isSelected
                          ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/40 shadow-sm'
                          : 'border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300'
                      }`}
                    >
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${op.color}`}>
                        {op.icon}
                      </div>
                      <span className="text-xs font-bold text-slate-900 dark:text-white">
                        {op.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 uppercase text-[10px]">
                Detalle del Problema
              </label>
              <textarea
                required
                rows={3}
                placeholder="Explica brevemente lo sucedido..."
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/50"
              />
            </div>

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => toggleIncidencia()}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-sm flex items-center justify-center gap-1.5"
              >
                <Send size={14} /> Reportar
              </button>
            </div>
          </form>
        )}
      </motion.div>
    </motion.div>
  );
}
