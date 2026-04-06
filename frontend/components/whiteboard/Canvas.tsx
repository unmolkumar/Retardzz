'use client';

import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import type {
  Tool,
  Point,
  Stroke,
  ShapeData,
  DrawElement,
  WhiteboardProps,
} from './types';
import { renderElement, getCanvasPoint, uid } from './drawUtils';
import { useWhiteboardHistory } from './useWhiteboardHistory';
import Toolbar from './Toolbar';
import './whiteboard.css';

// Canvas resolution
const CANVAS_W = 1920;
const CANVAS_H = 1080;

export default function Canvas({ roomId, userId }: WhiteboardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // ── Tool state ────────────────────────────────────────────────
  const [activeTool, setActiveTool] = useState<Tool>('pen');
  const [activeColor, setActiveColor] = useState('#000000');
  const [brushSize, setBrushSize] = useState(4);

  // ── Drawing state ─────────────────────────────────────────────
  const isDrawing = useRef(false);
  const currentPoints = useRef<Point[]>([]);
  const shapeStart = useRef<Point | null>(null);

  // ── Text input state ──────────────────────────────────────────
  const [textInput, setTextInput] = useState<{
    visible: boolean;
    position: Point;
    value: string;
  }>({ visible: false, position: { x: 0, y: 0 }, value: '' });

  // ── History (undo/redo) ───────────────────────────────────────
  const {
    elements,
    addElement,
    addRemoteElement,
    undo,
    redo,
    clearAll,
    canUndo,
    canRedo,
  } = useWhiteboardHistory(userId);

  // ── Full canvas re-render ─────────────────────────────────────
  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

    // White background
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    for (const el of elements) {
      renderElement(ctx, el);
    }
  }, [elements]);

  useEffect(() => {
    redrawCanvas();
  }, [redrawCanvas]);

  // ── Mouse handlers ────────────────────────────────────────────
  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const point = getCanvasPoint(canvas, e);

      if (activeTool === 'text') {
        // Show the text input at click position
        const rect = canvas.getBoundingClientRect();
        const displayX = e.clientX - rect.left;
        const displayY = e.clientY - rect.top;
        setTextInput({
          visible: true,
          position: { x: displayX, y: displayY },
          value: '',
        });
        return;
      }

      isDrawing.current = true;

      if (activeTool === 'pen' || activeTool === 'eraser') {
        currentPoints.current = [point];
      } else {
        // Shape tools: record start
        shapeStart.current = point;
      }
    },
    [activeTool],
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!isDrawing.current) return;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const point = getCanvasPoint(canvas, e);

      if (activeTool === 'pen' || activeTool === 'eraser') {
        currentPoints.current.push(point);

        // Live preview: redraw everything + current stroke
        redrawCanvas();
        const ctx = canvas.getContext('2d');
        if (ctx && currentPoints.current.length > 1) {
          const preview: Stroke = {
            id: 'preview',
            tool: activeTool,
            points: [...currentPoints.current],
            color: activeColor,
            size: brushSize,
            userId,
            timestamp: Date.now(),
          };
          renderElement(ctx, preview);
        }
      } else if (shapeStart.current) {
        // Live preview for shapes
        redrawCanvas();
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const preview: ShapeData = {
            id: 'preview',
            tool: activeTool as ShapeData['tool'],
            start: shapeStart.current,
            end: point,
            color: activeColor,
            size: brushSize,
            userId,
            timestamp: Date.now(),
          };
          renderElement(ctx, preview);
        }
      }
    },
    [activeTool, activeColor, brushSize, userId, redrawCanvas],
  );

  const handleMouseUp = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!isDrawing.current) return;
      isDrawing.current = false;

      const canvas = canvasRef.current;
      if (!canvas) return;

      if (activeTool === 'pen' || activeTool === 'eraser') {
        if (currentPoints.current.length < 2) return;
        const stroke: Stroke = {
          id: uid(),
          tool: activeTool,
          points: [...currentPoints.current],
          color: activeColor,
          size: brushSize,
          userId,
          timestamp: Date.now(),
        };
        addElement(stroke);
        // TODO: emit whiteboard:draw via socket
        currentPoints.current = [];
      } else if (shapeStart.current) {
        const endPt = getCanvasPoint(canvas, e);
        const shape: ShapeData = {
          id: uid(),
          tool: activeTool as ShapeData['tool'],
          start: shapeStart.current,
          end: endPt,
          color: activeColor,
          size: brushSize,
          userId,
          timestamp: Date.now(),
        };
        addElement(shape);
        // TODO: emit whiteboard:draw via socket
        shapeStart.current = null;
      }
    },
    [activeTool, activeColor, brushSize, userId, addElement],
  );

  // ── Text tool submission ──────────────────────────────────────
  const submitText = useCallback(() => {
    if (!textInput.value.trim()) {
      setTextInput((prev) => ({ ...prev, visible: false }));
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    // Convert display coords back to canvas coords
    const rect = canvas.getBoundingClientRect();
    const scaleX = CANVAS_W / rect.width;
    const scaleY = CANVAS_H / rect.height;

    const textEl: ShapeData = {
      id: uid(),
      tool: 'text',
      start: {
        x: textInput.position.x * scaleX,
        y: textInput.position.y * scaleY,
      },
      end: { x: 0, y: 0 },
      color: activeColor,
      size: brushSize,
      text: textInput.value,
      userId,
      timestamp: Date.now(),
    };
    addElement(textEl);
    // TODO: emit whiteboard:draw via socket
    setTextInput({ visible: false, position: { x: 0, y: 0 }, value: '' });
  }, [textInput, activeColor, brushSize, userId, addElement]);

  // ── Export ─────────────────────────────────────────────────────
  const handleExport = useCallback(
    (format: 'png' | 'pdf') => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      if (format === 'png') {
        const link = document.createElement('a');
        link.download = `whiteboard-${roomId}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
      } else {
        // PDF export — lightweight approach using canvas image
        // For now, just export as PNG. Full PDF can be added post-MVP.
        alert('PDF export coming soon! Use PNG for now.');
      }
    },
    [roomId],
  );

  // ── Keyboard shortcuts ────────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'z') {
        e.preventDefault();
        undo();
      }
      if (e.ctrlKey && e.key === 'y') {
        e.preventDefault();
        redo();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [undo, redo]);

  // ── Render ────────────────────────────────────────────────────
  return (
    <div className="wb-container" id="whiteboard-root">
      <div className="wb-canvas-area" ref={containerRef}>
        <canvas
          ref={canvasRef}
          width={CANVAS_W}
          height={CANVAS_H}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={() => {
            isDrawing.current = false;
          }}
        />

        {/* Text input overlay */}
        {textInput.visible && (
          <input
            className="wb-text-input"
            style={{
              left: textInput.position.x,
              top: textInput.position.y,
            }}
            value={textInput.value}
            onChange={(e) =>
              setTextInput((prev) => ({ ...prev, value: e.target.value }))
            }
            onKeyDown={(e) => {
              if (e.key === 'Enter') submitText();
              if (e.key === 'Escape')
                setTextInput((prev) => ({ ...prev, visible: false }));
            }}
            onBlur={submitText}
            autoFocus
            placeholder="Type here…"
          />
        )}
      </div>

      <Toolbar
        activeTool={activeTool}
        activeColor={activeColor}
        brushSize={brushSize}
        onToolChange={setActiveTool}
        onColorChange={setActiveColor}
        onSizeChange={setBrushSize}
        onUndo={undo}
        onRedo={redo}
        onClear={clearAll}
        onExport={handleExport}
        canUndo={canUndo}
        canRedo={canRedo}
      />
    </div>
  );
}
