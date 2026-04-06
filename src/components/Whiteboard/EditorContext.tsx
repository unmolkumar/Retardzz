"use client";

import { createContext, useContext, useState } from "react";
import { Editor as TLEditor } from "@tldraw/tldraw";

interface EditorContextType {
  editor: TLEditor | null;
  setEditor: (editor: TLEditor | null) => void;
}

export const EditorContext = createContext<EditorContextType>({
  editor: null,
  setEditor: () => {},
});

export function useSharedEditor() {
  return useContext(EditorContext);
}
