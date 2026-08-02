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
    <div className="w-full max-w-4xl mx-auto space-y-6 p-4 sm:p-6 animate-pulse">
      <div className="w-full h-48 bg-zinc-200/60 dark:bg-zinc-800/40 rounded-[28px] backdrop-blur-md" />
      <div className="grid grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex flex-col items-center space-y-2">
            <div className="w-16 h-16 bg-zinc-200/60 dark:bg-zinc-800/40 rounded-2xl" />
            <div className="w-12 h-3 bg-zinc-200/60 dark:bg-zinc-800/40 rounded-full" />
          </div>
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
const ClientBusqueda = dynamic(() => import('./ClientBusqueda'), { ssr: false, loading: () => <MobileModuleSkeleton /> });
const ClientAyuda = dynamic(() => import('./ClientAyuda'), { ssr: false, loading: () => <MobileModuleSkeleton /> });
const ClientPuntos = dynamic(() => import('./ClientPuntos'), { ssr: false, loading: () => <MobileModuleSkeleton /> });
const ClientMiTienda = dynamic(() => import('./ClientMiTienda'), { ssr: false, loading: () => <MobileModuleSkeleton /> });

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
  { key: 'inicio', label: 'Inicio', icon: <Home size={22} strokeWidth={2} /> },
  { key: 'explorar', label: 'Explorar', icon: <Search size={22} strokeWidth={2} /> },
  { key: 'solicitar', label: 'Envío', icon: <Package size={22} strokeWidth={2} /> },
  { key: 'pedidos', label: 'Pedidos', icon: <ShoppingCart size={22} strokeWidth={2} /> },
  { key: 'perfil', label: 'Perfil', icon: <User size={22} strokeWidth={2} /> },
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
      <div className="min-h-screen bg-[#F2F2F7] dark:bg-black text-zinc-900 dark:text-zinc-100 font-[-apple-system,BlinkMacSystemFont,'SF_Pro_Display','Inter',sans-serif] selection:bg-blue-500 selection:text-white pb-28 pt-20">

        {/* 🍏 APPLE FLOATING GLASS HEADER */}
        <header className="fixed top-0 inset-x-0 z-40 px-4 sm:px-8 py-3 backdrop-blur-2xl bg-white/70 dark:bg-zinc-950/70 border-b border-white/20 dark:border-white/10 shadow-sm transition-all duration-300">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            
            {/* Brand Logo */}
            <button 
              onClick={() => handleNavigate('inicio')}
              className="flex items-center gap-3 focus:outline-none group"
            >
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/25 group-hover:scale-105 transition-transform duration-300">
                <Bike size={22} strokeWidth={2.2} />
              </div>
              <div className="text-left">
                <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-zinc-900 via-zinc-800 to-zinc-600 dark:from-white dark:via-zinc-200 dark:to-zinc-400 bg-clip-text text-transparent">
                  Logi<span className="text-blue-600 dark:text-blue-500">Fast</span>
                </span>
                <span className="block text-[10px] font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
                  Client Edition
                </span>
              </div>
            </button>

            {/* Right Action Icons */}
            <div className="flex items-center gap-2 sm:gap-3">

              {/* Shopping Cart Pill */}
              <button
                onClick={() => handleNavigate('carrito')}
                className="relative p-2.5 rounded-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200/70 dark:hover:bg-zinc-800 transition-colors"
                title="Ver Carrito"
              >
                <ShoppingCart size={19} />
                {cartItemsCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-[11px] font-bold px-1.5 py-0.5 rounded-full shadow-md animate-bounce">
                    {cartItemsCount}
                  </span>
                )}
              </button>

              {/* Notifications Popover Toggle */}
              <div className="relative">
                <button
                  onClick={() => {
                    setNotifOpen(!notifOpen);
                    setUserMenuOpen(false);
                  }}
                  className="relative p-2.5 rounded-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200/70 dark:hover:bg-zinc-800 transition-colors"
                >
                  <Bell size={19} />
                  {unreadNotifs > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-rose-500 rounded-full ring-2 ring-white dark:ring-zinc-950 animate-ping" />
                  )}
                  {unreadNotifs > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-rose-500 rounded-full ring-2 ring-white dark:ring-zinc-950" />
                  )}
                </button>

                {/* Notifications Drawer */}
                <AnimatePresence>
                  {notifOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 mt-3 w-80 sm:w-96 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-2xl border border-zinc-200/80 dark:border-zinc-800 rounded-3xl shadow-2xl overflow-hidden z-50"
                    >
                      <div className="p-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Bell size={18} className="text-blue-500" />
                          <h4 className="font-bold text-sm">Notificaciones</h4>
                        </div>
                        {unreadNotifs > 0 && (
                          <button
                            onClick={markAllClientNotifRead}
                            className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                          >
                            Marcar leídas
                          </button>
                        )}
                      </div>
                      <div className="max-h-80 overflow-y-auto divide-y divide-zinc-100 dark:divide-zinc-800/60 p-2">
                        {notificaciones.length === 0 ? (
                          <div className="p-6 text-center text-xs text-zinc-400">
                            No tienes notificaciones pendientes
                          </div>
                        ) : (
                          notificaciones.map((n) => (
                            <div
                              key={n.id}
                              className={`p-3 rounded-2xl transition-colors ${
                                !n.leida ? 'bg-blue-50/50 dark:bg-blue-950/20' : 'hover:bg-zinc-50 dark:hover:bg-zinc-800/40'
                              }`}
                            >
                              <p className="font-semibold text-xs text-zinc-800 dark:text-zinc-200">{n.titulo}</p>
                              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">{n.descripcion}</p>
                              <span className="text-[10px] text-zinc-400 block mt-1">{n.timestamp}</span>
                            </div>
                          ))
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                className="p-2.5 rounded-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200/70 dark:hover:bg-zinc-800 transition-colors"
                title="Cambiar Tema"
              >
                {isDark ? <Sun size={19} className="text-amber-400" /> : <Moon size={19} className="text-zinc-700" />}
              </button>

              {/* User Avatar Dropdown */}
              <div className="relative">
                <button
                  onClick={() => {
                    setUserMenuOpen(!userMenuOpen);
                    setNotifOpen(false);
                  }}
                  className="flex items-center gap-2 p-1 pr-2.5 rounded-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 hover:bg-zinc-200/70 dark:hover:bg-zinc-800 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-bold text-xs flex items-center justify-center shadow-md">
                    {getInitials(userName)}
                  </div>
                  <span className="hidden sm:inline font-semibold text-xs max-w-[100px] truncate">{userName}</span>
                </button>

                <AnimatePresence>
                  {userMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 mt-3 w-56 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-2xl border border-zinc-200/80 dark:border-zinc-800 rounded-3xl shadow-2xl p-2 z-50"
                    >
                      <div className="px-3 py-2 border-b border-zinc-100 dark:border-zinc-800">
                        <p className="font-bold text-xs text-zinc-800 dark:text-zinc-200">{userName}</p>
                        <p className="text-[10px] text-zinc-400">Cliente Logifast</p>
                      </div>
                      <div className="py-1">
                        <button
                          onClick={() => {
                            handleNavigate('perfil');
                            setUserMenuOpen(false);
                          }}
                          className="w-full px-3 py-2 rounded-xl text-left text-xs font-semibold hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center gap-2"
                        >
                          <User size={15} /> Mi Perfil
                        </button>
                        <button
                          onClick={() => {
                            handleNavigate('pedidos');
                            setUserMenuOpen(false);
                          }}
                          className="w-full px-3 py-2 rounded-xl text-left text-xs font-semibold hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center gap-2"
                        >
                          <ShoppingCart size={15} /> Mis Pedidos
                        </button>
                        <button
                          onClick={() => {
                            handleNavigate('puntos');
                            setUserMenuOpen(false);
                          }}
                          className="w-full px-3 py-2 rounded-xl text-left text-xs font-semibold hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center gap-2"
                        >
                          <Wallet size={15} /> Billetera & Puntos
                        </button>
                      </div>
                      <div className="pt-1 border-t border-zinc-100 dark:border-zinc-800">
                        <button
                          onClick={onLogout}
                          className="w-full px-3 py-2 rounded-xl text-left text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 flex items-center gap-2"
                        >
                          <LogOut size={15} /> Cerrar Sesión
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

            </div>
          </div>
        </header>

        {/* 🍏 MAIN CONTENT CANVAS */}
        <main className="max-w-6xl mx-auto px-4 sm:px-6">
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

        {/* 🍏 APPLE FLOATING GLASS DOCK (BOTTOM TAB BAR) */}
        <nav className="fixed bottom-4 inset-x-0 z-40 px-4 flex justify-center pointer-events-none">
          <div className="pointer-events-auto backdrop-blur-3xl bg-white/80 dark:bg-zinc-900/80 border border-white/40 dark:border-white/10 shadow-[0_16px_40px_rgba(0,0,0,0.15)] dark:shadow-[0_16px_40px_rgba(0,0,0,0.6)] rounded-full px-3 py-2 flex items-center gap-1 sm:gap-2 transition-all">
            {NAV_ITEMS.map((item) => {
              const isActive = activeModule === item.key;
              return (
                <button
                  key={item.key}
                  onClick={() => handleNavigate(item.key)}
                  className={`relative px-4 py-2.5 rounded-full flex items-center gap-2 text-xs font-semibold transition-all duration-300 ${
                    isActive
                      ? 'text-white'
                      : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeDockTab"
                      className="absolute inset-0 bg-blue-600 rounded-full shadow-lg shadow-blue-500/30"
                      transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                    />
                  )}
                  <span className="relative z-10">{item.icon}</span>
                  {isActive && <span className="relative z-10 font-bold">{item.label}</span>}
                </button>
              );
            })}
          </div>
        </nav>

      </div>
    </SnackbarContext.Provider>
  );
}
