// Small text helpers used by the parser and the grounding checks.

// Lower-cased words and numbers. Punctuation, markdown and backticks fall away,
// which is what lets "`let` is block scoped." match "let is block-scoped".
export function tokens(text) {
  return String(text || '').toLowerCase().match(/[\p{L}\p{N}_]+/gu) || [];
}

export function tokenString(text) {
  return tokens(text).join(' ');
}

// A very light stemmer. Good enough to treat "variables" and "variable" as the same word.
export function stem(word) {
  return word
    .replace(/(ing|ed|es|s)$/, '')
    .replace(/(.)\1$/, '$1');
}

const STOP_WORDS = new Set((
  'about above after again also always another because before being between both cannot could does doing each ' +
  'either every from have here into just like make many more most much must never only other over same should ' +
  'some such than that their them then there these they this those through under until very were what when ' +
  'where whether which while will with within without would your you are the and for not but can has had was ' +
  // words that show up in almost every question and say nothing about the topic
  'according material following statement correct incorrect true false best describes described describe ' +
  'snippet code output result results value values print prints printed run runs running line lines ' +
  'question answer option choose select given first second third state states stated mean means refer ' +
  'happen happens used use uses using called name named example term terms complete completes fill blank read'
).split(' '));

export function contentWords(text) {
  return [...new Set(tokens(text))].filter(
    (w) => w.length >= 4 && !STOP_WORDS.has(w) && !/^\d+$/.test(w) && !/^_+$/.test(w),
  );
}
