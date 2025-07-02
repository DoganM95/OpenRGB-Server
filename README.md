# OpenRGB-Server
A docker container that controls rgb of the components installed on the host machine, using cli or REST api.

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
