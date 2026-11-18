// Turns a reviewed question group into the tagged text format, and reads it back.
//
// NOTE: the assignment's attached file describes the official tag layout. If its
// tag names differ from the ones below, this is the only file that needs to change.

const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];

const escapeXml = (s) =>
  String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const unescapeXml = (s) =>
  String(s ?? '').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');

const TYPE_TO_TAG = { mcq: 'mcq', true_false: 'true-false', code_analysis: 'code-analysis' };
const TAG_TO_TYPE = Object.fromEntries(Object.entries(TYPE_TO_TAG).map(([k, v]) => [v, k]));

export function serializeGroup(questions) {
  const out = ['<question-group>'];

  questions.forEach((q, i) => {
    out.push(`  <question number="${i + 1}" type="${TYPE_TO_TAG[q.type]}">`);
    out.push(`    <text>${escapeXml(q.text)}</text>`);

    if (q.type === 'code_analysis') {
      out.push(`    <code language="${escapeXml(q.language || '')}">${escapeXml(q.code)}</code>`);
    }

    if (q.type === 'true_false') {
      out.push(`    <answer>${q.answer ? 'true' : 'false'}</answer>`);
    } else {
      q.options.forEach((opt, j) => {
        out.push(`    <option letter="${LETTERS[j]}" correct="${opt.correct ? 'true' : 'false'}">${escapeXml(opt.text)}</option>`);
      });
    }

    out.push(`    <explanation>${escapeXml(q.explanation)}</explanation>`);
    out.push(`    <source>${escapeXml(q.evidence)}</source>`);
    out.push('  </question>');
  });

  out.push('</question-group>');
  return out.join('\n');
}

// Reads the format above. Only used for round-trip tests and for re-importing exports.
export function parseGroup(tagged) {
  const questions = [];
  const questionRe = /<question number="\d+" type="([\w-]+)">([\s\S]*?)<\/question>/g;
  let match;

  while ((match = questionRe.exec(tagged))) {
    const type = TAG_TO_TYPE[match[1]];
    const body = match[2];
    const pick = (tag) => {
      const m = body.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`));
      return m ? unescapeXml(m[1]) : '';
    };

    const q = { type, text: pick('text'), explanation: pick('explanation'), evidence: pick('source') };

    if (type === 'true_false') q.answer = pick('answer') === 'true';
    if (type === 'code_analysis') {
      q.code = pick('code');
      q.language = (body.match(/<code language="([^"]*)"/) || [])[1] || '';
    }
    if (type !== 'true_false') {
      q.options = [...body.matchAll(/<option letter="\w" correct="(true|false)">([\s\S]*?)<\/option>/g)].map(
        (m) => ({ text: unescapeXml(m[2]), correct: m[1] === 'true' }),
      );
    }
    questions.push(q);
  }
  return questions;
}
