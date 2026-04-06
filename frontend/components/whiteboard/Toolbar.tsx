'use client';

import React from 'react';
import type { ToolbarProps, Tool } from './types';

const COLORS = [
  '#000000', '#FFFFFF', '#EF4444', '#F97316', '#EAB308',
  '#22C55E', '#3B82F6', '#8B5CF6', '#EC4899', '#6B7280',
];

const SIZES = [2, 4, 6, 10, 16];

interface ToolDef {
  id: Tool;
  label: string;
  icon: string;  // emoji for hackathon speed — swap for SVGs later
}

const TOOLS: ToolDef[] = [
  { id: 'pen',       label: 'Pen',       icon: '✏️' },
  { id: 'eraser',    label: 'Eraser',    icon: '🧹' },
  { id: 'line',      label: 'Line',      icon: '📏' },
  { id: 'rectangle', label: 'Rectangle', icon: '▭' },
  { id: 'circle',    label: 'Circle',    icon: '⭕' },
  { id: 'arrow',     label: 'Arrow',     icon: '➡️' },
  { id: 'text',      label: 'Text',      icon: '🔤' },
];

export default function Toolbar({
  activeTool,
  activeColor,
  brushSize,
  onToolChange,
  onColorChange,
  onSizeChange,
  onUndo,
  onRedo,
  onClear,
  onExport,
  canUndo,
  canRedo,
}: ToolbarProps) {
  return (
    <div className="wb-toolbar">
      {/* ── Drawing Tools ───────────────────────────── */}
      <div className="wb-toolbar__section">
        <span className="wb-toolbar__label">Tools</span>
        <div className="wb-toolbar__group">
          {TOOLS.map((t) => (
            <button
              key={t.id}
              id={`wb-tool-${t.id}`}
              className={`wb-toolbar__btn ${
                activeTool === t.id ? 'wb-toolbar__btn--active' : ''
              }`}
              title={t.label}
              onClick={() => onToolChange(t.id)}
            >
              {t.icon}
            </button>
          ))}
        </div>
      </div>

      {/* ── Colors ──────────────────────────────────── */}
      <div className="wb-toolbar__section">
        <span className="wb-toolbar__label">Color</span>
        <div className="wb-toolbar__group wb-toolbar__colors">
          {COLORS.map((c) => (
            <button
              key={c}
              className={`wb-toolbar__swatch ${
                activeColor === c ? 'wb-toolbar__swatch--active' : ''
              }`}
              style={{ backgroundColor: c }}
              onClick={() => onColorChange(c)}
              title={c}
            />
          ))}
        </div>
      </div>

      {/* ── Brush Size ──────────────────────────────── */}
      <div className="wb-toolbar__section">
        <span className="wb-toolbar__label">Size</span>
        <div className="wb-toolbar__group">
          {SIZES.map((s) => (
            <button
              key={s}
              className={`wb-toolbar__btn wb-toolbar__size-btn ${
                brushSize === s ? 'wb-toolbar__btn--active' : ''
              }`}
              onClick={() => onSizeChange(s)}
              title={`${s}px`}
            >
              <span
                className="wb-toolbar__size-dot"
                style={{ width: s + 4, height: s + 4 }}
              />
            </button>
          ))}
        </div>
      </div>

      {/* ── Actions ─────────────────────────────────── */}
      <div className="wb-toolbar__section">
        <span className="wb-toolbar__label">Actions</span>
        <div className="wb-toolbar__group">
          <button
            id="wb-undo"
            className="wb-toolbar__btn"
            onClick={onUndo}
            disabled={!canUndo}
            title="Undo (your strokes)"
          >
            ↩️
          </button>
          <button
            id="wb-redo"
            className="wb-toolbar__btn"
            onClick={onRedo}
            disabled={!canRedo}
            title="Redo"
          >
            ↪️
          </button>
          <button
            id="wb-clear"
            className="wb-toolbar__btn wb-toolbar__btn--danger"
            onClick={onClear}
            title="Clear All"
          >
            🗑️
          </button>
        </div>
      </div>

      {/* ── Export ───────────────────────────────────── */}
      <div className="wb-toolbar__section">
        <span className="wb-toolbar__label">Export</span>
        <div className="wb-toolbar__group">
          <button
            id="wb-export-png"
            className="wb-toolbar__btn"
            onClick={() => onExport('png')}
            title="Export as PNG"
          >
            🖼️
          </button>
          <button
            id="wb-export-pdf"
            className="wb-toolbar__btn"
            onClick={() => onExport('pdf')}
            title="Export as PDF (coming soon)"
          >
            📄
          </button>
        </div>
      </div>
    </div>
  );
}
