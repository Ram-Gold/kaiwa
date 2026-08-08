import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fetchJlptWordDefinition } from './jlptVocabApi.js';

describe('jlptVocabApi service', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns null if term is empty or whitespace', async () => {
    const res1 = await fetchJlptWordDefinition('');
    const res2 = await fetchJlptWordDefinition('   ');
    const res3 = await fetchJlptWordDefinition(null);

    expect(res1).toBeNull();
    expect(res2).toBeNull();
    expect(res3).toBeNull();
  });

  it('fetches and formats word definition from JLPT Vocab API response', async () => {
    const mockApiResponse = {
      total: 1,
      offset: 0,
      limit: 10,
      words: [
        {
          word: '夜更かし',
          meaning: 'staying up late; keeping late hours; sitting up late at night; nighthawk',
          furigana: 'よふかし',
          romaji: 'yofukashi',
          level: 1
        }
      ]
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockApiResponse
    });

    const result = await fetchJlptWordDefinition('夜更かし');

    expect(result).not.toBeNull();
    expect(result.term).toBe('夜更かし');
    expect(result.reading).toBe('よふかし');
    expect(result.romaji).toBe('yofukashi');
    expect(result.jlpt).toBe('N1');
    expect(result.meanings).toEqual([
      'staying up late',
      'keeping late hours',
      'sitting up late at night',
      'nighthawk'
    ]);
    expect(result.meaning).toBe('staying up late; keeping late hours; sitting up late at night; nighthawk');
  });

  it('handles empty API words array by returning null', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ total: 0, words: [] })
    });

    const result = await fetchJlptWordDefinition('unknownword123');

    expect(result).toBeNull();
  });

  it('handles network failure gracefully without crashing', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

    const result = await fetchJlptWordDefinition('ねこ');

    expect(result).toBeNull();
  });
});
