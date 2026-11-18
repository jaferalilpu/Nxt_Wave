// Demo mode. No model, no API key: questions are built with plain rules from
// the material itself. They are simpler than model-written ones, but they let
// anyone run the whole review flow offline, and they are always grounded.
import { AppError } from '../utils/AppError.js';
import { QUESTION_PLAN } from './questionModel.js';

const TERM_RE = /`([^`]{2,30})`|\*\*([^*]{2,30})\*\*/g;

function termsIn(sentence) {
  return [...sentence.matchAll(TERM_RE)].map((m) => m[1] || m[2]);
}

// Sentences that mention at least one highlighted term, with the terms attached.
// The parser strips nothing from sentences, so backticks and bold are still here.
function candidates(parsed) {
  return parsed.sentences
    .map((s) => ({ ...s, terms: termsIn(s.text) }))
    .filter((s) => s.terms.length > 0 && s.text.length <= 220);
}

const plain = (s) => s.replace(/[`*]/g, '');

// The text of the last "// comment" in a snippet, which our materials use to show output.
function lastResultComment(code) {
  const found = [...code.matchAll(/\/\/\s*(.+)$/gm)].map((m) => m[1].trim());
  return found.length ? found[found.length - 1] : null;
}

// Wrong answers must not already appear in the sentence, or the question gets two right answers.
function pickDistractors(correct, pool, offset, sentence = '', count = 3) {
  const haystack = `${sentence} ${correct}`.toLowerCase();
  const startsUpper = (t) => /^[A-Z]/.test(t);
  const appears = (t) => new RegExp(`(^|[^a-z0-9_])${t.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([^a-z0-9_]|$)`).test(haystack);
  const fresh = [...new Set(pool)].filter((t) => t.length > 2 && !appears(t));
  // Prefer wrong answers of the same kind as the right one (keyword for keyword,
  // error name for error name), so the question tests understanding and not typography.
  const hasSpace = (t) => t.includes(' ');
  const sameKind = fresh.filter(
    (t) => startsUpper(t) === startsUpper(correct) && hasSpace(t) === hasSpace(correct),
  );
  const others = [...sameKind, ...fresh.filter((t) => !sameKind.includes(t))];
  const picked = [];
  for (let i = 0; i < others.length && picked.length < count; i++) {
    picked.push(others[(i + offset) % others.length]);
  }
  return [...new Set(picked)];
}

// Puts the correct option at a position that varies from question to question.
function arrange(correctText, wrongTexts, slot) {
  const options = wrongTexts.map((text) => ({ text, correct: false }));
  options.splice(slot % (options.length + 1), 0, { text: correctText, correct: true });
  return options;
}

export function buildMockQuestions(parsed, offset = 0) {
  const pool = candidates(parsed);
  const allTerms = [...new Set(pool.flatMap((s) => s.terms))];

  if (pool.length < 4 || allTerms.length < 4) {
    throw new AppError(
      422,
      'Demo mode needs material with at least four sentences that highlight terms in `backticks` or **bold**. Add an API key to use the model instead.',
    );
  }
  if (parsed.codeBlocks.length === 0) {
    throw new AppError(422, 'The material has no code block, so a code-analysis question cannot be written from it.');
  }

  const pick = (n) => pool[(n + offset) % pool.length];
  const questions = [];

  // Two theory MCQs: fill in the blank with a key term.
  [0, 2].forEach((n, i) => {
    const s = pick(n);
    const term = s.terms[0];
    const blanked = plain(s.text.replace(`\`${term}\``, '____').replace(`**${term}**`, '____'));
    const wrong = pickDistractors(term, allTerms, i + offset, s.text);
    questions.push({
      type: 'mcq',
      text: `Fill in the blank using the material: "${blanked}"`,
      options: arrange(term, wrong, i + 1),
      explanation: `The material says: ${plain(s.text)}`,
      evidence: plain(s.text),
    });
  });

  // One true statement, taken as written.
  const trueSentence = pick(4);
  questions.push({
    type: 'true_false',
    text: plain(trueSentence.text),
    answer: true,
    explanation: 'This is stated directly in the material.',
    evidence: plain(trueSentence.text),
  });

  // One false statement: swap a key term for a different one.
  const falseSentence = pick(6);
  const original = falseSentence.terms[0];
  const swap = pickDistractors(original, allTerms, offset, falseSentence.text)[0];
  questions.push({
    type: 'true_false',
    text: plain(
      falseSentence.text.replace(`\`${original}\``, `\`${swap}\``).replace(`**${original}**`, `**${swap}**`),
    ),
    answer: false,
    explanation: `The material actually says: ${plain(falseSentence.text)}`,
    evidence: plain(falseSentence.text),
  });

  // Code analysis: ask what the snippet does, using the result comment that
  // the material itself writes next to the code (for example "// 15").
  const withResult = parsed.codeBlocks
    .map((block) => ({ block, result: lastResultComment(block.code) }))
    .filter((b) => b.result);

  if (withResult.length >= 2) {
    const { block, result } = withResult[offset % withResult.length];
    const others = withResult.map((b) => b.result).filter((r) => r !== result);
    const wrong = [...new Set(others)].slice(0, 3);
    for (const filler of ['Nothing is printed', 'undefined']) {
      if (wrong.length < 3 && !wrong.includes(filler) && filler !== result) wrong.push(filler);
    }
    const explaining =
      parsed.sentences.find((x) => x.section === block.section) || parsed.sentences[0];
    questions.push({
      type: 'code_analysis',
      text: 'What happens when the last line of this snippet runs?',
      language: block.language,
      code: block.code,
      options: arrange(result, wrong, 2),
      explanation: `The material shows this result in a comment next to the code: ${result}`,
      evidence: plain(explaining.text),
    });
  } else {
    throw new AppError(
      422,
      'Demo mode needs at least two code blocks that show their result in a // comment. Add an API key to use the model instead.',
    );
  }

  return questions.slice(0, QUESTION_PLAN.length);
}
