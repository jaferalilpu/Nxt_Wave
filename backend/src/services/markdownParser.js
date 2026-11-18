// Reads the reading material (markdown) and splits it into the pieces the rest
// of the app needs: sentences, code blocks, section names and a vocabulary.
import { tokens, stem } from '../utils/text.js';

function splitSentences(paragraph) {
  return paragraph
    .split(/(?<=[.!?])\s+(?=[A-Z`"'(\d])/)
    .map((s) => s.trim())
    .filter((s) => s.length >= 15);
}

export function parseMaterial(raw) {
  const text = String(raw || '').replace(/\r\n/g, '\n').trim();
  const lines = text.split('\n');

  const sentences = [];
  const codeBlocks = [];
  const sections = [];

  let section = 'Introduction';
  let paragraph = [];
  let inCode = false;
  let codeLang = '';
  let codeLines = [];

  const flushParagraph = () => {
    const joined = paragraph.join(' ').trim();
    paragraph = [];
    if (!joined) return;
    for (const s of splitSentences(joined)) sentences.push({ text: s, section });
  };

  for (const line of lines) {
    const fence = line.match(/^\s*```(\w*)/);
    if (fence) {
      if (!inCode) {
        flushParagraph();
        inCode = true;
        codeLang = fence[1] || '';
        codeLines = [];
      } else {
        codeBlocks.push({
          language: codeLang,
          code: codeLines.join('\n'),
          section,
          // how many prose sentences came before this block, handy for finding its explanation
          sentencesBefore: sentences.length,
        });
        inCode = false;
      }
      continue;
    }
    if (inCode) {
      codeLines.push(line);
      continue;
    }

    const heading = line.match(/^#{1,6}\s+(.*)/);
    if (heading) {
      flushParagraph();
      section = heading[1].trim();
      if (!sections.includes(section)) sections.push(section);
      continue;
    }

    if (!line.trim()) {
      flushParagraph();
      continue;
    }

    // Each list item is its own little paragraph.
    const bullet = line.match(/^\s*(?:[-*]|\d+\.)\s+(.*)/);
    if (bullet) {
      flushParagraph();
      paragraph.push(bullet[1]);
      flushParagraph();
      continue;
    }

    paragraph.push(line.trim());
  }
  flushParagraph();

  // Everything the material uses, code included, counts as "taught vocabulary".
  const vocabulary = new Set(tokens(text).map(stem));

  return {
    text,
    sentences,
    codeBlocks,
    sections,
    vocabulary,
    wordCount: tokens(text).length,
  };
}
