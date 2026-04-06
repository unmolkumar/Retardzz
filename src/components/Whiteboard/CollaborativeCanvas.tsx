"use client";

import { useState } from "react";
import { RoomProvider } from "../../liveblocks.config";
import { ClientSideSuspense } from "@liveblocks/react";
import EditorComponent from "./Editor";
import Cursors from "./Cursors";
import Sidebar from "./Sidebar";
import HeaderActions from "./HeaderActions";
import StyleIsland from "./StyleIsland";
import TopLeftControls from "./TopLeftControls";
import BottomToolbar from "./BottomToolbar";
import { EditorContext } from "./EditorContext";
import { Editor as TLEditor } from "@tldraw/tldraw";

interface CollaborativeCanvasProps {
  roomId: string;
}

export default function CollaborativeCanvas({ roomId }: CollaborativeCanvasProps) {
  const [editor, setEditor] = useState<TLEditor | null>(null);

  return (
    <RoomProvider id={roomId} initialPresence={{ cursor: null }}>
      <ClientSideSuspense fallback={<div className="flex h-screen items-center justify-center font-sans font-bold text-gray-500">Loading Room...</div>}>
        <EditorContext.Provider value={{ editor, setEditor }}>
          <div className="relative h-screen w-screen overflow-hidden bg-white font-sans">
            <HeaderActions />
            <StyleIsland />
            <TopLeftControls />
            <BottomToolbar />
            <Sidebar />
            <Cursors />
            <EditorComponent />
          </div>
        </EditorContext.Provider>
      </ClientSideSuspense>
    </RoomProvider>
  );
}
