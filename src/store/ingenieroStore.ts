// store/ingenieroStore.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface Moto {
  id: string
  nombre: string
  modelo: string
  placa: string | null
  anio: number | null
  color: string | null
  kmAcumulados: number
  estado: 'DISPONIBLE' | 'EN_SERVICIO' | 'EN_MANTENIMIENTO' | 'FUERA_SERVICIO'
  asignadaA: string | null
  repartidorNombre?: string
  ultimoMantenimiento?: {
    fecha: string
    tipo: string
    descripcion: string
  }
  proximoMantenimiento?: {
    fecha: string
    km: number
    tipo: string
  }
  alertas: number // cantidad de alertas activas
}

export interface Mantenimiento {
  id: string
  motoId: string
  motoNombre: string
  motoModelo: string
  tipo: 'PREVENTIVO' | 'CORRECTIVO' | 'EMERGENCIA'
  categoria: string
  descripcion: string
  observaciones: string | null
  kmAlMomento: number
  costoManoObra: number
  costoRepuestos: number
  costoTotal: number
  estado: 'PROGRAMADO' | 'EN_PROCESO' | 'COMPLETADO' | 'CANCELADO'
  prioridad: 'BAJA' | 'NORMAL' | 'ALTA' | 'URGENTE'
  programadoPara: string | null
  iniciadoEn: string | null
  completadoEn: string | null
  repuestosUsados: { nombre: string; cantidad: number; subtotal: number }[]
  createdAt: string
}

export interface Repuesto {
  id: string
  nombre: string
  categoria: string
  sku: string | null
  precioUnitario: number
  stock: number
  stockMinimo: number
  unidad: string
  compatibleCon: string[]
  proveedor: string | null
  ubicacion: string | null
  bajoStock: boolean
}

export interface Alerta {
  id: string
  motoId: string
  motoNombre: string
  tipo: 'KM' | 'FECHA' | 'AMBOS'
  descripcion: string
  kmTrigger: number | null
  fechaTrigger: string | null
  activa: boolean
  urgente: boolean
}

export interface StatsIngeniero {
  totalMotos: number
  disponibles: number
  enServicio: number
  enMantenimiento: number
  fueraServicio: number
  mantenimientosCompletados: number
  mantenimientosPendientes: number
  costoMantenimientoMes: number
  alertasActivas: number
  repuestosBajoStock: number
}

export interface IngenieroState {
  // Perfil
  perfil: {
    id: string
    nombre: string
    email: string
    rol: string
    calificacion: number
  }

  // Stats
  stats: StatsIngeniero

  // Flota
  motos: Moto[]
  motoSeleccionada: Moto | null
  filtroEstado: string | null
  busquedaFlota: string

  // Mantenimientos
  mantenimientos: Mantenimiento[]
  mantenimientosFiltro: 'todos' | 'programados' | 'en_proceso' | 'completados'

  // Repuestos
  repuestos: Repuesto[]
  repuestosFiltro: string | null
  busquedaRepuestos: string

  // Alertas
  alertas: Alerta[]
  alertasNoLeidas: number

  // UI
  tabActiva: 'dashboard' | 'flota' | 'mantenimientos' | 'perfil'
  showCrearMantenimiento: boolean
  showDetalleMoto: boolean
  showDetalleMantenimiento: boolean
  showInventario: boolean
  showAgregarRepuesto: boolean
  mantenimientoSeleccionado: Mantenimiento | null

  // Actions
  setTabActiva: (tab: 'dashboard' | 'flota' | 'mantenimientos' | 'perfil') => void
  setFiltroEstado: (estado: string | null) => void
  setBusquedaFlota: (q: string) => void
  setMantenimientosFiltro: (f: any) => void
  setBusquedaRepuestos: (q: string) => void
  setRepuestosFiltro: (f: string | null) => void
  seleccionarMoto: (moto: Moto | null) => void
  seleccionarMantenimiento: (m: Mantenimiento | null) => void
  toggleCrearMantenimiento: () => void
  toggleDetalleMoto: () => void
  toggleDetalleMantenimiento: () => void
  toggleInventario: () => void
  toggleAgregarRepuesto: () => void

  // CRUD Mantenimientos
  crearMantenimiento: (data: Partial<Mantenimiento>) => Promise<void> | void
  iniciarMantenimiento: (id: string) => Promise<void> | void
  completarMantenimiento: (id: string, costoFinal: number) => Promise<void> | void
  cancelarMantenimiento: (id: string) => Promise<void> | void

  // CRUD Repuestos
  agregarRepuesto: (data: Partial<Repuesto>) => Promise<void> | void
  actualizarStock: (id: string, nuevoStock: number) => Promise<void> | void

  // Alertas
  resolverAlerta: (id: string) => Promise<void> | void
  marcarAlertasLeidas: () => void

  // Stats
  calcularStats: () => void
  cargarDatos: () => Promise<void>
}


export const useIngenieroStore = create<IngenieroState>()(
  persist(
    (set, get) => ({
      perfil: {
        id: 'ing001',
        nombre: 'Roberto Martinez',
        email: 'ingeniero@logifast.com',
        rol: 'Ingeniero Mecanico',
        calificacion: 4.9
      },

      stats: {
        totalMotos: 0,
        disponibles: 0,
        enServicio: 0,
        enMantenimiento: 0,
        fueraServicio: 0,
        mantenimientosCompletados: 0,
        mantenimientosPendientes: 0,
        costoMantenimientoMes: 0,
        alertasActivas: 0,
        repuestosBajoStock: 0
      },

      motos: [],
      motoSeleccionada: null,
      filtroEstado: null,
      busquedaFlota: '',

      mantenimientos: [],
      mantenimientosFiltro: 'todos',

      repuestos: [],
      repuestosFiltro: null,
      busquedaRepuestos: '',

      alertas: [],
      alertasNoLeidas: 0,

      tabActiva: 'dashboard',
      showCrearMantenimiento: false,
      showDetalleMoto: false,
      showDetalleMantenimiento: false,
      showInventario: false,
      showAgregarRepuesto: false,
      mantenimientoSeleccionado: null,

      // Actions
      setTabActiva: (tab) => set({ tabActiva: tab }),
      setFiltroEstado: (estado) => set({ filtroEstado: estado }),
      setBusquedaFlota: (q) => set({ busquedaFlota: q }),
      setMantenimientosFiltro: (f) => set({ mantenimientosFiltro: f }),
      setBusquedaRepuestos: (q) => set({ busquedaRepuestos: q }),
      setRepuestosFiltro: (f) => set({ repuestosFiltro: f }),

      seleccionarMoto: (moto) => set({
        motoSeleccionada: moto,
        showDetalleMoto: moto !== null
      }),

      seleccionarMantenimiento: (m) => set({
        mantenimientoSeleccionado: m,
        showDetalleMantenimiento: m !== null
      }),

      toggleCrearMantenimiento: () => set(s => ({ showCrearMantenimiento: !s.showCrearMantenimiento })),
      toggleDetalleMoto: () => set(s => ({ showDetalleMoto: !s.showDetalleMoto })),
      toggleDetalleMantenimiento: () => set(s => ({ showDetalleMantenimiento: !s.showDetalleMantenimiento })),
      toggleInventario: () => set(s => ({ showInventario: !s.showInventario })),
      toggleAgregarRepuesto: () => set(s => ({ showAgregarRepuesto: !s.showAgregarRepuesto })),

      crearMantenimiento: async (data) => {
        try {
          const res = await fetch('/api/ingeniero/mantenimientos', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
          });
          if (res.ok) {
            set({ showCrearMantenimiento: false });
            await get().cargarDatos();
          }
        } catch (error) {
          console.error('Error al crear mantenimiento:', error);
        }
      },

      iniciarMantenimiento: async (id) => {
        try {
          const res = await fetch(`/api/ingeniero/mantenimientos/${id}/iniciar`, {
            method: 'PATCH'
          });
          if (res.ok) {
            await get().cargarDatos();
          }
        } catch (error) {
          console.error('Error al iniciar mantenimiento:', error);
        }
      },

      completarMantenimiento: async (id, costoFinal) => {
        try {
          const res = await fetch(`/api/ingeniero/mantenimientos/${id}/completar`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ costoTotal: costoFinal })
          });
          if (res.ok) {
            await get().cargarDatos();
          }
        } catch (error) {
          console.error('Error al completar mantenimiento:', error);
        }
      },

      cancelarMantenimiento: async (id) => {
        try {
          const res = await fetch(`/api/ingeniero/mantenimientos/${id}/cancelar`, {
            method: 'PATCH'
          });
          if (res.ok) {
            await get().cargarDatos();
          }
        } catch (error) {
          console.error('Error al cancelar mantenimiento:', error);
        }
      },

      agregarRepuesto: async (data) => {
        try {
          const res = await fetch('/api/ingeniero/repuestos', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
          });
          if (res.ok) {
            set({ showAgregarRepuesto: false });
            await get().cargarDatos();
          }
        } catch (error) {
          console.error('Error al agregar repuesto:', error);
        }
      },

      actualizarStock: async (id, nuevoStock) => {
        try {
          const res = await fetch('/api/ingeniero/repuestos', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, stock: nuevoStock })
          });
          if (res.ok) {
            await get().cargarDatos();
          }
        } catch (error) {
          console.error('Error al actualizar stock:', error);
        }
      },

      resolverAlerta: async (id) => {
        try {
          const res = await fetch('/api/ingeniero/alertas', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id })
          });
          if (res.ok) {
            await get().cargarDatos();
          }
        } catch (error) {
          console.error('Error al resolver alerta:', error);
        }
      },

      marcarAlertasLeidas: () => set({ alertasNoLeidas: 0 }),

      cargarDatos: async () => {
        try {
          const [motosRes, mantenimientosRes, repuestosRes, alertasRes, statsRes] = await Promise.all([
            fetch('/api/ingeniero/motos').catch(() => null),
            fetch('/api/ingeniero/mantenimientos').catch(() => null),
            fetch('/api/ingeniero/repuestos').catch(() => null),
            fetch('/api/ingeniero/alertas').catch(() => null),
            fetch('/api/ingeniero/stats').catch(() => null),
          ]);

          const motosData = motosRes && motosRes.ok ? await motosRes.json().catch(() => []) : [];
          const mantenimientosData = mantenimientosRes && mantenimientosRes.ok ? await mantenimientosRes.json().catch(() => []) : [];
          const repuestosData = repuestosRes && repuestosRes.ok ? await repuestosRes.json().catch(() => []) : [];
          const alertasData = alertasRes && alertasRes.ok ? await alertasRes.json().catch(() => []) : [];
          const statsData = statsRes && statsRes.ok ? await statsRes.json().catch(() => null) : null;

          const safeMotos = Array.isArray(motosData) ? motosData : (Array.isArray(motosData?.motos) ? motosData.motos : []);
          const safeMantenimientos = Array.isArray(mantenimientosData) ? mantenimientosData : (Array.isArray(mantenimientosData?.mantenimientos) ? mantenimientosData.mantenimientos : []);
          const safeRepuestos = Array.isArray(repuestosData) ? repuestosData : (Array.isArray(repuestosData?.repuestos) ? repuestosData.repuestos : []);
          const safeAlertas = Array.isArray(alertasData) ? alertasData : (Array.isArray(alertasData?.alertas) ? alertasData.alertas : []);

          set((state) => ({
            motos: safeMotos,
            mantenimientos: safeMantenimientos,
            repuestos: safeRepuestos,
            alertas: safeAlertas,
            stats: statsData && typeof statsData === 'object' ? { ...state.stats, ...statsData } : state.stats,
          }));
        } catch (error) {
          console.error('Error al cargar datos de ingeniero:', error);
        }
      },

      calcularStats: () => {
        const state = get()
        const disponibles = state.motos.filter(m => m.estado === 'DISPONIBLE').length
        const enServicio = state.motos.filter(m => m.estado === 'EN_SERVICIO').length
        const enMantenimiento = state.motos.filter(m => m.estado === 'EN_MANTENIMIENTO').length
        const fueraServicio = state.motos.filter(m => m.estado === 'FUERA_SERVICIO').length

        set({
          stats: {
            ...state.stats,
            totalMotos: state.motos.length,
            disponibles,
            enServicio,
            enMantenimiento,
            fueraServicio,
            alertasActivas: state.alertas.filter(a => a.activa).length,
            repuestosBajoStock: state.repuestos.filter(r => r.bajoStock).length
          }
        })
      }
    }),
    {
      name: 'logifast-ingeniero',
      partialize: (state) => ({
        perfil: state.perfil,
        tabActiva: state.tabActiva
      })
    }
  )
)
