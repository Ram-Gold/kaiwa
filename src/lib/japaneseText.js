import { sortedDictionary } from '../data/japaneseDictionary.js';

const JAPANESE_PATTERN = /[\u3040-\u30ff\u3400-\u9fff]/;

export function tokenizeJapaneseText(text) {
  const source = String(text || '');
  const tokens = [];
  let index = 0;

  while (index < source.length) {
    const match = findDictionaryMatch(source, index);

    if (match) {
      tokens.push({
        type: 'dictionary',
        text: match.term,
        entry: match,
      });
      index += match.term.length;
      continue;
    }

    const char = source[index];
    const previous = tokens[tokens.length - 1];

    if (previous?.type === 'text') {
      previous.text += char;
    } else {
      tokens.push({ type: 'text', text: char });
    }

    index += 1;
  }

  return tokens;
}

export function getKnownRomajiGlosses(text) {
  const seen = new Set();

  return tokenizeJapaneseText(text)
    .filter((token) => token.type === 'dictionary')
    .map((token) => token.entry)
    .filter((entry) => {
      if (seen.has(entry.term)) {
        return false;
      }

      seen.add(entry.term);
      return true;
    })
    .map((entry) => ({
      term: entry.term,
      reading: entry.reading,
      romaji: entry.romaji,
      meaning: entry.meaning,
    }));
}

function findDictionaryMatch(source, index) {
  if (!JAPANESE_PATTERN.test(source[index])) {
    return null;
  }

  return sortedDictionary.find((entry) => source.startsWith(entry.term, index));
}
