# OpenRGB-Server

Lets you control any device's rgb components, this container runs on using a containerized OpenRGB.
Currently only works on linux hosts. Useful to control e.g. a NAS server's led's for status indication (temperature, RAM usage, etc in colors, brightness, etc.)

## Run the container

```shell
docker run --rm -it \
    -p 6742:6742 \
    --privileged \
    --name doganm95-openrgb-server \
    --device /dev/bus/usb:/dev/bus/usb \
    -v /sys:/sys:ro \
    ghcr.io/doganm95/openrgb-server:latest
```

### Test cli compatibility

Use this step to check, whether the machine's rgb this container runs on can be controlled using the container (should usually work, if openRGB itself works).

```shell
docker exec -it doganm95-openrgb-server /bin/sh
```

Then try changing the color of the device that is listed first, using this in the docker shell
The 6 digit hex after --color defines the color in Red, Green & Blue.

```shell
/usr/local/bin/OpenRGB.AppImage -d 0 --mode static --color 00FF00 -v
```
