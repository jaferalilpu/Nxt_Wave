// The "did the material actually teach this?" check. This is the heart of the tool.
//
// Every question must carry an evidence line copied from the material. We then
// test three things without calling any model:
//   1. the evidence really exists in the material (word for word, ignoring formatting)
//   2. for code questions, the snippet really is one of the material's code blocks
//   3. the words the question leans on (stem and correct answer) appear in the material
//
// A failure on 1 or 2 makes the question "ungrounded" and it cannot be exported.
// A failure on 3 makes it "weak": the reviewer gets a warning and the list of
// unfamiliar words, and decides.
import { tokenString, contentWords, stem } from '../utils/text.js';

const MIN_EVIDENCE_WORDS = 3;

function collapse(code) {
  return String(code || '').replace(/\s+/g, '');
}

// The text whose vocabulary has to be covered by the material.
function claimText(q) {
  if (q.type === 'true_false') return q.text;
  const correct = (q.options || []).find((o) => o.correct);
  return `${q.text} ${correct ? correct.text : ''}`;
}

export function checkGrounding(question, parsed) {
  const checks = [];
  const materialTokens = tokenString(parsed.text);

  // 1. evidence present and verbatim
  const evidenceTokens = tokenString(question.evidence);
  const evidenceWords = evidenceTokens ? evidenceTokens.split(' ').length : 0;
  if (evidenceWords < MIN_EVIDENCE_WORDS) {
    checks.push({
      name: 'evidence',
      pass: false,
      detail: 'No usable source line. Copy the sentence from the material that supports this question.',
    });
  } else if (!` ${materialTokens} `.includes(` ${evidenceTokens} `)) {
    checks.push({
      name: 'evidence',
      pass: false,
      detail: 'The source line does not appear in the material. It may have been reworded or invented.',
    });
  } else {
    checks.push({ name: 'evidence', pass: true, detail: 'Source line found in the material.' });
  }

  // 2. code snippet taken from the material
  if (question.type === 'code_analysis') {
    const wanted = collapse(question.code);
    const found = wanted && parsed.codeBlocks.some((b) => collapse(b.code).includes(wanted));
    checks.push({
      name: 'code',
      pass: Boolean(found),
      detail: found
        ? 'Code snippet matches a block in the material.'
        : 'This code does not appear in the material, so students were never shown it.',
    });
  }

  // 3. vocabulary coverage
  const words = contentWords(claimText(question));
  const unfamiliar = words.filter((w) => !parsed.vocabulary.has(stem(w)));
  const allowed = Math.max(1, Math.floor(words.length * 0.2));
  const coveragePass = unfamiliar.length <= allowed && unfamiliar.length < 3;
  checks.push({
    name: 'vocabulary',
    pass: coveragePass,
    detail: unfamiliar.length
      ? `Words not found in the material: ${unfamiliar.join(', ')}.`
      : 'Every key word in the question and its answer appears in the material.',
  });

  const hardFail = checks.some((c) => (c.name === 'evidence' || c.name === 'code') && !c.pass);
  const status = hardFail ? 'ungrounded' : coveragePass ? 'grounded' : 'weak';

  return { status, checks, audit: null };
}

// Folds the model's second opinion into the result of the rule-based check.
export function applyAudit(grounding, audit) {
  if (!audit) return grounding;
  const checks = [
    ...grounding.checks,
    {
      name: 'audit',
      pass: audit.verdict === 'supported',
      detail: `Second opinion: ${audit.verdict}. ${audit.reason || ''}`.trim(),
    },
  ];
  let status = grounding.status;
  if (audit.verdict === 'unsupported') status = 'ungrounded';
  else if (audit.verdict === 'partial' && status === 'grounded') status = 'weak';
  return { status, checks, audit };
}
