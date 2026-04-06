"use client";

import { useState } from "react";
import { useSharedEditor } from "./EditorContext";
import { DefaultColorStyle } from "@tldraw/tldraw";

const colors = [
  { name: "black", hex: "#000000" },
  { name: "red", hex: "#e03131" },
  { name: "blue", hex: "#1971c2" },
  { name: "green", hex: "#2f9e44" },
  { name: "yellow", hex: "#f08c00" },
];

export default function StyleDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const { editor } = useSharedEditor();

  const handleColorChange = (color: string) => {
    if (!editor) return;
    editor.setStyleForSelectedShapes(DefaultColorStyle, color as any);
    editor.setStyleForNextShapes(DefaultColorStyle, color as any);
  };

  return (
    <div className="absolute top-6 right-6 z-[9999]">
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 bg-slate-900/80 backdrop-blur-2xl border border-white/10 rounded-full px-4 py-2.5 shadow-[0_8px_30px_rgb(0,0,0,0.12)] text-sm font-medium text-slate-200 hover:text-white transition-all focus:outline-none hover:scale-105 active:scale-95"
        >
          Styles
          <svg className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {isOpen && (
          <div className="origin-top-right absolute right-0 top-full mt-4 w-48 rounded-2xl shadow-[0_20px_40px_rgb(0,0,0,0.4)] bg-slate-900/90 backdrop-blur-2xl ring-1 ring-white/10 overflow-hidden animate-[fadeInDown_0.2s_ease-out] p-3">
            <div className="text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">Colors</div>
            <div className="flex flex-wrap gap-2">
              {colors.map((c) => (
                <button
                  key={c.name}
                  onClick={() => {
                    handleColorChange(c.name);
                    setIsOpen(false);
                  }}
                  className="w-8 h-8 rounded-full border border-white/20 hover:scale-110 transition-transform focus:outline-none"
                  style={{ backgroundColor: c.hex }}
                  title={c.name}
                />
              ))}
            </div>
          </div>
        )}
      </div>
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes fadeInDown {
          from { opacity: 0; transform: translateY(-8px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}} />
    </div>
  );
}
