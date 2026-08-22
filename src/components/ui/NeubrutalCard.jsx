import React from 'react';
import Link from 'next/link';
import { ArrowRight, Pointer } from 'lucide-react';
import { cn } from '../../lib/utils.js';
import JapaneseText from '../chat/JapaneseText.jsx';

export default function NeubrutalCard({
  id = 'mainDemoCard',
  href,
  category = 'BEGINNER',
  categoryColor = 'bg-nbYellow text-black',
  level = 'N5',
  levelColor = 'bg-nbGreen text-black',
  title = 'Basic Verbs',
  japaneseText = '行きます',
  romajiOrMeaning = 'To go / Ikimasu',
  progress = 0,
  showProgress = true,
  footerContent,
  showHint = false,
  hintText = 'Hover or tap card to test hover mechanics',
  className = '',
  onClick,
  ...props
}) {
  const CardWrapper = href ? Link : 'div';
  const wrapperProps = href ? { href } : { role: onClick ? 'button' : undefined, tabIndex: 0, onClick };
  const completions = Math.min(Math.round((progress || 0) / 20), 5);

  return (
    <div className="w-full flex flex-col items-center">
      <div className="w-full space-y-2">
        {/* THE CLEAN NEUBRUTAL CARD */}
        <CardWrapper
          id={id}
          className={cn(
            'nb-card-clean p-6 cursor-pointer relative group block text-left outline-none',
            className
          )}
          {...wrapperProps}
          {...props}
        >
          {/* TOP SYMMETRICAL BADGE ROW */}
          <div className="flex items-center justify-between gap-2 mb-5">
            <span className={cn('nb-pill', categoryColor)}>
              {category}
            </span>
            <span className={cn('nb-pill', levelColor)}>
              {level}
            </span>
          </div>

          {/* CARD TITLE & SUBTITLE WITH RESERVED HEIGHT */}
          <div className="mb-6 space-y-1">
            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-black text-black group-hover:text-indigo-600 transition-colors">
                {title}
              </h3>
              {/* Arrow stays visible, moves right on hover */}
              <ArrowRight className="arrow-reveal w-5 h-5 text-black group-hover:translate-x-1.5 transition-transform duration-200 shrink-0 stroke-[2.5]" />
            </div>
            {/* Height container with space for ruby furigana text */}
            <div className="min-h-[1.75rem] flex items-baseline">
              <div className="subtext-reveal text-slate-600 font-semibold text-sm tracking-wide group-hover:text-indigo-600 transition-colors flex items-baseline flex-wrap gap-x-1">
                <JapaneseText text={japaneseText} enableDictionary={false} />
                {romajiOrMeaning && (
                  <span className="text-xs font-mono text-slate-400 font-bold">
                    ({romajiOrMeaning})
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* FOOTER / PROGRESS BAR */}
          {footerContent ? (
            footerContent
          ) : showProgress ? (
            <div className="space-y-1.5 pt-2 border-t-2 border-slate-100">
              <div className="flex justify-between items-center text-xs font-mono font-bold text-slate-700">
                <span>PROGRESS</span>
                <span>{progress}%</span>
              </div>
              <div className="w-full bg-slate-100 border-2 border-black h-3.5 rounded-full overflow-hidden p-0.5">
                <div
                  className="bg-black h-full rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${Math.min(Math.max(progress, 0), 100)}%` }}
                />
              </div>
            </div>
          ) : null}
        </CardWrapper>

        {showHint && (
          <p id="interactionHint" className="text-xs font-bold text-slate-500 text-center pt-2 flex items-center justify-center gap-1.5">
            <Pointer className="w-3.5 h-3.5 text-black stroke-[2.5]" /> {hintText}
          </p>
        )}
      </div>
    </div>
  );
}
