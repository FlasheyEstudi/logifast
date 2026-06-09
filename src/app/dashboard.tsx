'use client';

import { useState, useEffect, useRef } from 'react';

/* ═══════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════ */

type OrderStatus = 'pendiente' | 'encamino' | 'recogido' | 'entregado' | 'incidencia';

interface Order {
  id: string;
  cliente: string;
  destino: string;
  repartidor: string | null;
  repartidorInitials: string;
  monto: number;
  estado: OrderStatus;
  fecha: string;
}

interface Moto {
  id: string;
  status: 'available' | 'in-service' | 'maintenance';
  name: string;
  x: string;
  y: string;
}

interface Rider {
  name: string;
  initials: string;
  color: string;
  status: string;
  available: boolean;
  moto: string;
}

interface Alert {
  title: string;
  msg: string;
  moto: string;
}

/* ═══════════════════════════════════════════════
   MOCK DATA
   ═══════════════════════════════════════════════ */

const INITIAL_ORDERS: Order[] = [
  { id: "LF-2847", cliente: "María López", destino: "Col. Los Robles, Managua", repartidor: "Carlos M.", repartidorInitials: "CM", monto: 120, estado: "encamino", fecha: "2026-06-10" },
  { id: "LF-2846", cliente: "Pedro Ruiz", destino: "Barrio Monseñor Lezcano", repartidor: "Ana T.", repartidorInitials: "AT", monto: 85, estado: "entregado", fecha: "2026-06-10" },
  { id: "LF-2845", cliente: "Sofía Chamorro", destino: "Villa Fontana, Managua", repartidor: "Luis R.", repartidorInitials: "LR", monto: 200, estado: "pendiente", fecha: "2026-06-10" },
  { id: "LF-2844", cliente: "Diego Soto", destino: "Bello Horizonte", repartidor: "María G.", repartidorInitials: "MG", monto: 150, estado: "recogido", fecha: "2026-06-10" },
  { id: "LF-2843", cliente: "Laura Vega", destino: "Centro Histórico, Managua", repartidor: "Carlos M.", repartidorInitials: "CM", monto: 95, estado: "entregado", fecha: "2026-06-09" },
  { id: "LF-2842", cliente: "Roberto Martínez", destino: "Col. Centroamérica", repartidor: "Ana T.", repartidorInitials: "AT", monto: 175, estado: "incidencia", fecha: "2026-06-09" },
  { id: "LF-2841", cliente: "Carmen Ríos", destino: "Altamira, Managua", repartidor: "Jorge P.", repartidorInitials: "JP", monto: 110, estado: "entregado", fecha: "2026-06-09" },
  { id: "LF-2840", cliente: "Andrés Cruz", destino: "Santo Domingo", repartidor: "Luis R.", repartidorInitials: "LR", monto: 230, estado: "encamino", fecha: "2026-06-09" },
  { id: "LF-2839", cliente: "Isabel Torres", destino: "Las Colinas", repartidor: "María G.", repartidorInitials: "MG", monto: 65, estado: "pendiente", fecha: "2026-06-08" },
  { id: "LF-2838", cliente: "Felipe Reyes", destino: "Carretera Sur", repartidor: "Jorge P.", repartidorInitials: "JP", monto: 180, estado: "entregado", fecha: "2026-06-08" },
  { id: "LF-2837", cliente: "Gabriela Navarro", destino: "Col. Los Robles", repartidor: "Carlos M.", repartidorInitials: "CM", monto: 145, estado: "entregado", fecha: "2026-06-08" },
  { id: "LF-2836", cliente: "Miguel Ángel", destino: "Villa Fontana", repartidor: "Ana T.", repartidorInitials: "AT", monto: 90, estado: "encamino", fecha: "2026-06-07" },
  { id: "LF-2835", cliente: "Patricia Herrera", destino: "Bello Horizonte", repartidor: null, repartidorInitials: "", monto: 160, estado: "pendiente", fecha: "2026-06-07" },
  { id: "LF-2834", cliente: "Raúl Castillo", destino: "Centro Histórico", repartidor: "Luis R.", repartidorInitials: "LR", monto: 75, estado: "entregado", fecha: "2026-06-07" },
  { id: "LF-2833", cliente: "Daniela Mendoza", destino: "Monseñor Lezcano", repartidor: "María G.", repartidorInitials: "MG", monto: 195, estado: "recogido", fecha: "2026-06-06" },
];

const MOCK_MOTOS: Moto[] = [
  { id: "Moto-01", status: "available", name: "Moto-01", x: "15%", y: "25%" },
  { id: "Moto-02", status: "in-service", name: "Moto-02", x: "35%", y: "40%" },
  { id: "Moto-03", status: "in-service", name: "Moto-03", x: "60%", y: "30%" },
  { id: "Moto-04", status: "available", name: "Moto-04", x: "75%", y: "55%" },
  { id: "Moto-05", status: "maintenance", name: "Moto-05", x: "20%", y: "65%" },
  { id: "Moto-06", status: "in-service", name: "Moto-06", x: "50%", y: "70%" },
  { id: "Moto-07", status: "available", name: "Moto-07", x: "80%", y: "20%" },
  { id: "Moto-08", status: "available", name: "Moto-08", x: "45%", y: "15%" },
  { id: "Moto-09", status: "in-service", name: "Moto-09", x: "70%", y: "75%" },
  { id: "Moto-10", status: "maintenance", name: "Moto-10", x: "25%", y: "50%" },
  { id: "Moto-11", status: "available", name: "Moto-11", x: "55%", y: "50%" },
  { id: "Moto-12", status: "available", name: "Moto-12", x: "90%", y: "45%" },
];

const MOCK_RIDERS: Rider[] = [
  { name: "Carlos M.", initials: "CM", color: "#002A5C", status: "En servicio", available: false, moto: "Moto-03" },
  { name: "Ana T.", initials: "AT", color: "#FF6600", status: "En servicio", available: false, moto: "Moto-07" },
  { name: "Luis R.", initials: "LR", color: "#002A5C", status: "Disponible", available: true, moto: "Moto-01" },
  { name: "María G.", initials: "MG", color: "#FF6600", status: "Disponible", available: true, moto: "Moto-04" },
  { name: "Jorge P.", initials: "JP", color: "#002A5C", status: "Disponible", available: true, moto: "Moto-08" },
  { name: "Rosa D.", initials: "RD", color: "#FF6600", status: "En servicio", available: false, moto: "Moto-02" },
  { name: "Miguel S.", initials: "MS", color: "#002A5C", status: "Disponible", available: true, moto: "Moto-11" },
  { name: "Elena V.", initials: "EV", color: "#FF6600", status: "Disponible", available: true, moto: "Moto-12" },
];

const MOCK_ALERTS: Alert[] = [
  { title: "Mantenimiento vencido", msg: "Kilometraje excedido en 500km", moto: "Moto-05" },
  { title: "Batería baja", msg: "Nivel de batería al 12%", moto: "Moto-10" },
  { title: "Incidencia reportada", msg: "Accidente menor, sin heridos", moto: "Moto-09" },
];

const INGRESOS_DIARIOS = [
  { dia: "Lun", monto: 5200 },
  { dia: "Mar", monto: 7800 },
  { dia: "Mié", monto: 6100 },
  { dia: "Jue", monto: 9200 },
  { dia: "Vie", monto: 8450 },
  { dia: "Sáb", monto: 7100 },
  { dia: "Dom", monto: 4400 },
];

const ORDENES_POR_ZONA = [
  { zona: "Centro", cantidad: 45 },
  { zona: "Villa Fontana", cantidad: 32 },
  { zona: "Los Robles", cantidad: 28 },
  { zona: "Bello Horizonte", cantidad: 21 },
  { zona: "Monseñor Lezcano", cantidad: 15 },
];

const DESEMPENO_REPARTIDORES = [
  { nombre: "Carlos M.", entregas: 28 },
  { nombre: "Ana T.", entregas: 24 },
  { nombre: "Luis R.", entregas: 21 },
  { nombre: "María G.", entregas: 19 },
  { nombre: "Jorge P.", entregas: 16 },
];

const COSTO_POR_KM = [
  { moto: "Moto-01", costoTotal: 4500, km: 3200, costoKm: 1.41, anomaly: false },
  { moto: "Moto-02", costoTotal: 6200, km: 2800, costoKm: 2.21, anomaly: true },
  { moto: "Moto-03", costoTotal: 3800, km: 3100, costoKm: 1.23, anomaly: false },
  { moto: "Moto-04", costoTotal: 5100, km: 2600, costoKm: 1.96, anomaly: true },
  { moto: "Moto-05", costoTotal: 7200, km: 3500, costoKm: 2.06, anomaly: true },
];

const COSTOS_MENSUALES = [
  { mes: "Ene", monto: 12000 },
  { mes: "Feb", monto: 14500 },
  { mes: "Mar", monto: 13200 },
  { mes: "Abr", monto: 16800 },
  { mes: "May", monto: 15400 },
  { mes: "Jun", monto: 18200 },
  { mes: "Jul", monto: 17500 },
  { mes: "Ago", monto: 19800 },
  { mes: "Sep", monto: 21000 },
  { mes: "Oct", monto: 19500 },
  { mes: "Nov", monto: 22000 },
  { mes: "Dic", monto: 24500 },
];

/* ═══════════════════════════════════════════════
   SVG ICONS
   ═══════════════════════════════════════════════ */

const IconGrid = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /></svg>
);

const IconPackage = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m7.5 4.27 9 5.15" /><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" /><path d="m3.3 7 8.7 5 8.7-5" /><path d="M12 22V12" /></svg>
);

const IconChart = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></svg>
);

const IconDollar = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>
);

const IconMotoSmall = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="5" cy="18" r="3" /><circle cx="19" cy="18" r="3" /><path d="M5 18h3l3-6h4l2 6h2" /><path d="M11 6l2 6" /></svg>
);

const IconAmber = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></svg>
);

const IconSearch = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
);

const IconClose = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
);

const IconChevronLeft = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
);

const IconChevronRight = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
);

const IconSun = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" /><line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" /><line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" /><line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
  </svg>
);

const IconMoon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
  </svg>
);

const IconLogout = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
);

const IconMapPin = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" /></svg>
);

const IconSwap = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="17 1 21 5 17 9" /><path d="M3 11V9a4 4 0 0 1 4-4h14" /><polyline points="7 23 3 19 7 15" /><path d="M21 13v2a4 4 0 0 1-4 4H3" /></svg>
);

/* ═══════════════════════════════════════════════
   HELPER FUNCTIONS
   ═══════════════════════════════════════════════ */

const STATUS_CONFIG: Record<OrderStatus, { label: string; cls: string }> = {
  pendiente: { label: "Pendiente", cls: "pendiente" },
  encamino: { label: "En camino", cls: "encamino" },
  recogido: { label: "Recogido", cls: "recogido" },
  entregado: { label: "Entregado", cls: "entregado" },
  incidencia: { label: "Incidencia", cls: "incidencia" },
};

const MOTO_STATUS_COLORS: Record<string, string> = {
  available: '#16A34A',
  'in-service': '#FF6600',
  maintenance: '#FBBF24',
};

const FILTER_TABS: { key: OrderStatus | 'todos'; label: string }[] = [
  { key: 'todos', label: 'Todos' },
  { key: 'pendiente', label: 'Pendiente' },
  { key: 'encamino', label: 'En camino' },
  { key: 'recogido', label: 'Recogido' },
  { key: 'entregado', label: 'Entregado' },
  { key: 'incidencia', label: 'Incidencia' },
];

const ORDERS_PER_PAGE = 5;

/* ═══════════════════════════════════════════════
   DASHBOARD COMPONENT
   ═══════════════════════════════════════════════ */

export default function Dashboard({ isDark, toggleTheme, onLogout }: { isDark: boolean; toggleTheme: () => void; onLogout: () => void }) {
  /* ─── Module state ─── */
  const [activeModule, setActiveModule] = useState<'overview' | 'pedidos' | 'reportes'>('overview');
  const [moduleFade, setModuleFade] = useState(false);

  /* ─── Pedidos state ─── */
  const [orders, setOrders] = useState<Order[]>(INITIAL_ORDERS);
  const [filterStatus, setFilterStatus] = useState<OrderStatus | 'todos'>('todos');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  /* ─── Reassign modal ─── */
  const [reassignOrderId, setReassignOrderId] = useState<string | null>(null);

  /* ─── Avatar dropdown ─── */
  const [avatarOpen, setAvatarOpen] = useState(false);
  const avatarRef = useRef<HTMLDivElement>(null);

  /* ─── Mobile bottom sheet ─── */
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false);

  /* ─── Chart animation ─── */
  const [chartsVisible, setChartsVisible] = useState(false);
  const chartsRef = useRef<HTMLDivElement>(null);

  /* ─── Click outside avatar dropdown ─── */
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (avatarRef.current && !avatarRef.current.contains(e.target as Node)) {
        setAvatarOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  /* ─── Chart visible tracking ─── */
  const chartsVisibleRef = useRef(false);

  useEffect(() => {
    chartsVisibleRef.current = false;
    if (activeModule !== 'reportes') return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !chartsVisibleRef.current) {
            chartsVisibleRef.current = true;
            setChartsVisible(true);
          }
        });
      },
      { threshold: 0.1 }
    );
    const el = chartsRef.current;
    if (el) observer.observe(el);
    return () => observer.disconnect();
  }, [activeModule]);

  /* ─── Module switch with fade ─── */
  const switchModule = (mod: 'overview' | 'pedidos' | 'reportes') => {
    if (mod === activeModule) return;
    setModuleFade(true);
    setTimeout(() => {
      setActiveModule(mod);
      setModuleFade(false);
    }, 150);
  };

  /* ─── Navigate to pedidos from overview ─── */
  const goToPedidos = () => switchModule('pedidos');

  /* ─── Filtered & paginated orders ─── */
  const filteredOrders = orders.filter((o) => {
    if (filterStatus !== 'todos' && o.estado !== filterStatus) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        o.id.toLowerCase().includes(q) ||
        o.cliente.toLowerCase().includes(q) ||
        o.destino.toLowerCase().includes(q) ||
        (o.repartidor && o.repartidor.toLowerCase().includes(q))
      );
    }
    return true;
  });

  /* ─── Reset page on filter change (computed) ─── */
  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / ORDERS_PER_PAGE));
  const safeCurrentPage = currentPage > totalPages ? 1 : currentPage;
  const paginatedOrders = filteredOrders.slice(
    (safeCurrentPage - 1) * ORDERS_PER_PAGE,
    safeCurrentPage * ORDERS_PER_PAGE
  );

  /* ─── Reassign logic ─── */
  const handleReassign = (rider: Rider) => {
    if (!reassignOrderId) return;
    setOrders((prev) =>
      prev.map((o) =>
        o.id === reassignOrderId
          ? { ...o, repartidor: rider.name, repartidorInitials: rider.initials }
          : o
      )
    );
    setReassignOrderId(null);
  };

  const reassignOrder = orders.find((o) => o.id === reassignOrderId);

  /* ─── Computed stats ─── */
  const activeOrders = orders.filter((o) => o.estado === 'encamino' || o.estado === 'recogido').length;
  const todayRevenue = orders.filter((o) => o.fecha === '2026-06-10').reduce((s, o) => s + o.monto, 0);
  const availableMotos = MOCK_MOTOS.filter((m) => m.status === 'available').length;
  const activeAlerts = MOCK_ALERTS.length;

  /* ═══════════════════════════════════════════════
     RENDER
     ═══════════════════════════════════════════════ */

  return (
    <div className="lf-dash">
      {/* ═══ HEADER ═══ */}
      <header className="lf-dash-header">
        <div className="lf-dash-header-left">
          <div className="lf-dash-logo-mark">LF</div>
          <span className="lf-dash-logo-text font-serif">LOGIFAST</span>
        </div>

        {/* Desktop tabs */}
        <nav className="lf-dash-tabs">
          {([
            { key: 'overview' as const, label: 'Vista General', icon: <IconGrid /> },
            { key: 'pedidos' as const, label: 'Pedidos', icon: <IconPackage /> },
            { key: 'reportes' as const, label: 'Reportes', icon: <IconChart /> },
          ]).map((tab) => (
            <button
              key={tab.key}
              className={`lf-dash-tab ${activeModule === tab.key ? 'active' : ''}`}
              onClick={() => switchModule(tab.key)}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>

        <div className="lf-dash-header-right">
          <button className="lf-theme-toggle" onClick={toggleTheme} aria-label="Cambiar tema">
            {isDark ? <IconSun /> : <IconMoon />}
          </button>

          <div ref={avatarRef} style={{ position: 'relative' }}>
            <button className="lf-dash-avatar" onClick={() => setAvatarOpen((p) => !p)}>
              AD
            </button>
            {avatarOpen && (
              <div className="lf-dash-avatar-menu open">
                <button onClick={() => { setAvatarOpen(false); onLogout(); }}>
                  <IconLogout /> Cerrar sesión
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ═══ CONTENT ═══ */}
      <div className="lf-dash-content">
        <div
          className="lf-dash-module active"
          style={{
            opacity: moduleFade ? 0 : 1,
            transition: 'opacity 0.15s ease',
          }}
        >
          {/* ═══════════════════════════════════
              MODULE 1: VISTA GENERAL
              ═══════════════════════════════════ */}
          {activeModule === 'overview' && (
            <div className="lf-overview">
              {/* Map area */}
              <div className="lf-map">
                {/* Grid overlay */}
                <div className="lf-map-grid" />

                {/* Colored zones */}
                <div className="lf-map-zone" style={{ left: '8%', top: '12%', width: '28%', height: '30%', background: 'rgba(0,42,92,0.06)', borderColor: 'rgba(0,42,92,0.12)' }}>Centro</div>
                <div className="lf-map-zone" style={{ right: '10%', top: '8%', width: '32%', height: '26%', background: 'rgba(255,102,0,0.05)', borderColor: 'rgba(255,102,0,0.1)' }}>Villa Fontana</div>
                <div className="lf-map-zone" style={{ left: '5%', bottom: '15%', width: '30%', height: '28%', background: 'rgba(22,163,74,0.05)', borderColor: 'rgba(22,163,74,0.1)' }}>Los Robles</div>
                <div className="lf-map-zone" style={{ right: '12%', bottom: '10%', width: '28%', height: '25%', background: 'rgba(59,130,246,0.05)', borderColor: 'rgba(59,130,246,0.1)' }}>Bello Horizonte</div>

                {/* Dotted route */}
                <svg className="lf-map-route" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 1 }}>
                  <line x1="20%" y1="25%" x2="45%" y2="40%" stroke="var(--lf-accent)" strokeWidth="2" strokeDasharray="6 4" opacity="0.5" />
                  <line x1="45%" y1="40%" x2="65%" y2="30%" stroke="var(--lf-accent)" strokeWidth="2" strokeDasharray="6 4" opacity="0.5" />
                  <line x1="65%" y1="30%" x2="80%" y2="55%" stroke="var(--lf-accent)" strokeWidth="2" strokeDasharray="6 4" opacity="0.4" />
                </svg>

                {/* Moto markers */}
                {MOCK_MOTOS.map((moto) => (
                  <div
                    key={moto.id}
                    className="lf-map-marker"
                    style={{
                      left: moto.x,
                      top: moto.y,
                      background: MOTO_STATUS_COLORS[moto.status],
                    }}
                  >
                    🏍
                    <div className="lf-map-marker-tooltip">
                      {moto.name} — {moto.status === 'available' ? 'Disponible' : moto.status === 'in-service' ? 'En servicio' : 'Mantenimiento'}
                    </div>
                  </div>
                ))}

                {/* Floating stats strip */}
                <div className="lf-overview-stats">
                  <div className="lf-stat-pill">
                    <IconPackage />
                    <span className="font-mono">{activeOrders}</span>
                    <span>Activos</span>
                  </div>
                  <div className="lf-stat-pill">
                    <IconDollar />
                    <span className="font-mono">C${todayRevenue}</span>
                    <span>Hoy</span>
                  </div>
                  <div className="lf-stat-pill">
                    <IconMotoSmall />
                    <span className="font-mono">{availableMotos}</span>
                    <span>Motos disp.</span>
                  </div>
                  <div className="lf-stat-pill">
                    <IconAmber />
                    <span className="font-mono">{activeAlerts}</span>
                    <span>Alertas</span>
                  </div>
                </div>
              </div>

              {/* Desktop: Right side panel */}
              <div className="lf-overview-panel">
                {/* Orders section */}
                <div className="lf-panel-section">
                  <h3>Órdenes recientes</h3>
                  {orders.slice(0, 4).map((order) => (
                    <div key={order.id} className="lf-panel-order" onClick={goToPedidos} style={{ cursor: 'pointer' }}>
                      <div>
                        <span className="font-mono" style={{ fontWeight: 600, fontSize: 13 }}>{order.id}</span>
                        <span style={{ color: 'var(--lf-text-muted)', fontSize: 12, marginLeft: 8 }}>{order.cliente}</span>
                      </div>
                      <span className={`lf-status-badge ${STATUS_CONFIG[order.estado].cls}`}>
                        {STATUS_CONFIG[order.estado].label}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Riders section */}
                <div className="lf-panel-section">
                  <h3>Repartidores activos</h3>
                  {MOCK_RIDERS.map((rider) => (
                    <div key={rider.name} className="lf-panel-rider">
                      <div
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: '50%',
                          background: rider.color,
                          color: '#fff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 11,
                          fontWeight: 700,
                          flexShrink: 0,
                        }}
                      >
                        {rider.initials}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: 13 }}>{rider.name}</div>
                        <div style={{ color: 'var(--lf-text-muted)', fontSize: 11 }}>{rider.moto}</div>
                      </div>
                      <span style={{
                        fontSize: 11,
                        padding: '2px 8px',
                        borderRadius: 999,
                        background: rider.available ? 'rgba(22,163,74,0.1)' : 'var(--lf-accent-soft)',
                        color: rider.available ? 'var(--lf-success)' : 'var(--lf-accent)',
                        fontWeight: 600,
                      }}>
                        {rider.status}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Alerts section */}
                <div className="lf-panel-section">
                  <h3>Alertas</h3>
                  {MOCK_ALERTS.map((alert, i) => (
                    <div key={i} style={{
                      padding: '10px 12px',
                      borderRadius: 10,
                      background: 'rgba(251,191,36,0.08)',
                      border: '1px solid rgba(251,191,36,0.2)',
                      marginBottom: 8,
                    }}>
                      <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--lf-warning)' }}>{alert.title}</div>
                      <div style={{ fontSize: 12, color: 'var(--lf-text-muted)' }}>{alert.msg} · {alert.moto}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Mobile FAB */}
              <button
                className="lf-mobile-fab"
                onClick={() => setMobileSheetOpen(true)}
                aria-label="Ver detalles"
                style={{
                  display: 'none',
                  position: 'fixed',
                  bottom: 80,
                  right: 20,
                  width: 56,
                  height: 56,
                  borderRadius: '50%',
                  background: 'var(--lf-accent)',
                  color: '#fff',
                  border: 'none',
                  boxShadow: 'var(--lf-shadow-lg)',
                  fontSize: 24,
                  cursor: 'pointer',
                  zIndex: 50,
                }}
              >
                ☰
              </button>

              {/* Mobile bottom sheet */}
              {mobileSheetOpen && (
                <div
                  style={{
                    position: 'fixed',
                    inset: 0,
                    background: 'rgba(0,0,0,0.4)',
                    zIndex: 100,
                    display: 'flex',
                    alignItems: 'flex-end',
                  }}
                  onClick={() => setMobileSheetOpen(false)}
                >
                  <div
                    style={{
                      background: 'var(--lf-surface)',
                      borderRadius: '20px 20px 0 0',
                      width: '100%',
                      maxHeight: '70vh',
                      overflowY: 'auto',
                      padding: '20px 16px',
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div style={{ width: 40, height: 4, background: 'var(--lf-border)', borderRadius: 4, margin: '0 auto 16px' }} />
                    <div className="lf-panel-section">
                      <h3>Órdenes recientes</h3>
                      {orders.slice(0, 4).map((order) => (
                        <div key={order.id} className="lf-panel-order" onClick={() => { setMobileSheetOpen(false); goToPedidos(); }} style={{ cursor: 'pointer' }}>
                          <div>
                            <span className="font-mono" style={{ fontWeight: 600, fontSize: 13 }}>{order.id}</span>
                            <span style={{ color: 'var(--lf-text-muted)', fontSize: 12, marginLeft: 8 }}>{order.cliente}</span>
                          </div>
                          <span className={`lf-status-badge ${STATUS_CONFIG[order.estado].cls}`}>
                            {STATUS_CONFIG[order.estado].label}
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className="lf-panel-section">
                      <h3>Repartidores activos</h3>
                      {MOCK_RIDERS.slice(0, 4).map((rider) => (
                        <div key={rider.name} className="lf-panel-rider">
                          <div style={{ width: 28, height: 28, borderRadius: '50%', background: rider.color, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
                            {rider.initials}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontWeight: 600, fontSize: 13 }}>{rider.name}</div>
                            <div style={{ color: 'var(--lf-text-muted)', fontSize: 11 }}>{rider.moto}</div>
                          </div>
                          <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 999, background: rider.available ? 'rgba(22,163,74,0.1)' : 'var(--lf-accent-soft)', color: rider.available ? 'var(--lf-success)' : 'var(--lf-accent)', fontWeight: 600 }}>
                            {rider.status}
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className="lf-panel-section">
                      <h3>Alertas</h3>
                      {MOCK_ALERTS.map((alert, i) => (
                        <div key={i} style={{ padding: '10px 12px', borderRadius: 10, background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.2)', marginBottom: 8 }}>
                          <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--lf-warning)' }}>{alert.title}</div>
                          <div style={{ fontSize: 12, color: 'var(--lf-text-muted)' }}>{alert.msg} · {alert.moto}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ═══════════════════════════════════
              MODULE 2: GESTIÓN DE PEDIDOS
              ═══════════════════════════════════ */}
          {activeModule === 'pedidos' && (
            <div className="lf-pedidos">
              {/* Filter pills */}
              <div className="lf-filters">
                {FILTER_TABS.map((tab) => (
                  <button
                    key={tab.key}
                    className={`lf-filter-pill ${filterStatus === tab.key ? 'active' : ''}`}
                    onClick={() => setFilterStatus(tab.key)}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Search */}
              <div style={{ position: 'relative', marginBottom: 16 }}>
                <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--lf-text-muted)' }}>
                  <IconSearch />
                </span>
                <input
                  type="text"
                  placeholder="Buscar por ID, cliente, destino..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px 10px 38px',
                    borderRadius: 10,
                    border: '1px solid var(--lf-border)',
                    background: 'var(--lf-surface)',
                    color: 'var(--lf-text-main)',
                    fontSize: 14,
                    outline: 'none',
                  }}
                />
              </div>

              {/* Desktop table */}
              <div className="lf-table-wrapper">
                <table className="lf-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Cliente</th>
                      <th>Destino</th>
                      <th>Repartidor</th>
                      <th>Monto</th>
                      <th>Estado</th>
                      <th>Fecha</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedOrders.map((order) => (
                      <tr key={order.id}>
                        <td className="font-mono" style={{ fontWeight: 600 }}>{order.id}</td>
                        <td>{order.cliente}</td>
                        <td style={{ maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><IconMapPin /> {order.destino}</span>
                        </td>
                        <td>
                          {order.repartidor ? (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                              <span style={{
                                width: 24, height: 24, borderRadius: '50%', background: 'var(--lf-primary-soft)',
                                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: 10, fontWeight: 700, color: 'var(--lf-primary)',
                              }}>
                                {order.repartidorInitials}
                              </span>
                              {order.repartidor}
                            </span>
                          ) : (
                            <span style={{ color: 'var(--lf-text-muted)' }}>Sin asignar</span>
                          )}
                        </td>
                        <td className="font-mono">C${order.monto}</td>
                        <td>
                          <span className={`lf-status-badge ${STATUS_CONFIG[order.estado].cls}`}>
                            {STATUS_CONFIG[order.estado].label}
                          </span>
                        </td>
                        <td style={{ color: 'var(--lf-text-muted)', fontSize: 13 }}>{order.fecha}</td>
                        <td>
                          <button className="lf-btn-reassign" onClick={() => setReassignOrderId(order.id)}>
                            <IconSwap /> Reasignar
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile card list */}
              <div className="lf-pedidos-cards">
                {paginatedOrders.map((order) => (
                  <div key={order.id} style={{
                    background: 'var(--lf-surface)',
                    border: '1px solid var(--lf-border)',
                    borderRadius: 12,
                    padding: 16,
                    marginBottom: 12,
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <span className="font-mono" style={{ fontWeight: 600 }}>{order.id}</span>
                      <span className={`lf-status-badge ${STATUS_CONFIG[order.estado].cls}`}>
                        {STATUS_CONFIG[order.estado].label}
                      </span>
                    </div>
                    <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>{order.cliente}</div>
                    <div style={{ color: 'var(--lf-text-muted)', fontSize: 12, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <IconMapPin /> {order.destino}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <span className="font-mono" style={{ fontWeight: 600 }}>C${order.monto}</span>
                        <span style={{ color: 'var(--lf-text-muted)', fontSize: 12, marginLeft: 8 }}>{order.fecha}</span>
                      </div>
                      <button className="lf-btn-reassign" onClick={() => setReassignOrderId(order.id)}>
                        <IconSwap /> Reasignar
                      </button>
                    </div>
                    {order.repartidor && (
                      <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
                        <span style={{
                          width: 22, height: 22, borderRadius: '50%', background: 'var(--lf-primary-soft)',
                          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 9, fontWeight: 700, color: 'var(--lf-primary)',
                        }}>
                          {order.repartidorInitials}
                        </span>
                        {order.repartidor}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Pagination */}
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12, marginTop: 16, padding: '0 0 24px' }}>
                <button
                  disabled={safeCurrentPage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 4, padding: '6px 14px',
                    borderRadius: 8, border: '1px solid var(--lf-border)', background: 'var(--lf-surface)',
                    color: 'var(--lf-text-main)', cursor: safeCurrentPage <= 1 ? 'not-allowed' : 'pointer',
                    opacity: safeCurrentPage <= 1 ? 0.4 : 1, fontSize: 13,
                  }}
                >
                  <IconChevronLeft /> Anterior
                </button>
                <span className="font-mono" style={{ fontSize: 13, color: 'var(--lf-text-muted)' }}>
                  {safeCurrentPage} / {totalPages}
                </span>
                <button
                  disabled={safeCurrentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 4, padding: '6px 14px',
                    borderRadius: 8, border: '1px solid var(--lf-border)', background: 'var(--lf-surface)',
                    color: 'var(--lf-text-main)', cursor: safeCurrentPage >= totalPages ? 'not-allowed' : 'pointer',
                    opacity: safeCurrentPage >= totalPages ? 0.4 : 1, fontSize: 13,
                  }}
                >
                  Siguiente <IconChevronRight />
                </button>
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════
              MODULE 3: REPORTES
              ═══════════════════════════════════ */}
          {activeModule === 'reportes' && (
            <div className="lf-reportes" ref={chartsRef}>
              <div className="lf-charts-grid">
                {/* Chart 1: Ingresos diarios - vertical bar chart */}
                <div className="lf-chart-card">
                  <h3>Ingresos diarios</h3>
                  <div className="lf-bar-chart">
                    {INGRESOS_DIARIOS.map((d, i) => {
                      const maxMonto = Math.max(...INGRESOS_DIARIOS.map((x) => x.monto));
                      const pct = (d.monto / maxMonto) * 100;
                      return (
                        <div key={d.dia} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, gap: 6 }}>
                          <span className="font-mono" style={{ fontSize: 11, color: 'var(--lf-text-muted)' }}>
                            {(d.monto / 1000).toFixed(1)}k
                          </span>
                          <div style={{
                            width: '100%',
                            maxWidth: 36,
                            height: chartsVisible ? `${pct}%` : '0%',
                            background: 'var(--lf-accent)',
                            borderRadius: '6px 6px 2px 2px',
                            transition: `height 0.8s ease ${i * 0.08}s`,
                            minHeight: chartsVisible ? 4 : 0,
                          }} />
                          <span style={{ fontSize: 12, color: 'var(--lf-text-secondary)', fontWeight: 500 }}>{d.dia}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Chart 2: Órdenes por zona - horizontal bar chart */}
                <div className="lf-chart-card">
                  <h3>Órdenes por zona</h3>
                  <div className="lf-hbar-chart">
                    {ORDENES_POR_ZONA.map((d, i) => {
                      const maxCantidad = Math.max(...ORDENES_POR_ZONA.map((x) => x.cantidad));
                      const pct = (d.cantidad / maxCantidad) * 100;
                      return (
                        <div key={d.zona} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                          <span style={{ width: 110, fontSize: 13, color: 'var(--lf-text-secondary)', textAlign: 'right', flexShrink: 0 }}>{d.zona}</span>
                          <div style={{ flex: 1, height: 24, background: 'var(--lf-primary-soft)', borderRadius: 6, overflow: 'hidden' }}>
                            <div style={{
                              width: chartsVisible ? `${pct}%` : '0%',
                              height: '100%',
                              background: 'var(--lf-primary)',
                              borderRadius: 6,
                              transition: `width 0.8s ease ${i * 0.1}s`,
                            }} />
                          </div>
                          <span className="font-mono" style={{ fontSize: 12, color: 'var(--lf-text-muted)', width: 30 }}>{d.cantidad}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Chart 3: Desempeño repartidores - horizontal bar chart with rankings */}
                <div className="lf-chart-card">
                  <h3>Desempeño repartidores</h3>
                  <div className="lf-hbar-chart">
                    {DESEMPENO_REPARTIDORES.map((d, i) => {
                      const maxEntregas = Math.max(...DESEMPENO_REPARTIDORES.map((x) => x.entregas));
                      const pct = (d.entregas / maxEntregas) * 100;
                      const medals = ['🥇', '🥈', '🥉'];
                      return (
                        <div key={d.nombre} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                          <span style={{ width: 24, fontSize: 16, textAlign: 'center', flexShrink: 0 }}>
                            {i < 3 ? medals[i] : `${i + 1}`}
                          </span>
                          <span style={{ width: 90, fontSize: 13, color: 'var(--lf-text-secondary)', flexShrink: 0 }}>{d.nombre}</span>
                          <div style={{ flex: 1, height: 24, background: 'var(--lf-accent-soft)', borderRadius: 6, overflow: 'hidden' }}>
                            <div style={{
                              width: chartsVisible ? `${pct}%` : '0%',
                              height: '100%',
                              background: i === 0 ? 'var(--lf-accent)' : 'var(--lf-primary)',
                              borderRadius: 6,
                              transition: `width 0.8s ease ${i * 0.1}s`,
                            }} />
                          </div>
                          <span className="font-mono" style={{ fontSize: 12, color: 'var(--lf-text-muted)', width: 30 }}>{d.entregas}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Chart 4: Tendencia de costos - SVG line/area chart */}
                <div className="lf-chart-card">
                  <h3>Tendencia de costos</h3>
                  <div className="lf-line-chart-container">
                    {(() => {
                      const maxVal = Math.max(...COSTOS_MENSUALES.map((d) => d.monto));
                      const minVal = Math.min(...COSTOS_MENSUALES.map((d) => d.monto));
                      const range = maxVal - minVal || 1;
                      const w = 500;
                      const h = 200;
                      const padX = 40;
                      const padY = 20;
                      const innerW = w - padX * 2;
                      const innerH = h - padY * 2;

                      const points = COSTOS_MENSUALES.map((d, i) => ({
                        x: padX + (i / (COSTOS_MENSUALES.length - 1)) * innerW,
                        y: padY + innerH - ((d.monto - minVal) / range) * innerH,
                      }));

                      const polylineStr = points.map((p) => `${p.x},${p.y}`).join(' ');
                      const polygonStr = `${padX},${padY + innerH} ${polylineStr} ${padX + innerW},${padY + innerH}`;

                      return (
                        <svg viewBox={`0 0 ${w} ${h}`} style={{ width: '100%', height: 'auto' }}>
                          {/* Grid lines */}
                          {[0, 0.25, 0.5, 0.75, 1].map((frac) => {
                            const y = padY + innerH * (1 - frac);
                            const val = minVal + range * frac;
                            return (
                              <g key={frac}>
                                <line x1={padX} y1={y} x2={padX + innerW} y2={y} stroke="var(--lf-border)" strokeWidth="1" />
                                <text x={padX - 6} y={y + 4} textAnchor="end" fill="var(--lf-text-muted)" fontSize="10" fontFamily="DM Mono, monospace">
                                  {(val / 1000).toFixed(0)}k
                                </text>
                              </g>
                            );
                          })}
                          {/* Area fill */}
                          <polygon points={polygonStr} fill="var(--lf-accent-soft)" />
                          {/* Line */}
                          <polyline points={polylineStr} fill="none" stroke="var(--lf-accent)" strokeWidth="2.5" strokeLinejoin="round" />
                          {/* Dots and labels */}
                          {points.map((p, i) => (
                            <g key={i}>
                              <circle cx={p.x} cy={p.y} r="4" fill="var(--lf-accent)" stroke="var(--lf-surface)" strokeWidth="2" />
                              <text x={p.x} y={h - 2} textAnchor="middle" fill="var(--lf-text-muted)" fontSize="10">
                                {COSTOS_MENSUALES[i].mes}
                              </text>
                            </g>
                          ))}
                        </svg>
                      );
                    })()}
                  </div>
                </div>

                {/* Chart 5: Costo por km table */}
                <div className="lf-chart-card" style={{ gridColumn: '1 / -1' }}>
                  <h3>Costo por kilómetro</h3>
                  <div className="lf-cost-table">
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr>
                          <th style={{ textAlign: 'left', padding: '8px 12px', borderBottom: '2px solid var(--lf-border)', color: 'var(--lf-text-muted)', fontSize: 12, fontWeight: 600 }}>Moto</th>
                          <th style={{ textAlign: 'right', padding: '8px 12px', borderBottom: '2px solid var(--lf-border)', color: 'var(--lf-text-muted)', fontSize: 12, fontWeight: 600 }}>Costo Total</th>
                          <th style={{ textAlign: 'right', padding: '8px 12px', borderBottom: '2px solid var(--lf-border)', color: 'var(--lf-text-muted)', fontSize: 12, fontWeight: 600 }}>Km</th>
                          <th style={{ textAlign: 'right', padding: '8px 12px', borderBottom: '2px solid var(--lf-border)', color: 'var(--lf-text-muted)', fontSize: 12, fontWeight: 600 }}>C$/km</th>
                          <th style={{ textAlign: 'center', padding: '8px 12px', borderBottom: '2px solid var(--lf-border)', color: 'var(--lf-text-muted)', fontSize: 12, fontWeight: 600 }}>Estado</th>
                        </tr>
                      </thead>
                      <tbody>
                        {COSTO_POR_KM.map((d) => (
                          <tr key={d.moto} style={{ borderBottom: '1px solid var(--lf-border)' }}>
                            <td style={{ padding: '10px 12px', fontWeight: 600, fontSize: 13 }} className="font-mono">{d.moto}</td>
                            <td style={{ padding: '10px 12px', textAlign: 'right', fontSize: 13 }} className="font-mono">C${d.costoTotal.toLocaleString()}</td>
                            <td style={{ padding: '10px 12px', textAlign: 'right', fontSize: 13, color: 'var(--lf-text-secondary)' }} className="font-mono">{d.km.toLocaleString()}</td>
                            <td style={{ padding: '10px 12px', textAlign: 'right', fontSize: 13, fontWeight: 600, color: d.anomaly ? 'var(--lf-danger)' : 'var(--lf-success)' }} className="font-mono">{d.costoKm.toFixed(2)}</td>
                            <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                              <span style={{
                                display: 'inline-block',
                                padding: '2px 10px',
                                borderRadius: 999,
                                fontSize: 11,
                                fontWeight: 600,
                                background: d.anomaly ? 'rgba(220,38,38,0.1)' : 'rgba(22,163,74,0.1)',
                                color: d.anomaly ? 'var(--lf-danger)' : 'var(--lf-success)',
                              }}>
                                {d.anomaly ? 'Anomalía' : 'Normal'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ═══ REASSIGN MODAL ═══ */}
      {reassignOrderId && (
        <div className="lf-modal-overlay" onClick={() => setReassignOrderId(null)}>
          <div className="lf-modal" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ fontWeight: 700, fontSize: 16 }}>Reasignar orden {reassignOrderId}</h3>
              <button onClick={() => setReassignOrderId(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--lf-text-muted)' }}>
                <IconClose />
              </button>
            </div>
            {reassignOrder && (
              <div style={{ marginBottom: 16, padding: 12, borderRadius: 10, background: 'var(--lf-primary-soft)' }}>
                <div style={{ fontSize: 13, color: 'var(--lf-text-secondary)' }}>
                  <strong>{reassignOrder.cliente}</strong> · {reassignOrder.destino}
                </div>
                <div style={{ fontSize: 12, color: 'var(--lf-text-muted)', marginTop: 4 }}>
                  Repartidor actual: {reassignOrder.repartidor || 'Sin asignar'}
                </div>
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {MOCK_RIDERS.map((rider) => (
                <button
                  key={rider.name}
                  onClick={() => handleReassign(rider)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '12px 14px',
                    borderRadius: 10,
                    border: '1px solid var(--lf-border)',
                    background: 'var(--lf-surface)',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    width: '100%',
                    textAlign: 'left',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'var(--lf-accent)';
                    e.currentTarget.style.background = 'var(--lf-accent-soft)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--lf-border)';
                    e.currentTarget.style.background = 'var(--lf-surface)';
                  }}
                >
                  <div style={{
                    width: 36, height: 36, borderRadius: '50%', background: rider.color,
                    color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 13, fontWeight: 700, flexShrink: 0,
                  }}>
                    {rider.initials}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--lf-text-main)' }}>{rider.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--lf-text-muted)' }}>{rider.moto}</div>
                  </div>
                  <span style={{
                    fontSize: 11, padding: '2px 8px', borderRadius: 999,
                    background: rider.available ? 'rgba(22,163,74,0.1)' : 'var(--lf-accent-soft)',
                    color: rider.available ? 'var(--lf-success)' : 'var(--lf-accent)',
                    fontWeight: 600,
                  }}>
                    {rider.status}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ═══ MOBILE BOTTOM NAV ═══ */}
      <nav className="lf-dash-bottom-nav">
        {([
          { key: 'overview' as const, label: 'Vista', icon: <IconGrid /> },
          { key: 'pedidos' as const, label: 'Pedidos', icon: <IconPackage /> },
          { key: 'reportes' as const, label: 'Reportes', icon: <IconChart /> },
        ]).map((tab) => (
          <button
            key={tab.key}
            className={`lf-dash-bottom-item ${activeModule === tab.key ? 'active' : ''}`}
            onClick={() => switchModule(tab.key)}
          >
            {tab.icon}
            <span className="lf-dash-bottom-label">{tab.label}</span>
            <span className="lf-dash-bottom-dot" />
          </button>
        ))}
      </nav>
    </div>
  );
}
