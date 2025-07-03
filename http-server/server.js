const express = require("express");
const morgan = require("morgan");
require("dotenv").config({ path: __dirname + "/.env" });

const { Client, utils } = require("openrgb-sdk");

const app = express({});
app.use(express.json());
app.use(morgan("dev"));

const client = new Client("OpenRGB-REST-API", Number(process.env.OPENRGB_PORT) || 6742, process.env.OPENRGB_HOST || "127.0.0.1");

app.use(async (req, res, next) => {
    try {
        await client.connect();
    } catch (err) {
        return res.status(500).json({ error: "Failed to connect to OpenRGB: " + err.message });
    }

    res.on("finish", async () => {
        try {
            await client.disconnect();
        } catch {
            // ignore disconnect errors
        }
    });

    return next();
});

// GET /devices – list all devices
app.get("/devices", async (req, res) => {
    res.status(200).json(await client.getAllControllerData());
});

// GET /devices/:id – get single device info
app.get("/devices/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    res.status(200).json(await client.getControllerData(id));
});

// POST /devices/:id/mode – set native mode
// Body: { mode: <id or name>, save?: boolean }
app.post("/devices/:id/mode", async (req, res) => {
    const id = parseInt(req.params.id);
    const { mode, save = false } = req.body;
    await client.updateMode(id, mode);
    if (save) await client.saveMode(id);
    res.status(200).json({ mode, saved: save });
});

// TODO
// POST /devices/:id/leds – set all LEDs
// Body: { colors: [{r,g,b}, ...] } or { color: "#ff00aa" }
app.post("/devices/:id/leds", async (req, res) => {
    const id = parseInt(req.params.id);
    const ledIndex = parseInt(req.body.ledIndex);
    if (req.body.color) {
        await client.updateSingleLed(id, ledIndex, req.body.color);
    } else if (req.body.colors) {
        colors = Array(req.body.count || 1).fill(utils.hexColor(req.body.color));
        await client.updateLeds(id, req.body.colors);
    }
    res.status(200).json({ leds: req.body.colors?.length || 1 });
});

// TODO
// POST /devices/:id/color-all – set same color everywhere
// Body: { color: "#00ff00" or {r,g,b} }
app.post("/devices/:id/color-all", async (req, res) => {
    const id = parseInt(req.params.id);
    const c = req.body.color;
    const color = typeof c === "string" ? utils.hexColor(c) : utils.color(c.red, c.green, c.blue);
    const colorArray = Array.from(color);
    await client.updateLeds(id, colorArray);
    res.status(200).json({ color: colorArray });
});

// POST /devices/:id/zone/:zoneId – set zone color(s)
// Body: { colors: [...], fast?: boolean }
app.post("/devices/:id/zone/:zoneId", async (req, res) => {
    const id = parseInt(req.params.id);
    const zoneId = parseInt(req.params.zoneId);
    const { colors, fast = false } = req.body;
    const device = (await client.getAllControllerData())[id];
    const zone = device.zones.find((z) => z.id === zoneId);
    if (!zone) throw new Error("Zone not found");
    await client.updateZoneColors(id, zoneId, colors, fast);
    res.status(200).json({ zone: zoneId });
});

// POST /devices/:id/profile – load or save profile
// Body: { profile: name_or_index, save?: boolean }
app.post("/devices/:id/profile", async (req, res) => {
    const id = parseInt(req.params.id);
    const { profile, save = false } = req.body;
    if (save) {
        await client.saveProfile(profile, false);
        res.status(200).json({ saved: profile });
    } else {
        await client.loadProfile(profile, false);
        res.status(200).json({ loaded: profile });
    }
});

app.listen(3000, () => console.log("OpenRGB REST API running at http://localhost:3000"));
