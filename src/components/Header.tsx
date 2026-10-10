import React from 'react';
import {
  Monitor,
  LayoutGrid,
  Plus,
  BookOpen,
  Activity,
  Cpu,
  ShieldCheck,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';
import { DesktopSession, ViewMode } from '../types';

interface HeaderProps {
  sessions: DesktopSession[];
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  onOpenDockerGuide: () => void;
  onOpenNewSession: () => void;
  onRefresh: () => void;
  isRefreshing: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  sessions,
  viewMode,
  setViewMode,
  onOpenDockerGuide,
  onOpenNewSession,
  onRefresh,
  isRefreshing,
}) => {
  const runningCount = sessions.filter((s) => s.status === 'running').length;
  const avgCpu = sessions.length
    ? (sessions.reduce((acc, s) => acc + s.stats.cpuPercent, 0) / sessions.length).toFixed(1)
    : '0';
  const totalRam = sessions.length
    ? (sessions.reduce((acc, s) => acc + s.stats.memoryMb, 0) / 1024).toFixed(1)
    : '0';

  return (
    <header className="bg-slate-950 border-b border-slate-800 px-4 py-2.5 flex items-center justify-between text-white select-none">
      {/* Brand & System Status */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/20 ring-1 ring-white/20">
          <Monitor className="w-4 h-4 text-white" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-bold text-sm tracking-tight text-slate-100 flex items-center gap-1.5">
              GoLogin Multi-Desktop Sandbox
            </h1>
            <span className="text-[10px] font-semibold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded">
              Anti-Detect Cluster
            </span>
          </div>
          <p className="text-[11px] text-slate-400">
            Isolated X11/noVNC Virtual Workstations & Profile Manager
          </p>
        </div>
      </div>

      {/* Cluster Telemetry Pill */}
      <div className="hidden lg:flex items-center gap-2 text-xs">
        <div className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-slate-300">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="font-medium text-slate-200">{runningCount}/{sessions.length} Online</span>
          </div>
          <div className="w-px h-3 bg-slate-700" />
          <div className="flex items-center gap-1.5 text-slate-400">
            <Cpu className="w-3.5 h-3.5 text-blue-400" />
            <span>Avg CPU: <strong className="text-slate-200">{avgCpu}%</strong></span>
          </div>
          <div className="w-px h-3 bg-slate-700" />
          <div className="flex items-center gap-1.5 text-slate-400">
            <Activity className="w-3.5 h-3.5 text-purple-400" />
            <span>RAM: <strong className="text-slate-200">{totalRam} GB</strong></span>
          </div>
          <div className="w-px h-3 bg-slate-700" />
          <div className="flex items-center gap-1.5 text-slate-400">
            <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
            <span>MAC Spoofed</span>
          </div>
        </div>
      </div>

      {/* Action Controls */}
      <div className="flex items-center gap-2">
        {/* View Mode Toggle: Tabbed vs Multi-Monitor Grid */}
        <div className="bg-slate-900 p-0.5 rounded-lg border border-slate-800 flex items-center">
          <button
            onClick={() => setViewMode('tabbed')}
            className={`px-2.5 py-1 text-xs font-medium rounded flex items-center gap-1.5 transition-all ${
              viewMode === 'tabbed'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Switch to single tabbed screen viewer"
          >
            <Monitor className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Tabbed</span>
          </button>
          <button
            onClick={() => setViewMode('grid')}
            className={`px-2.5 py-1 text-xs font-medium rounded flex items-center gap-1.5 transition-all ${
              viewMode === 'grid'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="View all 3 isolated screens simultaneously in a multi-monitor grid"
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">3-Screen Grid</span>
          </button>
        </div>

        {/* Refresh telemetry */}
        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          className="p-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg text-slate-400 hover:text-slate-200 transition-colors"
          title="Refresh session states"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-blue-400' : ''}`} />
        </button>

        {/* Setup Blueprint & Docker Guide */}
        <button
          onClick={onOpenDockerGuide}
          className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors"
        >
          <BookOpen className="w-3.5 h-3.5 text-blue-400" />
          <span className="hidden md:inline">Docker Guide</span>
        </button>

        {/* Add New Sandbox Screen */}
        <button
          onClick={onOpenNewSession}
          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-medium flex items-center gap-1.5 shadow-sm shadow-blue-500/20 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New PC Screen</span>
        </button>
      </div>
    </header>
  );
};
