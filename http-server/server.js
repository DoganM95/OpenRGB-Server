const express = require("express");
const morgan = require("morgan");
require("dotenv").config({ path: __dirname + "/.env" });

const { Client, Device, utils } = require("openrgb-sdk");

const app = express({});
app.use(express.json());
app.use(morgan("dev"));

const client = new Client("OpenRGB-REST-API", parseInt(process.env.OPENRGB_PORT) || 6742, process.env.OPENRGB_HOST || "0.0.0.0");

const resolveIndices = (indices, maxCount) => {
    if (!indices || indices.length === 0) return [];
    if (indices[0] === -1) return Array.from({ length: maxCount }, (value, key) => key);
    return indices;
};

app.use(async (req, res, next) => {
    try {
        await client.connect();
        req.devices = await client.getAllControllerData();
    } catch (err) {
        return res.status(500).json({ error: "Failed to connect to OpenRGB: " + err.message });
    }

    res.on("finish", async () => {
        try {
            client.disconnect();
        } catch {
            // ignore disconnect errors
        }
    });

    return next();
});

// GET /devices – list all devices
app.get("/devices", async (req, res) => {
    try {
        return res.status(200).json(req.devices);
    } catch (err) {
        console.error(err);
        return res.status(500).send(err.message);
    }
});

// GET /devices/:id – get all information of a single device
app.get("/devices/:id", async (req, res) => {
    try {
        const requestedDeviceId = parseInt(req.params.id);
        if (requestedDeviceId < 0) return res.status(400).json({ error: "Id must be greater then 0." });
        if (requestedDeviceId == NaN) return res.status(400).json({ error: "Id must be a valid number." });
        return res.status(200).json(req.devices.filter((device) => device.deviceId == requestedDeviceId));
    } catch (err) {
        console.error(err);
        return res.status(500).send(err.message);
    }
});

app.post("/", async (req, res) => {
    try {
        const { deviceIndices, zoneIndices, ledIndices, mode, color, colors } = req.body;
        if (!client.devices) return res.status(500).json({ error: "Devices not initialized" });
        const devices = client.devices;
        const resolvedDevices = resolveIndices(deviceIndices, devices.length);

        for (const deviceId of resolvedDevices) {
            const device = devices[deviceId];
            if (!device) continue;
            if (mode) await client.updateMode(deviceId, mode);

            const zones = device.zones || [];
            const leds = device.leds || [];
            const resolvedZones = resolveIndices(zoneIndices, zones.length);
            const resolvedLeds = resolveIndices(ledIndices, leds.length);
            const rgbColor = color ? utils.hexColor(color) : null;

            // Specific LEDs
            if (resolvedLeds.length > 0) {
                for (const ledId of resolvedLeds) {
                    if (ledId >= leds.length) continue;
                    await client.updateSingleLed(deviceId, ledId, rgbColor);
                }
                continue;
            }

            // Specific Zones
            if (resolvedZones.length > 0) {
                for (const zoneId of resolvedZones) {
                    const zone = zones[zoneId];
                    if (!zone) continue;
                    const zoneLedCount = zone.ledsCount || 0;
                    const zoneColors = colors ? colors.map(utils.hexColor) : Array(zoneLedCount).fill(rgbColor);
                    await client.updateZoneLeds(deviceId, zoneId, zoneColors);
                }
                continue;
            }

            // Whole device
            const deviceColors = colors ? colors.map(utils.hexColor) : Array(leds.length).fill(rgbColor);
            await client.updateLeds(deviceId, deviceColors);
        }

        res.status(200).json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// POST /devices/:id/leds – set led's of a specific device (pc component, such as mainboard, ram, etc)
// Body example: { color: {red: 100, green: 100, blue: 100 }, mode: "Breathing", ledIndex: X }
app.post("/devices/:id/leds", async (req, res) => {
    try {
        const requestedDeviceId = parseInt(req.params.id);
        if (requestedDeviceId < 0 || Number.isNaN(requestedDeviceId) || requestedDeviceId === undefined) {
            return res.status(400).json({ error: "Device index (id) must be greater than 0." });
        }

        const ledIndex = String(req.body?.ledIndex).toLowerCase() == "x" ? String(req.body?.ledIndex).toLowerCase() : parseInt(req.body?.ledIndex);
        if (ledIndex < 0 || Number.isNaN(ledIndex) || ledIndex === undefined) {
            return res.status(400).json({ error: "Led index (id) must be greater than 0." });
        }

        const red = parseInt(req.body?.color?.red);
        const green = parseInt(req.body?.color?.green);
        const blue = parseInt(req.body?.color?.blue);
        if (!(red >= 0 && red <= 255 && green >= 0 && green <= 255 && blue >= 0 && blue <= 255)) {
            return res.status(400).json({ error: "Each color must be in the range of 0 to 255." });
        }

        const deviceData = req.devices.find((device) => device.deviceId == requestedDeviceId);

        const mode = req.body?.mode;
        const modes = req.devices.find((device) => device.deviceId == requestedDeviceId).modes.map((mode) => mode.name);
        if (!modes.map((m) => m.toLowerCase()).includes(mode.toLowerCase())) {
            return res.status(400).json({ error: `Wrong mode attribute. Supported modes for device ${requestedDeviceId} are ${modes}` });
        }

        const ledCount = deviceData.leds?.length;

        // Update single led only if index is a number
        if (ledIndex !== "x") {
            client.updateSingleLed(requestedDeviceId, ledIndex, utils.color(red, green, blue));
            await client.updateMode(requestedDeviceId, mode);
            return res.status(200).json({ deviceId: requestedDeviceId, deviceName: deviceData.name, leds: ledCount, color: { red: red, green: green, blue: blue }, mode: mode });
        }

        // Update all led's of the given device if index == "x"
        for (let ledIndex = 0; ledIndex < ledCount; ledIndex++) {
            client.updateSingleLed(requestedDeviceId, ledIndex, utils.color(red, green, blue));
            await client.updateMode(requestedDeviceId, mode);
        }
        return res.status(200).json({ deviceId: requestedDeviceId, deviceName: deviceData.name, leds: ledCount, color: { red: red, green: green, blue: blue }, mode: mode });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: err.message });
    }
});

// TODO
// POST /devices/:id/zone/:zoneId – set zone color(s)
// Body: { colors: [...], fast?: boolean }
app.post("/devices/:id/zone/:zoneId", async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const zoneId = parseInt(req.params.zoneId);
        const { colors, fast = false } = req.body;
        const device = (await client.getAllControllerData())[id];
        const zone = device.zones.find((z) => z.id === zoneId);
        if (!zone) throw new Error("Zone not found");
        await client.updateZoneColors(id, zoneId, colors, fast);
        return res.status(200).json({ zone: zoneId });
    } catch (err) {
        console.error(err);
        return res.status(500).send(err.message);
    }
});

// TODO
// POST /devices/:id/profile – load or save profile
// Body: { profile: name_or_index, save?: boolean }
app.post("/devices/:id/profile", async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const { profile, save = false } = req.body;
        if (save) {
            await client.saveProfile(profile, false);
            return res.status(200).json({ saved: profile });
        } else {
            await client.loadProfile(profile, false);
            return res.status(200).json({ loaded: profile });
        }
    } catch (err) {
        console.error(err);
        return res.status(500).send(err.message);
    }
});

app.listen(3000, () => console.log("OpenRGB REST API running at http://localhost:3000"));
