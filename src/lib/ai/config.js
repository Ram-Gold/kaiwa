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

=== STRICT JAPANESE LANGUAGE RULE & STREAMLINED THINKING ===
1. You are ${personaName}. Respond in natural Japanese appropriate to your character and scenario.
2. Keep your conversational response concise (1-2 sentences maximum), engaging, and suitable for the learner.
3. STREAMLINED THINKING: If you include internal reasoning/thinking, wrap it in <think>...</think> and keep it strictly under 30 words. Do NOT deliberate, draft, or over-plan suggestions in thinking.
4. MANDATORY DIALOGUE: You MUST ALWAYS output your Japanese spoken dialogue immediately after thinking, followed by the SUGGESTIONS block.
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

/**
 * Separates internal model thinking/reasoning (<think>...</think>, [Thought: ...],
 * or natural language "Here's a thinking process: ...") from the actual spoken dialogue output.
 */
export function parseThinkingAndSpeech(rawContent) {
  const content = String(rawContent || '').trim();
  if (!content) {
    return { thinking: '', speech: '', isThinkingStream: false };
  }

  // 1. Check for XML-style thinking tags: <think>, <thought>, <reasoning>, <co_thought>
  const thinkTagRegex = /<(?:think|thought|reasoning|co_thought)>([\s\S]*?)(?:<\/(?:think|thought|reasoning|co_thought)>|$)/i;
  const thinkMatch = content.match(thinkTagRegex);

  if (thinkMatch) {
    const thinkingText = thinkMatch[1].trim();
    const hasClosedTag = /<\/(?:think|thought|reasoning|co_thought)>/i.test(content);
    const speechText = hasClosedTag
      ? content.replace(/<(?:think|thought|reasoning|co_thought)>[\s\S]*?<\/(?:think|thought|reasoning|co_thought)>/gi, '').trim()
      : '';

    return {
      thinking: thinkingText,
      speech: speechText,
      isThinkingStream: !hasClosedTag,
    };
  }

  // 2. Check for bracketed thoughts: [Thought: ...], [Thinking: ...], (Thought: ...), etc.
  const bracketThoughtRegex = /^[\[\(](?:Thought|Thinking|Reasoning):\s*([\s\S]*?)[\]\)]\s*([\s\S]*)$/i;
  const bracketMatch = content.match(bracketThoughtRegex);
  if (bracketMatch) {
    return {
      thinking: bracketMatch[1].trim(),
      speech: bracketMatch[2].trim(),
      isThinkingStream: false,
    };
  }

  // 3. Check for natural language thinking preambles:
  // e.g. "Here's a thinking process:", "Thinking process:", "**Thinking Process:**", "### Thought Process:"
  const naturalThinkingPrefixRegex = /^(?:(?:\*{1,3}|#{1,4}\s*)?(?:Here(?:'s| is)(?: a| the)? )?(?:thinking|thought|reasoning)(?: process)?(?:\*{1,3}|:|\s*-+)*[:\n\r]+)([\s\S]*)$/i;
  const naturalMatch = content.match(naturalThinkingPrefixRegex);
  if (naturalMatch) {
    const body = naturalMatch[1].trim();

    // Look for explicit response headers like "**Response:**", "**Response**:", "Response:", "Japanese Response:", "Output:", "Dialog:", "Dialogue:", "**Reply:**"
    const responseHeaderRegex = /(?:^|\n+)(?:(?:\*{1,3}|#{1,4}\s*)?(?:Response|Japanese Response|Output|Reply|Dialogue|Dialog|Japanese|Final Response|Actual Response|Character Response)(?::)?(?:\*{1,3})?:?)\s*([\s\S]*)$/i;
    const responseMatch = body.match(responseHeaderRegex);

    if (responseMatch) {
      const thinkingPart = body.slice(0, responseMatch.index).trim();
      const speechPart = responseMatch[1].trim().replace(/^[\*\#_]+\s*/, '');
      return {
        thinking: thinkingPart,
        speech: speechPart,
        isThinkingStream: false,
      };
    }

    // If no explicit response header, see if there is Japanese dialogue at the end
    const paragraphs = body.split(/\n\s*\n/);
    if (paragraphs.length > 1) {
      let splitIdx = -1;
      for (let i = paragraphs.length - 1; i >= 1; i--) {
        const p = paragraphs[i].trim();
        const kanaCount = (p.match(/[\u3040-\u309f\u30a0-\u30ff]/g) || []).length;
        const isEnglishReasoning = p.toLowerCase().includes('analyze') || p.toLowerCase().includes('determine') || p.toLowerCase().includes('formulate') || p.toLowerCase().includes('character');
        if (kanaCount >= 2 && !isEnglishReasoning) {
          splitIdx = i;
        } else if (splitIdx !== -1) {
          break;
        }
      }

      if (splitIdx !== -1) {
        const thinkingPart = paragraphs.slice(0, splitIdx).join('\n\n').trim();
        const speechPart = paragraphs.slice(splitIdx).join('\n\n').trim();
        return {
          thinking: thinkingPart,
          speech: speechPart,
          isThinkingStream: false,
        };
      }
    }

    // Check if Japanese dialogue starts after a newline
    const lastJapaneseMatch = body.search(/[\n\r]+(?=[「『]?[一-龯ぁ-んァ-ヶ]{2,})/);
    if (lastJapaneseMatch !== -1) {
      const thinkingPart = body.slice(0, lastJapaneseMatch).trim();
      const speechPart = body.slice(lastJapaneseMatch).trim();
      return {
        thinking: thinkingPart,
        speech: speechPart,
        isThinkingStream: false,
      };
    }

    // If the entire content is the thinking process so far
    return {
      thinking: body,
      speech: '',
      isThinkingStream: true,
    };
  }

  // 4. Check if text starts with numbered analysis points without explicit title
  if (/^(?:1\.\s*\*\*(?:Analyze|Understand|Identify|Role|Scenario|Determine)|---\s*Response|---|\*\*(?:Thinking|Checklist|Draft))/i.test(content)) {
    const responseHeaderRegex = /(?:^|\n+)(?:(?:\*{1,3}|#{1,4}\s*)?(?:Response|Japanese Response|Output|Reply|Dialogue|Dialog|Japanese|Final Response|Actual Response|Character Response)(?::)?(?:\*{1,3})?:?)\s*([\s\S]*)$/i;
    const responseMatch = content.match(responseHeaderRegex);
    if (responseMatch) {
      return sanitizeThinkingAndSpeech(
        content.slice(0, responseMatch.index).trim(),
        responseMatch[1].trim().replace(/^[\*\#_]+\s*/, ''),
        false
      );
    }

    const lastJapaneseMatch = content.search(/[\n\r]+(?=[「『]?[一-龯ぁ-んァ-ヶ]{2,})/);
    if (lastJapaneseMatch !== -1) {
      return sanitizeThinkingAndSpeech(
        content.slice(0, lastJapaneseMatch).trim(),
        content.slice(lastJapaneseMatch).trim(),
        false
      );
    }
  }

  return sanitizeThinkingAndSpeech('', content, false);
}

/**
 * Sanitizes thinking and speech to ensure English drafting preambles or trailing notes
 * do not leak into the Japanese spoken dialogue.
 */
function sanitizeThinkingAndSpeech(thinking, speech, isThinkingStream) {
  let thinkingText = String(thinking || '').trim();
  let speechText = String(speech || '').trim();

  // If speechText contains heavy English preamble or drafting before Japanese dialogue
  if (speechText && /^[a-zA-Z0-9\s\*\#\-_:\(\)\.\,\'\"\>\<\/\?\!]{10,}/.test(speechText)) {
    // Check if there is a quoted Japanese phrase like "こんにちは..." or 「こんにちは...」
    const quotedJpMatch = speechText.match(/["「]([\u3040-\u309f\u30a0-\u30ff\u4e00-\u9fff\s、。！？!?,.~〜✨!?]+)["」]/);
    if (quotedJpMatch && (quotedJpMatch[1].match(/[\u3040-\u309f\u30a0-\u30ff]/g) || []).length >= 3) {
      const extraThinking = speechText.replace(quotedJpMatch[0], '').trim();
      thinkingText = thinkingText ? `${thinkingText}\n\n${extraThinking}` : extraThinking;
      speechText = quotedJpMatch[1].trim();
    } else {
      const jpStartIdx = speechText.search(/[\u3040-\u309f\u30a0-\u30ff]{2,}/);
      if (jpStartIdx !== -1) {
        const extraThinking = speechText.slice(0, jpStartIdx).trim();
        const rawJp = speechText.slice(jpStartIdx).trim();
        const trailingEnglishIdx = rawJp.search(/[\n\r]+(?=[A-Z][a-z]+|\-\s*[A-Z])/);
        if (trailingEnglishIdx !== -1) {
          const trailingEnglish = rawJp.slice(trailingEnglishIdx).trim();
          thinkingText = thinkingText ? `${thinkingText}\n\n${extraThinking}\n\n${trailingEnglish}` : `${extraThinking}\n\n${trailingEnglish}`;
          speechText = rawJp.slice(0, trailingEnglishIdx).trim().replace(/^["「]|["」]$/g, '');
        } else {
          thinkingText = thinkingText ? `${thinkingText}\n\n${extraThinking}` : extraThinking;
          speechText = rawJp.replace(/^["「]|["」]$/g, '');
        }
      }
    }
  }

  return {
    thinking: thinkingText,
    speech: speechText,
    isThinkingStream: Boolean(isThinkingStream),
  };
}
