docker run -d \
    --privileged \
    -p 3000:3000 \
    --device /dev/bus/usb:/dev/bus/usb \
    -v /sys:/sys:ro \
    openrgb-server:latest

docker run -d `
    --privileged `
    -p 3000:3000 `
    --device /dev/bus/usb:/dev/bus/usb `
    -v /sys:/sys:ro `
    openrgb-server:latest



docker run -d \
    --device /dev/bus/usb:/dev/bus/usb \
    --name openrgb-tcp-server \
    --privileged \
    -p 6742:6742 \
    -v /sys:/sys:ro \
    ghcr.io/doganm95/openrgb-tcp-server:latest

docker run -it \
    --device /dev/bus/usb:/dev/bus/usb \
    --device /dev/fuse:/dev/fuse \
    --name openrgb-tcp-server \
    -p 6742:6742 \
    -v /sys:/sys:ro \
    ghcr.io/doganm95/openrgb-tcp-server:latest

docker run -it `
    --device /dev/bus/usb:/dev/bus/usb `
    --device /dev/fuse:/dev/fuse `
    --name openrgb-tcp-server `
    -p 6742:6742 `
    -v /sys:/sys:ro `
    openrgb-tcp-server:latest


docker run --rm -it `
    -p 6742:6742 `
    --privileged `
    --name openrgb-tcp-server `
    --device /dev/bus/usb:/dev/bus/usb `
    -v /sys:/sys:ro `
    openrgb-tcp-server:latest