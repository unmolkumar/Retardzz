"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Tldraw,
  TLStore,
  createTLStore,
  defaultShapeUtils,
  DefaultColorStyle,
  DefaultSizeStyle,
  GeoShapeGeoStyle,
  type Editor as TldrawEditor,
  type TLDefaultColorStyle,
  type TLDefaultSizeStyle,
  type TLGeoShapeGeoStyle,
} from "@tldraw/tldraw";
import type { TLRecord } from "@tldraw/tlschema";
import "tldraw/tldraw.css";
import "./editor-ui.css";
import * as Y from "yjs";
import { LiveblocksYjsProvider } from "@liveblocks/yjs";
import { useRoom, useMyPresence, useOthers } from "../../liveblocks.config";

type WhiteboardTool =
  | "select"
  | "hand"
  | "draw"
  | "eraser"
  | "arrow"
  | "line"
  | "rectangle"
  | "ellipse"
  | "diamond"
  | "text";

interface EditorProps {
  roomId: string;
  roomName?: string;
  username?: string;
}

type PresenceColorKey = "blue" | "green" | "orange" | "violet" | "red" | "cyan" | "yellow" | "teal";

const PRESENCE_COLOR_KEYS: PresenceColorKey[] = [
  "blue",
  "green",
  "orange",
  "violet",
  "red",
  "cyan",
  "yellow",
  "teal",
];

const COLOR_OPTIONS: Array<{ label: string; value: TLDefaultColorStyle; swatchClass: string }> = [
  { label: "Black", value: "black", swatchClass: "wb-swatch-black" },
  { label: "Grey", value: "grey", swatchClass: "wb-swatch-grey" },
  { label: "Red", value: "red", swatchClass: "wb-swatch-red" },
  { label: "Pink", value: "light-red", swatchClass: "wb-swatch-pink" },
  { label: "Blue", value: "blue", swatchClass: "wb-swatch-blue" },
  { label: "Cyan", value: "light-blue", swatchClass: "wb-swatch-cyan" },
  { label: "Green", value: "green", swatchClass: "wb-swatch-green" },
  { label: "Orange", value: "orange", swatchClass: "wb-swatch-orange" },
  { label: "Violet", value: "violet", swatchClass: "wb-swatch-violet" },
];

const SIZE_OPTIONS: Array<{ label: string; value: TLDefaultSizeStyle }> = [
  { label: "Small", value: "s" },
  { label: "Medium", value: "m" },
  { label: "Large", value: "l" },
];

const TOOL_OPTIONS: Array<{ id: WhiteboardTool; label: string }> = [
  { id: "select", label: "Sel" },
  { id: "hand", label: "Hand" },
  { id: "draw", label: "Draw" },
  { id: "eraser", label: "Erase" },
  { id: "arrow", label: "Arrow" },
  { id: "line", label: "Line" },
  { id: "rectangle", label: "Rect" },
  { id: "ellipse", label: "Ellipse" },
  { id: "diamond", label: "Diamond" },
  { id: "text", label: "Text" },
];

function formatElapsed(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

function pickColor(seed: string): PresenceColorKey {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  return PRESENCE_COLOR_KEYS[Math.abs(hash) % PRESENCE_COLOR_KEYS.length];
}

function resolvePresenceColor(value: unknown, seed: string): PresenceColorKey {
  if (typeof value === "string" && PRESENCE_COLOR_KEYS.includes(value as PresenceColorKey)) {
    return value as PresenceColorKey;
  }
  return pickColor(seed);
}

function getInitials(value: string): string {
  const parts = value.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return "?";
  }
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

function applyBrushStyles(editor: TldrawEditor, color: TLDefaultColorStyle, size: TLDefaultSizeStyle) {
  editor.setStyleForNextShapes(DefaultColorStyle, color);
  editor.setStyleForNextShapes(DefaultSizeStyle, size);
}

function applyTool(editor: TldrawEditor, tool: WhiteboardTool) {
  if (tool === "rectangle" || tool === "ellipse" || tool === "diamond") {
    editor.setCurrentTool("geo");

    const geoValue: TLGeoShapeGeoStyle =
      tool === "rectangle" ? "rectangle" : tool === "ellipse" ? "ellipse" : "diamond";
    editor.setStyleForNextShapes(GeoShapeGeoStyle, geoValue);
    return;
  }

  editor.setCurrentTool(tool);
}

export function useYjsStore({
  room,
}: {
  room: ReturnType<typeof useRoom>;
}) {
  const [store, setStore] = useState<TLStore | null>(null);

  useEffect(() => {
    if (!room) return;

    // Initialize Y.Doc
    const yDoc = new Y.Doc();
    
    // Bind Y.Doc to Liveblocks room
    const provider = new LiveblocksYjsProvider(room, yDoc);
    
    // Use the built-in default shapes to avoid migration ID conflicts
    const newStore = createTLStore({ 
      shapeUtils: defaultShapeUtils 
    });
    
    const yShapes = yDoc.getMap<TLRecord>("shapes");

    // Hydration: Prepopulate store with existing Y.Doc data
    const initialRecords: TLRecord[] = [];
    yShapes.forEach((record) => {
      initialRecords.push(record);
    });
    if (initialRecords.length > 0) {
      newStore.put(initialRecords);
    }
    
    // Store Listener: Push local changes to the Yjs map
    const unlisten = newStore.listen(
      (update) => {
        if (update.source !== "user") return;
        
        yDoc.transact(() => {
          Object.values(update.changes.added).forEach((record) => {
            yShapes.set(record.id, record);
          });
          Object.values(update.changes.updated).forEach(([, to]) => {
            yShapes.set(to.id, to);
          });
          Object.keys(update.changes.removed).forEach((id) => {
            yShapes.delete(id);
          });
        });
      },
      { scope: "document", source: "user" }
    );

    // Yjs Observer: Pull remote changes into the newStore
    const observer = (event: Y.YMapEvent<TLRecord>, transaction: Y.Transaction) => {
      if (transaction.local) return; // CRITICAL: Prevent infinite recursive loops

      const toPut: TLRecord[] = [];
      const toRemove: TLRecord["id"][] = [];

      event.changes.keys.forEach((change, key) => {
        if (change.action === "add" || change.action === "update") {
          const record = yShapes.get(key);
          if (record) toPut.push(record);
        } else if (change.action === "delete") {
          toRemove.push(key as TLRecord["id"]);
        }
      });

      if (toPut.length > 0 || toRemove.length > 0) {
        newStore.mergeRemoteChanges(() => {
          if (toPut.length > 0) newStore.put(toPut);
          if (toRemove.length > 0) newStore.remove(toRemove);
        });
      }
    };
    
    yShapes.observe(observer);

    setStore(newStore);

    // Cleanup function destroys ydoc and provider
    return () => {
      unlisten();
      yShapes.unobserve(observer);
      provider.destroy();
      yDoc.destroy();
    };
  }, [room]);

  return store;
}

export default function Editor({ roomId, roomName = "", username = "" }: EditorProps) {
  const room = useRoom();
  const others = useOthers();
  const store = useYjsStore({ room });
  const [, updateMyPresence] = useMyPresence();
  const [editor, setEditor] = useState<TldrawEditor | null>(null);
  const [activeTool, setActiveTool] = useState<WhiteboardTool>("draw");
  const [activeColor, setActiveColor] = useState<TLDefaultColorStyle>("black");
  const [activeSize, setActiveSize] = useState<TLDefaultSizeStyle>("m");
  const [gridEnabled, setGridEnabled] = useState<boolean>(true);
  const [optionsOpen, setOptionsOpen] = useState<boolean>(false);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [statusText, setStatusText] = useState<string>("Ready");
  const optionsRef = useRef<HTMLDivElement | null>(null);

  const resolvedUsername = username.trim() || "Guest";
  const resolvedRoomName = roomName.trim() || `Study Room ${roomId.slice(0, 6)}`;
  const userColorKey = useMemo(() => pickColor(resolvedUsername || roomId), [resolvedUsername, roomId]);

  useEffect(() => {
    updateMyPresence({
      username: resolvedUsername,
      color: userColorKey,
    });
  }, [resolvedUsername, updateMyPresence, userColorKey]);

  useEffect(() => {
    const timerId = window.setInterval(() => {
      setElapsedSeconds((value) => value + 1);
    }, 1000);

    return () => {
      window.clearInterval(timerId);
    };
  }, []);

  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      if (!optionsRef.current) {
        return;
      }
      if (!optionsRef.current.contains(event.target as Node)) {
        setOptionsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleOutsideClick);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, []);

  if (!store) {
    return (
      <div className="wb-loading-screen">
        Loading canvas...
      </div>
    );
  }

  const collaborators = others.map(({ connectionId, presence }) => {
    const collaboratorName = presence.username || `User ${connectionId}`;
    return {
      id: connectionId,
      name: collaboratorName,
      initials: getInitials(collaboratorName),
      colorKey: resolvePresenceColor(presence.color, collaboratorName),
    };
  });

  function handleToolChange(tool: WhiteboardTool) {
    if (!editor) {
      return;
    }

    setActiveTool(tool);
    applyTool(editor, tool);
    applyBrushStyles(editor, activeColor, activeSize);
  }

  function handleColorChange(color: TLDefaultColorStyle) {
    setActiveColor(color);
    if (editor) {
      applyBrushStyles(editor, color, activeSize);
    }
  }

  function handleSizeChange(size: TLDefaultSizeStyle) {
    setActiveSize(size);
    if (editor) {
      applyBrushStyles(editor, activeColor, size);
    }
  }

  function clearCanvas() {
    if (!editor) {
      return;
    }

    const shapeIds = Array.from(editor.getCurrentPageShapeIds());
    if (shapeIds.length === 0) {
      setStatusText("Canvas is already empty.");
      return;
    }

    editor.deleteShapes(shapeIds);
    setStatusText("Canvas cleared.");
  }

  async function exportImage() {
    if (!editor) {
      return;
    }

    const shapeIds = Array.from(editor.getCurrentPageShapeIds());
    if (shapeIds.length === 0) {
      setStatusText("Add something before exporting.");
      return;
    }

    try {
      const { blob } = await editor.toImage(shapeIds, {
        format: "png",
        background: true,
        pixelRatio: 2,
        padding: 24,
      });

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `whiteboard-${roomId}-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      setStatusText("Image exported.");
    } catch {
      setStatusText("Export failed.");
    }
  }

  async function copyRoomLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setStatusText("Room link copied.");
    } catch {
      setStatusText("Unable to copy link.");
    }
  }

  function showRoomSettings() {
    setStatusText(`Room: ${resolvedRoomName} | Members online: ${collaborators.length + 1}`);
  }

  return (
    <div
      className={`wb-shell ${gridEnabled ? "wb-grid-enabled" : ""}`}
      onPointerMove={(e) =>
        updateMyPresence({ cursor: { x: Math.round(e.clientX), y: Math.round(e.clientY) } })
      }
      onPointerLeave={() => updateMyPresence({ cursor: null })}
    >
      <div className="wb-top-strip">
        <div className="wb-room-pill">
          <span className="wb-live-dot" />
          <span className="wb-room-title">{resolvedRoomName}</span>
          <span className="wb-separator" />
          <span className="wb-room-timer">{formatElapsed(elapsedSeconds)}</span>
          <div className="wb-options-wrap" ref={optionsRef}>
            <button
              type="button"
              className="wb-options-btn"
              onClick={() => setOptionsOpen((open) => !open)}
            >
              Options
            </button>
            {optionsOpen ? (
              <div className="wb-options-menu">
                <button type="button" onClick={exportImage}>Export Image</button>
                <button type="button" onClick={copyRoomLink}>Share Link</button>
                <button type="button" onClick={showRoomSettings}>Room Settings</button>
                <button type="button" className="danger" onClick={clearCanvas}>Clear Canvas</button>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <aside className="wb-collaborator-rail">
        <div className={`wb-collaborator-item self wb-presence-${userColorKey}`}>
          {getInitials(resolvedUsername)}
        </div>
        {collaborators.map((collaborator) => (
          <div
            key={collaborator.id}
            className={`wb-collaborator-item wb-presence-${collaborator.colorKey}`}
            title={collaborator.name}
          >
            {collaborator.initials}
          </div>
        ))}
        <div className="wb-collaborator-help">?</div>
      </aside>

      <aside className="wb-brush-panel">
        <div className="wb-panel-title">Brush Styles</div>
        <div className="wb-color-grid">
          {COLOR_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              title={option.label}
              className={`wb-color-dot ${option.swatchClass} ${activeColor === option.value ? "active" : ""}`}
              onClick={() => handleColorChange(option.value)}
            />
          ))}
        </div>
        <div className="wb-stroke-size-row">
          {SIZE_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              className={`wb-size-btn ${activeSize === option.value ? "active" : ""}`}
              onClick={() => handleSizeChange(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>
      </aside>

      <div className="wb-bottom-toolbar">
        {TOOL_OPTIONS.map((tool) => (
          <button
            key={tool.id}
            type="button"
            className={`wb-tool-btn ${activeTool === tool.id ? "active" : ""}`}
            onClick={() => handleToolChange(tool.id)}
          >
            {tool.label}
          </button>
        ))}
        <button
          type="button"
          className={`wb-grid-btn ${gridEnabled ? "active" : ""}`}
          onClick={() => setGridEnabled((value) => !value)}
        >
          Grid
        </button>
      </div>

      <div className="wb-status-bar">{statusText}</div>

      <div className="wb-canvas-stage">
        <Tldraw
          store={store}
          hideUi
          onMount={(mountedEditor) => {
            setEditor(mountedEditor);
            applyBrushStyles(mountedEditor, activeColor, activeSize);
            applyTool(mountedEditor, activeTool);
          }}
        />
      </div>
    </div>
  );
}
