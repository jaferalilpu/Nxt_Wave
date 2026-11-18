import { config } from '../config.js';
import { AppError } from '../utils/AppError.js';

export async function askModel({ system, user, maxTokens = 3500 }, retries = 3) {
  const url = 'https://api.groq.com/openai/v1/chat/completions';

  for (let attempt = 1; attempt <= retries; attempt++) {
    let res;
    try {
      res = await fetch(url, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'Authorization': `Bearer ${config.apiKey}`,
        },
        body: JSON.stringify({
          model: config.model,
          messages: [
            { role: 'system', content: system },
            { role: 'user', content: user }
          ],
          max_tokens: maxTokens,
        }),
        signal: AbortSignal.timeout(90_000),
      });
    } catch (err) {
      if (attempt === retries) throw new AppError(502, `Could not reach the model API: ${err.message}`);
      await new Promise((r) => setTimeout(r, 2000 * attempt));
      continue;
    }

    if (!res.ok) {
      const body = await res.text();
      throw new AppError(502, `The model API returned ${res.status}. ${body.slice(0, 200)}`);
    }

    const data = await res.json();
    const text = data.choices?.[0]?.message?.content;
    if (!text) {
      throw new AppError(502, 'The model API returned an empty response.');
    }
    return text;
  }
}

export function extractJson(text) {
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start === -1 || end === -1) throw new AppError(502, 'The model did not return JSON.');
  try {
    return JSON.parse(text.slice(start, end + 1));
  } catch {
    throw new AppError(502, 'The model returned JSON that could not be parsed.');
  }
}
