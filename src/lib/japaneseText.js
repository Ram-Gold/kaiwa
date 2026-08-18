import { sortedDictionary } from '../data/japaneseDictionary.js';

const JAPANESE_PATTERN = /[\u3040-\u30ff\u3400-\u9fff]/;
const KANJI_PATTERN = /[\u4e00-\u9faf\u3400-\u4dbf]/;
const KANA_PATTERN = /[\u3040-\u309f\u30a0-\u30ff]/;

/**
 * Strips ruby tags and bracketed furigana from Japanese text to produce clean,
 * natural text for Text-to-Speech (TTS) synthesis and translation.
 */
export function extractCleanJapaneseText(text) {
  if (!text) return '';
  return String(text)
    // Strip <ruby>kanji<rt>furigana</rt></ruby> -> kanji
    .replace(/<ruby>(.*?)<rt>.*?<\/rt><\/ruby>/gi, '$1')
    // Strip [kanji](furigana) -> kanji
    .replace(/\[([\u4e00-\u9faf\u3400-\u4dbf\u3040-\u30ff]+)\]\([^\)]+\)/g, '$1')
    // Strip {kanji|furigana} -> kanji
    .replace(/\{([\u4e00-\u9faf\u3400-\u4dbf\u3040-\u30ff]+)\|[^\}]+\}/g, '$1')
    // Strip kanji[furigana] -> kanji
    .replace(/([\u4e00-\u9faf\u3400-\u4dbf]+)\[[\u3040-\u30ff]+\]/g, '$1')
    // Strip kanji(furigana) -> kanji (when inside parentheses is kana only)
    .replace(/([\u4e00-\u9faf\u3400-\u4dbf]+)\([\u3040-\u30ff]+\)/g, '$1')
    // Strip kanji【furigana】 -> kanji
    .replace(/([\u4e00-\u9faf\u3400-\u4dbf]+)【[\u3040-\u30ff]+】/g, '$1');
}

/**
 * Splits a compound kanji+kana term (e.g. 行きます [いきます]) so that ONLY
 * the kanji character(s) receive the ruby furigana annotation (e.g. 行[い] + きます).
 */
export function splitRubyForWord(term, reading, entry) {
  if (!term || !reading) {
    return [{ type: 'text', text: term || '' }];
  }
  if (!KANJI_PATTERN.test(term)) {
    return [{ type: 'dictionary', text: term, entry }];
  }

  // 1. Match common leading kana
  let lead = 0;
  while (lead < term.length && lead < reading.length && term[lead] === reading[lead] && !KANJI_PATTERN.test(term[lead])) {
    lead++;
  }
  const leadingKana = term.slice(0, lead);
  const remTerm = term.slice(lead);
  const remReading = reading.slice(lead);

  // 2. Match common trailing kana
  let trail = 0;
  while (trail < remTerm.length && trail < remReading.length && remTerm[remTerm.length - 1 - trail] === remReading[remReading.length - 1 - trail] && !KANJI_PATTERN.test(remTerm[remTerm.length - 1 - trail])) {
    trail++;
  }
  const trailingKana = trail > 0 ? remTerm.slice(remTerm.length - trail) : '';
  const kanjiPart = trail > 0 ? remTerm.slice(0, -trail) : remTerm;
  const furiganaPart = trail > 0 ? remReading.slice(0, -trail) : remReading;

  const result = [];
  if (leadingKana) {
    result.push({ type: 'text', text: leadingKana });
  }

  // If kanjiPart still contains kana in the middle (e.g., '聞き取り' with reading 'ききとり'):
  const kanaInMiddleIdx = kanjiPart.search(KANA_PATTERN);
  if (kanaInMiddleIdx !== -1) {
    const k1 = kanjiPart.slice(0, kanaInMiddleIdx);
    const middleKanaChar = kanjiPart[kanaInMiddleIdx];
    const readingMiddleIdx = furiganaPart.indexOf(middleKanaChar);
    if (readingMiddleIdx !== -1 && readingMiddleIdx > 0) {
      const f1 = furiganaPart.slice(0, readingMiddleIdx);
      const restKanji = kanjiPart.slice(kanaInMiddleIdx + 1);
      const restFurigana = furiganaPart.slice(readingMiddleIdx + 1);
      result.push({
        type: 'ruby',
        kanji: k1,
        furigana: f1,
        text: k1,
        entry,
      });
      result.push({ type: 'text', text: middleKanaChar });
      const restTokens = splitRubyForWord(restKanji, restFurigana, entry);
      result.push(...restTokens);
      if (trailingKana) {
        result.push({ type: 'text', text: trailingKana });
      }
      return result;
    }
  }

  result.push({
    type: 'ruby',
    kanji: kanjiPart,
    furigana: furiganaPart,
    text: kanjiPart,
    entry,
  });

  if (trailingKana) {
    result.push({ type: 'text', text: trailingKana });
  }

  return result;
}

/**
 * Tokenizes Japanese text into characters, dictionary words, and ruby annotations.
 * Supports reading modes:
 * - 'japanese' | 'furigana': Isolated Hiragana furigana strictly over Kanji characters.
 * - 'romaji': Tokenized Romaji readings directly above Japanese text.
 * - 'off': Plain Japanese text without ruby annotations.
 */
export function tokenizeJapaneseText(text, mode = 'japanese') {
  const normalizedMode = String(mode || 'japanese').toLowerCase();

  if (normalizedMode === 'off') {
    const clean = extractCleanJapaneseText(text);
    return [{ type: 'text', text: clean }];
  }

  const source = String(text || '');
  const tokens = [];
  let index = 0;

  while (index < source.length) {
    // 1. Check for HTML <ruby>...<rt>...</rt></ruby>
    if (source.startsWith('<ruby', index)) {
      const rubyEnd = source.indexOf('</ruby>', index);
      if (rubyEnd !== -1) {
        const fullTag = source.slice(index, rubyEnd + 7);
        const match = fullTag.match(/<ruby>(.*?)<rt>(.*?)<\/rt><\/ruby>/i);
        if (match) {
          const kanji = match[1];
          const furigana = match[2];
          const dictEntry = sortedDictionary.find((e) => e.term === kanji);
          const splitTokens = splitRubyForWord(kanji, furigana, dictEntry || { term: kanji, reading: furigana, script: 'kanji' });
          tokens.push(...splitTokens);
          index += fullTag.length;
          continue;
        }
      }
    }

    // 2. Check for markdown / bracket ruby patterns
    // a) [漢字](かんじ)
    if (source[index] === '[') {
      const bracketMatch = source.slice(index).match(/^\[([\u4e00-\u9faf\u3400-\u4dbf\u3040-\u30ff]+)\]\(([\u3040-\u30ff]+)\)/);
      if (bracketMatch) {
        const [, kanji, furigana] = bracketMatch;
        const dictEntry = sortedDictionary.find((e) => e.term === kanji);
        const splitTokens = splitRubyForWord(kanji, furigana, dictEntry || { term: kanji, reading: furigana, script: 'kanji' });
        tokens.push(...splitTokens);
        index += bracketMatch[0].length;
        continue;
      }
    }

    // b) {漢字|かんじ}
    if (source[index] === '{') {
      const braceMatch = source.slice(index).match(/^\{([\u4e00-\u9faf\u3400-\u4dbf\u3040-\u30ff]+)\|([\u3040-\u30ff]+)\}/);
      if (braceMatch) {
        const [, kanji, furigana] = braceMatch;
        const dictEntry = sortedDictionary.find((e) => e.term === kanji);
        const splitTokens = splitRubyForWord(kanji, furigana, dictEntry || { term: kanji, reading: furigana, script: 'kanji' });
        tokens.push(...splitTokens);
        index += braceMatch[0].length;
        continue;
      }
    }

    // c) 漢字[かんじ], 漢字(かんじ), 漢字【かんじ】
    if (KANJI_PATTERN.test(source[index])) {
      const kanjiBracketMatch = source.slice(index).match(/^([\u4e00-\u9faf\u3400-\u4dbf]+)(?:\[([\u3040-\u30ff]+)\]|\(([\u3040-\u30ff]+)\)|【([\u3040-\u30ff]+)】)/);
      if (kanjiBracketMatch) {
        const kanji = kanjiBracketMatch[1];
        const furigana = kanjiBracketMatch[2] || kanjiBracketMatch[3] || kanjiBracketMatch[4];
        const dictEntry = sortedDictionary.find((e) => e.term === kanji);
        const splitTokens = splitRubyForWord(kanji, furigana, dictEntry || { term: kanji, reading: furigana, script: 'kanji' });
        tokens.push(...splitTokens);
        index += kanjiBracketMatch[0].length;
        continue;
      }
    }

    // 3. Dictionary Term Lookup
    const dictMatch = findDictionaryMatch(source, index);
    if (dictMatch) {
      if (KANJI_PATTERN.test(dictMatch.term) && dictMatch.reading && dictMatch.reading !== dictMatch.term) {
        const cleanReading = dictMatch.reading.split('/')[0].trim();
        const splitTokens = splitRubyForWord(dictMatch.term, cleanReading, dictMatch);
        tokens.push(...splitTokens);
      } else {
        tokens.push({
          type: 'dictionary',
          text: dictMatch.term,
          entry: dictMatch,
        });
      }
      index += dictMatch.term.length;
      continue;
    }

    // 4. Standalone character
    const char = source[index];
    const previous = tokens[tokens.length - 1];

    if (previous?.type === 'text') {
      previous.text += char;
    } else {
      tokens.push({ type: 'text', text: char });
    }

    index += 1;
  }

  // If mode is 'romaji', convert tokens to include Romaji readings above all Japanese segments
  if (normalizedMode === 'romaji') {
    const romajiTokens = [];
    for (const token of tokens) {
      if (token.type === 'ruby') {
        const romaji = token.entry?.romaji || convertKanaToRomaji(token.furigana || token.kanji);
        romajiTokens.push({
          ...token,
          furigana: romaji,
        });
      } else if (token.type === 'dictionary') {
        const romaji = token.entry?.romaji || convertKanaToRomaji(token.entry?.reading || token.text);
        romajiTokens.push({
          type: 'ruby',
          kanji: token.text,
          furigana: romaji,
          text: token.text,
          entry: token.entry,
        });
      } else if (token.type === 'text') {
        if (KANA_PATTERN.test(token.text) || KANJI_PATTERN.test(token.text)) {
          const romaji = convertKanaToRomaji(token.text);
          romajiTokens.push({
            type: 'ruby',
            kanji: token.text,
            furigana: romaji,
            text: token.text,
          });
        } else {
          romajiTokens.push(token);
        }
      } else {
        romajiTokens.push(token);
      }
    }
    return romajiTokens;
  }

  return tokens;
}

export function getKnownRomajiGlosses(text) {
  const seen = new Set();

  return tokenizeJapaneseText(text)
    .filter((token) => (token.type === 'dictionary' || token.type === 'ruby') && token.entry?.meaning)
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

export function toRomajiText(text) {
  const tokens = tokenizeJapaneseText(text);
  return tokens
    .map((token) => {
      if ((token.type === 'dictionary' || token.type === 'ruby') && token.entry?.romaji) {
        return token.entry.romaji;
      }
      if (token.furigana) {
        return convertKanaToRomaji(token.furigana);
      }
      return convertKanaToRomaji(token.text);
    })
    .join(' ');
}

const KANA_ROMAJI_MAP = {
  あ: 'a', い: 'i', う: 'u', え: 'e', お: 'o',
  か: 'ka', き: 'ki', く: 'ku', け: 'ke', こ: 'ko',
  さ: 'sa', し: 'shi', す: 'su', せ: 'se', そ: 'so',
  た: 'ta', ち: 'chi', つ: 'tsu', て: 'te', と: 'to',
  な: 'na', に: 'ni', ぬ: 'nu', ね: 'ne', の: 'no',
  は: 'ha', ひ: 'hi', ふ: 'fu', へ: 'he', ほ: 'ho',
  ま: 'ma', み: 'mi', む: 'mu', め: 'me', も: 'mo',
  や: 'ya', ゆ: 'yu', よ: 'yo',
  ら: 'ra', り: 'ri', る: 'ru', れ: 're', ろ: 'ro',
  わ: 'wa', を: 'o', ん: 'n',
  が: 'ga', ぎ: 'gi', ぐ: 'gu', げ: 'ge', ご: 'go',
  ざ: 'za', じ: 'ji', ず: 'zu', ぜ: 'ze', ぞ: 'zo',
  だ: 'da', ぢ: 'ji', づ: 'zu', で: 'de', ど: 'do',
  ば: 'ba', び: 'bi', ぶ: 'bu', べ: 'be', ぼ: 'bo',
  ぱ: 'pa', ぴ: 'pi', ぷ: 'pu', ぺ: 'pe', ぽ: 'po',
  きゃ: 'kya', きゅ: 'kyu', きょ: 'kyo',
  しゃ: 'sha', しゅ: 'shu', しょ: 'sho',
  ちゃ: 'cha', ちゅ: 'chu', ちょ: 'cho',
  にゃ: 'nya', にゅ: 'nyu', にょ: 'nyo',
  ひゃ: 'hya', ひゅ: 'hyu', ひょ: 'hyo',
  みゃ: 'mya', みゅ: 'myu', みょ: 'myo',
  りゃ: 'rya', りゅ: 'ryu', りょ: 'ryo',
  ぎゃ: 'gya', ぎゅ: 'gyu', ぎょ: 'gyo',
  じゃ: 'ja', じゅ: 'ju', じょ: 'jo',
  びゃ: 'bya', びゅ: 'byu', びょ: 'byo',
  ぴゃ: 'pya', ぴゅ: 'pyu', ぴょ: 'pyo',
  ア: 'a', イ: 'i', ウ: 'u', エ: 'e', オ: 'o',
  カ: 'ka', キ: 'ki', ク: 'ku', ケ: 'ke', コ: 'ko',
  サ: 'sa', シ: 'shi', ス: 'su', セ: 'se', ソ: 'so',
  タ: 'ta', チ: 'chi', ツ: 'tsu', テ: 'te', ト: 'to',
  ナ: 'na', ニ: 'ni', ヌ: 'nu', ネ: 'ne', ノ: 'no',
  ハ: 'ha', ヒ: 'hi', フ: 'fu', ヘ: 'he', ホ: 'ho',
  マ: 'ma', ミ: 'mi', ム: 'mu', メ: 'me', モ: 'mo',
  ヤ: 'ya', ユ: 'yu', ヨ: 'yo',
  ラ: 'ra', リ: 'ri', ル: 'ru', レ: 're', ロ: 'ro',
  ワ: 'wa', ヲ: 'o', ン: 'n',
};

function convertKanaToRomaji(text) {
  let result = '';
  let i = 0;
  while (i < text.length) {
    if (i + 1 < text.length) {
      const pair = text.slice(i, i + 2);
      if (KANA_ROMAJI_MAP[pair]) {
        result += KANA_ROMAJI_MAP[pair];
        i += 2;
        continue;
      }
    }
    const char = text[i];
    result += KANA_ROMAJI_MAP[char] || char;
    i++;
  }
  return result;
}

function findDictionaryMatch(source, index) {
  if (!JAPANESE_PATTERN.test(source[index])) {
    return null;
  }

  return sortedDictionary.find((entry) => source.startsWith(entry.term, index));
}
