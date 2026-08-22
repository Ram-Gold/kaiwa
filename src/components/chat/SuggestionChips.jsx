import { extractCleanJapaneseText } from '../../lib/japaneseText.js';

export default function SuggestionChips({ disabled, onPickSuggestion, suggestions }) {
  const cleanSuggestions = suggestions
    .map(cleanSuggestion)
    .filter(Boolean)
    .filter((suggestion) => !suggestion.includes('SUGGESTIONS'))
    .slice(0, 3);

  if (!cleanSuggestions.length) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-2 sm:flex-col sm:items-start">
      {cleanSuggestions.map((suggestion, index) => (
        <button
          key={`${suggestion}-${index}`}
          type="button"
          disabled={disabled}
          onClick={() => onPickSuggestion(extractCleanJapaneseText(suggestion))}
          className="brutal-border w-max max-w-full bg-mustard px-3 py-2 text-left font-mono text-xs font-black shadow-shadow transition-all hover:translate-x-boxShadowX hover:translate-y-boxShadowY hover:shadow-none disabled:cursor-not-allowed disabled:opacity-50"
        >
          {suggestion}
        </button>
      ))}
    </div>
  );
}

function cleanSuggestion(value) {
  return String(value || '')
    .replace(/```(?:json)?/gi, '')
    .replace(/```/g, '')
    .replace(/[{}[\]]/g, '')
    .replace(/^["'`]+|["'`]+$/g, '')
    .trim();
}
