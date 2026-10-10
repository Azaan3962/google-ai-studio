import React from 'react';
import { Monitor, Maximize2, RotateCw, Power, Shield, Wifi, Play } from 'lucide-react';
import { DesktopSession } from '../types';

interface MultiScreenGridProps {
  sessions: DesktopSession[];
  onSelectSession: (id: string) => void;
  onLaunchGoLogin: (sessionId: string) => Promise<void>;
  onRestartSession: (sessionId: string) => Promise<void>;
  onStopSession: (sessionId: string) => Promise<void>;
}

export const MultiScreenGrid: React.FC<MultiScreenGridProps> = ({
  sessions,
  onSelectSession,
  onLaunchGoLogin,
  onRestartSession,
  onStopSession,
}) => {
  return (
    <div className="flex-1 bg-slate-950 p-4 overflow-y-auto">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <Monitor className="w-4 h-4 text-blue-400" />
              Multi-Desktop Command Center Matrix
            </h2>
            <p className="text-xs text-slate-400">
              Live parallel view of {sessions.length} isolated GoLogin desktop environments running concurrently
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Concurrent Stream Matrix Active</span>
          </div>
        </div>

        {/* Grid of screens */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sessions.map((session) => {
            const isRunning = session.status === 'running';

            return (
              <div
                key={session.id}
                className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl flex flex-col transition-all hover:border-slate-700 hover:shadow-2xl"
              >
                {/* Header */}
                <div className="bg-slate-950 px-3.5 py-2.5 border-b border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className={`h-2.5 w-2.5 rounded-full shrink-0 ${
                        isRunning ? 'bg-emerald-400 shadow-sm shadow-emerald-400/50' : 'bg-red-400'
                      }`}
                    />
                    <div className="truncate">
                      <h3 className="font-semibold text-xs text-slate-200 truncate">
                        {session.name}
                      </h3>
                      <p className="text-[10px] text-slate-400 font-mono truncate">
                        {session.containerName} • VNC :{session.vncPort}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => onSelectSession(session.id)}
                    className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded transition-colors"
                    title="Focus on this screen"
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Simulated Screen Preview Canvas / Graphic */}
                <div
                  onClick={() => onSelectSession(session.id)}
                  className="relative aspect-video bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 border-b border-slate-800 cursor-pointer group flex flex-col justify-between p-3 overflow-hidden"
                >
                  {/* Subtle simulated desktop UI */}
                  <div className="w-full flex items-center justify-between text-[9px] font-mono text-slate-500 border-b border-slate-800/60 pb-1">
                    <span>XFCE4 :0 [1920x1080]</span>
                    <span className="text-emerald-400 font-bold">LIVE STREAM</span>
                  </div>

                  {/* Centered Simulated GoLogin Window */}
                  <div className="bg-slate-900/90 border border-slate-700/80 rounded p-2.5 shadow-lg max-w-[85%] mx-auto my-auto backdrop-blur-sm">
                    <div className="flex items-center justify-between mb-1 text-[10px] text-slate-300 font-semibold border-b border-slate-800 pb-1">
                      <span className="text-blue-400 flex items-center gap-1">
                        <Shield className="w-3 h-3" />
                        GoLogin Desktop
                      </span>
                      <span className="text-emerald-400 text-[9px] font-mono">
                        {session.goLogin.status.toUpperCase()}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-200 font-medium truncate mb-1">
                      {session.goLogin.activeProfileName}
                    </div>
                    <div className="text-[9px] font-mono text-slate-400 flex items-center gap-1">
                      <Wifi className="w-2.5 h-2.5 text-purple-400" />
                      <span className="truncate">{session.proxy.location}</span>
                    </div>
                  </div>

                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-blue-600/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[1px]">
                    <span className="bg-slate-950/90 text-white border border-slate-700 px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 shadow-xl">
                      <Maximize2 className="w-3.5 h-3.5 text-blue-400" />
                      Click to Focus Screen Tab
                    </span>
                  </div>

                  {/* Bottom preview info */}
                  <div className="flex items-center justify-between text-[9px] text-slate-500 font-mono">
                    <span>MAC: {session.macAddress}</span>
                    <span>{session.stats.fps} FPS / {session.stats.latencyMs}ms</span>
                  </div>
                </div>

                {/* Footer Controls & Specs */}
                <div className="p-3 bg-slate-900 text-xs space-y-2.5">
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div className="bg-slate-950 p-2 rounded border border-slate-800">
                      <span className="text-slate-500 block text-[9px] uppercase font-mono">CPU Usage</span>
                      <span className="font-semibold text-slate-200">{session.stats.cpuPercent}%</span>
                    </div>
                    <div className="bg-slate-950 p-2 rounded border border-slate-800">
                      <span className="text-slate-500 block text-[9px] uppercase font-mono">RAM Allocated</span>
                      <span className="font-semibold text-slate-200">{session.stats.memoryMb} MB</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 pt-1">
                    <button
                      onClick={() => onSelectSession(session.id)}
                      className="flex-1 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-medium transition-colors text-center"
                    >
                      Open Full Tab
                    </button>
                    <button
                      onClick={() => onLaunchGoLogin(session.id)}
                      className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded"
                      title="Launch GoLogin in this screen"
                    >
                      <Play className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onRestartSession(session.id)}
                      className="p-1.5 bg-slate-800 hover:bg-slate-700 text-amber-400 rounded"
                      title="Restart container"
                    >
                      <RotateCw className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
