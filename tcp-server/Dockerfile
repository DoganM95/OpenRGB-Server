FROM ubuntu:22.04

ENV DEBIAN_FRONTEND=noninteractive

# Install core packages and dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    ca-certificates \
    libusb-1.0-0 \
    libgl1 \
    libharfbuzz0b \
 && rm -rf /var/lib/apt/lists/*

# Download OpenRGB AppImage
RUN curl -L --retry 5 --retry-delay 3 \
    https://openrgb.org/releases/release_candidate_1.0rc1/OpenRGB_1.0rc1_x86_64_1fbacde.AppImage \
    -o /tmp/OpenRGB.AppImage && \
    chmod +x /tmp/OpenRGB.AppImage && \
    # Extract AppImage contents to /opt/openrgb
    /tmp/OpenRGB.AppImage --appimage-extract && \
    mv squashfs-root /opt/openrgb && \
    rm /tmp/OpenRGB.AppImage

# Expose OpenRGB SDK port
EXPOSE 6742

# Start OpenRGB server using extracted binary
CMD ["/opt/openrgb/AppRun", "--server"]
