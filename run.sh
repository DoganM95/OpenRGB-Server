docker run --rm -it \
    --privileged \
    --net=host \
    --device /dev/bus/usb:/dev/bus/usb \
    -v /sys:/sys:ro \
    openrgb-server:latest