import { useState } from 'react';
import { IoCloseSharp, IoVolumeHighSharp } from 'react-icons/io5';
import { tokenizeJapaneseText } from '../../lib/japaneseText.js';
import { speakJapanese } from '../../lib/speech.js';

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
  return (
    <div className="brutal-border animate-panel-in bg-paper p-4 text-left text-ink shadow-shadow w-[280px] h-[380px] overflow-y-auto flex flex-col z-50">
      <div className="flex justify-between items-center border-b-[3px] border-ink pb-2 mb-3">
        <span className="block font-mono text-xs font-black uppercase tracking-[0.16em] text-shu">Dictionary</span>
        <button 
          type="button" 
          onClick={onClose} 
          className="brutal-border grid h-7 w-7 place-items-center bg-white text-sm hover:bg-mustard transition-colors active:scale-95"
        >
          <IoCloseSharp />
        </button>
      </div>
      <div className="flex-1">
        <div className="mt-1 flex items-center gap-2">
          <button
            type="button"
            aria-label="Listen to word"
            title="Listen pronunciation"
            onClick={() => speakJapanese(entry.term)}
            className="brutal-border grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white text-ink transition-colors hover:bg-mustard active:scale-95"
          >
            <IoVolumeHighSharp className="text-sm" />
          </button>
          <span className="font-display text-2xl leading-none">{entry.term}</span>
        </div>
        <span className="mt-2 block font-mono text-xs font-black uppercase tracking-[0.12em] opacity-60">
          {entry.script}
        </span>
        <span className="mt-2 block text-sm font-bold leading-5">
          Reading: {entry.reading}
          <br />
          Romaji: {entry.romaji}
        </span>
        <span className="mt-3 block border-t-[3px] border-ink pt-2">
          <span className="label-mono block text-ai text-[10px]">Meanings</span>
          <div className="flex flex-wrap gap-1.5 mt-1.5">
            {(entry.meanings || [entry.meaning]).map((meaning) => (
              <span
                key={meaning}
                className="border-[2px] border-ink bg-mustard px-2 py-0.5 text-xs font-black"
              >
                {meaning}
              </span>
            ))}
          </div>
        </span>
        {entry.kanji?.length > 0 && (
          <span className="mt-3 block border-t-[3px] border-ink pt-2 text-xs font-bold leading-5">
            <span className="label-mono block text-[9px] mb-1">Kanji Breakdown</span>
            {entry.kanji.map((item) => (
              <span key={item.char} className="block mt-0.5">
                <span className="font-black text-shu">{item.char}</span>: {item.meaning}
              </span>
            ))}
          </span>
        )}
        {entry.notes && (
          <span className="mt-3 block text-[11px] font-semibold leading-4 opacity-70 border-t border-border pt-1.5">{entry.notes}</span>
        )}
      </div>
    </div>
  );
}
