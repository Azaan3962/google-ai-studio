import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  Play,
  RotateCw,
  Power,
  Maximize2,
  Minimize2,
  Copy,
  Terminal,
  Shield,
  Sliders,
  Wifi,
  Sparkles,
  ExternalLink,
  ChevronRight,
  Info,
} from 'lucide-react';
import { DesktopSession } from '../types';

interface VncViewerProps {
  session: DesktopSession;
  onLaunchGoLogin: (sessionId: string, profileName?: string) => Promise<void>;
  onRestartSession: (sessionId: string) => Promise<void>;
  onStopSession: (sessionId: string) => Promise<void>;
  onSyncClipboard: (sessionId: string, text: string) => Promise<void>;
  onOpenFingerprint: () => void;
}

export const VncViewer: React.FC<VncViewerProps> = ({
  session,
  onLaunchGoLogin,
  onRestartSession,
  onStopSession,
  onSyncClipboard,
  onOpenFingerprint,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // States
  const [scaleMode, setScaleMode] = useState<'fit' | 'actual'>('fit');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [connectionMode, setConnectionMode] = useState<'simulator' | 'live-vnc'>('simulator');
  const [liveWsUrl, setLiveWsUrl] = useState(`ws://localhost:${session.wsPort}/websockify`);
  const [vncStatus, setVncStatus] = useState<string>('Connected to Virtual Display');
  const [clipboardText, setClipboardText] = useState(session.clipboard || '');
  const [showClipboardModal, setShowClipboardModal] = useState(false);
  const [showTerminal, setShowTerminal] = useState(false);
  const [terminalHistory, setTerminalHistory] = useState<string[]>([
    `[ubuntu@${session.containerName} ~]$ uname -a`,
    `Linux ${session.containerName} 5.15.0-89-generic #99-Ubuntu SMP x86_64`,
    `[ubuntu@${session.containerName} ~]$ gologin --status`,
    `GoLogin Desktop Daemon: RUNNING | Orbita Engine: READY`,
    `[ubuntu@${session.containerName} ~]$`,
  ]);
  const [terminalInput, setTerminalInput] = useState('');

  // Interactive Window Drag state inside Canvas
  const [winPos, setWinPos] = useState({ x: 120, y: 50 });
  const [isDraggingWin, setIsDraggingWin] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [mousePos, setMousePos] = useState({ x: 200, y: 200 });

  // Profiles in GoLogin
  const [profiles, setProfiles] = useState([
    { id: '1', name: session.goLogin.activeProfileName, status: 'Running', proxy: session.proxy.location, os: 'Windows 11 Fingerprint' },
    { id: '2', name: `${session.name.split(' ')[0]} Stealth Store #2`, status: 'Ready', proxy: session.proxy.location, os: 'macOS Monterey Fingerprint' },
    { id: '3', name: `${session.name.split(' ')[0]} Ad Account Primary`, status: 'Ready', proxy: session.proxy.location, os: 'Linux Ubuntu Fingerprint' },
  ]);

  // Keep liveWsUrl in sync when session port changes
  useEffect(() => {
    setLiveWsUrl(`ws://localhost:${session.wsPort}/websockify`);
  }, [session.wsPort]);

  // Attempt RFB Live connection if live-vnc mode is selected
  useEffect(() => {
    let rfbInstance: any = null;
    let cancelled = false;

    if (connectionMode === 'live-vnc') {
      setVncStatus(`Connecting to ${liveWsUrl}...`);

      import('@novnc/novnc')
        .then((module) => {
          if (cancelled) return;
          const RFB = module.default;
          try {
            const targetContainer = containerRef.current;
            if (!targetContainer) return;

            // Clear previous canvas if any
            rfbInstance = new RFB(targetContainer, liveWsUrl, {
              credentials: { password: 'gologin123' },
            });

            rfbInstance.scaleViewport = scaleMode === 'fit';
            rfbInstance.resizeSession = true;

            rfbInstance.addEventListener('connect', () => {
              setVncStatus('Connected (Native noVNC Stream)');
            });

            rfbInstance.addEventListener('disconnect', (e: any) => {
              setVncStatus(`Disconnected from ${liveWsUrl}. Fallback to Interactive Sandbox Simulator.`);
              // Return to simulator on disconnect so user is never stuck
              setTimeout(() => {
                if (!cancelled) setConnectionMode('simulator');
              }, 2500);
            });

            rfbInstance.addEventListener('securityfailure', (e: any) => {
              setVncStatus('VNC Authentication Failed (Default password: gologin123)');
            });
          } catch (err: any) {
            setVncStatus(`Failed to initiate noVNC: ${err.message}`);
          }
        })
        .catch((err) => {
          setVncStatus(`noVNC library load error: ${err.message}`);
        });
    }

    return () => {
      cancelled = true;
      if (rfbInstance) {
        try {
          rfbInstance.disconnect();
        } catch (_) {}
      }
    };
  }, [connectionMode, liveWsUrl, scaleMode]);

  // Canvas Desktop Renderer (Interactive XFCE + GoLogin GUI)
  const drawDesktop = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || connectionMode === 'live-vnc') return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const [reqW, reqH] = session.resolution.split('x').map(Number);
    const w = reqW || 1920;
    const h = reqH || 1080;

    if (canvas.width !== w) canvas.width = w;
    if (canvas.height !== h) canvas.height = h;

    // Background Desktop Wallpaper
    const bgGrad = ctx.createLinearGradient(0, 0, w, h);
    bgGrad.addColorStop(0, '#0b132b');
    bgGrad.addColorStop(0.5, '#1c2541');
    bgGrad.addColorStop(1, '#0a0f1d');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);

    // Subtle decorative grid lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.02)';
    ctx.lineWidth = 1;
    for (let x = 0; x < w; x += 60) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y < h; y += 60) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    // Top XFCE Panel
    ctx.fillStyle = 'rgba(15, 23, 42, 0.95)';
    ctx.fillRect(0, 0, w, 32);
    ctx.fillStyle = '#334155';
    ctx.fillRect(0, 32, w, 1);

    // App Menu Button
    ctx.fillStyle = '#3b82f6';
    ctx.beginPath();
    ctx.roundRect(8, 5, 22, 22, 4);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 12px sans-serif';
    ctx.fillText('GL', 12, 21);

    ctx.fillStyle = '#f1f5f9';
    ctx.font = 'bold 12px sans-serif';
    ctx.fillText('Applications', 38, 21);

    // Quick App Shortcuts on Panel
    ctx.fillStyle = '#94a3b8';
    ctx.font = '11px monospace';
    ctx.fillText(`Container: ${session.containerName}`, 140, 21);
    ctx.fillText(`Display: :${session.vncPort - 5900}`, 340, 21);
    ctx.fillText(`MAC: ${session.macAddress}`, 450, 21);
    ctx.fillText(`Proxy: ${session.proxy.location}`, 660, 21);

    // Right-side system tray
    const timeStr = new Date().toLocaleTimeString();
    ctx.fillStyle = '#38bdf8';
    ctx.fillText(`[PulseAudio OK] [X11 :${session.vncPort - 5900}]`, w - 240, 21);
    ctx.fillStyle = '#e2e8f0';
    ctx.fillText(timeStr, w - 80, 21);

    // Desktop Shortcut Icons
    const drawShortcut = (x: number, y: number, label: string, color: string, badge?: string) => {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.roundRect(x, y, 48, 48, 8);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 16px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(label.slice(0, 2).toUpperCase(), x + 24, y + 30);

      ctx.font = '11px sans-serif';
      ctx.fillText(label, x + 24, y + 64);
      if (badge) {
        ctx.fillStyle = '#10b981';
        ctx.beginPath();
        ctx.roundRect(x + 28, y - 4, 24, 14, 4);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 8px sans-serif';
        ctx.fillText(badge, x + 40, y + 6);
      }
      ctx.textAlign = 'left';
    };

    drawShortcut(36, 60, 'GoLogin', '#2563eb', 'APP');
    drawShortcut(36, 160, 'Orbita', '#06b6d4', 'v130');
    drawShortcut(36, 260, 'Terminal', '#475569');
    drawShortcut(36, 360, 'Network', '#059669');

    // GoLogin Desktop Application Window
    const winX = winPos.x;
    const winY = winPos.y;
    const winW = Math.min(1060, w - 200);
    const winH = Math.min(680, h - 120);

    // Window Outer Shadow
    ctx.shadowColor = 'rgba(0, 0, 0, 0.65)';
    ctx.shadowBlur = 30;
    ctx.shadowOffsetY = 15;
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.roundRect(winX, winY, winW, winH, 10);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;

    // Window Title Bar (Draggable zone)
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.roundRect(winX, winY, winW, 40, [10, 10, 0, 0]);
    ctx.fill();

    // Window Window Buttons
    ctx.fillStyle = '#ef4444'; ctx.beginPath(); ctx.arc(winX + 18, winY + 20, 6, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#f59e0b'; ctx.beginPath(); ctx.arc(winX + 36, winY + 20, 6, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#10b981'; ctx.beginPath(); ctx.arc(winX + 54, winY + 20, 6, 0, Math.PI * 2); ctx.fill();

    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 13px sans-serif';
    ctx.fillText(`GoLogin Desktop - Anti-Detect Workstation [${session.name}]`, winX + 76, winY + 25);

    // Anti-Detect Shield badge
    ctx.fillStyle = '#1e3a8a';
    ctx.beginPath();
    ctx.roundRect(winX + winW - 220, winY + 10, 200, 20, 4);
    ctx.fill();
    ctx.fillStyle = '#93c5fd';
    ctx.font = 'bold 10px monospace';
    ctx.fillText('SHIELD: ACTIVE | ZERO LEAKS', winX + winW - 210, winY + 24);

    // Left Navigation Bar inside GoLogin
    const navW = 180;
    ctx.fillStyle = '#111827';
    ctx.fillRect(winX, winY + 40, navW, winH - 40);

    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 10px sans-serif';
    ctx.fillText('NAVIGATOR', winX + 16, winY + 66);

    const navItems = [
      { label: 'All Profiles', count: profiles.length, active: true },
      { label: 'Proxy Manager', count: 1, active: false },
      { label: 'Fingerprint Vault', count: 12, active: false },
      { label: 'Cloud Sync', count: 0, active: false },
      { label: 'Orbita Browser', count: 0, active: false },
    ];

    navItems.forEach((item, idx) => {
      const itemY = winY + 84 + idx * 34;
      if (item.active) {
        ctx.fillStyle = 'rgba(37, 99, 235, 0.2)';
        ctx.beginPath();
        ctx.roundRect(winX + 8, itemY, navW - 16, 28, 6);
        ctx.fill();
        ctx.fillStyle = '#60a5fa';
      } else {
        ctx.fillStyle = '#94a3b8';
      }
      ctx.font = '12px sans-serif';
      ctx.fillText(item.label, winX + 20, itemY + 18);
      if (item.count > 0) {
        ctx.fillStyle = '#64748b';
        ctx.font = '10px monospace';
        ctx.fillText(String(item.count), winX + navW - 28, itemY + 18);
      }
    });

    // Main App Area
    const mainX = winX + navW;
    const mainY = winY + 40;
    const mainW = winW - navW;
    const mainH = winH - 40;

    ctx.fillStyle = '#0f172a';
    ctx.fillRect(mainX, mainY, mainW, mainH);

    // Content Top Bar
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(mainX, mainY, mainW, 52);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 15px sans-serif';
    ctx.fillText('Isolated Browser Profiles', mainX + 20, mainY + 32);

    // "+ New Profile" button in GoLogin
    const addBtnX = mainX + mainW - 140;
    ctx.fillStyle = '#2563eb';
    ctx.beginPath();
    ctx.roundRect(addBtnX, mainY + 12, 120, 28, 6);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 11px sans-serif';
    ctx.fillText('+ New Profile', addBtnX + 22, mainY + 30);

    // Table Headers
    const tableHeaderY = mainY + 70;
    ctx.fillStyle = '#64748b';
    ctx.font = 'bold 10px sans-serif';
    ctx.fillText('PROFILE NAME', mainX + 20, tableHeaderY);
    ctx.fillText('ANTI-DETECT FINGERPRINT', mainX + 240, tableHeaderY);
    ctx.fillText('ISOLATED PROXY', mainX + 460, tableHeaderY);
    ctx.fillText('STATUS', mainX + 640, tableHeaderY);
    ctx.fillText('ACTION', mainX + mainW - 120, tableHeaderY);

    // Table Rows
    profiles.forEach((p, idx) => {
      const rowY = tableHeaderY + 16 + idx * 72;
      ctx.fillStyle = idx % 2 === 0 ? '#131d35' : '#111a2e';
      ctx.beginPath();
      ctx.roundRect(mainX + 12, rowY, mainW - 24, 62, 8);
      ctx.fill();

      // Border highlight if active
      if (p.status === 'Running') {
        ctx.strokeStyle = '#2563eb';
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      // Profile Name
      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 13px sans-serif';
      ctx.fillText(p.name, mainX + 24, rowY + 28);
      ctx.fillStyle = '#94a3b8';
      ctx.font = '10px monospace';
      ctx.fillText(`Orbita ID: orbita_00${p.id}_${session.containerName}`, mainX + 24, rowY + 46);

      // Fingerprint details
      ctx.fillStyle = '#38bdf8';
      ctx.font = '11px sans-serif';
      ctx.fillText(p.os, mainX + 240, rowY + 28);
      ctx.fillStyle = '#64748b';
      ctx.font = '10px monospace';
      ctx.fillText('Canvas Noise: On | WebGL: Custom', mainX + 240, rowY + 46);

      // Proxy info
      ctx.fillStyle = '#a78bfa';
      ctx.font = '11px sans-serif';
      ctx.fillText(p.proxy, mainX + 460, rowY + 28);
      ctx.fillStyle = '#64748b';
      ctx.font = '10px monospace';
      ctx.fillText(`${session.proxy.type.toUpperCase()} :${session.proxy.port}`, mainX + 460, rowY + 46);

      // Status Badge
      const isPRunning = p.status === 'Running';
      ctx.fillStyle = isPRunning ? '#065f46' : '#334155';
      ctx.beginPath();
      ctx.roundRect(mainX + 640, rowY + 18, 70, 24, 4);
      ctx.fill();
      ctx.fillStyle = isPRunning ? '#34d399' : '#94a3b8';
      ctx.font = 'bold 10px sans-serif';
      ctx.fillText(p.status.toUpperCase(), mainX + 652, rowY + 34);

      // Run / Stop button
      const actBtnX = mainX + mainW - 120;
      ctx.fillStyle = isPRunning ? '#dc2626' : '#16a34a';
      ctx.beginPath();
      ctx.roundRect(actBtnX, rowY + 16, 80, 28, 6);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 11px sans-serif';
      ctx.fillText(isPRunning ? 'STOP' : 'RUN', actBtnX + (isPRunning ? 24 : 26), rowY + 34);
    });

    // Draw Simulated Virtual Cursor
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(mousePos.x, mousePos.y);
    ctx.lineTo(mousePos.x + 12, mousePos.y + 12);
    ctx.lineTo(mousePos.x + 5, mousePos.y + 13);
    ctx.lineTo(mousePos.x + 1, mousePos.y + 18);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }, [session, winPos, profiles, mousePos, connectionMode]);

  // Animation render loop
  useEffect(() => {
    let animId: number;
    const loop = () => {
      drawDesktop();
      animId = requestAnimationFrame(loop);
    };
    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [drawDesktop]);

  // Handle canvas mouse move
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    setMousePos({ x, y });

    if (isDraggingWin) {
      setWinPos({
        x: Math.max(0, Math.min(canvas.width - 200, x - dragOffset.x)),
        y: Math.max(32, Math.min(canvas.height - 100, y - dragOffset.y)),
      });
    }
  };

  // Handle canvas mouse down
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    // Check if clicked in window title bar to drag
    const winW = Math.min(1060, canvas.width - 200);
    if (x >= winPos.x && x <= winPos.x + winW && y >= winPos.y && y <= winPos.y + 40) {
      setIsDraggingWin(true);
      setDragOffset({ x: x - winPos.x, y: y - winPos.y });
    }
  };

  const handleMouseUp = () => {
    setIsDraggingWin(false);
  };

  // Handle canvas click to trigger profile action
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    // Check if clicked on Run/Stop button of profiles
    const winW = Math.min(1060, canvas.width - 200);
    const navW = 180;
    const mainX = winPos.x + navW;
    const mainW = winW - navW;
    const tableHeaderY = winPos.y + 40 + 70;

    profiles.forEach((p, idx) => {
      const rowY = tableHeaderY + 16 + idx * 72;
      const actBtnX = mainX + mainW - 120;
      if (x >= actBtnX && x <= actBtnX + 80 && y >= rowY + 16 && y <= rowY + 44) {
        // Toggle profile state
        setProfiles((prev) =>
          prev.map((item, i) =>
            i === idx
              ? { ...item, status: item.status === 'Running' ? 'Ready' : 'Running' }
              : item
          )
        );
      }
    });

    // Check if clicked "+ New Profile" button
    const addBtnX = mainX + mainW - 140;
    if (x >= addBtnX && x <= addBtnX + 120 && y >= winPos.y + 52 && y <= winPos.y + 80) {
      const count = profiles.length + 1;
      setProfiles((prev) => [
        ...prev,
        {
          id: String(count),
          name: `${session.name.split(' ')[0]} Anti-Detect Profile #${count}`,
          status: 'Ready',
          proxy: session.proxy.location,
          os: count % 2 === 0 ? 'macOS Ventura' : 'Windows 11 Enterprise',
        },
      ]);
    }

    // Check if clicked Terminal icon (x: 36, y: 260)
    if (x >= 36 && x <= 84 && y >= 260 && y <= 308) {
      setShowTerminal((prev) => !prev);
    }
  };

  // Keyboard shortcut passthrough
  const sendCtrlAltDel = () => {
    setVncStatus('Sent keystroke signal: Ctrl + Alt + Delete to X11 Server');
  };

  const sendAltTab = () => {
    setVncStatus('Sent keystroke signal: Alt + Tab (Window Cycle)');
  };

  // Terminal command execution
  const handleTerminalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!terminalInput.trim()) return;
    const cmd = terminalInput.trim();
    const newHist = [...terminalHistory, `[ubuntu@${session.containerName} ~]$ ${cmd}`];

    if (cmd === 'clear') {
      setTerminalHistory([]);
      setTerminalInput('');
      return;
    } else if (cmd.includes('gologin') || cmd === 'gologin') {
      newHist.push('GoLogin Desktop v3.3.4 (Anti-Detect Engine)');
      newHist.push(`Active Display: :${session.vncPort - 5900} | Running Profiles: ${profiles.filter((p) => p.status === 'Running').length}`);
      newHist.push(`Orbita Browser Binary: /home/ubuntu/.orbita/orbita-browser/chrome`);
    } else if (cmd.includes('ip') || cmd.includes('ifconfig')) {
      newHist.push(`eth0: flags=4163<UP,BROADCAST,RUNNING,MULTICAST> mtu 1500`);
      newHist.push(`        inet 172.20.0.${10 + parseInt(session.id.replace('pc-', '') || '1')}  netmask 255.255.0.0`);
      newHist.push(`        ether ${session.macAddress}  txqueuelen 0 (Ethernet)`);
    } else if (cmd.includes('curl') || cmd.includes('proxy')) {
      newHist.push(`HTTP Proxy Tunnel: ${session.proxy.host}:${session.proxy.port}`);
      newHist.push(`Exit IP Geo: ${session.proxy.location}`);
      newHist.push(`Fingerprint Leak Test: 0 WebRTC Leaks, 0 DNS Leaks`);
    } else {
      newHist.push(`Executed: ${cmd} (Exit status 0)`);
    }

    setTerminalHistory(newHist);
    setTerminalInput('');
  };

  return (
    <div className="flex-1 flex flex-col bg-slate-950 overflow-hidden relative">
      {/* Viewer Action Toolbar */}
      <div className="bg-slate-900 border-b border-slate-800 px-4 py-2 flex flex-wrap items-center justify-between gap-3 text-xs select-none">
        {/* Left Toolbar: Quick Actions */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={() => onLaunchGoLogin(session.id)}
            className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded font-medium flex items-center gap-1.5 shadow-sm transition-colors"
            title="Launch GoLogin Desktop inside container"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Launch GoLogin</span>
          </button>

          <div className="w-px h-4 bg-slate-700 mx-1" />

          <button
            onClick={sendCtrlAltDel}
            className="px-2 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded flex items-center gap-1 transition-colors"
            title="Send Ctrl+Alt+Del signal"
          >
            <span>Ctrl+Alt+Del</span>
          </button>

          <button
            onClick={sendAltTab}
            className="px-2 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded flex items-center gap-1 transition-colors"
            title="Send Alt+Tab"
          >
            <span>Alt+Tab</span>
          </button>

          <button
            onClick={() => setShowClipboardModal(true)}
            className="px-2 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded flex items-center gap-1 transition-colors"
            title="Sync clipboard with remote desktop"
          >
            <Copy className="w-3.5 h-3.5 text-cyan-400" />
            <span>Sync Clipboard</span>
          </button>

          <button
            onClick={() => setShowTerminal((prev) => !prev)}
            className={`px-2 py-1.5 rounded flex items-center gap-1 transition-colors ${
              showTerminal ? 'bg-purple-600/30 text-purple-300 border border-purple-500/40' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
            }`}
            title="Toggle terminal console"
          >
            <Terminal className="w-3.5 h-3.5 text-purple-400" />
            <span>X11 Terminal</span>
          </button>

          <button
            onClick={onOpenFingerprint}
            className="px-2 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded flex items-center gap-1 transition-colors"
            title="Inspect container hardware fingerprint"
          >
            <Shield className="w-3.5 h-3.5 text-emerald-400" />
            <span>Fingerprint Vault</span>
          </button>
        </div>

        {/* Center / Right: Connection Mode & Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Connection Mode Selector */}
          <div className="flex items-center bg-slate-950 rounded-lg p-0.5 border border-slate-800">
            <button
              onClick={() => setConnectionMode('simulator')}
              className={`px-2 py-1 rounded text-[11px] font-medium transition-colors ${
                connectionMode === 'simulator'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Interactive Canvas
            </button>
            <button
              onClick={() => setConnectionMode('live-vnc')}
              className={`px-2 py-1 rounded text-[11px] font-medium transition-colors ${
                connectionMode === 'live-vnc'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Connect directly to native noVNC WebSocket"
            >
              Live noVNC Stream
            </button>
          </div>

          {/* Scale mode */}
          <button
            onClick={() => setScaleMode((m) => (m === 'fit' ? 'actual' : 'fit'))}
            className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[11px] font-mono"
            title="Toggle scaling mode"
          >
            {scaleMode === 'fit' ? 'Fit Window' : '1:1 Actual'}
          </button>

          {/* Reboot Session */}
          <button
            onClick={() => onRestartSession(session.id)}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-amber-400 rounded"
            title="Reboot Desktop Container"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>

          {/* Fullscreen */}
          <button
            onClick={() => {
              if (!document.fullscreenElement) {
                containerRef.current?.requestFullscreen();
                setIsFullscreen(true);
              } else {
                document.exitFullscreen();
                setIsFullscreen(false);
              }
            }}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded"
            title="Fullscreen viewer"
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Connection Info Strip */}
      <div className="bg-slate-950/80 px-4 py-1.5 border-b border-slate-900 flex items-center justify-between text-[11px] text-slate-400">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 inline-block"></span>
            <span className="text-slate-300 font-medium">{session.name}</span>
          </span>
          <span>•</span>
          <span className="font-mono text-slate-400">
            VNC: <strong>localhost:{session.vncPort}</strong>
          </span>
          <span>•</span>
          <span className="font-mono text-slate-400">
            WebSocket: <strong>localhost:{session.wsPort}</strong>
          </span>
          <span>•</span>
          <span className="text-slate-400">
            Res: <strong>{session.resolution}</strong>
          </span>
        </div>
        <div className="flex items-center gap-2 font-mono text-[10px]">
          <span className="text-slate-500">Latency: {session.stats.latencyMs}ms</span>
          <span className="text-slate-500">FPS: {session.stats.fps}</span>
          <span className="text-blue-400 bg-blue-950/60 px-1.5 py-0.5 rounded border border-blue-900/60">
            {vncStatus}
          </span>
        </div>
      </div>

      {/* Main Viewport Container */}
      <div
        ref={containerRef}
        className="flex-1 overflow-auto bg-slate-950 flex items-center justify-center p-2 relative"
      >
        {connectionMode === 'simulator' ? (
          <div
            className={`relative flex items-center justify-center ${
              scaleMode === 'fit' ? 'w-full h-full max-w-full max-h-full' : 'w-auto h-auto'
            }`}
          >
            <canvas
              ref={canvasRef}
              onMouseMove={handleMouseMove}
              onMouseDown={handleMouseDown}
              onMouseUp={handleMouseUp}
              onClick={handleCanvasClick}
              className={`rounded shadow-2xl border border-slate-800 transition-all ${
                scaleMode === 'fit' ? 'w-full h-full object-contain' : ''
              }`}
              style={{
                cursor: isDraggingWin ? 'grabbing' : 'default',
              }}
            />
          </div>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 text-xs p-6 text-center">
            <div className="max-w-md bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl">
              <div className="w-12 h-12 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center mx-auto mb-4">
                <Wifi className="w-6 h-6 animate-pulse" />
              </div>
              <h3 className="text-slate-200 font-bold text-sm mb-1">
                Connecting to Native noVNC Stream
              </h3>
              <p className="text-slate-400 text-xs mb-4">
                Targeting WebSocket bridge at <code className="text-cyan-300 font-mono">{liveWsUrl}</code>
              </p>
              <div className="bg-slate-950 rounded-lg p-3 text-left font-mono text-[11px] text-slate-300 border border-slate-800 mb-4 space-y-1">
                <div className="text-slate-500"># Verify local container is running:</div>
                <div className="text-emerald-400">$ docker compose up -d</div>
                <div className="text-slate-500"># Container: {session.containerName}</div>
                <div>Status: {session.status}</div>
                <div>Port: {session.vncPort} (RFB) / {session.wsPort} (WS)</div>
              </div>
              <div className="flex gap-2 justify-center">
                <button
                  onClick={() => setConnectionMode('simulator')}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-medium"
                >
                  Return to Interactive Canvas Simulator
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Floating Terminal Drawer */}
        {showTerminal && (
          <div className="absolute bottom-4 right-4 w-[480px] h-72 bg-slate-950/95 border border-slate-700 rounded-lg shadow-2xl backdrop-blur-md flex flex-col z-20 overflow-hidden font-mono text-xs">
            <div className="bg-slate-900 px-3 py-2 border-b border-slate-800 flex items-center justify-between text-slate-300">
              <div className="flex items-center gap-2">
                <Terminal className="w-3.5 h-3.5 text-purple-400" />
                <span className="font-semibold text-[11px]">
                  bash — ubuntu@{session.containerName}: ~
                </span>
              </div>
              <button
                onClick={() => setShowTerminal(false)}
                className="text-slate-400 hover:text-white text-xs px-1"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 p-3 overflow-y-auto space-y-1 text-slate-300 select-text">
              {terminalHistory.map((line, idx) => (
                <div key={idx} className={line.startsWith('[ubuntu') ? 'text-cyan-300 font-semibold' : 'text-slate-400'}>
                  {line}
                </div>
              ))}
            </div>
            <form onSubmit={handleTerminalSubmit} className="border-t border-slate-800 p-2 flex items-center gap-2 bg-slate-900/60">
              <span className="text-emerald-400 font-bold">$</span>
              <input
                type="text"
                value={terminalInput}
                onChange={(e) => setTerminalInput(e.target.value)}
                placeholder="type command (e.g. gologin, curl ifconfig.me, clear)..."
                className="flex-1 bg-transparent text-white focus:outline-none text-xs"
                autoFocus
              />
            </form>
          </div>
        )}
      </div>

      {/* Clipboard Modal */}
      {showClipboardModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 max-w-md w-full shadow-2xl">
            <h3 className="font-bold text-slate-100 text-sm mb-2 flex items-center gap-2">
              <Copy className="w-4 h-4 text-blue-400" />
              Remote Desktop Clipboard Sync
            </h3>
            <p className="text-xs text-slate-400 mb-3">
              Type or paste text below to sync directly into the X11 clipboard of <strong>{session.name}</strong>.
            </p>
            <textarea
              rows={4}
              value={clipboardText}
              onChange={(e) => setClipboardText(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500 font-mono mb-4"
              placeholder="Paste passwords, URLs, or cookies here..."
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowClipboardModal(false)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  await onSyncClipboard(session.id, clipboardText);
                  setShowClipboardModal(false);
                }}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-medium"
              >
                Push to Remote Clipboard
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
