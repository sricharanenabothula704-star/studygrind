# StudyGrind

AI study companion: type a topic, get a step-by-step lesson with a real voice, quizzes, mind maps, notes and flashcards, a to-do list, and a halftone dot graph of your study activity. Dark and white themes.

React + Vite + TypeScript, Tailwind v4, Zustand, Gemini API (`@google/genai`). No backend: everything runs in the browser and is stored in `localStorage`.

## Run

```bash
npm install
npm run dev
```

Open the app, go to **Settings**, paste a free Gemini key from https://aistudio.google.com/apikey and press **Test connection**.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | dev server |
| `npm run check` | lint + typecheck + tests + production build (run before every push) |
| `npm test` | unit tests (vitest) |

## How it works

- `src/lib/gemini.ts`: all AI calls. Structured JSON output, validated with zod (`src/lib/schemas.ts`), so a malformed AI answer shows a clear message instead of crashing. Tries a chain of models (`TEXT_MODELS`, `TTS_MODELS`) because Google retires model IDs often and free-tier quota is per model. **When a model is retired, edit those two arrays.**
- `src/lib/audio.ts`: Gemini TTS playback with browser-voice fallback.
- `src/store`: persisted state (versioned, with `migrate`). Imports are validated.
- `src/lib/stats.ts`: streaks and the dot grid layout (unit tested).

## Security model

- The Gemini key is **bring-your-own**: typed by each user, stored only in their browser, sent only to `generativelanguage.googleapis.com`. It is never in the repo, the build, or backups.
- `vercel.json` ships a strict Content-Security-Policy (scripts from self only, connections only to self and Google's API), which limits what an XSS bug could do with the stored key.
- Do **not** put your own key into a `VITE_*` env var: anything prefixed `VITE_` is bundled into public JavaScript. A shared key needs a server-side proxy (not built).

## Deploy

**Live:** https://sricharanenabothula704-star.github.io/studygrind/

**GitHub Pages (current).** Every push to `main` runs `.github/workflows/ci.yml`: lint, typecheck, tests, build, then deploys `dist/` to Pages. A failing check blocks the deploy. The workflow sets `BASE_PATH=/studygrind/` (the repo name) and copies `index.html` to `404.html` so deep links work. Pages can't send headers, so the build injects the CSP as a `<meta>` tag (see `vite.config.ts`).

**Vercel (alternative).** Import the repo, framework Vite, no env vars. `vercel.json` sends the CSP as a real header. Leave `BASE_PATH` unset there so the app serves from `/`.
