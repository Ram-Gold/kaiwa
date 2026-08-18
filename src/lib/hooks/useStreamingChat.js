'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { getPersonaById } from '../../prompts/personas.js';
import { assembleSystemPrompt, getAIModelConfig, isStreamingEnabled } from '../ai/config.js';
import { parseModelReply } from '../ai.js';

/**
 * Custom React Hook for Token-by-Token Streaming AI Conversation
 * in KAIwa ("AI Kaiwa").
 */
export function useStreamingChat({
  personaId = 'sensei',
  provider = 'anthropic',
  apiKey = '',
  model = '',
  userContext = {},
  initialMessages = [],
  storageKey = '',
} = {}) {
  const [messages, setMessages] = useState(initialMessages);
  const [isThinking, setIsThinking] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [error, setError] = useState(null);

  const abortControllerRef = useRef(null);
  const readerRef = useRef(null);

  // Restore messages from storage if key provided and initialMessages empty
  useEffect(() => {
    if (storageKey && typeof window !== 'undefined') {
      try {
        const saved = window.localStorage.getItem(storageKey);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setMessages(parsed);
          }
        }
      } catch {
        // Ignore storage errors
      }
    }
  }, [storageKey]);

  // Persist messages helper
  const persistMessages = useCallback(
    (newMessages) => {
      if (storageKey && typeof window !== 'undefined') {
        try {
          window.localStorage.setItem(storageKey, JSON.stringify(newMessages));
        } catch {
          // Ignore
        }
      }
    },
    [storageKey]
  );

  const stop = useCallback(() => {
    if (readerRef.current) {
      try {
        readerRef.current.cancel();
      } catch {
        // Ignore
      }
      readerRef.current = null;
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsStreaming(false);
    setIsThinking(false);
  }, []);

  const sendMessage = useCallback(
    async (userInput, overrideOptions = {}) => {
      if (!userInput && !overrideOptions.isInitialGreeting) return;

      setError(null);

      const activeProvider = overrideOptions.provider || provider || 'anthropic';
      const activeApiKey = overrideOptions.apiKey !== undefined ? overrideOptions.apiKey : apiKey;
      const activeModel = overrideOptions.model || model;
      const activePersonaId = overrideOptions.personaId || personaId || 'sensei';

      const persona = getPersonaById(activePersonaId);
      const systemPrompt = assembleSystemPrompt(persona, userContext);
      const modelConfig = getAIModelConfig(activeProvider, activeModel);

      const userMsg = userInput
        ? {
            id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            role: 'user',
            content: userInput,
            timestamp: Date.now(),
          }
        : null;

      const assistantMsgId = `asst-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      const assistantPlaceholder = {
        id: assistantMsgId,
        role: 'assistant',
        content: '',
        rawContent: '',
        suggestions: [],
        timestamp: Date.now(),
        isPartial: true,
      };

      let currentHistory = [];
      setMessages((prev) => {
        const withUser = userMsg ? [...prev, userMsg] : [...prev];
        currentHistory = withUser;
        const next = [...withUser, assistantPlaceholder];
        persistMessages(next);
        return next;
      });

      setIsThinking(true);
      setIsStreaming(true);

      const controller = new AbortController();
      abortControllerRef.current = controller;

      // Format history for backend API
      const formattedHistory = currentHistory
        .filter((m) => m.content && m.content.trim())
        .map((m) => ({
          role: m.role === 'user' ? 'user' : 'assistant',
          content: m.content,
        }));

      let payload;
      if (activeProvider === 'anthropic' || activeProvider === 'claude') {
        payload = {
          model: modelConfig.model,
          system: systemPrompt,
          messages: formattedHistory,
          max_tokens: 2048,
          temperature: modelConfig.temperature,
        };
      } else {
        payload = {
          model: modelConfig.model,
          messages: [
            { role: 'system', content: systemPrompt },
            ...formattedHistory,
          ],
          temperature: modelConfig.temperature,
          max_tokens: 2048,
        };
      }

      let accumulatedRaw = '';

      try {
        const response = await fetch('/api/chat/stream', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            provider: activeProvider,
            apiKey: activeApiKey,
            payload,
            thinkingEnabled: isStreamingEnabled(),
          }),
          signal: controller.signal,
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.error || `Streaming request failed with status ${response.status}`);
        }

        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error('ReadableStream not supported by response');
        }
        readerRef.current = reader;

        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          if (controller.signal.aborted) {
            break;
          }
          const { value, done } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed.startsWith('data:')) continue;

            const jsonStr = trimmed.replace(/^data:\s*/, '');
            try {
              const parsedData = JSON.parse(jsonStr);
              if (parsedData.token) {
                setIsThinking(false);
                accumulatedRaw += parsedData.token;
                let cleanDisplay = accumulatedRaw.split(/SUGGESTIONS:/i)[0].trim();
                cleanDisplay = cleanDisplay.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
                cleanDisplay = cleanDisplay.replace(/^Here(?:'s| is) (?:a )?thinking process:[\s\S]*?(?=[\u3040-\u309f\u30a0-\u30ff\u4e00-\u9fff])/i, '').trim();
                const jpIdx = cleanDisplay.search(/[\u3040-\u309f\u30a0-\u30ff\u4e00-\u9fff]{2,}/);
                if (jpIdx > 10) {
                  cleanDisplay = cleanDisplay.slice(jpIdx).trim();
                }

                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === assistantMsgId
                      ? {
                          ...msg,
                          content: cleanDisplay || accumulatedRaw,
                          rawContent: accumulatedRaw,
                        }
                      : msg
                  )
                );
              }
              if (parsedData.done) {
                break;
              }
            } catch {
              // Ignore partial JSON
            }
          }
        }

        // Final completion parse
        const finalParsed = parseModelReply(accumulatedRaw);
        setSuggestions(finalParsed.suggestions || []);

        setMessages((prev) => {
          const finalMessages = prev.map((msg) =>
            msg.id === assistantMsgId
              ? {
                  ...msg,
                  content: finalParsed.text,
                  rawContent: accumulatedRaw,
                  suggestions: finalParsed.suggestions || [],
                  isPartial: false,
                }
              : msg
          );
          persistMessages(finalMessages);
          return finalMessages;
        });
      } catch (err) {
        if (err.name === 'AbortError' || controller.signal.aborted) {
          // Cleanly handle user abort / stop button
          const partialParsed = parseModelReply(accumulatedRaw);
          setMessages((prev) => {
            const partialMessages = prev.map((msg) =>
              msg.id === assistantMsgId
                ? {
                    ...msg,
                    content: partialParsed.text || accumulatedRaw || '(Stopped)',
                    rawContent: accumulatedRaw,
                    suggestions: partialParsed.suggestions || [],
                    isPartial: false,
                  }
                : msg
            );
            persistMessages(partialMessages);
            return partialMessages;
          });
        } else {
          console.error('useStreamingChat error:', err);
          setError(err.message || 'Error generating streaming reply');
        }
      } finally {
        setIsStreaming(false);
        setIsThinking(false);
        readerRef.current = null;
        abortControllerRef.current = null;
      }
    },
    [personaId, provider, apiKey, model, userContext, persistMessages]
  );

  const clearMessages = useCallback(() => {
    stop();
    setMessages([]);
    setSuggestions([]);
    if (storageKey && typeof window !== 'undefined') {
      try {
        window.localStorage.removeItem(storageKey);
      } catch {
        // Ignore
      }
    }
  }, [storageKey, stop]);

  return {
    messages,
    setMessages,
    isThinking,
    isStreaming,
    suggestions,
    error,
    sendMessage,
    stop,
    clearMessages,
  };
}
