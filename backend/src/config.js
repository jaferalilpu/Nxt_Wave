// All settings live here so the rest of the code never reads process.env directly.
import 'dotenv/config';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));

const apiKey = process.env.ANTHROPIC_API_KEY || '';

export const config = {
  port: Number(process.env.PORT) || 4000,
  apiKey,
  // Overridable so tests (or a proxy) can stand in for the real API.
  apiUrl: process.env.ANTHROPIC_API_URL || 'https://api.anthropic.com/v1/messages',
  model: process.env.MODEL || 'claude-sonnet-5-5',
  // No key means we cannot call the model, so fall back to demo mode.
  mockMode: process.env.MOCK_MODE === 'true' || !apiKey,
  auditEnabled: process.env.AUDIT !== 'off',
  minMaterialChars: 300,
  maxMaterialChars: 30000,
  // When the React app has been built, the backend serves it from here.
  frontendDist: path.resolve(here, '../../frontend/dist'),
};
