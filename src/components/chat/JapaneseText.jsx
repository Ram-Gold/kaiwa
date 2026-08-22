'use client';

import React, { useState, useEffect } from 'react';
import { Volume2, Bookmark, Check, X, Sparkles } from 'lucide-react';
import { tokenizeJapaneseText } from '../../lib/japaneseText.js';
import { speakJapanese } from '../../lib/speech.js';
import { fetchJlptWordDefinition } from '../../lib/jlptVocabApi.js';
import { cn } from '../../lib/utils.js';

export default function JapaneseText({ text, readingMode, enableDictionary = true, className = '' }) {
  const [activeMode, setActiveMode] = useState(() => {
    if (readingMode) return readingMode;
    if (typeof window !== 'undefined') {
      return window.localStorage?.getItem?.('kaiwa.reading_mode') || 'japanese';
    }
    return 'japanese';
  });

  useEffect(() => {
    if (readingMode) {
      setActiveMode(readingMode);
    }
  }, [readingMode]);

  useEffect(() => {
    function handleModeChange(event) {
      const newMode = event.detail?.mode || event.detail?.value || event.detail;
      if (typeof newMode === 'string') {
        setActiveMode(newMode);
      }
    }
    function handleOptionChange(event) {
      if (event.detail?.option === 'readingMode') {
        setActiveMode(event.detail.value);
      }
    }

    window.addEventListener('kaiwa:reading-mode-change', handleModeChange);
    window.addEventListener('kaiwa:conversation-option-change', handleOptionChange);
    return () => {
      window.removeEventListener('kaiwa:reading-mode-change', handleModeChange);
      window.removeEventListener('kaiwa:conversation-option-change', handleOptionChange);
    };
  }, []);

  const tokens = tokenizeJapaneseText(text, activeMode);

  const handleWordClick = (entry, e) => {
    if (!enableDictionary || !entry) return;
    const rect = e.currentTarget.getBoundingClientRect();
    window.dispatchEvent(
      new CustomEvent('kaiwa:show-dictionary', {
        detail: {
          ...entry,
          targetRect: {
            left: rect.left,
            top: rect.top,
            width: rect.width,
            height: rect.height,
            bottom: rect.bottom,
            right: rect.right,
          },
        },
      })
    );
  };

  return (
    <span className={cn('inline align-baseline leading-[2.2]', className)}>
      {tokens.map((token, index) => {
        if (token.type === 'ruby') {
          return enableDictionary ? (
            <button
              key={`ruby-${token.kanji}-${index}`}
              type="button"
              className="group/ruby inline align-baseline text-left cursor-pointer select-text bg-transparent border-0 p-0 m-0 font-inherit text-inherit focus:outline-none transition-colors hover:bg-mustard/40 px-0.5 rounded-sm"
              onClick={(e) => handleWordClick(token.entry, e)}
              title={`Reading: ${token.furigana}${token.entry?.meaning ? ` (${token.entry.meaning})` : ''}`}
            >
              <ruby className="kaiwa-ruby">
                <span className="kaiwa-rb font-bold text-inherit transition-colors">
                  {token.kanji}
                </span>
                <rt className="kaiwa-rt">{token.furigana}</rt>
              </ruby>
            </button>
          ) : (
            <ruby key={`ruby-${token.kanji}-${index}`} className="kaiwa-ruby">
              <span className="kaiwa-rb font-bold text-inherit">{token.kanji}</span>
              <rt className="kaiwa-rt">{token.furigana}</rt>
            </ruby>
          );
        }

        if (token.type === 'dictionary') {
          return (
            <span
              key={`dict-${token.text}-${index}`}
              className="inline align-baseline"
            >
              {enableDictionary ? (
                <button
                  type="button"
                  className="inline align-baseline font-bold text-inherit transition-colors hover:bg-mustard/40 px-0.5 rounded-sm cursor-pointer select-text bg-transparent border-0 p-0 m-0 font-inherit focus:outline-none"
                  onClick={(e) => handleWordClick(token.entry, e)}
                  title={`Dictionary: ${token.entry?.meaning || token.text}`}
                >
                  {token.text}
                </button>
              ) : (
                <span className="inline align-baseline">{token.text}</span>
              )}
            </span>
          );
        }

        return (
          <span key={`text-${token.text}-${index}`} className="inline align-baseline">
            {token.text}
          </span>
        );
      })}
    </span>
  );
}

/**
 * ----------------------------------------------------------------------
 * Neubrutal Kanji Stamp Dictionary Card (Left-Anchored, Z-[100] Elevated)
 * ----------------------------------------------------------------------
 */
export function DictionaryPopover({
  entry,
  onClose,
  onSave = null,
  isSaved = false,
  showSaveButton = true,
}) {
  const [apiData, setApiData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [justSaved, setJustSaved] = useState(false);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    fetchJlptWordDefinition(entry?.term || '')
      .then((res) => {
        if (isMounted) {
          setApiData(res);
          setIsLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [entry?.term]);

  const activeTerm = apiData?.term || entry?.term || '';
  const activeReading = apiData?.reading || entry?.reading || '';
  const activeRomaji = apiData?.romaji || entry?.romaji || '';
  const activeJlpt = apiData?.jlpt || entry?.jlpt || null;
  const activeMeanings = apiData?.meanings || (entry?.meaning ? [entry.meaning] : []);
  const activeExamples = apiData?.examples || entry?.examples || [];

  const saved = isSaved || justSaved;

  function handleSave() {
    if (saved || !onSave) return;
    const wordData = {
      term: activeTerm,
      reading: activeReading,
      meaning: activeMeanings.join('; '),
      jlpt: activeJlpt,
      examples: activeExamples,
    };
    onSave(wordData);
    setJustSaved(true);
  }

  // Calculate anchored positioning if targetRect is provided
  const targetRect = entry?.targetRect;
  const isAnchored = Boolean(targetRect && typeof window !== 'undefined');

  let anchorStyle = {};
  let beakLeft = 28;
  let position = 'top';

  if (isAnchored) {
    const cardWidth = 288; // 18rem
    const windowWidth = typeof window !== 'undefined' ? window.innerWidth : 1024;
    const wordLeftX = targetRect.left;
    const wordCenterX = targetRect.left + targetRect.width / 2;

    const leftPos = Math.max(12, Math.min(windowWidth - cardWidth - 12, wordLeftX - 8));
    beakLeft = Math.max(20, Math.min(cardWidth - 20, wordCenterX - leftPos));

    if (targetRect.top > 320) {
      position = 'top';
      anchorStyle = {
        position: 'fixed',
        left: `${leftPos}px`,
        top: `${targetRect.top - 10}px`,
        transform: 'translateY(-100%)',
        zIndex: 100,
      };
    } else {
      position = 'bottom';
      anchorStyle = {
        position: 'fixed',
        left: `${leftPos}px`,
        top: `${targetRect.bottom + 10}px`,
        transform: 'translateY(0)',
        zIndex: 100,
      };
    }
  }

  return (
    <div
      style={isAnchored ? anchorStyle : {}}
      className={cn(
        'w-72 rounded-2xl border-2 border-black bg-white p-4 text-ink shadow-[0_8px_0_0_#1C1C1C] transition-all duration-150 animate-in fade-in zoom-in-95 text-left z-[100] max-h-[85vh] overflow-y-auto',
        !isAnchored && 'fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2'
      )}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Speech Beak Arrow (Anchored to word) */}
      {isAnchored && (
        <span
          aria-hidden="true"
          style={{ left: `${beakLeft}px` }}
          className={cn(
            'absolute -translate-x-1/2 h-3.5 w-3.5 rotate-45 border-black bg-white',
            position === 'top'
              ? '-bottom-2 border-b-2 border-r-2'
              : '-top-2 border-t-2 border-l-2'
          )}
        />
      )}

      {/* Header with Term, JLPT tag, Speaker & Close */}
      <div className="flex items-start justify-between gap-2 border-b-2 border-black/10 pb-3 text-left">
        <div className="text-left">
          <div className="flex items-center gap-2 text-left">
            <h4 className="font-jp text-2xl font-black text-ink tracking-tight text-left">
              {activeTerm}
            </h4>
            {activeJlpt && (
              <span className="rounded-md border border-black bg-mustard px-1.5 py-0.5 font-mono text-[10px] font-black uppercase text-ink shadow-[0_1.5px_0_0_#1C1C1C]">
                {activeJlpt}
              </span>
            )}
          </div>
          <div className="mt-1 flex items-center gap-1.5 font-mono text-xs text-ink/75 text-left">
            {activeReading && (
              <span className="font-jp font-bold text-ink text-left">{activeReading}</span>
            )}
            {activeRomaji && (
              <span className="text-ink/60 text-left">• {activeRomaji}</span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={() => speakJapanese(activeTerm)}
            aria-label={`Pronounce ${activeTerm}`}
            title="Listen pronunciation"
            className="flex h-8 w-8 items-center justify-center rounded-xl border-2 border-black bg-paper text-ink shadow-[0_2px_0_0_#1C1C1C] hover:bg-mustard active:translate-y-0.5 active:shadow-none transition-all"
          >
            <Volume2 className="h-4 w-4" />
          </button>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Close dictionary"
              className="flex h-8 w-8 items-center justify-center rounded-xl text-ink/60 hover:bg-paper hover:text-ink transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Loading Indicator */}
      {isLoading && (
        <div className="my-2.5 rounded-xl border-2 border-black bg-paper p-2.5 text-center shadow-sm">
          <div className="flex items-center justify-center gap-2 font-mono text-xs font-black text-ink">
            <span className="h-2 w-2 rounded-full bg-mustard animate-ping" />
            Looking up JLPT definition...
          </div>
        </div>
      )}

      {/* Left-Aligned Definitions */}
      <div className="mt-3 space-y-2 text-left">
        {activeMeanings.length > 0 ? (
          <ol className="space-y-1 pl-4 list-decimal text-xs font-bold text-ink text-left leading-relaxed">
            {activeMeanings.slice(0, 4).map((meaning, idx) => (
              <li key={idx} className="text-left">
                {meaning}
              </li>
            ))}
          </ol>
        ) : (
          !isLoading && (
            <div className="rounded-lg bg-paper p-2 text-xs font-bold text-ink/60 italic text-left">
              No definitions found.
            </div>
          )
        )}

        {/* Examples */}
        {activeExamples.length > 0 && (
          <div className="mt-2 rounded-xl border border-black/20 bg-paper p-2 text-left">
            <span className="font-mono text-[9px] font-black uppercase text-ink/60 block mb-0.5">
              Example
            </span>
            <p className="font-jp text-[11px] font-bold text-ink text-left leading-tight">
              {activeExamples[0]}
            </p>
          </div>
        )}
      </div>

      {/* Bottom Bookmark Button Stamp */}
      {showSaveButton && onSave && (
        <div className="mt-3 pt-2.5 border-t-2 border-black/10 flex items-center justify-between">
          <button
            type="button"
            onClick={handleSave}
            disabled={saved}
            aria-label={saved ? 'Word saved to dictionary' : 'Save word to dictionary'}
            className={cn(
              'flex w-full items-center justify-center gap-1.5 rounded-xl border-2 border-black py-2 font-mono text-xs font-black transition-all active:translate-y-0.5',
              saved
                ? 'bg-moss text-white shadow-none cursor-default'
                : 'bg-paper text-ink shadow-[0_2.5px_0_0_#1C1C1C] hover:bg-mustard cursor-pointer'
            )}
          >
            {saved ? (
              <>
                <Check className="h-4 w-4 stroke-[3]" />
                <span>Saved to Dictionary ✓</span>
              </>
            ) : (
              <>
                <Bookmark className="h-4 w-4" />
                <span>Bookmark to Dictionary</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
