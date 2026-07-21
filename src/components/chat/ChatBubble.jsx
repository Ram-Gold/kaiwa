import { useState } from 'react';
import { getKnownRomajiGlosses } from '../../lib/japaneseText.js';
import { speakJapanese } from '../../lib/speech.js';
import JapaneseText from './JapaneseText.jsx';
import SuggestionChips from './SuggestionChips.jsx';
import AnimatedPopover from '../ui/AnimatedPopover.jsx';

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
  const isUser = message.role === 'user';
  const isError = message.role === 'error';
  const canUseAiTools = message.role === 'assistant';
  const romajiGlosses = canUseAiTools ? getKnownRomajiGlosses(message.content) : [];

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

          <p className="mt-1 whitespace-pre-wrap font-semibold leading-7">
            <JapaneseText text={message.content} />
          </p>

          {translation && (
            <div className="animate-panel-in mt-3 space-y-3 border-t-[3px] border-border pt-3">
              <div className="brutal-border bg-white px-3 py-2 text-sm font-bold leading-6 text-ink shadow-shadow">
                <span className="label-mono block text-shu">English</span>
                {translation}
              </div>
            </div>
          )}

          <div className="mt-3 flex items-center justify-end gap-2 border-t-[3px] border-border pt-3 relative">
            <IconButton
              disabled={isTranslating}
              label="Translate to English"
              onClick={() => onTranslate(message)}
            >
              translate
            </IconButton>
            <div className="relative">
              <IconButton
                label="Show romaji and meanings"
                onClick={() => setShowRomaji((visible) => !visible)}
              >
                abc
              </IconButton>
              <AnimatedPopover
                show={showRomaji}
                className="absolute right-1/2 translate-x-1/2 top-full mt-4 z-20 w-64 flex flex-col"
              >
                <div className="brutal-border bg-mustard px-3 py-2 text-sm font-bold leading-6 text-ink shadow-shadow before:absolute before:left-1/2 before:-translate-x-1/2 before:-top-[9px] before:w-4 before:h-4 before:bg-mustard before:border-l-[3px] before:border-t-[3px] before:border-border before:rotate-45">
                  <span className="label-mono block text-ai">Romaji + glosses</span>
                  {romajiGlosses.length ? (
                    <div className="mt-2 space-y-2 relative z-10">
                      {romajiGlosses.map((item) => (
                        <p key={item.term}>
                          <span className="font-black">{item.term}</span> · {item.romaji} ·{' '}
                          {item.meaning}
                        </p>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-2 relative z-10">No local dictionary matches yet.</p>
                  )}
                </div>
              </AnimatedPopover>
            </div>
            <IconButton label="Speak Japanese" onClick={() => speakJapanese(message.content)}>
              volume_up
            </IconButton>
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

function IconButton({ children, disabled = false, label, onClick }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      disabled={disabled}
      className="brutal-border grid h-9 w-9 place-items-center bg-paper shadow-nav transition-all hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-none hover:bg-mustard disabled:cursor-not-allowed disabled:opacity-60"
    >
      <span className="material-symbols-outlined text-[18px] leading-none">{children}</span>
    </button>
  );
}
