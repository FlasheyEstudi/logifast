'use client';

import React, { useState, useCallback, createContext, useContext } from 'react';
import dynamic from 'next/dynamic';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Home,
  Package,
  User,
  Bell,
  Sun,
  Moon,
  LogOut,
  Settings,
  CheckCircle,
  AlertTriangle,
  Bike,
  Tag,
  Heart,
  ShoppingBag,
  ShoppingCart,
  Wallet,
  Search,
  ChevronRight,
  Shield,
  Sparkles,
  Navigation,
} from '@/components/icons';
import { useStore, type ClientModuleKey, type ClientNotificacion } from '@/lib/store';
import { useMarketplaceStore } from '@/lib/marketplace-store';

function MobileModuleSkeleton() {
  return (
    <div className="w-full max-w-[480px] mx-auto space-y-6 p-4 animate-pulse">
      <div className="w-full h-48 bg-zinc-800/40 rounded-[20px] animate-shimmer" />
      <div className="grid grid-cols-2 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-28 bg-zinc-800/40 rounded-[14px] animate-shimmer" />
        ))}
      </div>
    </div>
  );
}

const ClientInicio = dynamic(() => import('./ClientInicio'), { ssr: false, loading: () => <MobileModuleSkeleton /> });
const ClientSolicitar = dynamic(() => import('./ClientSolicitar'), { ssr: false, loading: () => <MobileModuleSkeleton /> });
const ClientEnvios = dynamic(() => import('./ClientEnvios'), { ssr: false, loading: () => <MobileModuleSkeleton /> });
const ClientPerfil = dynamic(() => import('./ClientPerfil'), { ssr: false, loading: () => <MobileModuleSkeleton /> });
const ClientTracking = dynamic(() => import('./ClientTracking'), { ssr: false, loading: () => <MobileModuleSkeleton /> });
const ClientChat = dynamic(() => import('./ClientChat'), { ssr: false, loading: () => <MobileModuleSkeleton /> });
const ClientRating = dynamic(() => import('./ClientRating'), { ssr: false, loading: () => <MobileModuleSkeleton /> });
const ClientExplorar = dynamic(() => import('./ClientExplorar'), { ssr: false, loading: () => <MobileModuleSkeleton /> });
const ClientTienda = dynamic(() => import('./ClientTienda'), { ssr: false, loading: () => <MobileModuleSkeleton /> });
const ClientCarrito = dynamic(() => import('./ClientCarrito'), { ssr: false, loading: () => <MobileModuleSkeleton /> });
const ClientPedidos = dynamic(() => import('./ClientPedidos'), { ssr: false, loading: () => <MobileModuleSkeleton /> });
const ClientAyuda = dynamic(() => import('./ClientAyuda'), { ssr: false, loading: () => <MobileModuleSkeleton /> });
const ClientPuntos = dynamic(() => import('./ClientPuntos'), { ssr: false, loading: () => <MobileModuleSkeleton /> });

interface SnackbarData {
  message: string;
  action?: string;
  onAction?: () => void;
}

const SnackbarContext = createContext<(data: SnackbarData | null) => void>(() => {});
export function useSnackbar() {
  return useContext(SnackbarContext);
}

interface ClientShellProps {
  isDark: boolean;
  toggleTheme: () => void;
  onLogout: () => void;
  userName: string;
}

function getInitials(name: string): string {
  const parts = (name || 'Usuario').trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return parts[0].substring(0, 2).toUpperCase();
}

interface NavItem {
  key: ClientModuleKey;
  label: string;
  icon: React.ReactNode;
}

const NAV_ITEMS: NavItem[] = [
  { key: 'inicio', label: 'Inicio', icon: <Home size={20} strokeWidth={2} /> },
  { key: 'explorar', label: 'Explorar', icon: <Search size={20} strokeWidth={2} /> },
  { key: 'solicitar', label: 'Envío', icon: <Package size={20} strokeWidth={2} /> },
  { key: 'pedidos', label: 'Pedidos', icon: <ShoppingCart size={20} strokeWidth={2} /> },
  { key: 'perfil', label: 'Perfil', icon: <User size={20} strokeWidth={2} /> },
];

export default function ClientShell({ isDark, toggleTheme, onLogout, userName }: ClientShellProps) {
  const activeModule = useStore((s) => s.clientActiveModule);
  const setClientActiveModule = useStore((s) => s.setClientActiveModule);
  const notificaciones = useStore((s) => s.clientNotificaciones);
  const markAllClientNotifRead = useStore((s) => s.markAllClientNotifRead);
  const setTrackingOrder = useStore((s) => s.setTrackingOrder);
  const setChatOrderId = useStore((s) => s.setChatOrderId);

  const cartItemsCount = useMarketplaceStore((s) => s.cartItems.reduce((acc, item) => acc + item.cantidad, 0));

  const [notifOpen, setNotifOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [snackbar, setSnackbar] = useState<SnackbarData | null>(null);

  const unreadNotifs = notificaciones.filter((n) => !n.leida).length;

  const showSnackbar = useCallback((data: SnackbarData | null) => {
    setSnackbar(data);
    if (data) {
      setTimeout(() => setSnackbar(null), 4000);
    }
  }, []);

  const handleNavigate = (mod: ClientModuleKey) => {
    setClientActiveModule(mod);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <SnackbarContext.Provider value={showSnackbar}>
      {/* Centered Mobile Container (max 480px on desktop) */}
      <div className="min-h-screen bg-[#0A0A0E] text-[#F5F5F7] font-['DM_Sans',sans-serif] selection:bg-[#FF6B2C] selection:text-white flex justify-center">
        <div className="w-full max-w-[480px] min-h-screen bg-[#000000] border-x border-white/5 relative flex flex-col pb-28 pt-16 shadow-2xl">

          {/* 🍏 GLASS HEADER (STICKY TOP, BLUR 40PX) */}
          <header className="sticky top-0 z-40 px-4 py-2.5 backdrop-blur-[40px] bg-black/60 border-b border-white/[0.08] flex items-center justify-between transition-all">
            
            {/* Brand Logo */}
            <button 
              onClick={() => handleNavigate('inicio')}
              className="flex items-center gap-2.5 focus:outline-none group"
            >
              <div className="w-9 h-9 rounded-[10px] bg-gradient-to-tr from-[#FF6B2C] to-[#FF8F50] flex items-center justify-center text-white shadow-lg shadow-[#FF6B2C]/25 group-hover:scale-105 transition-transform duration-300">
                <Bike size={20} strokeWidth={2.2} />
              </div>
              <div className="text-left">
                <span className="font-['Plus_Jakarta_Sans'] font-extrabold text-base tracking-tight text-white">
                  LOGI<span className="text-[#FF6B2C]">FAST</span>
                </span>
                <span className="block text-[10px] font-bold uppercase tracking-widest text-[#8E8E93]">
                  Cliente
                </span>
              </div>
            </button>

            {/* Right Action Icons */}
            <div className="flex items-center gap-2">

              {/* Shopping Cart Pill */}
              <button
                onClick={() => handleNavigate('carrito')}
                className="relative p-2.5 rounded-full bg-[#1C1C24] border border-white/[0.08] text-[#F5F5F7] hover:bg-[#2A2A36] transition-colors"
                title="Ver Carrito"
              >
                <ShoppingCart size={18} />
                {cartItemsCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#FF6B2C] text-white text-[10px] font-extrabold rounded-full flex items-center justify-center ring-2 ring-black shadow-md">
                    {cartItemsCount}
                  </span>
                )}
              </button>

              {/* Notifications Toggle */}
              <div className="relative">
                <button
                  onClick={() => {
                    setNotifOpen(!notifOpen);
                    setUserMenuOpen(false);
                  }}
                  className="relative p-2.5 rounded-full bg-[#1C1C24] border border-white/[0.08] text-[#F5F5F7] hover:bg-[#2A2A36] transition-colors"
                >
                  <Bell size={18} />
                  {unreadNotifs > 0 && (
                    <span className="absolute top-2 right-2 w-2 h-2 bg-[#FF6B2C] rounded-full ring-2 ring-black animate-ping" />
                  )}
                  {unreadNotifs > 0 && (
                    <span className="absolute top-2 right-2 w-2 h-2 bg-[#FF6B2C] rounded-full ring-2 ring-black" />
                  )}
                </button>

                {/* Notifications Drawer */}
                <AnimatePresence>
                  {notifOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 mt-3 w-80 bg-[#1C1C24]/95 backdrop-blur-[40px] border border-white/[0.08] rounded-[20px] shadow-2xl overflow-hidden z-50 p-2"
                    >
                      <div className="p-3 border-b border-white/[0.08] flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Bell size={16} className="text-[#FF6B2C]" />
                          <h4 className="font-['Plus_Jakarta_Sans'] font-bold text-xs text-white">Notificaciones</h4>
                        </div>
                        {unreadNotifs > 0 && (
                          <button
                            onClick={markAllClientNotifRead}
                            className="text-[11px] font-bold text-[#FF6B2C] hover:underline"
                          >
                            Marcar leídas
                          </button>
                        )}
                      </div>
                      <div className="max-h-72 overflow-y-auto space-y-1 p-1">
                        {notificaciones.length === 0 ? (
                          <div className="p-6 text-center text-xs text-[#8E8E93]">
                            No tienes notificaciones pendientes
                          </div>
                        ) : (
                          notificaciones.map((n) => (
                            <div
                              key={n.id}
                              className={`p-2.5 rounded-[12px] transition-colors ${
                                !n.leida ? 'bg-[#FF6B2C]/10 border border-[#FF6B2C]/20' : 'hover:bg-[#2A2A36]'
                              }`}
                            >
                              <p className="font-bold text-xs text-white">{n.titulo}</p>
                              <p className="text-[11px] text-[#8E8E93] mt-0.5">{n.descripcion}</p>
                              <span className="text-[10px] text-[#48484A] block mt-1">{n.timestamp}</span>
                            </div>
                          ))
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* User Avatar Dropdown */}
              <div className="relative">
                <button
                  onClick={() => {
                    setUserMenuOpen(!userMenuOpen);
                    setNotifOpen(false);
                  }}
                  className="flex items-center gap-2 p-1 rounded-full bg-[#1C1C24] border border-white/[0.08] hover:bg-[#2A2A36] transition-colors"
                >
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#FF6B2C] to-[#FF8F50] text-white font-bold text-xs flex items-center justify-center">
                    {getInitials(userName)}
                  </div>
                </button>

                <AnimatePresence>
                  {userMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 mt-3 w-52 bg-[#1C1C24]/95 backdrop-blur-[40px] border border-white/[0.08] rounded-[20px] shadow-2xl p-2 z-50"
                    >
                      <div className="px-3 py-2 border-b border-white/[0.08]">
                        <p className="font-bold text-xs text-white">{userName}</p>
                        <p className="text-[10px] text-[#8E8E93]">Cliente Logifast</p>
                      </div>
                      <div className="py-1">
                        <button
                          onClick={() => {
                            handleNavigate('perfil');
                            setUserMenuOpen(false);
                          }}
                          className="w-full px-3 py-2 rounded-[10px] text-left text-xs font-semibold text-[#F5F5F7] hover:bg-[#2A2A36] flex items-center gap-2"
                        >
                          <User size={14} /> Mi Perfil
                        </button>
                        <button
                          onClick={() => {
                            handleNavigate('pedidos');
                            setUserMenuOpen(false);
                          }}
                          className="w-full px-3 py-2 rounded-[10px] text-left text-xs font-semibold text-[#F5F5F7] hover:bg-[#2A2A36] flex items-center gap-2"
                        >
                          <ShoppingCart size={14} /> Mis Pedidos
                        </button>
                      </div>
                      <div className="pt-1 border-t border-white/[0.08]">
                        <button
                          onClick={onLogout}
                          className="w-full px-3 py-2 rounded-[10px] text-left text-xs font-semibold text-[#EF4444] hover:bg-[#EF4444]/10 flex items-center gap-2"
                        >
                          <LogOut size={14} /> Cerrar Sesión
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

            </div>
          </header>

          {/* 🍏 MAIN CONTENT CANVAS */}
          <main className="px-4 py-3 flex-1 overflow-y-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeModule}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              >
                {activeModule === 'inicio' && (
                  <ClientInicio
                    isDark={isDark}
                    userName={userName}
                    onNavigate={handleNavigate}
                    onOpenTracking={(id) => {
                      setTrackingOrder(id);
                      handleNavigate('tracking');
                    }}
                    onOpenChat={(id) => {
                      setChatOrderId(id);
                      handleNavigate('chat');
                    }}
                  />
                )}
                {activeModule === 'explorar' && <ClientExplorar isDark={isDark} userName={userName} onNavigate={handleNavigate} />}
                {activeModule === 'solicitar' && <ClientSolicitar isDark={isDark} userName={userName} onNavigate={handleNavigate} />}
                {activeModule === 'envios' && (
                  <ClientEnvios
                    isDark={isDark}
                    userName={userName}
                    onNavigate={handleNavigate}
                    onOpenTracking={(id) => {
                      setTrackingOrder(id);
                      handleNavigate('tracking');
                    }}
                    onOpenChat={(id) => {
                      setChatOrderId(id);
                      handleNavigate('chat');
                    }}
                  />
                )}
                {activeModule === 'pedidos' && <ClientPedidos isDark={isDark} userName={userName} onNavigate={handleNavigate} />}
                {activeModule === 'perfil' && <ClientPerfil isDark={isDark} userName={userName} onLogout={onLogout} onNavigate={handleNavigate} />}
                {activeModule === 'carrito' && <ClientCarrito isDark={isDark} onClose={() => handleNavigate('explorar')} />}
                {activeModule === 'tracking' && <ClientTracking isDark={isDark} onBack={() => handleNavigate('pedidos')} onOpenChat={(id) => { if (id) setChatOrderId(id); handleNavigate('chat'); }} onRate={() => handleNavigate('rating')} />}
                {activeModule === 'chat' && <ClientChat isDark={isDark} onClose={() => handleNavigate('pedidos')} />}
                {activeModule === 'rating' && <ClientRating isDark={isDark} onClose={() => handleNavigate('inicio')} />}
                {activeModule === 'tienda' && <ClientTienda isDark={isDark} tiendaId="" onBack={() => handleNavigate('explorar')} onOpenCart={() => handleNavigate('carrito')} />}
                {activeModule === 'ayuda' && <ClientAyuda isDark={isDark} onClose={() => handleNavigate('inicio')} />}
                {activeModule === 'puntos' && <ClientPuntos isDark={isDark} onClose={() => handleNavigate('inicio')} />}
              </motion.div>
            </AnimatePresence>
          </main>

          {/* 🍏 GLASS DOCK NAVIGATION (FIXED BOTTOM, BLUR 50PX, 5 TABS) */}
          <nav className="fixed bottom-3 inset-x-0 z-40 px-4 flex justify-center pointer-events-none">
            <div className="pointer-events-auto max-w-[440px] w-full backdrop-blur-[50px] bg-[#121217]/90 border border-white/[0.08] shadow-[0_16px_40px_rgba(0,0,0,0.8)] rounded-full px-2 py-1.5 flex items-center justify-around">
              {NAV_ITEMS.map((item) => {
                const isActive = activeModule === item.key;
                return (
                  <button
                    key={item.key}
                    onClick={() => handleNavigate(item.key)}
                    className={`relative flex flex-col items-center justify-center px-3 py-1.5 rounded-full text-[11px] font-bold transition-all duration-300 ${
                      isActive ? 'text-[#FF6B2C]' : 'text-[#8E8E93] hover:text-[#F5F5F7]'
                    }`}
                  >
                    {/* Active glowing dot above tab icon */}
                    {isActive && (
                      <motion.div
                        layoutId="activeClientTabDot"
                        className="absolute -top-1 w-1.5 h-1.5 rounded-full bg-[#FF6B2C] shadow-[0_0_8px_#FF6B2C]"
                        transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                      />
                    )}
                    <span className="relative z-10 mb-0.5">{item.icon}</span>
                    <span className="relative z-10 text-[10px] tracking-tight">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </nav>

        </div>
      </div>
    </SnackbarContext.Provider>
  );
}
