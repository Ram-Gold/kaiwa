import { useState } from 'react';
import { tokenizeJapaneseText } from '../../lib/japaneseText.js';

export default function JapaneseText({ text }) {
  const [activeTerm, setActiveTerm] = useState('');
  const tokens = tokenizeJapaneseText(text);

  return (
    <>
      {tokens.map((token, index) => {
        if (token.type !== 'dictionary') {
          return <span key={`${token.text}-${index}`}>{token.text}</span>;
        }

        const isActive = activeTerm === `${token.entry.term}-${index}`;

        return (
          <span
            key={`${token.entry.term}-${index}`}
            className="relative inline-block"
            onMouseLeave={() => setActiveTerm('')}
          >
            <button
              type="button"
              className="border-b-[3px] border-mustard bg-mustard/35 px-0.5 font-black text-ink transition hover:bg-mustard"
              onClick={() =>
                setActiveTerm(isActive ? '' : `${token.entry.term}-${index}`)
              }
              aria-expanded={isActive}
            >
              {token.text}
            </button>
            {isActive && <DictionaryPopover entry={token.entry} />}
          </span>
        );
      })}
    </>
  );
}

function DictionaryPopover({ entry }) {
  return (
    <span className="brutal-border animate-panel-in absolute left-0 top-full z-20 mt-2 block w-72 bg-paper p-3 text-left text-ink shadow-shadow">
      <span className="mb-2 block font-mono text-xs font-black uppercase tracking-[0.16em] text-shu">Dictionary</span>
      <span className="mt-1 block font-display text-xl">{entry.term}</span>
      <span className="mt-2 block font-mono text-xs font-black uppercase tracking-[0.12em]">
        {entry.script}
      </span>
      <span className="mt-2 block text-sm font-bold leading-6">
        Reading: {entry.reading}
        <br />
        Romaji: {entry.romaji}
      </span>
      <span className="mt-2 block border-t-[3px] border-ink pt-2">
        <span className="label-mono block text-ai">Meanings</span>
        {(entry.meanings || [entry.meaning]).map((meaning) => (
          <span
            key={meaning}
            className="mr-2 mt-2 inline-flex border-[2px] border-ink bg-mustard px-2 py-1 text-xs font-black"
          >
            {meaning}
          </span>
        ))}
      </span>
      {entry.kanji?.length > 0 && (
        <span className="mt-2 block border-t-[3px] border-ink pt-2 text-sm font-bold leading-6">
          {entry.kanji.map((item) => (
            <span key={item.char} className="block">
              {item.char}: {item.meaning}
            </span>
          ))}
        </span>
      )}
      {entry.notes && (
        <span className="mt-2 block text-xs font-semibold leading-5">{entry.notes}</span>
      )}
    </span>
  );
}
