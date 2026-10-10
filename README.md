# GoLogin Multi-Desktop Isolated Sandbox Architecture

A high-performance command center and web dashboard for running and managing multiple isolated local desktop environments with the GoLogin Desktop App simultaneously in a multi-tab browser UI.

---

## 🏗️ System Architecture Overview

```
                      +------------------------------------------+
                      |         Web Browser Client UI            |
                      |   (Chrome-Style Multi-Tab Command Center)|
                      +--------------------+---------------------+
                                           |
                   HTTP / REST API &       |   WebSocket noVNC Stream
                   Management Control      |   (Raw RFB / Websockify)
                                           v
                      +------------------------------------------+
                      |      Node.js & Express API Gateway       |
                      |      - Display Port Manager              |
                      |      - Integrated Websockify Proxy       |
                      |      - Container Lifecycle Orchestrator  |
                      +--------------------+---------------------+
                                           |
           +-------------------------------+-------------------------------+
           |                               |                               |
           v                               v                               v
+-----------------------+       +-----------------------+       +-----------------------+
|  Docker Sandbox 1     |       |  Docker Sandbox 2     |       |  Docker Sandbox 3     |
|  (gologin-desktop-1)  |       |  (gologin-desktop-2)  |       |  (gologin-desktop-3)  |
|                       |       |                       |       |                       |
| - Ubuntu 22.04 + XFCE |       | - Ubuntu 22.04 + XFCE |       | - Ubuntu 22.04 + XFCE |
| - GoLogin + Orbita    |       | - GoLogin + Orbita    |       | - GoLogin + Orbita    |
| - TigerVNC (:5901)    |       | - TigerVNC (:5902)    |       | - TigerVNC (:5903)    |
| - noVNC/WS (:6081)    |       | - noVNC/WS (:6082)    |       | - noVNC/WS (:6083)    |
| - MAC: 02:42:..:01:01 |       | - MAC: 02:42:..:01:02 |       | - MAC: 02:42:..:01:03 |
| - Res US Proxy        |       | - UK 4G Mobile Proxy  |       | - DE Datacenter Proxy |
| - Dedicated Volume 1  |       | - Dedicated Volume 2  |       | - Dedicated Volume 3  |
+-----------------------+       +-----------------------+       +-----------------------+
```

### Why Run in Isolated Containers?
GoLogin's anti-detect engine operates best when the underlying host OS and desktop environment are genuinely segmented. By running each GoLogin instance in an isolated Docker container with X11/XFCE:
1. **Host OS Fingerprint Isolation**: GoLogin detects an entirely distinct OS instance, kernel, uptime, MAC address, and hostname.
2. **Local Storage & Cookie Segmentation**: Browser cookies, local storage, indexedDB, and cache are completely isolated via dedicated Docker volumes.
3. **No Cross-Profile Port Leaks**: WebRTC, local loopback probes, and OS socket inspections cannot bleed between sessions.
4. **Network Level Proxying**: Proxies are bound directly to the container or GoLogin desktop instance.

---

## 🚀 Quick Start Guide (Run Locally)

### Prerequisites:
- **Docker** and **Docker Compose** installed (Docker Desktop on Windows/macOS, or Docker Engine on Linux).
- **Node.js** (v18 or higher) and **npm**.

### Step 1: Spin up the Isolated Desktop Containers
In the project root, launch the 3 parallel desktop sandboxes:
```bash
docker compose up -d
```
Verify the containers are healthy:
```bash
docker compose ps
```
The containers will expose:
- **PC Screen 1**: VNC on `localhost:5901`, noVNC WebSocket on `localhost:6081`
- **PC Screen 2**: VNC on `localhost:5902`, noVNC WebSocket on `localhost:6082`
- **PC Screen 3**: VNC on `localhost:5903`, noVNC WebSocket on `localhost:6083`

Default credentials for the containers:
- VNC Password: `gologin123`
- Username: `ubuntu`
- Password: `ubuntu`

### Step 2: Start the Web Command Center
Install dependencies and run the dashboard:
```bash
npm install
npm run dev
```

Open your browser at:
```
http://localhost:3000
```

---

## 💻 Available Scripts & Deliverables

- `server.ts`: Full-stack TypeScript backend with Express, Vite middleware, session endpoints, and websockify proxy.
- `server.js`: Standalone Node.js production server with integrated WebSocket-to-VNC TCP streaming bridge.
- `public/index.html`: Lightweight standalone frontend viewer.
- `docker-compose.yml`: Multi-container blueprint orchestrating 3 isolated desktop sandboxes with unique MACs and volumes.
- `docker/Dockerfile`: Recipe for building custom Ubuntu + XFCE + GoLogin + Orbita desktop containers.
