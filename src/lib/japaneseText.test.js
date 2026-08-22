import { describe, it, expect } from 'vitest';
import {
  tokenizeJapaneseText,
  extractCleanJapaneseText,
  getKnownRomajiGlosses,
  toRomajiText,
} from './japaneseText.js';

describe('Japanese Text Tokenizer & Furigana Parser', () => {
  it('parses bracket furigana notation matching the reference format', () => {
    const input = 'こんにちは！はじめまして。最近[さいきん]の趣味[しゅみ]は何[なん]ですか？';
    const tokens = tokenizeJapaneseText(input);

    const rubyTokens = tokens.filter((t) => t.type === 'ruby');
    expect(rubyTokens).toHaveLength(3);

    expect(rubyTokens[0]).toMatchObject({
      type: 'ruby',
      kanji: '最近',
      furigana: 'さいきん',
    });

    expect(rubyTokens[1]).toMatchObject({
      type: 'ruby',
      kanji: '趣味',
      furigana: 'しゅみ',
    });

    expect(rubyTokens[2]).toMatchObject({
      type: 'ruby',
      kanji: '何',
      furigana: 'なん',
    });
  });

  it('parses HTML <ruby> tags seamlessly', () => {
    const input = '<ruby>今日<rt>きょう</rt></ruby>はいい天気です。';
    const tokens = tokenizeJapaneseText(input);

    const rubyTokens = tokens.filter((t) => t.type === 'ruby');
    expect(rubyTokens).toHaveLength(1);
    expect(rubyTokens[0]).toMatchObject({
      type: 'ruby',
      kanji: '今日',
      furigana: 'きょう',
    });
  });

  it('automatically adds furigana to known kanji words in dictionary when not explicitly annotated', () => {
    const input = 'こんにちは！最近の趣味は何ですか？';
    const tokens = tokenizeJapaneseText(input);

    const rubyTokens = tokens.filter((t) => t.type === 'ruby');
    expect(rubyTokens.length).toBeGreaterThanOrEqual(2);
    expect(rubyTokens.some((t) => t.kanji === '最近' && t.furigana === 'さいきん')).toBe(true);
    expect(rubyTokens.some((t) => t.kanji === '趣味' && t.furigana === 'しゅみ')).toBe(true);
  });

  it('extracts clean spoken Japanese for speech synthesis by stripping furigana brackets and ruby tags', () => {
    const bracketInput = 'こんにちは！最近[さいきん]の趣味[しゅみ]は何[なん]ですか？';
    expect(extractCleanJapaneseText(bracketInput)).toBe('こんにちは！最近の趣味は何ですか？');

    const rubyInput = 'こんにちは！<ruby>最近<rt>さいきん</rt></ruby>の<ruby>趣味<rt>しゅみ</rt></ruby>は何ですか？';
    expect(extractCleanJapaneseText(rubyInput)).toBe('こんにちは！最近の趣味は何ですか？');

    const roleplayInput1 = '映画[えいが]を友達[ともだち]と見[み]ました';
    expect(extractCleanJapaneseText(roleplayInput1)).toBe('映画を友達と見ました');

    const roleplayInput2 = '友達[ともだち]と映画[えいが]';
    expect(extractCleanJapaneseText(roleplayInput2)).toBe('友達と映画');

    const fullwidthInput = '映画［えいが］を友達（ともだち）と見【み】ました';
    expect(extractCleanJapaneseText(fullwidthInput)).toBe('映画を友達と見ました');
  });

  it('converts furigana-annotated text to accurate romaji', () => {
    const input = '最近[さいきん]';
    const romaji = toRomajiText(input);
    expect(romaji).toContain('saikin');
  });

  it('isolates furigana strictly to kanji characters for okurigana words like 行きます and 食べます', () => {
    const input = '食べます 行きます 見ました';
    const tokens = tokenizeJapaneseText(input);

    const rubyTokens = tokens.filter((t) => t.type === 'ruby');
    expect(rubyTokens.some((t) => t.kanji === '食' && t.furigana === 'た')).toBe(true);
    expect(rubyTokens.some((t) => t.kanji === '行' && t.furigana === 'い')).toBe(true);
    expect(rubyTokens.some((t) => t.kanji === '見' && t.furigana === 'み')).toBe(true);

    // Ensure kanji is NOT the entire string with okurigana
    expect(rubyTokens.some((t) => t.kanji === '食べます')).toBe(false);
    expect(rubyTokens.some((t) => t.kanji === '行きます')).toBe(false);
    expect(rubyTokens.some((t) => t.kanji === '見ました')).toBe(false);
  });

  it('extracts known glosses from dictionary-matched and ruby-annotated words', () => {
    const input = '最近[さいきん]の趣味[しゅみ]';
    const glosses = getKnownRomajiGlosses(input);
    expect(glosses.length).toBeGreaterThanOrEqual(1);
    expect(glosses.some((g) => g.term === '最近' || g.term === '趣味')).toBe(true);
  });
});
