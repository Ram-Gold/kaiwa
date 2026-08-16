'use client';

import React, { useState } from 'react';
import { IoVolumeHighSharp, IoLanguageSharp, IoGlobeOutline } from 'react-icons/io5';
import JapaneseText from './JapaneseText.jsx';
import { speakJapanese } from '../../lib/speech.js';
import { translateJapaneseToEnglish } from '../../lib/translation.js';
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
}) {
  const [showRomaji, setShowRomaji] = useState(false);
  const [showTranslation, setShowTranslation] = useState(false);
  const [currentTranslation, setCurrentTranslation] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);

  const isUser = message.role === 'user';
  const isError = message.role === 'error';

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
    const result = await translateJapaneseToEnglish(message.content);
    setCurrentTranslation(result);
    setShowTranslation(true);
    setIsTranslating(false);
  }

  function handleSpeak() {
    speakJapanese(message.content);
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
          <div className="flex items-start justify-between gap-3">
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

          {/* Assistant Message Japanese Content */}
          <div className="mt-2 font-jp text-lg font-bold leading-8 text-ink">
            {isLiveStreaming ? (
              <span className="whitespace-pre-wrap">
                {message.content}
                <span className="inline-block w-2 h-5 ml-1 bg-ink animate-pulse align-middle" />
              </span>
            ) : (
              <p className="whitespace-pre-wrap">
                <JapaneseText text={message.content} />
              </p>
            )}
          </div>

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
          {!isLiveStreaming && message.content && (
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
                <span className="font-jp text-sm font-bold text-ink">{opt.text}</span>
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
