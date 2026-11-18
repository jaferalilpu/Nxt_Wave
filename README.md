# Proofdesk

Proofdesk helps a content reviewer turn reading material into a five-question group and decide, question by question, whether it is good enough to go out.

One group is always: **2 theory MCQs, 2 true/false, 1 code-analysis**, exported in a tagged text format.

The rule the whole tool is built around: **a question that tests something the material does not teach is a failed question.** Proofdesk handles that in three layers, described below.

## Run it

You need Node 18 or newer. No API key is required to try it.

```bash
npm run setup        # installs backend and frontend dependencies
npm run dev          # API on :4000, React app on :5173
```

Open http://localhost:5173, click **Load sample**, then **Write five questions**.

Without an API key the backend starts in **demo mode**: questions are built with plain rules from the material (fill-in-the-blank, true/false by swapping a term, a code result question). They are simpler than model-written ones but let you walk through the entire review flow offline.

### Use a real model

```bash
cp backend/.env.example backend/.env
# open backend/.env, paste your key, save, then restart the backend
```

Set **one** of these in `backend/.env`:

| Provider | Key variable | Default model |
|---|---|---|
| Google Gemini | `GEMINI_API_KEY` | `gemini-3.5-flash` |

The provider is picked from whichever key is set (or force it with `LLM_PROVIDER`). Set `MODEL` to the exact model name your key has access to. The badge in the top right of the app shows demo mode or the model in use.

The app reads `backend/.env`, **not** `.env.example`. If you only edited the example file, the app silently stays in demo mode.

### Run as one server (what deployment uses)

```bash
npm run build        # builds the React app into frontend/dist
npm start            # backend serves API and UI together on :4000
```

### Tests

```bash
npm test
```

Backend tests cover parsing, grounding, structure checks, the tag-format round trip, the demo generator, and the full live path for both Gemini and Anthropic against fake model servers (so they need no key or network).

## Deploy

`render.yaml` is a Render blueprint for a single web service. Push the repo to GitHub, create a **Blueprint** on Render pointing at it, then add `GEMINI_API_KEY` (or `ANTHROPIC_API_KEY`) and `MODEL` in the dashboard. Without a key, the deployed app runs in demo mode. Any host that can run `npm --prefix backend start` after a frontend build works the same way.
