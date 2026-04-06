"use client";

import { useState } from "react";
import { useSharedEditor } from "./EditorContext";
import { DefaultColorStyle, DefaultSizeStyle, useValue } from "@tldraw/tldraw";

const colors = [
  { name: "black", hex: "#1d1d1d" },
  { name: "grey", hex: "#7a7a7a" },
  { name: "red", hex: "#e03131" },
  { name: "light-red", hex: "#ff8787" },
  { name: "blue", hex: "#1971c2" },
  { name: "light-blue", hex: "#4dabf7" },
  { name: "green", hex: "#2b8a3e" },
  { name: "light-green", hex: "#69db7c" },
  { name: "yellow", hex: "#f08c00" },
];

const sizes = [
  { name: "s", label: "Small" },
  { name: "m", label: "Medium" },
  { name: "l", label: "Large" },
];

export default function StyleIsland() {
  const [isOpen, setIsOpen] = useState(false);
  const { editor } = useSharedEditor();

  const currentColor = useValue(
    'currentColor',
    () => {
      if (!editor) return 'black';
      const sharedStyle = editor.getSharedStyles().getAsKnownValue(DefaultColorStyle);
      return sharedStyle || 'black';
    },
    [editor]
  );

  const currentSize = useValue(
    'currentSize',
    () => {
      if (!editor) return 'm';
      const sharedStyle = editor.getSharedStyles().getAsKnownValue(DefaultSizeStyle);
      return sharedStyle || 'm';
    },
    [editor]
  );

  const activeColorHex = colors.find((c) => c.name === currentColor)?.hex || "#1d1d1d";

  const handleColorChange = (color: string) => {
    if (!editor) return;
    editor.setStyleForSelectedShapes(DefaultColorStyle, color as any);
    editor.setStyleForNextShapes(DefaultColorStyle, color as any);
  };

  const handleSizeChange = (size: string) => {
    if (!editor) return;
    editor.setStyleForSelectedShapes(DefaultSizeStyle, size as any);
    editor.setStyleForNextShapes(DefaultSizeStyle, size as any);
  };

  const handleToolChange = (toolId: string, geo?: string) => {
    if (!editor) return;
    editor.setCurrentTool(toolId);
    if (geo) {
      // For shapes, we also need to set the shape style otherwise setting to geo defaults to last geo drawn
      import('@tldraw/tldraw').then(({ DefaultGeoStyle }) => {
        editor.setStyleForNextShapes(DefaultGeoStyle, geo as any);
      });
    }
  };

  return (
    <div className="absolute top-6 right-6 z-[9999]">
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center justify-center gap-3 bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-full px-5 py-3 shadow-[0_8px_30px_rgb(0,0,0,0.12)] text-sm font-medium text-slate-200 hover:text-white transition-all focus:outline-none hover:scale-105 active:scale-95"
        >
          {/* Active color indicator */}
          <div 
            className="w-4 h-4 rounded-full ring-2 ring-white/20 transition-colors"
            style={{ backgroundColor: activeColorHex }}
          />
          Brush Styles
          <svg className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {isOpen && (
          <div className="origin-top-right absolute right-0 top-full mt-4 w-64 rounded-3xl shadow-[0_20px_40px_rgb(0,0,0,0.4)] bg-slate-900/90 backdrop-blur-xl ring-1 ring-white/10 overflow-hidden animate-[fadeInDown_0.2s_ease-out] p-5">
            
            {/* Colors Section */}
            <div className="mb-5">
              <div className="text-xs font-bold text-slate-400 mb-3 uppercase tracking-wider">Colors</div>
              <div className="grid grid-cols-5 gap-2">
                {colors.map((c) => (
                  <button
                    key={c.name}
                    onClick={() => handleColorChange(c.name)}
                    className={`w-8 h-8 rounded-full border-2 transition-transform focus:outline-none ${c.name === currentColor ? 'border-white scale-110' : 'border-transparent hover:scale-110'}`}
                    style={{ backgroundColor: c.hex }}
                    title={c.name}
                  />
                ))}
              </div>
            </div>

            <div className="h-[1px] bg-white/10 my-4"></div>

            {/* Stroke Size Section */}
            <div className="mb-2">
              <div className="text-xs font-bold text-slate-400 mb-3 uppercase tracking-wider">Stroke Size</div>
              <div className="flex gap-2 bg-slate-800/50 p-1.5 rounded-full border border-white/5">
                {sizes.map((s) => (
                  <button
                    key={s.name}
                    onClick={() => handleSizeChange(s.name)}
                    className={`flex-1 py-1.5 rounded-full text-xs font-medium transition-all ${
                      s.name === currentSize 
                        ? 'bg-slate-700 text-white shadow-md' 
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
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
