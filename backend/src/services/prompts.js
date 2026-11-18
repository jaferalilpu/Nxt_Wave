// The instructions we give the model. Kept in one file so they are easy to
// read, argue with and tune without touching any logic.

const SHAPE = `{
  "questions": [
    {
      "type": "mcq",
      "text": "question stem",
      "options": [{"text": "...", "correct": false}, {"text": "...", "correct": true}, {"text": "...", "correct": false}, {"text": "...", "correct": false}],
      "explanation": "why the correct option is right, in one or two sentences",
      "evidence": "one sentence copied word for word from the material"
    },
    { "type": "true_false", "text": "a single statement", "answer": true, "explanation": "...", "evidence": "..." },
    { "type": "code_analysis", "text": "question about the code", "language": "js", "code": "snippet copied from the material", "options": [4 options, exactly one correct], "explanation": "...", "evidence": "..." }
  ]
}`;

export const GENERATION_SYSTEM = `You write quiz questions for a coding course. A reviewer will read them before students ever see them.

The single most important rule: a question may only test something the reading material explicitly teaches. If a student could not answer it from the material alone, it is a failed question. Do not use outside knowledge, even if it is true and related.

Rules:
- "evidence" must be one or two sentences copied exactly from the material, character for character apart from markdown symbols. Never paraphrase it.
- For the code-analysis question, "code" must be copied exactly from a code block in the material, and the question must be answerable by reading that code with the material's explanations in mind.
- Multiple choice questions have exactly four options and exactly one correct one. Wrong options should be plausible mistakes a beginner might make, not silly.
- True/false statements must be clearly true or clearly false according to the material. Do not make every statement true.
- Theory MCQs test understanding of a concept, not memory of a single word.
- Use beginner-friendly wording. Keep each question under 40 words.
- Return only JSON, no commentary.`;

export function buildGenerationPrompt(materialText) {
  return `Write one five-question group from the reading material below, in this exact order:
1. theory MCQ
2. theory MCQ
3. true/false
4. true/false
5. code analysis

Use different sections of the material for different questions where you can.

Return JSON in this shape:
${SHAPE}

READING MATERIAL
----------------
${materialText}`;
}

export function buildSingleQuestionPrompt(materialText, type, avoidTexts) {
  const avoid = avoidTexts.length
    ? `Do not repeat or closely resemble these existing questions:\n${avoidTexts.map((t) => `- ${t}`).join('\n')}\n\n`
    : '';
  return `Write exactly one new question of type "${type}" from the reading material below.

${avoid}Return JSON in this shape, with the "questions" array holding just that one question:
${SHAPE}

READING MATERIAL
----------------
${materialText}`;
}

export function buildRepairPrompt(materialText, problems) {
  return `Your previous attempt had these problems:
${problems.map((p) => `- ${p}`).join('\n')}

Write the full five-question group again and fix them. Keep to the same JSON shape and rules.

READING MATERIAL
----------------
${materialText}`;
}

export const AUDIT_SYSTEM = `You are a strict checker. You are given reading material and quiz questions.
For each question decide whether a student who has read ONLY the material could answer it, and whether the marked answer is actually correct according to the material.
Verdicts: "supported", "partial" (answerable but leans on something the material only hints at), "unsupported" (needs knowledge the material does not teach, or the marked answer contradicts the material).
Return only JSON: {"audits":[{"id":"q1","verdict":"supported","reason":"short reason"}]}`;

export function buildAuditPrompt(materialText, questions) {
  const compact = questions.map((q) => ({
    id: q.id,
    type: q.type,
    text: q.text,
    code: q.code,
    options: q.options?.map((o) => `${o.correct ? '[correct] ' : ''}${o.text}`),
    answer: q.answer,
  }));
  return `READING MATERIAL
----------------
${materialText}

QUESTIONS
---------
${JSON.stringify(compact, null, 2)}`;
}
