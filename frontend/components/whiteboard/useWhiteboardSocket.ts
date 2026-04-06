'use client';

import { useCallback, useEffect, useRef } from 'react';
import type { DrawPayload, CursorPayload, DrawElement } from './types';

// ── Socket.io dynamic import ────────────────────────────────────
// We import the socket instance that Member 3 (Core Platform) will
// expose. Until that's wired up, we provide a safe no-op fallback
// so the whiteboard works standalone during development.
//
// When Member 3 provides a socket context, swap this import:
//   import { useSocket } from '@/components/room/core/SocketContext';

type SocketLike = {
  emit: (event: string, data: unknown) => void;
  on: (event: string, cb: (...args: unknown[]) => void) => void;
  off: (event: string, cb: (...args: unknown[]) => void) => void;
  connected?: boolean;
};

const noopSocket: SocketLike = {
  emit: () => {},
  on: () => {},
  off: () => {},
  connected: false,
};

/**
 * Tries to get the socket instance from the global window object.
 * Member 3 should attach it as `window.__studySocket` or provide a
 * React context. This is a lightweight bridge until that's ready.
 */
function getSocket(): SocketLike {
  if (
    typeof window !== 'undefined' &&
    (window as unknown as Record<string, unknown>).__studySocket
  ) {
    return (window as unknown as Record<string, unknown>)
      .__studySocket as SocketLike;
  }
  return noopSocket;
}

// ── Hook ────────────────────────────────────────────────────────

interface UseWhiteboardSocketOptions {
  roomId: string;
  userId: string;
  userName?: string;
  onRemoteDraw: (element: DrawElement) => void;
  onRemoteCursor: (cursor: CursorPayload) => void;
  onRemoteClear: () => void;
}

export function useWhiteboardSocket({
  roomId,
  userId,
  userName = 'Anonymous',
  onRemoteDraw,
  onRemoteCursor,
  onRemoteClear,
}: UseWhiteboardSocketOptions) {
  const socketRef = useRef<SocketLike>(noopSocket);

  // ── Connect / subscribe ─────────────────────────────────────
  useEffect(() => {
    const socket = getSocket();
    socketRef.current = socket;

    const handleSync = (raw: unknown) => {
      const payload = raw as DrawPayload;
      // Ignore our own echoed events
      if (payload.element?.userId === userId) return;

      if (payload.action === 'add') {
        onRemoteDraw(payload.element);
      } else if (payload.action === 'clear') {
        onRemoteClear();
      }
    };

    const handleCursor = (raw: unknown) => {
      const cursor = raw as CursorPayload;
      if (cursor.userId === userId) return;
      onRemoteCursor(cursor);
    };

    socket.on('whiteboard:sync', handleSync);
    socket.on('user:cursor-move', handleCursor);

    return () => {
      socket.off('whiteboard:sync', handleSync);
      socket.off('user:cursor-move', handleCursor);
    };
  }, [roomId, userId, onRemoteDraw, onRemoteCursor, onRemoteClear]);

  // ── Emitters ────────────────────────────────────────────────
  const emitDraw = useCallback(
    (element: DrawElement) => {
      const payload: DrawPayload = {
        roomId,
        element,
        action: 'add',
      };
      socketRef.current.emit('whiteboard:draw', payload);
    },
    [roomId],
  );

  const emitClear = useCallback(() => {
    const payload: DrawPayload = {
      roomId,
      element: null as unknown as DrawElement,
      action: 'clear',
    };
    socketRef.current.emit('whiteboard:draw', payload);
  }, [roomId]);

  const emitCursor = useCallback(
    (x: number, y: number) => {
      const payload: CursorPayload = {
        roomId,
        userId,
        userName,
        position: { x, y },
      };
      socketRef.current.emit('user:cursor-move', payload);
    },
    [roomId, userId, userName],
  );

  return { emitDraw, emitClear, emitCursor };
}
