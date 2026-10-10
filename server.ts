import express, { Request, Response } from 'express';
import http from 'http';
import net from 'net';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { WebSocketServer, WebSocket } from 'ws';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);

app.use(express.json());

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

// In-memory sessions initialized with 3 isolated instances matching docker-compose.yml
let sessions: DesktopSession[] = [
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
    createdAt: new Date(Date.now() - 8420000).toISOString(),
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
    createdAt: new Date(Date.now() - 5120000).toISOString(),
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
    createdAt: new Date(Date.now() - 12600000).toISOString(),
  },
];

// Telemetry simulation timer to keep dashboard metrics realistic & active
setInterval(() => {
  sessions.forEach((s) => {
    if (s.status === 'running') {
      s.stats.uptimeSeconds += 2;
      s.stats.cpuPercent = Math.max(3, Math.min(65, +(s.stats.cpuPercent + (Math.random() * 4 - 2)).toFixed(1)));
      s.stats.latencyMs = Math.max(10, Math.min(85, +(s.stats.latencyMs + (Math.random() * 4 - 2)).toFixed(0)));
      s.stats.memoryMb = Math.max(600, Math.min(3800, s.stats.memoryMb + Math.floor(Math.random() * 7 - 3)));
    }
  });
}, 2000);

// --- REST API ROUTES ---

// Health check
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    sessionsCount: sessions.length,
    activeSessions: sessions.filter((s) => s.status === 'running').length,
  });
});

// List all desktop sessions
app.get('/api/sessions', (_req: Request, res: Response) => {
  res.json({
    success: true,
    sessions,
  });
});

// Get single session
app.get('/api/sessions/:id', (req: Request, res: Response) => {
  const session = sessions.find((s) => s.id === req.params.id);
  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }
  res.json({ success: true, session });
});

// Start session / container
app.post('/api/sessions/:id/start', (req: Request, res: Response) => {
  const session = sessions.find((s) => s.id === req.params.id);
  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }
  session.status = 'starting';
  setTimeout(() => {
    session.status = 'running';
    session.goLogin.status = 'idle';
  }, 1000);
  res.json({ success: true, session, message: `Container ${session.containerName} start initiated` });
});

// Stop session / container
app.post('/api/sessions/:id/stop', (req: Request, res: Response) => {
  const session = sessions.find((s) => s.id === req.params.id);
  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }
  session.status = 'stopped';
  session.goLogin.status = 'stopped';
  res.json({ success: true, session, message: `Container ${session.containerName} stopped` });
});

// Restart session / container
app.post('/api/sessions/:id/restart', (req: Request, res: Response) => {
  const session = sessions.find((s) => s.id === req.params.id);
  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }
  session.status = 'starting';
  setTimeout(() => {
    session.status = 'running';
    session.stats.uptimeSeconds = 0;
  }, 1200);
  res.json({ success: true, session, message: `Container ${session.containerName} rebooted` });
});

// Launch or trigger GoLogin Desktop App inside session
app.post('/api/sessions/:id/launch-gologin', (req: Request, res: Response) => {
  const session = sessions.find((s) => s.id === req.params.id);
  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }
  const { profileName } = req.body || {};
  session.goLogin.status = 'running';
  if (profileName) {
    session.goLogin.activeProfileName = profileName;
  }
  res.json({
    success: true,
    session,
    message: `Launched GoLogin Desktop App with profile '${session.goLogin.activeProfileName}' on ${session.name}`,
  });
});

// Update clipboard
app.post('/api/sessions/:id/clipboard', (req: Request, res: Response) => {
  const session = sessions.find((s) => s.id === req.params.id);
  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }
  const { text } = req.body;
  session.clipboard = text || '';
  res.json({ success: true, clipboard: session.clipboard });
});

// Create new session
app.post('/api/sessions', (req: Request, res: Response) => {
  const count = sessions.length + 1;
  const nextVnc = 5900 + count;
  const nextWs = 6080 + count;
  const hexPart = count.toString(16).padStart(2, '0');

  const newSession: DesktopSession = {
    id: `pc-${count}`,
    name: req.body.name || `PC Screen ${count}`,
    containerName: `gologin-desktop-${count}`,
    vncPort: req.body.vncPort || nextVnc,
    wsPort: req.body.wsPort || nextWs,
    status: 'running',
    resolution: req.body.resolution || '1920x1080',
    osType: req.body.osType || 'Ubuntu 22.04 LTS (XFCE)',
    macAddress: `02:42:ac:14:01:${hexPart}`,
    proxy: {
      enabled: Boolean(req.body.proxy?.enabled),
      type: req.body.proxy?.type || 'residential',
      host: req.body.proxy?.host || 'auto-assigned.proxy-pool.net',
      port: req.body.proxy?.port || 10800,
      location: req.body.proxy?.location || 'Automated Geo-IP',
    },
    goLogin: {
      status: 'idle',
      profilesCount: 1,
      activeProfileName: 'Default Profile 01',
      orbitaVersion: 'Orbita Browser v130.0 (Anti-detect build)',
    },
    stats: {
      cpuPercent: 5.5,
      memoryMb: 680,
      totalMemoryMb: 4096,
      latencyMs: 20,
      fps: 30,
      uptimeSeconds: 60,
    },
    clipboard: '',
    createdAt: new Date().toISOString(),
  };

  sessions.push(newSession);
  res.status(201).json({ success: true, session: newSession });
});

// Update session configurations (resolution, proxy, ports, etc.)
app.patch('/api/sessions/:id', (req: Request, res: Response) => {
  const session = sessions.find((s) => s.id === req.params.id);
  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }

  const { name, resolution, proxy, vncPort, wsPort } = req.body;
  if (name) session.name = name;
  if (resolution) session.resolution = resolution;
  if (vncPort) session.vncPort = Number(vncPort);
  if (wsPort) session.wsPort = Number(wsPort);
  if (proxy) session.proxy = { ...session.proxy, ...proxy };

  res.json({ success: true, session });
});

// Delete session
app.delete('/api/sessions/:id', (req: Request, res: Response) => {
  const index = sessions.findIndex((s) => s.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Session not found' });
  }
  const removed = sessions.splice(index, 1);
  res.json({ success: true, removed: removed[0] });
});

// Docker compose blueprint provider
app.get('/api/docker/compose', (_req: Request, res: Response) => {
  const composePath = path.resolve(__dirname, 'docker-compose.yml');
  if (fs.existsSync(composePath)) {
    const content = fs.readFileSync(composePath, 'utf-8');
    res.type('text/yaml').send(content);
  } else {
    res.status(404).send('# docker-compose.yml not found');
  }
});

// Docker status
app.get('/api/docker/status', (_req: Request, res: Response) => {
  res.json({
    dockerAvailable: true,
    daemonStatus: 'ready',
    mode: 'orchestrated-local-sandbox',
    activeContainers: sessions.map((s) => ({
      name: s.containerName,
      status: s.status,
      vncPort: s.vncPort,
      wsPort: s.wsPort,
      ip: `172.20.0.${10 + parseInt(s.id.replace('pc-', '') || '1')}`,
    })),
  });
});

// --- WEBSOCKET VNC PROXY (WEBSOCKIFY IN NODE.JS) ---
// Proxies incoming browser WebSockets to native TCP VNC servers (e.g., localhost:5901, 5902, 5903)
const wss = new WebSocketServer({ noServer: true });

wss.on('connection', (ws: WebSocket, req: http.IncomingMessage) => {
  const urlObj = new URL(req.url || '', `http://${req.headers.host}`);
  const targetPort = parseInt(urlObj.searchParams.get('port') || '5901', 10);
  const targetHost = urlObj.searchParams.get('host') || '127.0.0.1';

  // Create native TCP connection to VNC server
  const tcpSocket = net.createConnection({ host: targetHost, port: targetPort }, () => {
    // Connected to VNC
  });

  tcpSocket.on('data', (data: Buffer) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(data);
    }
  });

  tcpSocket.on('error', (_err) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.close(1011, `VNC TCP target ${targetHost}:${targetPort} connection refused`);
    }
  });

  tcpSocket.on('end', () => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.close(1000, 'VNC server disconnected');
    }
  });

  ws.on('message', (msg: Buffer | ArrayBuffer | Buffer[]) => {
    if (!tcpSocket.destroyed) {
      if (Buffer.isBuffer(msg)) {
        tcpSocket.write(msg);
      } else if (Array.isArray(msg)) {
        tcpSocket.write(Buffer.concat(msg));
      } else {
        tcpSocket.write(Buffer.from(msg as ArrayBuffer));
      }
    }
  });

  ws.on('close', () => {
    tcpSocket.end();
    tcpSocket.destroy();
  });

  ws.on('error', () => {
    tcpSocket.destroy();
  });
});

// Upgrade HTTP server to support WebSocket endpoint
server.on('upgrade', (request, socket, head) => {
  const pathname = new URL(request.url || '', `http://${request.headers.host}`).pathname;
  if (pathname === '/vnc-stream' || pathname === '/websockify') {
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit('connection', ws, request);
    });
  } else {
    // If not our endpoint, close socket
    socket.destroy();
  }
});

// Setup Vite middlewares in development or static serve in production
async function bootstrap() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get('*', (_req, res) => {
        res.sendFile(path.resolve(distPath, 'index.html'));
      });
    } else {
      // Fallback if built files not in dist yet
      app.use(express.static(path.resolve(__dirname, 'public')));
    }
  }

  const PORT = process.env.PORT || 3000;
  server.listen(PORT, () => {
    console.log(`[GoLogin Command Center] Server running at http://localhost:${PORT}`);
    console.log(`[GoLogin Command Center] VNC-to-WebSocket Proxy active on ws://localhost:${PORT}/vnc-stream`);
  });
}

bootstrap();
