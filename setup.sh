#!/usr/bin/env bash
# ==============================================================================
# GoLogin Multi-Desktop Sandbox Launcher
# Automated local setup for 3 isolated desktop environments with noVNC WebSockets
# ==============================================================================

set -e

echo "=========================================================="
echo "  GoLogin Multi-Desktop Sandbox Orchestrator"
echo "=========================================================="

# Check Docker
if ! command -v docker &> /dev/null; then
    echo "[!] Error: Docker is not installed. Please install Docker Desktop or Docker Engine first."
    exit 1
fi

echo "[*] Checking Docker Compose..."
if docker compose version &> /dev/null; then
    DOCKER_COMPOSE_CMD="docker compose"
elif command -v docker-compose &> /dev/null; then
    DOCKER_COMPOSE_CMD="docker-compose"
else
    echo "[!] Error: Neither 'docker compose' nor 'docker-compose' found."
    exit 1
fi

echo "[*] Starting isolated GoLogin desktop containers..."
$DOCKER_COMPOSE_CMD up -d

echo ""
echo "[+] Containers started successfully!"
echo "    - PC Screen 1: VNC :5901 | WebSocket :6081 | MAC: 02:42:ac:14:01:01"
echo "    - PC Screen 2: VNC :5902 | WebSocket :6082 | MAC: 02:42:ac:14:01:02"
echo "    - PC Screen 3: VNC :5903 | WebSocket :6083 | MAC: 02:42:ac:14:01:03"
echo ""

if [ -f "package.json" ]; then
    echo "[*] Installing web command center dependencies..."
    npm install
    echo "[*] Starting Web Command Center on http://localhost:3000..."
    npm run dev
fi
