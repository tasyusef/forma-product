'use client';

import { motion } from 'framer-motion';

interface GenerationLoaderProps {
  theme: 'light' | 'dark';
}

export default function GenerationLoader({ theme }: GenerationLoaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 'var(--space-5)',
        minHeight: 0,
      }}
    >
      <motion.img
        src={theme === 'dark' ? '/assets/forma-mark-white.svg' : '/assets/forma-mark-black.svg'}
        alt="Loading"
        animate={{ rotate: 360 }}
        transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
        style={{ width: 28, height: 28, opacity: 0.3 }}
      />
      <motion.span
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.4 }}
        style={{
          fontSize: 'var(--text-xs)',
          color: 'var(--text-tertiary)',
          letterSpacing: '0.04em',
        }}
      >
        Generating...
      </motion.span>
    </motion.div>
  );
}
