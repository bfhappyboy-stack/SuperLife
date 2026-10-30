import { createServerFn } from "@tanstack/react-start";
import { heroPrompt, replyLocally, type PlotBrief } from "./heroes";
import type { OriginBrief } from "./origin";

interface TalkInput {
  id: string;
  name: string;
  alias: string;
  personality: string;
  relationship: number;
  level: number;
  memory: { role: "you" | "them"; text: string }[];
  line: string;
  plot: PlotBrief | null;
  origin: OriginBrief | null;
}

function cleanOrigin(value: unknown): OriginBrief | null {
  if (!value || typeof value !== "object") return null;
  const origin = value as Partial<OriginBrief>;
  if (!origin.city || !origin.upbringing) return null;
  return {
    city: String(origin.city).slice(0, 80),
    upbringing: String(origin.upbringing).slice(0, 80),
    traits: String(origin.traits ?? "").slice(0, 180),
    local: !!origin.local,
    note: String(origin.note ?? "").slice(0, 280),
  };
}

function cleanPlot(value: unknown): PlotBrief | null {
  if (!value || typeof value !== "object") return null;
  const plot = value as Partial<PlotBrief>;
  const stance = plot.stance === "close" || plot.stance === "wary" || plot.stance === "shut" || plot.stance === "other" ? plot.stance : null;
  if (!stance || !plot.villain || !plot.arcTitle) return null;
  return {
    villain: String(plot.villain).slice(0, 80),
    arcTitle: String(plot.arcTitle).slice(0, 80),
    stepTitle: String(plot.stepTitle ?? "").slice(0, 80),
    stance,
  };
}

function clean(input: unknown): TalkInput {
  const data = (input ?? {}) as Partial<TalkInput>;
  const memory = Array.isArray(data.memory) ? data.memory : [];
  return {
    id: String(data.id ?? "").slice(0, 40),
    name: String(data.name ?? "Hero").slice(0, 80),
    alias: String(data.alias ?? "Hero").slice(0, 80),
    personality: String(data.personality ?? "").slice(0, 500),
    relationship: Math.max(0, Math.min(100, Number(data.relationship) || 0)),
    level: Math.max(1, Math.min(8, Number(data.level) || 1)),
    memory: memory.slice(-6).map((entry) => ({
      role: entry?.role === "them" ? "them" as const : "you" as const,
      text: String(entry?.text ?? "").slice(0, 240),
    })),
    line: String(data.line ?? "").slice(0, 280),
    plot: cleanPlot(data.plot),
    origin: cleanOrigin(data.origin),
  };
}

export const askHero = createServerFn({ method: "POST" })
  .validator((input: unknown) => clean(input))
  .handler(async ({ data }) => {
    const local = replyLocally(
      { id: data.id, alias: data.alias, relationship: data.relationship },
      data.line,
      data.plot,
      data.origin,
    );
    const apiKey = process.env.XAI_API_KEY;
    if (!apiKey || !data.line.trim()) return { ok: true as const, text: local };
    try {
      const res = await fetch("https://api.x.ai/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
        signal: AbortSignal.timeout(12000),
        body: JSON.stringify({
          model: "grok-4.5",
          max_tokens: 160,
          temperature: 0.8,
          messages: [{ role: "user", content: heroPrompt(data, data.line, data.plot, data.origin) }],
        }),
      });
      if (!res.ok) return { ok: true as const, text: local };
      const body = (await res.json()) as { choices?: { message?: { content?: string } }[] };
      const text = body.choices?.[0]?.message?.content?.trim();
      if (!text) return { ok: true as const, text: local };
      return { ok: true as const, text: text.slice(0, 500) };
    } catch {
      return { ok: true as const, text: local };
    }
  });
