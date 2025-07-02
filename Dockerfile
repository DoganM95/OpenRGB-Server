FROM ubuntu:22.04

ENV DEBIAN_FRONTEND=noninteractive

# Install core packages and dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    ca-certificates \
    fuse \
    libusb-1.0-0 \
    libgl1 \
    libharfbuzz0b

# Install latest stable Node.js
RUN curl -fsSL https://deb.nodesource.com/setup_current.x | bash - && \
    apt-get install -y nodejs 

# Download and prepare OpenRGB AppImage
RUN curl -L --retry 5 --retry-delay 3 \
    https://openrgb.org/releases/release_candidate_1.0rc1/OpenRGB_1.0rc1_x86_64_1fbacde.AppImage \
    -o /usr/local/bin/OpenRGB.AppImage && \
    chmod +x /usr/local/bin/OpenRGB.AppImage

# Set working dir and copy everything in one go
WORKDIR /opt/openrgb-rest
COPY ./package*.json .
COPY ./server.js .

# Install Node.js dependencies
RUN npm install

# Expose OpenRGB SDK and REST API ports
EXPOSE 6742
EXPOSE 6744

# Start OpenRGB server and REST API
CMD [ "sh", "-c", "/usr/local/bin/OpenRGB.AppImage --server & sleep 2 && node /opt/openrgb-rest/server.js" ]
