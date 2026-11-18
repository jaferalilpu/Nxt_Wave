// Defines what a question looks like inside the app, and cleans up whatever the
// model (or the demo generator) hands us so every question has the same shape.

export const QUESTION_PLAN = ['mcq', 'mcq', 'true_false', 'true_false', 'code_analysis'];

export const TYPE_LABELS = {
  mcq: 'Theory MCQ',
  true_false: 'True or false',
  code_analysis: 'Code analysis',
};

const str = (v) => (typeof v === 'string' ? v.trim() : '');

export function normalizeQuestion(raw, index) {
  const type = raw?.type;
  const q = {
    id: `q${index + 1}`,
    type,
    text: str(raw?.text),
    explanation: str(raw?.explanation),
    evidence: str(raw?.evidence),
  };

  if (type === 'true_false') {
    q.answer = raw?.answer === true || raw?.answer === 'true';
  } else {
    q.options = (Array.isArray(raw?.options) ? raw.options : []).map((o) => ({
      text: str(o?.text),
      correct: o?.correct === true,
    }));
  }

  if (type === 'code_analysis') {
    // Keep the code exactly as written, only trimming blank lines around it.
    q.code = String(raw?.code || '').replace(/^\n+|\s+$/g, '');
    q.language = str(raw?.language);
  }
  return q;
}
