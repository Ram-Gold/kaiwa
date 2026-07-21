import { getPersonaById } from '../prompts/personas.js';

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

function normalizeHistory(conversationHistory = []) {
  return conversationHistory
    .filter((message) => ['user', 'assistant'].includes(message?.role))
    .map((message) => ({
      role: message.role,
      content: String(message.content || '').trim(),
    }))
    .filter((message) => message.content);
}

/**
 * Sends a message to the chosen AI provider.
 *
 * Provider-switching & Prompt-construction:
 * Tutoring quality relies on delivering the context and tone defined by the tutor's
 * persona (e.g. systemPrompt). Different LLM backends handle system prompts and
 * message payload schemas differently:
 * - Ollama/OpenAI/Gemini support standard chat completions with a system-role message.
 * - Claude requires system prompt at the top-level request body.
 *
 * Additionally, Ollama runs locally (no network dependency, zero cost, full privacy),
 * conforming to AGENTS.md requirements for local-first operations.
 */
export async function sendMessage(provider, apiKey, personaInput, conversationHistory, userMessage) {
  const cleanKey = String(apiKey || '').trim();
  const cleanMessage = String(userMessage || '').trim();
  const persona =
    typeof personaInput === 'string' ? getPersonaById(personaInput) : personaInput;

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
    if (provider === 'ollama') {
      const messages = [
        { role: 'system', content: persona.systemPrompt },
        ...normalizeHistory(conversationHistory),
        { role: 'user', content: cleanMessage },
      ];
      // Make local HTTP request to user's Ollama instance.
      response = await fetch('http://localhost:11434/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama3',
          messages,
          stream: false,
        }),
      });
    } else if (provider === 'openai') {
      const messages = [
        { role: 'system', content: persona.systemPrompt },
        ...normalizeHistory(conversationHistory),
        { role: 'user', content: cleanMessage },
      ];
      response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${cleanKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages,
          temperature: 0.8,
        }),
      });
    } else if (provider === 'gemini') {
      const messages = [
        { role: 'system', content: persona.systemPrompt },
        ...normalizeHistory(conversationHistory),
        { role: 'user', content: cleanMessage },
      ];
      // Google Gemini OpenAI compatibility endpoint
      response = await fetch('https://generativelanguage.googleapis.com/v1beta/openai/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${cleanKey}`,
        },
        body: JSON.stringify({
          model: 'gemini-1.5-flash',
          messages,
          temperature: 0.8,
        }),
      });
    } else if (provider === 'claude') {
      const messages = normalizeHistory(conversationHistory);
      messages.push({ role: 'user', content: cleanMessage });

      // Claude Messages API puts system prompt at the top-level
      response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': cleanKey,
          'anthropic-version': '2023-06-01',
          'dangerouslyAllowBrowser': 'true',
        },
        body: JSON.stringify({
          model: 'claude-3-5-haiku-20241022',
          system: persona.systemPrompt,
          messages,
          max_tokens: 1024,
          temperature: 0.8,
        }),
      });
    } else {
      throw new AIProviderError('unsupported_provider', `Unsupported AI provider: ${provider}`);
    }
  } catch (err) {
    if (err instanceof AIProviderError) throw err;
    throw new AIProviderError(
      'network',
      'Network error. Check your connection or local service and try again.',
      err,
    );
  }

  if (!response.ok) {
    throw await buildHttpError(response, provider);
  }

  const data = await response.json();
  let rawReply = '';

  if (provider === 'ollama') {
    rawReply = data?.message?.content;
  } else if (provider === 'openai' || provider === 'gemini') {
    rawReply = data?.choices?.[0]?.message?.content;
  } else if (provider === 'claude') {
    rawReply = data?.content?.[0]?.text;
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
export async function translateMessage(provider, apiKey, japaneseText) {
  const cleanKey = String(apiKey || '').trim();
  const cleanText = String(japaneseText || '').trim();

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
    if (provider === 'ollama') {
      const messages = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: cleanText },
      ];
      response = await fetch('http://localhost:11434/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama3',
          messages,
          stream: false,
        }),
      });
    } else if (provider === 'openai') {
      const messages = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: cleanText },
      ];
      response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${cleanKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages,
          temperature: 0.2,
        }),
      });
    } else if (provider === 'gemini') {
      const messages = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: cleanText },
      ];
      response = await fetch('https://generativelanguage.googleapis.com/v1beta/openai/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${cleanKey}`,
        },
        body: JSON.stringify({
          model: 'gemini-1.5-flash',
          messages,
          temperature: 0.2,
        }),
      });
    } else if (provider === 'claude') {
      response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': cleanKey,
          'anthropic-version': '2023-06-01',
          'dangerouslyAllowBrowser': 'true',
        },
        body: JSON.stringify({
          model: 'claude-3-5-haiku-20241022',
          system: systemPrompt,
          messages: [{ role: 'user', content: cleanText }],
          max_tokens: 1024,
          temperature: 0.2,
        }),
      });
    } else {
      throw new AIProviderError('unsupported_provider', `Unsupported AI provider: ${provider}`);
    }
  } catch (err) {
    if (err instanceof AIProviderError) throw err;
    throw new AIProviderError(
      'network',
      'Network error during translation. Check your connection or local service.',
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
  } else if (provider === 'openai' || provider === 'gemini') {
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

async function buildHttpError(response, provider) {
  if (response.status === 401 || response.status === 403) {
    return new AIProviderError(
      'invalid_key',
      `${provider} API rejected the API key. Please check its validity.`,
    );
  }

  if (response.status === 429) {
    return new AIProviderError(
      'rate_limit',
      `${provider} API rate limited this key. Wait a moment, then try again.`,
    );
  }

  let detail = '';
  try {
    const data = await response.json();
    detail = data?.error?.message || data?.error || '';
  } catch {
    detail = '';
  }

  return new AIProviderError(
    'api_error',
    `${provider} request failed with status ${response.status}${detail ? `: ${detail}` : ''}`,
  );
}
