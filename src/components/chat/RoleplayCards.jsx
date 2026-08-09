import { useState } from 'react';
import { cn } from '../../lib/utils';
import { IoCheckmarkCircleSharp, IoCloseCircleSharp } from 'react-icons/io5';

export default function RoleplayCards({ disabled, onPickSuggestion, suggestions, onMistake }) {
  const [selectedIdx, setSelectedIdx] = useState(null);

  if (!suggestions || suggestions.length === 0) {
    return null;
  }

  // Handle case where suggestions are just strings (fallback for old history)
  const isStringArray = typeof suggestions[0] === 'string';

  const handlePick = (suggestion, index) => {
    setSelectedIdx(index);
    
    const textToSubmit = isStringArray ? suggestion : suggestion.text;
    
    if (!isStringArray && !suggestion.isCorrect) {
      // Record the mistake before submitting
      if (onMistake) onMistake(suggestion);
    }

    // Small delay to let the user see the red/green feedback before it sends
    setTimeout(() => {
      onPickSuggestion(textToSubmit);
      setSelectedIdx(null);
    }, 1200);
  };

  return (
    <div className="flex flex-col gap-3 w-full">
      {suggestions.map((suggestion, index) => {
        const text = isStringArray ? suggestion : suggestion.text;
        const isSelected = selectedIdx === index;
        let cardColor = "bg-mustard text-ink";
        let FeedbackIcon = null;

        if (isSelected && !isStringArray) {
          if (suggestion.isCorrect) {
            cardColor = "bg-moss text-white";
            FeedbackIcon = IoCheckmarkCircleSharp;
          } else {
            cardColor = "bg-shu text-white";
            FeedbackIcon = IoCloseCircleSharp;
          }
        } else if (selectedIdx !== null) {
           // Dim other cards when one is selected
           cardColor = "bg-paper text-ink opacity-40 shadow-none translate-x-boxShadowX translate-y-boxShadowY";
        }

        return (
          <div key={`${text}-${index}`} className="flex flex-col w-full animate-message-in">
             <button
              type="button"
              disabled={disabled || selectedIdx !== null}
              onClick={() => handlePick(suggestion, index)}
              className={cn(
                "brutal-border w-full px-4 py-3 text-left font-mono text-sm font-black shadow-shadow transition-all hover:translate-x-boxShadowX hover:translate-y-boxShadowY hover:shadow-none disabled:cursor-not-allowed",
                cardColor
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <span>{text}</span>
                {FeedbackIcon && <FeedbackIcon className="text-xl shrink-0" />}
              </div>
            </button>
            
            {/* Show explanation only for the selected incorrect card */}
            {isSelected && !isStringArray && suggestion.explanation && (
              <div className="animate-message-in mt-1 brutal-border bg-ink text-paper p-2 font-mono text-xs font-bold">
                {suggestion.isCorrect ? "✨ Perfect!" : `❌ ${suggestion.explanation}`}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
