'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';

interface AnnotationPopoverProps {
  initialText: string | null;
  position: { x: number; y: number };
  onSave: (text: string) => void;
  onCancel: () => void;
}

export default function AnnotationPopover({ initialText, position, onSave, onCancel }: AnnotationPopoverProps) {
  const [text, setText] = useState(initialText || '');

  return (
    <motion.div
      initial={{ opacity: 0, y: 6, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 4, scale: 0.97 }}
      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
      style={{
        position: 'absolute',
        left: Math.min(position.x, window.innerWidth - 320),
        top: position.y + 12,
        minWidth: 220,
        maxWidth: 280,
        background: 'var(--bg-elevated)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-lg)',
        padding: 'var(--space-3)',
        zIndex: 100,
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
      }}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <textarea
        autoFocus
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="What should change?"
        rows={2}
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 'var(--text-xs)',
          background: 'var(--bg-surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-sm)',
          color: 'var(--text-primary)',
          resize: 'none',
          width: '100%',
          padding: 'var(--space-2) var(--space-3)',
          lineHeight: 1.5,
          outline: 'none',
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            onSave(text);
          }
          if (e.key === 'Escape') onCancel();
        }}
      />
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)', marginTop: 'var(--space-2)' }}>
        <motion.button
          onClick={onCancel}
          whileTap={{ scale: 0.96 }}
          style={{
            padding: 'var(--space-1) var(--space-3)',
            fontSize: 'var(--text-xs)',
            fontWeight: 'var(--weight-medium)',
            color: 'var(--text-tertiary)',
            background: 'transparent',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-sm)',
            cursor: 'pointer',
            fontFamily: 'var(--font-sans)',
          }}
        >
          Cancel
        </motion.button>
        <motion.button
          onClick={() => onSave(text)}
          whileTap={{ scale: 0.96 }}
          style={{
            padding: 'var(--space-1) var(--space-3)',
            fontSize: 'var(--text-xs)',
            fontWeight: 'var(--weight-medium)',
            color: 'var(--text-inverse)',
            background: 'var(--text-primary)',
            border: 'none',
            borderRadius: 'var(--radius-sm)',
            cursor: 'pointer',
            fontFamily: 'var(--font-sans)',
            boxShadow: 'var(--shadow-xs)',
          }}
        >
          Save
        </motion.button>
      </div>
    </motion.div>
  );
}
