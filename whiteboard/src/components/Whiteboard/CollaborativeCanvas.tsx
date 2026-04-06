"use client";

import { useMemo } from "react";
import { RoomProvider } from "../../liveblocks.config";
import Editor from "./Editor";
import Cursors from "./Cursors";

interface CollaborativeCanvasProps {
  roomId: string;
  username?: string;
  roomName?: string;
  boardId?: string;
}

function pickColor(seed: string): string {
  const palette = [
    "blue",
    "green",
    "orange",
    "violet",
    "red",
    "cyan",
    "yellow",
    "teal",
  ];

  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }

  return palette[Math.abs(hash) % palette.length];
}

export default function CollaborativeCanvas({ roomId, username = "", roomName = "", boardId = "" }: CollaborativeCanvasProps) {
  const trimmedUsername = username.trim();
  const guestFallback = useMemo(
    () => `guest-${Math.random().toString(36).slice(2, 6)}`,
    []
  );
  const resolvedUsername = trimmedUsername || guestFallback;
  const normalizedRoomId = roomId.trim().toLowerCase();
  const normalizedBoardId = boardId.trim().toLowerCase();
  const roomScopedId = normalizedRoomId ? `saivo-room-${normalizedRoomId}` : "";
  const collaborationRoomId = normalizedBoardId || roomScopedId || "saivo-room-default";
  const presenceColor = pickColor(resolvedUsername || collaborationRoomId);

  return (
    <RoomProvider
      id={collaborationRoomId}
      initialPresence={{
        cursor: null,
        username: resolvedUsername,
        color: presenceColor,
      }}
    >
      <Cursors />
      <Editor roomId={collaborationRoomId} roomName={roomName} username={resolvedUsername} />
    </RoomProvider>
  );
}
