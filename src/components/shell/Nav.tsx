'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Sun, Moon, CaretLeft } from '@phosphor-icons/react';

interface NavProps {
  roundLabel: string;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  showBack: boolean;
  onBack: () => void;
}

export default function Nav({ roundLabel, theme, onToggleTheme, showBack, onBack }: NavProps) {
  return (
    <nav
      style={{
        height: 'var(--nav-height)',
        background: 'var(--nav-bg)',
        border: '1px solid var(--nav-border)',
        borderRadius: 'var(--radius-lg)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 var(--space-5)',
        position: 'relative',
        zIndex: 40,
        flexShrink: 0,
      }}
    >
      {/* Left: logo + back */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', minWidth: 120 }}>
        <AnimatePresence>
          {showBack && (
            <motion.button
              key="back"
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.2 }}
              onClick={onBack}
              whileHover={{ x: -2 }}
              whileTap={{ scale: 0.92 }}
              style={{
                width: 28,
                height: 28,
                borderRadius: 'var(--radius-full)',
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                boxShadow: 'var(--shadow-xs)',
                flexShrink: 0,
              }}
              title="Back"
            >
              <CaretLeft size={14} weight="bold" />
            </motion.button>
          )}
        </AnimatePresence>

        <img
          src={theme === 'dark' ? '/assets/forma-lockup-white.svg' : '/assets/forma-lockup-black.svg'}
          alt="forma"
          style={{ height: 26 }}
        />
      </div>

      {/* Center: round label */}
      <AnimatePresence mode="wait">
        <motion.span
          key={roundLabel}
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 4 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          style={{
            position: 'absolute',
            left: '50%',
            transform: 'translateX(-50%)',
            fontSize: 'var(--text-sm)',
            fontWeight: 'var(--weight-medium)',
            color: 'var(--text-secondary)',
            letterSpacing: '-0.01em',
          }}
        >
          {roundLabel}
        </motion.span>
      </AnimatePresence>

      {/* Right: theme toggle */}
      <div style={{ minWidth: 120, display: 'flex', justifyContent: 'flex-end' }}>
        <motion.button
          onClick={onToggleTheme}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.92 }}
          style={{
            width: 32,
            height: 32,
            borderRadius: 'var(--radius-full)',
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            boxShadow: 'var(--shadow-xs)',
          }}
          title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
        >
          <AnimatePresence mode="wait">
            <motion.span
              key={theme}
              initial={{ opacity: 0, rotate: -30, scale: 0.8 }}
              animate={{ opacity: 1, rotate: 0, scale: 1 }}
              exit={{ opacity: 0, rotate: 30, scale: 0.8 }}
              transition={{ duration: 0.2 }}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              {theme === 'light' ? <Sun size={16} weight="regular" /> : <Moon size={16} weight="regular" />}
            </motion.span>
          </AnimatePresence>
        </motion.button>
      </div>
    </nav>
  );
}
