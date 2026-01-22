docker build -t rgb .

docker rm -f rgb

docker run -d \
  -e "OPENRGB_HOST=10.0.0.200" \
  -e "OPENRGB_PORT=6742" \
    --privileged \
  --name doganm95-openrgb-http-server \
    --device /dev/bus/usb:/dev/bus/usb \
  --pull always \
  -p 6744:3000 \
  --restart always \
    -v /sys:/sys:ro \
  rgb
