'use client';

import { motion, Reorder } from 'framer-motion';
import { Rectangle, Circle, Person, Path, Pencil, DotsSixVertical, Trash } from '@phosphor-icons/react';
import { SketchShape, Point } from '@/lib/types';

interface LayerPanelProps {
  shapes: SketchShape[];
  freehandPaths: Point[][];
  onReorderShapes: (shapes: SketchShape[]) => void;
  onDeleteShape: (id: string) => void;
  onDeleteFreehand: (index: number) => void;
}

const SHAPE_ICONS: Record<string, typeof Rectangle> = {
  rect: Rectangle,
  ellipse: Circle,
  figure: Person,
  freeform: Path,
};

export default function LayerPanel({
  shapes,
  freehandPaths,
  onReorderShapes,
  onDeleteShape,
  onDeleteFreehand,
}: LayerPanelProps) {
  const handleReorder = (newOrder: SketchShape[]) => {
    onReorderShapes(newOrder);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
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
          Layers
        </span>
      </div>

      {/* Layer list */}
      <div
        className="panel-scroll"
        style={{ flex: 1, overflowY: 'auto', padding: 'var(--space-2)' }}
      >
        {shapes.length === 0 && freehandPaths.length === 0 && (
          <div
            style={{
              padding: 'var(--space-8) var(--space-4)',
              textAlign: 'center',
              color: 'var(--text-tertiary)',
              fontSize: 'var(--text-xs)',
              fontStyle: 'italic',
            }}
          >
            Add shapes or draw to create layers
          </div>
        )}

        <Reorder.Group
          axis="y"
          values={shapes}
          onReorder={handleReorder}
          style={{ listStyle: 'none', padding: 0, margin: 0 }}
        >
          {shapes.map((shape) => {
            const Icon = SHAPE_ICONS[shape.type] || Rectangle;
            return (
              <Reorder.Item
                key={shape.id}
                value={shape}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-2)',
                  padding: 'var(--space-2) var(--space-2)',
                  borderRadius: 'var(--radius-sm)',
                  cursor: 'grab',
                  marginBottom: 2,
                }}
                whileHover={{ backgroundColor: 'var(--bg-hover)' }}
                whileDrag={{
                  scale: 1.02,
                  boxShadow: 'var(--shadow-md)',
                  backgroundColor: 'var(--bg-elevated)',
                  cursor: 'grabbing',
                }}
              >
                <DotsSixVertical size={12} weight="regular" style={{ color: 'var(--text-tertiary)', flexShrink: 0 }} />
                <Icon size={14} weight="regular" style={{ color: 'var(--text-secondary)', flexShrink: 0 }} />
                <span
                  style={{
                    fontSize: 'var(--text-xs)',
                    color: 'var(--text-primary)',
                    flex: 1,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {shape.label || shape.type.charAt(0).toUpperCase() + shape.type.slice(1)}
                </span>
                <motion.button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteShape(shape.id);
                  }}
                  whileHover={{ scale: 1.1, color: '#EF4444' }}
                  whileTap={{ scale: 0.9 }}
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: 2,
                    cursor: 'pointer',
                    color: 'var(--text-tertiary)',
                    display: 'flex',
                    flexShrink: 0,
                  }}
                >
                  <Trash size={12} weight="regular" />
                </motion.button>
              </Reorder.Item>
            );
          })}
        </Reorder.Group>

        {/* Freehand paths */}
        {freehandPaths.map((_, i) => (
          <motion.div
            key={`freehand-${i}`}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-2)',
              padding: 'var(--space-2) var(--space-2)',
              borderRadius: 'var(--radius-sm)',
              marginBottom: 2,
            }}
          >
            <div style={{ width: 12, flexShrink: 0 }} />
            <Pencil size={14} weight="regular" style={{ color: 'var(--text-secondary)', flexShrink: 0 }} />
            <span
              style={{
                fontSize: 'var(--text-xs)',
                color: 'var(--text-primary)',
                flex: 1,
              }}
            >
              Drawing {i + 1}
            </span>
            <motion.button
              onClick={() => onDeleteFreehand(i)}
              whileHover={{ scale: 1.1, color: '#EF4444' }}
              whileTap={{ scale: 0.9 }}
              style={{
                background: 'none',
                border: 'none',
                padding: 2,
                cursor: 'pointer',
                color: 'var(--text-tertiary)',
                display: 'flex',
                flexShrink: 0,
              }}
            >
              <Trash size={12} weight="regular" />
            </motion.button>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
