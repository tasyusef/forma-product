'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { SketchData } from '@/lib/types';

// 800ms was tight enough that rapid drag-resize bursts queued 5+ concurrent
// streams before the first returned — tripping Anthropic's concurrent-conn
// limit. 1400ms lets mid-drag edits settle before we fire.
const DEBOUNCE_MS = 1400;
const REQUEST_TIMEOUT_MS = 30_000;

/**
 * Hash the parts of the sketch that affect interpretation.
 * Rounds coordinates to 2 decimals so tiny drag jitter doesn't
 * trigger redundant calls.
 */
function computeSketchHash(sketch: SketchData): string {
  const normalized = {
    shapes: sketch.shapes.map((s) => ({
      id: s.id,
      type: s.type,
      x: Math.round(s.x * 100) / 100,
      y: Math.round(s.y * 100) / 100,
      width: Math.round(s.width * 100) / 100,
      height: Math.round(s.height * 100) / 100,
      label: s.label,
      prompt: s.prompt || '',
    })),
    textPrompt: sketch.textPrompt,
  };
  return JSON.stringify(normalized);
}

interface UseInterpretationResult {
  masterPrompt: string;
  isInterpreting: boolean;
  editedByUser: boolean;
  isEmpty: boolean;
  onEdit: (value: string) => void;
  onRefresh: () => void;
}

export function useInterpretation(sketch: SketchData): UseInterpretationResult {
  const [masterPrompt, setMasterPrompt] = useState('');
  const [isInterpreting, setIsInterpreting] = useState(false);
  const [editedByUser, setEditedByUser] = useState(false);

  const editedByUserRef = useRef(false);
  useEffect(() => {
    editedByUserRef.current = editedByUser;
  }, [editedByUser]);

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const cacheRef = useRef<Map<string, string>>(new Map());
  const lastHashRef = useRef<string>('');
  // Counter of in-flight interpretations. We flip isInterpreting off only
  // when it drops back to zero — single-boolean fails when calls overlap.
  const inflightCountRef = useRef(0);

  const isEmpty = sketch.shapes.length === 0 && sketch.textPrompt.trim().length === 0;

  const runInterpretation = useCallback(
    (hash: string, snapshot: SketchData) => {
      // Abort prior in-flight stream — its output is about to become stale.
      abortRef.current?.abort();

      const controller = new AbortController();
      abortRef.current = controller;

      // Hard timeout so a hung Anthropic request doesn't wedge the UI.
      const timeoutHandle = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

      inflightCountRef.current++;
      setIsInterpreting(true);

      (async () => {
        try {
          const res = await fetch('/api/interpret', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sketch: snapshot }),
            signal: controller.signal,
          });

          if (!res.ok || !res.body) return;

          const reader = res.body.getReader();
          const decoder = new TextDecoder();
          let accumulated = '';
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            accumulated += decoder.decode(value, { stream: true });

            // Only write to the panel if:
            //   1. The user hasn't edited (their edit is authoritative)
            //   2. This controller is still the active one (no newer call took over)
            //   3. The sketch hasn't changed since we started (no state drift)
            if (
              !editedByUserRef.current &&
              abortRef.current === controller &&
              lastHashRef.current === hash
            ) {
              setMasterPrompt(accumulated);
            }
          }
          // Only cache successful, complete streams.
          if (accumulated.trim().length > 0) {
            cacheRef.current.set(hash, accumulated);
          }
        } catch (err) {
          // Chrome surfaces aborted requests as TypeError('Failed to fetch')
          // instead of AbortError when the abort fires before headers arrive.
          // Both mean "we intentionally cancelled" — suppress.
          if (!controller.signal.aborted && (err as Error).name !== 'AbortError') {
            console.error('interpret failed', err);
          }
        } finally {
          clearTimeout(timeoutHandle);
          inflightCountRef.current = Math.max(0, inflightCountRef.current - 1);
          if (inflightCountRef.current === 0) {
            setIsInterpreting(false);
          }
        }
      })();
    },
    []
  );

  useEffect(() => {
    if (editedByUserRef.current) return;

    const hash = computeSketchHash(sketch);
    if (hash === lastHashRef.current) return;
    lastHashRef.current = hash;

    // Sketch just changed — abort any currently-streaming interpretation
    // so it can't overwrite masterPrompt with a now-stale paragraph.
    abortRef.current?.abort();

    if (isEmpty) {
      setMasterPrompt('');
      return;
    }

    const cached = cacheRef.current.get(hash);
    if (cached) {
      setMasterPrompt(cached);
      return;
    }

    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      runInterpretation(hash, sketch);
    }, DEBOUNCE_MS);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [sketch, isEmpty, runInterpretation]);

  const onEdit = useCallback((value: string) => {
    setMasterPrompt(value);
    setEditedByUser(true);
  }, []);

  const onRefresh = useCallback(() => {
    setEditedByUser(false);
    lastHashRef.current = '';
    setMasterPrompt('');
  }, []);

  return {
    masterPrompt,
    isInterpreting,
    editedByUser,
    isEmpty,
    onEdit,
    onRefresh,
  };
}
