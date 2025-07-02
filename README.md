# OpenRGB-Server

This container runs OpenRGB in server mode, allowing you to control RGB components of any compatible device via network.
**Currently, it only supports Linux hosts.**
It is especially useful for managing RGB LEDs on devices such as NAS servers for status indication (e.g., temperature, RAM usage) through colors, brightness, and effects.

## Run the TCP Server

This container runs the OpenRGB TCP server (`--server` flag), which communicates over TCP/IP.
To control RGB devices remotely, you need a compatible OpenRGB client supporting the [OpenRGB SDK](https://gitlab.com/CalcProgrammer1/OpenRGB/-/blob/master/README.md#openrgb-sdk).

This container handles hardware access, exposes the network interface, and provides CLI commands, making it a mandatory component for remote RGB control.

```bash
docker run -d \
  --device /dev/bus/usb:/dev/bus/usb \
  --name doganm95-openrgb-tcp-server \
  --privileged \
  --pull always \
  -p 6742:6742 \
  -v /sys:/sys:ro \
  ghcr.io/doganm95/openrgb-tcp-server:latest
```

### Test CLI Compatibility

Check if your machine's RGB devices can be controlled inside the container. If OpenRGB works on your host, this usually works too.

1. Enter the container shell:

   ```bash
   docker exec -it doganm95-openrgb-tcp-server /bin/bash
   ```

2. Change the color of the first listed device to green (`00FF00`):

   ```bash
   /opt/openrgb/AppRun -d 0 --mode static --color 00FF00 -v
   ```

## Test Container Environment

Run a temporary container to test device permissions and USB access:

```bash
docker run --rm -it \
  --privileged \
  --device /dev/bus/usb:/dev/bus/usb \
  -v /sys:/sys:ro \
  ubuntu:22.04 /bin/bash
```

If you want, I can help you also prepare a README section for the HTTP REST API container or usage examples for clients.
