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

## How it works

```
reading material (.md)
        |
   markdownParser      sentences, code blocks, sections, vocabulary
        |
   generator           model call (or demo rules) -> five questions
        |
   validator           right mix? four options? one correct answer?
        |
   grounding           is the evidence really in the material? is the code?
        |                do the key words appear in the material?
   audit (model)       second opinion: could a student answer from the text alone?
        |
   reviewer (React)    reads, edits, re-checks, approves or rejects
        |
   export              server re-checks everything, then writes the tagged text
```

### Keeping questions inside the material

1. **Evidence is mandatory.** Every question must carry the sentence it relies on, copied from the material. The prompt demands this, and the backend does not take the model's word for it: it checks that the words of that sentence appear in the material in order. Invented or reworded evidence makes the question `ungrounded`.
2. **Code must be the material's code.** For the code-analysis question, the snippet has to match a code block in the material (ignoring whitespace).
3. **Vocabulary coverage.** The important words in the question stem and the correct answer are compared with the material's vocabulary. Unfamiliar words make the question `weak` and are listed for the reviewer.
4. **Second opinion.** In live mode a second model call judges each question as `supported`, `partial` or `unsupported`. An `unsupported` verdict marks the question `ungrounded`.

What the reviewer sees: a stamp on each question (taught in the material / check this one / not supported), the list of checks behind the stamp, and the evidence **highlighted in the source text** on the left when a question is opened.

What the reviewer controls: every field is editable. Editing marks the checks as out of date; **Approve** re-runs them first and refuses to approve an ungrounded question. Export is only available once all five are approved, and the server checks again before returning the text, so a stale or edited client cannot export an unsupported question.

## Decisions and trade-offs

| Decision | Why | What it costs |
|---|---|---|
| Hard gate on `ungrounded`, soft warning on `weak` | Evidence and code are exact facts we can verify. Vocabulary is a guess, so the reviewer decides. | A genuinely fine question can be flagged weak; it needs a click, not a rewrite. |
| Rule-based grounding plus a model audit | The rules are fast, free and explainable. The audit catches meaning-level problems the rules cannot. | The audit costs a second API call (turn off with `AUDIT=off`, which also helps on free-tier rate limits). Both together still cannot prove a question is *good*. That is the reviewer's job. |
| Word-sequence matching for evidence | Ignores markdown, punctuation and backticks, so legitimate quotes match. | A model that paraphrases slightly is rejected even if the meaning is right. I chose strict on purpose. |
| Questions must be answerable from one quoted source line | Makes the highlight meaningful and the check simple. | Questions that need two or three scattered facts are discouraged. |
| One question can be replaced without redoing the group | Reviewers often reject just one. | Replacements only avoid repeating the other four, they do not guarantee variety across rounds. |
| Demo mode with deterministic rules | The project runs for anyone who opens it, with no key. | Demo questions are plainer than model questions. |
| Backend serves the built frontend | One service, one URL, nothing to wire together. | Frontend and backend deploy together. |
| No database, no accounts | Out of scope for a reviewing tool of this size. | Review state lives in the browser tab; refreshing loses it. |
| Plain `fetch` to the model API, no SDK, two providers behind one `askModel` function | One small file, nothing else in the app knows which model is used. Gemini is the free option, Anthropic the alternative. | I handle JSON extraction and provider differences myself. |

## About the tagged format

The attached assignment file defines the official tags. The tag names in `backend/src/services/tagFormat.js` follow a simple layout I used while building (`<question-group>`, `<question type="mcq">`, `<text>`, `<option correct="true">`, `<explanation>`, `<source>`). If the official names differ, that is the only file to edit; its round-trip test will tell you if something breaks.

## What I did not do

- I did not click through the UI in a real browser while building; I served it and exercised every API call it makes. Do one visual pass before recording.
- The model path was tested against fake Gemini and Anthropic servers while building. The first real-key run is yours to check: confirm the badge shows your model, not demo mode.
- Grounding cannot judge whether a question is well written or fair. It only guarantees the question can be traced to the material.

## Project layout

See [docs/MODULES.md](docs/MODULES.md) for a walkthrough of every module, and [docs/RECORDING_GUIDE.md](docs/RECORDING_GUIDE.md) for the Part B script.
