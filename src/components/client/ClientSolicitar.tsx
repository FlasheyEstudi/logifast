'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPin,
  Package,
  Bike,
  CreditCard,
  CheckCircle,
  ArrowRight,
  ChevronLeft,
  DollarSign,
  FileText,
  Home as HomeIcon,
  Plus,
  ShieldCheck,
  Sparkles,
} from '@/components/icons';
import { useStore } from '@/lib/store';

interface ClientSolicitarProps {
  isDark?: boolean;
  userName?: string;
  onNavigate: (mod: 'inicio' | 'solicitar' | 'envios' | 'explorar' | 'pedidos' | 'perfil') => void;
}

export default function ClientSolicitar({ isDark, onNavigate }: ClientSolicitarProps) {
  const addOrder = useStore((s) => s.addOrder);

  const [step, setStep] = useState(1);
  const [origen, setOrigen] = useState('Rotonda Rubén Darío, Managua');
  const [destino, setDestino] = useState('Plaza Inter, Managua');
  const [tipoPaquete, setTipoPaquete] = useState('documentos');
  const [notas, setNotas] = useState('');
  const [metodoPago, setMetodoPago] = useState<'efectivo' | 'transferencia'>('efectivo');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedId, setSubmittedId] = useState<string | null>(null);

  // Saved addresses
  const savedPlaces = [
    { label: 'Casa', address: "Altamira D'Este, Casa #142" },
    { label: 'Trabajo', address: 'Edificio Banpro, Piso 4' },
  ];

  // Price Calculation
  const costoEstimado = useMemo(() => {
    let base = 40;
    if (tipoPaquete === 'mediano') base += 20;
    if (tipoPaquete === 'grande') base += 45;
    return base;
  }, [tipoPaquete]);

  const handleSubmit = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      const newId = 'ORD-' + Math.floor(100000 + Math.random() * 900000);
      addOrder({
        id: newId,
        origen,
        destino,
        origenLat: 12.136389,
        origenLng: -86.251389,
        destinoLat: 12.14,
        destinoLng: -86.26,
        estado: 'pendiente',
        monto: costoEstimado,
        fecha: new Date().toLocaleDateString('es-NI'),
        hora: new Date().toLocaleTimeString('es-NI', { hour: '2-digit', minute: '2-digit' }),
        cliente: 'María López',
        clienteTelefono: '+505 8888 8888',
        repartidor: null,
        repartidorInitials: '---',
        descripcion: notas || 'Envío express de paquete',
        metodoPago: metodoPago,
        estadoPago: 'pendiente',
        timeline: [
          { step: 'Orden Recibida', hora: new Date().toLocaleTimeString('es-NI', { hour: '2-digit', minute: '2-digit' }), completado: true }
        ],
      });
      setIsSubmitting(false);
      setSubmittedId(newId);
    }, 1200);
  };

  return (
    <div className="space-y-6 py-2 max-w-3xl mx-auto">

      {/* 🍏 HEADER & STEPPER */}
      <div className="space-y-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white">
            Solicitar Envío Express
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
            Completa la información para que un repartidor recoja tu paquete de inmediato.
          </p>
        </div>

        {/* Cupertino Stepper */}
        <div className="grid grid-cols-3 gap-2 p-1.5 rounded-2xl bg-zinc-200/60 dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800">
          <button
            onClick={() => setStep(1)}
            className={`py-2 rounded-xl text-xs font-extrabold transition-all ${
              step === 1 ? 'bg-white dark:bg-zinc-800 text-blue-600 dark:text-blue-400 shadow-md' : 'text-zinc-500'
            }`}
          >
            1. Ubicación
          </button>
          <button
            onClick={() => setStep(2)}
            className={`py-2 rounded-xl text-xs font-extrabold transition-all ${
              step === 2 ? 'bg-white dark:bg-zinc-800 text-blue-600 dark:text-blue-400 shadow-md' : 'text-zinc-500'
            }`}
          >
            2. Paquete
          </button>
          <button
            onClick={() => setStep(3)}
            className={`py-2 rounded-xl text-xs font-extrabold transition-all ${
              step === 3 ? 'bg-white dark:bg-zinc-800 text-blue-600 dark:text-blue-400 shadow-md' : 'text-zinc-500'
            }`}
          >
            3. Pago & Confirmar
          </button>
        </div>
      </div>

      {/* SUCCESS CONFIRMATION */}
      {submittedId ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-8 rounded-[32px] bg-white/80 dark:bg-zinc-900/80 backdrop-blur-2xl border border-emerald-500/30 text-center space-y-4 shadow-2xl"
        >
          <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-500 mx-auto flex items-center justify-center">
            <CheckCircle size={36} />
          </div>
          <h2 className="text-2xl font-extrabold text-zinc-900 dark:text-white">¡Envío Solicitado con Éxito!</h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-md mx-auto">
            Hemos asignado tu orden <span className="font-bold text-zinc-800 dark:text-zinc-200">#{submittedId}</span> a la red de repartidores. Puedes rastrear el viaje en tiempo real.
          </p>
          <div className="flex justify-center gap-3 pt-2">
            <button
              onClick={() => onNavigate('inicio')}
              className="px-6 py-3 rounded-2xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/25"
            >
              Ir a Inicio
            </button>
          </div>
        </motion.div>
      ) : (

        /* WIZARD CARD */
        <div className="p-6 sm:p-8 rounded-[32px] bg-white/80 dark:bg-zinc-900/80 backdrop-blur-2xl border border-zinc-200/80 dark:border-zinc-800 shadow-xl space-y-6">

          {/* STEP 1: LOCATIONS */}
          {step === 1 && (
            <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block mb-2">
                    📍 Dirección de Recogida (Origen)
                  </label>
                  <input
                    type="text"
                    value={origen}
                    onChange={(e) => setOrigen(e.target.value)}
                    className="w-full px-4 py-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block mb-2">
                    🏁 Dirección de Entrega (Destino)
                  </label>
                  <input
                    type="text"
                    value={destino}
                    onChange={(e) => setDestino(e.target.value)}
                    className="w-full px-4 py-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Saved shortcuts */}
              <div className="space-y-2">
                <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Direcciones Guardadas</span>
                <div className="grid grid-cols-2 gap-3">
                  {savedPlaces.map((place, idx) => (
                    <button
                      key={idx}
                      onClick={() => setDestino(place.address)}
                      className="p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/60 dark:border-zinc-800 text-left hover:border-blue-500 transition-colors"
                    >
                      <span className="font-bold text-xs block text-zinc-800 dark:text-zinc-200">{place.label}</span>
                      <span className="text-[10px] text-zinc-400 truncate block">{place.address}</span>
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={() => setStep(2)}
                className="w-full py-4 rounded-2xl bg-blue-600 text-white font-extrabold text-xs hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2"
              >
                Continuar <ArrowRight size={16} />
              </button>
            </motion.div>
          )}

          {/* STEP 2: PACKAGE DETAILS */}
          {step === 2 && (
            <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
              <div className="space-y-3">
                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block">📦 Tipo de Paquete</label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: 'documentos', label: 'Documentos', desc: 'Sobres y cartas' },
                    { id: 'mediano', label: 'Caja Pequeña', desc: 'Hasta 5 kg' },
                    { id: 'grande', label: 'Caja Grande', desc: 'Hasta 15 kg' },
                  ].map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setTipoPaquete(item.id)}
                      className={`p-4 rounded-2xl border text-left transition-all ${
                        tipoPaquete === item.id
                          ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 font-bold'
                          : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/40 text-zinc-700 dark:text-zinc-300'
                      }`}
                    >
                      <h4 className="text-xs font-extrabold">{item.label}</h4>
                      <p className="text-[10px] opacity-70">{item.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block mb-2">
                  📝 Notas para el Repartidor
                </label>
                <textarea
                  rows={3}
                  value={notas}
                  onChange={(e) => setNotas(e.target.value)}
                  placeholder="Ej: Entregar en recepción a nombre de Lic. Carlos..."
                  className="w-full px-4 py-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(1)}
                  className="w-1/3 py-4 rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-bold text-xs hover:bg-zinc-200 transition-colors"
                >
                  Atrás
                </button>
                <button
                  onClick={() => setStep(3)}
                  className="w-2/3 py-4 rounded-2xl bg-blue-600 text-white font-extrabold text-xs hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2"
                >
                  Continuar <ArrowRight size={16} />
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 3: PAYMENT & CONFIRM */}
          {step === 3 && (
            <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
              {/* Summary Box */}
              <div className="p-5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/60 dark:border-zinc-800 space-y-3 text-xs">
                <div className="flex justify-between font-bold text-zinc-800 dark:text-zinc-200">
                  <span>Tarifa Base Envío:</span>
                  <span>C$ {costoEstimado.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-zinc-500">
                  <span>Seguro de Cobertura:</span>
                  <span className="text-emerald-500 font-semibold">Incluido (Gratis)</span>
                </div>
                <div className="pt-2 border-t border-zinc-200 dark:border-zinc-700 flex justify-between text-sm font-extrabold text-zinc-900 dark:text-white">
                  <span>Total a Pagar:</span>
                  <span className="text-blue-600 dark:text-blue-400">C$ {costoEstimado.toFixed(2)}</span>
                </div>
              </div>

              {/* Payment Methods */}
              <div className="space-y-3">
                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block">💳 Método de Pago</label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { id: 'efectivo', label: 'Efectivo al Entregar' },
                    { id: 'transferencia', label: 'Transferencia Bancaria' },
                  ].map((m) => (
                    <button
                      key={m.id}
                      onClick={() => setMetodoPago(m.id as 'efectivo' | 'transferencia')}
                      className={`p-3 rounded-2xl border text-center text-xs font-bold transition-all ${
                        metodoPago === m.id
                          ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400'
                          : 'border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400'
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(2)}
                  className="w-1/3 py-4 rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-bold text-xs hover:bg-zinc-200 transition-colors"
                >
                  Atrás
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="w-2/3 py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-extrabold text-xs hover:opacity-90 active:scale-98 transition-all shadow-xl shadow-blue-500/25 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? 'Procesando Envío...' : 'Confirmar y Solicitar Moto 🏍️'}
                </button>
              </div>
            </motion.div>
          )}

        </div>
      )}

    </div>
  );
}
