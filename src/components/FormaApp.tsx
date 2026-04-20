'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTheme } from '@/hooks/useTheme';
import { useSession } from '@/hooks/useSession';
import { useInterpretation } from '@/hooks/useInterpretation';
import { useToasts } from '@/hooks/useToasts';
import { buildRefineMask, compositeKeepRegions, rasterizeSketch } from '@/lib/rasterize';
import { Mark, SavedSession } from '@/lib/types';
import { deleteSavedSession, loadAllSavedSessions } from '@/lib/storage';
import { buildFilename, downloadImage } from '@/lib/download';
import Nav from './shell/Nav';
import IterationStrip from './shell/IterationStrip';
import ToastStack from './shell/ToastStack';
import Composer from './composer/Composer';
import GenerationLoader from './loading/GenerationLoader';
import Director from './director/Director';
import HistoryBanner from './history/HistoryBanner';
import Library from './library/Library';

export default function FormaApp() {
  const { theme } = useTheme();
  const {
    session,
    screen,
    setScreen,
    activeRound,
    viewingRound,
    isHistoryView,
    currentMarks,
    setCurrentMarks,
    addGenerationRound,
    updateSketchData,
    goToRound,
    backToCurrent,
    restartComposition,
    startNewCreation,
    resumeSavedSession,
    finalizeSession,
    goToLibrary,
  } = useSession();

  // Hydrate library from localStorage. Reloaded whenever we return to the
  // library screen so newly finalized sessions appear immediately.
  const [savedSessions, setSavedSessions] = useState<SavedSession[]>([]);
  useEffect(() => {
    if (screen === 'library') setSavedSessions(loadAllSavedSessions());
  }, [screen]);

  // Interpretation state lives here (not inside Composer) so navigating to
  // Director and back doesn't wipe the composed master prompt or the user's
  // edits. FormaApp never unmounts during a session.
  const sketchData = session.rounds[0]?.sketchData;
  const interpretation = useInterpretation(
    sketchData ?? { aspectRatio: '3:2', shapes: [], textPrompt: '' }
  );

  const { toasts, success: toastSuccess, error: toastError, dismiss: dismissToast } = useToasts();

  // Get the round label for the nav
  const roundLabel = useMemo(() => {
    if (screen === 'library') return 'Library';
    if (screen === 'composer') return 'New Creation';
    if (screen === 'loading') return `Round ${session.rounds.length}`;
    if (isHistoryView && viewingRound) {
      return viewingRound.type === 'sketch' ? 'Sketch (history)' : `Round ${viewingRound.index} (history)`;
    }
    return activeRound.type === 'sketch' ? 'Sketch' : `Round ${activeRound.index}`;
  }, [screen, session.rounds.length, isHistoryView, viewingRound, activeRound]);

  // Get persisted keep marks from all prior rounds
  const persistedKeepMarks = useMemo(() => {
    const keeps: Mark[] = [];
    for (let i = 1; i < session.activeRoundIndex; i++) {
      session.rounds[i].marks
        .filter((m) => m.type === 'keep' && m.persists)
        .forEach((m) => keeps.push(m));
    }
    return keeps;
  }, [session.rounds, session.activeRoundIndex]);

  // Get previous round marks (for annotated overlay)
  const previousRoundMarks = useMemo(() => {
    const prevIdx = session.activeRoundIndex;
    if (prevIdx > 0 && prevIdx < session.rounds.length) {
      return session.rounds[prevIdx].marks;
    }
    return [];
  }, [session.rounds, session.activeRoundIndex]);

  const handleGenerate = useCallback(
    async (prompt: string) => {
      setScreen('loading');
      try {
        // Rasterize the sketch as a ControlNet canny signal so composition
        // lands where the user placed it. Empty sketch → no control image,
        // server falls back to pure text-to-image.
        const sketchData = session.rounds[0]?.sketchData;
        const hasSketch = sketchData && sketchData.shapes.length > 0;
        const sketchImage = hasSketch ? rasterizeSketch(sketchData!, 1024, 688) : undefined;

        const res = await fetch('/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt, sketchImage }),
        });
        const data = (await res.json()) as { imageUrl?: string; error?: string };
        if (!res.ok || !data.imageUrl) {
          throw new Error(data.error || 'generation failed');
        }
        addGenerationRound(data.imageUrl, prompt || null, []);
        setScreen('director');
        toastSuccess(`Round ${session.rounds.length} ready`);
      } catch (err) {
        console.error('generate failed', err);
        setScreen('composer');
        toastError(err instanceof Error ? err.message : 'Generation failed — try again');
      }
    },
    [setScreen, addGenerationRound, session.rounds, toastSuccess, toastError]
  );

  const handleRefine = useCallback(
    async (marks: Mark[], refinePrompt: string) => {
      setScreen('loading');
      try {
        const current = session.rounds[session.activeRoundIndex];
        if (!current || !current.imageUrl) throw new Error('no current image to refine');

        const removeMarks = marks.filter((m) => m.type === 'remove');
        const keepMarks = marks.filter((m) => m.type === 'keep');

        if (removeMarks.length === 0) {
          throw new Error('at least one remove mark required to refine');
        }
        if (!refinePrompt || refinePrompt.trim().length === 0) {
          throw new Error('refine prompt is empty');
        }

        // Read the actual image dimensions so the mask aligns with whatever
        // aspect/size the generation endpoint produced.
        const { width: imgW, height: imgH } = await new Promise<{ width: number; height: number }>(
          (resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
            img.onerror = reject;
            img.src = current.imageUrl!;
          }
        );

        const maskDataUrl = buildRefineMask(removeMarks, imgW, imgH);

        const refineRes = await fetch('/api/refine', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageUrl: current.imageUrl,
            maskDataUrl,
            prompt: refinePrompt,
            strength: 0.9,
          }),
        });
        const refineData = (await refineRes.json()) as { imageUrl?: string; error?: string };
        if (!refineRes.ok || !refineData.imageUrl) {
          throw new Error(refineData.error || 'refine failed');
        }

        const finalImageUrl = await compositeKeepRegions(
          current.imageUrl,
          refineData.imageUrl,
          keepMarks,
          imgW,
          imgH
        );

        const persistedMarks: Mark[] = marks.map((m) =>
          m.type === 'keep' ? { ...m, persists: true } : m
        );

        addGenerationRound(finalImageUrl, refinePrompt, persistedMarks);
        setScreen('director');
        toastSuccess(`Round ${session.rounds.length} ready`);
      } catch (err) {
        console.error('refine failed', err);
        setScreen('director');
        toastError(err instanceof Error ? err.message : 'Refine failed — try again');
      }
    },
    [setScreen, session, addGenerationRound, toastSuccess, toastError]
  );

  const displayRound = isHistoryView && viewingRound ? viewingRound : activeRound;

  const sessionTitle = useCallback((): string => {
    // Prefer the composer's master prompt; fall back to the last round's prompt.
    const master = interpretation.masterPrompt.trim();
    if (master.length > 0) return master.slice(0, 60);
    const last = session.rounds[session.activeRoundIndex]?.prompt?.trim();
    if (last && last.length > 0) return last.slice(0, 60);
    return 'Untitled creation';
  }, [interpretation.masterPrompt, session]);

  const handleFinish = useCallback(() => {
    const saved = finalizeSession(sessionTitle());
    if (!saved) {
      toastError('Nothing to finish yet — generate a round first.');
      return;
    }
    toastSuccess(`Saved "${saved.title.length > 40 ? saved.title.slice(0, 40) + '…' : saved.title}"`);
    goToLibrary();
  }, [finalizeSession, sessionTitle, goToLibrary, toastSuccess, toastError]);

  const handleDownloadCurrent = useCallback(async () => {
    const url = displayRound?.imageUrl;
    if (!url) return;
    const roundLabel = displayRound.type === 'sketch' ? 'sketch' : `round-${displayRound.index}`;
    try {
      await downloadImage(url, buildFilename(sessionTitle(), roundLabel));
    } catch (err) {
      toastError(err instanceof Error ? err.message : 'Download failed');
    }
  }, [displayRound, sessionTitle, toastError]);

  const handleDownloadSaved = useCallback(
    async (saved: SavedSession) => {
      try {
        await downloadImage(saved.thumbnailUrl, buildFilename(saved.title));
      } catch (err) {
        toastError(err instanceof Error ? err.message : 'Download failed');
      }
    },
    [toastError]
  );

  const handleDeleteSaved = useCallback((saved: SavedSession) => {
    deleteSavedSession(saved.id);
    setSavedSessions((prev) => prev.filter((s) => s.id !== saved.id));
  }, []);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        width: '100vw',
        overflow: 'hidden',
        background: 'var(--bg-base)',
        padding: 'var(--space-2)',
        gap: 'var(--space-2)',
      }}
    >
      <Nav
        roundLabel={roundLabel}
        theme={theme}
        showBack={screen !== 'library'}
        onBack={() => {
          if (isHistoryView) {
            backToCurrent();
          } else {
            goToLibrary();
          }
        }}
      />

      {/* Main area */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minHeight: 0,
          position: 'relative',
        }}
      >
        {/* History banner */}
        {isHistoryView && viewingRound && (
          <HistoryBanner
            currentRoundIndex={activeRound.index}
            viewingRoundIndex={viewingRound.index}
            onBackToCurrent={backToCurrent}
          />
        )}

        {screen === 'library' && (
          <Library
            savedSessions={savedSessions}
            onNewCreation={startNewCreation}
            onOpenSaved={resumeSavedSession}
            onDownloadSaved={handleDownloadSaved}
            onDeleteSaved={handleDeleteSaved}
          />
        )}

        {screen === 'composer' && session.rounds[0].sketchData && (
          <Composer
            sketchData={session.rounds[0].sketchData}
            onUpdateSketch={updateSketchData}
            onGenerate={handleGenerate}
            interpretation={interpretation}
          />
        )}

        {screen === 'loading' && <GenerationLoader theme={theme} />}

        {screen === 'director' && displayRound && displayRound.imageUrl && (
          <Director
            round={displayRound}
            roundIndex={displayRound.index}
            currentMarks={isHistoryView ? displayRound.marks : currentMarks}
            onUpdateMarks={setCurrentMarks}
            onRefine={handleRefine}
            onRestart={restartComposition}
            onFinish={handleFinish}
            onDownload={handleDownloadCurrent}
            previousRoundMarks={previousRoundMarks}
            persistedKeepMarks={persistedKeepMarks}
            readOnly={isHistoryView}
          />
        )}
      </div>

      {screen !== 'library' && (
        <IterationStrip
          rounds={session.rounds}
          activeRoundIndex={session.activeRoundIndex}
          onSelectRound={goToRound}
          onNewRound={restartComposition}
        />
      )}

      <ToastStack toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
