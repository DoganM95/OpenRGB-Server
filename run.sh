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



docker run --rm -it \
    -p 6742:6742 \
    --privileged \
    --name openrgb-tcp-server \
    --device /dev/bus/usb:/dev/bus/usb \
    -v /sys:/sys:ro \
    openrgb-tcp-server:latest

docker run --rm -it `
    -p 6742:6742 `
    --privileged `
    --name openrgb-tcp-server `
    --device /dev/bus/usb:/dev/bus/usb `
    -v /sys:/sys:ro `
    openrgb-tcp-server:latest