# SuperLife

A monthly superhero life sim. One gift at the start, a city to grow up in, and three moves a month.

## Play it locally

```bash
npm install
npm run dev
```

Then open the address the dev server prints.

Your life is saved in the browser. There is no account.

## What’s in a life

- Create a face, a city, an upbringing, and one starting power.
- Five desks in a bottom tab bar: Life, Powers, Cases (with the city Board), People and Work (with the Market).
- A Market that changes by city and decade: gear, supplies, intel, influence, property, tech and legacy.
- Train with a timing drill or a memory pattern, then fight with the moves you have unlocked.
- Mix two powers you already own. A mix never goes past the second generation.
- Buy and wear a costume. Fitting an outfit does not spend a month.

## Setting up AI text

The game runs fully without AI. With a key, two things get better:

- **Chapter text** (`src/game/chapter-ai.ts`): Grok rewrites the title, premise and beat lines of each decade chapter. Goals and consequences always stay procedural. Rewritten chapters show a small "AI-written" chip.
- **Hero chat** (`src/game/hero-talk.ts`): heroes in the Power Lab answer in their own voice.

Both call the xAI API with the model `grok-4.5`, from the server only.

To turn it on, set `XAI_API_KEY` as a **server-side secret** in your host's environment settings (or in a local `.env` that is git-ignored):

```bash
XAI_API_KEY=your-key-here
```

- Never give it a `VITE_` prefix. Vite ships any `VITE_` variable to the browser, which would leak the key.
- Never commit it.

**Without the key** (or if a call fails or returns bad output), the game falls back silently: chapters keep their procedural text, and hero chat uses the built-in canned replies.
