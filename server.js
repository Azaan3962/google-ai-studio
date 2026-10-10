/**
 * GoLogin Multi-Desktop Command Center
 * Deliverable 1: Express backend with integrated VNC-to-WebSocket proxy (websockify)
 * Run standalone: node server.js
 */

import express from 'express';
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

// In-memory sessions initialized with 3 isolated instances matching docker-compose.yml
let sessions = [
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

// Telemetry simulation loop
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

// --- REST API ENDPOINTS ---
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    sessionsCount: sessions.length,
    activeSessions: sessions.filter((s) => s.status === 'running').length,
    timestamp: new Date().toISOString(),
  });
});

app.get('/api/sessions', (_req, res) => {
  res.json({ success: true, sessions });
});

app.get('/api/sessions/:id', (req, res) => {
  const session = sessions.find((s) => s.id === req.params.id);
  if (!session) return res.status(404).json({ error: 'Session not found' });
  res.json({ success: true, session });
});

app.post('/api/sessions/:id/start', (req, res) => {
  const session = sessions.find((s) => s.id === req.params.id);
  if (!session) return res.status(404).json({ error: 'Session not found' });
  session.status = 'starting';
  setTimeout(() => {
    session.status = 'running';
  }, 1000);
  res.json({ success: true, session, message: `Container ${session.containerName} started` });
});

app.post('/api/sessions/:id/stop', (req, res) => {
  const session = sessions.find((s) => s.id === req.params.id);
  if (!session) return res.status(404).json({ error: 'Session not found' });
  session.status = 'stopped';
  res.json({ success: true, session, message: `Container ${session.containerName} stopped` });
});

app.post('/api/sessions/:id/restart', (req, res) => {
  const session = sessions.find((s) => s.id === req.params.id);
  if (!session) return res.status(404).json({ error: 'Session not found' });
  session.status = 'starting';
  setTimeout(() => {
    session.status = 'running';
    session.stats.uptimeSeconds = 0;
  }, 1000);
  res.json({ success: true, session, message: `Container ${session.containerName} restarted` });
});

app.post('/api/sessions/:id/launch-gologin', (req, res) => {
  const session = sessions.find((s) => s.id === req.params.id);
  if (!session) return res.status(404).json({ error: 'Session not found' });
  session.goLogin.status = 'running';
  if (req.body?.profileName) session.goLogin.activeProfileName = req.body.profileName;
  res.json({ success: true, session });
});

app.post('/api/sessions/:id/clipboard', (req, res) => {
  const session = sessions.find((s) => s.id === req.params.id);
  if (!session) return res.status(404).json({ error: 'Session not found' });
  session.clipboard = req.body.text || '';
  res.json({ success: true, clipboard: session.clipboard });
});

app.get('/api/docker/compose', (_req, res) => {
  const composePath = path.resolve(__dirname, 'docker-compose.yml');
  if (fs.existsSync(composePath)) {
    res.type('text/yaml').send(fs.readFileSync(composePath, 'utf-8'));
  } else {
    res.status(404).send('# docker-compose.yml not found');
  }
});

// Serve frontend public directory or dist
const distPath = path.resolve(__dirname, 'dist');
const publicPath = path.resolve(__dirname, 'public');

if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get('*', (_req, res) => res.sendFile(path.resolve(distPath, 'index.html')));
} else if (fs.existsSync(publicPath)) {
  app.use(express.static(publicPath));
  app.get('*', (_req, res) => res.sendFile(path.resolve(publicPath, 'index.html')));
}

// --- WEBSOCKET VNC PROXY (WEBSOCKIFY) ---
const wss = new WebSocketServer({ noServer: true });

wss.on('connection', (ws, req) => {
  const urlObj = new URL(req.url || '', `http://${req.headers.host}`);
  const targetPort = parseInt(urlObj.searchParams.get('port') || '5901', 10);
  const targetHost = urlObj.searchParams.get('host') || '127.0.0.1';

  console.log(`[websockify] Proxying WS client to TCP ${targetHost}:${targetPort}`);
  const tcpSocket = net.createConnection({ host: targetHost, port: targetPort });

  tcpSocket.on('data', (chunk) => {
    if (ws.readyState === WebSocket.OPEN) ws.send(chunk);
  });

  tcpSocket.on('error', (err) => {
    console.error(`[websockify] TCP connection error: ${err.message}`);
    if (ws.readyState === WebSocket.OPEN) ws.close(1011, err.message);
  });

  tcpSocket.on('end', () => {
    if (ws.readyState === WebSocket.OPEN) ws.close(1000, 'TCP closed');
  });

  ws.on('message', (data) => {
    if (!tcpSocket.destroyed) tcpSocket.write(data);
  });

  ws.on('close', () => tcpSocket.destroy());
  ws.on('error', () => tcpSocket.destroy());
});

server.on('upgrade', (req, socket, head) => {
  const pathname = new URL(req.url || '', `http://${req.headers.host}`).pathname;
  if (pathname === '/vnc-stream' || pathname === '/websockify') {
    wss.handleUpgrade(req, socket, head, (ws) => {
      wss.emit('connection', ws, req);
    });
  } else {
    socket.destroy();
  }
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`[GoLogin Command Center] Server listening on port ${PORT}`);
});
