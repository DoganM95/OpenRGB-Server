const express = require("express");
const morgan = require("morgan");
require("dotenv").config({ path: __dirname + "/.env" });

const { Client, Device, utils } = require("openrgb-sdk");

const app = express({});
app.use(express.json());
app.use(morgan("dev"));

const client = new Client("OpenRGB-REST-API", parseInt(process.env.OPENRGB_PORT) || 6742, process.env.OPENRGB_HOST || "0.0.0.0");

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
        res.status(200).json(req.devices);
    } catch (err) {
        console.error(err);
        res.status(500).send(err.message);
    }
});

// GET /devices/:id – get all information of a single device
app.get("/devices/:id", async (req, res) => {
    try {
        const requestedDeviceId = parseInt(req.params.id);
        res.status(200).json(req.devices.filter((device) => device.deviceId == requestedDeviceId));
    } catch (err) {
        console.error(err);
        res.status(500).send(err.message);
    }
});

// POST /devices/:id/mode – set native mode
// Body: { mode: <id or name>, save?: boolean }
app.post("/devices/:id/mode", async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const { mode, save = false } = req.body;
        await client.updateMode(id, mode);
        if (save) await client.saveMode(id);
        res.status(200).json({ mode, saved: save });
    } catch (err) {
        console.error(err);
        res.status(500).send(err.message);
    }
});

// POST /devices/:id/leds – set a specific device's specific led
// Body: { color: {red: 0, green: 155, blue:255 } }
app.post("/devices/:id/led", async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const ledIndex = parseInt(req.body?.ledIndex);
        const red = parseInt(req.body?.color?.red);
        const green = parseInt(req.body?.color?.green);
        const blue = parseInt(req.body?.color?.blue);
        client.updateSingleLed(id, ledIndex, utils.color(red, green, blue));
        res.status(200).json({ leds: req.body.colors?.length || 1 });
    } catch (err) {
        console.error(err);
        res.status(500).send(err.message);
    }
});

app.post("/devices/:id/leds", async (req, res) => {
    try {
        const deviceId = parseInt(req.params.id);
        const red = parseInt(req.body?.color?.red);
        const green = parseInt(req.body?.color?.green);
        const blue = parseInt(req.body?.color?.blue);
        const deviceData = await client.getControllerData(deviceId);
        const ledCount = deviceData.leds.length;
        const deviceName = deviceData.name;
        // client.updateLeds(deviceId, Array(utils.color(red, green, blue))); // Buggy, does not set all led's of my mainboard
        for (let ledIndex = 0; ledIndex < ledCount; ledIndex++) client.updateSingleLed(deviceId, ledIndex, utils.color(red, green, blue));
        res.status(200).json({ deviceId: deviceId, deviceName: deviceName, leds: ledCount, color: { red: red, green: green, blue: blue } });
    } catch (err) {
        console.error(err);
        res.status(500).send(err.message);
    }
});

// TODO
// POST /devices/:id/color-all – set same color everywhere
// Body: { color: "#00ff00" or {r,g,b} }
app.post("/devices/:id/color-all", async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const c = req.body.color;
        const color = typeof c === "string" ? utils.hexColor(c) : utils.color(c.red, c.green, c.blue);
        const colorArray = Array.from(color);
        await client.updateLeds(id, colorArray);
        res.status(200).json({ color: colorArray });
    } catch (err) {
        console.error(err);
        res.status(500).send(err.message);
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
        res.status(200).json({ zone: zoneId });
    } catch (err) {
        console.error(err);
        res.status(500).send(err.message);
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
            res.status(200).json({ saved: profile });
        } else {
            await client.loadProfile(profile, false);
            res.status(200).json({ loaded: profile });
        }
    } catch (err) {
        console.error(err);
        res.status(500).send(err.message);
    }
});

app.listen(3000, () => console.log("OpenRGB REST API running at http://localhost:3000"));
