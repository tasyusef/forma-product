'use client';

import { motion } from 'framer-motion';
import { Plus } from '@phosphor-icons/react';

interface RoundThumbnailProps {
  label: string;
  thumbnailUrl: string;
  isActive: boolean;
  onClick: () => void;
}

export default function RoundThumbnail({ label, thumbnailUrl, isActive, onClick }: RoundThumbnailProps) {
  return (
    <motion.button
      onClick={onClick}
      initial={{ opacity: 0, y: 8, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.96 }}
      transition={{ duration: 0.3, ease: [0.34, 1.56, 0.64, 1] }}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 'var(--space-1)',
        background: 'none',
        border: 'none',
        padding: 0,
        cursor: 'pointer',
        flexShrink: 0,
      }}
    >
      <div
        style={{
          width: 64,
          height: 64,
          borderRadius: 'var(--radius-md)',
          border: isActive ? '2px solid var(--text-primary)' : '1.5px solid var(--border)',
          overflow: 'hidden',
          background: 'var(--bg-elevated)',
          boxShadow: isActive ? 'var(--shadow-md)' : 'var(--shadow-xs)',
          transition: 'border-color 150ms, box-shadow 150ms',
        }}
      >
        {thumbnailUrl ? (
          <img
            src={thumbnailUrl}
            alt={label}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <div
            style={{
              width: '100%',
              height: '100%',
              background: 'var(--bg-surface)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <div style={{ width: 24, height: 24, borderRadius: 'var(--radius-xs)', background: 'var(--bg-hover)' }} />
          </div>
        )}
      </div>
      <span
        style={{
          fontSize: 'var(--text-xs)',
          color: isActive ? 'var(--text-primary)' : 'var(--text-tertiary)',
          lineHeight: 1.4,
          fontWeight: isActive ? 'var(--weight-medium)' : 'var(--weight-regular)',
        }}
      >
        {label}
      </span>
    </motion.button>
  );
}

export function NewRoundTile({ onClick }: { onClick: () => void }) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.04 }}
      whileTap={{ scale: 0.96 }}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 'var(--space-1)',
        background: 'none',
        border: 'none',
        padding: 0,
        cursor: 'pointer',
        flexShrink: 0,
      }}
    >
      <div
        style={{
          width: 64,
          height: 64,
          borderRadius: 'var(--radius-md)',
          border: '1.5px dashed var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--text-tertiary)',
        }}
      >
        <Plus size={18} weight="regular" />
      </div>
      <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', lineHeight: 1.4 }}>New</span>
    </motion.button>
  );
}
