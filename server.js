import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";

const app = express();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const port = process.env.PORT || 10000;

app.use(express.static(path.join(__dirname, "public")));
app.get("/api/health", (_req, res) => res.json({ ok: true, app: "FrameFlow Studio" }));
app.get("*", (_req, res) => res.sendFile(path.join(__dirname, "public", "index.html")));

app.listen(port, () => console.log(`FrameFlow Studio listening on port ${port}`));
