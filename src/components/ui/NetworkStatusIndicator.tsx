'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function NetworkStatusIndicator() {
  const [isOnline, setIsOnline] = useState(true);
  const [showReconnected, setShowReconnected] = useState(false);
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
    if (typeof window === 'undefined') return;

    setIsOnline(navigator.onLine);
    let reconnectTimer: NodeJS.Timeout | null = null;

    const handleOnline = () => {
      setIsOnline(true);
      setShowReconnected(true);
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        try { navigator.vibrate(25); } catch {}
      }
      if (reconnectTimer) clearTimeout(reconnectTimer);
      reconnectTimer = setTimeout(() => {
        setShowReconnected(false);
      }, 3200);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowReconnected(false);
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        try { navigator.vibrate([40, 60, 40]); } catch {}
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      if (reconnectTimer) clearTimeout(reconnectTimer);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!hasMounted) return null;

  const showIndicator = !isOnline || showReconnected;

  return (
    <AnimatePresence>
      {showIndicator && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.92 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 16, scale: 0.92 }}
          transition={{ type: 'spring', damping: 24, stiffness: 300 }}
          style={{
            position: 'fixed',
            bottom: 'calc(env(safe-area-inset-bottom, 16px) + 74px)',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 9995,
            pointerEvents: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '8px 16px',
            borderRadius: 100,
            background: !isOnline
              ? 'rgba(239, 68, 68, 0.92)'
              : 'rgba(16, 185, 129, 0.94)',
            color: '#FFFFFF',
            backdropFilter: 'blur(24px) saturate(180%)',
            WebkitBackdropFilter: 'blur(24px) saturate(180%)',
            border: !isOnline
              ? '1px solid rgba(255, 255, 255, 0.3)'
              : '1px solid rgba(255, 255, 255, 0.4)',
            boxShadow: !isOnline
              ? '0 8px 30px rgba(239, 68, 68, 0.45), inset 0 1px 1px rgba(255,255,255,0.4)'
              : '0 8px 30px rgba(16, 185, 129, 0.45), inset 0 1px 1px rgba(255,255,255,0.4)',
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: '-0.01em',
          }}
        >
          {/* Pulsing Dot */}
          <span
            style={{
              width: 7,
              height: 7,
              borderRadius: '50%',
              background: '#FFFFFF',
              boxShadow: '0 0 8px #FFFFFF',
              animation: !isOnline ? 'pulse 1.2s infinite' : 'none',
            }}
          />

          {/* SVG Icon */}
          {!isOnline ? (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="1" y1="1" x2="23" y2="23" />
              <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55" />
              <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39" />
              <path d="M10.71 5.05A16 16 0 0 1 22.58 9" />
              <path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88" />
              <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
              <line x1="12" y1="20" x2="12.01" y2="20" />
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12.55a11 11 0 0 1 14.08 0" />
              <path d="M1.42 9a16 16 0 0 1 21.16 0" />
              <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
              <line x1="12" y1="20" x2="12.01" y2="20" />
            </svg>
          )}

          <span>
            {!isOnline
              ? 'Sin conexión a internet • Reintentando...'
              : 'Conexión restablecida'}
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
