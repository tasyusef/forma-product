'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';

export type LoadingKind = 'generate-fast' | 'generate-sketch' | 'refine';

interface GenerationLoaderProps {
  theme: 'light' | 'dark';
  /** Which backend path is running — drives stage pacing and the expected-time hint. */
  kind?: LoadingKind;
  /** Optional override label (takes precedence over kind-driven stages). */
  label?: string;
}

interface Stage {
  at: number;
  text: string;
}

// Stage timings are calibrated to each path's real latency so the copy
// doesn't promise "finalizing" while Fal is still queued on a cold model.
const STAGES_FAST: Stage[] = [
  { at: 0, text: 'Rendering image' },
  { at: 1500, text: 'Finalizing' },
];

const STAGES_SKETCH: Stage[] = [
  { at: 0, text: 'Interpreting composition' },
  { at: 4000, text: 'Rendering base image' },
  { at: 12000, text: 'Detailing scene' },
  { at: 22000, text: 'Finalizing' },
  { at: 40000, text: 'Still working — model is queued' },
];

const STAGES_REFINE: Stage[] = [
  { at: 0, text: 'Building mask' },
  { at: 1500, text: 'Inpainting marked regions' },
  { at: 12000, text: 'Blending keep regions' },
  { at: 25000, text: 'Finalizing' },
  { at: 40000, text: 'Still working — model is queued' },
];

const HINT_BY_KIND: Record<LoadingKind, string> = {
  'generate-fast': 'Usually ~2s',
  'generate-sketch': 'Sketch-conditioned · ~20s warm, longer cold',
  'refine': 'Inpainting · ~20s warm, longer cold',
};

// Reassurance copy for the cold-boot path. Appears only on sketch/refine —
// fast text-to-image almost always completes before the 18s threshold, so
// showing this there would be a lie.
const COLD_BOOT_HINT_KINDS = new Set<LoadingKind>(['generate-sketch', 'refine']);
const COLD_BOOT_HINT_DELAY_MS = 18_000;

function stagesFor(kind: LoadingKind): Stage[] {
  if (kind === 'generate-fast') return STAGES_FAST;
  if (kind === 'refine') return STAGES_REFINE;
  return STAGES_SKETCH;
}

export default function GenerationLoader({ theme, kind = 'generate-sketch', label }: GenerationLoaderProps) {
  const stages = stagesFor(kind);
  const [stageIndex, setStageIndex] = useState(0);
  const [showColdBootHint, setShowColdBootHint] = useState(false);

  useEffect(() => {
    setStageIndex(0);
    const timers = stages.slice(1).map((stage, i) =>
      window.setTimeout(() => setStageIndex(i + 1), stage.at)
    );
    return () => timers.forEach((t) => window.clearTimeout(t));
  }, [stages]);

  // Cold-boot reassurance bubble. Only mount the timer for kinds where it
  // makes sense; reset if the kind changes so a refine after a generate
  // gets its own timer (and doesn't inherit a stale visible state).
  useEffect(() => {
    setShowColdBootHint(false);
    if (!COLD_BOOT_HINT_KINDS.has(kind)) return;
    const t = window.setTimeout(() => setShowColdBootHint(true), COLD_BOOT_HINT_DELAY_MS);
    return () => window.clearTimeout(t);
  }, [kind]);

  const currentStage = label ? label : stages[stageIndex].text;
  const hint = HINT_BY_KIND[kind];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 'var(--space-6)',
        minHeight: 0,
      }}
    >
      {/* Mark with orbiting progress ring */}
      <div
        style={{
          position: 'relative',
          width: 96,
          height: 96,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* Slow rotating ring — implied progress */}
        <motion.svg
          width={96}
          height={96}
          viewBox="0 0 96 96"
          animate={{ rotate: 360 }}
          transition={{ duration: 3.2, repeat: Infinity, ease: 'linear' }}
          style={{ position: 'absolute', inset: 0 }}
        >
          <circle
            cx={48}
            cy={48}
            r={44}
            fill="none"
            stroke="var(--border)"
            strokeWidth={1}
          />
          <circle
            cx={48}
            cy={48}
            r={44}
            fill="none"
            stroke="var(--text-primary)"
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeDasharray="48 228"
            opacity={0.7}
          />
        </motion.svg>

        {/* Forma mark, counter-rotating subtly so it feels alive */}
        <motion.img
          src={theme === 'dark' ? '/assets/forma-mark-white.svg' : '/assets/forma-mark-black.svg'}
          alt=""
          animate={{ rotate: -360 }}
          transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
          style={{ width: 40, height: 40, opacity: 0.85, position: 'relative' }}
        />
      </div>

      {/* Stage label — fades between phases */}
      <div style={{ height: 20, display: 'flex', alignItems: 'center' }}>
        <AnimatePresence mode="wait">
          <motion.span
            key={currentStage}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            style={{
              fontSize: 'var(--text-sm)',
              color: 'var(--text-secondary)',
              letterSpacing: '-0.01em',
              fontFamily: 'var(--font-sans)',
            }}
          >
            {currentStage}
            <motion.span
              animate={{ opacity: [0.2, 1, 0.2] }}
              transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
              style={{ marginLeft: 2 }}
            >
              …
            </motion.span>
          </motion.span>
        </AnimatePresence>
      </div>

      {/* Tiny hint — removes ambiguity, sets expectation */}
      <motion.span
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2, duration: 0.4 }}
        style={{
          fontSize: 10,
          color: 'var(--text-tertiary)',
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          fontFamily: 'var(--font-mono)',
        }}
      >
        {hint}
      </motion.span>

      {/* Cold-boot reassurance — fades in only once we've been loading long
         enough that a warm path would have already returned. Sentence-case
         copy to read as a human note rather than a second system label. */}
      <AnimatePresence>
        {showColdBootHint && (
          <motion.span
            key="cold-boot-hint"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            style={{
              marginTop: 'calc(var(--space-2) * -1)',
              maxWidth: 340,
              textAlign: 'center',
              fontSize: 'var(--text-xs)',
              color: 'var(--text-tertiary)',
              lineHeight: 1.5,
              fontFamily: 'var(--font-sans)',
            }}
          >
            First image after a break can take a minute or two — the model is warming up. It&apos;ll be quick after this.
          </motion.span>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
