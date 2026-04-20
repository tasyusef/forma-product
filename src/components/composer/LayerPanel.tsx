'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { motion, Reorder } from 'framer-motion';
import { Rectangle, Circle, Person, Path, Pencil, DotsSixVertical, Trash, StackSimple } from '@phosphor-icons/react';
import { SketchShape, ShapeType } from '@/lib/types';

function LayerPromptEditor({
  shape,
  onUpdate,
}: {
  shape: SketchShape;
  onUpdate: (patch: Partial<SketchShape>) => void;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    // Autofocus the prompt field when the editor appears.
    if (textareaRef.current && !shape.prompt) textareaRef.current.focus();
  }, [shape.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const placeholder =
    shape.type === 'group'
      ? 'Merged prompt — describes the combined region'
      : shape.type === 'stroke'
        ? 'What does this stroke represent?'
        : 'What does this region represent?';

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
      onPointerDownCapture={(e) => e.stopPropagation()}
      style={{
        padding: '0 var(--space-2) var(--space-2)',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-2)',
        cursor: 'default',
      }}
    >
      <input
        type="text"
        value={shape.label}
        placeholder="Label (e.g. sky, subject, foreground)"
        onChange={(e) => onUpdate({ label: e.target.value })}
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          background: 'var(--bg-base)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-sm)',
          padding: 'var(--space-1) var(--space-2)',
          fontSize: 'var(--text-xs)',
          color: 'var(--text-primary)',
          fontFamily: 'var(--font-sans)',
          outline: 'none',
        }}
      />
      <textarea
        ref={textareaRef}
        value={shape.prompt || ''}
        placeholder={placeholder}
        onChange={(e) => onUpdate({ prompt: e.target.value })}
        onClick={(e) => e.stopPropagation()}
        rows={3}
        style={{
          width: '100%',
          background: 'var(--bg-base)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-sm)',
          padding: 'var(--space-1) var(--space-2)',
          fontSize: 'var(--text-xs)',
          fontFamily: 'var(--font-mono)',
          color: 'var(--text-primary)',
          resize: 'vertical',
          minHeight: 54,
          maxHeight: 160,
          overflowY: 'auto',
          outline: 'none',
          lineHeight: 1.45,
        }}
      />
    </motion.div>
  );
}

interface LayerPanelProps {
  shapes: SketchShape[];
  selectedIds: string[];
  onReorderShapes: (shapes: SketchShape[]) => void;
  onDeleteShape: (id: string) => void;
  onUpdateShape: (id: string, patch: Partial<SketchShape>) => void;
  onSetSelectedIds: (ids: string[]) => void;
  onCombineShapes?: (ids: string[]) => void;
}

const SHAPE_ICONS: Record<ShapeType, typeof Rectangle> = {
  rect: Rectangle,
  ellipse: Circle,
  figure: Person,
  freeform: Path,
  stroke: Pencil,
  group: StackSimple,
};

const DEFAULT_LABELS: Record<ShapeType, string> = {
  rect: 'Rectangle',
  ellipse: 'Ellipse',
  figure: 'Figure',
  freeform: 'Freeform',
  stroke: 'Stroke',
  group: 'Group',
};

export default function LayerPanel({
  shapes,
  selectedIds,
  onReorderShapes,
  onDeleteShape,
  onUpdateShape,
  onSetSelectedIds,
  onCombineShapes,
}: LayerPanelProps) {
  // Panel displays topmost z-order at top. Shapes array: first = bottom, last = top.
  const displayShapes = useMemo(() => [...shapes].reverse(), [shapes]);

  const [lastClickedId, setLastClickedId] = useState<string | null>(null);
  const pointerDownModifiers = useMemo(
    () => ({ shift: false, meta: false, ctrl: false }),
    []
  );

  const validSelectedIds = useMemo(
    () => selectedIds.filter((id) => shapes.some((s) => s.id === id)),
    [selectedIds, shapes]
  );

  const handleReorder = (newDisplayOrder: SketchShape[]) => {
    onReorderShapes([...newDisplayOrder].reverse());
  };

  const handleRowSelect = (id: string) => {
    const { shift, meta, ctrl } = pointerDownModifiers;
    if (shift && lastClickedId && lastClickedId !== id) {
      const ids = displayShapes.map((s) => s.id);
      const a = ids.indexOf(lastClickedId);
      const b = ids.indexOf(id);
      if (a !== -1 && b !== -1) {
        const [lo, hi] = a < b ? [a, b] : [b, a];
        const range = ids.slice(lo, hi + 1);
        const set = new Set(selectedIds);
        range.forEach((r) => set.add(r));
        onSetSelectedIds(Array.from(set));
        return;
      }
    }
    if (shift || meta || ctrl) {
      onSetSelectedIds(
        selectedIds.includes(id) ? selectedIds.filter((x) => x !== id) : [...selectedIds, id]
      );
      setLastClickedId(id);
      return;
    }
    onSetSelectedIds(selectedIds.length === 1 && selectedIds[0] === id ? [] : [id]);
    setLastClickedId(id);
  };

  const handleCombine = () => {
    if (!onCombineShapes) return;
    if (validSelectedIds.length < 2) return;
    onCombineShapes(validSelectedIds);
    onSetSelectedIds([]);
    setLastClickedId(null);
  };

  const clearSelection = () => {
    onSetSelectedIds([]);
    setLastClickedId(null);
  };

  const canCombine = validSelectedIds.length >= 2;

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
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 'var(--space-2)',
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
        {validSelectedIds.length > 0 && (
          <span
            style={{
              fontSize: 10,
              color: 'var(--text-tertiary)',
              fontFamily: 'var(--font-mono)',
            }}
          >
            {validSelectedIds.length} selected
          </span>
        )}
      </div>

      {/* Selection action bar */}
      {validSelectedIds.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            display: 'flex',
            gap: 'var(--space-1)',
            padding: 'var(--space-2) var(--space-3)',
            borderBottom: '1px solid var(--border-subtle)',
            background: 'var(--bg-hover)',
          }}
        >
          <motion.button
            onClick={handleCombine}
            disabled={!canCombine}
            whileHover={canCombine ? { scale: 1.02 } : undefined}
            whileTap={canCombine ? { scale: 0.97 } : undefined}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 'var(--space-2)',
              padding: 'var(--space-1) var(--space-2)',
              height: 26,
              background: canCombine ? 'var(--text-primary)' : 'var(--bg-elevated)',
              color: canCombine ? 'var(--text-inverse)' : 'var(--text-disabled)',
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              fontSize: 11,
              fontWeight: 'var(--weight-medium)',
              cursor: canCombine ? 'pointer' : 'not-allowed',
              fontFamily: 'var(--font-sans)',
            }}
            title={canCombine ? 'Combine into a single layer' : 'Select 2+ layers'}
          >
            <StackSimple size={12} weight="regular" />
            Combine
          </motion.button>
          <motion.button
            onClick={clearSelection}
            whileTap={{ scale: 0.97 }}
            style={{
              padding: '0 var(--space-2)',
              height: 26,
              background: 'transparent',
              color: 'var(--text-secondary)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)',
              fontSize: 11,
              cursor: 'pointer',
              fontFamily: 'var(--font-sans)',
            }}
            title="Clear selection"
          >
            Clear
          </motion.button>
        </motion.div>
      )}

      {/* Layer list */}
      <div
        className="panel-scroll"
        style={{ flex: 1, overflowY: 'auto', padding: 'var(--space-2)' }}
      >
        {shapes.length === 0 && (
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
          values={displayShapes}
          onReorder={handleReorder}
          style={{ listStyle: 'none', padding: 0, margin: 0 }}
        >
          {displayShapes.map((shape) => {
            const Icon = SHAPE_ICONS[shape.type] || Rectangle;
            const isSelected = validSelectedIds.includes(shape.id);
            const isSoleSelection = validSelectedIds.length === 1 && isSelected;
            const hasPrompt = Boolean(shape.prompt && shape.prompt.trim().length > 0);
            const displayLabel = shape.label || DEFAULT_LABELS[shape.type] || shape.type;
            return (
              <Reorder.Item
                key={shape.id}
                value={shape}
                onPointerDownCapture={(e) => {
                  pointerDownModifiers.shift = e.shiftKey;
                  pointerDownModifiers.meta = e.metaKey;
                  pointerDownModifiers.ctrl = e.ctrlKey;
                }}
                style={{
                  display: 'block',
                  padding: 0,
                  borderRadius: 'var(--radius-sm)',
                  marginBottom: 2,
                  background: isSelected ? 'var(--bg-active)' : 'transparent',
                  boxShadow: isSelected ? 'inset 0 0 0 1px var(--border-strong)' : 'none',
                  overflow: 'hidden',
                }}
                whileDrag={{
                  scale: 1.02,
                  boxShadow: 'var(--shadow-md)',
                  backgroundColor: 'var(--bg-elevated)',
                  cursor: 'grabbing',
                }}
              >
                {/* Row header */}
                <motion.div
                  onClick={() => handleRowSelect(shape.id)}
                  whileHover={{ backgroundColor: isSelected ? 'var(--bg-active)' : 'var(--bg-hover)' }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--space-2)',
                    padding: 'var(--space-2)',
                    cursor: 'grab',
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
                    {displayLabel}
                  </span>
                  {shape.isMerging ? (
                    <motion.span
                      animate={{ opacity: [0.3, 1, 0.3] }}
                      transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
                      style={{
                        fontSize: 10,
                        color: 'var(--text-tertiary)',
                        fontFamily: 'var(--font-mono)',
                        flexShrink: 0,
                      }}
                    >
                      merging…
                    </motion.span>
                  ) : hasPrompt ? (
                    <span
                      title={shape.prompt}
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: '50%',
                        background: 'var(--text-primary)',
                        flexShrink: 0,
                      }}
                    />
                  ) : null}
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
                </motion.div>

                {/* Prompt editor — visible when this is the sole selection */}
                {isSoleSelection && (
                  <LayerPromptEditor
                    shape={shape}
                    onUpdate={(patch) => onUpdateShape(shape.id, patch)}
                  />
                )}
              </Reorder.Item>
            );
          })}
        </Reorder.Group>
      </div>
    </motion.div>
  );
}
