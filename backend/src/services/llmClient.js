// The only file that talks to the model API. Swapping providers means
// rewriting askModel and nothing else.
import { config } from '../config.js';
import { AppError } from '../utils/AppError.js';

export async function askModel({ system, user, maxTokens = 3500 }) {
  let res;
  try {
    res = await fetch(config.apiUrl, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': config.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: config.model,
        max_tokens: maxTokens,
        system,
        messages: [{ role: 'user', content: user }],
      }),
      signal: AbortSignal.timeout(90_000),
    });
  } catch (err) {
    throw new AppError(502, `Could not reach the model API: ${err.message}`);
  }

  if (!res.ok) {
    const body = await res.text();
    throw new AppError(502, `The model API returned ${res.status}. ${body.slice(0, 200)}`);
  }

  const data = await res.json();
  return (data.content || []).filter((b) => b.type === 'text').map((b) => b.text).join('');
}

// Models sometimes wrap JSON in code fences or add a sentence before it.
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
