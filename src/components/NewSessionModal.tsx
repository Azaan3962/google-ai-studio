import React, { useState } from 'react';
import { X, Plus, Monitor, Shield, Globe } from 'lucide-react';
import { DesktopSession } from '../types';

interface NewSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddSession: (data: Partial<DesktopSession>) => Promise<void>;
  existingCount: number;
}

export const NewSessionModal: React.FC<NewSessionModalProps> = ({
  isOpen,
  onClose,
  onAddSession,
  existingCount,
}) => {
  const nextNum = existingCount + 1;
  const [name, setName] = useState(`PC Screen ${nextNum} (Automated Sandbox)`);
  const [vncPort, setVncPort] = useState(5900 + nextNum);
  const [wsPort, setWsPort] = useState(6080 + nextNum);
  const [resolution, setResolution] = useState('1920x1080');
  const [proxyLocation, setProxyLocation] = useState('Tokyo, Japan (SoftBank Mobile)');
  const [proxyType, setProxyType] = useState<'residential' | 'socks5' | 'http'>('residential');
  const [proxyHost, setProxyHost] = useState('tokyo-res.proxy-pool.net');
  const [proxyPort, setProxyPort] = useState(10809);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onAddSession({
        name,
        vncPort,
        wsPort,
        resolution,
        proxy: {
          enabled: true,
          type: proxyType,
          host: proxyHost,
          port: proxyPort,
          location: proxyLocation,
        },
      });
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden">
        <div className="bg-slate-950 px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-600/20 text-blue-400 rounded-lg border border-blue-500/20">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-100">
                Launch Isolated Desktop Sandbox
              </h2>
              <p className="text-xs text-slate-400">
                Spins up an isolated X11 virtual display & GoLogin profile host
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

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs text-slate-300">
          <div>
            <label className="block text-slate-400 font-medium mb-1">Session / PC Screen Label</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-blue-500 text-xs"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 font-medium mb-1">VNC Port (RFB)</label>
              <input
                type="number"
                value={vncPort}
                onChange={(e) => setVncPort(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 font-mono text-xs"
                required
              />
            </div>
            <div>
              <label className="block text-slate-400 font-medium mb-1">WebSocket Port (noVNC)</label>
              <input
                type="number"
                value={wsPort}
                onChange={(e) => setWsPort(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 font-mono text-xs"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-400 font-medium mb-1">Display Resolution</label>
            <select
              value={resolution}
              onChange={(e) => setResolution(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 text-xs"
            >
              <option value="1920x1080">1920 x 1080 (Full HD)</option>
              <option value="1440x900">1440 x 900 (Laptop Standard)</option>
              <option value="1366x768">1366 x 768 (Mobile Display)</option>
              <option value="1280x720">1280 x 720 (720p)</option>
            </select>
          </div>

          {/* Proxy setup */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 space-y-3">
            <div className="flex items-center gap-2 text-slate-200 font-semibold">
              <Globe className="w-4 h-4 text-emerald-400" />
              <span>Isolated Proxy Tunnel</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 mb-1">Proxy Type</label>
                <select
                  value={proxyType}
                  onChange={(e) => setProxyType(e.target.value as any)}
                  className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-slate-200 text-xs"
                >
                  <option value="residential">Residential Proxy</option>
                  <option value="socks5">SOCKS5 Tunnel</option>
                  <option value="http">HTTP Dedicated</option>
                </select>
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Geo Location</label>
                <input
                  type="text"
                  value={proxyLocation}
                  onChange={(e) => setProxyLocation(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-slate-200 text-xs"
                  placeholder="e.g. Frankfurt, Germany"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="col-span-2">
                <label className="block text-slate-400 mb-1">Host / IP</label>
                <input
                  type="text"
                  value={proxyHost}
                  onChange={(e) => setProxyHost(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-slate-200 font-mono text-[11px]"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Port</label>
                <input
                  type="number"
                  value={proxyPort}
                  onChange={(e) => setProxyPort(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-slate-200 font-mono text-[11px]"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow-md shadow-blue-500/20"
            >
              {isSubmitting ? 'Provisioning...' : 'Spin Up PC Screen'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
