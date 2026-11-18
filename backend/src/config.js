import 'dotenv/config';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));

// Look for GEMINI_API_KEY instead of ANTHROPIC_API_KEY
const apiKey = process.env.GEMINI_API_KEY || '';

export const config = {
  port: Number(process.env.PORT) || 4000,
  apiKey,
  // Gemini model default (or whatever Gemini model your code calls)
  model: process.env.MODEL || 'gemini-1.5-flash',
  // No key means we cannot call the model, so fall back to demo mode.
  mockMode: process.env.MOCK_MODE === 'true' || !apiKey,
  auditEnabled: process.env.AUDIT !== 'off',
  minMaterialChars: 300,
  maxMaterialChars: 30000,
  // When the React app has been built, the backend serves it from here.
  frontendDist: path.resolve(here, '../../frontend/dist'),
};
