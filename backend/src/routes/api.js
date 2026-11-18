// HTTP endpoints. Each handler only reads the request, calls a service and
// sends back the result; the real work lives in services/.
import { Router } from 'express';
import { config } from '../config.js';
import { AppError } from '../utils/AppError.js';
import { generateGroup, regenerateQuestion, verifyQuestion } from '../services/generator.js';
import { validateGroup } from '../services/validator.js';
import { serializeGroup } from '../services/tagFormat.js';
import { normalizeQuestion } from '../services/questionModel.js';
import { parseMaterial } from '../services/markdownParser.js';
import { checkGrounding } from '../services/grounding.js';

export const api = Router();

// Express 4 does not catch rejected promises on its own.
const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res)).catch(next);

api.get('/health', (req, res) => {
  res.json({ ok: true, mode: config.mockMode ? 'demo' : 'live', model: config.mockMode ? null : config.model });
});

api.post('/generate', wrap(async (req, res) => {
  res.json(await generateGroup(req.body.material));
}));

api.post('/regenerate', wrap(async (req, res) => {
  const { material, type, existingTexts, attempt } = req.body;
  res.json({ question: await regenerateQuestion(material, type, existingTexts, attempt) });
}));

api.post('/verify', wrap(async (req, res) => {
  res.json(verifyQuestion(req.body.material, req.body.question));
}));

// The server re-checks everything before it hands out the final text, so a
// tampered or stale client cannot export an ungrounded question.
api.post('/export', wrap(async (req, res) => {
  const { material, questions } = req.body;
  if (!Array.isArray(questions)) throw new AppError(400, 'No questions to export.');

  const clean = questions.map(normalizeQuestion);
  const structural = validateGroup(clean);
  if (structural.length) throw new AppError(422, 'The group is not complete yet.', structural);

  const parsed = parseMaterial(material);
  const ungrounded = clean
    .map((q, i) => ({ n: i + 1, status: checkGrounding(q, parsed).status }))
    .filter((r) => r.status === 'ungrounded')
    .map((r) => `Question ${r.n} is not supported by the material.`);
  if (ungrounded.length) throw new AppError(422, 'Some questions test things the material does not teach.', ungrounded);

  res.json({ text: serializeGroup(clean) });
}));
