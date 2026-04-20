'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Check, WarningCircle, Info, X } from '@phosphor-icons/react';
import { Toast, ToastVariant } from '@/hooks/useToasts';

interface ToastStackProps {
  toasts: Toast[];
  onDismiss: (id: string) => void;
}

const VARIANT_STYLES: Record<ToastVariant, { icon: typeof Check; accent: string }> = {
  success: { icon: Check, accent: 'var(--mark-keep-stroke)' },
  error: { icon: WarningCircle, accent: 'var(--mark-remove-stroke)' },
  info: { icon: Info, accent: 'var(--text-secondary)' },
};

export default function ToastStack({ toasts, onDismiss }: ToastStackProps) {
  return (
    <div
      style={{
        position: 'fixed',
        top: 'calc(var(--space-2) + var(--nav-height) + var(--space-3))',
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-2)',
        zIndex: 100,
        pointerEvents: 'none',
      }}
    >
      <AnimatePresence>
        {toasts.map((toast) => {
          const { icon: Icon, accent } = VARIANT_STYLES[toast.variant];
          return (
            <motion.div
              key={toast.id}
              layout
              initial={{ opacity: 0, y: -12, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.96 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-2)',
                padding: 'var(--space-2) var(--space-3)',
                paddingRight: 'var(--space-2)',
                background: 'var(--bg-float)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-full)',
                boxShadow: 'var(--shadow-md)',
                minWidth: 260,
                maxWidth: 420,
                pointerEvents: 'auto',
                fontFamily: 'var(--font-sans)',
              }}
            >
              <div
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: 'var(--radius-full)',
                  background: accent,
                  color: 'var(--text-inverse)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Icon size={12} weight="bold" />
              </div>
              <span
                style={{
                  flex: 1,
                  fontSize: 'var(--text-sm)',
                  color: 'var(--text-primary)',
                  letterSpacing: '-0.005em',
                }}
              >
                {toast.message}
              </span>
              <button
                onClick={() => onDismiss(toast.id)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  padding: 4,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--text-tertiary)',
                  cursor: 'pointer',
                  flexShrink: 0,
                }}
                aria-label="Dismiss"
              >
                <X size={12} weight="regular" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
