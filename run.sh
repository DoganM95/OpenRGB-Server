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