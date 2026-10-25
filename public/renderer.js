
import { FFmpeg } from "@ffmpeg/ffmpeg";

let ffmpegInstance;

async function getFFmpeg(onProgress) {
  if (!ffmpegInstance) {
    const ffmpeg = new FFmpeg();

    ffmpeg.on("progress", ({ progress }) => {
      if (onProgress) {
        onProgress(Math.max(0, Math.min(100, Math.round(progress * 100))));
      }
    });

    await ffmpeg.load({
      coreURL: "/ffmpeg-core.js",
      wasmURL: "/ffmpeg-core.wasm"
    });

    ffmpegInstance = ffmpeg;
  }

  return ffmpegInstance;
}

function drawFrame(ctx, shot, index, frame, totalFrames, projectTitle) {
  const w = 640;
  const h = 360;
  const t = frame / Math.max(1, totalFrames - 1);
  const camera = String(shot?.camera || "Wide shot");
  const movement = String(shot?.movement || "Slow push-in");
  const title = String(shot?.title || `Shot ${index + 1}`);
  const action = String(shot?.action || "A cinematic moment unfolds.");

  ctx.fillStyle = "#10131d";
  ctx.fillRect(0, 0, w, h);

  const gradient = ctx.createLinearGradient(0, 0, w, h);
  gradient.addColorStop(0, "#152c43");
  gradient.addColorStop(0.55, "#4a3c4b");
  gradient.addColorStop(1, "#d47756");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, w, h);

  const zoom = movement.toLowerCase().includes("pull")
    ? 1.12 - t * 0.12
    : 1 + t * 0.12;

  const pan = movement.toLowerCase().includes("pan")
    ? (t - 0.5) * 65
    : movement.toLowerCase().includes("tracking")
    ? t * 45
    : 0;

  ctx.save();
  ctx.translate(w / 2 + pan, h / 2);
  ctx.scale(zoom, zoom);
  ctx.translate(-w / 2, -h / 2);

  // Cinematic horizon and landscape.
  ctx.fillStyle = "#202733";
  ctx.beginPath();
  ctx.moveTo(0, 245);
  ctx.lineTo(100, 190);
  ctx.lineTo(215, 240);
  ctx.lineTo(360, 170);
  ctx.lineTo(500, 225);
  ctx.lineTo(640, 180);
  ctx.lineTo(640, 360);
  ctx.lineTo(0, 360);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#111923";
  ctx.fillRect(0, 275, 640, 85);

  // A simple graphic subject, not AI-generated footage.
  const cx = 320 + Math.sin(t * Math.PI * 2) * 18;
  const cy = camera.toLowerCase().includes("high") ? 205 : 225;

  ctx.fillStyle = "#f0b17a";
  ctx.beginPath();
  ctx.arc(cx, cy - 45, 17, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#18212c";
  ctx.fillRect(cx - 17, cy - 27, 34, 62);

  ctx.strokeStyle = "#18212c";
  ctx.lineWidth = 10;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(cx - 10, cy + 30);
  ctx.lineTo(cx - 19, cy + 58);
  ctx.moveTo(cx + 10, cy + 30);
  ctx.lineTo(cx + 20, cy + 58);
  ctx.moveTo(cx - 14, cy - 15);
  ctx.lineTo(cx - 32, cy + 5);
  ctx.moveTo(cx + 14, cy - 15);
  ctx.lineTo(cx + 31, cy + 1);
  ctx.stroke();

  ctx.restore();

  // Storyboard labels and cinematic typography.
  ctx.fillStyle = "rgba(8,10,15,.76)";
  ctx.fillRect(0, 0, w, 57);
  ctx.fillRect(0, 245, w, 115);

  ctx.fillStyle = "#ff8a67";
  ctx.font = "bold 13px sans-serif";
  ctx.fillText(`FRAMEFLOW  /  SHOT ${String(index + 1).padStart(2, "0")}`, 24, 24);

  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 23px sans-serif";
  ctx.fillText(title.slice(0, 42), 24, 282);

  ctx.fillStyle = "#e0e2e8";
  ctx.font = "14px sans-serif";
  const description = action.length > 75
    ? action.slice(0, 72) + "..."
    : action;
  ctx.fillText(description, 24, 309);

  ctx.fillStyle = "#ffb18f";
  ctx.font = "12px sans-serif";
  ctx.fillText(`${camera}  /  ${movement}`, 24, 335);

  // Fade each shot in from black.
  const fadeFrames = Math.min(4, Math.floor(totalFrames / 3));
  const fade = fadeFrames > 0
    ? Math.max(0, 1 - frame / fadeFrames)
    : 0;

  if (fade > 0) {
    ctx.fillStyle = `rgba(0,0,0,${fade})`;
    ctx.fillRect(0, 0, w, h);
  }
}

function drawTitleCard(ctx, title, frame, frames) {
  const w = 640;
  const h = 360;
  const t = frame / Math.max(1, frames - 1);

  ctx.fillStyle = "#101114";
  ctx.fillRect(0, 0, w, h);

  ctx.strokeStyle = "#ff715b";
  ctx.lineWidth = 2;
  ctx.strokeRect(30, 30, w - 60, h - 60);

  ctx.fillStyle = "#ff8a67";
  ctx.font = "bold 13px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("A FRAMEFLOW STUDIO PRODUCTION", w / 2, 125);

  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 32px sans-serif";
  ctx.fillText(title.slice(0, 32), w / 2, 185);

  ctx.fillStyle = "#bfc1cb";
  ctx.font = "15px sans-serif";
  ctx.fillText("STORYBOARD FILM", w / 2, 220);

  ctx.fillStyle = `rgba(255,113,91,${0.5 + 0.5 * Math.sin(t * Math.PI)})`;
  ctx.fillRect(w / 2 - 25, 248, 50, 3);

  ctx.textAlign = "left";
}

async function renderMp4({ projectTitle, shots, onProgress = () => {} }) {
  if (!Array.isArray(shots) || shots.length === 0) {
    throw new Error("Create at least one storyboard shot first.");
  }

  const ffmpeg = await getFFmpeg(onProgress);
  const canvas = document.createElement("canvas");
  canvas.width = 640;
  canvas.height = 360;

  const ctx = canvas.getContext("2d");
  const fps = 10;
  const titleFrames = 10;
  const shotFrames = shots.map(shot =>
    Math.max(10, Math.min(50, Math.round((Number(shot.duration) || 3) * fps)))
  );
  const total = titleFrames + shotFrames.reduce((a, b) => a + b, 0);

  const title = String(projectTitle || "My FrameFlow Film");
  const safeName = "frameflow-output.mp4";

  // Render locally on the device into numbered PNG frames.
  let frameNumber = 0;

  for (let i = 0; i < titleFrames; i++) {
    drawTitleCard(ctx, title, i, titleFrames);
    const blob = await new Promise(resolve => canvas.toBlob(resolve, "image/png"));
    if (!blob) throw new Error("Could not render title card.");
    await ffmpeg.writeFile(
      `frame-${String(frameNumber++).padStart(5, "0")}.png`,
      new Uint8Array(await blob.arrayBuffer())
    );
  }

  for (let s = 0; s < shots.length; s++) {
    for (let f = 0; f < shotFrames[s]; f++) {
      drawFrame(ctx, shots[s], s, f, shotFrames[s], title);
      const blob = await new Promise(resolve => canvas.toBlob(resolve, "image/png"));
      if (!blob) throw new Error("Could not render storyboard frame.");

      await ffmpeg.writeFile(
        `frame-${String(frameNumber++).padStart(5, "0")}.png`,
        new Uint8Array(await blob.arrayBuffer())
      );

      if (frameNumber % 10 === 0) {
        onProgress(Math.round((frameNumber / total) * 70));
      }
    }
  }

  onProgress(75);

  const result = await ffmpeg.exec([
    "-framerate", String(fps),
    "-i", "frame-%05d.png",
    "-c:v", "libx264",
    "-preset", "ultrafast",
    "-pix_fmt", "yuv420p",
    "-movflags", "+faststart",
    safeName
  ]);

  if (result !== 0) {
    throw new Error("MP4 encoding failed. Please try a shorter storyboard.");
  }

  const bytes = await ffmpeg.readFile(safeName);
  const blob = new Blob([bytes], { type: "video/mp4" });
  onProgress(100);

  return URL.createObjectURL(blob);
}

window.FrameFlowRenderer = { renderMp4 };
