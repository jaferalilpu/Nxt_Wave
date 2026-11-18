// Finds where a piece of evidence sits in the raw markdown so it can be
// highlighted. The backend compares words only (no punctuation, no backticks),
// so we do the same here: build a pattern from the words and let anything that
// is not a letter or number sit between them.
const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export function findRange(material, needle) {
  const words = (String(needle || '').toLowerCase().match(/[\p{L}\p{N}_]+/gu)) || [];
  if (words.length < 3) return null;
  const pattern = words.map(escapeRe).join('[^\\p{L}\\p{N}_]+');
  const match = new RegExp(pattern, 'iu').exec(material);
  return match ? { start: match.index, end: match.index + match[0].length } : null;
}

// Cuts the material into plain and highlighted pieces.
export function buildSegments(material, needles) {
  const ranges = needles
    .map((n) => findRange(material, n))
    .filter(Boolean)
    .sort((a, b) => a.start - b.start);

  const segments = [];
  let cursor = 0;
  for (const r of ranges) {
    if (r.start < cursor) continue; // overlaps the previous highlight
    if (r.start > cursor) segments.push({ text: material.slice(cursor, r.start), marked: false });
    segments.push({ text: material.slice(r.start, r.end), marked: true });
    cursor = r.end;
  }
  if (cursor < material.length) segments.push({ text: material.slice(cursor), marked: false });
  return segments;
}
