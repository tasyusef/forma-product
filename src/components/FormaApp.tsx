'use client';

import { useCallback, useMemo } from 'react';
import { useTheme } from '@/hooks/useTheme';
import { useSession } from '@/hooks/useSession';
import { mockGenerate } from '@/lib/mockImages';
import { Mark } from '@/lib/types';
import Nav from './shell/Nav';
import IterationStrip from './shell/IterationStrip';
import Composer from './composer/Composer';
import GenerationLoader from './loading/GenerationLoader';
import Director from './director/Director';
import HistoryBanner from './history/HistoryBanner';

export default function FormaApp() {
  const { theme, toggleTheme } = useTheme();
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
  } = useSession();

  // Get the round label for the nav
  const roundLabel = useMemo(() => {
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
      const imageUrl = await mockGenerate(session.rounds.length);
      addGenerationRound(imageUrl, prompt || null, []);
      setScreen('director');
    },
    [setScreen, session.rounds.length, addGenerationRound]
  );

  const handleRefine = useCallback(
    async (marks: Mark[]) => {
      setScreen('loading');
      const imageUrl = await mockGenerate(session.rounds.length);
      addGenerationRound(imageUrl, null, marks);
      setScreen('director');
    },
    [setScreen, session.rounds.length, addGenerationRound]
  );

  const displayRound = isHistoryView && viewingRound ? viewingRound : activeRound;

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
        onToggleTheme={toggleTheme}
        showBack={screen !== 'composer'}
        onBack={() => {
          if (isHistoryView) {
            backToCurrent();
          } else {
            goToRound(0);
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

        {screen === 'composer' && session.rounds[0].sketchData && (
          <Composer
            sketchData={session.rounds[0].sketchData}
            onUpdateSketch={updateSketchData}
            onGenerate={handleGenerate}
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
            previousRoundMarks={previousRoundMarks}
            persistedKeepMarks={persistedKeepMarks}
            readOnly={isHistoryView}
          />
        )}
      </div>

      <IterationStrip
        rounds={session.rounds}
        activeRoundIndex={session.activeRoundIndex}
        onSelectRound={goToRound}
        onNewRound={restartComposition}
      />
    </div>
  );
}
