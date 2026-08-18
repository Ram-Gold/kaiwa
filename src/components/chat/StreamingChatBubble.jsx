'use client';

import React, { useState } from 'react';
import { IoVolumeHighSharp, IoLanguageSharp, IoGlobeOutline, IoSparklesSharp } from 'react-icons/io5';
import JapaneseText from './JapaneseText.jsx';
import { speakJapanese } from '../../lib/speech.js';
import { translateJapaneseToEnglish } from '../../lib/translation.js';
import { parsePartialJsonStream, isStreamingEnabled } from '../../lib/ai/config.js';
import { formatDuration } from '../../lib/ai/metrics.js';
import { cn } from '../../lib/utils.js';

function Avatar({ label = '会', tone = 'default' }) {
  const toneClasses = {
    default: 'border-border bg-mustard text-ink',
    error: 'border-border bg-shu text-paper',
    user: 'border-border bg-ai text-paper',
  };

  return (
    <div
      className={cn(
        'brutal-border grid h-10 w-10 shrink-0 place-items-center font-display text-sm font-black shadow-nav select-none',
        toneClasses[tone] || toneClasses.default
      )}
      aria-hidden="true"
    >
      {label}
    </div>
  );
}

export default function StreamingChatBubble({
  message,
  persona,
  isLiveStreaming = false,
  onPickSuggestion,
  meta = {},
}) {
  const [showRomaji, setShowRomaji] = useState(false);
  const [showTranslation, setShowTranslation] = useState(false);
  const [currentTranslation, setCurrentTranslation] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);

  const isUser = message.role === 'user';
  const isError = message.role === 'error';

  const [isThinkingOpen, setIsThinkingOpen] = useState(true);

  // Parse internal thinking vs spoken dialogue from JSON schema
  const rawText = message.rawContent || message.content || '';
  const parsed = parsePartialJsonStream(rawText);
  // DEFENSE LAYER: Only show thinking when the developer setting is ON
  const thinkingOn = isStreamingEnabled();
  const thinking = thinkingOn ? (message.thoughtProcess || parsed.thoughtProcess) : null;
  let speech = parsed.dialogue || message.content || '';
  
  // Fallback: If no parsed dialogue and it's not a stream, maybe the content is already the plain Japanese string
  if (!parsed.dialogue && !isLiveStreaming && typeof message.content === 'string' && !message.content.includes('"dialogue"')) {
    speech = message.content;
  }

  const isThinkingStream = thinkingOn ? parsed.isThinkingStream : false;

  async function handleToggleTranslate() {
    if (showTranslation) {
      setShowTranslation(false);
      return;
    }
    if (currentTranslation) {
      setShowTranslation(true);
      return;
    }
    setIsTranslating(true);
    const textToTranslate = speech || message.content;
    const result = await translateJapaneseToEnglish(textToTranslate);
    setCurrentTranslation(result);
    setShowTranslation(true);
    setIsTranslating(false);
  }

  function handleSpeak() {
    speakJapanese(speech || message.content);
  }

  if (isUser) {
    return (
      <div className="flex justify-end" data-testid="user-message">
        <article className="brutal-border max-w-[88%] bg-ai px-4 py-3 text-paper shadow-shadow sm:max-w-[75%]">
          <p className="font-mono text-[10px] font-black uppercase tracking-[0.18em] opacity-75">
            You
          </p>
          <p className="mt-1 whitespace-pre-wrap font-semibold leading-7">{message.content}</p>
        </article>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex items-start gap-3" data-testid="error-message">
        <Avatar label="!" tone="error" />
        <article className="brutal-border max-w-[88%] bg-shu px-4 py-3 text-paper shadow-shadow sm:max-w-[75%]">
          <p className="font-mono text-[10px] font-black uppercase tracking-[0.18em] opacity-75">
            Error
          </p>
          <p className="mt-1 whitespace-pre-wrap font-semibold leading-7">{message.content}</p>
        </article>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-3" data-testid="assistant-message">
      <Avatar label={persona?.jp || '会'} />

      <div className="flex max-w-[calc(100%-3.5rem)] flex-col gap-2 sm:max-w-[34rem]">
        <article className="brutal-border max-w-full bg-paper px-4 py-3 text-ink shadow-shadow">
          <div className="flex items-start justify-between gap-3 mb-1">
            <p className="font-mono text-[10px] font-black uppercase tracking-[0.18em] opacity-75">
              {persona?.name || 'Kaiwa'}
            </p>
            {isLiveStreaming && (
              <span className="flex items-center gap-1 font-mono text-[10px] font-black uppercase text-moss animate-pulse">
                <span className="h-2 w-2 rounded-full bg-moss" />
                Live
              </span>
            )}
          </div>

          {/* 1. CONNECTED THINKING UI — Connected Top Panel */}
          {thinking ? (
            <div
              className="-mx-4 -mt-3 mb-3 border-b-2 border-dashed border-ink/15 bg-gray-50/90 p-3 text-xs"
              data-testid="thinking-block"
            >
              <button
                type="button"
                onClick={() => setIsThinkingOpen(!isThinkingOpen)}
                className="flex w-full items-center justify-between gap-1 text-left hover:opacity-80 transition"
                aria-label="Toggle thinking process"
              >
                <div className="flex items-center gap-1.5">
                  <IoSparklesSharp className="text-[10px] text-mustard" />
                  <span className="font-mono text-[9px] font-bold uppercase tracking-wider text-ink/50">
                    Thinking / 思考中
                  </span>
                  {isLiveStreaming && isThinkingStream && (
                    <span className="inline-block h-1.5 w-1.5 rounded-full bg-mustard animate-ping ml-1" />
                  )}
                </div>
                <span className="font-mono text-[8px] font-bold text-ink/40 uppercase">
                  {isThinkingOpen ? 'Hide ▲' : 'Show ▼'}
                </span>
              </button>
              {isThinkingOpen && (
                <div className="mt-1.5 max-h-28 overflow-y-auto pr-1">
                  <p className="whitespace-pre-wrap font-mono text-[11px] leading-relaxed text-gray-400 italic">
                    {thinking}
                    {isLiveStreaming && isThinkingStream && (
                      <span className="inline-block w-1.5 h-3 ml-0.5 bg-gray-300 animate-pulse align-middle" />
                    )}
                  </p>
                </div>
              )}
            </div>
          ) : null}

          {/* 2. CONNECTED SAYING UI (Crisp Bold Black Text for Japanese Speech) */}
          {(speech || (!thinking && isLiveStreaming)) && (
            <div className="mt-2 font-jp text-lg font-bold leading-8 text-black" data-testid="saying-block">
              {isLiveStreaming && !isThinkingStream ? (
                <span className="whitespace-pre-wrap text-black font-black">
                  {speech}
                  <span className="inline-block w-2 h-5 ml-1 bg-black animate-pulse align-middle" />
                </span>
              ) : (
                <div className="whitespace-pre-wrap text-black font-black">
                  <JapaneseText text={speech || message.content} />
                </div>
              )}
            </div>
          )}

          {/* Translation display */}
          {showTranslation && (
            <div className="mt-3 border-t border-ink/10 pt-2">
              <p className="font-mono text-[10px] font-black uppercase tracking-[0.14em] text-ink/60">
                Translation
              </p>
              <p className="mt-1 text-sm font-semibold text-ink/80">
                {isTranslating ? 'Translating...' : currentTranslation || 'No translation available.'}
              </p>
            </div>
          )}

          {/* Action buttons (Listen, Translate) */}
          {!isLiveStreaming && (speech || message.content) && (
            <div className="mt-3 flex items-center gap-2 border-t border-ink/10 pt-2">
              <button
                type="button"
                onClick={handleSpeak}
                aria-label="Listen to pronunciation"
                className="brutal-border flex items-center gap-1 bg-white px-2 py-1 font-mono text-xs font-bold shadow-nav transition-all hover:bg-mustard"
              >
                <IoVolumeHighSharp />
                <span>Audio</span>
              </button>
              <button
                type="button"
                onClick={handleToggleTranslate}
                aria-label="Toggle translation"
                className="brutal-border flex items-center gap-1 bg-white px-2 py-1 font-mono text-xs font-bold shadow-nav transition-all hover:bg-mustard"
              >
                <IoLanguageSharp />
                <span>Translate</span>
              </button>
            </div>
          )}

          {/* Metadata footer: tokens, time, cost */}
          {(meta?.tokens || meta?.durationMs || message.meta?.tokens || message.meta?.durationMs) && (
            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-0.5 border-t border-ink/10 pt-1.5 font-mono text-[9px] font-semibold text-ink/35" data-testid="message-meta">
              {(meta?.tokens || message.meta?.tokens) ? <span>{meta?.tokens || message.meta?.tokens} tokens</span> : null}
              {(meta?.durationMs || message.meta?.durationMs) ? <span>{formatDuration(meta?.durationMs || message.meta?.durationMs)}</span> : null}
              {(meta?.cost || message.meta?.cost) ? <span>${(meta?.cost || message.meta?.cost).toFixed(6)}</span> : null}
            </div>
          )}
        </article>

        {/* Suggestions / Options if present */}
        {!isLiveStreaming && Array.isArray(message.suggestions) && message.suggestions.length > 0 && (
          <div className="mt-1 space-y-1.5" data-testid="suggestion-options">
            <p className="font-mono text-[10px] font-black uppercase tracking-[0.14em] text-ink/60 px-1">
              Suggested Responses:
            </p>
            {message.suggestions.slice(0, 5).map((opt, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => onPickSuggestion && onPickSuggestion(opt.text)}
                className="brutal-border w-full text-left bg-white p-2.5 shadow-nav transition-all hover:bg-mustard active:scale-[0.99] flex flex-col gap-0.5"
              >
                <span className="font-jp text-sm font-bold text-ink">
                  <JapaneseText text={opt.text} enableDictionary={false} />
                </span>
                {opt.english && (
                  <span className="text-xs font-medium text-ink/70">{opt.english}</span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
