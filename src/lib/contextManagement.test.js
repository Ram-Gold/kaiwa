import { describe, it, expect } from 'vitest';
import { estimateTokens, splitConversationHistory } from './contextManagement.js';

describe('contextManagement', () => {
  describe('estimateTokens', () => {
    it('estimates empty string as 0', () => {
      expect(estimateTokens('')).toBe(0);
      expect(estimateTokens(null)).toBe(0);
    });

    it('estimates english text correctly', () => {
      // rough heuristic: 1 token per 4 chars for english
      const text = 'Hello world, this is a test.';
      expect(estimateTokens(text)).toBe(Math.ceil(text.length / 4));
    });

    it('estimates japanese text correctly', () => {
      // rough heuristic: 1 token per 1 char for japanese
      const text = 'こんにちは世界';
      expect(estimateTokens(text)).toBe(text.length); // Assuming we identify Japanese by character range, or just use a blended heuristic
    });
  });

  describe('splitConversationHistory', () => {
    const createMessage = (content, role = 'user') => ({ role, content });

    it('returns all messages as recent if under budget', () => {
      const history = [
        createMessage('hello'),
        createMessage('hi there', 'assistant')
      ];
      const result = splitConversationHistory(history, 100);
      
      expect(result.recent.length).toBe(2);
      expect(result.olderToSummarize.length).toBe(0);
    });

    it('splits messages when budget is exceeded', () => {
      // Let's assume budget is 10 tokens.
      // Message 1: 20 chars English -> 5 tokens
      // Message 2: 20 chars English -> 5 tokens
      // Message 3: 20 chars English -> 5 tokens
      const history = [
        createMessage('12345678901234567890'), // msg1 (older)
        createMessage('12345678901234567890', 'assistant'), // msg2 (older)
        createMessage('12345678901234567890'), // msg3 (recent)
      ];
      
      const result = splitConversationHistory(history, 10);
      
      // We expect the most recent messages that fit into 10 tokens to be in 'recent'
      // msg3 = 5 tokens. fits.
      // msg2 = 5 tokens. fits.
      // msg1 = 5 tokens. exceeds 10 total. goes to older.
      expect(result.recent.length).toBe(2);
      expect(result.recent[0].content).toBe('12345678901234567890'); // msg2
      expect(result.recent[1].content).toBe('12345678901234567890'); // msg3
      
      expect(result.olderToSummarize.length).toBe(1);
      expect(result.olderToSummarize[0].content).toBe('12345678901234567890'); // msg1
    });

    it('always keeps at least the last message in recent, even if it exceeds budget', () => {
      const history = [
        createMessage('short'),
        createMessage('this is a very long message that exceeds the budget by itself')
      ];
      
      const result = splitConversationHistory(history, 2);
      
      expect(result.recent.length).toBe(1);
      expect(result.olderToSummarize.length).toBe(1);
    });
  });
});
