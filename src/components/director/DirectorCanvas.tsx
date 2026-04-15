'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Mark, MarkTool, Point } from '@/lib/types';
import { ChatCircle, ChatCircleDots } from '@phosphor-icons/react';
import AnnotationPopover from './AnnotationPopover';

const MARK_COLORS: Record<string, { stroke: string; fill: string }> = {
  keep: { stroke: '#16A34A', fill: 'rgba(34, 197, 94, 0.08)' },
  remove: { stroke: '#DC2626', fill: 'rgba(239, 68, 68, 0.08)' },
  redirect: { stroke: '#2563EB', fill: 'rgba(59, 130, 246, 0.08)' },
};

interface DirectorCanvasProps {
  imageUrl: string;
  marks: Mark[];
  activeTool: MarkTool;
  onAddMark: (mark: Mark) => void;
  onUpdateAnnotation: (markId: string, annotation: string) => void;
  persistedMarks: Mark[];
  showAnnotatedOverlay: boolean;
  priorMarks: Mark[];
  readOnly: boolean;
}

function drawArrow(ctx: CanvasRenderingContext2D, from: Point, to: Point) {
  const headLen = 14;
  const angle = Math.atan2(to.y - from.y, to.x - from.x);
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

function drawMarkOnCanvas(ctx: CanvasRenderingContext2D, mark: Mark, w: number, h: number, opacity: number = 1) {
  const colors = MARK_COLORS[mark.type];
  ctx.globalAlpha = opacity;
  ctx.strokeStyle = colors.stroke;
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  if (mark.type === 'redirect' && mark.path.length >= 2) {
    const from = { x: mark.path[0].x * w, y: mark.path[0].y * h };
    const to = { x: mark.path[mark.path.length - 1].x * w, y: mark.path[mark.path.length - 1].y * h };
    drawArrow(ctx, from, to);
  } else if (mark.path.length > 1) {
    ctx.beginPath();
    ctx.moveTo(mark.path[0].x * w, mark.path[0].y * h);
    for (let i = 1; i < mark.path.length; i++) {
      ctx.lineTo(mark.path[i].x * w, mark.path[i].y * h);
    }
    if (mark.type === 'keep') ctx.closePath();
    ctx.stroke();
    if (mark.type === 'keep') {
      ctx.fillStyle = colors.fill;
      ctx.fill();
    }
  }
  ctx.globalAlpha = 1;
}

function getMarkCentroid(mark: Mark, w: number, h: number): { x: number; y: number } {
  const pts = mark.path;
  const cx = pts.reduce((s, p) => s + p.x, 0) / pts.length;
  const cy = pts.reduce((s, p) => s + p.y, 0) / pts.length;
  return { x: cx * w, y: cy * h };
}

export default function DirectorCanvas({
  imageUrl,
  marks,
  activeTool,
  onAddMark,
  onUpdateAnnotation,
  persistedMarks,
  showAnnotatedOverlay,
  priorMarks,
  readOnly,
}: DirectorCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const canvasSizeRef = useRef({ width: 600, height: 400 });
  const [, forceUpdate] = useState(0);
  const [isDrawing, setIsDrawing] = useState(false);
  const currentPathRef = useRef<Point[]>([]);
  const [editingMarkId, setEditingMarkId] = useState<string | null>(null);
  const [popoverPos, setPopoverPos] = useState({ x: 0, y: 0 });

  const syncSize = useCallback(() => {
    if (!containerRef.current) return;
    canvasSizeRef.current = {
      width: containerRef.current.clientWidth,
      height: containerRef.current.clientHeight,
    };
  }, []);

  useEffect(() => {
    syncSize();
    forceUpdate((n) => n + 1);
    const onResize = () => {
      syncSize();
      forceUpdate((n) => n + 1);
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [syncSize]);

  const redraw = useCallback(
    (inProgress?: Point[]) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const { width: cw, height: ch } = canvasSizeRef.current;
      canvas.width = cw;
      canvas.height = ch;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.clearRect(0, 0, cw, ch);

      persistedMarks.forEach((m) => drawMarkOnCanvas(ctx, m, cw, ch, 0.5));
      marks.forEach((m) => drawMarkOnCanvas(ctx, m, cw, ch, 1));

      if (showAnnotatedOverlay) {
        priorMarks.forEach((m) => drawMarkOnCanvas(ctx, m, cw, ch, 0.4));
      }

      if (inProgress && inProgress.length > 1 && activeTool) {
        const colors = MARK_COLORS[activeTool];
        ctx.strokeStyle = colors.stroke;
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        if (activeTool === 'redirect') {
          const from = { x: inProgress[0].x * cw, y: inProgress[0].y * ch };
          const to = { x: inProgress[inProgress.length - 1].x * cw, y: inProgress[inProgress.length - 1].y * ch };
          drawArrow(ctx, from, to);
        } else {
          ctx.beginPath();
          ctx.moveTo(inProgress[0].x * cw, inProgress[0].y * ch);
          for (let i = 1; i < inProgress.length; i++) {
            ctx.lineTo(inProgress[i].x * cw, inProgress[i].y * ch);
          }
          ctx.stroke();
        }
      }
    },
    [marks, persistedMarks, showAnnotatedOverlay, priorMarks, activeTool]
  );

  useEffect(() => {
    redraw();
  }, [redraw]);

  const getPoint = (e: React.MouseEvent): Point => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return { x: (e.clientX - rect.left) / rect.width, y: (e.clientY - rect.top) / rect.height };
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!activeTool || readOnly) return;

    // Check if clicking on an existing mark
    const pt = getPoint(e);
    for (const mark of [...marks].reverse()) {
      const centroid = getMarkCentroid(mark, 1, 1);
      const dist = Math.hypot(pt.x - centroid.x, pt.y - centroid.y);
      if (dist < 0.05) {
        const c = getMarkCentroid(mark, canvasSizeRef.current.width, canvasSizeRef.current.height);
        setEditingMarkId(mark.id);
        setPopoverPos({ x: c.x, y: c.y });
        return;
      }
    }

    setIsDrawing(true);
    currentPathRef.current = [pt];
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDrawing || !activeTool) return;
    currentPathRef.current.push(getPoint(e));
    redraw(currentPathRef.current);
  };

  const handleMouseUp = () => {
    if (!isDrawing || !activeTool) return;
    setIsDrawing(false);
    const path = currentPathRef.current;
    if (path.length >= 2) {
      const newMark: Mark = {
        id: Math.random().toString(36).substring(2, 10),
        type: activeTool,
        path: [...path],
        annotation: null,
        persists: activeTool === 'keep',
      };
      onAddMark(newMark);
    }
    currentPathRef.current = [];
  };

  return (
    <div
      ref={containerRef}
      style={{
        flex: 1,
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 0,
        overflow: 'hidden',
      }}
    >
      {/* Image */}
      <img
        src={imageUrl}
        alt="Generated"
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          borderRadius: 'var(--canvas-radius)',
        }}
      />

      {/* Mark canvas overlay */}
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={() => {
          if (isDrawing) handleMouseUp();
        }}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          cursor: readOnly ? 'default' : activeTool ? 'crosshair' : 'default',
          pointerEvents: activeTool || readOnly ? 'auto' : 'auto',
          zIndex: 10,
        }}
      />

      {/* Mark annotation badges */}
      {marks.map((mark) => {
        if (mark.path.length === 0) return null;
        const c = getMarkCentroid(mark, canvasSizeRef.current.width, canvasSizeRef.current.height);
        const colors = MARK_COLORS[mark.type];
        const hasNote = !!mark.annotation;
        return (
          <motion.button
            key={mark.id}
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ scale: 1.12 }}
            whileTap={{ scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
            onClick={(e) => {
              e.stopPropagation();
              setEditingMarkId(mark.id);
              setPopoverPos({ x: c.x, y: c.y });
            }}
            style={{
              position: 'absolute',
              left: c.x - 14,
              top: c.y - 14,
              width: 28,
              height: 28,
              borderRadius: 'var(--radius-sm)',
              background: hasNote ? colors.stroke : 'var(--bg-elevated)',
              border: hasNote ? 'none' : `1.5px solid ${colors.stroke}`,
              cursor: 'pointer',
              padding: 0,
              zIndex: 20,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: hasNote ? '#fff' : colors.stroke,
              boxShadow: '0 2px 8px rgba(0,0,0,0.18), 0 0 0 1px rgba(255,255,255,0.1)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
            }}
            title={mark.annotation || 'Add note'}
          >
            {hasNote ? (
              <ChatCircleDots size={14} weight="fill" />
            ) : (
              <ChatCircle size={14} weight="regular" />
            )}
          </motion.button>
        );
      })}

      {/* Annotation popover */}
      {editingMarkId && (
        <AnnotationPopover
          initialText={marks.find((m) => m.id === editingMarkId)?.annotation || null}
          position={popoverPos}
          onSave={(text) => {
            onUpdateAnnotation(editingMarkId, text);
            setEditingMarkId(null);
          }}
          onCancel={() => setEditingMarkId(null)}
        />
      )}
    </div>
  );
}
