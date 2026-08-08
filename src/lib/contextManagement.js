/**
 * Estimates the number of tokens in a given text string.
 * Uses a heuristic based on character counts and character blocks:
 * - English/Latin: ~1 token per 4 chars
 * - CJK (Japanese/Chinese/Korean): ~1 token per 1 char
 */
export function estimateTokens(text) {
  if (!text || typeof text !== 'string') return 0;
  
  let tokens = 0;
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);
    // Simple check for CJK ranges (Hiragana, Katakana, Kanji)
    if (
      (code >= 0x3040 && code <= 0x309f) || // Hiragana
      (code >= 0x30a0 && code <= 0x30ff) || // Katakana
      (code >= 0x4e00 && code <= 0x9faf)    // Kanji (CJK Unified Ideographs)
    ) {
      tokens += 1;
    } else {
      tokens += 0.25; // 4 chars per token for Latin
    }
  }
  return Math.ceil(tokens);
}

/**
 * Splits conversation history into 'recent' and 'olderToSummarize' 
 * based on a token budget.
 * 
 * It iterates from the most recent message backwards, adding to 'recent'
 * until the token budget is reached. The rest go to 'olderToSummarize'.
 * It always keeps at least the very last message in 'recent'.
 */
export function splitConversationHistory(history, tokenBudget) {
  if (!history || history.length === 0) {
    return { recent: [], olderToSummarize: [] };
  }

  const recent = [];
  const olderToSummarize = [];
  let currentTokens = 0;

  // Traverse backwards
  for (let i = history.length - 1; i >= 0; i--) {
    const msg = history[i];
    const msgTokens = estimateTokens(msg.content);

    // Always keep the very last message, even if it alone exceeds the budget
    if (i === history.length - 1) {
      recent.unshift(msg);
      currentTokens += msgTokens;
    } else {
      if (currentTokens + msgTokens <= tokenBudget) {
        recent.unshift(msg);
        currentTokens += msgTokens;
      } else {
        olderToSummarize.unshift(msg);
      }
    }
  }

  return { recent, olderToSummarize };
}
