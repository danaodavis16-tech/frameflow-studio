
import express from "express";
import OpenAI from "openai";
import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;
const dirname = path.dirname(fileURLToPath(import.meta.url));

app.use(express.json({ limit: "15mb" }));
app.use(express.static(path.join(dirname, "public")));

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, app: "FrameFlow Studio" });
});

app.post("/api/storyboard/images", async (req, res) => {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return res.status(503).json({
        error: "OPENAI_API_KEY is not configured on the server."
      });
    }

    const frames = Array.isArray(req.body.frames)
      ? req.body.frames.slice(0, 8)
      : [];

    if (!frames.length) {
      return res.status(400).json({
        error: "Please provide at least one storyboard frame."
      });
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });

    const results = [];

    for (const frame of frames) {
      const prompt = [
        "Create one cinematic 3D cartoon animated-film storyboard frame.",
        String(frame.prompt || frame.action || frame.title || "Storyboard scene"),
        "Use expressive characters, cinematic lighting, clear composition,",
        "consistent character appearance, and no captions or watermarks."
      ].join(" ");

      const image = await openai.images.generate({
        model: process.env.OPENAI_IMAGE_MODEL || "gpt-image-2.5-flare",
        prompt,
        size: "1536x1024",
        quality: "high",
        output_format: "jpeg",
        n: 1
      });

      const encoded = image.data?.[0]?.b64_json;

      if (!encoded) {
        throw new Error("The image service returned no image.");
      }

      results.push({
        number: frame.number,
        title: frame.title || `Frame ${frame.number || results.length + 1}`,
        imageUrl: `data:image/jpeg;base64,${encoded}`
      });
    }

    res.json({ frames: results });
  } catch (error) {
    console.error("Storyboard image error:", error);
    res.status(error.status || 500).json({
      error: error.message || "Image generation failed."
    });
  }
});

app.post("/api/storyboard/video", (_req, res) => {
  res.status(503).json({
    error: "Video generation is not configured yet. We will connect the video provider after the website is deployed."
  });
});

app.get("*", (_req, res) => {
  res.sendFile(path.join(dirname, "public", "index.html"));
});

app.listen(port, () => {
  console.log(`FrameFlow Studio listening on port ${port}`);
});
