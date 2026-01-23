#!/bin/bash

docker build -t rgb .

docker rm -f rgb

docker run -d \
  -e "OPENRGB_HOST=10.0.0.200" \
  -e "OPENRGB_PORT=6742" \
  --name rgb \
  -p 6744:3000 \
  --restart always \
  rgb
