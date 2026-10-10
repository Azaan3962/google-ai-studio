/**
 * GoLogin Multi-Desktop Command Center
 * Centralized multi-tab browser dashboard managing isolated local desktop environments
 */

import React, { useEffect, useState, useCallback } from 'react';
import { Header } from './components/Header';
import { TabBar } from './components/TabBar';
import { VncViewer } from './components/VncViewer';
import { MultiScreenGrid } from './components/MultiScreenGrid';
import { FingerprintDrawer } from './components/FingerprintDrawer';
import { DockerGuideModal } from './components/DockerGuideModal';
import { NewSessionModal } from './components/NewSessionModal';
import { DesktopSession, ViewMode } from './types';

// Default mock sessions in case API backend is booting up
const INITIAL_SESSIONS: DesktopSession[] = [
  {
    id: 'pc-1',
    name: 'PC Screen 1 (US Residential)',
    containerName: 'gologin-desktop-1',
    vncPort: 5901,
    wsPort: 6081,
    status: 'running',
    resolution: '1920x1080',
    osType: 'Ubuntu 22.04 LTS (XFCE)',
    macAddress: '02:42:ac:14:01:01',
    proxy: {
      enabled: true,
      type: 'residential',
      host: 'res-us-east.proxy-mesh.net',
      port: 10801,
      location: 'New York, United States (Comcast IP)',
    },
    goLogin: {
      status: 'running',
      profilesCount: 8,
      activeProfileName: 'E-Commerce Seller US_01',
      orbitaVersion: 'Orbita Browser v130.0 (Anti-detect build)',
    },
    stats: {
      cpuPercent: 14.2,
      memoryMb: 1180,
      totalMemoryMb: 4096,
      latencyMs: 18,
      fps: 30,
      uptimeSeconds: 8420,
    },
    clipboard: 'Welcome to GoLogin Desktop on Screen 1',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'pc-2',
    name: 'PC Screen 2 (UK 4G Mobile)',
    containerName: 'gologin-desktop-2',
    vncPort: 5902,
    wsPort: 6082,
    status: 'running',
    resolution: '1920x1080',
    osType: 'Ubuntu 22.04 LTS (XFCE)',
    macAddress: '02:42:ac:14:01:02',
    proxy: {
      enabled: true,
      type: 'socks5',
      host: 'mobile-gb-lon.proxy-pool.io',
      port: 10802,
      location: 'London, United Kingdom (Vodafone 4G)',
    },
    goLogin: {
      status: 'running',
      profilesCount: 5,
      activeProfileName: 'Crypto Ops UK_Pro',
      orbitaVersion: 'Orbita Browser v130.0 (Anti-detect build)',
    },
    stats: {
      cpuPercent: 9.8,
      memoryMb: 940,
      totalMemoryMb: 4096,
      latencyMs: 24,
      fps: 30,
      uptimeSeconds: 5120,
    },
    clipboard: 'UK proxy connected: 185.220.101.44',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'pc-3',
    name: 'PC Screen 3 (Germany Datacenter)',
    containerName: 'gologin-desktop-3',
    vncPort: 5903,
    wsPort: 6083,
    status: 'running',
    resolution: '1920x1080',
    osType: 'Ubuntu 22.04 LTS (XFCE)',
    macAddress: '02:42:ac:14:01:03',
    proxy: {
      enabled: true,
      type: 'http',
      host: 'dc-de-fra.fast-exit.net',
      port: 8080,
      location: 'Frankfurt, Germany (Hetzner Dedicated)',
    },
    goLogin: {
      status: 'idle',
      profilesCount: 12,
      activeProfileName: 'Affiliate Campaign DE_03',
      orbitaVersion: 'Orbita Browser v130.0 (Anti-detect build)',
    },
    stats: {
      cpuPercent: 4.1,
      memoryMb: 720,
      totalMemoryMb: 4096,
      latencyMs: 14,
      fps: 30,
      uptimeSeconds: 12600,
    },
    clipboard: 'Orbita profile ready for launch',
    createdAt: new Date().toISOString(),
  },
];

export default function App() {
  const [sessions, setSessions] = useState<DesktopSession[]>(INITIAL_SESSIONS);
  const [activeSessionId, setActiveSessionId] = useState<string>('pc-1');
  const [viewMode, setViewMode] = useState<ViewMode>('tabbed');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Modals & Drawers
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [isNewSessionOpen, setIsNewSessionOpen] = useState(false);
  const [isFingerprintOpen, setIsFingerprintOpen] = useState(false);

  // Fetch sessions from Express backend
  const fetchSessions = useCallback(async () => {
    try {
      setIsRefreshing(true);
      const res = await fetch('/api/sessions');
      if (res.ok) {
        const data = await res.json();
        if (data.sessions && Array.isArray(data.sessions) && data.sessions.length > 0) {
          setSessions(data.sessions);
          // ensure active session exists
          if (!data.sessions.some((s: DesktopSession) => s.id === activeSessionId)) {
            setActiveSessionId(data.sessions[0].id);
          }
        }
      }
    } catch (_) {
      // In standalone client dev, fallback to state
    } finally {
      setIsRefreshing(false);
    }
  }, [activeSessionId]);

  useEffect(() => {
    fetchSessions();
    const interval = setInterval(fetchSessions, 4000);
    return () => clearInterval(interval);
  }, [fetchSessions]);

  // Active Session object
  const activeSession = sessions.find((s) => s.id === activeSessionId) || sessions[0];

  // Handlers
  const handleLaunchGoLogin = async (sessionId: string, profileName?: string) => {
    try {
      await fetch(`/api/sessions/${sessionId}/launch-gologin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profileName }),
      });
      setSessions((prev) =>
        prev.map((s) =>
          s.id === sessionId
            ? {
                ...s,
                goLogin: {
                  ...s.goLogin,
                  status: 'running',
                  activeProfileName: profileName || s.goLogin.activeProfileName,
                },
              }
            : s
        )
      );
    } catch (_) {}
  };

  const handleRestartSession = async (sessionId: string) => {
    try {
      setSessions((prev) =>
        prev.map((s) => (s.id === sessionId ? { ...s, status: 'starting' } : s))
      );
      await fetch(`/api/sessions/${sessionId}/restart`, { method: 'POST' });
      setTimeout(() => {
        setSessions((prev) =>
          prev.map((s) => (s.id === sessionId ? { ...s, status: 'running' } : s))
        );
      }, 1000);
    } catch (_) {}
  };

  const handleStopSession = async (sessionId: string) => {
    try {
      await fetch(`/api/sessions/${sessionId}/stop`, { method: 'POST' });
      setSessions((prev) =>
        prev.map((s) => (s.id === sessionId ? { ...s, status: 'stopped' } : s))
      );
    } catch (_) {}
  };

  const handleSyncClipboard = async (sessionId: string, text: string) => {
    try {
      await fetch(`/api/sessions/${sessionId}/clipboard`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      setSessions((prev) =>
        prev.map((s) => (s.id === sessionId ? { ...s, clipboard: text } : s))
      );
    } catch (_) {}
  };

  const handleUpdateSession = async (sessionId: string, updates: Partial<DesktopSession>) => {
    try {
      await fetch(`/api/sessions/${sessionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      setSessions((prev) =>
        prev.map((s) => (s.id === sessionId ? { ...s, ...updates } : s))
      );
    } catch (_) {}
  };

  const handleAddSession = async (sessionData: Partial<DesktopSession>) => {
    try {
      const res = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sessionData),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.session) {
          setSessions((prev) => [...prev, data.session]);
          setActiveSessionId(data.session.id);
        }
      }
    } catch (_) {
      // Local fallback
      const count = sessions.length + 1;
      const newSess: DesktopSession = {
        id: `pc-${count}`,
        name: sessionData.name || `PC Screen ${count}`,
        containerName: `gologin-desktop-${count}`,
        vncPort: sessionData.vncPort || 5900 + count,
        wsPort: sessionData.wsPort || 6080 + count,
        status: 'running',
        resolution: sessionData.resolution || '1920x1080',
        osType: 'Ubuntu 22.04 LTS (XFCE)',
        macAddress: `02:42:ac:14:01:0${count}`,
        proxy: sessionData.proxy || {
          enabled: true,
          type: 'residential',
          host: 'auto-pool.proxy.io',
          port: 10800,
          location: 'Tokyo, Japan',
        },
        goLogin: {
          status: 'idle',
          profilesCount: 1,
          activeProfileName: 'Default Profile 01',
          orbitaVersion: 'Orbita Browser v130.0',
        },
        stats: {
          cpuPercent: 5.2,
          memoryMb: 650,
          totalMemoryMb: 4096,
          latencyMs: 22,
          fps: 30,
          uptimeSeconds: 30,
        },
        clipboard: '',
        createdAt: new Date().toISOString(),
      };
      setSessions((prev) => [...prev, newSess]);
      setActiveSessionId(newSess.id);
    }
  };

  const handleCloseSession = async (sessionId: string) => {
    if (sessions.length <= 1) return;
    try {
      await fetch(`/api/sessions/${sessionId}`, { method: 'DELETE' });
    } catch (_) {}
    setSessions((prev) => {
      const remaining = prev.filter((s) => s.id !== sessionId);
      if (activeSessionId === sessionId && remaining.length > 0) {
        setActiveSessionId(remaining[0].id);
      }
      return remaining;
    });
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-slate-950 text-slate-100 overflow-hidden font-sans">
      {/* 1. Global Navigation & Telemetry Header */}
      <Header
        sessions={sessions}
        viewMode={viewMode}
        setViewMode={setViewMode}
        onOpenDockerGuide={() => setIsGuideOpen(true)}
        onOpenNewSession={() => setIsNewSessionOpen(true)}
        onRefresh={fetchSessions}
        isRefreshing={isRefreshing}
      />

      {/* 2. Main Content Area */}
      {viewMode === 'tabbed' ? (
        <div className="flex-1 flex flex-col min-h-0">
          {/* Chrome / OS Multi-Tab Bar */}
          <TabBar
            sessions={sessions}
            activeSessionId={activeSessionId}
            onSelectSession={setActiveSessionId}
            onCloseSession={handleCloseSession}
            onAddSession={() => setIsNewSessionOpen(true)}
          />

          {/* Interactive Screen Viewer for Active Tab */}
          {activeSession && (
            <VncViewer
              key={activeSession.id}
              session={activeSession}
              onLaunchGoLogin={handleLaunchGoLogin}
              onRestartSession={handleRestartSession}
              onStopSession={handleStopSession}
              onSyncClipboard={handleSyncClipboard}
              onOpenFingerprint={() => setIsFingerprintOpen(true)}
            />
          )}
        </div>
      ) : (
        /* Multi-Screen 3-Monitor Grid View */
        <MultiScreenGrid
          sessions={sessions}
          onSelectSession={(id) => {
            setActiveSessionId(id);
            setViewMode('tabbed');
          }}
          onLaunchGoLogin={handleLaunchGoLogin}
          onRestartSession={handleRestartSession}
          onStopSession={handleStopSession}
        />
      )}

      {/* Fingerprint & Hardware Isolation Drawer */}
      {activeSession && (
        <FingerprintDrawer
          session={activeSession}
          isOpen={isFingerprintOpen}
          onClose={() => setIsFingerprintOpen(false)}
          onUpdateSession={handleUpdateSession}
        />
      )}

      {/* Docker Orchestration Blueprint & Setup Guide Modal */}
      <DockerGuideModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
      />

      {/* Add New PC Screen Modal */}
      <NewSessionModal
        isOpen={isNewSessionOpen}
        onClose={() => setIsNewSessionOpen(false)}
        onAddSession={handleAddSession}
        existingCount={sessions.length}
      />
    </div>
  );
}
