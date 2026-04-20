'use client';

import { motion } from 'framer-motion';
import { ArrowClockwise } from '@phosphor-icons/react';

interface RefinePromptPanelProps {
  refinePrompt: string;
  isInterpreting: boolean;
  editedByUser: boolean;
  isEmpty: boolean;
  onEdit: (value: string) => void;
  onRefresh: () => void;
}

export default function RefinePromptPanel({
  refinePrompt,
  isInterpreting,
  editedByUser,
  isEmpty,
  onEdit,
  onRefresh,
}: RefinePromptPanelProps) {
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
      }}
    >
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
            Refine prompt
          </span>
          {isInterpreting && (
            <motion.span
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
              style={{ fontSize: 10, color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}
            >
              updating…
            </motion.span>
          )}
          {editedByUser && !isInterpreting && (
            <span
              style={{ fontSize: 10, color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}
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
            title="Discard edit and re-interpret from marks"
          >
            <ArrowClockwise size={10} weight="regular" />
            Refresh
          </motion.button>
        )}
      </div>

      {isEmpty ? (
        <span
          style={{
            fontSize: 'var(--text-sm)',
            color: 'var(--text-tertiary)',
            fontStyle: 'italic',
            lineHeight: 1.5,
          }}
        >
          Place a Remove mark or move an Adjustment slider to preview the refine prompt.
        </span>
      ) : (
        <textarea
          value={refinePrompt}
          onChange={(e) => onEdit(e.target.value)}
          placeholder="Composing…"
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
