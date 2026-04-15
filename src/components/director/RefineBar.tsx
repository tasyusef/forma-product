'use client';

import { motion } from 'framer-motion';
import { ArrowCounterClockwise } from '@phosphor-icons/react';

interface RefineBarProps {
  canRefine: boolean;
  onRefine: () => void;
  onRestart: () => void;
}

export default function RefineBar({ canRefine, onRefine, onRestart }: RefineBarProps) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 'var(--space-2) 0',
        flexShrink: 0,
      }}
    >
      <motion.button
        onClick={onRestart}
        whileHover={{ scale: 1.02, x: -1 }}
        whileTap={{ scale: 0.97 }}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-2)',
          padding: '0 var(--space-4)',
          height: 'var(--btn-height-sm)',
          background: 'transparent',
          color: 'var(--text-tertiary)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-md)',
          fontSize: 'var(--text-xs)',
          fontWeight: 'var(--weight-medium)',
          cursor: 'pointer',
          fontFamily: 'var(--font-sans)',
          boxShadow: 'var(--shadow-xs)',
        }}
      >
        <ArrowCounterClockwise size={14} weight="regular" />
        Restart
      </motion.button>

      <motion.button
        onClick={onRefine}
        disabled={!canRefine}
        whileHover={canRefine ? { scale: 1.02, y: -1 } : undefined}
        whileTap={canRefine ? { scale: 0.98 } : undefined}
        style={{
          padding: '0 var(--space-5)',
          height: 'var(--btn-height-md)',
          background: canRefine ? 'var(--text-primary)' : 'var(--bg-hover)',
          color: canRefine ? 'var(--text-inverse)' : 'var(--text-disabled)',
          border: 'none',
          borderRadius: 'var(--radius-md)',
          fontSize: 'var(--text-sm)',
          fontWeight: 'var(--weight-medium)',
          cursor: canRefine ? 'pointer' : 'not-allowed',
          fontFamily: 'var(--font-sans)',
          boxShadow: canRefine ? 'var(--shadow-sm)' : 'none',
        }}
      >
        Refine
      </motion.button>
    </div>
  );
}
