# Module guide

Every file, what it does, and why it exists.

## Backend (`backend/src`)

### `server.js`
Starts Express, turns on CORS and JSON parsing, mounts the API under `/api`, serves the built React app if `frontend/dist` exists, and has one error handler at the bottom. Errors that carry a status (`AppError`) keep it; anything unexpected becomes a 500 and is logged.

### `config.js`
The only place environment variables are read: API key, model, port, API URL, audit on/off, size limits. If there is no API key, `mockMode` is true and the app runs in demo mode.

### `routes/api.js`
Five endpoints, each short:
- `GET /api/health` reports demo or live mode and the model.
- `POST /api/generate` takes `{ material }` and returns five checked questions.
- `POST /api/regenerate` replaces one question of a given type.
- `POST /api/verify` re-checks one question after the reviewer edited it.
- `POST /api/export` re-validates the whole group, refuses if any question is ungrounded, and returns the tagged text.

A small `wrap` helper passes rejected promises to the error handler (Express 4 does not do this by itself).

### `services/markdownParser.js`
Reads the markdown line by line. It tracks the current heading, collects prose into sentences, and collects fenced code blocks with their language and the section they sit in. It also builds a vocabulary of every word in the material (code included), used later to spot words the material never uses.

### `services/questionModel.js`
Defines the order of the group (`mcq, mcq, true_false, true_false, code_analysis`) and `normalizeQuestion`, which gives every question the same shape no matter whether it came from the model or the demo generator: trimmed strings, a boolean answer, options with a `correct` flag, code kept exactly as written.

### `services/prompts.js`
Every instruction sent to the model: the system rules (only test what the material teaches, copy evidence word for word, four options with one correct, don't make every true/false true), the group prompt, the single-question prompt, the repair prompt, and the audit prompt. Prompts live here so they can be tuned without touching logic.

### `services/llmClient.js`
The only file that talks to the model API. `askModel` sends the request with a timeout and turns failures into readable errors. `extractJson` copes with models that wrap JSON in code fences or add a sentence before it.

### `services/mockGenerator.js`
Demo mode. Builds fill-in-the-blank MCQs from sentences that highlight a term, a true statement taken as written, a false statement made by swapping a term for a different one of the same kind, and a code question that asks for the result shown in the snippet's `// comment`. Wrong answers are never words already in the sentence, so a question can't have two right answers. If the material can't support this (too few highlighted terms, no code), it says so.

### `services/validator.js`
Structure only: right number and mix of questions, four distinct options, exactly one correct, text/explanation/evidence present, code present for code questions. It doesn't judge content.

### `services/grounding.js`
The core of the tool. `checkGrounding` runs the evidence check, the code check and the vocabulary check and returns a status (`grounded`, `weak`, `ungrounded`) with the reason for each check. `applyAudit` merges in the model's second opinion. Hard fails (evidence or code) become `ungrounded`; vocabulary problems become `weak`.

### `services/generator.js`
The orchestrator. `generateGroup` validates the material (length, at least one code block), gets questions from the model or demo generator, retries once with the problems listed if the model's shape was wrong, then attaches grounding and the audit. `regenerateQuestion` does the same for one question. `verifyQuestion` is the quick re-check used by the editor.

### `services/tagFormat.js`
`serializeGroup` writes the tagged text (escaping `& < >`), `parseGroup` reads it back for tests. If the official tag names differ from mine, edit this file only.

### `utils/text.js`
`tokens` (lower-cased words without punctuation, so markdown and backticks don't matter), `stem` (a tiny stemmer so "variables" matches "variable"), and `contentWords` (words that carry meaning, after removing common and quiz-boilerplate words).

### `utils/AppError.js`
An `Error` with an HTTP status and optional list of details.

## Frontend (`frontend/src`)

### `main.jsx`, `index.html`, `styles.css`
Entry point, fonts, and the whole visual design. Paper-grey page, white sheets, ink-navy actions, highlighter yellow reserved for one thing: the evidence in the source text.

### `api.js`
Wraps `fetch` for every endpoint and turns server errors into `Error` objects with `details`.

### `utils/evidence.js`
Finds a piece of evidence in the raw markdown (matching words and ignoring punctuation, the same way the backend does) and cuts the text into highlighted and plain segments.

### `App.jsx`
Holds all state: the material, the questions, each question's review status, which one is selected, and errors. Editing a question marks its checks as stale and sets it back to pending. Approving re-runs the check first. Rejecting, replacing and exporting also live here.

### `components/MaterialPane.jsx`
Left side. A text box before generating, a read-only source afterwards with the selected question's evidence highlighted and scrolled into view. Warns if the evidence can't be located.

### `components/QuestionCard.jsx`
One question: collapsed it shows type, stamp and review status; opened it is the full editor (text, code, options with a correct-answer radio, explanation, evidence), the grounding report, and the Approve / Re-check / Reject / Write a different one buttons.

### `components/GroundingReport.jsx`
The stamp, and the list of checks with a tick or cross and the reason, so the reviewer isn't asked to trust a label.

### `components/ExportPanel.jsx`
Shows "N of 5 approved", enables export only when all are approved, shows server errors, and offers Copy and Download for the tagged text.

## Tests (`backend/test`)
- `backend.test.js` covers parsing, demo generation, invented evidence, invented code, off-topic vocabulary, the tag-format round trip and the structure validator.
- `live.test.js` runs the real generation + audit + grounding path against a local fake model that deliberately slips in one question the material doesn't teach, and checks it is caught.
