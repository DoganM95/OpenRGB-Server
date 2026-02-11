const express = require("express");
const morgan = require("morgan");
require("dotenv").config({ path: __dirname + "/.env", quiet: true });

const { Client, Device, utils } = require("openrgb-sdk");

const app = express({});
app.use(express.json());
app.use(morgan("dev"));

const client = new Client("OpenRGB-REST-API", parseInt(process.env.OPENRGB_PORT) || 6742, process.env.OPENRGB_HOST || "0.0.0.0");

const resolveIndices = (indices, maxCount = 0) => {
    if (!Array.isArray(indices) || indices.length === 0) return [];
    if (indices[0] === -1) return Array.from({ length: maxCount }, (value, key) => key);
    return indices;
};

app.use(async (req, res, next) => {
    try {
        await client.connect();
        req.devices = await client.getAllControllerData();
    } catch (err) {
        return res.status(500).json({ error: "Failed to connect to OpenRGB: " + err.message, stacktrace: err });
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
        const requests = req.body; // Now we expect an array of requests
        const devices = req.devices;

        for (const request of requests) {
            const { deviceIndices, zoneIndices, ledIndices, mode, color, colors } = request;
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
        }

        res.status(200).json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message, stackTrace: err });
    }
});

app.listen(3000, () => console.log("OpenRGB REST API running at http://localhost:3000"));
