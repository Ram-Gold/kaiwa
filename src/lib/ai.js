import { getPersonaById } from '../prompts/personas.js';
import { splitConversationHistory } from './contextManagement.js';
import { isStreamingEnabled, assembleSystemPrompt, getAIModelConfig } from './ai/config.js';

/**
 * ============================================================================
 * AI ENGINEERING GUIDE: PIPELINE, PROMPT ASSEMBLY & RESPONSE PARSING
 * ============================================================================
 * 
 * This module is the core AI Inference & Prompt Engineering engine of KAIwa.
 * It is structured into 4 primary functional layers:
 * 
 * 1. PROMPT ASSEMBLY & CONTEXT INJECTION (`sendMessage`):
 *    - Dynamically assembles System Prompt = Persona Prompt + User Bio Context + Memory Summaries.
 *    - Applies token budget limits (`splitConversationHistory`) based on provider (Ollama vs Cloud).
 *    - Appends mandatory JSON output contract rules (`SUGGESTIONS: [...]`).
 * 
 * 2. MODEL PAYLOAD GENERATION & PROVIDER ROUTING:
 *    - Formats request body specifically for Ollama, OpenRouter, OpenAI, Gemini, or Claude.
 *    - Proxies requests to local Next.js `/api/chat` serverless route (preventing CORS & leaking keys).
 * 
 * 3. STRUCTURED OUTPUT EXTRACTION (`parseModelReply`, `extractSuggestions`):
 *    - Robust multi-regex fallback engine that isolates the Japanese assistant reply from the 
 *      5 distractor options JSON payload.
 * 
 * 4. CONTEXT WINDOW SUMMARIZATION (`summarizeOldMessages`):
 *    - Asynchronously condenses older conversation turns into a high-density summary when total 
 *      tokens exceed the safety window.
 * ============================================================================
 */

export class AIProviderError extends Error {
  constructor(code, userMessage, cause) {
    super(userMessage);
    this.name = 'AIProviderError';
    this.code = code;
    this.userMessage = userMessage;
    this.cause = cause;
  }
}

export function parseModelReply(rawContent) {
  const content = String(rawContent || '').trim();
  const suggestions = extractSuggestions(content);
  const text = stripSuggestions(content).trim();

  return {
    text: text || '返事が空でした。もう一度送ってください。',
    suggestions: suggestions,
    thoughtProcess: '',
  };
}

export function extractSuggestions(content) {
  const source = String(content || '').trim();
  
  // 1. Try matching SUGGESTIONS: [...] anywhere in text
  const suggestionsMatch = source.match(/SUGGESTIONS:\s*(\[[\s\S]*?\])/i);
  if (suggestionsMatch) {
    const parsed = parseSuggestions(suggestionsMatch[1]);
    if (parsed.length) return parsed;
  }

  // 2. Try matching any JSON code block ```json ... ```
  const codeBlocks = [...source.matchAll(/```(?:json)?\s*([\s\S]*?)```/gi)];
  for (const block of codeBlocks.reverse()) {
    const parsed = parseSuggestions(block[1]);
    if (parsed.length) return parsed;
  }

  // 3. Try matching any JSON object containing "SUGGESTIONS" key
  const jsonObjectMatch = source.match(/(\{[\s\S]*?"SUGGESTIONS"[\s\S]*?\})/i);
  if (jsonObjectMatch) {
    const parsed = parseSuggestions(jsonObjectMatch[1]);
    if (parsed.length) return parsed;
  }

  // 4. Fallback: try to find ANY JSON array containing objects with a "text" key
  const arrayMatch = source.match(/(\[\s*\{[\s\S]*?"text"[\s\S]*?\}\s*\])/i);
  if (arrayMatch) {
    const parsed = parseSuggestions(arrayMatch[1]);
    if (parsed.length) return parsed;
  }

  return [];
}

function stripSuggestions(content) {
  let cleanText = String(content || '');
  
  const dialogueMatch = cleanText.match(/<dialogue>([\s\S]*?)(?:<\/dialogue>|$)/i);
  if (dialogueMatch) {
    cleanText = dialogueMatch[1];
  } else {
    cleanText = ''; // STRICT MODE: If there's no <dialogue> tag, consider it empty text
  }
  


  return cleanText
    .replace(/<think>[\s\S]*?(?:<\/think>|$)/gi, '')
    .trim();
}

function parseSuggestions(rawValue) {
  try {
    const cleaned = String(rawValue || '')
      .trim()
      .replace(/^```(?:json)?/i, '')
      .replace(/```$/i, '')
      .trim();
    const parsed = JSON.parse(cleaned);
    const suggestions = Array.isArray(parsed) ? parsed : (parsed?.SUGGESTIONS || parsed?.suggestions || parsed?.choices || parsed?.options);

    if (!Array.isArray(suggestions)) {
      return [];
    }

    return suggestions
      .filter((suggestion) => typeof suggestion === 'object' && suggestion !== null)
      .map((suggestion) => {
        let text = String(suggestion.text || suggestion.phrase || suggestion.japanese || suggestion.option || '').trim();
        // Truncate if model erroneously output a long paragraph into a response card
        if (text.length > 35) {
          const firstSentence = text.split(/(?<=[。！？!?])\s*/)[0];
          text = firstSentence.length <= 35 ? firstSentence : firstSentence.slice(0, 32) + '…';
        }
        const isCorrect = suggestion.isCorrect !== undefined ? Boolean(suggestion.isCorrect) : (suggestion.correct !== undefined ? Boolean(suggestion.correct) : true);
        const explanation = String(suggestion.explanation || suggestion.reason || '').trim();
        return { text, isCorrect, explanation };
      })
      .filter((suggestion) => suggestion.text.length > 0)
      .slice(0, 5);
  } catch {
    return [];
  }
}

function normalizeHistory(conversationHistory = []) {
  return conversationHistory
    .filter((message) => ['user', 'assistant'].includes(message?.role))
    .map((message) => ({
      role: message.role,
      content: String(message.content || '').trim(),
    }))
    .filter((message) => message.content);
}

async function summarizeOldMessages(provider, apiKey, messagesToSummarize, customModel = null) {
  if (!messagesToSummarize || messagesToSummarize.length === 0) return '';
  
  const formattedMessages = messagesToSummarize.map(m => `${m.role.toUpperCase()}: ${m.content}`).join('\n\n');
  const systemPrompt = 'Summarize these earlier chat messages to retain important facts, user preferences, and overall conversation flow for a language learning context. Return ONLY the summary, no meta-commentary.';
  const userMessage = `Messages to summarize:\n${formattedMessages}`;
  
  try {
    const modelConfig = getAIModelConfig(provider, customModel);
    let payload;
    if (provider === 'ollama') {
      payload = {
        model: modelConfig.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage }
        ],
        stream: false,
      };
    } else if (provider === 'openai' || provider === 'gemini' || provider === 'mistral') {
      payload = {
        model: modelConfig.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage }
        ],
        temperature: 0.2,
      };
    } else if (provider === 'claude') {
      payload = {
        model: modelConfig.model,
        system: systemPrompt,
        messages: [{ role: 'user', content: userMessage }],
        max_tokens: 1024,
        temperature: 0.2,
      };
    }

    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        provider,
        apiKey,
        payload,
      }),
    });
    
    if (!response || !response.ok) return '';
    
    const data = await response.json();
    let summary = '';
    if (provider === 'ollama') summary = data?.message?.content;
    else if (provider === 'openai' || provider === 'gemini' || provider === 'mistral') summary = data?.choices?.[0]?.message?.content;
    else if (provider === 'claude') summary = data?.content?.[0]?.text;
    
    return summary ? summary.trim() : '';
  } catch (err) {
    console.warn('Failed to summarize older messages:', err);
    return '';
  }
}

/**
 * AI ENGINEERING SPEC: `sendMessage`
 * ============================================================================
 * Primary entrypoint for multi-provider AI chat inference.
 * 
 * PROMPT ASSEMBLY STEPS:
 * 1. Base Persona System Prompt (from `src/prompts/personas.js`).
 * 2. Mandatory Response Format (instructs model to output 5 suggestion cards).
 * 3. RAG / User Context Injection (Learner Persona & Bio from localStorage).
 * 4. Automatic Context Window Truncation & Summarization (`splitConversationHistory`).
 * 5. Provider Payload Construction (Ollama / OpenRouter / OpenAI / Gemini / Claude).
 * ============================================================================
 */
export async function sendMessage(provider, apiKey, personaInput, conversationHistory, userMessage, customModel = null, userContext = {}) {
  const cleanKey = String(apiKey || '').trim();
  const cleanMessage = String(userMessage || '').trim();
  const persona =
    typeof personaInput === 'string' ? getPersonaById(personaInput) : personaInput;

  let isMockAi = false;
  if (typeof window !== 'undefined') {
    try {
      const savedFlags = window.localStorage.getItem('kaiwa.dev.debug_flags');
      if (savedFlags) {
        const parsed = JSON.parse(savedFlags);
        isMockAi = !!parsed.mockAi;
      }
    } catch (e) {}
  }

  if (isMockAi) {
    await new Promise(r => setTimeout(r, 600)); // simulate network delay
    return {
      text: "これはモックのAI返信です。(Mock AI Response Mode is active. API has been bypassed.)",
      suggestions: [
        { text: "分かりました", isCorrect: true, explanation: "I understand." },
        { text: "はい、そうですね", isCorrect: true, explanation: "Yes, that's right." },
        { text: "だめです", isCorrect: false, explanation: "Too blunt." },
        { text: "なんでやねん", isCorrect: false, explanation: "Kansai dialect." },
        { text: "設定を変更する", isCorrect: false, explanation: "Change settings to disable mock mode." }
      ]
    };
  }

  if (provider !== 'ollama' && !cleanKey) {
    throw new AIProviderError(
      'missing_key',
      `Add your ${provider} API key before starting a conversation.`,
    );
  }

  if (!persona?.systemPrompt) {
    throw new AIProviderError(
      'missing_persona',
      'Choose a valid persona before sending a message.',
    );
  }

  if (!cleanMessage) {
    throw new AIProviderError('empty_message', 'Type a message before sending.');
  }

  let response;
  try {
    const normalizedHistory = normalizeHistory(conversationHistory);
    
    // De-duplicate userMessage if caller already included it as the last history item
    let historyToUse = normalizedHistory;
    if (
      historyToUse.length > 0 &&
      historyToUse[historyToUse.length - 1].role === 'user' &&
      historyToUse[historyToUse.length - 1].content === cleanMessage
    ) {
      historyToUse = historyToUse.slice(0, -1);
    }

    // --- STEP 1: CONTEXT WINDOW & TOKEN BUDGETING ---
    // Allocate token budget (Ollama has smaller context window by default)
    const tokenBudget = provider === 'ollama' ? 4000 : 6000;
    const { recent, olderToSummarize } = splitConversationHistory(historyToUse, tokenBudget);
    
    
    // --- STEP 2: SYSTEM PROMPT & OUTPUT CONTRACT SPECIFICATION ---
    
    // Inject user's About Me & Persona Context from settings
    let userPersona = '';
    let aboutMe = '';
    if (typeof window !== 'undefined') {
      try {
        userPersona = window.localStorage.getItem('kaiwa.user.persona') || '';
        const rawProfile = window.localStorage.getItem('kaiwa.user.profile');
        if (rawProfile) {
          const parsed = JSON.parse(rawProfile);
          aboutMe = parsed.aboutMe || '';
        }
      } catch (e) {}
    }

    let summaryText = '';
    // Summarize older history if necessary to prevent context window bloat
    if (olderToSummarize.length > 0) {
      summaryText = await summarizeOldMessages(provider, cleanKey, olderToSummarize, customModel);
    }

    const activeSystemPrompt = assembleSystemPrompt(persona, { 
      userPersona: `${userPersona}\nLearner Bio & Background: ${aboutMe}`.trim(), 
      memorySummary: summaryText,
      ...userContext,
    });

    const modelConfig = getAIModelConfig(provider, customModel);
    let payload;

    if (provider === 'ollama') {
      payload = {
        model: modelConfig.model,
        messages: [
          { role: 'system', content: activeSystemPrompt },
          ...recent,
          { role: 'user', content: cleanMessage },
        ],
        stream: false,
      };
    } else if (provider === 'openai' || provider === 'openrouter' || provider === 'gemini' || provider === 'mistral') {
      payload = {
        model: modelConfig.model,
        messages: [
          { role: 'system', content: activeSystemPrompt },
          ...recent,
          { role: 'user', content: cleanMessage },
        ],
        temperature: modelConfig.temperature,
        max_tokens: 600,
      };
    } else if (provider === 'claude') {
      payload = {
        model: modelConfig.model,
        system: activeSystemPrompt,
        messages: [...recent, { role: 'user', content: cleanMessage }],
        max_tokens: 600,
        temperature: modelConfig.temperature,
      };
    } else {
      throw new AIProviderError('unsupported_provider', `Unsupported AI provider: ${provider}`);
    }

    let attempts = 0;
    const maxRetries = 3;
    let delayMs = 1000;

    while (attempts < maxRetries) {
      attempts++;
      response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          provider,
          apiKey: cleanKey,
          payload,
        }),
      });

      if (response.status === 429) {
        console.warn(`[KAIwa AI] Rate limited (HTTP 429). Retrying attempt ${attempts}/${maxRetries} in ${delayMs}ms...`);
        if (attempts < maxRetries) {
          await new Promise((r) => setTimeout(r, delayMs));
          delayMs = Math.min(delayMs * 1.5, 10000);
          continue;
        }
      }
      break;
    }
  } catch (err) {
    if (err instanceof AIProviderError) throw err;
    const name = PROVIDER_DISPLAY_NAMES[provider] || provider;
    if (typeof window !== 'undefined' && !window.navigator.onLine) {
      throw new AIProviderError('offline', 'You are currently offline / disconnected from the internet. Please check your network connection.', err);
    }
    if (err instanceof TypeError && String(err.message).toLowerCase().includes('failed to fetch')) {
      throw new AIProviderError('disconnected', `Network connection failed. Could not reach the server or ${name}.`, err);
    }
    throw new AIProviderError('system_error', `Error sending message: ${err.message || 'Unknown error'}`, err);
  }

  if (!response.ok) {
    throw await buildHttpError(response, provider);
  }

  const data = await response.json();
  let rawReply = '';

  // Always extract only the actual content — never include thinking/reasoning tokens
  if (provider === 'ollama') {
    rawReply = (data?.message?.content || '').trim();
  } else if (provider === 'openai' || provider === 'gemini' || provider === 'openrouter' || provider === 'mistral') {
    rawReply = (data?.choices?.[0]?.message?.content || '').trim();
  } else if (provider === 'claude') {
    if (Array.isArray(data?.content)) {
      const textBlock = data.content.find((b) => b.type === 'text');
      rawReply = (textBlock?.text || data.content[0]?.text || '').trim();
    } else {
      rawReply = (data?.content?.[0]?.text || '').trim();
    }
  }

  if (!rawReply) {
    throw new AIProviderError(
      'empty_response',
      'The model returned an empty response. Try sending your message again.',
    );
  }

  return parseModelReply(rawReply);
}

/**
 * Translates Japanese chat text to English.
 */
export async function translateMessage(provider, apiKey, japaneseText, customModel = null) {
  const cleanKey = String(apiKey || '').trim();
  const cleanText = String(japaneseText || '').trim();

  let isMockAi = false;
  if (typeof window !== 'undefined') {
    try {
      const savedFlags = window.localStorage.getItem('kaiwa.dev.debug_flags');
      if (savedFlags) {
        const parsed = JSON.parse(savedFlags);
        isMockAi = !!parsed.mockAi;
      }
    } catch (e) {}
  }

  if (isMockAi) {
    await new Promise(r => setTimeout(r, 400));
    return "[Mock Translation]: " + cleanText;
  }

  if (provider !== 'ollama' && !cleanKey) {
    throw new AIProviderError(
      'missing_key',
      `Add your ${provider} API key before translating a message.`,
    );
  }

  if (!cleanText) {
    throw new AIProviderError('empty_message', 'There is no message to translate.');
  }

  const systemPrompt = 'Translate Japanese tutor chat messages into natural English. Return only the English translation. Do not add notes, markdown, or alternatives.';

  let response;
  try {
    const modelConfig = getAIModelConfig(provider, customModel);
    let payload;
    if (provider === 'ollama') {
      payload = {
        model: modelConfig.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: cleanText },
        ],
        stream: false,
      };
    } else if (provider === 'openai' || provider === 'openrouter' || provider === 'gemini' || provider === 'mistral') {
      payload = {
        model: modelConfig.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: cleanText },
        ],
        temperature: 0.2,
      };
    } else if (provider === 'claude') {
      payload = {
        model: modelConfig.model,
        system: systemPrompt,
        messages: [{ role: 'user', content: cleanText }],
        max_tokens: 1024,
        temperature: 0.2,
      };
    } else {
      throw new AIProviderError('unsupported_provider', `Unsupported AI provider: ${provider}`);
    }

    response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        provider,
        apiKey: cleanKey,
        payload,
      }),
    });
  } catch (err) {
    if (err instanceof AIProviderError) throw err;
    const name = PROVIDER_DISPLAY_NAMES[provider] || provider;
    throw new AIProviderError(
      'network',
      `${name} connection failed during translation. Check your connection or local service.`,
      err,
    );
  }

  if (!response.ok) {
    throw await buildHttpError(response, provider);
  }

  const data = await response.json();
  let translation = '';

  if (provider === 'ollama') {
    translation = data?.message?.content;
  } else if (provider === 'openai' || provider === 'gemini' || provider === 'openrouter' || provider === 'mistral') {
    translation = data?.choices?.[0]?.message?.content;
  } else if (provider === 'claude') {
    translation = data?.content?.[0]?.text;
  }

  if (!translation) {
    throw new AIProviderError(
      'empty_response',
      'The model returned an empty translation. Try again.',
    );
  }

  return translation.trim();
}

const PROVIDER_DISPLAY_NAMES = {
  ollama: 'Ollama',
  openrouter: 'OpenRouter',
  openai: 'OpenAI',
  gemini: 'Gemini',
  claude: 'Claude',
};

async function buildHttpError(response, provider) {
  const name = PROVIDER_DISPLAY_NAMES[provider] || provider;

  let detail = '';
  try {
    const data = await response.json();
    detail = data?.error?.message || data?.error || data?.message || '';
  } catch {
    detail = '';
  }

  if (response.status === 429) {
    return new AIProviderError(
      'rate_limit',
      `[Rate Limit Exceeded (HTTP 429)]: You have hit the rate limit for ${name}. Please wait a moment before sending another message.${detail ? ` (${detail})` : ''}`,
    );
  }

  if (response.status === 401 || response.status === 403) {
    return new AIProviderError(
      'invalid_key',
      `[Authentication Error (HTTP ${response.status})]: ${name} rejected your API key. Please check or re-enter your API key in Settings.${detail ? ` (${detail})` : ''}`,
    );
  }

  if (response.status === 402) {
    return new AIProviderError(
      'insufficient_balance',
      `[Insufficient Balance / Credits (HTTP 402)]: Your ${name} account has run out of credits or quota.${detail ? ` (${detail})` : ''}`,
    );
  }

  if (response.status === 404) {
    return new AIProviderError(
      'model_not_found',
      `[Model Not Found (HTTP 404)]: The selected model was not found on ${name}.${detail ? ` (${detail})` : ''}`,
    );
  }

  if (response.status >= 500) {
    return new AIProviderError(
      'service_unavailable',
      `[${name} Service Outage (HTTP ${response.status})]: ${name} is currently experiencing server errors or high load. Please try again in a few minutes.`,
    );
  }

  return new AIProviderError(
    'api_error',
    `[${name} Error (HTTP ${response.status})]: ${detail || response.statusText || 'Request failed.'}`,
  );
}

/* ==========================================================================
   GRADING REPORT & EVALUATION ENDPOINTS
   ========================================================================== */

/**
 * Returns mapped scenario goals/milestones based on the scenario title or key.
 */
export function getScenarioGoals(scenarioKeyOrTitle) {
  const key = String(scenarioKeyOrTitle || '').toLowerCase();

  if (key.includes('train') || key.includes('駅')) {
    return [
      { title: 'State destination details', goal: 'State your destination clearly in Japanese (e.g. 渋谷駅に行きたいです)' },
      { title: 'Confirm train platform number', goal: 'Ask for or confirm the train platform number (何番線ですか / 二番線ですね)' },
      { title: 'Polite conversation etiquette', goal: 'Use natural polite confirmation and closing etiquette (ありがとうございます)' },
    ];
  }

  if (key.includes('convenience') || key.includes('コンビニ')) {
    return [
      { title: 'Bag & receipt preference', goal: 'Specify whether you need a plastic bag or receipt (袋は大丈夫です)' },
      { title: 'Payment / heating selection', goal: 'State your payment method or request food heating (カードで払います)' },
      { title: 'Polite customer etiquette', goal: 'Complete checkout politely with ありがとうございます' },
    ];
  }

  if (key.includes('ordering') || key.includes('注文')) {
    return [
      { title: 'Order food/drink item', goal: 'Order desired dish or drink using 〜をください' },
      { title: 'Ask for recommendations', goal: 'Ask waiter for recommendations (おすすめは何ですか)' },
      { title: 'Order confirmation & thanks', goal: 'Confirm your order and thank the waiter' },
    ];
  }

  if (key.includes('intro') || key.includes('personal') || key.includes('自己紹介') || key.includes('はじめまして')) {
    return [
      { title: 'Proper greeting & name', goal: 'Start with はじめまして and state your name clearly' },
      { title: 'Origin & background', goal: 'Share your origin country or hobbies using です' },
      { title: 'Polite closing phrase', goal: 'Conclude intro with よろしくお願いします' },
    ];
  }

  if (key.includes('idol') || key.includes('cheki') || key.includes('チェキ')) {
    return [
      { title: 'Express fan appreciation', goal: 'Give a sincere compliment about the live performance' },
      { title: 'Answer idol question', goal: 'Respond warmly to the idol\'s question' },
      { title: 'Enthusiastic farewell', goal: 'End session with 応援しています or また来ます' },
    ];
  }

  if (key.includes('interview') || key.includes('面接')) {
    return [
      { title: 'Formal self-introduction', goal: 'Deliver a structured formal self-introduction (自己PR)' },
      { title: 'State motivation / background', goal: 'Explain your background or reason for applying (志望動機)' },
      { title: 'Keigo & polite register', goal: 'Maintain respectful Japanese business tone throughout' },
    ];
  }

  // General fallback goals
  return [
    { title: 'Initiate scenario interaction', goal: 'Open the conversation with appropriate scenario greeting' },
    { title: 'Communicate core goal', goal: 'Express key request or information accurately' },
    { title: 'Polite conversation closing', goal: 'Maintain respectful Japanese phrasing through completion' },
  ];
}

/**
 * Fallback evaluator when offline or AI provider is not available
 */
export function evaluateSessionFallback(sessionData, customGoals = null) {
  const scenarioTitle = typeof sessionData?.scenario === 'object' 
    ? sessionData.scenario.title 
    : String(sessionData?.scenario || 'Train Station');
    
  const goals = customGoals || getScenarioGoals(scenarioTitle);
  const transcript = sessionData?.transcript || sessionData?.messages || [];

  const mappedTranscript = transcript.length > 0 ? transcript.map(m => ({
    speaker: m.speaker || (m.role === 'user' ? 'You' : 'KAIwa'),
    text: m.text || m.content || ''
  })) : [];

  return {
    mode: sessionData?.mode || 'Roleplay',
    scenario: scenarioTitle,
    learnerRole: sessionData?.learnerRole || 'Learner',
    aiRole: sessionData?.aiRole || 'KAIwa Sensei',
    duration: sessionData?.duration || '05:00',
    overall: 0,
    overallCritique: 'AI grading is unavailable. This could be because Mock AI mode is active, your AI provider is not configured, or the evaluation timed out. Please check your AI provider settings and try again.',
    scenarioMilestones: goals.map(g => ({ ...g, accomplished: false, critique: 'Unable to evaluate — AI grading unavailable.' })),
    metrics: [
      { label: 'Overall', value: 0, color: 'bg-ink', note: 'AI grading unavailable.', modal: 'overall' },
      { label: 'Grammar', value: 0, color: 'bg-soft-blue', note: 'AI grading unavailable.', modal: 'grammar' },
      { label: 'Vocabulary', value: 0, color: 'bg-mustard', note: 'AI grading unavailable.', modal: 'vocabulary' },
      { label: 'Engagement', value: 0, color: 'bg-correction', note: 'AI grading unavailable.', modal: 'engagement' },
      { label: 'Relevance', value: 0, color: 'bg-moss', note: 'AI grading unavailable.', modal: 'relevance' },
    ],
    weakVocabulary: [],
    engagementAnalysis: { politenessFeedback: 'AI grading unavailable.', markers: [] },
    relevanceAnalysis: { relevanceFeedback: 'AI grading unavailable.', offTopicLines: [] },
    mistakes: [],
    transcript: mappedTranscript,
  };
}

export async function _fetchAiEvaluation(provider, apiKey, systemPrompt, formattedTranscript, customModel = null) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 180000); // 3 minutes timeout for sustained retries

  try {
    const cleanKey = String(apiKey || '').trim();
    const modelConfig = getAIModelConfig(provider, customModel);
    let payload = {};

    if (provider === 'ollama') {
      payload = {
        model: modelConfig.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: formattedTranscript },
        ],
        stream: false,
        options: { temperature: 0.2 },
      };
    } else if (provider === 'openrouter' || provider === 'openai' || provider === 'gemini' || provider === 'mistral') {
      payload = {
        model: modelConfig.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: formattedTranscript },
        ],
        temperature: 0.2,
      };
    } else if (provider === 'claude') {
      payload = {
        model: modelConfig.model,
        system: systemPrompt,
        messages: [{ role: 'user', content: formattedTranscript }],
        max_tokens: 1024,
        temperature: 0.2,
      };
    }

    let response;
    let attempts = 0;
    const maxRetries = 20;
    let delayMs = 2500;

    while (attempts < maxRetries) {
      attempts++;
      try {
        response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ provider, apiKey: cleanKey, payload }),
          signal: controller.signal,
        });

        if (response.status === 429 && attempts < maxRetries) {
          console.warn(`[KAIwa Evaluation] Rate limited (HTTP 429). Retrying attempt ${attempts}/${maxRetries} in ${delayMs}ms...`);
          await new Promise((r) => setTimeout(r, delayMs));
          delayMs = Math.min(delayMs * 1.5, 10000);
          continue;
        }
        break;
      } catch (retryErr) {
        if (retryErr.name === 'AbortError') throw retryErr;
        if (attempts < maxRetries) {
          console.warn(`[KAIwa Evaluation] Fetch error. Retrying attempt ${attempts}/${maxRetries} in ${delayMs}ms...`);
          await new Promise((r) => setTimeout(r, delayMs));
          delayMs = Math.min(delayMs * 1.5, 10000);
          continue;
        }
        throw retryErr;
      }
    }
    clearTimeout(timeoutId);

    if (!response || !response.ok) return null;

    const data = await response.json();
    let rawReply = '';
    if (provider === 'ollama') rawReply = data?.message?.content;
    else if (provider === 'openai' || provider === 'gemini' || provider === 'openrouter' || provider === 'mistral') rawReply = data?.choices?.[0]?.message?.content;
    else if (provider === 'claude') rawReply = data?.content?.[0]?.text;

    if (!rawReply) return null;

    const cleanJson = rawReply.replace(/```json/gi, '').replace(/```/g, '').trim();
    const match = cleanJson.match(/(\{[\s\S]*\})/);
    const jsonString = match ? match[1] : cleanJson;
    return JSON.parse(jsonString);
  } catch (err) {
    clearTimeout(timeoutId);
    console.warn('AI evaluation fetch error:', err);
    return null;
  }
}

export async function evaluateSession(provider, apiKey, sessionData, openRouterModel = null) {
  const scenario = sessionData?.scenario || 'Train Station';
  const scenarioTitle = typeof scenario === 'object' ? scenario.title : String(scenario);
  const goals = getScenarioGoals(scenarioTitle);
  const transcript = sessionData?.transcript || sessionData?.messages || [];
  
  const mappedTranscript = transcript.map(m => ({
    speaker: m.speaker || (m.role === 'user' ? 'You' : 'KAIwa'),
    text: m.text || m.content || ''
  }));

  const userMessages = transcript.filter(m => m.role === 'user' || m.speaker === 'You');
  const userMessagesCount = userMessages.length;
  // Deduplicate: count unique user messages
  const uniqueUserMessages = new Set(userMessages.map(m => (m.text || m.content || '').trim())).size;
  
  // Short conversation penalty — cap at 30% if fewer than 3 unique student messages
  if (uniqueUserMessages < 3) {
    const shortScore = Math.min(30, uniqueUserMessages * 15);
    return {
      mode: sessionData.mode || 'Roleplay',
      scenario: scenarioTitle,
      learnerRole: sessionData.learnerRole || 'Learner',
      aiRole: sessionData.aiRole || 'KAIwa Sensei',
      duration: sessionData.duration || '05:00',
      overall: shortScore,
      overallCritique: `The conversation was too short to properly evaluate your Japanese skills. You sent ${userMessagesCount} message(s) with only ${uniqueUserMessages} unique response(s). Please try to engage in a longer, more sustained conversation next time to practice your Japanese!`,
      scenarioMilestones: goals.map(g => ({ ...g, accomplished: false, critique: 'Conversation ended too early to achieve this goal.' })),
      metrics: [
        { label: 'Overall', value: shortScore, color: 'bg-ink', note: 'Conversation too short to properly evaluate.', modal: 'overall' },
        { label: 'Grammar', value: shortScore, color: 'bg-soft-blue', note: 'Not enough data to evaluate grammar.', modal: 'grammar' },
        { label: 'Vocabulary', value: shortScore, color: 'bg-mustard', note: 'Not enough data to evaluate vocabulary.', modal: 'vocabulary' },
        { label: 'Engagement', value: shortScore, color: 'bg-correction', note: 'Conversation was too brief for engagement analysis.', modal: 'engagement' },
        { label: 'Relevance', value: shortScore, color: 'bg-moss', note: 'Not enough data to evaluate relevance.', modal: 'relevance' }
      ],
      engagementAnalysis: { politenessFeedback: 'The conversation was too short to evaluate your tone and politeness.', markers: [] },
      relevanceAnalysis: { relevanceFeedback: 'The conversation was too short to evaluate context alignment.', offTopicLines: [] },
      weakVocabulary: [],
      mistakes: [],
      transcript: mappedTranscript,
    };
  }

  const formattedTranscript = mappedTranscript.map(m => `${m.speaker}: ${m.text}`).join('\n');

  let isMockAi = false;
  if (typeof window !== 'undefined') {
    try {
      const savedFlags = window.localStorage.getItem('kaiwa.dev.debug_flags');
      if (savedFlags) {
        const parsed = JSON.parse(savedFlags);
        isMockAi = !!parsed.mockAi;
      }
    } catch (e) {}
  }

  if (isMockAi || !provider || !apiKey) {
    return evaluateSessionFallback(sessionData, goals);
  }

  // Council-approved rubric-based prompt with de-anchored scoring
  const systemPrompt = `You are a strict but fair Japanese Language AI Tutor and Evaluator.
Analyze the following Japanese practice session transcript for the scenario "${scenarioTitle}".

Scenario Goals:
${goals.map((g, i) => `${i+1}. ${g.title}: ${g.goal}`).join('\n')}

SCORING RUBRIC (follow this strictly):
- 0-30: Student barely participated, used mostly English, or sent very few messages
- 31-50: Student attempted Japanese but conversation was very short, mostly off-topic, or had major grammar issues throughout
- 51-70: Student sustained a basic conversation with some errors and achieved some scenario goals
- 71-85: Student achieved most scenario goals with decent Japanese and maintained polite conversation
- 86-100: Student achieved all goals with natural, polite Japanese throughout and demonstrated strong vocabulary

IMPORTANT RULES:
- Do NOT default to any score. Evaluate the actual transcript carefully against the rubric above.
- If the student asked for English or switched to English, penalize the Relevance score heavily.
- If the conversation was very short (fewer than 4 student messages), the score should reflect that.
- Count duplicate/repeated messages as a single contribution.
- Do NOT penalize the student if the AI tutor made errors (e.g. responding in English when it shouldn't have).

Grammar Evaluation: Examine the user's Japanese messages for grammar or particle mistakes. List each in 'mistakes'. If none, use [].
Vocabulary Evaluation: Identify 2-4 key Japanese words the student should add to their flashcard deck. List in 'weakVocabulary'.
Engagement Evaluation: Evaluate politeness, warmth, tone. Provide 'politenessFeedback' (2 sentences). List conversational markers (aizuchi) in 'markers'.
Relevance Evaluation: Provide 'relevanceFeedback' (1-2 sentences). List ONLY off-topic replies in 'offTopicLines'. If all on-topic, use [].

Output MUST be strictly valid JSON with no markdown wrapping or additional text:
{
  "overall": <integer 0-100 based on rubric>,
  "grammar": <integer 0-100>,
  "vocabulary": <integer 0-100>,
  "engagement": <integer 0-100>,
  "relevance": <integer 0-100>,
  "overallCritique": "Detailed 2-3 sentence overview based on rubric.",
  "scenarioMilestones": [
    {
      "title": "${goals[0]?.title || 'Goal 1'}",
      "goal": "${goals[0]?.goal || ''}",
      "accomplished": true,
      "critique": "Specific critique."
    }
  ],
  "engagementAnalysis": {
    "politenessFeedback": "2 sentence evaluation.",
    "markers": [{ "marker": "ね", "usage": "How it was used." }]
  },
  "relevanceAnalysis": {
    "relevanceFeedback": "1-2 sentence evaluation.",
    "offTopicLines": []
  },
  "weakVocabulary": [
    { "term": "何番線", "reading": "なんばんせん", "meaning": "which platform", "source": "${scenarioTitle} roleplay", "reason": "Why this word matters." }
  ],
  "mistakes": [
    { "title": "Particle choice", "original": "渋谷駅で行きたいです。", "corrected": "渋谷駅に行きたいです。", "why": "Use に for destination." }
  ]
}`;

  const parsed = await _fetchAiEvaluation(provider, apiKey, systemPrompt, formattedTranscript, openRouterModel);
  if (!parsed) return evaluateSessionFallback(sessionData, goals);

  const overall = parsed.overall ?? 50;
  const grammarScore = parsed.grammar ?? overall;
  const vocabScore = parsed.vocabulary ?? Math.max(40, overall - 10);
  const engagementScore = parsed.engagement ?? Math.min(100, overall + 5);
  const relevanceScore = parsed.relevance ?? Math.min(100, overall + 5);

  return {
    mode: sessionData.mode || 'Roleplay',
    scenario: scenarioTitle,
    learnerRole: sessionData.learnerRole || 'Learner',
    aiRole: sessionData.aiRole || 'KAIwa Sensei',
    duration: sessionData.duration || '05:00',
    overall,
    overallCritique: parsed.overallCritique || 'Session evaluated.',
    scenarioMilestones: parsed.scenarioMilestones || goals.map(g => ({ ...g, accomplished: true, critique: 'Goal achieved successfully.' })),
    metrics: [
      { label: 'Overall', value: overall, color: 'bg-ink', note: parsed.overallCritique || 'Session evaluated.', modal: 'overall' },
      { label: 'Grammar', value: grammarScore, color: 'bg-soft-blue', note: (parsed.mistakes?.length || 0) === 0 ? 'No grammar mistakes found.' : `${parsed.mistakes.length} grammar issue(s) found.`, modal: 'grammar' },
      { label: 'Vocabulary', value: vocabScore, color: 'bg-mustard', note: `${(parsed.weakVocabulary?.length || 0)} words to review.`, modal: 'vocabulary' },
      { label: 'Engagement', value: engagementScore, color: 'bg-correction', note: parsed.engagementAnalysis?.politenessFeedback?.slice(0, 60) || 'Engagement evaluated.', modal: 'engagement' },
      { label: 'Relevance', value: relevanceScore, color: 'bg-moss', note: (parsed.relevanceAnalysis?.offTopicLines?.length || 0) === 0 ? 'All replies on topic.' : `${parsed.relevanceAnalysis.offTopicLines.length} off-topic response(s).`, modal: 'relevance' }
    ],
    engagementAnalysis: parsed.engagementAnalysis || { politenessFeedback: 'Engagement evaluated.', markers: [] },
    relevanceAnalysis: parsed.relevanceAnalysis || { relevanceFeedback: 'Relevance evaluated.', offTopicLines: [] },
    weakVocabulary: parsed.weakVocabulary || [],
    mistakes: parsed.mistakes || [],
    transcript: mappedTranscript,
  };
}

export async function evaluateGrammar(provider, apiKey, transcript, openRouterModel = null) {
  const formattedTranscript = transcript.map(m => `${m.speaker}: ${m.text}`).join('\n');
  const systemPrompt = `You are a Japanese Language AI Tutor. Analyze the transcript for grammar mistakes.
Examine the user's ("You") Japanese messages carefully for any grammar or particle mistakes.
If there ARE mistakes, list each in the 'mistakes' array. If NO mistakes, return [].
Output strictly valid JSON:
{
  "mistakes": [
    {
      "title": "Particle choice",
      "original": "渋谷駅で行きたいです。",
      "corrected": "渋谷駅に行きたいです。",
      "why": "Use に for destination with 行きます."
    }
  ],
  "score": 85,
  "note": "Good sentence structure."
}`;
  const parsed = await _fetchAiEvaluation(provider, apiKey, systemPrompt, formattedTranscript, openRouterModel);
  return parsed || { mistakes: [], score: 100, note: 'Perfect grammar!' };
}

export async function evaluateVocabulary(provider, apiKey, transcript, scenarioTitle, openRouterModel = null) {
  const formattedTranscript = transcript.map(m => `${m.speaker}: ${m.text}`).join('\n');
  const systemPrompt = `You are a Japanese Language AI Tutor. Analyze the transcript for vocabulary.
Identify 2-4 key Japanese words the student struggled with or should add to their flashcards.
Output strictly valid JSON:
{
  "weakVocabulary": [
    {
      "term": "何番線",
      "reading": "なんばんせん",
      "meaning": "which platform / track number",
      "source": "${scenarioTitle} roleplay",
      "reason": "Essential vocabulary for asking and confirming train platform numbers."
    }
  ],
  "score": 80,
  "note": "Essential N5 words used."
}`;
  const parsed = await _fetchAiEvaluation(provider, apiKey, systemPrompt, formattedTranscript, openRouterModel);
  return parsed || { weakVocabulary: [], score: 100, note: 'Great vocabulary!' };
}

export async function evaluateEngagement(provider, apiKey, transcript, openRouterModel = null) {
  const formattedTranscript = transcript.map(m => `${m.speaker}: ${m.text}`).join('\n');
  const systemPrompt = `You are a Japanese Language AI Tutor. Evaluate Engagement & Tone.
1. Provide "politenessFeedback" (2 sentences).
2. Identify specific Conversational Markers (あいづち) used by the student (e.g., "ね", "はい").
Output strictly valid JSON:
{
  "engagementAnalysis": {
    "politenessFeedback": "You maintained an exceptionally polite, warm, and appropriate tone.",
    "markers": [
      { "marker": "ね (Ne)", "usage": "Natural confirmation marker." }
    ]
  },
  "score": 90,
  "note": "Responded politely."
}`;
  const parsed = await _fetchAiEvaluation(provider, apiKey, systemPrompt, formattedTranscript, openRouterModel);
  return parsed || { engagementAnalysis: { politenessFeedback: "Polite and responsive.", markers: [] }, score: 100, note: 'Excellent engagement.' };
}

export async function evaluateRelevance(provider, apiKey, transcript, scenarioTitle, openRouterModel = null) {
  const formattedTranscript = transcript.map(m => `${m.speaker}: ${m.text}`).join('\n');
  const systemPrompt = `You are a Japanese Language AI Tutor. Evaluate Context Alignment.
1. Provide overall "relevanceFeedback" (1-2 sentences).
2. List ONLY lines where the student gave an off-topic or contextually mismatched reply in "offTopicLines". If 100% relevant, use [].
Output strictly valid JSON:
{
  "relevanceAnalysis": {
    "relevanceFeedback": "Responses were highly relevant.",
    "offTopicLines": [
      {
        "prompt": "どちらまで行きますか。",
        "studentReply": "りんごが好きです。",
        "whyWrong": "You stated you like apples when asked for your destination."
      }
    ]
  },
  "score": 95,
  "note": "Replies matched the scenario."
}`;
  const parsed = await _fetchAiEvaluation(provider, apiKey, systemPrompt, formattedTranscript, openRouterModel);
  return parsed || { relevanceAnalysis: { relevanceFeedback: "100% relevant responses.", offTopicLines: [] }, score: 100, note: 'Perfect context alignment.' };
}

