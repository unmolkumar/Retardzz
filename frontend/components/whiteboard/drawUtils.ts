import type { DrawElement, Point } from './types';

// ── Rendering helpers ───────────────────────────────────────────

/** Draw a single element onto a 2D canvas context */
export function renderElement(
  ctx: CanvasRenderingContext2D,
  el: DrawElement,
): void {
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  if (el.tool === 'pen' || el.tool === 'eraser') {
    drawFreehand(ctx, el);
  } else if (el.tool === 'rectangle') {
    drawRectangle(ctx, el);
  } else if (el.tool === 'circle') {
    drawCircle(ctx, el);
  } else if (el.tool === 'line') {
    drawLine(ctx, el);
  } else if (el.tool === 'arrow') {
    drawArrow(ctx, el);
  } else if (el.tool === 'text') {
    drawText(ctx, el);
  }
}

function drawFreehand(
  ctx: CanvasRenderingContext2D,
  el: DrawElement,
): void {
  if (!('points' in el) || el.points.length < 2) return;
  ctx.strokeStyle = el.tool === 'eraser' ? '#FFFFFF' : el.color;
  ctx.lineWidth = el.tool === 'eraser' ? el.size * 3 : el.size;
  ctx.globalCompositeOperation =
    el.tool === 'eraser' ? 'destination-out' : 'source-over';

  ctx.beginPath();
  ctx.moveTo(el.points[0].x, el.points[0].y);

  // Use quadratic curves for smooth strokes
  for (let i = 1; i < el.points.length - 1; i++) {
    const midX = (el.points[i].x + el.points[i + 1].x) / 2;
    const midY = (el.points[i].y + el.points[i + 1].y) / 2;
    ctx.quadraticCurveTo(el.points[i].x, el.points[i].y, midX, midY);
  }
  const last = el.points[el.points.length - 1];
  ctx.lineTo(last.x, last.y);
  ctx.stroke();

  ctx.globalCompositeOperation = 'source-over';
}

function drawRectangle(
  ctx: CanvasRenderingContext2D,
  el: DrawElement,
): void {
  if (!('start' in el)) return;
  ctx.strokeStyle = el.color;
  ctx.lineWidth = el.size;
  const w = el.end.x - el.start.x;
  const h = el.end.y - el.start.y;
  ctx.strokeRect(el.start.x, el.start.y, w, h);
}

function drawCircle(
  ctx: CanvasRenderingContext2D,
  el: DrawElement,
): void {
  if (!('start' in el)) return;
  ctx.strokeStyle = el.color;
  ctx.lineWidth = el.size;
  const rx = (el.end.x - el.start.x) / 2;
  const ry = (el.end.y - el.start.y) / 2;
  const cx = el.start.x + rx;
  const cy = el.start.y + ry;
  ctx.beginPath();
  ctx.ellipse(cx, cy, Math.abs(rx), Math.abs(ry), 0, 0, Math.PI * 2);
  ctx.stroke();
}

function drawLine(
  ctx: CanvasRenderingContext2D,
  el: DrawElement,
): void {
  if (!('start' in el)) return;
  ctx.strokeStyle = el.color;
  ctx.lineWidth = el.size;
  ctx.beginPath();
  ctx.moveTo(el.start.x, el.start.y);
  ctx.lineTo(el.end.x, el.end.y);
  ctx.stroke();
}

function drawArrow(
  ctx: CanvasRenderingContext2D,
  el: DrawElement,
): void {
  if (!('start' in el)) return;
  ctx.strokeStyle = el.color;
  ctx.fillStyle = el.color;
  ctx.lineWidth = el.size;

  // Shaft
  ctx.beginPath();
  ctx.moveTo(el.start.x, el.start.y);
  ctx.lineTo(el.end.x, el.end.y);
  ctx.stroke();

  // Arrowhead
  const angle = Math.atan2(
    el.end.y - el.start.y,
    el.end.x - el.start.x,
  );
  const headLen = 14 + el.size * 2;
  ctx.beginPath();
  ctx.moveTo(el.end.x, el.end.y);
  ctx.lineTo(
    el.end.x - headLen * Math.cos(angle - Math.PI / 6),
    el.end.y - headLen * Math.sin(angle - Math.PI / 6),
  );
  ctx.lineTo(
    el.end.x - headLen * Math.cos(angle + Math.PI / 6),
    el.end.y - headLen * Math.sin(angle + Math.PI / 6),
  );
  ctx.closePath();
  ctx.fill();
}

function drawText(
  ctx: CanvasRenderingContext2D,
  el: DrawElement,
): void {
  if (!('start' in el) || !el.text) return;
  ctx.fillStyle = el.color;
  ctx.font = `${Math.max(16, el.size * 4)}px "Inter", sans-serif`;
  ctx.fillText(el.text, el.start.x, el.start.y);
}

// ── Coordinate helpers ──────────────────────────────────────────

/** Get mouse position relative to the canvas */
export function getCanvasPoint(
  canvas: HTMLCanvasElement,
  e: React.MouseEvent | MouseEvent,
): Point {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  return {
    x: (e.clientX - rect.left) * scaleX,
    y: (e.clientY - rect.top) * scaleY,
  };
}

/** Get touch position relative to the canvas */
export function getTouchCanvasPoint(
  canvas: HTMLCanvasElement,
  touch: React.Touch | Touch,
): Point {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  return {
    x: (touch.clientX - rect.left) * scaleX,
    y: (touch.clientY - rect.top) * scaleY,
  };
}

/** Generate a simple unique id */
export function uid(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}
