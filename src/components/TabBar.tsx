import React from 'react';
import { Plus, X, Globe, Laptop, Power, AlertCircle, Loader2 } from 'lucide-react';
import { DesktopSession } from '../types';

interface TabBarProps {
  sessions: DesktopSession[];
  activeSessionId: string;
  onSelectSession: (id: string) => void;
  onCloseSession: (id: string) => void;
  onAddSession: () => void;
}

export const TabBar: React.FC<TabBarProps> = ({
  sessions,
  activeSessionId,
  onSelectSession,
  onCloseSession,
  onAddSession,
}) => {
  return (
    <div className="bg-slate-950 border-b border-slate-800 px-3 pt-2 flex items-end justify-between overflow-x-auto no-scrollbar select-none">
      {/* Tabs List */}
      <div className="flex items-end gap-1.5 min-w-0">
        {sessions.map((session, index) => {
          const isActive = session.id === activeSessionId;
          const isRunning = session.status === 'running';
          const isStarting = session.status === 'starting';

          return (
            <div
              key={session.id}
              onClick={() => onSelectSession(session.id)}
              className={`group relative flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-t-lg border-t border-x cursor-pointer transition-all duration-150 max-w-[240px] min-w-[170px] ${
                isActive
                  ? 'bg-slate-900 border-slate-700 text-white shadow-lg shadow-black/40 z-10'
                  : 'bg-slate-950/70 border-transparent text-slate-400 hover:bg-slate-900/60 hover:text-slate-200'
              }`}
            >
              {/* Active Tab Accent Line */}
              {isActive && (
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-blue-500 rounded-t-lg" />
              )}

              {/* Status Indicator Dot */}
              <div className="flex items-center justify-center shrink-0">
                {isStarting ? (
                  <Loader2 className="w-3 h-3 text-amber-400 animate-spin" />
                ) : isRunning ? (
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                  </span>
                ) : (
                  <span className="inline-block h-2.5 w-2.5 rounded-full bg-red-500/80"></span>
                )}
              </div>

              {/* Title & Info */}
              <div className="flex flex-col min-w-0 flex-1">
                <div className="flex items-center gap-1.5 truncate">
                  <span className="truncate font-semibold text-slate-100">{session.name}</span>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-mono">
                  <span>:{session.vncPort}</span>
                  <span>•</span>
                  <span className="truncate">{session.proxy.location.split(',')[0]}</span>
                </div>
              </div>

              {/* Port Badge */}
              <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded shrink-0 ${
                isActive ? 'bg-slate-800 text-blue-300' : 'bg-slate-900 text-slate-500'
              }`}>
                RFB
              </span>

              {/* Close Tab Button */}
              {sessions.length > 1 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onCloseSession(session.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-slate-800 rounded text-slate-400 hover:text-red-400 transition-opacity"
                  title="Close Screen Sandbox"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          );
        })}

        {/* Plus Button */}
        <button
          onClick={onAddSession}
          className="p-1.5 mb-1 text-slate-400 hover:text-white hover:bg-slate-900 rounded-lg transition-colors border border-transparent hover:border-slate-800"
          title="Launch another isolated PC screen"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* Global Tab Bar Quick Hint */}
      <div className="hidden md:flex items-center gap-2 pb-2 text-[11px] text-slate-500 shrink-0 pr-2">
        <span className="bg-slate-900 px-2 py-0.5 rounded border border-slate-800 font-mono">
          Multi-Instance Docker Bridge
        </span>
      </div>
    </div>
  );
};
