'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Adjustments, Mark, NEUTRAL_ADJUSTMENTS } from '@/lib/types';

const DEBOUNCE_MS = 800;
const REQUEST_TIMEOUT_MS = 30_000;

interface MarkSummary {
  type: 'keep' | 'remove' | 'redirect';
  annotation: string | null;
  cx: number;
  cy: number;
}

function summarizeMarks(marks: Mark[]): MarkSummary[] {
  return marks.map((m) => {
    const cx = m.path.reduce((s, p) => s + p.x, 0) / m.path.length;
    const cy = m.path.reduce((s, p) => s + p.y, 0) / m.path.length;
    return {
      type: m.type,
      annotation: m.annotation,
      cx: Math.round(cx * 100) / 100,
      cy: Math.round(cy * 100) / 100,
    };
  });
}

function computeHash(masterPrompt: string, marks: Mark[], adjustments: Adjustments): string {
  return JSON.stringify({
    masterPrompt,
    marks: summarizeMarks(marks),
    adjustments,
  });
}

function hasActiveAdjustments(adj: Adjustments): boolean {
  return (Object.values(adj) as number[]).some((v) => v < 35 || v > 65);
}

interface UseRefineInterpretationArgs {
  masterPrompt: string;
  marks: Mark[];
  adjustments: Adjustments;
}

interface UseRefineInterpretationResult {
  refinePrompt: string;
  isInterpreting: boolean;
  editedByUser: boolean;
  /** True when there's nothing meaningful to interpret (no remove marks, no adjustments). */
  isEmpty: boolean;
  onEdit: (value: string) => void;
  onRefresh: () => void;
}

export function useRefineInterpretation({
  masterPrompt,
  marks,
  adjustments,
}: UseRefineInterpretationArgs): UseRefineInterpretationResult {
  const [refinePrompt, setRefinePrompt] = useState('');
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
  const inflightCountRef = useRef(0);

  const removeCount = marks.filter((m) => m.type === 'remove').length;
  const isEmpty = removeCount === 0 && !hasActiveAdjustments(adjustments);

  const run = useCallback(
    (
      hash: string,
      snapshot: { masterPrompt: string; marks: Mark[]; adjustments: Adjustments }
    ) => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      const timeoutHandle = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

      inflightCountRef.current++;
      setIsInterpreting(true);

      (async () => {
        try {
          const res = await fetch('/api/interpret/refine', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              masterPrompt: snapshot.masterPrompt,
              marks: summarizeMarks(snapshot.marks),
              adjustments: snapshot.adjustments,
            }),
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
            if (
              !editedByUserRef.current &&
              abortRef.current === controller &&
              lastHashRef.current === hash
            ) {
              setRefinePrompt(accumulated);
            }
          }
          if (accumulated.trim().length > 0) {
            cacheRef.current.set(hash, accumulated);
          }
        } catch (err) {
          // See useInterpretation — aborted requests can surface as
          // TypeError('Failed to fetch') in Chrome. Both mean intentional cancel.
          if (!controller.signal.aborted && (err as Error).name !== 'AbortError') {
            console.error('refine interpret failed', err);
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

    if (isEmpty) {
      lastHashRef.current = '';
      setRefinePrompt('');
      return;
    }

    const hash = computeHash(masterPrompt, marks, adjustments);
    if (hash === lastHashRef.current) return;
    lastHashRef.current = hash;

    abortRef.current?.abort();

    const cached = cacheRef.current.get(hash);
    if (cached) {
      setRefinePrompt(cached);
      return;
    }

    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      run(hash, { masterPrompt, marks, adjustments });
    }, DEBOUNCE_MS);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [masterPrompt, marks, adjustments, isEmpty, run]);

  const onEdit = useCallback((value: string) => {
    setRefinePrompt(value);
    setEditedByUser(true);
  }, []);

  const onRefresh = useCallback(() => {
    setEditedByUser(false);
    lastHashRef.current = '';
    setRefinePrompt('');
  }, []);

  // Default to NEUTRAL if ever called with missing adjustments (defensive).
  void NEUTRAL_ADJUSTMENTS;

  return {
    refinePrompt,
    isInterpreting,
    editedByUser,
    isEmpty,
    onEdit,
    onRefresh,
  };
}
