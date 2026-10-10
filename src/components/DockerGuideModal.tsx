import React, { useState } from 'react';
import {
  X,
  Copy,
  Check,
  Download,
  Terminal,
  Layers,
  Server,
  ShieldCheck,
  ExternalLink,
  BookOpen,
} from 'lucide-react';

interface DockerGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DockerGuideModal: React.FC<DockerGuideModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'quickstart' | 'compose' | 'dockerfile' | 'architecture'>('quickstart');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!isOpen) return null;

  const copyText = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const composeContent = `# docker-compose.yml - Multi-Desktop Sandbox Cluster
version: '3.8'

services:
  gologin-desktop-1:
    container_name: gologin-desktop-1
    image: fredblgr/ubuntu-novnc:20.04
    restart: unless-stopped
    mac_address: 02:42:ac:14:01:01
    hostname: workstation-us-01
    ports:
      - "5901:5901"   # RFB VNC
      - "6081:6080"   # noVNC WebSockets
    environment:
      - RESOLUTION=1920x1080
      - VNCPWD=gologin123
      - USER=ubuntu
    volumes:
      - gologin_pc1_data:/home/ubuntu/.config/gologin
      - gologin_pc1_orbita:/home/ubuntu/.orbita
    shm_size: 2gb

  gologin-desktop-2:
    container_name: gologin-desktop-2
    image: fredblgr/ubuntu-novnc:20.04
    restart: unless-stopped
    mac_address: 02:42:ac:14:01:02
    hostname: workstation-uk-02
    ports:
      - "5902:5901"
      - "6082:6080"
    environment:
      - RESOLUTION=1920x1080
      - VNCPWD=gologin123
      - USER=ubuntu
    volumes:
      - gologin_pc2_data:/home/ubuntu/.config/gologin
      - gologin_pc2_orbita:/home/ubuntu/.orbita
    shm_size: 2gb

  gologin-desktop-3:
    container_name: gologin-desktop-3
    image: fredblgr/ubuntu-novnc:20.04
    restart: unless-stopped
    mac_address: 02:42:ac:14:01:03
    hostname: workstation-de-03
    ports:
      - "5903:5901"
      - "6083:6080"
    environment:
      - RESOLUTION=1920x1080
      - VNCPWD=gologin123
      - USER=ubuntu
    volumes:
      - gologin_pc3_data:/home/ubuntu/.config/gologin
      - gologin_pc3_orbita:/home/ubuntu/.orbita
    shm_size: 2gb

volumes:
  gologin_pc1_data:
  gologin_pc1_orbita:
  gologin_pc2_data:
  gologin_pc2_orbita:
  gologin_pc3_data:
  gologin_pc3_orbita:`;

  const dockerfileContent = `FROM ubuntu:22.04
ENV DEBIAN_FRONTEND=noninteractive

# Install XFCE4, TigerVNC, websockify, audio dummy, and Chrome/Orbita dependencies
RUN apt-get update && apt-get install -y \\
    xfce4 xfce4-terminal tigervnc-standalone-server novnc websockify \\
    dbus-x11 libnss3 libatk-bridge2.0-0 libdrm2 libxcomposite1 \\
    libxdamage1 libxrandr2 libgbm1 libasound2 pulseaudio wget curl sudo \\
    && rm -rf /var/lib/apt/lists/*

# Add non-root user
RUN useradd -m -s /bin/bash ubuntu && echo "ubuntu ALL=(ALL) NOPASSWD:ALL" >> /etc/sudoers

# Download and install GoLogin Linux Desktop client
RUN wget -q https://gologin-desktop-linux.s3.amazonaws.com/gologin-latest.deb -O /tmp/gologin.deb || true && \\
    (dpkg -i /tmp/gologin.deb || apt-get install -f -y) && rm -f /tmp/gologin.deb

USER ubuntu
WORKDIR /home/ubuntu
EXPOSE 5901 6080`;

  const downloadFile = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="bg-slate-950 px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600/20 text-blue-400 rounded-lg border border-blue-500/20">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">
                Local Docker Orchestration Blueprint & Setup Guide
              </h2>
              <p className="text-xs text-slate-400">
                Run 3 isolated GoLogin desktop environments with noVNC WebSockets locally
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-slate-950/60 px-6 border-b border-slate-800 flex items-center gap-4 text-xs font-medium">
          <button
            onClick={() => setActiveTab('quickstart')}
            className={`py-3 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'quickstart'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Terminal className="w-4 h-4" />
            Quick Start Guide
          </button>
          <button
            onClick={() => setActiveTab('compose')}
            className={`py-3 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'compose'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-4 h-4" />
            docker-compose.yml
          </button>
          <button
            onClick={() => setActiveTab('dockerfile')}
            className={`py-3 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'dockerfile'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Server className="w-4 h-4" />
            Dockerfile
          </button>
          <button
            onClick={() => setActiveTab('architecture')}
            className={`py-3 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'architecture'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            Anti-Detect Architecture
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 p-6 overflow-y-auto space-y-6 text-slate-300 text-xs">
          {activeTab === 'quickstart' && (
            <div className="space-y-6">
              <div className="bg-blue-950/30 border border-blue-900/40 rounded-xl p-4 text-blue-200">
                <h3 className="font-semibold text-sm mb-1 text-white">How This Stack Works</h3>
                <p className="leading-relaxed">
                  GoLogin anti-detect checks require an independent operating system profile.
                  Running inside Docker gives each instance a distinct virtual machine identity,
                  spoofed MAC address, separate X11 virtual display, and isolated volume cache.
                  The web dashboard embeds each desktop screen via noVNC WebSockets.
                </p>
              </div>

              {/* Step 1 */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-200 flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px]">1</span>
                    Spin up the 3 Isolated Containers
                  </h4>
                  <button
                    onClick={() => copyText('docker compose up -d', 'step1')}
                    className="text-slate-400 hover:text-white flex items-center gap-1 text-[11px]"
                  >
                    {copiedKey === 'step1' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedKey === 'step1' ? 'Copied' : 'Copy Command'}</span>
                  </button>
                </div>
                <pre className="bg-slate-950 border border-slate-800 rounded-lg p-3 font-mono text-cyan-300 overflow-x-auto">
                  docker compose up -d
                </pre>
              </div>

              {/* Step 2 */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-200 flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px]">2</span>
                    Verify Port Bindings
                  </h4>
                  <button
                    onClick={() => copyText('docker compose ps', 'step2')}
                    className="text-slate-400 hover:text-white flex items-center gap-1 text-[11px]"
                  >
                    {copiedKey === 'step2' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedKey === 'step2' ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <div className="bg-slate-950 border border-slate-800 rounded-lg overflow-hidden">
                  <table className="w-full text-left text-[11px]">
                    <thead className="bg-slate-900/80 text-slate-400 font-mono">
                      <tr>
                        <th className="p-2.5">Container</th>
                        <th className="p-2.5">Native VNC Port</th>
                        <th className="p-2.5">noVNC WebSocket</th>
                        <th className="p-2.5">MAC Address</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/80 font-mono text-slate-300">
                      <tr>
                        <td className="p-2.5 font-bold text-blue-400">gologin-desktop-1</td>
                        <td className="p-2.5">localhost:5901</td>
                        <td className="p-2.5 text-emerald-400">localhost:6081</td>
                        <td className="p-2.5">02:42:ac:14:01:01</td>
                      </tr>
                      <tr>
                        <td className="p-2.5 font-bold text-blue-400">gologin-desktop-2</td>
                        <td className="p-2.5">localhost:5902</td>
                        <td className="p-2.5 text-emerald-400">localhost:6082</td>
                        <td className="p-2.5">02:42:ac:14:01:02</td>
                      </tr>
                      <tr>
                        <td className="p-2.5 font-bold text-blue-400">gologin-desktop-3</td>
                        <td className="p-2.5">localhost:5903</td>
                        <td className="p-2.5 text-emerald-400">localhost:6083</td>
                        <td className="p-2.5">02:42:ac:14:01:03</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Step 3 */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-200 flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px]">3</span>
                    Start the Web Dashboard Backend
                  </h4>
                  <button
                    onClick={() => copyText('npm install && npm run dev', 'step3')}
                    className="text-slate-400 hover:text-white flex items-center gap-1 text-[11px]"
                  >
                    {copiedKey === 'step3' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedKey === 'step3' ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <pre className="bg-slate-950 border border-slate-800 rounded-lg p-3 font-mono text-cyan-300">
                  npm install && npm run dev
                </pre>
                <p className="text-slate-400 text-[11px]">
                  Alternatively, for pure production without Vite: <code className="text-slate-300 font-mono">node server.js</code>
                </p>
              </div>
            </div>
          )}

          {activeTab === 'compose' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 text-xs">
                  Production ready Docker Compose configuration file
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => copyText(composeContent, 'compose')}
                    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded flex items-center gap-1.5 transition-colors"
                  >
                    {copiedKey === 'compose' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedKey === 'compose' ? 'Copied' : 'Copy YAML'}</span>
                  </button>
                  <button
                    onClick={() => downloadFile(composeContent, 'docker-compose.yml')}
                    className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded flex items-center gap-1.5 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download docker-compose.yml</span>
                  </button>
                </div>
              </div>
              <pre className="bg-slate-950 border border-slate-800 rounded-lg p-4 font-mono text-xs text-slate-300 max-h-96 overflow-y-auto">
                {composeContent}
              </pre>
            </div>
          )}

          {activeTab === 'dockerfile' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 text-xs">
                  Custom image recipe with GoLogin & Orbita pre-installed
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => copyText(dockerfileContent, 'dockerfile')}
                    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded flex items-center gap-1.5 transition-colors"
                  >
                    {copiedKey === 'dockerfile' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedKey === 'dockerfile' ? 'Copied' : 'Copy'}</span>
                  </button>
                  <button
                    onClick={() => downloadFile(dockerfileContent, 'Dockerfile')}
                    className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded flex items-center gap-1.5 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Dockerfile</span>
                  </button>
                </div>
              </div>
              <pre className="bg-slate-950 border border-slate-800 rounded-lg p-4 font-mono text-xs text-slate-300 max-h-96 overflow-y-auto">
                {dockerfileContent}
              </pre>
            </div>
          )}

          {activeTab === 'architecture' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2">
                  <h4 className="font-bold text-slate-100 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    Hardware Spoofing Isolation
                  </h4>
                  <p className="text-slate-400 leading-relaxed text-[11px]">
                    Standard anti-detect browsers running on a single host share identical MAC addresses,
                    kernel descriptors, and local network socket listeners. In this architecture,
                    each container receives a distinct MAC address (e.g. <code>02:42:ac:14:01:01</code>)
                    and dedicated network interface.
                  </p>
                </div>

                <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2">
                  <h4 className="font-bold text-slate-100 flex items-center gap-2">
                    <Layers className="w-4 h-4 text-blue-400" />
                    Persistent Storage Segmentation
                  </h4>
                  <p className="text-slate-400 leading-relaxed text-[11px]">
                    GoLogin profile databases, browser cookies, IndexedDB, and Orbita local configs
                    are mapped to independent named Docker volumes (e.g. <code>gologin_pc1_data</code>).
                    One container crashing or rebooting has zero impact on the others.
                  </p>
                </div>
              </div>

              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
                <h4 className="font-bold text-slate-100 mb-2">WebSocket Proxying Architecture (Websockify)</h4>
                <p className="text-slate-400 text-[11px] leading-relaxed mb-3">
                  Raw VNC protocol runs over RFB on TCP ports 5901-5903. Standard web browsers cannot open raw TCP sockets.
                  The backend (<code>server.ts</code> / <code>server.js</code>) provides an integrated Websockify proxy that
                  bridges incoming browser WebSockets to the TCP VNC servers, or you can connect directly to the container's
                  internal noVNC WebSocket port (6081-6083).
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
