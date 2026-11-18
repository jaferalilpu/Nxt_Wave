import 'dotenv/config';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));

const apiKey = process.env.GROQ_API_KEY || '';

export const config = {
  port: Number(process.env.PORT) || 4000,
  apiKey,
  model: process.env.MODEL || 'llama-3.3-70b-versatile',
  mockMode: process.env.MOCK_MODE === 'true' || !apiKey,
  auditEnabled: process.env.AUDIT !== 'off',
  minMaterialChars: 300,
  maxMaterialChars: 30000,
  frontendDist: path.resolve(here, '../../frontend/dist'),
};
