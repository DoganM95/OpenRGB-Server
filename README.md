# OpenRGB-Server

Lets you control any device's rgb components, this container runs on using a containerized OpenRGB.
Currently only works on linux hosts. Useful to control e.g. a NAS server's led's for status indication (temperature, RAM usage, etc in colors, brightness, etc.)

## Run the container

```shell
docker run --rm -it \
    --privileged \
    --net=host \
    --device /dev/bus/usb:/dev/bus/usb \
    -v /sys:/sys:ro \
    openrgb-server:latest
```

### Test cli compatibility

Use this step to check, whether the machine's rgb this container runs on can be controlled using the container (should usually work, if openRGB itself works).

```shell
docker exec -it doganm95-openrgb-server /sh
```
