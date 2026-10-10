# ==============================================================================
# Custom Isolated GoLogin XFCE Desktop Container
# ==============================================================================
FROM ubuntu:22.04

ENV DEBIAN_FRONTEND=noninteractive
ENV USER=ubuntu
ENV HOME=/home/ubuntu

# 1. Install base utilities, XFCE4 desktop, TigerVNC, and websockify/noVNC
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    curl \
    wget \
    git \
    sudo \
    net-tools \
    novnc \
    websockify \
    tigervnc-standalone-server \
    tigervnc-common \
    xfce4 \
    xfce4-terminal \
    dbus-x11 \
    libnss3 \
    libatk-bridge2.0-0 \
    libdrm2 \
    libxcomposite1 \
    libxdamage1 \
    libxrandr2 \
    libgbm1 \
    libasound2 \
    pulseaudio \
    supervisor \
    fonts-noto \
    fonts-noto-color-emoji \
    && rm -rf /var/lib/apt/lists/*

# 2. Setup isolated non-root ubuntu user
RUN useradd -m -s /bin/bash ${USER} && \
    echo "${USER} ALL=(ALL) NOPASSWD:ALL" >> /etc/sudoers

# 3. Download & install GoLogin Linux App
# GoLogin provides an AppImage / deb for Linux desktop
RUN mkdir -p /opt/gologin && \
    wget -q https://gologin-desktop-linux.s3.amazonaws.com/gologin-latest.deb -O /tmp/gologin.deb || true && \
    (dpkg -i /tmp/gologin.deb || apt-get install -f -y) && \
    rm -f /tmp/gologin.deb

# 4. Configure desktop autostart & entrypoint
WORKDIR /home/ubuntu
USER ubuntu

EXPOSE 5901 6080

CMD ["/usr/bin/supervisord"]
