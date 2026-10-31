import { useEffect, useState } from "react";
import { Download, Share2, X } from "lucide-react";
import { buzz } from "@/components/game/sfx";

export interface RevealCardData {
  lifeName: string;
  age: number;
  earth: string | null;
  title: string;
  power: string;
  tier: string;
  elementLabel: string;
  color: string;
  glow: string;
  line: string;
  extras: string[];
  art?: string;
}

const W = 1080;
const H = 1350;

function wrap(ctx: CanvasRenderingContext2D, text: string, max: number): string[] {
  const out: string[] = [];
  let line = "";
  for (const word of text.split(/\s+/)) {
    const next = line ? `${line} ${word}` : word;
    if (ctx.measureText(next).width > max && line) {
      out.push(line);
      line = word;
    } else line = next;
  }
  if (line) out.push(line);
  return out;
}

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

function spaced(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  gap: number,
  align: "left" | "right" | "center",
) {
  const chars = [...text];
  const width = chars.reduce((sum, c) => sum + ctx.measureText(c).width + gap, -gap);
  let cx = align === "left" ? x : align === "right" ? x - width : x - width / 2;
  const prev = ctx.textAlign;
  ctx.textAlign = "left";
  for (const c of chars) {
    ctx.fillText(c, cx, y);
    cx += ctx.measureText(c).width + gap;
  }
  ctx.textAlign = prev;
}

/** Draw the 1080×1350 (4:5) shareable reveal card. Works offline; no server or API key. */
export async function drawRevealCard(data: RevealCardData): Promise<Blob | null> {
  try {
    await Promise.all([
      document.fonts?.load("140px Anton"),
      document.fonts?.load("800 34px Figtree"),
      document.fonts?.load("500 38px Figtree"),
    ]);
  } catch {
    // Fonts fall back to system faces.
  }
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  ctx.fillStyle = "#07070b";
  ctx.fillRect(0, 0, W, H);
  if (data.art) {
    const img = await loadImage(data.art);
    if (img) {
      const scale = Math.max(W / img.width, H / img.height);
      ctx.globalAlpha = 0.5;
      ctx.drawImage(img, (W - img.width * scale) / 2, 0, img.width * scale, img.height * scale);
      ctx.globalAlpha = 1;
    }
  }
  const cx = W / 2;
  const cy = 380;
  const bg = ctx.createRadialGradient(cx, cy, 40, cx, cy, 900);
  bg.addColorStop(0, `${data.color}cc`);
  bg.addColorStop(0.45, `${data.color}33`);
  bg.addColorStop(1, "#07070bf0");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // Rays.
  ctx.save();
  ctx.translate(cx, cy);
  for (let i = 0; i < 28; i++) {
    ctx.rotate((Math.PI * 2) / 28);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(-38, -1200);
    ctx.lineTo(38, -1200);
    ctx.closePath();
    ctx.fillStyle = i % 2 ? `${data.glow}14` : `${data.color}10`;
    ctx.fill();
  }
  ctx.restore();

  // Bottom fade for legibility.
  const fade = ctx.createLinearGradient(0, H * 0.45, 0, H);
  fade.addColorStop(0, "#07070b00");
  fade.addColorStop(1, "#07070bf5");
  ctx.fillStyle = fade;
  ctx.fillRect(0, 0, W, H);

  // Core orb with rings.
  for (const [r, a] of [
    [210, "22"],
    [165, "40"],
  ] as const) {
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.strokeStyle = `${data.glow}${a}`;
    ctx.lineWidth = 4;
    ctx.stroke();
  }
  const orb = ctx.createRadialGradient(cx - 40, cy - 50, 10, cx, cy, 140);
  orb.addColorStop(0, "#ffffff");
  orb.addColorStop(0.25, data.glow);
  orb.addColorStop(0.7, data.color);
  orb.addColorStop(1, `${data.color}00`);
  ctx.shadowColor = data.color;
  ctx.shadowBlur = 90;
  ctx.fillStyle = orb;
  ctx.beginPath();
  ctx.arc(cx, cy, 128, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;

  // Header.
  ctx.fillStyle = "#ffffffcc";
  ctx.font = "800 26px Figtree, system-ui, sans-serif";
  ctx.textBaseline = "alphabetic";
  spaced(ctx, "SUPERLIFE", 64, 92, 7, "left");
  spaced(
    ctx,
    `${data.earth ? `${data.earth.toUpperCase()} · ` : ""}AGE ${data.age}`,
    W - 64,
    92,
    5,
    "right",
  );

  // Title + power name.
  ctx.textAlign = "center";
  ctx.fillStyle = data.glow;
  ctx.font = "800 30px Figtree, system-ui, sans-serif";
  spaced(ctx, data.title.toUpperCase(), cx, 650, 8, "center");
  ctx.fillStyle = "#ffffff";
  let size = 150;
  ctx.font = `${size}px Anton, Impact, sans-serif`;
  let lines = wrap(ctx, data.power.toUpperCase(), W - 120);
  while ((lines.length > 2 || lines.some((l) => ctx.measureText(l).width > W - 120)) && size > 80) {
    size -= 10;
    ctx.font = `${size}px Anton, Impact, sans-serif`;
    lines = wrap(ctx, data.power.toUpperCase(), W - 120);
  }
  ctx.shadowColor = `${data.color}`;
  ctx.shadowBlur = 40;
  let y = 650 + size * 1.0;
  for (const l of lines) {
    ctx.fillText(l, cx, y);
    y += size * 0.95;
  }
  ctx.shadowBlur = 0;
  y += 4;
  ctx.fillStyle = data.color;
  ctx.font = "800 30px Figtree, system-ui, sans-serif";
  spaced(ctx, `${data.elementLabel} · ${data.tier}`.toUpperCase(), cx, y, 6, "center");
  if (data.extras.length) {
    y += 52;
    ctx.fillStyle = "#ffffffdd";
    ctx.font = "700 30px Figtree, system-ui, sans-serif";
    ctx.fillText(data.extras.map((e) => `+ ${e}`).join("   "), cx, y);
  }

  // Story line in a glass panel.
  ctx.font = "500 34px Figtree, system-ui, sans-serif";
  const top = y + 56;
  const room = Math.max(1, Math.floor((H - 110 - top - 60) / 46));
  const all = wrap(ctx, data.line, W - 200);
  const story = all.slice(0, Math.min(3, room));
  if (all.length > story.length && story.length) story[story.length - 1] = `${story[story.length - 1]!.replace(/[\s,.;:]+\S*$/, "")}…`;
  const boxH = story.length * 46 + 60;
  const boxY = Math.max(top, H - 110 - boxH);
  ctx.fillStyle = "#ffffff14";
  ctx.strokeStyle = "#ffffff30";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(60, boxY, W - 120, boxH, 32);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#ffffffee";
  story.forEach((l, i) => ctx.fillText(l, cx, boxY + 62 + i * 46));

  // Footer.
  ctx.fillStyle = "#ffffff99";
  ctx.font = "800 24px Figtree, system-ui, sans-serif";
  spaced(ctx, data.lifeName.toUpperCase(), 64, H - 50, 5, "left");
  spaced(ctx, "WHAT WILL YOURS BE?", W - 64, H - 50, 5, "right");

  return new Promise((resolve) => canvas.toBlob((blob) => resolve(blob), "image/png"));
}

/** Preview sheet: share the PNG through the Web Share API when the device supports files, else save it. */
export function RevealShareSheet({ data, onClose }: { data: RevealCardData; onClose: () => void }) {
  const [blob, setBlob] = useState<Blob | null>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  useEffect(() => {
    let alive = true;
    let made: string | null = null;
    void drawRevealCard(data).then((b) => {
      if (!alive || !b) return;
      made = URL.createObjectURL(b);
      setBlob(b);
      setUrl(made);
    });
    return () => {
      alive = false;
      if (made) URL.revokeObjectURL(made);
    };
  }, [data]);
  const file = blob
    ? new File([blob], `superlife-${data.power.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.png`, {
        type: "image/png",
      })
    : null;
  const canShare =
    !!file && typeof navigator !== "undefined" && !!navigator.canShare?.({ files: [file] });

  async function share() {
    if (!file) return;
    try {
      await navigator.share({
        files: [file],
        title: `My power: ${data.power}`,
        text: `My SuperLife power woke at ${data.age}: ${data.power}.`,
      });
      buzz(15);
    } catch {
      setNote("Share cancelled. You can save the image instead.");
    }
  }

  return (
    <div
      className="absolute inset-0 z-10 flex flex-col items-center justify-end bg-black/70 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Share your reveal card"
    >
      <div className="anim-rise w-full max-w-[420px] rounded-t-[28px] border-t border-white/15 bg-panel px-5 pt-4 pb-8">
        <div className="flex items-center justify-between">
          <p className="t-label text-muted">YOUR REVEAL CARD</p>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="grid size-11 place-items-center rounded-full text-fg/80"
          >
            <X className="size-5" />
          </button>
        </div>
        <div className="mx-auto mt-2 aspect-[4/5] w-full max-w-[300px] overflow-hidden rounded-2xl border border-white/15 bg-black shadow-[0_20px_60px_-10px_rgba(0,0,0,.8)]">
          {url ? (
            <img src={url} alt={`Reveal card: ${data.power}`} className="size-full object-cover" />
          ) : (
            <div className="grid size-full place-items-center text-sm text-muted">Drawing…</div>
          )}
        </div>
        {note && <p className="mt-2 text-center text-xs text-muted">{note}</p>}
        <div className="mt-4 grid grid-cols-2 gap-2">
          {canShare ? (
            <button type="button" onClick={share} className="btn btn-gold min-h-12">
              <Share2 className="size-4" /> Share
            </button>
          ) : null}
          <a
            href={url ?? undefined}
            download={file?.name ?? "superlife-reveal.png"}
            aria-disabled={!url}
            className={`btn min-h-12 ${canShare ? "btn-ghost" : "btn-gold col-span-2"}`}
          >
            <Download className="size-4" /> Save image
          </a>
        </div>
      </div>
    </div>
  );
}
