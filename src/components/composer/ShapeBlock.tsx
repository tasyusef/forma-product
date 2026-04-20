'use client';

import { useState, useRef, useCallback } from 'react';
import { X } from '@phosphor-icons/react';
import { SketchShape } from '@/lib/types';

interface ShapeBlockProps {
  shape: SketchShape;
  canvasWidth: number;
  canvasHeight: number;
  isSelected: boolean;
  onUpdate: (shape: SketchShape) => void;
  onDelete: (id: string) => void;
  onSelect: (
    id: string,
    opts: { alt: boolean; shift: boolean; clientX: number; clientY: number }
  ) => void;
}

const MIN_SIZE = 0.05;

type Corner = 'nw' | 'ne' | 'sw' | 'se';

const HANDLE_CURSORS: Record<Corner, string> = {
  nw: 'nwse-resize',
  ne: 'nesw-resize',
  sw: 'nesw-resize',
  se: 'nwse-resize',
};

// Visual dot size vs the transparent hit zone wrapping it. The hit zone is
// centered on each corner so it pokes halfway outside the shape — easier to
// grab and less likely to be fully covered by an overlapping shape.
const HANDLE_DOT = 8;
const HANDLE_HIT = 20;
const HANDLE_OFFSET = -HANDLE_HIT / 2;

const HANDLE_POSITIONS: Record<Corner, React.CSSProperties> = {
  nw: { top: HANDLE_OFFSET, left: HANDLE_OFFSET },
  ne: { top: HANDLE_OFFSET, right: HANDLE_OFFSET },
  sw: { bottom: HANDLE_OFFSET, left: HANDLE_OFFSET },
  se: { bottom: HANDLE_OFFSET, right: HANDLE_OFFSET },
};

export default function ShapeBlock({
  shape,
  canvasWidth,
  canvasHeight,
  isSelected,
  onUpdate,
  onDelete,
  onSelect,
}: ShapeBlockProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const dragStart = useRef({ x: 0, y: 0, shapeX: 0, shapeY: 0, shapeW: 0, shapeH: 0 });

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (isResizing) return;
      e.stopPropagation();
      onSelect(shape.id, {
        alt: e.altKey,
        shift: e.shiftKey,
        clientX: e.clientX,
        clientY: e.clientY,
      });
      // Alt-click only cycles selection; don't start a drag.
      if (e.altKey) return;
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
        // Allow shapes to extend off-canvas, but keep at least 10% visible so
        // the user can always grab them back.
        const minX = -shape.width + 0.1;
        const maxX = 0.9;
        const minY = -shape.height + 0.1;
        const maxY = 0.9;
        onUpdate({
          ...shape,
          x: Math.max(minX, Math.min(maxX, dragStart.current.shapeX + dx)),
          y: Math.max(minY, Math.min(maxY, dragStart.current.shapeY + dy)),
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
    [shape, canvasWidth, canvasHeight, onUpdate, onSelect, isResizing]
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

        // Off-canvas allowed; keep at least MIN_SIZE of the shape visible.
        newX = Math.max(-newW + MIN_SIZE, Math.min(1 - MIN_SIZE, newX));
        newY = Math.max(-newH + MIN_SIZE, Math.min(1 - MIN_SIZE, newY));

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

  const showAffordances = isHovered || isSelected || isDragging || isResizing;

  return (
    <div
      style={{
        position: 'absolute',
        left: shape.x * canvasWidth,
        top: shape.y * canvasHeight,
        width: shape.width * canvasWidth,
        height: shape.height * canvasHeight,
        userSelect: 'none',
        // Lift the active shape above its overlapping siblings so its handles
        // are reachable even when another shape sits on top in DOM order.
        zIndex: showAffordances ? 2 : 1,
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Visual shape */}
      <div
        onMouseDown={handleMouseDown}
        style={{
          position: 'absolute',
          inset: 0,
          background: 'var(--shape-fill)',
          borderWidth: 1.5,
          borderColor: isSelected ? 'var(--text-primary)' : 'var(--shape-border)',
          borderStyle: shape.type === 'group' ? 'dashed' : 'solid',
          cursor: isDragging ? 'grabbing' : 'grab',
          borderRadius: shape.type === 'ellipse' ? '50%' : shape.type === 'figure' ? '40% 40% 5% 5% / 20% 20% 5% 5%' : 'var(--radius-md)',
          clipPath: shape.type === 'figure' ? figureClip : undefined,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: isDragging || isResizing ? 'none' : 'box-shadow 120ms var(--ease-out), border-color 120ms var(--ease-out)',
          boxShadow: isSelected || isHovered ? 'var(--shadow-sm)' : 'none',
        }}
      >
        {/* Label — display-only on the shape; editing happens in the LayerPanel */}
        {shape.label && (
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
      </div>

      {/* Delete button — centered so it doesn't collide with resize handles */}
      {showAffordances && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(shape.id);
          }}
          onMouseDown={(e) => e.stopPropagation()}
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 22,
            height: 22,
            borderRadius: 'var(--radius-full)',
            background: 'var(--text-primary)',
            color: 'var(--text-inverse)',
            border: '2px solid var(--bg-float)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            padding: 0,
            zIndex: 2,
            boxShadow: '0 1px 4px rgba(0,0,0,0.25)',
          }}
          title="Delete"
        >
          <X size={12} weight="bold" />
        </button>
      )}

      {/* Resize handles */}
      {showAffordances && (
        <>
          {(['nw', 'ne', 'sw', 'se'] as Corner[]).map((corner) => (
            <div
              key={corner}
              onMouseDown={(e) => handleResizeDown(e, corner)}
              style={{
                position: 'absolute',
                ...HANDLE_POSITIONS[corner],
                width: HANDLE_HIT,
                height: HANDLE_HIT,
                cursor: HANDLE_CURSORS[corner],
                zIndex: 3,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <div
                style={{
                  width: HANDLE_DOT,
                  height: HANDLE_DOT,
                  borderRadius: 'var(--radius-full)',
                  background: '#FFFFFF',
                  border: '1.5px solid rgba(0,0,0,0.3)',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
                  pointerEvents: 'none',
                }}
              />
            </div>
          ))}
        </>
      )}
    </div>
  );
}
