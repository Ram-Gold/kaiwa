'use client';

import React, { useState, useEffect } from 'react';
import {
  IoSendSharp,
  IoStopSharp,
  IoSettingsSharp,
  IoTrashSharp,
  IoChevronBackSharp,
  IoMicSharp,
  IoSparklesSharp,
} from 'react-icons/io5';
import Link from 'next/link';
import { useStreamingChat } from '../../lib/hooks/useStreamingChat.js';
import { getPersonaById, personas } from '../../prompts/personas.js';
import StreamingChatMessages from './StreamingChatMessages.jsx';
import GlobalSettingsModal from '../shell/GlobalSettingsModal.jsx';
import { isStreamingEnabled, setStreamingEnabled } from '../../lib/ai/config.js';
import { PROVIDER_STORAGE_KEY, API_KEYS_STORAGE_PREFIX, OPENROUTER_MODEL_STORAGE_KEY } from '../dashboard/AiProviderSettingsCard.jsx';
import { cn } from '../../lib/utils.js';
import { extractCleanJapaneseText } from '../../lib/japaneseText.js';

export default function StreamingChatScreen({
  initialPersonaId = 'sensei',
  title = 'AI Kaiwa (Streaming Mode)',
}) {
  const [selectedPersonaId, setSelectedPersonaId] = useState(initialPersonaId);
  const [inputVal, setInputVal] = useState('');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [streamingActive, setStreamingActive] = useState(false);

  const [provider, setProvider] = useState('ollama');
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState('');

  // Load settings from storage
  useEffect(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      const p = window.localStorage?.getItem?.(PROVIDER_STORAGE_KEY) || 'ollama';
      setProvider(p);
      setApiKey(window.localStorage?.getItem?.(`${API_KEYS_STORAGE_PREFIX}${p}`) || '');
      setModel(window.localStorage?.getItem?.(OPENROUTER_MODEL_STORAGE_KEY) || '');
      setStreamingActive(isStreamingEnabled());
    }
  }, [isSettingsOpen]);

  const currentPersona = getPersonaById(selectedPersonaId);

  const {
    messages,
    isThinking,
    isStreaming,
    suggestions,
    error,
    sendMessage,
    stop,
    clearMessages,
  } = useStreamingChat({
    personaId: selectedPersonaId,
    provider,
    apiKey,
    model,
    storageKey: `kaiwa.streaming_chat.${selectedPersonaId}`,
  });

  const handleSend = async (e) => {
    if (e) e.preventDefault();
    const textToSend = extractCleanJapaneseText(inputVal).trim();
    if (!textToSend || isStreaming || isThinking) return;

    setInputVal('');
    await sendMessage(textToSend);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handlePickSuggestion = (suggestionText) => {
    setInputVal(extractCleanJapaneseText(suggestionText));
  };

  return (
    <div className="flex h-screen w-full flex-col bg-paper text-ink overflow-hidden">
      {/* Top Navigation Bar */}
      <header className="brutal-border-b bg-white px-4 py-3 shadow-nav shrink-0 flex items-center justify-between gap-3 z-30">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="brutal-border grid h-9 w-9 place-items-center bg-paper text-ink shadow-nav transition hover:bg-mustard"
            aria-label="Back to home"
          >
            <IoChevronBackSharp />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-display text-lg font-bold leading-tight sm:text-xl">{title}</h1>
              <span className="brutal-border bg-soft-blue px-1.5 py-0.5 font-mono text-[10px] font-black uppercase text-ink">
                SSE Live
              </span>
            </div>
            <p className="font-mono text-[10px] font-black uppercase tracking-wider text-ink/60">
              Provider: <span className="text-ai">{provider}</span>
            </p>
          </div>
        </div>

        {/* Persona selector and Settings Actions */}
        <div className="flex items-center gap-2">
          <select
            value={selectedPersonaId}
            onChange={(e) => setSelectedPersonaId(e.target.value)}
            className="brutal-border bg-paper px-2 py-1.5 font-mono text-xs font-bold text-ink shadow-nav outline-none cursor-pointer hover:bg-mustard"
            aria-label="Select Persona"
          >
            {personas.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.jp || '日'})
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={clearMessages}
            aria-label="Clear conversation"
            title="Clear conversation"
            className="brutal-border grid h-9 w-9 place-items-center bg-paper text-ink shadow-nav transition hover:bg-mustard"
          >
            <IoTrashSharp />
          </button>

          <button
            type="button"
            onClick={() => setIsSettingsOpen(true)}
            aria-label="Open Settings"
            title="AI & Provider Settings"
            className="brutal-border grid h-9 w-9 place-items-center bg-mustard text-ink shadow-nav transition hover:brightness-105"
          >
            <IoSettingsSharp />
          </button>
        </div>
      </header>

      {/* Main Chat Messages Container */}
      <main className="flex-1 flex flex-col min-h-0 relative max-w-4xl w-full mx-auto">
        {error && (
          <div className="mx-4 mt-3 brutal-border bg-shu p-3 text-paper shadow-shadow flex items-center justify-between">
            <span className="font-mono text-xs font-bold">{error}</span>
            <button
              type="button"
              onClick={() => setIsSettingsOpen(true)}
              className="brutal-border bg-paper px-2 py-1 font-mono text-[10px] font-black text-ink uppercase"
            >
              Check Settings
            </button>
          </div>
        )}

        <StreamingChatMessages
          messages={messages}
          persona={currentPersona}
          isThinking={isThinking}
          isStreaming={isStreaming}
          onPickSuggestion={handlePickSuggestion}
          className="flex-1"
        />

        {/* Suggestion Chips drawer if suggestions available */}
        {suggestions.length > 0 && !isStreaming && (
          <div className="px-4 py-2 border-t border-ink/10 bg-white/60 backdrop-blur-sm">
            <p className="flex items-center gap-1 font-mono text-[10px] font-black uppercase text-ink/60 mb-1.5">
              <IoSparklesSharp className="text-mustard" /> Quick Responses:
            </p>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {suggestions.map((s, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handlePickSuggestion(s.text)}
                  className="brutal-border bg-white px-3 py-1.5 text-left font-jp text-xs font-bold text-ink shadow-nav whitespace-nowrap hover:bg-mustard shrink-0 active:scale-95"
                >
                  {s.text}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input Composer Section */}
        <div className="brutal-border-t bg-white p-3 shadow-nav shrink-0">
          <form onSubmit={handleSend} className="flex items-center gap-2">
            <input
              type="text"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your message in Japanese (日本語で入力)..."
              disabled={isStreaming || isThinking}
              className={cn(
                'brutal-border flex-1 bg-paper px-4 py-3 font-jp text-sm font-bold text-ink shadow-shadow outline-none transition',
                (isStreaming || isThinking) && 'opacity-60 cursor-not-allowed'
              )}
            />

            {/* Dynamic Send / Stop Button */}
            {isStreaming || isThinking ? (
              <button
                type="button"
                onClick={stop}
                aria-label="Stop generation"
                className="brutal-border flex items-center gap-1.5 bg-shu px-4 py-3 font-mono text-xs font-black uppercase text-paper shadow-shadow transition hover:brightness-110 active:scale-95 shrink-0"
              >
                <IoStopSharp className="text-base" />
                <span className="hidden sm:inline">Stop</span>
              </button>
            ) : (
              <button
                type="submit"
                disabled={!inputVal.trim()}
                aria-label="Send message"
                className={cn(
                  'brutal-border flex items-center gap-1.5 bg-ai px-4 py-3 font-mono text-xs font-black uppercase text-paper shadow-shadow transition hover:brightness-110 active:scale-95 shrink-0',
                  !inputVal.trim() && 'opacity-50 cursor-not-allowed'
                )}
              >
                <IoSendSharp className="text-base" />
                <span className="hidden sm:inline">Send</span>
              </button>
            )}
          </form>
        </div>
      </main>

      {/* Global Settings Modal Overlay */}
      {isSettingsOpen && (
        <GlobalSettingsModal onClose={() => setIsSettingsOpen(false)} />
      )}
    </div>
  );
}
