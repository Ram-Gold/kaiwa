import { getPersonaById } from '../prompts/personas.js';
import { splitConversationHistory } from './contextManagement.js';

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
      .filter((suggestion) => typeof suggestion === 'object' && suggestion !== null && typeof suggestion.text === 'string')
      .map((suggestion) => ({
        text: suggestion.text.trim(),
        isCorrect: Boolean(suggestion.isCorrect),
        explanation: typeof suggestion.explanation === 'string' ? suggestion.explanation.trim() : ''
      }))
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

async function summarizeOldMessages(provider, apiKey, messagesToSummarize) {
  if (!messagesToSummarize || messagesToSummarize.length === 0) return '';
  
  const formattedMessages = messagesToSummarize.map(m => `${m.role.toUpperCase()}: ${m.content}`).join('\n\n');
  const systemPrompt = 'Summarize these earlier chat messages to retain important facts, user preferences, and overall conversation flow for a language learning context. Return ONLY the summary, no meta-commentary.';
  const userMessage = `Messages to summarize:\n${formattedMessages}`;
  
  try {
    let payload;
    if (provider === 'ollama') {
      payload = {
        model: 'llama3',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage }
        ],
        stream: false,
      };
    } else if (provider === 'openai') {
      payload = {
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage }
        ],
        temperature: 0.2,
      };
    } else if (provider === 'gemini') {
      payload = {
        model: 'gemini-1.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage }
        ],
        temperature: 0.2,
      };
    } else if (provider === 'claude') {
      payload = {
        model: 'claude-3-5-haiku-20241022',
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
    else if (provider === 'openai' || provider === 'gemini') summary = data?.choices?.[0]?.message?.content;
    else if (provider === 'claude') summary = data?.content?.[0]?.text;
    
    return summary ? summary.trim() : '';
  } catch (err) {
    console.warn('Failed to summarize older messages:', err);
    return '';
  }
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
    const normalizedHistory = normalizeHistory(conversationHistory);
    
    // Allocate token budget (Ollama has smaller context window by default)
    const tokenBudget = provider === 'ollama' ? 4000 : 6000;
    const { recent, olderToSummarize } = splitConversationHistory(normalizedHistory, tokenBudget);
    
    let activeSystemPrompt = persona.systemPrompt;
    
    // Inject user's About Me & Persona Context from settings
    if (typeof window !== 'undefined') {
      try {
        const userPersona = window.localStorage.getItem('kaiwa.user.persona') || '';
        const rawProfile = window.localStorage.getItem('kaiwa.user.profile');
        let aboutMe = '';
        if (rawProfile) {
          const parsed = JSON.parse(rawProfile);
          aboutMe = parsed.aboutMe || '';
        }
        const contextParts = [];
        if (userPersona.trim()) contextParts.push(`Learner Persona Context: ${userPersona.trim()}`);
        if (aboutMe.trim()) contextParts.push(`Learner Bio & Background: ${aboutMe.trim()}`);
        if (contextParts.length > 0) {
          activeSystemPrompt += `\n\n[Learner Profile & Context]:\n${contextParts.join('\n')}`;
        }
      } catch (e) {
        // Ignore parsing errors
      }
    }
    
    // Summarize older history if necessary to prevent context window bloat
    if (olderToSummarize.length > 0) {
      const summaryText = await summarizeOldMessages(provider, cleanKey, olderToSummarize);
      if (summaryText) {
        activeSystemPrompt += `\n\n[Earlier conversation summary]:\n${summaryText}`;
      }
    }

    let payload;

    if (provider === 'ollama') {
      payload = {
        model: 'llama3',
        messages: [
          { role: 'system', content: activeSystemPrompt },
          ...recent,
          { role: 'user', content: cleanMessage },
        ],
        stream: false,
      };
    } else if (provider === 'openai') {
      payload = {
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: activeSystemPrompt },
          ...recent,
          { role: 'user', content: cleanMessage },
        ],
        temperature: 0.8,
      };
    } else if (provider === 'openrouter') {
      payload = {
        model: 'meta-llama/llama-3.3-70b-instruct:free',
        messages: [
          { role: 'system', content: activeSystemPrompt },
          ...recent,
          { role: 'user', content: cleanMessage },
        ],
        temperature: 0.8,
      };
    } else if (provider === 'gemini') {
      payload = {
        model: 'gemini-1.5-flash',
        messages: [
          { role: 'system', content: activeSystemPrompt },
          ...recent,
          { role: 'user', content: cleanMessage },
        ],
        temperature: 0.8,
      };
    } else if (provider === 'claude') {
      payload = {
        model: 'claude-3-5-haiku-20241022',
        system: activeSystemPrompt,
        messages: [...recent, { role: 'user', content: cleanMessage }],
        max_tokens: 1024,
        temperature: 0.8,
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
    let payload;
    if (provider === 'ollama') {
      payload = {
        model: 'llama3',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: cleanText },
        ],
        stream: false,
      };
    } else if (provider === 'openai') {
      payload = {
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: cleanText },
        ],
        temperature: 0.2,
      };
    } else if (provider === 'gemini') {
      payload = {
        model: 'gemini-1.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: cleanText },
        ],
        temperature: 0.2,
      };
    } else if (provider === 'claude') {
      payload = {
        model: 'claude-3-5-haiku-20241022',
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
