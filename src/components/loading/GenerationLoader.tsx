'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';

interface GenerationLoaderProps {
  theme: 'light' | 'dark';
  /** Optional override label (e.g. "Refining") for the refine path. */
  label?: string;
}

/**
 * Time-based stage choreography. Fal doesn't expose real progress, so we
 * rotate through plausible phases to make the wait feel purposeful rather
 * than blank. Stages advance on their own timer; if the API returns early
 * the loader unmounts mid-stage, which is fine.
 */
const STAGES: Array<{ at: number; text: string }> = [
  { at: 0, text: 'Interpreting composition' },
  { at: 2200, text: 'Rendering base image' },
  { at: 5500, text: 'Detailing scene' },
  { at: 9000, text: 'Finalizing' },
];

export default function GenerationLoader({ theme, label }: GenerationLoaderProps) {
  const [stageIndex, setStageIndex] = useState(0);

  useEffect(() => {
    const timers = STAGES.slice(1).map((stage, i) =>
      window.setTimeout(() => setStageIndex(i + 1), stage.at)
    );
    return () => timers.forEach((t) => window.clearTimeout(t));
  }, []);

  const currentStage = label ? label : STAGES[stageIndex].text;

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
        This usually takes 5–10s
      </motion.span>
    </motion.div>
  );
}
