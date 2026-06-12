'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Home,
  PlusCircle,
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
  X,
} from 'lucide-react';
import { useStore, type ClientModuleKey } from '@/lib/store';
import type { ClientNotificacion } from '@/lib/store';

/* ═══════════════════════════════════════════════
   DYNAMIC MODULE IMPORTS
   ═══════════════════════════════════════════════ */

const ClientInicio = dynamic(() => import('./ClientInicio'), { ssr: false });
const ClientSolicitar = dynamic(() => import('./ClientSolicitar'), { ssr: false });
const ClientEnvios = dynamic(() => import('./ClientEnvios'), { ssr: false });
const ClientPerfil = dynamic(() => import('./ClientPerfil'), { ssr: false });

/* ═══════════════════════════════════════════════
   PROPS
   ═══════════════════════════════════════════════ */

interface ClientShellProps {
  isDark: boolean;
  toggleTheme: () => void;
  onLogout: () => void;
  userName: string;
}

/* ═══════════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════════ */

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return parts[0].substring(0, 2).toUpperCase();
}

function relativeTime(timestamp: string): string {
  const now = Date.now();
  const then = new Date(timestamp).getTime();
  const diff = now - then;

  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'Ahora mismo';
  if (minutes < 60) return `Hace ${minutes} min`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Hace ${hours} hora${hours > 1 ? 's' : ''}`;

  const days = Math.floor(hours / 24);
  if (days < 30) return `Hace ${days} día${days > 1 ? 's' : ''}`;

  const months = Math.floor(days / 30);
  return `Hace ${months} mes${months > 1 ? 'es' : ''}`;
}

/* Notification icon + color by tipo */
function getNotifIcon(tipo: ClientNotificacion['tipo']): { icon: React.ReactNode; color: string } {
  const iconSize = 18;
  switch (tipo) {
    case 'orden_confirmada':
      return { icon: <CheckCircle size={iconSize} />, color: 'var(--exito)' };
    case 'repartidor_asignado':
      return { icon: <User size={iconSize} />, color: 'var(--info)' };
    case 'repartidor_camino':
      return { icon: <Bike size={iconSize} />, color: '#FF9800' };
    case 'paquete_recogido':
      return { icon: <Package size={iconSize} />, color: 'var(--info)' };
    case 'entrega_exitosa':
      return { icon: <CheckCircle size={22} />, color: 'var(--exito)' };
    case 'incidencia':
      return { icon: <AlertTriangle size={iconSize} />, color: 'var(--peligro)' };
    case 'codigo_nuevo':
      return { icon: <Tag size={iconSize} />, color: '#FF9800' };
    case 'te_extranamos':
      return { icon: <Heart size={iconSize} />, color: '#E91E63' };
    default:
      return { icon: <Bell size={iconSize} />, color: 'var(--primario)' };
  }
}

/* ═══════════════════════════════════════════════
   NAV CONFIG
   ═══════════════════════════════════════════════ */

interface NavItem {
  key: ClientModuleKey;
  label: string;
  icon: React.ReactNode;
}

const NAV_ITEMS: NavItem[] = [
  { key: 'inicio', label: 'Inicio', icon: <Home size={20} /> },
  { key: 'solicitar', label: 'Enviar', icon: <PlusCircle size={20} /> },
  { key: 'envios', label: 'Envíos', icon: <Package size={20} /> },
  { key: 'perfil', label: 'Perfil', icon: <User size={20} /> },
];

/* ═══════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════ */

export default function ClientShell({ isDark, toggleTheme, onLogout, userName }: ClientShellProps) {
  const {
    clientActiveModule,
    clientModuleFade,
    setClientActiveModule,
    clientNotificaciones,
    clientNotifOpen,
    setClientNotifOpen,
    markClientNotifRead,
    markAllClientNotifRead,
  } = useStore();

  const [avatarOpen, setAvatarOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const avatarRef = useRef<HTMLDivElement>(null);

  const unreadCount = clientNotificaciones.filter((n) => !n.leida).length;
  const initials = getInitials(userName);

  /* Close dropdowns on outside click */
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setClientNotifOpen(false);
      }
      if (avatarRef.current && !avatarRef.current.contains(e.target as Node)) {
        setAvatarOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [setClientNotifOpen]);

  /* Close dropdowns on escape */
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setClientNotifOpen(false);
        setAvatarOpen(false);
      }
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [setClientNotifOpen]);

  const handleNav = useCallback(
    (mod: ClientModuleKey) => {
      setClientActiveModule(mod);
    },
    [setClientActiveModule]
  );

  const renderModule = () => {
    const moduleProps = { isDark, userName, onNavigate: handleNav };
    switch (clientActiveModule) {
      case 'inicio':
        return <ClientInicio {...moduleProps} />;
      case 'solicitar':
        return <ClientSolicitar {...moduleProps} />;
      case 'envios':
        return <ClientEnvios {...moduleProps} />;
      case 'perfil':
        return <ClientPerfil {...moduleProps} />;
      default:
        return <ClientInicio {...moduleProps} />;
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'var(--bg)',
        color: 'var(--text)',
        fontFamily: "'DM Sans', sans-serif",
        transition: 'background-color 0.4s ease, color 0.3s ease',
      }}
    >
      {/* ─── HEADER ─── */}
      <header
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          height: 60,
          zIndex: 50,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 16px',
          background: 'color-mix(in srgb, var(--surface) 85%, transparent)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderBottom: '1px solid var(--border)',
          transition: 'background-color 0.3s ease, border-color 0.3s ease',
        }}
      >
        {/* Left: Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: 'linear-gradient(135deg, #FF5722, #FF8A65)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF',
              fontWeight: 700,
              fontSize: 13,
              fontFamily: "'Syne', sans-serif",
              letterSpacing: '-0.5px',
              flexShrink: 0,
            }}
          >
            LF
          </div>
          <span
            style={{
              fontFamily: "'Syne', sans-serif",
              fontWeight: 700,
              fontSize: 18,
              color: 'var(--text)',
              letterSpacing: '-0.3px',
            }}
          >
            LOGIFAST
          </span>
        </div>

        {/* Center: Desktop Nav Pills */}
        <nav
          style={{
            display: 'none',
            alignItems: 'center',
            gap: 4,
          }}
          className="lf-desktop-nav"
        >
          {NAV_ITEMS.map((item) => {
            const isActive = clientActiveModule === item.key;
            const isEnviar = item.key === 'solicitar';
            return (
              <button
                key={item.key}
                onClick={() => handleNav(item.key)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: isEnviar ? '6px 16px' : '6px 14px',
                  borderRadius: 100,
                  border: 'none',
                  cursor: 'pointer',
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 14,
                  fontWeight: isActive ? 600 : 500,
                  background: isEnviar
                    ? isActive
                      ? 'var(--primario)'
                      : 'color-mix(in srgb, var(--primario) 10%, transparent)'
                    : isActive
                      ? 'color-mix(in srgb, var(--primario) 10%, transparent)'
                      : 'transparent',
                  color: isEnviar
                    ? isActive
                      ? '#FFFFFF'
                      : 'var(--primario)'
                    : isActive
                      ? 'var(--primario)'
                      : 'var(--text-muted)',
                  transition: 'all 0.2s ease',
                  whiteSpace: 'nowrap',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    (e.currentTarget as HTMLButtonElement).style.background = isEnviar
                      ? 'color-mix(in srgb, var(--primario) 15%, transparent)'
                      : 'color-mix(in srgb, var(--text-muted) 8%, transparent)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    (e.currentTarget as HTMLButtonElement).style.background = isEnviar
                      ? 'color-mix(in srgb, var(--primario) 10%, transparent)'
                      : 'transparent';
                  }
                }}
              >
                {item.icon}
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Right: Theme + Notif + Avatar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            aria-label={isDark ? 'Modo claro' : 'Modo oscuro'}
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              border: 'none',
              background: 'transparent',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'color 0.2s ease, background 0.2s ease',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background =
                'color-mix(in srgb, var(--text-muted) 8%, transparent)';
              (e.currentTarget as HTMLButtonElement).style.color = 'var(--text)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
              (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-muted)';
            }}
          >
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          {/* Notification Bell */}
          <div ref={notifRef} style={{ position: 'relative' }}>
            <button
              onClick={() => {
                setClientNotifOpen(!clientNotifOpen);
                setAvatarOpen(false);
              }}
              aria-label="Notificaciones"
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                border: 'none',
                background: clientNotifOpen
                  ? 'color-mix(in srgb, var(--primario) 10%, transparent)'
                  : 'transparent',
                color: clientNotifOpen ? 'var(--primario)' : 'var(--text-muted)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'color 0.2s ease, background 0.2s ease',
                position: 'relative',
              }}
              onMouseEnter={(e) => {
                if (!clientNotifOpen) {
                  (e.currentTarget as HTMLButtonElement).style.background =
                    'color-mix(in srgb, var(--text-muted) 8%, transparent)';
                  (e.currentTarget as HTMLButtonElement).style.color = 'var(--text)';
                }
              }}
              onMouseLeave={(e) => {
                if (!clientNotifOpen) {
                  (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                  (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-muted)';
                }
              }}
            >
              <Bell size={18} />
              {unreadCount > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    top: 4,
                    right: 4,
                    width: 16,
                    height: 16,
                    borderRadius: '50%',
                    background: 'var(--peligro)',
                    color: '#FFFFFF',
                    fontSize: 10,
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    lineHeight: 1,
                    fontFamily: "'JetBrains Mono', monospace",
                  }}
                >
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {/* Notification Dropdown */}
            <AnimatePresence>
              {clientNotifOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.96 }}
                  transition={{ duration: 0.2, ease: 'easeOut' }}
                  style={{
                    position: 'absolute',
                    top: 46,
                    right: 0,
                    width: 360,
                    maxHeight: 460,
                    borderRadius: 16,
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    boxShadow: 'var(--shadow-lg)',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    zIndex: 60,
                  }}
                >
                  {/* Header */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '14px 16px',
                      borderBottom: '1px solid var(--border)',
                    }}
                  >
                    <span
                      style={{
                        fontFamily: "'Syne', sans-serif",
                        fontWeight: 700,
                        fontSize: 15,
                        color: 'var(--text)',
                      }}
                    >
                      Notificaciones
                    </span>
                    {unreadCount > 0 && (
                      <button
                        onClick={() => markAllClientNotifRead()}
                        style={{
                          border: 'none',
                          background: 'transparent',
                          color: 'var(--primario)',
                          fontSize: 12,
                          fontWeight: 600,
                          cursor: 'pointer',
                          fontFamily: "'DM Sans', sans-serif",
                          padding: '4px 8px',
                          borderRadius: 6,
                          transition: 'background 0.15s ease',
                        }}
                        onMouseEnter={(e) => {
                          (e.currentTarget as HTMLButtonElement).style.background =
                            'var(--primario-soft)';
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                        }}
                      >
                        Marcar todo como leído
                      </button>
                    )}
                  </div>

                  {/* List */}
                  <div
                    style={{
                      flex: 1,
                      overflowY: 'auto',
                      maxHeight: 360,
                    }}
                  >
                    {clientNotificaciones.slice(0, 10).map((notif) => {
                      const { icon, color } = getNotifIcon(notif.tipo);
                      return (
                        <div
                          key={notif.id}
                          onClick={() => markClientNotifRead(notif.id)}
                          style={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: 12,
                            padding: '12px 16px',
                            cursor: 'pointer',
                            background: !notif.leida
                              ? 'color-mix(in srgb, var(--info) 5%, transparent)'
                              : 'transparent',
                            borderLeft: !notif.leida
                              ? '3px solid var(--info)'
                              : '3px solid transparent',
                            transition: 'background 0.15s ease',
                          }}
                          onMouseEnter={(e) => {
                            (e.currentTarget as HTMLDivElement).style.background =
                              'color-mix(in srgb, var(--text-muted) 5%, transparent)';
                          }}
                          onMouseLeave={(e) => {
                            (e.currentTarget as HTMLDivElement).style.background = !notif.leida
                              ? 'color-mix(in srgb, var(--info) 5%, transparent)'
                              : 'transparent';
                          }}
                        >
                          <div
                            style={{
                              flexShrink: 0,
                              width: 34,
                              height: 34,
                              borderRadius: 10,
                              background: `color-mix(in srgb, ${color} 12%, transparent)`,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: color,
                            }}
                          >
                            {icon}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div
                              style={{
                                fontSize: 14,
                                fontWeight: 600,
                                color: 'var(--text)',
                                lineHeight: 1.3,
                                marginBottom: 2,
                              }}
                            >
                              {notif.titulo}
                            </div>
                            <div
                              style={{
                                fontSize: 13,
                                color: 'var(--text-muted)',
                                lineHeight: 1.4,
                              }}
                            >
                              {notif.descripcion}
                            </div>
                            <div
                              style={{
                                fontSize: 11,
                                color: 'var(--text-muted)',
                                marginTop: 4,
                                fontFamily: "'JetBrains Mono', monospace",
                                opacity: 0.7,
                              }}
                            >
                              {relativeTime(notif.timestamp)}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    {clientNotificaciones.length === 0 && (
                      <div
                        style={{
                          padding: 32,
                          textAlign: 'center',
                          color: 'var(--text-muted)',
                          fontSize: 14,
                        }}
                      >
                        No hay notificaciones
                      </div>
                    )}
                  </div>

                  {/* Footer */}
                  {clientNotificaciones.length > 0 && (
                    <div
                      style={{
                        borderTop: '1px solid var(--border)',
                        padding: '10px 16px',
                        display: 'flex',
                        justifyContent: 'center',
                      }}
                    >
                      <button
                        onClick={() => {
                          clientNotificaciones.forEach((n) => markClientNotifRead(n.id));
                          setClientNotifOpen(false);
                        }}
                        style={{
                          border: 'none',
                          background: 'transparent',
                          color: 'var(--text-muted)',
                          fontSize: 12,
                          fontWeight: 500,
                          cursor: 'pointer',
                          fontFamily: "'DM Sans', sans-serif",
                          padding: '4px 8px',
                          borderRadius: 6,
                          transition: 'color 0.15s ease',
                        }}
                        onMouseEnter={(e) => {
                          (e.currentTarget as HTMLButtonElement).style.color = 'var(--text)';
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-muted)';
                        }}
                      >
                        Limpiar todo
                      </button>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Avatar */}
          <div ref={avatarRef} style={{ position: 'relative' }}>
            <button
              onClick={() => {
                setAvatarOpen(!avatarOpen);
                setClientNotifOpen(false);
              }}
              aria-label="Menú de usuario"
              style={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                border: 'none',
                background: 'var(--primario-soft)',
                color: 'var(--primario)',
                fontWeight: 700,
                fontSize: 13,
                fontFamily: "'Syne', sans-serif",
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'box-shadow 0.2s ease',
                boxShadow: avatarOpen ? '0 0 0 2px var(--primario)' : 'none',
              }}
            >
              {initials}
            </button>

            {/* Avatar Dropdown */}
            <AnimatePresence>
              {avatarOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.96 }}
                  transition={{ duration: 0.2, ease: 'easeOut' }}
                  style={{
                    position: 'absolute',
                    top: 46,
                    right: 0,
                    width: 200,
                    borderRadius: 14,
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    boxShadow: 'var(--shadow-lg)',
                    overflow: 'hidden',
                    zIndex: 60,
                  }}
                >
                  {/* User info */}
                  <div
                    style={{
                      padding: '14px 16px',
                      borderBottom: '1px solid var(--border)',
                    }}
                  >
                    <div
                      style={{
                        fontSize: 14,
                        fontWeight: 600,
                        color: 'var(--text)',
                        lineHeight: 1.3,
                      }}
                    >
                      {userName}
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        color: 'var(--text-muted)',
                        marginTop: 2,
                      }}
                    >
                      Cliente
                    </div>
                  </div>

                  {/* Menu items */}
                  <div style={{ padding: '6px 6px' }}>
                    <button
                      onClick={() => {
                        handleNav('perfil');
                        setAvatarOpen(false);
                      }}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        padding: '10px 12px',
                        border: 'none',
                        borderRadius: 10,
                        background: 'transparent',
                        color: 'var(--text)',
                        fontSize: 14,
                        fontWeight: 500,
                        cursor: 'pointer',
                        fontFamily: "'DM Sans', sans-serif",
                        transition: 'background 0.15s ease',
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLButtonElement).style.background =
                          'color-mix(in srgb, var(--text-muted) 6%, transparent)';
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                      }}
                    >
                      <User size={16} style={{ color: 'var(--text-muted)' }} />
                      Mi perfil
                    </button>

                    <button
                      onClick={() => setAvatarOpen(false)}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        padding: '10px 12px',
                        border: 'none',
                        borderRadius: 10,
                        background: 'transparent',
                        color: 'var(--text)',
                        fontSize: 14,
                        fontWeight: 500,
                        cursor: 'pointer',
                        fontFamily: "'DM Sans', sans-serif",
                        transition: 'background 0.15s ease',
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLButtonElement).style.background =
                          'color-mix(in srgb, var(--text-muted) 6%, transparent)';
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                      }}
                    >
                      <Settings size={16} style={{ color: 'var(--text-muted)' }} />
                      Configuración
                    </button>

                    <div
                      style={{
                        height: 1,
                        background: 'var(--border)',
                        margin: '4px 0',
                      }}
                    />

                    <button
                      onClick={() => {
                        setAvatarOpen(false);
                        onLogout();
                      }}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        padding: '10px 12px',
                        border: 'none',
                        borderRadius: 10,
                        background: 'transparent',
                        color: 'var(--peligro)',
                        fontSize: 14,
                        fontWeight: 500,
                        cursor: 'pointer',
                        fontFamily: "'DM Sans', sans-serif",
                        transition: 'background 0.15s ease',
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLButtonElement).style.background =
                          'color-mix(in srgb, var(--peligro) 6%, transparent)';
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                      }}
                    >
                      <LogOut size={16} />
                      Cerrar sesión
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      {/* ─── CONTENT AREA ─── */}
      <main
        style={{
          flex: 1,
          paddingTop: 60,
          paddingBottom: 'calc(64px + env(safe-area-inset-bottom, 0px))',
          minHeight: '100vh',
          transition: 'padding 0.3s ease',
        }}
        className="lf-client-content-padded"
      >
        <div
          style={{
            maxWidth: 960,
            margin: '0 auto',
            paddingLeft: 16,
            paddingRight: 16,
            paddingTop: 20,
            paddingBottom: 20,
          }}
          className="lf-client-inner-pad"
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={clientActiveModule}
              initial={{ opacity: 0 }}
              animate={{ opacity: clientModuleFade ? 0 : 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2, ease: 'easeInOut' }}
            >
              {renderModule()}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* ─── BOTTOM NAV (mobile) ─── */}
      <nav
        className="lf-client-bottom-nav"
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          height: 64,
          zIndex: 50,
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-around',
          background: 'color-mix(in srgb, var(--surface) 85%, transparent)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderTop: '1px solid var(--border)',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
          transition: 'background-color 0.3s ease, border-color 0.3s ease',
        }}
      >
        {NAV_ITEMS.map((item) => {
          const isActive = clientActiveModule === item.key;
          const isEnviar = item.key === 'solicitar';

          if (isEnviar) {
            return (
              <button
                key={item.key}
                onClick={() => handleNav(item.key)}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 2,
                  border: 'none',
                  cursor: 'pointer',
                  background: isActive ? 'var(--primario)' : 'var(--primario)',
                  color: '#FFFFFF',
                  borderRadius: 16,
                  padding: '10px 20px',
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 11,
                  fontWeight: 600,
                  transform: 'translateY(-8px)',
                  boxShadow: 'var(--shadow-primario)',
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                  position: 'relative',
                  zIndex: 2,
                }}
              >
                <PlusCircle size={22} />
                <span>Enviar</span>
              </button>
            );
          }

          return (
            <button
              key={item.key}
              onClick={() => handleNav(item.key)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 2,
                border: 'none',
                cursor: 'pointer',
                background: 'transparent',
                color: isActive ? 'var(--primario)' : 'var(--text-muted)',
                padding: '8px 16px',
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 11,
                fontWeight: isActive ? 600 : 500,
                transition: 'color 0.2s ease',
                position: 'relative',
                flex: 1,
                maxWidth: 80,
              }}
            >
              {item.icon}
              <span>{item.label}</span>
              {isActive && (
                <motion.div
                  layoutId="client-nav-dot"
                  style={{
                    position: 'absolute',
                    bottom: 2,
                    width: 4,
                    height: 4,
                    borderRadius: '50%',
                    background: 'var(--primario)',
                  }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              )}
            </button>
          );
        })}
      </nav>

      {/* ─── RESPONSIVE STYLES ─── */}
      <style>{`
        /* Desktop nav: hidden by default, shown at >1024px */
        .lf-desktop-nav {
          display: none !important;
        }
        @media (min-width: 1024px) {
          .lf-desktop-nav {
            display: flex !important;
          }
          /* Hide bottom nav on desktop */
          .lf-client-bottom-nav {
            display: none !important;
          }
          /* Remove bottom padding on desktop */
          .lf-client-content-padded {
            padding-bottom: 0 !important;
          }
          /* Wider horizontal padding on desktop */
          .lf-client-inner-pad {
            padding-left: 32px !important;
            padding-right: 32px !important;
          }
        }

        /* Notification list custom scrollbar */
        .lf-client-bottom-nav {
          -webkit-overflow-scrolling: touch;
        }
      `}</style>
    </div>
  );
}
