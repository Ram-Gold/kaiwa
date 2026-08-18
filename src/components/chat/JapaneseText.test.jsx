/** @vitest-environment jsdom */
import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, it, expect, vi } from 'vitest';
import * as matchers from '@testing-library/jest-dom/matchers';
import JapaneseText from './JapaneseText.jsx';

expect.extend(matchers);
vi.stubGlobal('React', React);

afterEach(() => {
  cleanup();
});

describe('JapaneseText Component with Furigana Ruby Support', () => {
  it('renders ruby and rt elements for furigana-annotated words', () => {
    const { container } = render(
      <JapaneseText text="こんにちは！最近[さいきん]の趣味[しゅみ]は何[なん]ですか？" />
    );

    const rubies = container.querySelectorAll('ruby.kaiwa-ruby');
    expect(rubies.length).toBe(3);

    const rts = container.querySelectorAll('rt.kaiwa-rt');
    expect(rts.length).toBe(3);

    expect(container).toHaveTextContent('さいきん');
    expect(container).toHaveTextContent('しゅみ');
    expect(container).toHaveTextContent('なん');
    expect(container).toHaveTextContent('最近');
    expect(container).toHaveTextContent('趣味');
  });

  it('renders automatic ruby for kanji words from dictionary when unannotated', () => {
    const { container } = render(
      <JapaneseText text="最近の趣味" />
    );

    const rubies = container.querySelectorAll('ruby.kaiwa-ruby');
    expect(rubies.length).toBeGreaterThanOrEqual(1);
    expect(container).toHaveTextContent('さいきん');
    expect(container).toHaveTextContent('しゅみ');
  });

  it('renders tokenized romaji above all Japanese text in Romanized mode', () => {
    const { container } = render(
      <JapaneseText text="最近[さいきん]の趣味" readingMode="romaji" />
    );

    const rts = container.querySelectorAll('rt.kaiwa-rt');
    expect(rts.length).toBeGreaterThan(0);
    expect(container).toHaveTextContent('saikin');
  });

  it('renders clean Japanese text without any ruby or rt elements when readingMode is off', () => {
    const { container } = render(
      <JapaneseText text="最近[さいきん]の趣味[しゅみ]は何[なん]ですか？" readingMode="off" />
    );

    const rubies = container.querySelectorAll('ruby.kaiwa-ruby');
    const rts = container.querySelectorAll('rt.kaiwa-rt');
    expect(rubies.length).toBe(0);
    expect(rts.length).toBe(0);
    expect(container).toHaveTextContent('最近の趣味は何ですか？');
    expect(container).not.toHaveTextContent('さいきん');
  });
});
