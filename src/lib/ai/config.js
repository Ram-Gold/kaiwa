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
    ? `\nLearner Context: ${userContext.userPersona.trim()}\n`
    : '';

  const memoryContextText = userContext.memorySummary?.trim()
    ? `\nConversation Memory: ${userContext.memorySummary.trim()}\n`
    : '';

  return `${basePrompt}

=== CONVERSATION RULES ===
1. You are ${personaName}. Chat naturally, warmly, and in character with the user.
2. Reply directly to whatever the user says or asks. Keep your response conversational, supportive, and concise (1-2 sentences).
3. Add furigana bracket notation to Kanji so the learner can read along: 漢字[かんじ]
   (e.g., 私[わたし]は歌[うた]が大好[だいす]きだよ！✨)
4. Do NOT output meta-commentary, planning notes, or internal thoughts. Just talk directly to the user in character.
${userPersonaText}${memoryContextText}
=== FORMAT ===
<Your natural in-character Japanese reply with 漢字[かんじ]>

SUGGESTIONS: [
  {"text": "返答[へんとう]の選択肢[せんたくし]1", "romaji": "Romaji here", "english": "English meaning", "isCorrect": true, "explanation": "Natural response"},
  {"text": "返答[へんとう]の選択肢[せんたくし]2", "romaji": "Romaji here", "english": "English meaning", "isCorrect": false, "explanation": "A bit too casual or unnatural"},
  {"text": "返答[へんとう]の選択肢[せんたくし]3", "romaji": "Romaji here", "english": "English meaning", "isCorrect": false, "explanation": "Wrong context"}
]`;
}

/**
 * Safely extracts thought_process and dialogue from an incomplete streaming JSON payload.
 */
export function parsePartialJsonStream(rawContent) {
  const content = String(rawContent || '').trim();
  if (!content) {
    return { thoughtProcess: '', dialogue: '', isThinkingStream: false };
  }

  // Attempt a full parse first in case it's a complete JSON object
  try {
    const parsed = JSON.parse(content);
    return {
      thoughtProcess: parsed.thought_process || '',
      dialogue: parsed.dialogue || '',
      isThinkingStream: false,
    };
  } catch (e) {
    // If it's partial, we use robust regex to extract the keys
  }

  // Use regex to lazily match the "thought_process" and "dialogue" values
  const thoughtMatch = content.match(/"thought_process"\s*:\s*"([\s\S]*?)"(?=\s*,\s*"dialogue"|$)/);
  const dialogueMatch = content.match(/"dialogue"\s*:\s*"([\s\S]*?)"(?=\s*,\s*"suggestions"|$)/);

  const decodeStr = (str) => {
    return str
      .replace(/\\n/g, '\n')
      .replace(/\\r/g, '\r')
      .replace(/\\t/g, '\t')
      .replace(/\\"/g, '"')
      .replace(/\\\\/g, '\\');
  };

  let thoughtProcess = '';
  if (thoughtMatch) {
    thoughtProcess = decodeStr(thoughtMatch[1]);
  } else {
    const partialThought = content.match(/"thought_process"\s*:\s*"([\s\S]*)$/);
    if (partialThought) {
      thoughtProcess = decodeStr(partialThought[1]);
    }
  }

  let dialogue = '';
  if (dialogueMatch) {
    dialogue = decodeStr(dialogueMatch[1]);
  } else {
    const partialDialogue = content.match(/"dialogue"\s*:\s*"([\s\S]*)$/);
    if (partialDialogue) {
      dialogue = decodeStr(partialDialogue[1]);
    }
  }

  // Extreme fallback: Model completely ignored JSON format and just output raw text with English reasoning
  if (!thoughtProcess && !dialogue && content) {
    const jpIdx = content.search(/[\u3040-\u309f\u30a0-\u30ff\u4e00-\u9fff]{2,}/);
    if (jpIdx !== -1 && jpIdx > 10) {
      // We found Japanese further down. The stuff before it is likely preamble/reasoning.
      thoughtProcess = content.slice(0, jpIdx).trim();
      dialogue = content.slice(jpIdx).trim();
    } else {
      // Either starts with Japanese immediately, or no Japanese at all.
      dialogue = content;
    }
  }

  const isThinkingStream = (content.includes('"thought_process"') && !content.includes('"dialogue"')) || (thoughtProcess && !dialogue);

  return {
    thoughtProcess,
    dialogue,
    isThinkingStream,
  };
}
