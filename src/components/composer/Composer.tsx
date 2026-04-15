'use client';

import { useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { SketchShape, AspectRatio, SketchData } from '@/lib/types';
import { CaretLeft, CaretRight } from '@phosphor-icons/react';
import ComposerCanvas from './ComposerCanvas';
import ShapeTray from './ShapeTray';
import LayerPanel from './LayerPanel';

function generateId(): string {
  return Math.random().toString(36).substring(2, 10);
}

interface ComposerProps {
  sketchData: SketchData;
  onUpdateSketch: (data: Partial<SketchData>) => void;
  onGenerate: (prompt: string) => void;
}

const ASPECT_OPTIONS: AspectRatio[] = ['1:1', '3:2', '16:9', '9:16'];

export default function Composer({ sketchData, onUpdateSketch, onGenerate }: ComposerProps) {
  const [drawMode, setDrawMode] = useState(false);
  const [prompt, setPrompt] = useState(sketchData.textPrompt);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleAddShape = useCallback(
    (type: SketchShape['type']) => {
      const newShape: SketchShape = {
        id: generateId(),
        type,
        x: 0.25 + Math.random() * 0.15,
        y: 0.25 + Math.random() * 0.15,
        width: 0.2,
        height: type === 'figure' ? 0.3 : 0.2,
        label: '',
      };
      onUpdateSketch({ shapes: [...sketchData.shapes, newShape] });
      setDrawMode(false);
    },
    [sketchData.shapes, onUpdateSketch]
  );

  const canGenerate = sketchData.shapes.length > 0 || sketchData.freehandPaths.length > 0 || prompt.trim().length > 0;

  return (
    <div style={{ flex: 1, display: 'flex', minHeight: 0, overflow: 'hidden', gap: 'var(--space-2)' }}>
      {/* Left panel — Layers */}
      <LayerPanel
        shapes={sketchData.shapes}
        freehandPaths={sketchData.freehandPaths}
        onReorderShapes={(shapes) => onUpdateSketch({ shapes })}
        onDeleteShape={(id) => onUpdateSketch({ shapes: sketchData.shapes.filter((s) => s.id !== id) })}
        onDeleteFreehand={(i) =>
          onUpdateSketch({ freehandPaths: sketchData.freehandPaths.filter((_, idx) => idx !== i) })
        }
      />

      {/* Center — Canvas area */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          padding: 'var(--space-4) var(--space-5)',
          gap: 'var(--space-3)',
          minHeight: 0,
          minWidth: 0,
          overflow: 'hidden',
        }}
      >
        {/* Toolbar: undo/redo + aspect ratio selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          {/* Back / Forward */}
          <div style={{ display: 'flex', gap: 'var(--space-1)' }}>
            <motion.button
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.92 }}
              style={{
                width: 28,
                height: 28,
                borderRadius: 'var(--radius-sm)',
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                boxShadow: 'var(--shadow-xs)',
              }}
              title="Undo"
            >
              <CaretLeft size={14} weight="bold" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.92 }}
              style={{
                width: 28,
                height: 28,
                borderRadius: 'var(--radius-sm)',
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                boxShadow: 'var(--shadow-xs)',
              }}
              title="Redo"
            >
              <CaretRight size={14} weight="bold" />
            </motion.button>
          </div>

          {/* Aspect ratio selector — right aligned */}
          <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-1)' }}>
            {ASPECT_OPTIONS.map((ar) => (
              <motion.button
                key={ar}
                onClick={() => onUpdateSketch({ aspectRatio: ar })}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                style={{
                  padding: 'var(--space-1) var(--space-3)',
                  fontSize: 'var(--text-xs)',
                  fontWeight: sketchData.aspectRatio === ar ? 'var(--weight-semibold)' : 'var(--weight-regular)',
                  color: sketchData.aspectRatio === ar ? 'var(--text-primary)' : 'var(--text-tertiary)',
                  background: sketchData.aspectRatio === ar ? 'var(--bg-elevated)' : 'transparent',
                  border: 'none',
                  borderRadius: 'var(--radius-sm)',
                  cursor: 'pointer',
                  fontFamily: 'var(--font-sans)',
                  boxShadow: sketchData.aspectRatio === ar ? 'var(--shadow-xs)' : 'none',
                }}
              >
                {ar}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Canvas */}
        <ComposerCanvas
          aspectRatio={sketchData.aspectRatio}
          shapes={sketchData.shapes}
          freehandPaths={sketchData.freehandPaths}
          drawMode={drawMode}
          onUpdateShapes={(shapes) => onUpdateSketch({ shapes })}
          onUpdateFreehand={(paths) => onUpdateSketch({ freehandPaths: paths })}
          canvasRef={canvasRef}
        />

        {/* Bottom bar: prompt + generate */}
        <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
          <input
            type="text"
            value={prompt}
            onChange={(e) => {
              setPrompt(e.target.value);
              onUpdateSketch({ textPrompt: e.target.value });
            }}
            placeholder="Describe mood, style, or anything else..."
            style={{
              flex: 1,
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--text-primary)',
              fontSize: 'var(--text-sm)',
              padding: 'var(--space-2) var(--space-4)',
              outline: 'none',
              fontFamily: 'var(--font-sans)',
              height: 'var(--btn-height-md)',
              boxShadow: 'var(--shadow-xs)',
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && canGenerate) onGenerate(prompt);
            }}
          />
          <motion.button
            onClick={() => onGenerate(prompt)}
            disabled={!canGenerate}
            whileHover={canGenerate ? { scale: 1.02, y: -1 } : undefined}
            whileTap={canGenerate ? { scale: 0.98 } : undefined}
            style={{
              height: 'var(--btn-height-md)',
              padding: '0 var(--space-5)',
              background: canGenerate ? 'var(--text-primary)' : 'var(--bg-hover)',
              color: canGenerate ? 'var(--text-inverse)' : 'var(--text-disabled)',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              fontSize: 'var(--text-sm)',
              fontWeight: 'var(--weight-medium)',
              cursor: canGenerate ? 'pointer' : 'not-allowed',
              fontFamily: 'var(--font-sans)',
              boxShadow: canGenerate ? 'var(--shadow-sm)' : 'none',
              whiteSpace: 'nowrap',
            }}
          >
            Generate
          </motion.button>
        </div>
      </motion.div>

      {/* Right panel — Tools */}
      <ShapeTray
        activeDrawMode={drawMode}
        onAddShape={handleAddShape}
        onToggleDraw={() => setDrawMode(!drawMode)}
      />
    </div>
  );
}
