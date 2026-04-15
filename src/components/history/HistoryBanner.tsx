'use client';

import { motion } from 'framer-motion';
import { ArrowLeft } from '@phosphor-icons/react';

interface HistoryBannerProps {
  currentRoundIndex: number;
  viewingRoundIndex: number;
  onBackToCurrent: () => void;
}

export default function HistoryBanner({ currentRoundIndex, viewingRoundIndex, onBackToCurrent }: HistoryBannerProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      style={{
        position: 'absolute',
        top: 'var(--space-4)',
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-4)',
        padding: 'var(--space-2) var(--space-4)',
        background: 'var(--overlay)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-lg)',
        zIndex: 50,
        whiteSpace: 'nowrap',
      }}
    >
      <motion.button
        onClick={onBackToCurrent}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.97 }}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-2)',
          padding: '0 var(--space-3)',
          height: 'var(--btn-height-sm)',
          background: 'transparent',
          color: 'var(--text-secondary)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-sm)',
          fontSize: 'var(--text-xs)',
          fontWeight: 'var(--weight-medium)',
          cursor: 'pointer',
          fontFamily: 'var(--font-sans)',
        }}
      >
        <ArrowLeft size={14} weight="regular" />
        Back to Round {currentRoundIndex}
      </motion.button>

      <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>
        Viewing: Round {viewingRoundIndex}
      </span>
    </motion.div>
  );
}
