// Exercises the live path end to end against a fake model server, so no API key
// or network is needed. The fake "model" deliberately slips in one invented question.
import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import fs from 'node:fs';

const material = fs.readFileSync(new URL('../../sample/sample-material.md', import.meta.url), 'utf8');

const opts = (a, b, c, d, right) =>
  [a, b, c, d].map((text, i) => ({ text, correct: i === right }));

const group = {
  questions: [
    {
      type: 'mcq',
      text: 'What does it mean that let and const are block scoped?',
      options: opts('They exist only inside the curly braces where declared', 'They exist everywhere in the file', 'They exist only inside functions', 'They cannot be changed', 0),
      explanation: 'Block scoped variables only exist inside their braces.',
      evidence: 'Variables declared with `let` and `const` are **block scoped**, which means they only exist inside the pair of curly braces where they were declared.',
    },
    {
      type: 'mcq',
      text: 'When should you choose const over let?',
      options: opts('When the value will be reassigned', 'When the value should never be reassigned', 'When you want function scope', 'When you want hoisting', 1),
      explanation: 'const is for values that are not reassigned.',
      evidence: 'Use `const` when the value should never be reassigned after it is set.',
    },
    {
      type: 'true_false',
      text: 'Reassigning a const variable throws a TypeError.',
      answer: true,
      explanation: 'The material states this directly.',
      evidence: 'Trying to reassign a `const` variable throws a `TypeError`.',
    },
    {
      // This one tests something the material never teaches.
      type: 'true_false',
      text: 'Arrow functions do not have their own this binding.',
      answer: true,
      explanation: 'Arrow functions capture this lexically.',
      evidence: 'Arrow functions do not have their own this binding.',
    },
    {
      type: 'code_analysis',
      text: 'What does the final line of this code do?',
      language: 'js',
      code: 'if (true) {\n  let message = "hello";\n  console.log(message); // hello\n}\nconsole.log(message); // ReferenceError: message is not defined',
      options: opts('Prints hello', 'Prints undefined', 'Throws a ReferenceError', 'Throws a TypeError', 2),
      explanation: 'message only exists inside the block.',
      evidence: 'Code outside that block cannot see them.',
    },
  ],
};

test('live path: generation, audit and grounding work together', async () => {
  const fake = http.createServer((req, res) => {
    let body = '';
    req.on('data', (c) => (body += c));
    req.on('end', () => {
      const { system } = JSON.parse(body);
      const reply = system.includes('strict checker')
        ? { audits: group.questions.map((q, i) => ({ id: `q${i + 1}`, verdict: i === 3 ? 'unsupported' : 'supported', reason: i === 3 ? 'Not in the material.' : 'Fine.' })) }
        : group;
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ content: [{ type: 'text', text: 'Here you go:\n```json\n' + JSON.stringify(reply) + '\n```' }] }));
    });
  });
  await new Promise((r) => fake.listen(0, r));

  process.env.ANTHROPIC_API_KEY = 'test-key';
  process.env.ANTHROPIC_API_URL = `http://localhost:${fake.address().port}/v1/messages`;
  process.env.MOCK_MODE = 'false';
  const { generateGroup } = await import('../src/services/generator.js');

  const { questions, meta } = await generateGroup(material);
  fake.close();

  assert.equal(meta.mode, 'live');
  assert.equal(questions.length, 5);
  assert.deepEqual(questions.slice(0, 3).map((q) => q.grounding.status), ['grounded', 'grounded', 'grounded']);
  assert.equal(questions[3].grounding.status, 'ungrounded', 'the invented question must be caught');
  assert.equal(questions[4].grounding.status, 'grounded');
  assert.ok(questions[3].grounding.checks.some((c) => c.name === 'audit'));
});
