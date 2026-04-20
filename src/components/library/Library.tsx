'use client';

import { motion } from 'framer-motion';
import { Plus, MagnifyingGlass, DownloadSimple, Trash } from '@phosphor-icons/react';
import { useState, useMemo } from 'react';
import { SavedSession } from '@/lib/types';

interface LibraryProps {
  savedSessions: SavedSession[];
  onNewCreation: () => void;
  onOpenSaved: (saved: SavedSession) => void;
  onDownloadSaved: (saved: SavedSession) => void;
  onDeleteSaved: (saved: SavedSession) => void;
}

function formatRelativeDate(ms: number): string {
  const diff = Date.now() - ms;
  const min = 60_000;
  const hour = 60 * min;
  const day = 24 * hour;
  if (diff < min) return 'Just now';
  if (diff < hour) return `${Math.floor(diff / min)}m ago`;
  if (diff < day) return `${Math.floor(diff / hour)}h ago`;
  if (diff < 2 * day) return 'Yesterday';
  if (diff < 7 * day) return `${Math.floor(diff / day)} days ago`;
  if (diff < 30 * day) return `${Math.floor(diff / (7 * day))}w ago`;
  return new Date(ms).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export default function Library({
  savedSessions,
  onNewCreation,
  onOpenSaved,
  onDownloadSaved,
  onDeleteSaved,
}: LibraryProps) {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return savedSessions;
    return savedSessions.filter((p) => p.title.toLowerCase().includes(q));
  }, [query, savedSessions]);

  const counterLabel =
    savedSessions.length === 0
      ? 'No finished work yet'
      : `${savedSessions.length} ${savedSessions.length === 1 ? 'project' : 'projects'}`;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        minHeight: 0,
        padding: 'var(--space-6) var(--space-8)',
        gap: 'var(--space-6)',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 'var(--space-4)',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span
            style={{
              fontSize: 'var(--text-2xl)',
              fontWeight: 'var(--weight-semibold)',
              color: 'var(--text-primary)',
              letterSpacing: '-0.02em',
              lineHeight: 1.1,
            }}
          >
            Your work
          </span>
          <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)' }}>
            {counterLabel}
          </span>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-2)',
            padding: '0 var(--space-3)',
            height: 'var(--btn-height-md)',
            background: 'var(--bg-float)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)',
            width: 280,
            boxShadow: 'var(--shadow-xs)',
          }}
        >
          <MagnifyingGlass size={14} weight="regular" style={{ color: 'var(--text-tertiary)' }} />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search your work"
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              fontSize: 'var(--text-sm)',
              fontFamily: 'var(--font-sans)',
              color: 'var(--text-primary)',
            }}
          />
        </div>
      </div>

      <div
        className="panel-scroll"
        style={{
          flex: 1,
          overflowY: 'auto',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
          gap: 'var(--space-4)',
          alignContent: 'start',
          paddingBottom: 'var(--space-4)',
        }}
      >
        <motion.button
          onClick={onNewCreation}
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.98 }}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0 }}
          style={{
            display: 'flex',
            flexDirection: 'column',
            background: 'var(--bg-float)',
            border: '1.5px dashed var(--border)',
            borderRadius: 'var(--radius-lg)',
            overflow: 'hidden',
            cursor: 'pointer',
            padding: 0,
            textAlign: 'left',
            fontFamily: 'var(--font-sans)',
            transition: 'border-color var(--dur-fast), background-color var(--dur-fast)',
          }}
        >
          <div
            style={{
              aspectRatio: '3 / 2',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'var(--bg-surface)',
            }}
          >
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 'var(--radius-full)',
                background: 'var(--text-primary)',
                color: 'var(--text-inverse)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              <Plus size={22} weight="regular" />
            </div>
          </div>
          <div
            style={{
              padding: 'var(--space-3)',
              display: 'flex',
              flexDirection: 'column',
              gap: 2,
            }}
          >
            <span
              style={{
                fontSize: 'var(--text-sm)',
                fontWeight: 'var(--weight-medium)',
                color: 'var(--text-primary)',
              }}
            >
              New creation
            </span>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>
              Start from a sketch
            </span>
          </div>
        </motion.button>

        {filtered.map((project, i) => {
          const roundCount = project.session.rounds.filter((r) => r.type === 'generation').length;
          const roundLabel = roundCount === 1 ? '1 round' : `${roundCount} rounds`;
          return (
            <motion.div
              key={project.id}
              onClick={() => onOpenSaved(project)}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: (i + 1) * 0.03, ease: [0.16, 1, 0.3, 1] }}
              style={{
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                background: 'var(--bg-float)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-lg)',
                overflow: 'hidden',
                cursor: 'pointer',
                fontFamily: 'var(--font-sans)',
                boxShadow: 'var(--shadow-xs)',
                transition: 'box-shadow var(--dur-fast)',
              }}
            >
              <div
                style={{
                  position: 'relative',
                  aspectRatio: '3 / 2',
                  background: 'var(--bg-surface)',
                  overflow: 'hidden',
                }}
              >
                {project.thumbnailUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={project.thumbnailUrl}
                    alt={project.title}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                  />
                ) : null}

                {/* Hover actions */}
                <div
                  style={{
                    position: 'absolute',
                    top: 'var(--space-2)',
                    right: 'var(--space-2)',
                    display: 'flex',
                    gap: 'var(--space-1)',
                  }}
                >
                  <motion.button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDownloadSaved(project);
                    }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    title="Download final image"
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--bg-float)',
                      border: '1px solid var(--border)',
                      color: 'var(--text-secondary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      padding: 0,
                      boxShadow: 'var(--shadow-xs)',
                    }}
                  >
                    <DownloadSimple size={14} weight="regular" />
                  </motion.button>
                  <motion.button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteSaved(project);
                    }}
                    whileHover={{ scale: 1.05, color: '#EF4444' }}
                    whileTap={{ scale: 0.95 }}
                    title="Delete from library"
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--bg-float)',
                      border: '1px solid var(--border)',
                      color: 'var(--text-secondary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      padding: 0,
                      boxShadow: 'var(--shadow-xs)',
                    }}
                  >
                    <Trash size={14} weight="regular" />
                  </motion.button>
                </div>
              </div>
              <div
                style={{
                  padding: 'var(--space-3)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 2,
                }}
              >
                <span
                  style={{
                    fontSize: 'var(--text-sm)',
                    fontWeight: 'var(--weight-medium)',
                    color: 'var(--text-primary)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {project.title}
                </span>
                <span
                  style={{
                    fontSize: 'var(--text-xs)',
                    color: 'var(--text-tertiary)',
                    display: 'flex',
                    gap: 'var(--space-2)',
                  }}
                >
                  <span>{formatRelativeDate(project.finalizedAt)}</span>
                  <span>·</span>
                  <span>{roundLabel}</span>
                </span>
              </div>
            </motion.div>
          );
        })}

        {savedSessions.length > 0 && filtered.length === 0 && (
          <div
            style={{
              gridColumn: '1 / -1',
              textAlign: 'center',
              padding: 'var(--space-12)',
              color: 'var(--text-tertiary)',
              fontSize: 'var(--text-sm)',
            }}
          >
            No projects match &ldquo;{query}&rdquo;
          </div>
        )}

        {savedSessions.length === 0 && (
          <div
            style={{
              gridColumn: '1 / -1',
              textAlign: 'center',
              padding: 'var(--space-12) var(--space-4)',
              color: 'var(--text-tertiary)',
              fontSize: 'var(--text-sm)',
              fontStyle: 'italic',
            }}
          >
            Finish a creation to see it here.
          </div>
        )}
      </div>
    </motion.div>
  );
}
