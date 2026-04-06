// ── Whiteboard-local types ──────────────────────────────────────
// These ONLY live inside frontend/components/whiteboard/
// They do NOT modify the frozen shared/types.ts

export type Tool =
  | 'pen'
  | 'eraser'
  | 'rectangle'
  | 'circle'
  | 'line'
  | 'arrow'
  | 'text'
  | 'select';

export interface Point {
  x: number;
  y: number;
}

export interface Stroke {
  id: string;
  tool: Tool;
  points: Point[];       // freehand path or [start, end] for shapes
  color: string;
  size: number;
  userId: string;
  timestamp: number;
}

export interface ShapeData {
  id: string;
  tool: 'rectangle' | 'circle' | 'line' | 'arrow' | 'text';
  start: Point;
  end: Point;
  color: string;
  size: number;
  text?: string;         // only for text tool
  userId: string;
  timestamp: number;
}

export type DrawElement = Stroke | ShapeData;

// ── Socket payload types (matches frozen contract) ──────────────
// Event: whiteboard:draw  → sends DrawPayload
// Event: whiteboard:sync  → receives DrawPayload
export interface DrawPayload {
  roomId: string;
  element: DrawElement;
  action: 'add' | 'undo' | 'redo' | 'clear';
}

export interface CursorPayload {
  roomId: string;
  userId: string;
  userName: string;
  position: Point;
}

// ── Component prop types ────────────────────────────────────────
export interface WhiteboardProps {
  roomId: string;
  userId: string;
}

export interface ToolbarProps {
  activeTool: Tool;
  activeColor: string;
  brushSize: number;
  onToolChange: (tool: Tool) => void;
  onColorChange: (color: string) => void;
  onSizeChange: (size: number) => void;
  onUndo: () => void;
  onRedo: () => void;
  onClear: () => void;
  onExport: (format: 'png' | 'pdf') => void;
  canUndo: boolean;
  canRedo: boolean;
}
