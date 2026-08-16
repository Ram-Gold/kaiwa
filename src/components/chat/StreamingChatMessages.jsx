'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { IoArrowDownSharp } from 'react-icons/io5';
import StreamingChatBubble from './StreamingChatBubble.jsx';
import { cn } from '../../lib/utils.js';

export default function StreamingChatMessages({
  messages = [],
  persona,
  isThinking = false,
  isStreaming = false,
  onPickSuggestion,
  className = '',
}) {
  const containerRef = useRef(null);
  const bottomMarkerRef = useRef(null);
  const [isPinnedToBottom, setIsPinnedToBottom] = useState(true);
  const [showScrollBottomButton, setShowScrollBottomButton] = useState(false);

  // Check scroll position to determine if user is pinned to bottom
  const handleScroll = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;

    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    const isAtBottom = distanceFromBottom < 50;
    setIsPinnedToBottom(isAtBottom);
    setShowScrollBottomButton(!isAtBottom);
  }, []);

  const scrollToBottom = useCallback((smooth = true) => {
    if (containerRef.current) {
      if (typeof containerRef.current.scrollTo === 'function') {
        containerRef.current.scrollTo({
          top: containerRef.current.scrollHeight,
          behavior: smooth ? 'smooth' : 'auto',
        });
      } else {
        containerRef.current.scrollTop = containerRef.current.scrollHeight;
      }
      setIsPinnedToBottom(true);
      setShowScrollBottomButton(false);
    }
  }, []);

  // When messages or streaming tokens change, auto-scroll ONLY if pinned to bottom
  useEffect(() => {
    if (isPinnedToBottom) {
      scrollToBottom(false);
    }
  }, [messages, isThinking, isPinnedToBottom, scrollToBottom]);

  return (
    <div className={cn('relative flex flex-1 flex-col overflow-hidden', className)}>
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-4 py-4 space-y-4 scroll-smooth"
        role="log"
        aria-live="polite"
      >
        {messages.length === 0 && !isThinking && (
          <div className="flex h-full flex-col items-center justify-center text-center p-6 text-ink/60">
            <div className="brutal-border grid h-16 w-16 place-items-center bg-mustard text-2xl font-black text-ink shadow-shadow mb-3">
              {persona?.jp || '会'}
            </div>
            <h3 className="font-display text-2xl font-bold text-ink">
              Start your conversation with {persona?.name || 'Kaiwa'}
            </h3>
            <p className="mt-2 max-w-sm text-sm font-medium">
              Say hello or ask a question in Japanese to begin your practice session.
            </p>
          </div>
        )}

        {messages.map((msg, idx) => {
          const isLast = idx === messages.length - 1;
          const isLive = isLast && isStreaming && msg.role === 'assistant';

          return (
            <StreamingChatBubble
              key={msg.id || idx}
              message={msg}
              persona={persona}
              isLiveStreaming={isLive}
              onPickSuggestion={onPickSuggestion}
            />
          );
        })}

        {/* Smooth Thinking Indicator Handoff */}
        {isThinking && (
          <div className="flex items-start gap-3" data-testid="thinking-indicator">
            <div className="brutal-border grid h-10 w-10 shrink-0 place-items-center font-display text-sm font-black bg-mustard text-ink shadow-nav">
              {persona?.jp || '会'}
            </div>
            <article className="brutal-border bg-paper px-4 py-3 text-ink shadow-shadow">
              <div className="flex items-center gap-1.5 py-1">
                <span className="h-2 w-2 rounded-full bg-ink animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="h-2 w-2 rounded-full bg-ink animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="h-2 w-2 rounded-full bg-ink animate-bounce" style={{ animationDelay: '300ms' }} />
                <span className="ml-2 font-mono text-xs font-bold text-ink/70">
                  {persona?.name || 'Kaiwa'} is thinking...
                </span>
              </div>
            </article>
          </div>
        )}

        <div ref={bottomMarkerRef} className="h-1" />
      </div>

      {/* Floating Jump to Latest Button when scrolled up */}
      {showScrollBottomButton && (
        <div className="absolute bottom-4 right-4 z-20">
          <button
            type="button"
            onClick={() => scrollToBottom(true)}
            aria-label="Jump to latest message"
            className="brutal-border flex items-center gap-1.5 bg-mustard px-3 py-2 font-mono text-xs font-black uppercase tracking-wider text-ink shadow-shadow transition-transform hover:-translate-y-0.5 active:scale-95"
          >
            <IoArrowDownSharp className="text-base" />
            <span>Latest</span>
          </button>
        </div>
      )}
    </div>
  );
}
