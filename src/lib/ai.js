import { getPersonaById } from '../prompts/personas.js';
import { splitConversationHistory } from './contextManagement.js';

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
    suggestions,
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
  return String(content || '')
    .replace(/\n?\s*SUGGESTIONS:\s*\[[\s\S]*?\][\s\S]*$/gi, '')
    .replace(/\n?\s*```(?:json)?\s*[\s\S]*?```[\s\S]*$/gi, '')
    .replace(/\n?\s*\{[\s\S]*?"SUGGESTIONS"[\s\S]*?\}[\s\S]*$/gi, '')
    .replace(/\n?\s*\[\s*\{[\s\S]*?"text"[\s\S]*?\}\s*\][\s\S]*$/gi, '');
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
        const text = String(suggestion.text || suggestion.phrase || suggestion.japanese || suggestion.option || '').trim();
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
export async function sendMessage(provider, apiKey, personaInput, conversationHistory, userMessage, openRouterModel = null) {
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
    
    // --- STEP 1: CONTEXT WINDOW & TOKEN BUDGETING ---
    // Allocate token budget (Ollama has smaller context window by default)
    const tokenBudget = provider === 'ollama' ? 4000 : 6000;
    const { recent, olderToSummarize } = splitConversationHistory(normalizedHistory, tokenBudget);
    
    // --- STEP 2: SYSTEM PROMPT & OUTPUT CONTRACT SPECIFICATION ---
    let activeSystemPrompt = persona.systemPrompt + `\n\n[MANDATORY RESPONSE FORMAT]:
At the very end of EVERY single message, you MUST append 5 response choices formatted as valid JSON:
SUGGESTIONS: [{"text": "natural Japanese reply", "isCorrect": true, "explanation": "natural phrase"}, {"text": "unnatural reply 1", "isCorrect": false, "explanation": "wrong particle"}, {"text": "unnatural reply 2", "isCorrect": false, "explanation": "wrong verb tense"}, {"text": "unnatural reply 3", "isCorrect": false, "explanation": "too formal"}, {"text": "unnatural reply 4", "isCorrect": false, "explanation": "wrong nuance"}]`;
    
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
        model: openRouterModel || 'google/gemini-2.0-flash-lite-preview-02-05:free',
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
  } else if (provider === 'openai' || provider === 'gemini' || provider === 'openrouter') {
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
  } else if (provider === 'openai' || provider === 'gemini' || provider === 'openrouter') {
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
