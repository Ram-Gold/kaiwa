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
  });

  it('converts furigana-annotated text to accurate romaji', () => {
    const input = '最近[さいきん]';
    const romaji = toRomajiText(input);
    expect(romaji).toContain('saikin');
  });

  it('extracts known glosses from dictionary-matched and ruby-annotated words', () => {
    const input = '最近[さいきん]の趣味[しゅみ]';
    const glosses = getKnownRomajiGlosses(input);
    expect(glosses.length).toBeGreaterThanOrEqual(1);
    expect(glosses.some((g) => g.term === '最近' || g.term === '趣味')).toBe(true);
  });
});
