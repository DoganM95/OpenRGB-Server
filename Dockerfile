FROM ubuntu:22.04

ENV DEBIAN_FRONTEND=noninteractive

# Install all needed dependencies for OpenRGB AppImage CLI (no GUI required)
RUN apt-get update && apt-get install -y --no-install-recommends \
    wget \
    ca-certificates \
    libusb-1.0-0 \
    libhidapi-libusb0 \
    fuse \
    libfuse2 \
    libgl1 \
    libharfbuzz0b \
    libx11-6 \
    libx11-xcb1 \
    libxcb1 \
    libxext6 \
    libxrender1 \
    libxcb-glx0 \
    libxcb-xinerama0 \
    libxcb-xfixes0 \
    libxcb-shape0 \
    libxcb-randr0 \
    libxcb-sync1 \
    libxkbcommon0 \
    libxkbcommon-x11-0 \
    libfontconfig1 \
    libglib2.0-0 \
    libxcb-icccm4 \
    libxcb-image0 \
    libxcb-keysyms1 \
    libxcb-render-util0 \
    libxcb-xinput0 \
    libxcb-shm0 \
    libxcb-util1 \
    libxcb-xtest0 \
    && rm -rf /var/lib/apt/lists/*

# Download OpenRGB 1.0rc1 AppImage
RUN wget https://openrgb.org/releases/release_candidate_1.0rc1/OpenRGB_1.0rc1_x86_64_1fbacde.AppImage -O /usr/local/bin/OpenRGB.AppImage \
    && chmod +x /usr/local/bin/OpenRGB.AppImage

WORKDIR /root

CMD ["tail", "-f", "/dev/null"]