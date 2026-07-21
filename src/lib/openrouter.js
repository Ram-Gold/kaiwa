import { getPersonaById } from '../prompts/personas.js';

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const DEFAULT_MODEL = import.meta.env?.VITE_OPENROUTER_MODEL || 'openrouter/auto';

export class OpenRouterError extends Error {
  constructor(code, userMessage, cause) {
    super(userMessage);
    this.name = 'OpenRouterError';
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
    suggestions,
  };
}

export function extractSuggestions(content) {
  const source = String(content || '').trim();
  const candidates = [
    ...source.matchAll(/SUGGESTIONS:\s*(\[[\s\S]*?\])\s*$/gi),
    ...source.matchAll(/```(?:json)?\s*([\s\S]*?)```/gi),
    ...source.matchAll(/(\{[\s\S]*"SUGGESTIONS"[\s\S]*?\})/gi),
  ];

  for (const candidate of candidates.reverse()) {
    const parsed = parseSuggestions(candidate[1]);
    if (parsed.length) {
      return parsed;
    }
  }

  return [];
}

function stripSuggestions(content) {
  return String(content || '')
    .replace(/\n?\s*SUGGESTIONS:\s*\[[\s\S]*?\]\s*$/gi, '')
    .replace(/\n?\s*```(?:json)?\s*\{?\s*"SUGGESTIONS"[\s\S]*?```\s*$/gi, '')
    .replace(/\n?\s*\{[\s\S]*"SUGGESTIONS"[\s\S]*?\}\s*$/gi, '');
}

function parseSuggestions(rawValue) {
  try {
    const cleaned = String(rawValue || '')
      .trim()
      .replace(/^```(?:json)?/i, '')
      .replace(/```$/i, '')
      .trim();
    const parsed = JSON.parse(cleaned);
    const suggestions = Array.isArray(parsed) ? parsed : parsed?.SUGGESTIONS;

    if (!Array.isArray(suggestions)) {
      return [];
    }

    return suggestions
      .filter((suggestion) => typeof suggestion === 'string')
      .map((suggestion) => suggestion.trim())
      .filter(Boolean)
      .map((suggestion) => suggestion.replace(/^["'`]+|["'`]+$/g, ''))
      .slice(0, 3);
  } catch {
    return [];
  }
}

export async function sendMessage(apiKey, personaInput, conversationHistory, userMessage) {
  const cleanKey = String(apiKey || '').trim();
  const cleanMessage = String(userMessage || '').trim();
  const persona =
    typeof personaInput === 'string' ? getPersonaById(personaInput) : personaInput;

  if (!cleanKey) {
    throw new OpenRouterError(
      'missing_key',
      'Add your OpenRouter API key before starting a conversation.',
    );
  }

  if (!persona?.systemPrompt) {
    throw new OpenRouterError(
      'missing_persona',
      'Choose a valid persona before sending a message.',
    );
  }

  if (!cleanMessage) {
    throw new OpenRouterError('empty_message', 'Type a message before sending.');
  }

  // The system prompt is prepended on every request so the stateless API always
  // receives the selected tutor role, tone, safety boundaries, and output format.
  const messages = [
    { role: 'system', content: persona.systemPrompt },
    ...normalizeHistory(conversationHistory),
    { role: 'user', content: cleanMessage },
  ];

  const data = await postChatCompletion(cleanKey, messages, 0.8);
  const rawReply = data?.choices?.[0]?.message?.content;

  if (!rawReply) {
    throw new OpenRouterError(
      'empty_response',
      'The model returned an empty response. Try sending your message again.',
    );
  }

  return parseModelReply(rawReply);
}

export async function translateMessage(apiKey, japaneseText) {
  const cleanKey = String(apiKey || '').trim();
  const cleanText = String(japaneseText || '').trim();

  if (!cleanKey) {
    throw new OpenRouterError(
      'missing_key',
      'Add your OpenRouter API key before translating a message.',
    );
  }

  if (!cleanText) {
    throw new OpenRouterError('empty_message', 'There is no message to translate.');
  }

  const messages = [
    {
      role: 'system',
      content:
        'Translate Japanese tutor chat messages into natural English. Return only the English translation. Do not add notes, markdown, or alternatives.',
    },
    {
      role: 'user',
      content: cleanText,
    },
  ];

  const data = await postChatCompletion(cleanKey, messages, 0.2);
  const translation = data?.choices?.[0]?.message?.content?.trim();

  if (!translation) {
    throw new OpenRouterError(
      'empty_response',
      'The model returned an empty translation. Try again.',
    );
  }

  return translation;
}

async function postChatCompletion(apiKey, messages, temperature) {
  let response;

  try {
    response = await fetch(OPENROUTER_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': window.location.origin,
        'X-Title': 'Kaiwa Capstone',
      },
      body: JSON.stringify({
        model: DEFAULT_MODEL,
        messages,
        temperature,
      }),
    });
  } catch (error) {
    throw new OpenRouterError(
      'network',
      'Network error. Check your internet connection and try again.',
      error,
    );
  }

  if (!response.ok) {
    throw await buildOpenRouterHttpError(response);
  }

  return response.json();
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

async function buildOpenRouterHttpError(response) {
  if (response.status === 401 || response.status === 403) {
    return new OpenRouterError(
      'invalid_key',
      'OpenRouter rejected the API key. Check that it starts with sk-or- and is active.',
    );
  }

  if (response.status === 429) {
    return new OpenRouterError(
      'rate_limit',
      'OpenRouter rate limited this key. Wait a moment, then try again.',
    );
  }

  let detail = '';
  try {
    const data = await response.json();
    detail = data?.error?.message ? ` ${data.error.message}` : '';
  } catch {
    detail = '';
  }

  return new OpenRouterError(
    'api_error',
    `OpenRouter could not complete the request.${detail}`.trim(),
  );
}
