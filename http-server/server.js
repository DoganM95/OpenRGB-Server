const net = require("net");
const express = require("express");
require("dotenv").config({ path: __dirname + "/.env" });

const app = express();
app.use(express.json());

const OPENRGB_HOST = process.env.OPENRGB_HOST || "doganm95-openrgb-tcp-server";
const OPENRGB_PORT = Number(process.env.OPENRGB_PORT) || 6742;

const PacketType = { HELLO: 0, REQUEST: 1, RESPONSE: 2, NOTIFY: 3, ERROR: 4 };

const Command = {
    GET_CONTROLLER_COUNT: 1,
    GET_CONTROLLER_DATA: 2,
    SET_LED_COLOR: 4,
    SET_LED_COLOR_ALL: 5,
    SET_MODE: 7,
    SET_BRIGHTNESS: 8,
    SET_LED_BRIGHTNESS: 9,
    SET_SPEED: 10,
    SET_LED_SPEED: 11,
    GET_PROFILE: 12,
    SET_PROFILE: 13,
    SAVE_PROFILE: 14,
    GET_DEVICE_COUNT: 15,
    GET_DEVICE_DATA: 16,
};

function writeInt32LE(value) {
    const buf = Buffer.alloc(4);
    buf.writeInt32LE(value, 0);
    return buf;
}

function writeUInt16LE(value) {
    const buf = Buffer.alloc(2);
    buf.writeUInt16LE(value, 0);
    return buf;
}

function writeString(str) {
    const strBuf = Buffer.from(str, "utf8");
    const lenBuf = writeInt32LE(strBuf.length);
    return Buffer.concat([lenBuf, strBuf]);
}

class OpenRGBClient {
    constructor(host, port) {
        this.host = host;
        this.port = port;
        this.socket = null;
        this.nextRequestId = 1;
        this.callbacks = new Map();
        this.buffer = Buffer.alloc(0);
    }

    connect() {
        return new Promise((resolve, reject) => {
            this.socket = net.createConnection(this.port, this.host, () => {
                this.sendHello().then(resolve).catch(reject);
            });

            this.socket.on("data", (data) => this.onData(data));
            this.socket.on("error", (err) => {
                console.error("Socket error:", err);
                this.rejectAll(err);
            });
            this.socket.on("close", () => {
                this.rejectAll(new Error("Connection closed"));
            });
        });
    }

    rejectAll(err) {
        for (const cb of this.callbacks.values()) {
            cb.reject(err);
        }
        this.callbacks.clear();
    }

    onData(data) {
        this.buffer = Buffer.concat([this.buffer, data]);
        while (this.buffer.length >= 8) {
            const packetLen = this.buffer.readInt32LE(0);
            if (this.buffer.length < packetLen + 4) break;

            const packetBuf = this.buffer.slice(4, 4 + packetLen);
            this.buffer = this.buffer.slice(4 + packetLen);

            this.handlePacket(packetBuf);
        }
    }

    handlePacket(buffer) {
        const packetType = buffer.readInt32LE(0);
        const requestId = buffer.readInt32LE(4);

        if (packetType === PacketType.RESPONSE) {
            const cb = this.callbacks.get(requestId);
            if (cb) {
                this.callbacks.delete(requestId);
                cb.resolve(buffer.slice(8));
            }
        }
    }

    sendPacket(packetType, requestId, payload) {
        const length = 8 + (payload ? payload.length : 0);
        const header = Buffer.alloc(8);
        header.writeInt32LE(length - 4, 0);
        header.writeInt32LE(packetType, 4);

        const requestBuf = Buffer.alloc(4);
        requestBuf.writeInt32LE(requestId, 0);

        const packet = payload ? Buffer.concat([header, requestBuf, payload]) : Buffer.concat([header, requestBuf]);
        this.socket.write(packet);
    }

    sendRequest(commandId, payload) {
        const requestId = this.nextRequestId++;
        return new Promise((resolve, reject) => {
            this.callbacks.set(requestId, { resolve, reject });

            const commandBuf = writeInt32LE(commandId);
            const fullPayload = payload ? Buffer.concat([commandBuf, payload]) : commandBuf;

            this.sendPacket(PacketType.REQUEST, requestId, fullPayload);

            setTimeout(() => {
                if (this.callbacks.has(requestId)) {
                    this.callbacks.delete(requestId);
                    reject(new Error("OpenRGB request timeout"));
                }
            }, 5000);
        });
    }

    sendHello() {
        const clientName = "OpenRGB-REST-API";
        const clientNameBuf = writeString(clientName);
        const versionBuf = writeInt32LE(1);
        const payload = Buffer.concat([clientNameBuf, versionBuf]);
        return new Promise((resolve, reject) => {
            this.socket.once("data", (data) => {
                resolve();
            });
            this.sendPacket(PacketType.HELLO, 0, payload);
        });
    }

    // --- SDK commands ---

    async getControllerCount() {
        const resp = await this.sendRequest(Command.GET_CONTROLLER_COUNT);
        return resp.readInt32LE(0);
    }

    async getControllerData(controllerIndex) {
        const payload = writeInt32LE(controllerIndex);
        const resp = await this.sendRequest(Command.GET_CONTROLLER_DATA, payload);
        return this.parseControllerData(resp);
    }

    parseControllerData(buffer) {
        // Parse according to OpenRGB SDK documentation:
        // https://gitlab.com/CalcProgrammer1/OpenRGB/-/wikis/OpenRGB-SDK-Protocol
        // Example parsing for device name, LEDs count, modes, zones etc.

        let offset = 0;

        function readInt32() {
            const val = buffer.readInt32LE(offset);
            offset += 4;
            return val;
        }

        function readString() {
            const len = readInt32();
            const str = buffer.toString("utf8", offset, offset + len);
            offset += len;
            return str;
        }

        const name = readString();
        const type = readInt32();
        const deviceType = this.deviceTypeToString(type);

        const activeMode = readInt32();
        const ledCount = readInt32();

        const leds = [];
        for (let i = 0; i < ledCount; i++) {
            const ledName = readString();
            leds.push(ledName);
        }

        const modeCount = readInt32();
        const modes = [];
        for (let i = 0; i < modeCount; i++) {
            const modeName = readString();
            modes.push(modeName);
        }

        const zoneCount = readInt32();
        const zones = [];
        for (let i = 0; i < zoneCount; i++) {
            const zoneName = readString();
            zones.push(zoneName);
        }

        return { name, deviceType, activeMode, leds, modes, zones };
    }

    deviceTypeToString(type) {
        const types = ["Unknown", "Motherboard", "DRAM", "GPU", "Peripheral"];
        return types[type] || "Unknown";
    }

    async setLedColor(controllerIndex, ledIndex, color) {
        const payload = Buffer.alloc(4 + 4 + 4);
        payload.writeInt32LE(controllerIndex, 0);
        payload.writeInt32LE(ledIndex, 4);
        payload.writeUInt8(color.red, 8);
        payload.writeUInt8(color.green, 9);
        payload.writeUInt8(color.blue, 10);
        // white channel ignored here

        await this.sendRequest(Command.SET_LED_COLOR, payload);
    }

    async setLedColorAll(controllerIndex, color) {
        const payload = Buffer.alloc(4 + 4 + 4);
        payload.writeInt32LE(controllerIndex, 0);
        payload.writeInt32LE(0, 4); // ignored
        payload.writeUInt8(color.red, 8);
        payload.writeUInt8(color.green, 9);
        payload.writeUInt8(color.blue, 10);

        await this.sendRequest(Command.SET_LED_COLOR_ALL, payload);
    }

    async setMode(controllerIndex, modeIndex) {
        const payload = Buffer.alloc(8);
        payload.writeInt32LE(controllerIndex, 0);
        payload.writeInt32LE(modeIndex, 4);

        await this.sendRequest(Command.SET_MODE, payload);
    }

    async setBrightness(controllerIndex, brightness) {
        const payload = Buffer.alloc(8);
        payload.writeInt32LE(controllerIndex, 0);
        payload.writeInt32LE(brightness, 4);

        await this.sendRequest(Command.SET_BRIGHTNESS, payload);
    }

    async setSpeed(controllerIndex, speed) {
        const payload = Buffer.alloc(8);
        payload.writeInt32LE(controllerIndex, 0);
        payload.writeInt32LE(speed, 4);

        await this.sendRequest(Command.SET_SPEED, payload);
    }

    // Add more methods like profile save/load, etc., as needed
}

// REST API endpoints

const client = new OpenRGBClient(OPENRGB_HOST, OPENRGB_PORT);

app.get("/devices", async (req, res) => {
    try {
        const count = await client.getControllerCount();
        const devices = [];
        for (let i = 0; i < count; i++) {
            const data = await client.getControllerData(i);
            devices.push({ id: i, ...data });
        }
        res.json(devices);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.get("/device/:id", async (req, res) => {
    const id = Number(req.params.id);
    try {
        const device = await client.getControllerData(id);
        res.json(device);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.post("/device/:id/color", async (req, res) => {
    const id = Number(req.params.id);
    const { red, green, blue } = req.body;
    if ([red, green, blue].some((v) => v === undefined || v < 0 || v > 255)) {
        return res.status(400).json({ error: "Invalid color values 0-255 required" });
    }
    try {
        await client.setLedColorAll(id, { red, green, blue });
        res.json({ status: "success", device: id, color: { red, green, blue } });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.post("/device/:id/mode", async (req, res) => {
    const id = Number(req.params.id);
    const { modeIndex } = req.body;
    if (typeof modeIndex !== "number" || modeIndex < 0) {
        return res.status(400).json({ error: "modeIndex (number) required" });
    }
    try {
        await client.setMode(id, modeIndex);
        res.json({ status: "success", device: id, modeIndex });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.post("/device/:id/brightness", async (req, res) => {
    const id = Number(req.params.id);
    const { brightness } = req.body;
    if (typeof brightness !== "number" || brightness < 0 || brightness > 100) {
        return res.status(400).json({ error: "brightness must be 0-100" });
    }
    try {
        await client.setBrightness(id, brightness);
        res.json({ status: "success", device: id, brightness });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.post("/device/:id/speed", async (req, res) => {
    const id = Number(req.params.id);
    const { speed } = req.body;
    if (typeof speed !== "number" || speed < 0 || speed > 100) {
        return res.status(400).json({ error: "speed must be 0-100" });
    }
    try {
        await client.setSpeed(id, speed);
        res.json({ status: "success", device: id, speed });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// TODO: Add endpoints for profiles, zones, I2C tools, save/load profiles, etc.

app.listen(3000, async () => {
    try {
        await client.connect();
        console.log("OpenRGB REST API server running at http://localhost:3000");
    } catch (e) {
        console.error("Failed to connect to OpenRGB server:", e);
        process.exit(1);
    }
});
