# Intro

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
  --restart always \
  -v /sys:/sys:ro \
  ghcr.io/doganm95/openrgb-tcp-server:latest
```

## Run the HTTP server

This container serves as a client for the TCP server, by providing a REST API to the user.

```bash
docker run -d \
  -e "OPENRGB_HOST=10.0.0.200" \
  -e "OPENRGB_PORT=6742" \
  --name doganm95-openrgb-http-server \
  --pull always \
  -p 6744:3000 \
  --restart always \
  ghcr.io/doganm95/openrgb-http-server:latest
```

- `-e "OPENRGB_HOST=<server>"`: `<server>` can be either an ip address (if running on another machine) or the name of the tcp-server container (if running on the same machine)
- `-e "OPENRGB_PORT=<port>"`: `<port>` defines the port the tcp server serves on, in the example above exposed as `6742`
- `-p x:3000`: `x` defines the port this http server should be accessible on, in this case 6744

## Rest Api

### Getting all devices

`GET` /devices

Retrieves the full list of all compatible hardware on the host machine, returned as a JSON

### Getting info for a specific device

`GET` /devices/:id

Retrieves the details for only the hardware specified by its id, returned as a JSON

### Setting RGB lighting

`POST` /

Sets the RGB led light colors & effects for a specific or all led's at once.  
Values are case insensitive, payload is an array of objects. 
Most combinations just work out of the box, reading the examples should help understanding how.

Request Examples:

#### Granular control of each device, zone & led

- Set Device 0's all zones to red (=ff0000) with static light (=direct)
- Set device 1 & 2's zones 0 & 2 to blue while keeping their current modes (effect)
- Set Device 3's individual led's 1,3,5 to green, also keeping current effect

```json
[
    {
        "deviceIndices": [0],
        "zoneIndices": [-1],
        "color": "#ff0000",
        "mode": "direct"
    },
    {
        "deviceIndices": [1,2],
        "zoneIndices": [0, 2],
        "color": "#0000ff"
    },
    {
        "deviceIndices": [3],
        "ledIndices": [1, 3, 5],
        "color": "#ff0000"
    }
]

```


#### Setting all devices at once

Use the index value `-1` to reference all devices, all zones or all led's, e.g.

All devices (and all their led's) to red:

```json
[
    {
        "deviceIndices": [-1],
        "color": "#ff0000"
    }
]

```

All zones of a specific device to red:

```json
[
    {
        "deviceIndices": [0],
        "zoneIndices": [-1],
        "color": "#ff0000"
    }
]

```

All led's of a specific zone to red:

```json
[
    {
        "deviceIndices": [0],
        "zoneIndices": [2],
        "ledIndices": [-1],
        "color": "#ff0000"
    }
]

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

For docker compatibility checks, run a temporary container to test device permissions and USB access:

```bash
docker run --rm -it \
  --privileged \
  --device /dev/bus/usb:/dev/bus/usb \
  -v /sys:/sys:ro \
  ubuntu:22.04 /bin/bash
```
