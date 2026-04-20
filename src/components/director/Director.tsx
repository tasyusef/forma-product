'use client';

import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Adjustments, Mark, MarkTool, NEUTRAL_ADJUSTMENTS } from '@/lib/types';
import DirectiveToolbar from './DirectiveToolbar';
import DirectorCanvas from './DirectorCanvas';
import RefineBar from './RefineBar';
import RefinePromptPanel from './RefinePromptPanel';
import { useRefineInterpretation } from '@/hooks/useRefineInterpretation';
import type { Round } from '@/lib/types';

interface DirectorProps {
  round: Round;
  roundIndex: number;
  currentMarks: Mark[];
  onUpdateMarks: (marks: Mark[]) => void;
  onRefine: (marks: Mark[], refinePrompt: string) => void;
  onRestart: () => void;
  onFinish: () => void;
  onDownload: () => void;
  previousRoundMarks: Mark[];
  persistedKeepMarks: Mark[];
  readOnly: boolean;
}

export default function Director({
  round,
  roundIndex,
  currentMarks,
  onUpdateMarks,
  onRefine,
  onRestart,
  onFinish,
  onDownload,
  previousRoundMarks,
  persistedKeepMarks,
  readOnly,
}: DirectorProps) {
  const [activeTool, setActiveTool] = useState<MarkTool>(null);
  const [showAnnotated, setShowAnnotated] = useState(false);
  const [undoStack, setUndoStack] = useState<Mark[][]>([]);
  const [adjustments, setAdjustments] = useState<Adjustments>(NEUTRAL_ADJUSTMENTS);

  const refineInterpretation = useRefineInterpretation({
    masterPrompt: round.prompt || '',
    marks: currentMarks,
    adjustments,
  });

  const canToggleView = roundIndex > 1 && previousRoundMarks.length > 0;

  const handleAddMark = useCallback(
    (mark: Mark) => {
      setUndoStack((prev) => [...prev, currentMarks]);
      onUpdateMarks([...currentMarks, mark]);
    },
    [currentMarks, onUpdateMarks]
  );

  const handleUndo = useCallback(() => {
    if (undoStack.length === 0) return;
    const prev = undoStack[undoStack.length - 1];
    setUndoStack((s) => s.slice(0, -1));
    onUpdateMarks(prev);
  }, [undoStack, onUpdateMarks]);

  const handleUpdateAnnotation = useCallback(
    (markId: string, annotation: string) => {
      onUpdateMarks(currentMarks.map((m) => (m.id === markId ? { ...m, annotation } : m)));
    },
    [currentMarks, onUpdateMarks]
  );

  const handleRefine = useCallback(() => {
    onRefine(currentMarks, refineInterpretation.refinePrompt);
    setActiveTool(null);
    setShowAnnotated(false);
    setUndoStack([]);
  }, [currentMarks, refineInterpretation.refinePrompt, onRefine]);

  if (!round.imageUrl) return null;

  return (
    <div style={{ flex: 1, display: 'flex', minHeight: 0, overflow: 'hidden', gap: 'var(--space-2)' }}>
      {/* Center — canvas area */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          padding: 'var(--space-4) var(--space-5)',
          gap: 'var(--space-2)',
          minHeight: 0,
          minWidth: 0,
          overflow: 'hidden',
        }}
      >
        <DirectorCanvas
          imageUrl={round.imageUrl}
          marks={currentMarks}
          activeTool={readOnly ? null : activeTool}
          onAddMark={handleAddMark}
          onUpdateAnnotation={handleUpdateAnnotation}
          persistedMarks={readOnly ? [] : persistedKeepMarks}
          showAnnotatedOverlay={showAnnotated}
          priorMarks={previousRoundMarks}
          readOnly={readOnly}
        />

        {!readOnly && (
          <>
            <RefinePromptPanel
              refinePrompt={refineInterpretation.refinePrompt}
              isInterpreting={refineInterpretation.isInterpreting}
              editedByUser={refineInterpretation.editedByUser}
              isEmpty={refineInterpretation.isEmpty}
              onEdit={refineInterpretation.onEdit}
              onRefresh={refineInterpretation.onRefresh}
            />
            <RefineBar
              canRefine={
                !refineInterpretation.isEmpty &&
                !refineInterpretation.isInterpreting &&
                refineInterpretation.refinePrompt.trim().length > 0
              }
              canFinish={Boolean(round.imageUrl)}
              onRefine={handleRefine}
              onRestart={onRestart}
              onFinish={onFinish}
              onDownload={onDownload}
            />
          </>
        )}
      </motion.div>

      {/* Right panel — Directive tools */}
      <DirectiveToolbar
        activeTool={activeTool}
        onSelectTool={(tool) => {
          if (readOnly) return;
          setActiveTool(tool);
        }}
        onUndo={handleUndo}
        canUndo={undoStack.length > 0}
        showAnnotated={showAnnotated}
        onToggleView={() => setShowAnnotated(!showAnnotated)}
        canToggleView={canToggleView}
        adjustments={adjustments}
        onAdjustmentChange={(key, value) =>
          setAdjustments((prev) => ({ ...prev, [key]: value }))
        }
        onResetAdjustments={() => setAdjustments(NEUTRAL_ADJUSTMENTS)}
        disabled={readOnly}
      />
    </div>
  );
}
