'use client';

import { useRef, useCallback, useEffect, useState, useMemo } from 'react';
import { SketchShape, Point, AspectRatio } from '@/lib/types';
import ShapeBlock from './ShapeBlock';

const ASPECT_RATIOS: Record<AspectRatio, number> = {
  '3:2': 3 / 2,
};

function generateId(): string {
  return Math.random().toString(36).substring(2, 10);
}

function computeBbox(path: Point[]): { x: number; y: number; width: number; height: number } {
  if (path.length === 0) return { x: 0, y: 0, width: 0, height: 0 };
  let minX = path[0].x, minY = path[0].y, maxX = path[0].x, maxY = path[0].y;
  for (const p of path) {
    if (p.x < minX) minX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.x > maxX) maxX = p.x;
    if (p.y > maxY) maxY = p.y;
  }
  return { x: minX, y: minY, width: Math.max(0.001, maxX - minX), height: Math.max(0.001, maxY - minY) };
}

interface ComposerCanvasProps {
  aspectRatio: AspectRatio;
  shapes: SketchShape[];
  drawMode: boolean;
  selectedIds: string[];
  onUpdateShapes: (shapes: SketchShape[]) => void;
  onSetSelectedIds: (ids: string[]) => void;
  canvasRef: React.RefObject<HTMLCanvasElement>;
}

export default function ComposerCanvas({
  aspectRatio,
  shapes,
  drawMode,
  selectedIds,
  onUpdateShapes,
  onSetSelectedIds,
  canvasRef,
}: ComposerCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 512, height: 341 });
  const [isDrawing, setIsDrawing] = useState(false);
  const currentPathRef = useRef<Point[]>([]);

  // Split shapes by type — strokes render on canvas, others render as ShapeBlocks.
  const { strokes, blockShapes } = useMemo(() => {
    const strokes: SketchShape[] = [];
    const blockShapes: SketchShape[] = [];
    for (const s of shapes) {
      if (s.type === 'stroke') strokes.push(s);
      else blockShapes.push(s);
    }
    return { strokes, blockShapes };
  }, [shapes]);

  useEffect(() => {
    const updateSize = () => {
      if (!containerRef.current) return;
      const containerW = containerRef.current.clientWidth;
      const maxH = containerRef.current.clientHeight;
      const ratio = ASPECT_RATIOS[aspectRatio];
      let w = containerW;
      let h = w / ratio;
      if (h > maxH) {
        h = maxH;
        w = h * ratio;
      }
      setCanvasSize({ width: Math.round(w), height: Math.round(h) });
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, [aspectRatio]);

  const redrawStrokes = useCallback(
    (extraPath?: Point[]) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const strokeColor =
        getComputedStyle(document.documentElement)
          .getPropertyValue('--shape-stroke')
          .trim() || 'rgba(0,0,0,0.45)';
      const allPaths: Point[][] = strokes.map((s) => s.path || []);
      if (extraPath) allPaths.push(extraPath);
      for (const path of allPaths) {
        if (path.length < 2) continue;
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(path[0].x * canvas.width, path[0].y * canvas.height);
        for (let i = 1; i < path.length; i++) {
          ctx.lineTo(path[i].x * canvas.width, path[i].y * canvas.height);
        }
        ctx.stroke();
      }
    },
    [canvasRef, strokes]
  );

  useEffect(() => {
    if (canvasRef.current) {
      canvasRef.current.width = canvasSize.width;
      canvasRef.current.height = canvasSize.height;
      redrawStrokes();
    }
  }, [canvasSize, canvasRef, redrawStrokes]);

  const getPoint = useCallback(
    (e: React.MouseEvent): Point => {
      const canvas = canvasRef.current;
      if (!canvas) return { x: 0, y: 0 };
      const rect = canvas.getBoundingClientRect();
      return {
        x: (e.clientX - rect.left) / rect.width,
        y: (e.clientY - rect.top) / rect.height,
      };
    },
    [canvasRef]
  );

  const handleCanvasMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (!drawMode) return;
      setIsDrawing(true);
      currentPathRef.current = [getPoint(e)];
    },
    [drawMode, getPoint]
  );

  const handleCanvasMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDrawing || !drawMode) return;
      currentPathRef.current.push(getPoint(e));
      redrawStrokes(currentPathRef.current);
    },
    [isDrawing, drawMode, getPoint, redrawStrokes]
  );

  const handleCanvasMouseUp = useCallback(() => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const path = currentPathRef.current;
    if (path.length > 1) {
      const bbox = computeBbox(path);
      const newStroke: SketchShape = {
        id: generateId(),
        type: 'stroke',
        ...bbox,
        label: '',
        path: [...path],
      };
      onUpdateShapes([...shapes, newStroke]);
    }
    currentPathRef.current = [];
  }, [isDrawing, shapes, onUpdateShapes]);

  const handleShapeUpdate = useCallback(
    (updated: SketchShape) => {
      onUpdateShapes(shapes.map((s) => (s.id === updated.id ? updated : s)));
    },
    [shapes, onUpdateShapes]
  );

  const handleShapeDelete = useCallback(
    (id: string) => {
      onUpdateShapes(shapes.filter((s) => s.id !== id));
      onSetSelectedIds(selectedIds.filter((s) => s !== id));
    },
    [shapes, onUpdateShapes, onSetSelectedIds, selectedIds]
  );

  const handleShapeSelect = useCallback(
    (id: string, opts: { alt: boolean; shift: boolean; clientX: number; clientY: number }) => {
      if (opts.alt) {
        // Cycle to the next shape beneath the clicked point. Order candidates
        // top-of-stack first (reverse of shapes array).
        const canvas = canvasRef.current;
        const rect = canvas?.getBoundingClientRect();
        if (!rect) {
          onSetSelectedIds([id]);
          return;
        }
        const nx = (opts.clientX - rect.left) / rect.width;
        const ny = (opts.clientY - rect.top) / rect.height;
        const candidates = shapes
          .filter(
            (s) =>
              s.type !== 'stroke' &&
              nx >= s.x &&
              nx <= s.x + s.width &&
              ny >= s.y &&
              ny <= s.y + s.height
          )
          .reverse();
        if (candidates.length === 0) {
          onSetSelectedIds([]);
          return;
        }
        const currentIdx = candidates.findIndex((c) => selectedIds.includes(c.id));
        const next = candidates[(currentIdx + 1) % candidates.length];
        onSetSelectedIds([next.id]);
        return;
      }
      if (opts.shift) {
        onSetSelectedIds(
          selectedIds.includes(id) ? selectedIds.filter((x) => x !== id) : [...selectedIds, id]
        );
        return;
      }
      onSetSelectedIds([id]);
    },
    [shapes, selectedIds, onSetSelectedIds, canvasRef]
  );

  const clearSelectionOnEmptyClick = useCallback(
    (e: React.MouseEvent) => {
      // Only clear when mousedown lands on the canvas element itself, not a
      // child shape (shape mousedowns stopPropagation before they reach here).
      if (e.target === e.currentTarget && selectedIds.length > 0) {
        onSetSelectedIds([]);
      }
    },
    [selectedIds, onSetSelectedIds]
  );

  return (
    <div
      ref={containerRef}
      style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 0,
      }}
    >
      <div
        style={{
          position: 'relative',
          width: canvasSize.width,
          height: canvasSize.height,
          background: 'var(--canvas-bg)',
          border: '1.5px dashed var(--border)',
          borderRadius: 'var(--canvas-radius)',
          overflow: 'hidden',
        }}
      >
        {/* Stroke canvas — renders all stroke shapes + in-progress stroke */}
        <canvas
          ref={canvasRef}
          onMouseDown={(e) => {
            if (drawMode) {
              handleCanvasMouseDown(e);
            } else {
              clearSelectionOnEmptyClick(e);
            }
          }}
          onMouseMove={handleCanvasMouseMove}
          onMouseUp={handleCanvasMouseUp}
          onMouseLeave={handleCanvasMouseUp}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            cursor: drawMode ? 'crosshair' : 'default',
            zIndex: drawMode ? 10 : 0,
          }}
        />

        {/* Block shapes (rect, ellipse, figure, freeform, group) */}
        {blockShapes.map((shape) => (
          <ShapeBlock
            key={shape.id}
            shape={shape}
            canvasWidth={canvasSize.width}
            canvasHeight={canvasSize.height}
            isSelected={selectedIds.includes(shape.id)}
            onUpdate={handleShapeUpdate}
            onDelete={handleShapeDelete}
            onSelect={handleShapeSelect}
          />
        ))}

        {/* Placeholder text */}
        {shapes.length === 0 && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              pointerEvents: 'none',
              zIndex: 5,
            }}
          >
            <span
              style={{
                fontSize: 'var(--text-base)',
                color: 'var(--text-tertiary)',
                fontStyle: 'italic',
              }}
            >
              Sketch your composition
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
