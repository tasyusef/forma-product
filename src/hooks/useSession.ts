'use client';

import { useState, useCallback } from 'react';
import { Session, Round, Mark, SavedSession, SketchData, Screen } from '@/lib/types';
import { saveSession as persistSession } from '@/lib/storage';

function generateId(): string {
  return Math.random().toString(36).substring(2, 10);
}

function createSketchRound(): Round {
  return {
    id: generateId(),
    index: 0,
    type: 'sketch',
    imageUrl: null,
    sketchData: {
      aspectRatio: '3:2',
      shapes: [],
      textPrompt: '',
    },
    marks: [],
    thumbnailUrl: '',
    prompt: null,
  };
}

export function useSession() {
  const [session, setSession] = useState<Session>({
    id: generateId(),
    rounds: [createSketchRound()],
    activeRoundIndex: 0,
  });

  const [screen, setScreen] = useState<Screen>('library');
  const [viewingRoundIndex, setViewingRoundIndex] = useState<number | null>(null);
  const [currentMarks, setCurrentMarks] = useState<Mark[]>([]);

  const activeRound = session.rounds[session.activeRoundIndex];
  const viewingRound = viewingRoundIndex !== null ? session.rounds[viewingRoundIndex] : null;
  const isHistoryView = viewingRoundIndex !== null && viewingRoundIndex !== session.activeRoundIndex;

  const addGenerationRound = useCallback(
    (imageUrl: string, prompt: string | null, marks: Mark[]) => {
      setSession((prev) => {
        const newRound: Round = {
          id: generateId(),
          index: prev.rounds.length,
          type: 'generation',
          imageUrl,
          sketchData: null,
          marks,
          thumbnailUrl: imageUrl,
          prompt,
        };
        return {
          ...prev,
          rounds: [...prev.rounds, newRound],
          activeRoundIndex: prev.rounds.length,
        };
      });
      setCurrentMarks([]);
    },
    []
  );

  const updateSketchData = useCallback((data: Partial<SketchData>) => {
    setSession((prev) => {
      const rounds = [...prev.rounds];
      const sketch = rounds[0];
      if (sketch.sketchData) {
        rounds[0] = {
          ...sketch,
          sketchData: { ...sketch.sketchData, ...data },
        };
      }
      return { ...prev, rounds };
    });
  }, []);

  const updateSketchThumbnail = useCallback((thumbnailUrl: string) => {
    setSession((prev) => {
      const rounds = [...prev.rounds];
      rounds[0] = { ...rounds[0], thumbnailUrl };
      return { ...prev, rounds };
    });
  }, []);

  const goToRound = useCallback(
    (index: number) => {
      // Sketch round always goes to composer
      if (index === 0) {
        setViewingRoundIndex(null);
        setScreen('composer');
        return;
      }
      if (index === session.activeRoundIndex) {
        setViewingRoundIndex(null);
        setScreen('director');
      } else {
        setViewingRoundIndex(index);
        setScreen('director');
      }
    },
    [session.activeRoundIndex]
  );

  const backToCurrent = useCallback(() => {
    setViewingRoundIndex(null);
    setScreen(session.activeRoundIndex === 0 ? 'composer' : 'director');
  }, [session.activeRoundIndex]);

  const restartComposition = useCallback(() => {
    setScreen('composer');
    setViewingRoundIndex(null);
  }, []);

  const resetSession = useCallback(() => {
    setSession({
      id: generateId(),
      rounds: [createSketchRound()],
      activeRoundIndex: 0,
    });
    setCurrentMarks([]);
    setViewingRoundIndex(null);
  }, []);

  const startNewCreation = useCallback(() => {
    setSession({
      id: generateId(),
      rounds: [createSketchRound()],
      activeRoundIndex: 0,
    });
    setCurrentMarks([]);
    setViewingRoundIndex(null);
    setScreen('composer');
  }, []);

  const resumeSavedSession = useCallback((saved: SavedSession) => {
    setSession(saved.session);
    setCurrentMarks([]);
    setViewingRoundIndex(null);
    setScreen(saved.session.activeRoundIndex === 0 ? 'composer' : 'director');
  }, []);

  const finalizeSession = useCallback(
    (title: string): SavedSession | null => {
      const round = session.rounds[session.activeRoundIndex];
      if (!round || !round.imageUrl) return null;
      const trimmed = title.trim() || 'Untitled creation';
      const saved: SavedSession = {
        id: session.id,
        title: trimmed,
        finalizedAt: Date.now(),
        finalRoundIndex: session.activeRoundIndex,
        thumbnailUrl: round.thumbnailUrl || round.imageUrl,
        session,
      };
      persistSession(saved);
      return saved;
    },
    [session]
  );

  const goToLibrary = useCallback(() => {
    setScreen('library');
    setViewingRoundIndex(null);
  }, []);

  return {
    session,
    screen,
    setScreen,
    activeRound,
    viewingRound,
    viewingRoundIndex,
    isHistoryView,
    currentMarks,
    setCurrentMarks,
    addGenerationRound,
    updateSketchData,
    updateSketchThumbnail,
    goToRound,
    backToCurrent,
    restartComposition,
    resetSession,
    startNewCreation,
    resumeSavedSession,
    finalizeSession,
    goToLibrary,
  };
}
