'use client';

import { useRef, useEffect } from 'react';
import { Round } from '@/lib/types';
import RoundThumbnail, { NewRoundTile } from './RoundThumbnail';

interface IterationStripProps {
  rounds: Round[];
  activeRoundIndex: number;
  onSelectRound: (index: number) => void;
  onNewRound: () => void;
}

export default function IterationStrip({ rounds, activeRoundIndex, onSelectRound, onNewRound }: IterationStripProps) {
  const stripRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (stripRef.current) {
      const activeThumb = stripRef.current.children[activeRoundIndex] as HTMLElement;
      if (activeThumb) {
        activeThumb.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      }
    }
  }, [activeRoundIndex]);

  return (
    <div
      style={{
        height: 'auto',
        background: 'var(--strip-bg)',
        border: '1px solid var(--strip-border)',
        borderRadius: 'var(--radius-lg)',
        display: 'flex',
        alignItems: 'center',
        flexShrink: 0,
        position: 'relative',
        zIndex: 30,
      }}
    >
      <div
        ref={stripRef}
        className="iteration-strip"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--strip-gap)',
          padding: 'var(--space-4)',
          width: '100%',
        }}
      >
        {rounds.map((round, i) => (
          <RoundThumbnail
            key={round.id}
            label={round.type === 'sketch' ? 'Sketch' : `Round ${round.index}`}
            thumbnailUrl={round.thumbnailUrl}
            isActive={i === activeRoundIndex}
            onClick={() => onSelectRound(i)}
          />
        ))}
        <NewRoundTile onClick={onNewRound} />
      </div>
    </div>
  );
}
