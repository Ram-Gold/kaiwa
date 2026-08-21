/**
 * Centralized AI Model Configuration, Token Budgeting, and Prompt Engineering
 * for KAIwa's Conversational Experience.
 */

export const STREAMING_STORAGE_KEY = 'kaiwa.ai.streaming_enabled';

export const DEFAULT_MODELS = {
  anthropic: 'claude-3-5-haiku-20241022',
  openai: 'gpt-4o-mini',
  gemini: 'gemini-2.0-flash',
  openrouter: 'google/gemini-2.0-flash-lite-preview-02-05:free',
  ollama: 'qwen2.5:7b',
  lmstudio: 'local-model',
  deepseek: 'deepseek-chat',
  groq: 'llama-3.3-70b-versatile',
  mistral: 'mistral-small-latest',
  perplexity: 'sonar',
};

export const PROVIDER_TEMPERATURES = {
  anthropic: 0.8,
  openai: 0.7,
  gemini: 0.7,
  openrouter: 0.7,
  ollama: 0.7,
  lmstudio: 0.7,
  deepseek: 0.6,
  groq: 0.7,
};

export function getAIModelConfig(provider = 'anthropic', customModel = '') {
  const normProvider = (provider || 'anthropic').toLowerCase();
  return {
    provider: normProvider,
    model: customModel?.trim() || DEFAULT_MODELS[normProvider] || 'claude-3-5-haiku-20241022',
    temperature: PROVIDER_TEMPERATURES[normProvider] ?? 0.7,
    maxTokens: 500,
  };
}

let inMemoryStreamingFallback = false;

/**
 * Checks if token-by-token streaming is enabled in settings.
 * Defaults to false (OFF) as per product spec.
 */
export function isStreamingEnabled() {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const val = window.localStorage.getItem(STREAMING_STORAGE_KEY);
      return val === 'true';
    } catch {
      return inMemoryStreamingFallback;
    }
  }
  return inMemoryStreamingFallback;
}

/**
 * Saves streaming preference.
 */
export function setStreamingEnabled(enabled) {
  inMemoryStreamingFallback = Boolean(enabled);
  if (typeof window !== 'undefined') {
    try {
      window.localStorage?.setItem(STREAMING_STORAGE_KEY, enabled ? 'true' : 'false');
      window.dispatchEvent?.(
        new CustomEvent('kaiwa:conversation-option-change', {
          detail: { option: 'streamingEnabled', value: Boolean(enabled) },
        })
      );
      window.dispatchEvent?.(
        new CustomEvent('kaiwa:streaming-toggle', {
          detail: { enabled: Boolean(enabled) },
        })
      );
    } catch {
      // Ignore storage errors
    }
  }
}

/**
 * AI ENGINEERING SPECIFICATION: `assembleSystemPrompt`
 * ============================================================================
 * Assembles a structured, context-rich system prompt for local & external LLMs.
 * 
 * CORE PEDAGOGICAL & LIFECYCLE CAPABILITIES:
 * 1. Persona Voice & Tone: Preserves unique character constraints.
 * 2. Briefing Objectives: Injects scenario goals, tips, and target practice vocabulary.
 * 3. 10-Turn Roleplay Lifecycle:
 *    - Turns 1-7: Guides the learner toward achieving the briefing goals.
 *    - Turns 8-9: Alerts AI to begin wrapping up the roleplay scenario.
 *    - Turn 10 (Final Turn): Prompts AI to deliver the final concluding goodbye/farewell.
 * 4. Furigana Notation: Requires bracket notation (漢字[かんじ]) for client-side rendering.
 * 5. Structured Distractor Contract: Generates 5 suggested reply options with explanations.
 * ============================================================================
 */
export function assembleSystemPrompt(persona, userContext = {}) {
  return `You are a Japanese conversation partner.
Your task is to respond to the user's Japanese input and generate 5 plausible follow-up response cards for the user to choose from.

=== CONVERSATION RULES ===
1. STRICT JAPANESE LANGUAGE RULE: The DIALOGUE section MUST be STRICTLY in JAPANESE at all times. NEVER reply in English in the DIALOGUE section!
2. Reply directly to whatever the user says or asks. Keep your response conversational, supportive, and concise (1-2 sentences).
3. Add furigana bracket notation ONLY to Kanji so the learner can read along: 漢字[かんじ]. Do NOT add furigana to Hiragana or Katakana.
   (Correct: 私[わたし]は歌[うた]が大好[だいす]きだよ！✨)
   (Incorrect: こんにちは[こんにちは])
4. DO NOT output any internal thoughts, planning, or English translations. Output ONLY the dialogue and suggestions.

=== FORMAT ===
You MUST structure your response EXACTLY like this using XML tags. Do not deviate. DO NOT include thoughts!

<dialogue>
[Your natural Japanese reply with Kanji furigana brackets here. STRICTLY NO ENGLISH! NO THOUGHTS!]
</dialogue>

<suggestions>
[{"text": "short Japanese user reply", "romaji": "romaji here", "english": "English translation", "isCorrect": true, "explanation": "English explanation of nuance"}, {"text": "unnatural Japanese reply", "romaji": "romaji here", "english": "English translation", "isCorrect": false, "explanation": "wrong particle"}, ...]
</suggestions>

=== EXAMPLE ===
User: こんにちは！
Assistant:
<dialogue>
こんにちは！元気[げんき]ですか？
</dialogue>
<suggestions>
[
  {"text": "はい、元気です", "romaji": "Hai, genki desu", "english": "Yes, I am well", "isCorrect": true, "explanation": "Standard natural reply"},
  {"text": "こんにちは", "romaji": "Konnichiwa", "english": "Hello", "isCorrect": false, "explanation": "A bit repetitive"},
  {"text": "さようなら", "romaji": "Sayounara", "english": "Goodbye", "isCorrect": false, "explanation": "Inappropriate for a greeting"},
  {"text": "りんご", "romaji": "Ringo", "english": "Apple", "isCorrect": false, "explanation": "Irrelevant random noun"},
  {"text": "おやすみなさい", "romaji": "Oyasuminasai", "english": "Good night", "isCorrect": false, "explanation": "Wrong time of day for this greeting"}
]
</suggestions>`;
}
