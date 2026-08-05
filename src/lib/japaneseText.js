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

export function toRomajiText(text) {
  const tokens = tokenizeJapaneseText(text);
  return tokens
    .map((token) => {
      if (token.type === 'dictionary' && token.entry?.romaji) {
        return token.entry.romaji;
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
