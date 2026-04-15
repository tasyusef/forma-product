'use client';

import { useState, useRef, useCallback } from 'react';
import { X } from '@phosphor-icons/react';
import { SketchShape } from '@/lib/types';

interface ShapeBlockProps {
  shape: SketchShape;
  canvasWidth: number;
  canvasHeight: number;
  onUpdate: (shape: SketchShape) => void;
  onDelete: (id: string) => void;
}

const MIN_SIZE = 0.05;

type Corner = 'nw' | 'ne' | 'sw' | 'se';

const HANDLE_CURSORS: Record<Corner, string> = {
  nw: 'nwse-resize',
  ne: 'nesw-resize',
  sw: 'nesw-resize',
  se: 'nwse-resize',
};

const HANDLE_POSITIONS: Record<Corner, React.CSSProperties> = {
  nw: { top: -4, left: -4 },
  ne: { top: -4, right: -4 },
  sw: { bottom: -4, left: -4 },
  se: { bottom: -4, right: -4 },
};

export default function ShapeBlock({ shape, canvasWidth, canvasHeight, onUpdate, onDelete }: ShapeBlockProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const dragStart = useRef({ x: 0, y: 0, shapeX: 0, shapeY: 0, shapeW: 0, shapeH: 0 });

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (isResizing) return;
      e.stopPropagation();
      setIsDragging(true);
      dragStart.current = {
        x: e.clientX,
        y: e.clientY,
        shapeX: shape.x,
        shapeY: shape.y,
        shapeW: shape.width,
        shapeH: shape.height,
      };

      const handleMove = (me: MouseEvent) => {
        const dx = (me.clientX - dragStart.current.x) / canvasWidth;
        const dy = (me.clientY - dragStart.current.y) / canvasHeight;
        onUpdate({
          ...shape,
          x: Math.max(0, Math.min(1 - shape.width, dragStart.current.shapeX + dx)),
          y: Math.max(0, Math.min(1 - shape.height, dragStart.current.shapeY + dy)),
        });
      };

      const handleUp = () => {
        setIsDragging(false);
        window.removeEventListener('mousemove', handleMove);
        window.removeEventListener('mouseup', handleUp);
      };

      window.addEventListener('mousemove', handleMove);
      window.addEventListener('mouseup', handleUp);
    },
    [shape, canvasWidth, canvasHeight, onUpdate, isResizing]
  );

  const handleResizeDown = useCallback(
    (e: React.MouseEvent, corner: Corner) => {
      e.stopPropagation();
      e.preventDefault();
      setIsResizing(true);
      dragStart.current = {
        x: e.clientX,
        y: e.clientY,
        shapeX: shape.x,
        shapeY: shape.y,
        shapeW: shape.width,
        shapeH: shape.height,
      };

      const handleMove = (me: MouseEvent) => {
        const dx = (me.clientX - dragStart.current.x) / canvasWidth;
        const dy = (me.clientY - dragStart.current.y) / canvasHeight;
        const { shapeX, shapeY, shapeW, shapeH } = dragStart.current;

        let newX = shapeX, newY = shapeY, newW = shapeW, newH = shapeH;

        if (corner === 'se') {
          newW = Math.max(MIN_SIZE, shapeW + dx);
          newH = Math.max(MIN_SIZE, shapeH + dy);
        } else if (corner === 'sw') {
          newW = Math.max(MIN_SIZE, shapeW - dx);
          newH = Math.max(MIN_SIZE, shapeH + dy);
          newX = shapeX + shapeW - newW;
        } else if (corner === 'ne') {
          newW = Math.max(MIN_SIZE, shapeW + dx);
          newH = Math.max(MIN_SIZE, shapeH - dy);
          newY = shapeY + shapeH - newH;
        } else if (corner === 'nw') {
          newW = Math.max(MIN_SIZE, shapeW - dx);
          newH = Math.max(MIN_SIZE, shapeH - dy);
          newX = shapeX + shapeW - newW;
          newY = shapeY + shapeH - newH;
        }

        newX = Math.max(0, Math.min(1 - MIN_SIZE, newX));
        newY = Math.max(0, Math.min(1 - MIN_SIZE, newY));

        onUpdate({ ...shape, x: newX, y: newY, width: newW, height: newH });
      };

      const handleUp = () => {
        setIsResizing(false);
        window.removeEventListener('mousemove', handleMove);
        window.removeEventListener('mouseup', handleUp);
      };

      window.addEventListener('mousemove', handleMove);
      window.addEventListener('mouseup', handleUp);
    },
    [shape, canvasWidth, canvasHeight, onUpdate]
  );

  const figureClip = 'polygon(50% 0%, 65% 0%, 72% 8%, 72% 22%, 65% 30%, 58% 30%, 80% 38%, 85% 45%, 85% 55%, 100% 58%, 100% 70%, 85% 70%, 85% 100%, 62% 100%, 62% 55%, 55% 45%, 45% 45%, 38% 55%, 38% 100%, 15% 100%, 15% 70%, 0% 70%, 0% 58%, 15% 55%, 15% 45%, 20% 38%, 42% 30%, 35% 30%, 28% 22%, 28% 8%, 35% 0%)';

  return (
    <div
      style={{
        position: 'absolute',
        left: shape.x * canvasWidth,
        top: shape.y * canvasHeight,
        width: shape.width * canvasWidth,
        height: shape.height * canvasHeight,
        userSelect: 'none',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Visual shape */}
      <div
        onMouseDown={handleMouseDown}
        onDoubleClick={(e) => {
          e.stopPropagation();
          setIsEditing(true);
        }}
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(0,0,0,0.08)',
          border: '1.5px solid rgba(0,0,0,0.15)',
          cursor: isDragging ? 'grabbing' : 'grab',
          borderRadius: shape.type === 'ellipse' ? '50%' : shape.type === 'figure' ? '40% 40% 5% 5% / 20% 20% 5% 5%' : 'var(--radius-sm)',
          clipPath: shape.type === 'figure' ? figureClip : undefined,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: isDragging || isResizing ? 'none' : 'box-shadow 120ms var(--ease-out)',
          boxShadow: isHovered ? 'var(--shadow-sm)' : 'none',
        }}
      >
        {/* Label */}
        {shape.label && !isEditing && (
          <span
            style={{
              fontSize: 'var(--text-xs)',
              color: 'var(--text-secondary)',
              background: 'var(--bg-elevated)',
              padding: '2px 6px',
              borderRadius: 'var(--radius-sm)',
              pointerEvents: 'none',
              maxWidth: '90%',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {shape.label}
          </span>
        )}

        {/* Inline label edit */}
        {isEditing && (
          <input
            autoFocus
            defaultValue={shape.label}
            placeholder="What is this?"
            onBlur={(e) => {
              onUpdate({ ...shape, label: e.target.value });
              setIsEditing(false);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                onUpdate({ ...shape, label: (e.target as HTMLInputElement).value });
                setIsEditing(false);
              }
            }}
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            style={{
              fontSize: 'var(--text-xs)',
              background: 'var(--bg-base)',
              border: '1px solid var(--border-strong)',
              borderRadius: 'var(--radius-sm)',
              padding: '2px 6px',
              width: '80%',
              textAlign: 'center',
              color: 'var(--text-primary)',
              outline: 'none',
            }}
          />
        )}
      </div>

      {/* Delete button */}
      {isHovered && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(shape.id);
          }}
          onMouseDown={(e) => e.stopPropagation()}
          style={{
            position: 'absolute',
            top: -6,
            right: -6,
            width: 18,
            height: 18,
            borderRadius: 'var(--radius-full)',
            background: 'var(--text-primary)',
            color: 'var(--text-inverse)',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            padding: 0,
            zIndex: 2,
          }}
        >
          <X size={12} weight="regular" />
        </button>
      )}

      {/* Resize handles */}
      {isHovered && !isEditing && (
        <>
          {(['nw', 'ne', 'sw', 'se'] as Corner[]).map((corner) => (
            <div
              key={corner}
              onMouseDown={(e) => handleResizeDown(e, corner)}
              style={{
                position: 'absolute',
                ...HANDLE_POSITIONS[corner],
                width: 8,
                height: 8,
                borderRadius: 'var(--radius-full)',
                background: '#FFFFFF',
                border: '1.5px solid rgba(0,0,0,0.3)',
                cursor: HANDLE_CURSORS[corner],
                zIndex: 2,
                boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
              }}
            />
          ))}
        </>
      )}
    </div>
  );
}
