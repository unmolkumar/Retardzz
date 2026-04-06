"use client";

import { useEffect, useState } from "react";
import { Tldraw } from "@tldraw/tldraw";
import "@tldraw/tldraw/tldraw.css";
import * as Y from "yjs";
import { LiveblocksYjsProvider } from "@liveblocks/yjs";
import { useRoom } from "../../liveblocks.config";

export default function Editor() {
  const room = useRoom();

  useEffect(() => {
    // Initialize Y.Doc
    const yDoc = new Y.Doc();
    
    // Bind Y.Doc to Liveblocks room
    const provider = new LiveblocksYjsProvider(room, yDoc);

    // Cleanup function destroys ydoc and provider
    return () => {
      provider.destroy();
      yDoc.destroy();
    };
  }, [room]);

  return (
    <div className="absolute inset-0">
      <Tldraw />
    </div>
  );
}
