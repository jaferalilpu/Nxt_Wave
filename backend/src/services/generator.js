// Ties everything together: parse the material, get questions (from the model
// or the demo generator), check structure, check grounding, ask for a second
// opinion, and hand the reviewer a group with a status on every question.
import { config } from '../config.js';
import { AppError } from '../utils/AppError.js';
import { parseMaterial } from './markdownParser.js';
import { askModel, extractJson } from './llmClient.js';
import { buildMockQuestions } from './mockGenerator.js';
import { normalizeQuestion, QUESTION_PLAN } from './questionModel.js';
import { validateGroup, validateQuestion } from './validator.js';
import { checkGrounding, applyAudit } from './grounding.js';
import {
  GENERATION_SYSTEM,
  AUDIT_SYSTEM,
  buildGenerationPrompt,
  buildSingleQuestionPrompt,
  buildRepairPrompt,
  buildAuditPrompt,
} from './prompts.js';

function readMaterial(raw) {
  const text = String(raw || '').trim();
  if (text.length < config.minMaterialChars) {
    throw new AppError(400, `The material is too short to write five good questions from (minimum ${config.minMaterialChars} characters).`);
  }
  if (text.length > config.maxMaterialChars) {
    throw new AppError(400, `The material is too long (maximum ${config.maxMaterialChars} characters). Split it into sections.`);
  }
  const parsed = parseMaterial(text);
  if (parsed.codeBlocks.length === 0) {
    throw new AppError(422, 'The material has no code block, so a code-analysis question cannot be written from it.');
  }
  return parsed;
}

async function auditQuestions(parsed, questions) {
  try {
    const reply = await askModel({
      system: AUDIT_SYSTEM,
      user: buildAuditPrompt(parsed.text, questions),
      maxTokens: 1500,
    });
    const { audits } = extractJson(reply);
    return Object.fromEntries((audits || []).map((a) => [a.id, a]));
  } catch (err) {
    console.warn('Audit pass skipped:', err.message);
    return {};
  }
}

// Adds the grounding report (and the audit, when available) to each question.
async function attachGrounding(parsed, questions, { audit }) {
  const audits = audit ? await auditQuestions(parsed, questions) : {};
  return questions.map((q) => ({
    ...q,
    grounding: applyAudit(checkGrounding(q, parsed), audits[q.id] || null),
  }));
}

async function liveGroup(parsed) {
  let reply = await askModel({ system: GENERATION_SYSTEM, user: buildGenerationPrompt(parsed.text) });
  let questions = (extractJson(reply).questions || []).map(normalizeQuestion);
  let problems = validateGroup(questions);

  // One repair attempt if the shape was wrong.
  if (problems.length) {
    reply = await askModel({ system: GENERATION_SYSTEM, user: buildRepairPrompt(parsed.text, problems) });
    questions = (extractJson(reply).questions || []).map(normalizeQuestion);
    problems = validateGroup(questions);
  }
  if (problems.length) {
    throw new AppError(502, 'The model could not produce a well-formed group.', problems);
  }
  return questions;
}

export async function generateGroup(materialText) {
  const parsed = readMaterial(materialText);
  const mode = config.mockMode ? 'demo' : 'live';

  const questions = config.mockMode
    ? buildMockQuestions(parsed).map(normalizeQuestion)
    : await liveGroup(parsed);

  const checked = await attachGrounding(parsed, questions, { audit: !config.mockMode && config.auditEnabled });
  return { questions: checked, meta: { mode, model: config.mockMode ? null : config.model } };
}

// Replaces one question. `attempt` rotates which sentences the demo generator uses.
export async function regenerateQuestion(materialText, type, existingTexts = [], attempt = 1) {
  const parsed = readMaterial(materialText);
  const slot = QUESTION_PLAN.indexOf(type);
  if (slot === -1) throw new AppError(400, `Unknown question type "${type}".`);

  let question;
  if (config.mockMode) {
    const all = buildMockQuestions(parsed, attempt * 3).map(normalizeQuestion);
    question = all.find((q) => q.type === type);
  } else {
    const reply = await askModel({
      system: GENERATION_SYSTEM,
      user: buildSingleQuestionPrompt(parsed.text, type, existingTexts),
      maxTokens: 1500,
    });
    question = normalizeQuestion(extractJson(reply).questions?.[0], slot);
    const problems = validateQuestion(question);
    if (problems.length) throw new AppError(502, 'The model returned a malformed question.', problems);
  }

  const [checked] = await attachGrounding(parsed, [question], { audit: !config.mockMode && config.auditEnabled });
  return checked;
}

// Used by the "re-check" button and before approving or exporting.
export function verifyQuestion(materialText, question) {
  const parsed = readMaterial(materialText);
  const clean = normalizeQuestion(question, 0);
  return { problems: validateQuestion(clean), grounding: checkGrounding(clean, parsed) };
}
