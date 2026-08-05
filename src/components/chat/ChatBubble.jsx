import { useState } from 'react';
import { IoVolumeHighSharp, IoLanguageSharp, IoGlobeOutline, IoCheckmarkSharp } from 'react-icons/io5';
import { getKnownRomajiGlosses, toRomajiText } from '../../lib/japaneseText.js';
import { speakJapanese } from '../../lib/speech.js';
import { translateJapaneseToEnglish } from '../../lib/translation.js';
import JapaneseText from './JapaneseText.jsx';
import SuggestionChips from './SuggestionChips.jsx';
import { cn } from '../../lib/utils.js';

export default function ChatBubble({
  isTranslating = false,
  message,
  onPickSuggestion,
  onTranslate,
  persona,
  suggestions = [],
  suggestionsDisabled = false,
  translation,
}) {
  const [showRomaji, setShowRomaji] = useState(false);
  const [showTranslation, setShowTranslation] = useState(Boolean(translation));
  const [currentTranslation, setCurrentTranslation] = useState(translation || '');
  const [isTranslatingLocal, setIsTranslatingLocal] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  const isUser = message.role === 'user';
  const isError = message.role === 'error';
  const canUseAiTools = message.role === 'assistant';
  const romajiGlosses = canUseAiTools ? getKnownRomajiGlosses(message.content) : [];
  const romajiText = canUseAiTools ? toRomajiText(message.content) : '';

  async function handleToggleTranslate() {
    if (onTranslate) {
      onTranslate(message);
    }
    
    if (showTranslation) {
      setShowTranslation(false);
      return;
    }

    if (currentTranslation || translation) {
      setShowTranslation(true);
      return;
    }

    setIsTranslatingLocal(true);
    const result = await translateJapaneseToEnglish(message.content);
    setCurrentTranslation(result);
    setShowTranslation(true);
    setIsTranslatingLocal(false);
  }

  function handleToggleSpeaker() {
    const active = speakJapanese(message.content);
    setIsPlayingAudio(active);
  }

  if (isUser) {
    return (
      <div className="animate-message-in flex justify-end">
        <article className="brutal-border max-w-[88%] bg-ai px-4 py-3 text-paper shadow-shadow sm:max-w-[72%]">
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
      <div className="animate-message-in flex items-start gap-3">
        <Avatar label="!" tone="error" />
        <article className="brutal-border max-w-[88%] bg-shu px-4 py-3 text-paper shadow-shadow sm:max-w-[72%]">
          <p className="font-mono text-[10px] font-black uppercase tracking-[0.18em] opacity-75">
            Error
          </p>
          <p className="mt-1 whitespace-pre-wrap font-semibold leading-7">{message.content}</p>
        </article>
      </div>
    );
  }

  return (
    <div className="animate-message-in flex items-start gap-3">
      <Avatar label={persona?.jp || '会'} />

      <div className="flex max-w-[calc(100%-3.5rem)] flex-col gap-2 sm:max-w-none">
        <article className="brutal-border max-w-full bg-paper px-4 py-3 text-ink shadow-shadow sm:max-w-[34rem]">
          <div className="flex items-start justify-between gap-3">
            <p className="font-mono text-[10px] font-black uppercase tracking-[0.18em] opacity-75">
              {persona?.name || 'Kaiwa'}
            </p>
          </div>

          {/* Japanese text with clickable underlined dictionary words */}
          <p className="mt-2 whitespace-pre-wrap font-jp text-lg font-bold leading-8">
            <JapaneseText text={message.content} />
          </p>

          {/* Romaji conversion box */}
          {showRomaji && (
            <div className="animate-panel-in mt-3 brutal-border bg-mustard/30 p-3 text-ink shadow-nav">
              <span className="label-mono block text-ai text-[10px]">Romaji Reading</span>
              <p className="mt-1 font-mono text-sm font-black italic">{romajiText || 'Nihongo'}</p>
              {romajiGlosses.length > 0 && (
                <div className="mt-2 border-t border-border/40 pt-2 text-xs">
                  {romajiGlosses.map((item) => (
                    <span key={item.term} className="mr-3 inline-block font-bold">
                      <span className="font-black text-shu">{item.term}</span> ({item.romaji}): {item.meaning}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* English translation box */}
          {showTranslation && (currentTranslation || translation) && (
            <div className="animate-panel-in mt-3 border-t-[3px] border-border pt-3">
              <div className="brutal-border bg-white px-3 py-2 text-sm font-bold leading-6 text-ink shadow-shadow">
                <span className="label-mono block text-shu">English Translation</span>
                {currentTranslation || translation}
              </div>
            </div>
          )}

          {/* 3 Circular Action Icons matching wireframe */}
          <div className="mt-4 flex items-center gap-3 border-t-[3px] border-border pt-3">
            {/* 1. Speaker Icon */}
            <button
              type="button"
              aria-label="Speak Japanese audio"
              title="Speak Japanese (Web Speech API)"
              onClick={handleToggleSpeaker}
              className={cn(
                'brutal-border grid h-9 w-9 place-items-center rounded-full bg-white transition-all hover:bg-mustard active:scale-95',
                isPlayingAudio && 'bg-mustard ring-2 ring-ink'
              )}
            >
              <IoVolumeHighSharp className="text-base text-ink" />
            </button>

            {/* 2. Romaji Icon */}
            <button
              type="button"
              aria-label="Toggle Romaji reading"
              title="Toggle Romaji conversion"
              onClick={() => setShowRomaji(!showRomaji)}
              className={cn(
                'brutal-border grid h-9 w-9 place-items-center rounded-full bg-white transition-all hover:bg-mustard active:scale-95',
                showRomaji && 'bg-mustard ring-2 ring-ink'
              )}
            >
              <IoLanguageSharp className="text-base text-ink" />
            </button>

            {/* 3. Translate Icon */}
            <button
              type="button"
              aria-label="Translate Japanese to English"
              title="Translate with API"
              disabled={isTranslating || isTranslatingLocal}
              onClick={handleToggleTranslate}
              className={cn(
                'brutal-border grid h-9 w-9 place-items-center rounded-full bg-white transition-all hover:bg-mustard active:scale-95 disabled:opacity-50',
                showTranslation && 'bg-mustard ring-2 ring-ink'
              )}
            >
              <IoGlobeOutline className={cn("text-base text-ink", isTranslatingLocal && "animate-spin")} />
            </button>
          </div>
        </article>

        {suggestions.length > 0 && (
          <aside className="animate-panel-in flex flex-col items-end gap-2 sm:max-w-[34rem]">
            <p className="label-mono text-ai">Try replying</p>
            <SuggestionChips
              disabled={suggestionsDisabled}
              suggestions={suggestions}
              onPickSuggestion={onPickSuggestion}
            />
          </aside>
        )}
      </div>
    </div>
  );
}

function Avatar({ label, tone = 'normal' }) {
  return (
    <div
      className={`brutal-border grid h-11 w-11 shrink-0 place-items-center rounded-full font-display text-sm shadow-shadow ${
        tone === 'error' ? 'bg-shu text-paper' : 'bg-mustard text-ink'
      }`}
      aria-hidden="true"
    >
      {label}
    </div>
  );
}
