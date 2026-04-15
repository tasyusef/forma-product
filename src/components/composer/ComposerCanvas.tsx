'use client';

import { useRef, useCallback, useEffect, useState } from 'react';
import { SketchShape, Point, AspectRatio } from '@/lib/types';
import ShapeBlock from './ShapeBlock';

const ASPECT_RATIOS: Record<AspectRatio, number> = {
  '1:1': 1,
  '3:2': 3 / 2,
  '16:9': 16 / 9,
  '9:16': 9 / 16,
};

interface ComposerCanvasProps {
  aspectRatio: AspectRatio;
  shapes: SketchShape[];
  freehandPaths: Point[][];
  drawMode: boolean;
  onUpdateShapes: (shapes: SketchShape[]) => void;
  onUpdateFreehand: (paths: Point[][]) => void;
  canvasRef: React.RefObject<HTMLCanvasElement>;
}

export default function ComposerCanvas({
  aspectRatio,
  shapes,
  freehandPaths,
  drawMode,
  onUpdateShapes,
  onUpdateFreehand,
  canvasRef,
}: ComposerCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 512, height: 512 });
  const [isDrawing, setIsDrawing] = useState(false);
  const currentPathRef = useRef<Point[]>([]);

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

  const redrawFreehand = useCallback(
    (extraPath?: Point[]) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const allPaths = extraPath ? [...freehandPaths, extraPath] : freehandPaths;
      allPaths.forEach((path) => {
        if (path.length < 2) return;
        ctx.strokeStyle = 'rgba(0,0,0,0.4)';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(path[0].x * canvas.width, path[0].y * canvas.height);
        for (let i = 1; i < path.length; i++) {
          ctx.lineTo(path[i].x * canvas.width, path[i].y * canvas.height);
        }
        ctx.stroke();
      });
    },
    [canvasRef, freehandPaths]
  );

  useEffect(() => {
    if (canvasRef.current) {
      canvasRef.current.width = canvasSize.width;
      canvasRef.current.height = canvasSize.height;
      redrawFreehand();
    }
  }, [canvasSize, canvasRef, redrawFreehand]);

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
      redrawFreehand(currentPathRef.current);
    },
    [isDrawing, drawMode, getPoint, redrawFreehand]
  );

  const handleCanvasMouseUp = useCallback(() => {
    if (!isDrawing) return;
    setIsDrawing(false);
    if (currentPathRef.current.length > 1) {
      onUpdateFreehand([...freehandPaths, currentPathRef.current]);
    }
    currentPathRef.current = [];
  }, [isDrawing, freehandPaths, onUpdateFreehand]);

  const handleShapeUpdate = useCallback(
    (updated: SketchShape) => {
      onUpdateShapes(shapes.map((s) => (s.id === updated.id ? updated : s)));
    },
    [shapes, onUpdateShapes]
  );

  const handleShapeDelete = useCallback(
    (id: string) => {
      onUpdateShapes(shapes.filter((s) => s.id !== id));
    },
    [shapes, onUpdateShapes]
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
        {/* Freehand canvas */}
        <canvas
          ref={canvasRef}
          onMouseDown={handleCanvasMouseDown}
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

        {/* Shape blocks */}
        {shapes.map((shape) => (
          <ShapeBlock
            key={shape.id}
            shape={shape}
            canvasWidth={canvasSize.width}
            canvasHeight={canvasSize.height}
            onUpdate={handleShapeUpdate}
            onDelete={handleShapeDelete}
          />
        ))}

        {/* Placeholder text */}
        {shapes.length === 0 && freehandPaths.length === 0 && (
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
