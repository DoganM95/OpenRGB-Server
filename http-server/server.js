const express = require("express");
const morgan = require("morgan");
require("dotenv").config();
require("dotenv").config({ path: __dirname + "/.env" });

const { Client } = require("openrgb-sdk");

const app = express();
app.use(express.json());
app.use(morgan("dev"));

const client = new Client("OpenRGB-REST-API", Number(process.env.OPENRGB_PORT), process.env.OPENRGB_HOST);

app.get("/devices", async (req, res) => {
    try {
        await client.connect();
        const devices = await client.getAllControllerData();
        res.status(200).json(devices);
    } catch (err) {
        res.status(500).json({ error: err.message || "Failed to fetch devices" });
    }
});

app.listen(3000, () => console.log("OpenRGB REST API running at http://localhost:3000"));
