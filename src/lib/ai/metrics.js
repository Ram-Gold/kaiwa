/**
 * ============================================================================
 * AI METRICS UTILITIES
 * ============================================================================
 * 
 * Token estimation, cost calculation, and duration formatting for
 * displaying per-message metadata (tokens, time, cost) in chat bubbles.
 * ============================================================================
 */

/**
 * Estimate token count from text content.
 * Uses a simple heuristic: ~4 characters per English token, ~1.5 chars per CJK token.
 * This is a rough client-side estimate — not a precise tokenizer.
 * 
 * @param {string} text - The text to estimate tokens for.
 * @returns {number} Estimated token count.
 */
export function estimateTokenCount(text) {
  if (!text) return 0;

  let count = 0;
  for (const char of text) {
    const code = char.codePointAt(0);
    // CJK characters (Japanese, Chinese, Korean) — each is roughly 1 token
    if (
      (code >= 0x3000 && code <= 0x9FFF) ||  // CJK Unified + Katakana + Hiragana
      (code >= 0xF900 && code <= 0xFAFF) ||  // CJK Compatibility
      (code >= 0xFF00 && code <= 0xFFEF)     // Fullwidth forms
    ) {
      count += 1;
    } else {
      // Latin/ASCII — roughly 1 token per 4 characters
      count += 0.25;
    }
  }

  return Math.max(1, Math.round(count));
}

/**
 * Estimate cost in USD for a given provider and token count.
 * Uses approximate per-1K-token output pricing.
 * 
 * @param {string} provider - The AI provider name.
 * @param {number} tokens - Estimated output tokens.
 * @returns {number} Estimated cost in USD.
 */
export function estimateCost(provider, tokens) {
  if (!tokens || tokens <= 0) return 0;

  // Approximate output pricing per 1K tokens (USD)
  const OUTPUT_PRICING = {
    anthropic: 0.001,      // Claude 3.5 Haiku
    claude: 0.001,         // Claude 3.5 Haiku
    openai: 0.0006,        // GPT-4o-mini
    gemini: 0.0004,        // Gemini 1.5 Flash
    openrouter: 0.0,       // Free tier models (varies)
    ollama: 0.0,           // Local — free
    lmstudio: 0.0,         // Local — free
    deepseek: 0.00028,     // DeepSeek Chat
    groq: 0.0002,          // Groq Cloud
  };

  const pricePerK = OUTPUT_PRICING[provider?.toLowerCase()] ?? 0;
  return (tokens / 1000) * pricePerK;
}

/**
 * Format a duration in milliseconds to a human-readable string.
 * 
 * @param {number} ms - Duration in milliseconds.
 * @returns {string} Formatted duration string (e.g. "1.2s", "340ms").
 */
export function formatDuration(ms) {
  if (!ms || ms <= 0) return '0ms';
  if (ms < 1000) return `${Math.round(ms)}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}
