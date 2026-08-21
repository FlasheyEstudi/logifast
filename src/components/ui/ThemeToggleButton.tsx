'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sun, Moon } from '@/components/icons';
import { toggleThemeWithTransition } from '@/lib/theme-transition';

interface ThemeToggleButtonProps {
  isDark: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'pill' | 'circle' | 'ghost';
  showLabel?: boolean;
}

export function ThemeToggleButton({
  isDark,
  className = '',
  size = 'md',
  variant = 'circle',
  showLabel = false,
}: ThemeToggleButtonProps) {
  const iconSize = size === 'sm' ? 16 : size === 'lg' ? 22 : 18;
  const buttonPadding = size === 'sm' ? '6px 10px' : size === 'lg' ? '12px 18px' : '8px 12px';
  const circleDimension = size === 'sm' ? 32 : size === 'lg' ? 44 : 38;

  const handleClick = (e: React.MouseEvent) => {
    toggleThemeWithTransition(e);
  };

  if (variant === 'circle') {
    return (
      <motion.button
        type="button"
        aria-label={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
        title={isDark ? 'Modo Claro' : 'Modo Oscuro'}
        onClick={handleClick}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.92 }}
        style={{
          width: circleDimension,
          height: circleDimension,
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
          border: isDark ? '1px solid rgba(255, 255, 255, 0.15)' : '1px solid rgba(0, 0, 0, 0.08)',
          color: isDark ? '#FFD60A' : '#FF9500',
          cursor: 'pointer',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: isDark
            ? '0 0 16px rgba(255, 214, 10, 0.15)'
            : '0 0 16px rgba(255, 149, 0, 0.12)',
        }}
        className={className}
      >
        <AnimatePresence mode="wait" initial={false}>
          {isDark ? (
            <motion.div
              key="moon"
              initial={{ rotate: -90, scale: 0.4, opacity: 0 }}
              animate={{ rotate: 0, scale: 1, opacity: 1 }}
              exit={{ rotate: 90, scale: 0.4, opacity: 0 }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <Moon size={iconSize} style={{ color: '#FFD60A' }} />
            </motion.div>
          ) : (
            <motion.div
              key="sun"
              initial={{ rotate: 90, scale: 0.4, opacity: 0 }}
              animate={{ rotate: 0, scale: 1, opacity: 1 }}
              exit={{ rotate: -90, scale: 0.4, opacity: 0 }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <Sun size={iconSize} style={{ color: '#FF9500' }} />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>
    );
  }

  // Variant pill / with label
  return (
    <motion.button
      type="button"
      aria-label={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
      onClick={handleClick}
      whileHover={{ scale: 1.04 }}
      whileTap={{ scale: 0.95 }}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        padding: buttonPadding,
        borderRadius: 100,
        background: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
        border: isDark ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid rgba(0, 0, 0, 0.08)',
        color: 'var(--text)',
        fontSize: 13,
        fontWeight: 600,
        fontFamily: "'DM Sans', sans-serif",
        cursor: 'pointer',
        boxShadow: isDark
          ? '0 2px 10px rgba(0, 0, 0, 0.3)'
          : '0 2px 10px rgba(0, 0, 0, 0.04)',
      }}
      className={className}
    >
      <AnimatePresence mode="wait" initial={false}>
        {isDark ? (
          <motion.span
            key="moon-icon"
            initial={{ rotate: -90, scale: 0.5, opacity: 0 }}
            animate={{ rotate: 0, scale: 1, opacity: 1 }}
            exit={{ rotate: 90, scale: 0.5, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            style={{ display: 'flex', alignItems: 'center' }}
          >
            <Moon size={iconSize} style={{ color: '#FFD60A' }} />
          </motion.span>
        ) : (
          <motion.span
            key="sun-icon"
            initial={{ rotate: 90, scale: 0.5, opacity: 0 }}
            animate={{ rotate: 0, scale: 1, opacity: 1 }}
            exit={{ rotate: -90, scale: 0.5, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            style={{ display: 'flex', alignItems: 'center' }}
          >
            <Sun size={iconSize} style={{ color: '#FF9500' }} />
          </motion.span>
        )}
      </AnimatePresence>

      {showLabel && (
        <span>{isDark ? 'Modo Oscuro' : 'Modo Claro'}</span>
      )}
    </motion.button>
  );
}

export default ThemeToggleButton;
