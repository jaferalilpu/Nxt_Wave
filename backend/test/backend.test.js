import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { parseMaterial } from '../src/services/markdownParser.js';
import { checkGrounding } from '../src/services/grounding.js';
import { validateGroup } from '../src/services/validator.js';
import { serializeGroup, parseGroup } from '../src/services/tagFormat.js';
import { buildMockQuestions } from '../src/services/mockGenerator.js';
import { normalizeQuestion } from '../src/services/questionModel.js';

const material = fs.readFileSync(new URL('../../sample/sample-material.md', import.meta.url), 'utf8');
const parsed = parseMaterial(material);

test('parser finds sections, sentences and code blocks', () => {
  assert.ok(parsed.codeBlocks.length >= 4);
  assert.ok(parsed.sentences.length > 10);
  assert.ok(parsed.sections.includes('Block scope'));
});

test('demo generator produces a valid five-question group', () => {
  const questions = buildMockQuestions(parsed).map(normalizeQuestion);
  assert.deepEqual(validateGroup(questions), []);
  assert.deepEqual(questions.map((q) => q.type), ['mcq', 'mcq', 'true_false', 'true_false', 'code_analysis']);
});

test('demo questions are all grounded in the material', () => {
  const questions = buildMockQuestions(parsed).map(normalizeQuestion);
  for (const q of questions) {
    assert.notEqual(checkGrounding(q, parsed).status, 'ungrounded', q.text);
  }
});

test('invented evidence is caught as ungrounded', () => {
  const q = normalizeQuestion({
    type: 'true_false',
    text: 'Arrow functions have no own this binding.',
    answer: true,
    explanation: 'Because.',
    evidence: 'Arrow functions do not have their own this binding in JavaScript.',
  }, 0);
  const result = checkGrounding(q, parsed);
  assert.equal(result.status, 'ungrounded');
});

test('code that is not in the material is caught', () => {
  const q = normalizeQuestion({
    type: 'code_analysis',
    text: 'What does this print?',
    code: 'const double = (n) => n * 2;\nconsole.log(double(4));',
    options: [{ text: '8', correct: true }, { text: '4', correct: false }, { text: '2', correct: false }, { text: 'undefined', correct: false }],
    explanation: 'It doubles.',
    evidence: 'A variable is a named container that holds a value your program can use later.',
  }, 0);
  const result = checkGrounding(q, parsed);
  assert.equal(result.status, 'ungrounded');
  assert.equal(result.checks.find((c) => c.name === 'code').pass, false);
});

test('a question using topics the material never mentions is flagged weak', () => {
  const q = normalizeQuestion({
    type: 'true_false',
    text: 'A closure remembers variables from its enclosing lexical environment.',
    answer: true,
    explanation: 'Closures capture scope.',
    evidence: 'Variables declared with `let` and `const` are block scoped, which means they only exist inside the pair of curly braces where they were declared.',
  }, 0);
  assert.equal(checkGrounding(q, parsed).status, 'weak');
});

test('tag format survives a round trip, including special characters', () => {
  const questions = buildMockQuestions(parsed).map(normalizeQuestion);
  questions[4].code = 'if (a < b && c > d) { console.log("x"); }';
  const back = parseGroup(serializeGroup(questions));
  assert.equal(back.length, 5);
  assert.equal(back[4].code, questions[4].code);
  assert.equal(back[2].answer, true);
  assert.equal(back[0].options.filter((o) => o.correct).length, 1);
});

test('validator rejects a group with the wrong mix', () => {
  const questions = buildMockQuestions(parsed).map(normalizeQuestion);
  questions[0].type = 'true_false';
  assert.ok(validateGroup(questions).length > 0);
});
