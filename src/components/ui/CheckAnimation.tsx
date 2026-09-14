'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface CheckAnimationProps {
  size?: number;
  className?: string;
}

export function CheckAnimation({ size = 80, className = '' }: CheckAnimationProps) {
  return (
    <div
      className={`relative flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
      aria-label="Confirmación exitosa"
    >
      <svg viewBox="0 0 80 80" className="w-full h-full overflow-visible">
        <motion.circle
          cx="40"
          cy="40"
          r="36"
          fill="none"
          stroke="#10B981"
          strokeWidth="3.5"
          strokeLinecap="round"
          initial={{ pathLength: 0, rotate: -90 }}
          animate={{ pathLength: 1, rotate: 0 }}
          transition={{ duration: 0.55, ease: 'easeInOut' }}
        />
        <motion.path
          d="M24 42 L34 52 L56 30"
          fill="none"
          stroke="#10B981"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.35, delay: 0.45, ease: 'easeOut' }}
        />
      </svg>
    </div>
  );
}

export default CheckAnimation;
