'use client';

import { motion } from 'framer-motion';
import { ArrowClockwise } from '@phosphor-icons/react';

interface InterpretationPanelProps {
  masterPrompt: string;
  isInterpreting: boolean;
  editedByUser: boolean;
  /** True when the sketch is empty — show the placeholder. */
  isEmpty: boolean;
  onEdit: (value: string) => void;
  onRefresh: () => void;
}

export default function InterpretationPanel({
  masterPrompt,
  isInterpreting,
  editedByUser,
  isEmpty,
  onEdit,
  onRefresh,
}: InterpretationPanelProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      style={{
        background: 'var(--bg-elevated)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-md)',
        padding: 'var(--space-3) var(--space-4)',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-2)',
        boxShadow: 'var(--shadow-sm)',
        // Let the panel shrink inside a tight vertical parent so the Generate
        // row below never gets pushed off-screen. Content scrolls internally.
        minHeight: 0,
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <span
            style={{
              fontSize: 'var(--text-xs)',
              fontWeight: 'var(--weight-semibold)',
              color: 'var(--text-primary)',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
            }}
          >
            Interpretation
          </span>
          {isInterpreting && (
            <motion.span
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
              style={{
                fontSize: 10,
                color: 'var(--text-tertiary)',
                fontFamily: 'var(--font-mono)',
              }}
            >
              updating…
            </motion.span>
          )}
          {editedByUser && !isInterpreting && (
            <span
              style={{
                fontSize: 10,
                color: 'var(--text-tertiary)',
                fontFamily: 'var(--font-mono)',
              }}
              title="Your edit overrides further auto-interpretation"
            >
              edited
            </span>
          )}
        </div>
        {editedByUser && (
          <motion.button
            onClick={onRefresh}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              background: 'transparent',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)',
              padding: '2px 8px',
              fontSize: 10,
              color: 'var(--text-secondary)',
              fontFamily: 'var(--font-sans)',
              cursor: 'pointer',
              height: 22,
            }}
            title="Discard edit and re-interpret from sketch"
          >
            <ArrowClockwise size={10} weight="regular" />
            Refresh
          </motion.button>
        )}
      </div>

      {/* Content */}
      {isEmpty ? (
        <span
          style={{
            fontSize: 'var(--text-sm)',
            color: 'var(--text-tertiary)',
            fontStyle: 'italic',
            lineHeight: 1.5,
          }}
        >
          Start sketching and I&apos;ll describe the composition.
        </span>
      ) : (
        <textarea
          value={masterPrompt}
          onChange={(e) => onEdit(e.target.value)}
          placeholder="Interpreting…"
          rows={3}
          style={{
            width: '100%',
            background: 'transparent',
            border: 'none',
            outline: 'none',
            fontSize: 'var(--text-sm)',
            fontFamily: 'var(--font-mono)',
            color: 'var(--text-primary)',
            resize: 'none',
            lineHeight: 1.5,
            padding: 0,
            minHeight: 54,
            maxHeight: 120,
            overflowY: 'auto',
          }}
        />
      )}
    </motion.div>
  );
}
