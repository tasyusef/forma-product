'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowCounterClockwise, CircleDashed, X, ArrowRight, Eye, EyeSlash } from '@phosphor-icons/react';
import { MarkTool } from '@/lib/types';

interface DirectiveToolbarProps {
  activeTool: MarkTool;
  onSelectTool: (tool: MarkTool) => void;
  onUndo: () => void;
  canUndo: boolean;
  showAnnotated: boolean;
  onToggleView: () => void;
  canToggleView: boolean;
  disabled: boolean;
}

const TOOL_COLORS: Record<string, { bg: string; color: string }> = {
  keep: { bg: 'rgba(34, 197, 94, 0.12)', color: '#22C55E' },
  remove: { bg: 'rgba(239, 68, 68, 0.12)', color: '#EF4444' },
  redirect: { bg: 'rgba(59, 130, 246, 0.12)', color: '#3B82F6' },
};

export default function DirectiveToolbar({
  activeTool,
  onSelectTool,
  onUndo,
  canUndo,
  showAnnotated,
  onToggleView,
  canToggleView,
  disabled,
}: DirectiveToolbarProps) {
  const tools: { key: MarkTool; icon: typeof CircleDashed; label: string }[] = [
    { key: 'keep', icon: CircleDashed, label: 'Keep' },
    { key: 'remove', icon: X, label: 'Remove' },
    { key: 'redirect', icon: ArrowRight, label: 'Redirect' },
  ];

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
          Directives
        </span>
      </div>

      {/* Mark tools */}
      <div style={{ padding: 'var(--space-3) var(--space-3)', display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
        {tools.map(({ key, icon: Icon, label }) => {
          const isActive = activeTool === key && !disabled;
          const colors = TOOL_COLORS[key!];
          return (
            <motion.button
              key={key}
              onClick={() => !disabled && onSelectTool(activeTool === key ? null : key)}
              whileHover={!disabled ? { x: 2 } : undefined}
              whileTap={!disabled ? { scale: 0.97 } : undefined}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-3)',
                padding: 'var(--space-2) var(--space-3)',
                background: isActive ? colors.bg : 'transparent',
                border: 'none',
                borderRadius: 'var(--radius-sm)',
                color: isActive ? colors.color : disabled ? 'var(--text-disabled)' : 'var(--text-secondary)',
                fontSize: 'var(--text-sm)',
                fontWeight: isActive ? 'var(--weight-medium)' : 'var(--weight-regular)',
                cursor: disabled ? 'not-allowed' : 'pointer',
                fontFamily: 'var(--font-sans)',
                width: '100%',
                textAlign: 'left',
                opacity: disabled ? 0.4 : 1,
                boxShadow: isActive ? 'var(--shadow-xs)' : 'none',
              }}
            >
              <Icon size={16} weight="regular" />
              <span>{label}</span>
            </motion.button>
          );
        })}

        {/* Divider */}
        <div style={{ height: 1, background: 'var(--border-subtle)', margin: 'var(--space-2) 0' }} />

        {/* Undo */}
        <motion.button
          onClick={onUndo}
          disabled={!canUndo || disabled}
          whileHover={canUndo && !disabled ? { x: 2 } : undefined}
          whileTap={canUndo && !disabled ? { scale: 0.97 } : undefined}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-3)',
            padding: 'var(--space-2) var(--space-3)',
            background: 'transparent',
            border: 'none',
            borderRadius: 'var(--radius-sm)',
            color: canUndo && !disabled ? 'var(--text-secondary)' : 'var(--text-disabled)',
            fontSize: 'var(--text-sm)',
            cursor: canUndo && !disabled ? 'pointer' : 'not-allowed',
            fontFamily: 'var(--font-sans)',
            width: '100%',
            textAlign: 'left',
            opacity: canUndo && !disabled ? 1 : 0.4,
          }}
        >
          <ArrowCounterClockwise size={16} weight="regular" />
          <span>Undo</span>
        </motion.button>

        {/* Divider */}
        <div style={{ height: 1, background: 'var(--border-subtle)', margin: 'var(--space-2) 0' }} />

        {/* Compare toggle */}
        <motion.button
          onClick={onToggleView}
          disabled={!canToggleView || disabled}
          whileHover={canToggleView && !disabled ? { x: 2 } : undefined}
          whileTap={canToggleView && !disabled ? { scale: 0.97 } : undefined}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-3)',
            padding: 'var(--space-2) var(--space-3)',
            background: showAnnotated ? 'var(--bg-active)' : 'transparent',
            border: 'none',
            borderRadius: 'var(--radius-sm)',
            color: canToggleView && !disabled ? 'var(--text-secondary)' : 'var(--text-disabled)',
            fontSize: 'var(--text-sm)',
            cursor: canToggleView && !disabled ? 'pointer' : 'not-allowed',
            fontFamily: 'var(--font-sans)',
            width: '100%',
            textAlign: 'left',
            opacity: canToggleView && !disabled ? 1 : 0.4,
          }}
        >
          {showAnnotated ? <EyeSlash size={16} weight="regular" /> : <Eye size={16} weight="regular" />}
          <span>{showAnnotated ? 'Annotated' : 'Clean View'}</span>
        </motion.button>
      </div>

      {/* Sliders section */}
      <div
        style={{
          borderTop: '1px solid var(--border-subtle)',
          padding: 'var(--space-4) var(--space-4) var(--space-3)',
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
          Adjustments
        </span>
      </div>
      <div
        className="panel-scroll"
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '0 var(--space-4) var(--space-4)',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-4)',
        }}
      >
        <DirectionSlider label="Lighting" left="Dark" right="Bright" disabled={disabled} />
        <DirectionSlider label="Saturation" left="Muted" right="Vibrant" disabled={disabled} />
        <DirectionSlider label="Style" left="Photo" right="Stylized" disabled={disabled} />
        <DirectionSlider label="Detail" left="Minimal" right="Dense" disabled={disabled} />
        <DirectionSlider label="Mood" left="Calm" right="Energetic" disabled={disabled} />
        <DirectionSlider label="Contrast" left="Flat" right="High" disabled={disabled} />
      </div>
    </motion.div>
  );
}

function DirectionSlider({
  label,
  left,
  right,
  disabled,
}: {
  label: string;
  left: string;
  right: string;
  disabled: boolean;
}) {
  const [value, setValue] = useState(50);

  return (
    <div style={{ opacity: disabled ? 0.4 : 1 }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          marginBottom: 'var(--space-2)',
        }}
      >
        <span
          style={{
            fontSize: 'var(--text-xs)',
            fontWeight: 'var(--weight-medium)',
            color: 'var(--text-primary)',
          }}
        >
          {label}
        </span>
        <span
          style={{
            fontSize: 'var(--text-xs)',
            color: 'var(--text-tertiary)',
            fontFamily: 'var(--font-mono)',
          }}
        >
          {value}
        </span>
      </div>
      <input
        type="range"
        min={0}
        max={100}
        value={value}
        onChange={(e) => setValue(Number(e.target.value))}
        disabled={disabled}
        className="direction-slider"
      />
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginTop: 'var(--space-1)',
        }}
      >
        <span style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>{left}</span>
        <span style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>{right}</span>
      </div>
    </div>
  );
}
