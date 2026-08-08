import { useState, useEffect } from 'react';
import { IoCloseSharp, IoVolumeHighSharp, IoOpenOutline, IoSparklesSharp } from 'react-icons/io5';
import { tokenizeJapaneseText } from '../../lib/japaneseText.js';
import { speakJapanese } from '../../lib/speech.js';
import { fetchJlptWordDefinition } from '../../lib/jlptVocabApi.js';
export default function JapaneseText({ text }) {
  const tokens = tokenizeJapaneseText(text);

  return (
    <>
      {tokens.map((token, index) => {
        if (token.type !== 'dictionary') {
          return <span key={`${token.text}-${index}`}>{token.text}</span>;
        }

        return (
          <span
            key={`${token.entry.term}-${index}`}
            className="inline-block"
          >
            <button
              type="button"
              className="underline decoration-border decoration-2 underline-offset-4 font-black text-ink transition hover:bg-mustard/40 px-0.5 rounded-sm"
              onClick={() => {
                window.dispatchEvent(new CustomEvent('kaiwa:show-dictionary', { detail: token.entry }));
              }}
              title="Click for dictionary meaning"
            >
              {token.text}
            </button>
          </span>
        );
      })}
    </>
  );
}

export function DictionaryPopover({ entry, onClose }) {
  const [apiData, setApiData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

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
  const activeMeanings = apiData?.meanings || [];

  return (
    <div className="brutal-border animate-panel-in bg-paper p-4 text-left text-ink shadow-shadow w-[290px] max-h-[420px] overflow-y-auto flex flex-col z-50">
      {/* Header */}
      <div className="flex justify-between items-center border-b-[3px] border-ink pb-2 mb-3">
        <span className="block font-mono text-xs font-black uppercase tracking-[0.16em] text-shu flex items-center gap-1">
          <IoSparklesSharp className="text-mustard text-xs" /> JLPT Dictionary
        </span>
        <button 
          type="button" 
          onClick={onClose} 
          className="brutal-border grid h-7 w-7 place-items-center bg-white text-sm hover:bg-mustard transition-colors active:scale-95 shrink-0"
        >
          <IoCloseSharp />
        </button>
      </div>

      <div className="flex-1">
        {/* Term & Audio */}
        <div className="mt-1 flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label="Listen to word"
              title="Listen pronunciation"
              onClick={() => speakJapanese(activeTerm)}
              className="brutal-border grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white text-ink transition-colors hover:bg-mustard active:scale-95"
            >
              <IoVolumeHighSharp className="text-sm" />
            </button>
            <span className="font-display text-2xl leading-none">{activeTerm}</span>
          </div>

          {activeJlpt && (
            <span className="brutal-border bg-mustard px-2 py-0.5 font-mono text-[10px] font-black uppercase text-ink shadow-nav">
              {activeJlpt}
            </span>
          )}
        </div>

        {/* Loading Indicator */}
        {isLoading ? (
          <div className="my-3 brutal-border bg-white p-3 text-center shadow-nav">
            <div className="flex items-center justify-center gap-2 font-mono text-xs font-black text-shu">
              <span className="h-2 w-2 rounded-full bg-shu animate-ping" />
              Looking up word...
            </div>
            <p className="mt-1 font-mono text-[10px] font-bold text-ink/50">Fetching JLPT Vocab API definitions</p>
          </div>
        ) : null}

        {/* Reading & Romaji */}
        <div className="mt-3 text-xs font-bold leading-5">
          {activeReading && (
            <div>Reading: <span className="font-black text-shu">{activeReading}</span></div>
          )}
          {activeRomaji && (
            <div>Romaji: <span className="font-mono text-ink/80">{activeRomaji}</span></div>
          )}
        </div>

        {/* Meanings */}
        {activeMeanings.length > 0 ? (
          <div className="mt-3 border-t-[3px] border-ink pt-2">
            <span className="label-mono block text-ai text-[10px] mb-1">Definitions</span>
            <div className="space-y-1.5">
              {activeMeanings.map((meaning, i) => (
                <div key={`${meaning}-${i}`} className="border-[2px] border-ink bg-white p-2 text-xs font-bold shadow-nav">
                  <span className="font-mono text-[10px] text-ink/50 mr-1.5">#{i + 1}</span>
                  {meaning}
                </div>
              ))}
            </div>
          </div>
        ) : (
          !isLoading && (
            <div className="mt-3 border-t-[3px] border-ink pt-2">
              <span className="label-mono block text-ai text-[10px] mb-1">Definitions</span>
              <div className="border-[2px] border-ink bg-paper p-2 text-xs font-bold text-ink/60 italic">
                No definitions found in JLPT API.
              </div>
            </div>
          )
        )}

        {/* Kanji breakdown if local entry has it */}
        {entry?.kanji?.length > 0 && (
          <div className="mt-3 border-t-[3px] border-ink pt-2 text-xs font-bold leading-5">
            <span className="label-mono block text-[9px] mb-1">Kanji Breakdown</span>
            {entry.kanji.map((item) => (
              <span key={item.char} className="block mt-0.5">
                <span className="font-black text-shu">{item.char}</span>: {item.meaning}
              </span>
            ))}
          </div>
        )}


      </div>
    </div>
  );
}
