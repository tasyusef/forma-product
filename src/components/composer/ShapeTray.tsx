'use client';

import { motion } from 'framer-motion';
import { Rectangle, Circle, Person, Path, Pencil } from '@phosphor-icons/react';

type ShapeType = 'rect' | 'ellipse' | 'figure' | 'freeform';

interface ShapeTrayProps {
  activeDrawMode: boolean;
  onAddShape: (type: ShapeType) => void;
  onToggleDraw: () => void;
}

const shapes: { type: ShapeType; icon: typeof Rectangle; label: string }[] = [
  { type: 'rect', icon: Rectangle, label: 'Rect' },
  { type: 'ellipse', icon: Circle, label: 'Ellipse' },
  { type: 'figure', icon: Person, label: 'Figure' },
  { type: 'freeform', icon: Path, label: 'Freeform' },
];

export default function ShapeTray({ activeDrawMode, onAddShape, onToggleDraw }: ShapeTrayProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      style={{
        width: 'var(--panel-width)',
        height: '100%',
        background: 'var(--panel-bg)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--panel-radius)',
        boxShadow: 'var(--shadow-panel)',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: 'var(--space-4) var(--space-4) var(--space-3)',
          borderBottom: '1px solid var(--border-subtle)',
        }}
      >
        <span
          style={{
            fontSize: 'var(--text-xs)',
            fontWeight: 'var(--weight-semibold)',
            color: 'var(--text-secondary)',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
          }}
        >
          Tools
        </span>
      </div>

      {/* Tool grid */}
      <div style={{ padding: 'var(--space-3) var(--space-3)', display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
        {shapes.map(({ type, icon: Icon, label }) => (
          <motion.button
            key={type}
            onClick={() => onAddShape(type)}
            whileHover={{ backgroundColor: 'var(--bg-hover)', x: 2 }}
            whileTap={{ scale: 0.97 }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-3)',
              padding: 'var(--space-2) var(--space-3)',
              background: 'transparent',
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text-secondary)',
              fontSize: 'var(--text-sm)',
              fontWeight: 'var(--weight-regular)',
              cursor: 'pointer',
              fontFamily: 'var(--font-sans)',
              width: '100%',
              textAlign: 'left',
            }}
          >
            <Icon size={16} weight="regular" />
            <span>{label}</span>
          </motion.button>
        ))}

        {/* Divider */}
        <div style={{ height: 1, background: 'var(--border-subtle)', margin: 'var(--space-2) 0' }} />

        {/* Draw mode */}
        <motion.button
          onClick={onToggleDraw}
          whileHover={{ backgroundColor: activeDrawMode ? undefined : 'var(--bg-hover)', x: 2 }}
          whileTap={{ scale: 0.97 }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-3)',
            padding: 'var(--space-2) var(--space-3)',
            background: activeDrawMode ? 'var(--bg-active)' : 'transparent',
            border: 'none',
            borderRadius: 'var(--radius-sm)',
            color: activeDrawMode ? 'var(--text-primary)' : 'var(--text-secondary)',
            fontSize: 'var(--text-sm)',
            fontWeight: activeDrawMode ? 'var(--weight-medium)' : 'var(--weight-regular)',
            cursor: 'pointer',
            fontFamily: 'var(--font-sans)',
            width: '100%',
            textAlign: 'left',
            boxShadow: activeDrawMode ? 'var(--shadow-xs)' : 'none',
          }}
        >
          <Pencil size={16} weight="regular" />
          <span>Draw</span>
        </motion.button>
      </div>
    </motion.div>
  );
}
