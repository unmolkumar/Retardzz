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
import "@tldraw/tldraw/tldraw.css";
import "./editor-ui.css";
import { getYjsProviderForRoom } from "@liveblocks/yjs";
import type { Transaction, YMapEvent } from "yjs";
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

type WhiteboardIcon =
  | WhiteboardTool
  | "options"
  | "caret"
  | "export"
  | "share"
  | "clear"
  | "grid";

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

const TOOL_OPTIONS: Array<{ id: WhiteboardTool; label: string; icon: WhiteboardTool }> = [
  { id: "select", label: "Select", icon: "select" },
  { id: "hand", label: "Pan", icon: "hand" },
  { id: "draw", label: "Draw", icon: "draw" },
  { id: "eraser", label: "Erase", icon: "eraser" },
  { id: "arrow", label: "Arrow", icon: "arrow" },
  { id: "line", label: "Line", icon: "line" },
  { id: "rectangle", label: "Rect", icon: "rectangle" },
  { id: "ellipse", label: "Ellipse", icon: "ellipse" },
  { id: "diamond", label: "Diamond", icon: "diamond" },
  { id: "text", label: "Text", icon: "text" },
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

function renderIcon(icon: WhiteboardIcon) {
  const sharedProps = {
    className: "wb-icon",
    viewBox: "0 0 20 20",
    fill: "none",
    stroke: "currentColor",
    "aria-hidden": "true",
  } as const;

  switch (icon) {
    case "select":
      return (
        <svg {...sharedProps}>
          <path d="M5 3v14l4-4 3 6 2-1-3-6 5-1-11-9z" />
        </svg>
      );
    case "hand":
      return (
        <svg {...sharedProps}>
          <path d="M6 10V7a1 1 0 0 1 2 0v3" />
          <path d="M8 10V5a1 1 0 0 1 2 0v5" />
          <path d="M10 10V6a1 1 0 0 1 2 0v4" />
          <path d="M12 10V7a1 1 0 0 1 2 0v5a4 4 0 0 1-4 4H8a3 3 0 0 1-3-3v-1" />
        </svg>
      );
    case "draw":
      return (
        <svg {...sharedProps}>
          <path d="M4 16l3-1 8-8-2-2-8 8-1 3z" />
          <path d="M11 5l2 2" />
        </svg>
      );
    case "eraser":
      return (
        <svg {...sharedProps}>
          <path d="M4 12l6-6 6 6-4 4H8z" />
          <path d="M10 16h6" />
        </svg>
      );
    case "arrow":
      return (
        <svg {...sharedProps}>
          <path d="M4 16L16 4" />
          <path d="M10 4h6v6" />
        </svg>
      );
    case "line":
      return (
        <svg {...sharedProps}>
          <path d="M4 12h12" />
        </svg>
      );
    case "rectangle":
      return (
        <svg {...sharedProps}>
          <rect x="4" y="6" width="12" height="10" rx="1.5" />
        </svg>
      );
    case "ellipse":
      return (
        <svg {...sharedProps}>
          <ellipse cx="10" cy="11" rx="6" ry="4.5" />
        </svg>
      );
    case "diamond":
      return (
        <svg {...sharedProps}>
          <path d="M10 4l6 7-6 7-6-7z" />
        </svg>
      );
    case "text":
      return (
        <svg {...sharedProps}>
          <path d="M5 5h10" />
          <path d="M10 5v12" />
        </svg>
      );
    case "options":
      return (
        <svg {...sharedProps}>
          <path d="M5 6h10" />
          <circle cx="8" cy="6" r="1.3" fill="currentColor" stroke="none" />
          <path d="M5 10h10" />
          <circle cx="12" cy="10" r="1.3" fill="currentColor" stroke="none" />
          <path d="M5 14h10" />
          <circle cx="9" cy="14" r="1.3" fill="currentColor" stroke="none" />
        </svg>
      );
    case "caret":
      return (
        <svg {...sharedProps}>
          <path d="M6 8l4 4 4-4" />
        </svg>
      );
    case "export":
      return (
        <svg {...sharedProps}>
          <path d="M10 4v9" />
          <path d="M6.5 9.5L10 13l3.5-3.5" />
          <path d="M4 16h12" />
        </svg>
      );
    case "share":
      return (
        <svg {...sharedProps}>
          <path d="M7.5 12.5l5-5" />
          <path d="M6 15H5a3 3 0 0 1 0-6h1" />
          <path d="M14 9h1a3 3 0 0 1 0 6h-1" />
        </svg>
      );
    case "clear":
      return (
        <svg {...sharedProps}>
          <path d="M4 6h12" />
          <path d="M7 6V4h6v2" />
          <rect x="6" y="6" width="8" height="10" rx="1" />
          <path d="M9 9v4" />
          <path d="M11 9v4" />
        </svg>
      );
    case "grid":
      return (
        <svg {...sharedProps}>
          <path d="M4 4h12v12H4z" />
          <path d="M10 4v12" />
          <path d="M4 10h12" />
        </svg>
      );
  }
}

export function useYjsStore({
  room,
  username,
}: {
  room: ReturnType<typeof useRoom>;
  username: string;
}) {
  const [store] = useState<TLStore>(() => createTLStore({
    shapeUtils: defaultShapeUtils,
  }));

  useEffect(() => {
    if (!room) return;

    const yProvider = getYjsProviderForRoom(room);
    const yDoc = yProvider.getYDoc();
    const yRecords = yDoc.getMap<TLRecord>("records");

    yProvider.awareness.setLocalStateField("user", { name: username });

    // Hydration: Prepopulate store with existing Y.Doc data
    const initialRecords: TLRecord[] = [];
    yRecords.forEach((record) => {
      initialRecords.push(record);
    });
    if (initialRecords.length > 0) {
      store.put(initialRecords);
    }
    
    // Store Listener: Push local changes to the Yjs map
    const unlisten = store.listen(
      (update) => {
        if (update.source !== "user") return;
        
        yDoc.transact(() => {
          Object.values(update.changes.added).forEach((record) => {
            yRecords.set(record.id, record);
          });
          Object.values(update.changes.updated).forEach(([, to]) => {
            yRecords.set(to.id, to);
          });
          Object.keys(update.changes.removed).forEach((id) => {
            yRecords.delete(id);
          });
        });
      },
      { scope: "document", source: "user" }
    );

    // Yjs Observer: Pull remote changes into the newStore
    const observer = (event: YMapEvent<TLRecord>, transaction: Transaction) => {
      if (transaction.local) return; // CRITICAL: Prevent infinite recursive loops

      const toPut: TLRecord[] = [];
      const toRemove: TLRecord["id"][] = [];

      event.changes.keys.forEach((change, key) => {
        if (change.action === "add" || change.action === "update") {
          const record = yRecords.get(key);
          if (record) toPut.push(record);
        } else if (change.action === "delete") {
          toRemove.push(key as TLRecord["id"]);
        }
      });

      if (toPut.length > 0 || toRemove.length > 0) {
        store.mergeRemoteChanges(() => {
          if (toPut.length > 0) store.put(toPut);
          if (toRemove.length > 0) store.remove(toRemove);
        });
      }
    };

    yRecords.observe(observer);

    // Use provider instances managed by Liveblocks for each room.
    return () => {
      unlisten();
      yRecords.unobserve(observer);
    };
  }, [room, store, username]);

  return store;
}

export default function Editor({ roomId, roomName = "", username = "" }: EditorProps) {
  const resolvedUsername = username.trim() || "Guest";
  const room = useRoom();
  const others = useOthers();
  const store = useYjsStore({ room, username: resolvedUsername });
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

  const resolvedRoomName = roomName.trim() || `Study Room ${roomId.slice(0, 6)}`;
  const userColorKey = useMemo(() => pickColor(resolvedUsername || roomId), [resolvedUsername, roomId]);

  useEffect(() => {
    if (!room) {
      return;
    }

    const yProvider = getYjsProviderForRoom(room);
    const handleSync = (isSynced: boolean) => {
      setStatusText(isSynced ? `Live sync ready as ${resolvedUsername}.` : "Reconnecting live sync...");
    };

    handleSync(yProvider.synced);
    yProvider.on("sync", handleSync);

    return () => {
      yProvider.off("sync", handleSync);
    };
  }, [room, resolvedUsername]);

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
      const roomLink = new URL(window.location.href);
      // Avoid sharing user identity; each member should appear with their own username.
      roomLink.searchParams.delete("username");
      await navigator.clipboard.writeText(roomLink.toString());
      setStatusText("Room link copied.");
    } catch {
      setStatusText("Unable to copy link.");
    }
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
              <span className="wb-action-icon">{renderIcon("options")}</span>
              <span>Options</span>
              <span className={`wb-caret ${optionsOpen ? "open" : ""}`}>{renderIcon("caret")}</span>
            </button>
            {optionsOpen ? (
              <div className="wb-options-menu">
                <button type="button" onClick={exportImage}>
                  <span className="wb-menu-icon">{renderIcon("export")}</span>
                  <span>Export Image</span>
                </button>
                <button type="button" onClick={copyRoomLink}>
                  <span className="wb-menu-icon">{renderIcon("share")}</span>
                  <span>Share Link</span>
                </button>
                <button type="button" className="danger" onClick={clearCanvas}>
                  <span className="wb-menu-icon">{renderIcon("clear")}</span>
                  <span>Clear Canvas</span>
                </button>
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
            <span className="wb-tool-icon">{renderIcon(tool.icon)}</span>
            <span className="wb-tool-label">{tool.label}</span>
          </button>
        ))}
        <button
          type="button"
          className={`wb-grid-btn ${gridEnabled ? "active" : ""}`}
          onClick={() => setGridEnabled((value) => !value)}
        >
          <span className="wb-tool-icon">{renderIcon("grid")}</span>
          <span className="wb-tool-label">Grid</span>
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
