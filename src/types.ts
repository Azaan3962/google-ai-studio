export interface DesktopSession {
  id: string;
  name: string;
  containerName: string;
  vncPort: number;
  wsPort: number;
  status: 'running' | 'stopped' | 'starting' | 'error';
  resolution: string;
  osType: string;
  macAddress: string;
  proxy: {
    enabled: boolean;
    type: 'socks5' | 'http' | 'residential';
    host: string;
    port: number;
    location: string;
  };
  goLogin: {
    status: 'running' | 'idle' | 'stopped';
    profilesCount: number;
    activeProfileName: string;
    orbitaVersion: string;
  };
  stats: {
    cpuPercent: number;
    memoryMb: number;
    totalMemoryMb: number;
    latencyMs: number;
    fps: number;
    uptimeSeconds: number;
  };
  clipboard: string;
  createdAt: string;
}

export type ViewMode = 'tabbed' | 'grid';
