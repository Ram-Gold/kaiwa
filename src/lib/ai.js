import { getPersonaById } from '../prompts/personas.js';

export class AIError extends Error {
  constructor(code, userMessage, cause) {
    super(userMessage);
    this.name = 'AIError';
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

export async function sendMessage(settings, personaInput, conversationHistory, userMessage) {
  const provider = settings?.provider || 'openrouter';
  const config = settings?.[provider];

  if (provider === 'openrouter' || provider === 'openai') {
    if (!config?.apiKey?.trim()) {
      throw new AIError(
        'missing_key',
        `Add your ${provider === 'openrouter' ? 'OpenRouter' : 'OpenAI'} API key in settings before starting a conversation.`,
      );
    }
  } else if (provider === 'ollama') {
    if (!config?.baseUrl?.trim()) {
      throw new AIError(
        'missing_url',
        'Add your Ollama Base URL in settings before starting a conversation.',
      );
    }
  }

  const cleanMessage = String(userMessage || '').trim();
  const persona =
    typeof personaInput === 'string' ? getPersonaById(personaInput) : personaInput;

  if (!persona?.systemPrompt) {
    throw new AIError(
      'missing_persona',
      'Choose a valid persona before sending a message.',
    );
  }

  if (!cleanMessage) {
    throw new AIError('empty_message', 'Type a message before sending.');
  }

  const messages = [
    { role: 'system', content: persona.systemPrompt },
    ...normalizeHistory(conversationHistory),
    { role: 'user', content: cleanMessage },
  ];

  const data = await postChatCompletion(settings, messages, 0.8);
  const rawReply = data?.choices?.[0]?.message?.content;

  if (!rawReply) {
    throw new AIError(
      'empty_response',
      'The model returned an empty response. Try sending your message again.',
    );
  }

  return parseModelReply(rawReply);
}

export async function translateMessage(settings, japaneseText) {
  const provider = settings?.provider || 'openrouter';
  const config = settings?.[provider];

  if (provider === 'openrouter' || provider === 'openai') {
    if (!config?.apiKey?.trim()) {
      throw new AIError(
        'missing_key',
        `Add your ${provider === 'openrouter' ? 'OpenRouter' : 'OpenAI'} API key in settings before translating a message.`,
      );
    }
  } else if (provider === 'ollama') {
    if (!config?.baseUrl?.trim()) {
      throw new AIError(
        'missing_url',
        'Add your Ollama Base URL in settings before translating a message.',
      );
    }
  }

  const cleanText = String(japaneseText || '').trim();
  if (!cleanText) {
    throw new AIError('empty_message', 'There is no message to translate.');
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

  const data = await postChatCompletion(settings, messages, 0.2);
  const translation = data?.choices?.[0]?.message?.content?.trim();

  if (!translation) {
    throw new AIError(
      'empty_response',
      'The model returned an empty translation. Try again.',
    );
  }

  return translation;
}

async function postChatCompletion(settings, messages, temperature) {
  const provider = settings?.provider || 'openrouter';
  const config = settings?.[provider];

  let url = '';
  const headers = {
    'Content-Type': 'application/json',
  };
  let body = {};

  if (provider === 'openrouter') {
    url = 'https://openrouter.ai/api/v1/chat/completions';
    headers['Authorization'] = `Bearer ${config.apiKey.trim()}`;
    headers['HTTP-Referer'] = window.location.origin;
    headers['X-Title'] = 'Kaiwa Capstone';
    body = {
      model: config.model?.trim() || 'openrouter/auto',
      messages,
      temperature,
    };
  } else if (provider === 'openai') {
    url = 'https://api.openai.com/v1/chat/completions';
    headers['Authorization'] = `Bearer ${config.apiKey.trim()}`;
    body = {
      model: config.model?.trim() || 'gpt-4o-mini',
      messages,
      temperature,
    };
  } else if (provider === 'ollama') {
    const baseUrl = (config.baseUrl || 'http://localhost:11434').trim().replace(/\/$/, '');
    url = `${baseUrl}/v1/chat/completions`;
    body = {
      model: config.model?.trim() || 'llama3.2',
      messages,
      temperature,
    };
  } else {
    throw new AIError('invalid_provider', `Unsupported AI provider: ${provider}`);
  }

  let response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });
  } catch (error) {
    throw new AIError(
      'network',
      `Network error when reaching ${provider === 'ollama' ? 'Ollama local server' : provider}. Check your connection and try again.`,
      error,
    );
  }

  if (!response.ok) {
    throw await buildHttpError(provider, response);
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

async function buildHttpError(provider, response) {
  if (response.status === 401 || response.status === 403) {
    return new AIError(
      'invalid_key',
      `API key rejected by ${provider === 'openrouter' ? 'OpenRouter' : provider}. Please check your credentials in settings.`,
    );
  }

  if (response.status === 429) {
    return new AIError(
      'rate_limit',
      `Rate limited by ${provider}. Please wait a moment and try again.`,
    );
  }

  let detail = '';
  try {
    const data = await response.json();
    detail = data?.error?.message ? ` ${data.error.message}` : '';
  } catch {
    detail = '';
  }

  return new AIError(
    'api_error',
    `${provider === 'openrouter' ? 'OpenRouter' : provider} responded with error code ${response.status}.${detail}`.trim(),
  );
}
