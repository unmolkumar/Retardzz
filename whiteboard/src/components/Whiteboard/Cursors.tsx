"use client";

import { useEffect, useRef } from "react";
import { useOthers } from "../../liveblocks.config";

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

function pickPresenceColor(seed: string): PresenceColorKey {
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
  return pickPresenceColor(seed);
}

interface CursorBubbleProps {
  x: number;
  y: number;
  label: string;
  colorKey: PresenceColorKey;
  connectionId: number;
}

function CursorBubble({ x, y, label, colorKey, connectionId }: CursorBubbleProps) {
  const bubbleRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!bubbleRef.current) {
      return;
    }
    bubbleRef.current.style.transform = `translate(${Math.round(x)}px, ${Math.round(y)}px)`;
  }, [x, y]);

  return (
    <div ref={bubbleRef} className={`wb-cursor-bubble wb-presence-${colorKey}`} data-connection-id={connectionId}>
      {label}
    </div>
  );
}

export default function Cursors() {
  const others = useOthers();

  return (
    <>
      {others.map(({ connectionId, presence }) => {
        if (!presence.cursor) {
          return null;
        }

        const { x, y } = presence.cursor;
        const label = presence.username ? getInitials(presence.username) : String(connectionId % 100);
        const seed = presence.username || String(connectionId);
        const colorKey = resolvePresenceColor(presence.color, seed);

        return (
          <CursorBubble
            key={connectionId}
            x={x}
            y={y}
            label={label}
            colorKey={colorKey}
            connectionId={connectionId}
          />
        );
      })}
    </>
  );
}
