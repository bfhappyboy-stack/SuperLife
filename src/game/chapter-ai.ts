import { createServerFn } from "@tanstack/react-start";
import { validChapterText, type ChapterText } from "./chapters";

/**
 * Optional AI pass for chapter text. Runs server-side only, and only when XAI_API_KEY is set.
 * The model may rewrite the title, premise and beat lines of a procedural chapter; it never touches
 * goals or consequences. Output must match a strict JSON schema and pass validChapterText, otherwise
 * the caller keeps the procedural draft. Results are cached in the save (chapter.aiTried/source).
 */
interface Brief {
  hero: string;
  age: number;
  city: string;
  phase: string;
  upbringing: string;
  traits: string[];
  gift: string;
  powers: number;
  leagueRank: number;
  reputation: number;
  fame: number;
  arch: string;
  recent: string;
  draft: ChapterText;
  goals: string[];
}

const str = (v: unknown, max: number) => String(v ?? "").slice(0, max);
const num = (v: unknown, lo: number, hi: number) => Math.max(lo, Math.min(hi, Number(v) || 0));

function clean(input: unknown): Brief {
  const d = (input ?? {}) as Partial<Brief>;
  const draft = (d.draft ?? {}) as Partial<ChapterText>;
  return {
    hero: str(d.hero, 40),
    age: num(d.age, 0, 120),
    city: str(d.city, 60),
    phase: str(d.phase, 40),
    upbringing: str(d.upbringing, 30),
    traits: Array.isArray(d.traits) ? d.traits.slice(0, 4).map((t) => str(t, 20)) : [],
    gift: str(d.gift, 40),
    powers: num(d.powers, 0, 99),
    leagueRank: num(d.leagueRank, 0, 6),
    reputation: num(d.reputation, -100, 100),
    fame: num(d.fame, 0, 100),
    arch: str(d.arch, 60),
    recent: str(d.recent, 400),
    draft: {
      title: str(draft.title, 60),
      premise: str(draft.premise, 420),
      beats: Array.isArray(draft.beats) ? draft.beats.slice(0, 3).map((b) => str(b, 140)) : [],
    },
    goals: Array.isArray(d.goals) ? d.goals.slice(0, 3).map((g) => str(g, 80)) : [],
  };
}

const SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["title", "premise", "beats"],
  properties: {
    title: { type: "string", description: "2-6 words, no quotes" },
    premise: { type: "string", description: "2-3 sentences, second person, under 380 characters" },
    beats: { type: "array", items: { type: "string", description: "one short line, under 120 characters" } },
  },
};

function prompt(b: Brief): string {
  return [
    "You write chapter title cards for SuperLife, a mobile superhero life sim. Dry, warm, specific. No markdown.",
    `Hero: ${b.hero}, age ${b.age}, ${b.city}. Phase: ${b.phase}. Upbringing: ${b.upbringing}. Traits: ${b.traits.join(", ")}.`,
    `Gift: ${b.gift}; powers known: ${b.powers}; League rank ${b.leagueRank}; reputation ${b.reputation}; fame ${b.fame}; main threat: ${b.arch}.`,
    `Recent life: ${b.recent}`,
    `Goals this chapter (keep their meaning): ${b.goals.join(" | ")}`,
    `Procedural draft to improve: ${JSON.stringify(b.draft)}`,
    `Return JSON with title, premise, and exactly ${b.draft.beats.length} beats (one per goal, each a concrete in-game nudge).`,
  ].join("\n");
}

export const generateChapterText = createServerFn({ method: "POST" })
  .validator((input: unknown) => clean(input))
  .handler(async ({ data }): Promise<{ text: ChapterText | null; source: "ai" | "none" }> => {
    const apiKey = process.env.XAI_API_KEY;
    if (!apiKey || !data.draft.beats.length) return { text: null, source: "none" };
    try {
      const res = await fetch("https://api.x.ai/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
        signal: AbortSignal.timeout(15000),
        body: JSON.stringify({
          model: "grok-4.5",
          max_tokens: 400,
          temperature: 0.8,
          response_format: { type: "json_schema", json_schema: { name: "chapter_card", strict: true, schema: SCHEMA } },
          messages: [{ role: "user", content: prompt(data) }],
        }),
      });
      if (!res.ok) return { text: null, source: "none" };
      const body = (await res.json()) as { choices?: { message?: { content?: string } }[] };
      const raw = body.choices?.[0]?.message?.content ?? "";
      let parsed: unknown = null;
      try {
        parsed = JSON.parse(raw);
      } catch {
        return { text: null, source: "none" };
      }
      const text = validChapterText(parsed, data.draft.beats.length);
      return text ? { text, source: "ai" } : { text: null, source: "none" };
    } catch {
      return { text: null, source: "none" };
    }
  });
