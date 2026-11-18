export async function askModel({ system, user, maxTokens = 3500 }, retries = 3) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${config.model}:generateContent?key=${config.apiKey}`;

  for (let attempt = 1; attempt <= retries; attempt++) {
    let res;
    try {
      res = await fetch(url, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: system }] },
          contents: [{ role: 'user', parts: [{ text: user }] }],
          generationConfig: { maxOutputTokens: maxTokens },
        }),
        signal: AbortSignal.timeout(90_000),
      });
    } catch (err) {
      if (attempt === retries) throw new AppError(502, `Could not reach the model API: ${err.message}`);
      await new Promise((r) => setTimeout(r, 2000 * attempt));
      continue;
    }

    if (res.status === 503 && attempt < retries) {
      // Wait before retrying on high demand
      await new Promise((r) => setTimeout(r, 3000 * attempt));
      continue;
    }

    if (!res.ok) {
      const body = await res.text();
      throw new AppError(502, `The model API returned ${res.status}. ${body.slice(0, 200)}`);
    }

    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      throw new AppError(502, 'The model API returned an empty response.');
    }
    return text;
  }
}
