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
  const basePrompt = typeof persona === 'string' ? persona : (persona?.systemPrompt || 'You are a helpful Japanese tutor.');
  const personaName = persona?.name || 'Kaiwa Tutor';

  const userPersonaText = userContext.userPersona?.trim()
    ? `\nLearner Context: ${userContext.userPersona.trim()}\n`
    : '';

  const memoryContextText = userContext.memorySummary?.trim()
    ? `\nConversation Memory: ${userContext.memorySummary.trim()}\n`
    : '';

  let briefingGoalText = '';
  if (userContext.briefing) {
    const b = userContext.briefing;
    const headsUpList = (b.headsUp || []).map((h) => `- ${h}`).join('\n');
    const prepList = (b.prep || []).join(', ');
    briefingGoalText = `
=== ROLEPLAY SCENARIO & OBJECTIVES ===
Scenario: ${b.title || ''} (${b.jpTitle || ''}) - Level ${b.level || 'N5'}
Summary & Goal: ${b.summary || ''}
Key Tasks & Coaching Tips for Learner:
${headsUpList || '- Practice polite conversation in character.'}
Target Practice Phrases: ${prepList || 'General N5 vocabulary'}
`;
  }

  let turnProgressionText = '';
  const currentTurn = Number(userContext.turn) || 1;
  const maxTurns = Number(userContext.maxTurns) || 10;
  const remaining = Math.max(0, maxTurns - currentTurn);

  if (currentTurn >= maxTurns) {
    turnProgressionText = `
=== TURN PROGRESSION: FINAL TURN (${currentTurn}/${maxTurns}) ===
This is the FINAL turn (Turn ${maxTurns}). The learner is saying their closing words/farewell.
1. Deliver your warm in-character final farewell and goodbye to the learner (e.g. またね！, お疲れさまでした！, 応援しています！).
2. Praise their effort warmly.
3. Do NOT ask any new questions or introduce new topics since the session ends after your reply.
`;
  } else if (currentTurn >= maxTurns - 1) {
    turnProgressionText = `
=== TURN PROGRESSION: PENULTIMATE TURN (${currentTurn}/${maxTurns} - 1 turn remaining) ===
The conversation will conclude in the next turn.
1. Acknowledge what the learner said and naturally guide the scenario toward its conclusion.
2. Prompt the learner for their final parting words or closing phrase.
`;
  } else {
    turnProgressionText = `
=== TURN PROGRESSION: TURN ${currentTurn}/${maxTurns} (${remaining} turns remaining) ===
1. Guide the learner to achieve the scenario goals and use target phrases within the remaining turns.
2. Keep the conversation moving forward purposefully toward the scenario objectives.
`;
  }

  return `${basePrompt}

=== CONVERSATION RULES ===
1. You are ${personaName}. Chat naturally, warmly, and in character with the user.
2. STRICT JAPANESE LANGUAGE RULE: The DIALOGUE section MUST be STRICTLY in JAPANESE at all times. NEVER reply in English in the DIALOGUE section!
3. Reply directly to whatever the user says or asks. Keep your response conversational, supportive, and concise (1-2 sentences).
4. Add furigana bracket notation ONLY to Kanji so the learner can read along: 漢字[かんじ]. Do NOT add furigana to Hiragana or Katakana.
   (Correct: 私[わたし]は歌[うた]が大好[だいす]きだよ！✨)
   (Incorrect: こんにちは[こんにちは])
${userPersonaText}${memoryContextText}${briefingGoalText}${turnProgressionText}
5. DO NOT output any internal thoughts, planning, or English translations. Output ONLY the dialogue and suggestions.

=== FORMAT ===
You MUST structure your response EXACTLY like this using XML tags. Do not deviate. DO NOT include thoughts!

<dialogue>
[Your natural in-character Japanese reply with Kanji furigana brackets here. STRICTLY NO ENGLISH! NO THOUGHTS!]
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
  {"text": "こんにちは", "romaji": "Konnichiwa", "english": "Hello", "isCorrect": false, "explanation": "A bit repetitive"}
]
</suggestions>`;
}
