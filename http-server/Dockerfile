# Dockerfile.restapi
FROM ubuntu:22.04

# Install Node.js (latest stable)
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    ca-certificates \
 && curl -fsSL https://deb.nodesource.com/setup_current.x | bash - \
 && apt-get install -y nodejs \
 && rm -rf /var/lib/apt/lists/*

WORKDIR /opt/openrgb-rest

# Copy package.json and package-lock.json first for better caching
COPY package*.json ./

RUN npm install

# Copy rest of source code
COPY server.js ./

# Expose REST API port
EXPOSE 3000

CMD ["node", "/opt/openrgb-rest/server.js"]
