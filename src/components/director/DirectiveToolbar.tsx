'use client';

import { motion } from 'framer-motion';
import { ArrowCounterClockwise, CircleDashed, X, ArrowRight, Eye, EyeSlash } from '@phosphor-icons/react';
import { Adjustments, MarkTool } from '@/lib/types';

interface DirectiveToolbarProps {
  activeTool: MarkTool;
  onSelectTool: (tool: MarkTool) => void;
  onUndo: () => void;
  canUndo: boolean;
  showAnnotated: boolean;
  onToggleView: () => void;
  canToggleView: boolean;
  adjustments: Adjustments;
  onAdjustmentChange: (key: keyof Adjustments, value: number) => void;
  onResetAdjustments: () => void;
  disabled: boolean;
}

const TOOL_COLORS: Record<string, { bg: string; color: string }> = {
  keep: { bg: 'rgba(34, 197, 94, 0.12)', color: '#22C55E' },
  remove: { bg: 'rgba(239, 68, 68, 0.12)', color: '#EF4444' },
  redirect: { bg: 'rgba(59, 130, 246, 0.12)', color: '#3B82F6' },
};

const ADJUSTMENTS: Array<{ key: keyof Adjustments; label: string; left: string; right: string }> = [
  { key: 'lighting', label: 'Lighting', left: 'Dark', right: 'Bright' },
  { key: 'saturation', label: 'Saturation', left: 'Muted', right: 'Vibrant' },
  { key: 'style', label: 'Style', left: 'Photo', right: 'Stylized' },
  { key: 'detail', label: 'Detail', left: 'Minimal', right: 'Dense' },
  { key: 'mood', label: 'Mood', left: 'Calm', right: 'Energetic' },
  { key: 'contrast', label: 'Contrast', left: 'Flat', right: 'High' },
];

export default function DirectiveToolbar({
  activeTool,
  onSelectTool,
  onUndo,
  canUndo,
  showAnnotated,
  onToggleView,
  canToggleView,
  adjustments,
  onAdjustmentChange,
  onResetAdjustments,
  disabled,
}: DirectiveToolbarProps) {
  const tools: { key: MarkTool; icon: typeof CircleDashed; label: string }[] = [
    { key: 'keep', icon: CircleDashed, label: 'Keep' },
    { key: 'remove', icon: X, label: 'Remove' },
    { key: 'redirect', icon: ArrowRight, label: 'Redirect' },
  ];

  const hasAdjustments = ADJUSTMENTS.some(({ key }) => adjustments[key] !== 50);

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

        <div style={{ height: 1, background: 'var(--border-subtle)', margin: 'var(--space-2) 0' }} />

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

        <div style={{ height: 1, background: 'var(--border-subtle)', margin: 'var(--space-2) 0' }} />

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

      {/* Adjustments header */}
      <div
        style={{
          borderTop: '1px solid var(--border-subtle)',
          padding: 'var(--space-4) var(--space-4) var(--space-3)',
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
          Adjustments
        </span>
        {hasAdjustments && !disabled && (
          <motion.button
            onClick={onResetAdjustments}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            style={{
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
            title="Return all sliders to neutral"
          >
            Reset
          </motion.button>
        )}
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
        {ADJUSTMENTS.map(({ key, label, left, right }) => (
          <DirectionSlider
            key={key}
            label={label}
            left={left}
            right={right}
            value={adjustments[key]}
            onChange={(v) => onAdjustmentChange(key, v)}
            disabled={disabled}
          />
        ))}
      </div>
    </motion.div>
  );
}

function DirectionSlider({
  label,
  left,
  right,
  value,
  onChange,
  disabled,
}: {
  label: string;
  left: string;
  right: string;
  value: number;
  onChange: (value: number) => void;
  disabled: boolean;
}) {
  const isNeutral = value === 50;
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
            color: isNeutral ? 'var(--text-tertiary)' : 'var(--text-primary)',
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
        onChange={(e) => onChange(Number(e.target.value))}
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
