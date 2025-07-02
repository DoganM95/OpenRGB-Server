# OpenRGB-Server

Lets you control any device's rgb components, this container runs on using a containerized OpenRGB.
Currently only works on linux hosts. Useful to control e.g. a NAS server's led's for status indication (temperature, RAM usage, etc in colors, brightness, etc.)

## Run the container

```shell
docker run -d \
    --device /dev/bus/usb:/dev/bus/usb \
    --name doganm95-openrgb-tcp-server \
    --privileged \
    --pull always \
    -p 6742:6742 \
    -v /sys:/sys:ro \
    ghcr.io/doganm95/openrgb-tcp-server:latest
```

### Test cli compatibility

Use this step to check, whether the machine's rgb this container runs on can be controlled using the container (should usually work, if openRGB itself works).

```shell
docker exec -it doganm95-openrgb-tcp-server /bin/bash
```

Then try changing the color of the device that is listed first, using this in the docker shell
The 6 digit hex after --color defines the color in Red, Green & Blue.

```shell
/opt/openrgb/AppRun -d 0 --mode static --color 00FF00 -v
```


## Test container

```shell
docker run --rm -it \
  --privileged \
  --device /dev/bus/usb:/dev/bus/usb \
  -v /sys:/sys:ro \
  ubuntu:22.04 /bin/bash
```
