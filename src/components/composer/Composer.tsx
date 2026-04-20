'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { SketchShape, SketchData } from '@/lib/types';
import { CaretLeft, CaretRight } from '@phosphor-icons/react';
import ComposerCanvas from './ComposerCanvas';
import ShapeTray from './ShapeTray';
import LayerPanel from './LayerPanel';
import InterpretationPanel from './InterpretationPanel';

interface InterpretationState {
  masterPrompt: string;
  isInterpreting: boolean;
  editedByUser: boolean;
  isEmpty: boolean;
  onEdit: (value: string) => void;
  onRefresh: () => void;
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 10);
}

interface ComposerProps {
  sketchData: SketchData;
  onUpdateSketch: (data: Partial<SketchData>) => void;
  onGenerate: (prompt: string) => void;
  interpretation: InterpretationState;
}

export default function Composer({ sketchData, onUpdateSketch, onGenerate, interpretation }: ComposerProps) {
  const [drawMode, setDrawMode] = useState(false);
  const [prompt, setPrompt] = useState(sketchData.textPrompt);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Keep a ref to the latest sketch so async callbacks (e.g. the merge API
  // response) can merge into current state instead of a stale closure.
  const sketchDataRef = useRef(sketchData);
  useEffect(() => {
    sketchDataRef.current = sketchData;
  }, [sketchData]);

  // Tracks group IDs whose merge API call is already in flight — prevents
  // double-firing when the effect re-runs.
  const mergingGroupIdsRef = useRef<Set<string>>(new Set());

  // Watch for groups flagged isMerging and fire the Claude merge call.
  useEffect(() => {
    const pending = sketchData.shapes.filter(
      (s) => s.type === 'group' && s.isMerging && !mergingGroupIdsRef.current.has(s.id)
    );
    if (pending.length === 0) return;

    for (const group of pending) {
      mergingGroupIdsRef.current.add(group.id);

      const memberPrompts = group.memberPrompts || {};
      const promptValues = Object.values(memberPrompts).filter((p) => p && p.trim().length > 0);
      const memberLabels = (group.memberIds || [])
        .map((id) => sketchData.shapes.find((s) => s.id === id)?.label || '')
        .filter((l) => l.trim().length > 0);

      (async () => {
        try {
          const res = await fetch('/api/interpret/merge', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ memberPrompts: promptValues, memberLabels }),
          });
          const data = (await res.json()) as { merged?: string; error?: string };
          const merged = data.merged?.trim() || promptValues.join('; ') || memberLabels.join(', ');

          const latest = sketchDataRef.current.shapes;
          onUpdateSketch({
            shapes: latest.map((s) =>
              s.id === group.id ? { ...s, prompt: merged, isMerging: false } : s
            ),
          });
        } catch {
          // Fallback: naive join so the group still has something usable.
          const fallback = promptValues.join('; ') || memberLabels.join(', ');
          const latest = sketchDataRef.current.shapes;
          onUpdateSketch({
            shapes: latest.map((s) =>
              s.id === group.id ? { ...s, prompt: fallback, isMerging: false } : s
            ),
          });
        } finally {
          mergingGroupIdsRef.current.delete(group.id);
        }
      })();
    }
  }, [sketchData.shapes, onUpdateSketch]);

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
      setSelectedIds([newShape.id]);
      setDrawMode(false);
    },
    [sketchData.shapes, onUpdateSketch]
  );

  const handleCombineShapes = useCallback(
    (ids: string[]) => {
      if (ids.length < 2) return;
      const members = sketchData.shapes.filter((s) => ids.includes(s.id));
      if (members.length < 2) return;

      // Compute combined bounding box.
      const minX = Math.min(...members.map((s) => s.x));
      const minY = Math.min(...members.map((s) => s.y));
      const maxX = Math.max(...members.map((s) => s.x + s.width));
      const maxY = Math.max(...members.map((s) => s.y + s.height));

      // Insertion index = position of the topmost (last) member in the original array.
      const lastIndex = Math.max(...members.map((s) => sketchData.shapes.findIndex((x) => x.id === s.id)));

      // Snapshot each member's prompt so ungroup can restore them.
      // Phase 3 will call /api/interpret/merge here to populate groupShape.prompt.
      const memberPrompts: Record<string, string> = {};
      for (const m of members) {
        if (m.prompt && m.prompt.trim().length > 0) memberPrompts[m.id] = m.prompt;
      }

      // Only mark isMerging when there's something to merge — i.e. at least
      // one member had a prompt. Otherwise the effect would waste an API call.
      const hasPromptsToMerge = Object.keys(memberPrompts).length > 0;

      const groupShape: SketchShape = {
        id: generateId(),
        type: 'group',
        x: minX,
        y: minY,
        width: maxX - minX,
        height: maxY - minY,
        label: `Group (${members.length})`,
        memberIds: members.map((m) => m.id),
        memberPrompts,
        isMerging: hasPromptsToMerge,
      };

      const remaining = sketchData.shapes.filter((s) => !ids.includes(s.id));
      // Clamp insertion index to remaining array length.
      const insertAt = Math.min(lastIndex - (members.length - 1), remaining.length);
      const next = [
        ...remaining.slice(0, Math.max(0, insertAt)),
        groupShape,
        ...remaining.slice(Math.max(0, insertAt)),
      ];
      onUpdateSketch({ shapes: next });
    },
    [sketchData.shapes, onUpdateSketch]
  );

  const hasComposed = interpretation.masterPrompt.trim().length > 0;
  const canGenerate =
    !interpretation.isInterpreting &&
    (hasComposed || prompt.trim().length > 0);

  const handleGenerateClick = useCallback(() => {
    // Prefer the editable master prompt; fall back to the global prompt
    // when no sketch has been interpreted yet.
    const composed = interpretation.masterPrompt.trim();
    onGenerate(composed || prompt);
  }, [interpretation.masterPrompt, prompt, onGenerate]);

  return (
    <div style={{ flex: 1, display: 'flex', minHeight: 0, overflow: 'hidden', gap: 'var(--space-2)' }}>
      {/* Left panel — Layers */}
      <LayerPanel
        shapes={sketchData.shapes}
        selectedIds={selectedIds}
        onReorderShapes={(shapes) => onUpdateSketch({ shapes })}
        onDeleteShape={(id) => {
          onUpdateSketch({ shapes: sketchData.shapes.filter((s) => s.id !== id) });
          setSelectedIds((prev) => prev.filter((s) => s !== id));
        }}
        onUpdateShape={(id, patch) =>
          onUpdateSketch({
            shapes: sketchData.shapes.map((s) => (s.id === id ? { ...s, ...patch } : s)),
          })
        }
        onSetSelectedIds={setSelectedIds}
        onCombineShapes={handleCombineShapes}
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
        {/* Toolbar: undo/redo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)' }}>
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

        {/* Canvas */}
        <ComposerCanvas
          aspectRatio={sketchData.aspectRatio}
          shapes={sketchData.shapes}
          drawMode={drawMode}
          selectedIds={selectedIds}
          onUpdateShapes={(shapes) => onUpdateSketch({ shapes })}
          onSetSelectedIds={setSelectedIds}
          canvasRef={canvasRef}
        />

        {/* Interpretation panel — live master prompt, editable */}
        <InterpretationPanel
          masterPrompt={interpretation.masterPrompt}
          isInterpreting={interpretation.isInterpreting}
          editedByUser={interpretation.editedByUser}
          isEmpty={interpretation.isEmpty}
          onEdit={interpretation.onEdit}
          onRefresh={interpretation.onRefresh}
        />

        {/* Bottom bar: prompt + generate — flex-shrink 0 so it survives a tight viewport */}
        <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center', flexShrink: 0 }}>
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
              if (e.key === 'Enter' && canGenerate) handleGenerateClick();
            }}
          />
          <motion.button
            onClick={handleGenerateClick}
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
