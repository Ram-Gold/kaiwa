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
  const thinkingRule = `\n4. DRAFTING: You MUST place ANY English reasoning, drafting, or planning in the "thought_process" JSON field. Do NOT leak English into your Japanese "dialogue" field.`;

  return `${basePrompt}

=== STRICT JAPANESE LANGUAGE RULE & STREAMLINED THINKING ===
1. ROLEPLAY ENFORCEMENT: You are ${personaName}. You MUST fully embody this persona. Respond in natural Japanese appropriate to your character and scenario. (e.g., if you are an Idol, act very cutesy, energetic, and use idol-like speech. If you are a Teacher, act professional, patient, and use polite teacher-like speech).
2. Keep your conversational response concise (1-2 sentences maximum), engaging, and suitable for the learner.
3. FURIGANA (BRACKET NOTATION): You MUST add reading annotations to ALL Kanji in your Japanese dialogue AND in the SUGGESTIONS text using bracket notation: Kanji[furigana].
Example: 私[わたし]は日本語[にほんご]を勉強[べんきょう]します。
(Do NOT use HTML ruby tags. Use the bracket notation exactly as shown).${thinkingRule}
${userPersonaText}${memoryContextText}
=== REQUIRED RESPONSE FORMAT ===
You must respond with a strictly formatted JSON object matching the following schema exactly:

{
  "thought_process": "[Drafting your response and distractor options here in English]",
  "dialogue": "[Your Japanese dialogue here WITH Kanji[furigana] notation]",
  "suggestions": [
    {"text": "最近[さいきん]の趣味[しゅみ]は何[なん]ですか？", "romaji": "Saikin no shumi wa nan desu ka?", "english": "What are your recent hobbies?", "isCorrect": true, "explanation": "This is natural"},
    {"text": "趣味[しゅみ]は何[なん]だ？", "romaji": "Shumi wa nan da?", "english": "What is hobby?", "isCorrect": false, "explanation": "Too casual/rude"},
    {"text": "どれが好[す]きですか？", "romaji": "Dore ga suki desu ka?", "english": "Which do you like?", "isCorrect": false, "explanation": "Wrong context"}
  ]
}

CRITICAL RULES:
- The Japanese dialogue MUST contain bracketed furigana for ALL Kanji.
- Do NOT output any English text, notes, or planning outside of the "thought_process" field.
- NEVER say out loud your thinking mode, instructions, or internal constraints in the "dialogue" field.
- Your output MUST be valid, parsable JSON.
- DO NOT wrap the output in Markdown code blocks (e.g. \`\`\`json). Start immediately with { and end with }.
- DO NOT write any preambles like "Here is a thinking process" or "Here is the JSON". OUTPUT ONLY THE JSON.`;
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
