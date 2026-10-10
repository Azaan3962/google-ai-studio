import React, { useState } from 'react';
import {
  Shield,
  X,
  Cpu,
  HardDrive,
  Globe,
  Sliders,
  Check,
  Lock,
  Layers,
  Terminal,
  Server,
  Share2,
} from 'lucide-react';
import { DesktopSession } from '../types';

interface FingerprintDrawerProps {
  session: DesktopSession;
  isOpen: boolean;
  onClose: () => void;
  onUpdateSession: (id: string, updates: Partial<DesktopSession>) => Promise<void>;
}

export const FingerprintDrawer: React.FC<FingerprintDrawerProps> = ({
  session,
  isOpen,
  onClose,
  onUpdateSession,
}) => {
  const [resolution, setResolution] = useState(session.resolution);
  const [proxyLocation, setProxyLocation] = useState(session.proxy.location);
  const [proxyHost, setProxyHost] = useState(session.proxy.host);
  const [proxyPort, setProxyPort] = useState(session.proxy.port);
  const [isSaved, setIsSaved] = useState(false);

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await onUpdateSession(session.id, {
      resolution,
      proxy: {
        ...session.proxy,
        location: proxyLocation,
        host: proxyHost,
        port: Number(proxyPort),
      },
    });
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-end transition-opacity">
      <div className="w-full max-w-md bg-slate-900 border-l border-slate-800 h-full flex flex-col shadow-2xl overflow-y-auto">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-100">
                Hardware Fingerprint & Isolation Vault
              </h2>
              <p className="text-[11px] text-slate-400 font-mono">
                {session.containerName} (Display :{session.vncPort - 5900})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Isolation Status Banner */}
        <div className="p-4 bg-emerald-950/30 border-b border-emerald-900/40 text-emerald-300 text-xs flex items-start gap-2.5">
          <Lock className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
          <div>
            <span className="font-semibold block text-emerald-200">
              100% Isolated Operating System Sandbox
            </span>
            GoLogin detects this sandbox as an independent physical machine with zero cross-profile telemetry leakage.
          </div>
        </div>

        {/* Read-Only Hardware Fingerprint Spec Sheet */}
        <div className="p-4 space-y-4 flex-1">
          <div>
            <h3 className="text-[11px] uppercase tracking-wider font-semibold text-slate-400 mb-2 flex items-center gap-1.5">
              <Server className="w-3.5 h-3.5 text-blue-400" />
              Virtual Machine Architecture
            </h3>
            <div className="bg-slate-950 border border-slate-800 rounded-lg divide-y divide-slate-800/80 text-xs">
              <div className="p-2.5 flex justify-between">
                <span className="text-slate-400">Host OS</span>
                <span className="font-medium text-slate-200">{session.osType}</span>
              </div>
              <div className="p-2.5 flex justify-between">
                <span className="text-slate-400">Virtual MAC Address</span>
                <span className="font-mono text-cyan-400">{session.macAddress}</span>
              </div>
              <div className="p-2.5 flex justify-between">
                <span className="text-slate-400">Docker Subnet IP</span>
                <span className="font-mono text-slate-300">
                  172.20.0.{10 + parseInt(session.id.replace('pc-', '') || '1')}
                </span>
              </div>
              <div className="p-2.5 flex justify-between">
                <span className="text-slate-400">Audio Driver</span>
                <span className="text-slate-300">PulseAudio Dummy Sink (No mic snooping)</span>
              </div>
              <div className="p-2.5 flex justify-between">
                <span className="text-slate-400">Virtual Display</span>
                <span className="font-mono text-blue-400">:{session.vncPort - 5900} (X11 / Xvfb)</span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-[11px] uppercase tracking-wider font-semibold text-slate-400 mb-2 flex items-center gap-1.5">
              <HardDrive className="w-3.5 h-3.5 text-purple-400" />
              Volume Persistence & Storage
            </h3>
            <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs space-y-2">
              <div className="flex justify-between font-mono text-[11px]">
                <span className="text-slate-400">GoLogin Config Volume:</span>
                <span className="text-purple-300">gologin_{session.id.replace('-', '')}_data</span>
              </div>
              <div className="flex justify-between font-mono text-[11px]">
                <span className="text-slate-400">Orbita Browser Binary:</span>
                <span className="text-purple-300">gologin_{session.id.replace('-', '')}_orbita</span>
              </div>
              <p className="text-[10px] text-slate-500 pt-1">
                Data persists across container restarts. No profile cache or cookies leak into other sandboxes.
              </p>
            </div>
          </div>

          {/* Form to customize resolution & proxy */}
          <form onSubmit={handleSave} className="space-y-4 pt-2">
            <div>
              <h3 className="text-[11px] uppercase tracking-wider font-semibold text-slate-400 mb-2 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-emerald-400" />
                Network Proxy & Display Settings
              </h3>
              <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 space-y-3 text-xs">
                <div>
                  <label className="block text-slate-400 mb-1">Display Resolution</label>
                  <select
                    value={resolution}
                    onChange={(e) => setResolution(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-slate-200"
                  >
                    <option value="1920x1080">1920 x 1080 (Full HD 16:9)</option>
                    <option value="1440x900">1440 x 900 (MacBook Pro standard)</option>
                    <option value="1366x768">1366 x 768 (Popular Laptop)</option>
                    <option value="1280x720">1280 x 720 (HD)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Proxy Geo Location Label</label>
                  <input
                    type="text"
                    value={proxyLocation}
                    onChange={(e) => setProxyLocation(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-slate-200 font-sans"
                    placeholder="e.g. New York, US (Residential)"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-slate-400 mb-1">Proxy Host / IP</label>
                    <input
                      type="text"
                      value={proxyHost}
                      onChange={(e) => setProxyHost(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-slate-200 font-mono text-[11px]"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Proxy Port</label>
                    <input
                      type="number"
                      value={proxyPort}
                      onChange={(e) => setProxyPort(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-slate-200 font-mono text-[11px]"
                    />
                  </div>
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-sm"
            >
              {isSaved ? (
                <>
                  <Check className="w-4 h-4 text-emerald-300" />
                  <span>Configuration Updated!</span>
                </>
              ) : (
                <span>Save Fingerprint Profile</span>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
