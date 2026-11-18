// Structural checks: is this a well-formed question, and is the group the
// right mix? This says nothing about whether the content is any good. That is
// the grounding check's job and, in the end, the reviewer's.
import { QUESTION_PLAN } from './questionModel.js';

export function validateQuestion(q) {
  const problems = [];
  if (!q.text) problems.push('The question text is empty.');
  if (!q.explanation) problems.push('There is no explanation for the answer.');
  if (!q.evidence) problems.push('There is no source line from the material.');

  if (q.type === 'true_false') {
    if (typeof q.answer !== 'boolean') problems.push('True/false answer is missing.');
  } else if (q.type === 'mcq' || q.type === 'code_analysis') {
    const options = q.options || [];
    if (options.length !== 4) problems.push('Needs exactly four options.');
    if (options.some((o) => !o.text)) problems.push('An option is empty.');
    if (options.filter((o) => o.correct).length !== 1) problems.push('Needs exactly one correct option.');
    const texts = options.map((o) => o.text.toLowerCase());
    if (new Set(texts).size !== texts.length) problems.push('Two options are identical.');
    if (q.type === 'code_analysis' && !q.code) problems.push('The code snippet is missing.');
  } else {
    problems.push(`Unknown question type "${q.type}".`);
  }
  return problems;
}

export function validateGroup(questions) {
  const problems = [];

  if (questions.length !== QUESTION_PLAN.length) {
    problems.push(`Expected ${QUESTION_PLAN.length} questions, got ${questions.length}.`);
  }
  const count = (type) => questions.filter((q) => q.type === type).length;
  if (count('mcq') !== 2) problems.push('A group needs exactly 2 theory MCQs.');
  if (count('true_false') !== 2) problems.push('A group needs exactly 2 true/false questions.');
  if (count('code_analysis') !== 1) problems.push('A group needs exactly 1 code-analysis question.');

  questions.forEach((q, i) => {
    validateQuestion(q).forEach((p) => problems.push(`Question ${i + 1}: ${p}`));
  });
  return problems;
}
