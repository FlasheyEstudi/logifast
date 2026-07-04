'use client';

import React from 'react';

interface SettingRowProps {
  icon?: React.ReactNode;
  label: string;
  desc?: string;
  trailing?: React.ReactNode;
  onClick?: () => void;
  danger?: boolean;
}

export default function SettingRow({
  icon,
  label,
  desc,
  trailing,
  onClick,
  danger
}: SettingRowProps) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 py-3.5 border-b border-[var(--md-outline-variant)] text-left bg-transparent border-0 cursor-pointer outline-none transition-all ${
        danger ? 'text-[var(--lf-error, #FF1744)] hover:bg-[rgba(255,23,68,0.05)]' : 'text-[var(--text)] hover:bg-[var(--md-surface-variant)]'
      }`}
      style={{
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      {icon && (
        <div
          className={`flex items-center justify-center w-9 h-9 rounded-xl flex-shrink-0 ${
            danger
              ? 'bg-[rgba(255,23,68,0.1)] text-[var(--lf-error, #FF1744)]'
              : 'bg-[var(--md-surface-variant)] text-[var(--text-secondary)]'
          }`}
        >
          {icon}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className={`text-sm font-semibold ${danger ? 'text-[var(--lf-error, #FF1744)]' : 'text-[var(--text)]'}`}>
          {label}
        </div>
        {desc && <div className="text-xs text-[var(--text-muted)] mt-0.5">{desc}</div>}
      </div>
      {trailing && <div className="flex-shrink-0 text-[var(--text-muted)]">{trailing}</div>}
    </button>
  );
}
