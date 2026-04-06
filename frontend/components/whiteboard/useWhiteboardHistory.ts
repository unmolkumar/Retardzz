'use client';

import { useCallback, useRef, useState } from 'react';
import type { DrawElement } from './types';

/**
 * Custom hook for undo/redo state management.
 * Each user only undoes/redoes *their own* strokes (per PRD requirement).
 */
export function useWhiteboardHistory(userId: string) {
  const [elements, setElements] = useState<DrawElement[]>([]);
  const undoStackRef = useRef<DrawElement[]>([]);

  const addElement = useCallback(
    (el: DrawElement) => {
      setElements((prev) => [...prev, el]);
      // Adding a new element clears the redo stack for this user
      undoStackRef.current = undoStackRef.current.filter(
        (e) => e.userId !== userId,
      );
    },
    [userId],
  );

  /** Receive a remote element (from another user via socket) */
  const addRemoteElement = useCallback((el: DrawElement) => {
    setElements((prev) => [...prev, el]);
  }, []);

  const undo = useCallback(() => {
    setElements((prev) => {
      // Find the LAST element that belongs to this user
      const lastIdx = prev.map((e) => e.userId).lastIndexOf(userId);
      if (lastIdx === -1) return prev;

      const removed = prev[lastIdx];
      undoStackRef.current.push(removed);

      return [...prev.slice(0, lastIdx), ...prev.slice(lastIdx + 1)];
    });
  }, [userId]);

  const redo = useCallback(() => {
    const stack = undoStackRef.current;
    // Find the last redo item for this user
    const idx = stack.map((e) => e.userId).lastIndexOf(userId);
    if (idx === -1) return;

    const restored = stack[idx];
    undoStackRef.current = [
      ...stack.slice(0, idx),
      ...stack.slice(idx + 1),
    ];
    setElements((prev) => [...prev, restored]);
  }, [userId]);

  const clearAll = useCallback(() => {
    setElements([]);
    undoStackRef.current = [];
  }, []);

  const canUndo = elements.some((e) => e.userId === userId);
  const canRedo = undoStackRef.current.some((e) => e.userId === userId);

  return {
    elements,
    addElement,
    addRemoteElement,
    undo,
    redo,
    clearAll,
    canUndo,
    canRedo,
  };
}
