"use client";

import { useOthers, useSelf } from "../../liveblocks.config";

export default function Sidebar() {
  const others = useOthers();
  const currentUser = useSelf();

  return (
    <div className="absolute left-6 top-1/2 -translate-y-1/2 z-[9999] bg-slate-900/80 backdrop-blur-2xl border border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.12)] rounded-3xl p-3 flex flex-col items-center gap-3 transition-all duration-300 w-[70px] hover:w-[240px] overflow-hidden group font-sans">
      
      <div className="w-8 h-[2px] bg-slate-700 rounded-full mb-2"></div>
      
      {/* Current User */}
      {currentUser && (
        <div className="flex w-full items-center gap-4 rounded-full p-1.5 transition-all hover:bg-white/10 cursor-default hover:scale-[1.02]">
          <div className="relative flex-shrink-0">
            {currentUser.info?.avatar ? (
              <img src={currentUser.info.avatar} alt="You" className="w-10 h-10 rounded-full object-cover border-2 border-white/10" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-slate-800 border bg-gradient-to-br from-blue-500 to-indigo-600 border-white/20 shadow-lg flex items-center justify-center text-white font-bold">
                {currentUser.info?.name?.charAt(0) || "Y"}
              </div>
            )}
          </div>
          <div className="flex flex-col opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0 transition-all duration-300 w-full overflow-hidden text-left">
            <span className="text-sm font-semibold text-slate-100 truncate">
              {currentUser.info?.name || "You"} <span className="text-[10px] text-slate-400 font-normal uppercase">(You)</span>
            </span>
          </div>
        </div>
      )}

      {others.length > 0 && <div className="w-8 group-hover:w-[80%] h-[1px] bg-white/10 transition-all duration-300 my-1"></div>}

      {/* Other Users */}
      {others.map(({ connectionId, info, presence }) => (
        <div key={connectionId} className="flex w-full items-center gap-4 rounded-full p-1.5 transition-all hover:bg-white/10 cursor-pointer hover:scale-[1.02]">
          <div className={`relative flex-shrink-0 ${presence.cursor ? 'drop-shadow-[0_0_12px_rgba(74,222,128,0.8)] ring-2 ring-green-400 rounded-full transition-all duration-500' : 'transition-all duration-500'}`}>
            {info?.avatar ? (
              <img src={info.avatar} alt={info.name || "User"} className="w-10 h-10 rounded-full object-cover border-2 border-white/10" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center text-slate-300 font-bold" style={{ backgroundColor: info?.color ? `${String(info.color)}40` : undefined, color: info?.color ? String(info.color) : undefined }}>
                {info?.name?.charAt(0) || "?"}
              </div>
            )}
            <div className={`absolute bottom-0 right-0 w-2.5 h-2.5 border-2 border-slate-900 rounded-full transition-colors duration-300 ${presence.cursor ? 'bg-green-500 animate-pulse' : 'bg-slate-500'}`}></div>
          </div>
          <div className="flex flex-col opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0 transition-all duration-300 w-full overflow-hidden text-left">
            <span className="text-sm font-medium text-slate-200 truncate">
              {info?.name || `User ${connectionId}`}
            </span>
            {presence.cursor && (
              <span className="text-[10px] text-green-400 font-medium tracking-wide">
                Active
              </span>
            )}
          </div>
        </div>
      ))}

    </div>
  );
}