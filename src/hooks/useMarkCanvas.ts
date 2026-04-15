'use client';

import { useRef, useState, useCallback, useEffect } from 'react';
import { Mark, MarkTool, Point } from '@/lib/types';

function generateId(): string {
  return Math.random().toString(36).substring(2, 10);
}

const MARK_COLORS = {
  keep: { stroke: '#16A34A', fill: 'rgba(34, 197, 94, 0.08)', main: 'rgba(34, 197, 94, 0.65)' },
  remove: { stroke: '#DC2626', fill: 'rgba(239, 68, 68, 0.08)', main: 'rgba(239, 68, 68, 0.65)' },
  redirect: { stroke: '#2563EB', fill: 'rgba(59, 130, 246, 0.08)', main: 'rgba(59, 130, 246, 0.65)' },
};

function drawArrow(ctx: CanvasRenderingContext2D, from: Point, to: Point, color: string) {
  const headLen = 14;
  const angle = Math.atan2(to.y - from.y, to.x - from.x);
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(from.x, from.y);
  ctx.lineTo(to.x, to.y);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(to.x, to.y);
  ctx.lineTo(to.x - headLen * Math.cos(angle - Math.PI / 6), to.y - headLen * Math.sin(angle - Math.PI / 6));
  ctx.moveTo(to.x, to.y);
  ctx.lineTo(to.x - headLen * Math.cos(angle + Math.PI / 6), to.y - headLen * Math.sin(angle + Math.PI / 6));
  ctx.stroke();
}

function drawMark(ctx: CanvasRenderingContext2D, mark: Mark, canvasW: number, canvasH: number, opacity: number = 1) {
  const colors = MARK_COLORS[mark.type];
  ctx.globalAlpha = opacity;

  if (mark.type === 'redirect' && mark.path.length >= 2) {
    const from = { x: mark.path[0].x * canvasW, y: mark.path[0].y * canvasH };
    const to = { x: mark.path[mark.path.length - 1].x * canvasW, y: mark.path[mark.path.length - 1].y * canvasH };
    drawArrow(ctx, from, to, colors.stroke);
  } else if (mark.path.length > 1) {
    ctx.strokeStyle = colors.stroke;
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(mark.path[0].x * canvasW, mark.path[0].y * canvasH);
    for (let i = 1; i < mark.path.length; i++) {
      ctx.lineTo(mark.path[i].x * canvasW, mark.path[i].y * canvasH);
    }
    if (mark.type === 'keep') {
      ctx.closePath();
    }
    ctx.stroke();

    if (mark.type === 'keep') {
      ctx.fillStyle = colors.fill;
      ctx.fill();
    }
  }

  ctx.globalAlpha = 1;
}

export function useMarkCanvas(marks: Mark[], setMarks: (marks: Mark[]) => void) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [activeTool, setActiveTool] = useState<MarkTool>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const currentPathRef = useRef<Point[]>([]);
  const [undoStack, setUndoStack] = useState<Mark[][]>([]);

  const getCanvasPoint = useCallback((e: React.MouseEvent<HTMLCanvasElement>): Point => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) / rect.width,
      y: (e.clientY - rect.top) / rect.height,
    };
  }, []);

  const redraw = useCallback(
    (persistedMarks?: Mark[], currentRoundMarks?: Mark[], inProgressPath?: Point[], opacity?: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      if (persistedMarks) {
        persistedMarks.forEach((m) => drawMark(ctx, m, w, h, 0.5));
      }

      const marksToRender = currentRoundMarks || marks;
      marksToRender.forEach((m) => drawMark(ctx, m, w, h, opacity || 1));

      if (inProgressPath && inProgressPath.length > 1 && activeTool) {
        const colors = MARK_COLORS[activeTool];
        if (activeTool === 'redirect') {
          const from = { x: inProgressPath[0].x * w, y: inProgressPath[0].y * h };
          const to = { x: inProgressPath[inProgressPath.length - 1].x * w, y: inProgressPath[inProgressPath.length - 1].y * h };
          drawArrow(ctx, from, to, colors.stroke);
        } else {
          ctx.strokeStyle = colors.stroke;
          ctx.lineWidth = 3;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          ctx.beginPath();
          ctx.moveTo(inProgressPath[0].x * w, inProgressPath[0].y * h);
          for (let i = 1; i < inProgressPath.length; i++) {
            ctx.lineTo(inProgressPath[i].x * w, inProgressPath[i].y * h);
          }
          ctx.stroke();
        }
      }
    },
    [marks, activeTool]
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!activeTool) return;
      setIsDrawing(true);
      const point = getCanvasPoint(e);
      currentPathRef.current = [point];
    },
    [activeTool, getCanvasPoint]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!isDrawing || !activeTool) return;
      const point = getCanvasPoint(e);
      currentPathRef.current.push(point);
      redraw(undefined, undefined, currentPathRef.current);
    },
    [isDrawing, activeTool, getCanvasPoint, redraw]
  );

  const handleMouseUp = useCallback(() => {
    if (!isDrawing || !activeTool) return;
    setIsDrawing(false);
    const path = currentPathRef.current;
    if (path.length < 2) {
      currentPathRef.current = [];
      return;
    }
    const newMark: Mark = {
      id: generateId(),
      type: activeTool,
      path: [...path],
      annotation: null,
      persists: activeTool === 'keep',
    };
    setUndoStack((prev) => [...prev, marks]);
    setMarks([...marks, newMark]);
    currentPathRef.current = [];
  }, [isDrawing, activeTool, marks, setMarks]);

  const undo = useCallback(() => {
    if (undoStack.length === 0) return;
    const prev = undoStack[undoStack.length - 1];
    setUndoStack((s) => s.slice(0, -1));
    setMarks(prev);
  }, [undoStack, setMarks]);

  const updateAnnotation = useCallback(
    (markId: string, annotation: string) => {
      setMarks(marks.map((m) => (m.id === markId ? { ...m, annotation } : m)));
    },
    [marks, setMarks]
  );

  const removeMark = useCallback(
    (markId: string) => {
      setMarks(marks.filter((m) => m.id !== markId));
    },
    [marks, setMarks]
  );

  useEffect(() => {
    redraw();
  }, [marks, redraw]);

  return {
    canvasRef,
    activeTool,
    setActiveTool,
    isDrawing,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    undo,
    updateAnnotation,
    removeMark,
    redraw,
    canUndo: undoStack.length > 0,
  };
}
