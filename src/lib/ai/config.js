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
 * Assembles a unified system prompt ensuring strict Japanese pedagogical rules,
 * level constraints, learner bio context, and the JSON suggestions contract.
 */
export function assembleSystemPrompt(persona, userContext = {}) {
  const basePrompt = typeof persona === 'string' ? persona : (persona?.systemPrompt || 'You are a helpful Japanese tutor.');
  const personaName = persona?.name || 'Kaiwa Tutor';

  const userPersonaText = userContext.userPersona?.trim()
    ? `\nLearner Persona Context: ${userContext.userPersona.trim()}\n`
    : '';

  const memoryContextText = userContext.memorySummary?.trim()
    ? `\nConversation Memory Summary: ${userContext.memorySummary.trim()}\n`
    : '';

  return `${basePrompt}

=== STRICT JAPANESE LANGUAGE RULE ===
1. You are ${personaName}. Respond in natural Japanese appropriate to your character and scenario.
2. Keep your conversational response concise, engaging, and suitable for the learner.
${userPersonaText}${memoryContextText}
=== SUGGESTIONS CONTRACT ===
At the very end of your response, after your natural dialogue, output exactly 5 reply options for the learner in the following JSON format:
SUGGESTIONS: [
  {"text": "Natural response in Japanese", "romaji": "romaji here", "english": "English translation here", "isCorrect": true, "explanation": "Why this is natural"},
  {"text": "Plausible alternative or distractor", "romaji": "romaji here", "english": "English translation here", "isCorrect": false, "explanation": "Why this is less natural or incorrect"},
  {"text": "Plausible distractor", "romaji": "romaji here", "english": "English translation here", "isCorrect": false, "explanation": "Explanation"},
  {"text": "Plausible distractor", "romaji": "romaji here", "english": "English translation here", "isCorrect": false, "explanation": "Explanation"},
  {"text": "Plausible distractor", "romaji": "romaji here", "english": "English translation here", "isCorrect": false, "explanation": "Explanation"}
]
Do not include markdown code ticks around SUGGESTIONS: [...]. Output valid JSON directly after SUGGESTIONS:.`;
}
