'use client';

import React, { useState, useEffect } from 'react';
import { IoCloseSharp, IoExitOutline, IoVolumeHighSharp } from 'react-icons/io5';
import JapaneseText from '../chat/JapaneseText.jsx';
import { speakJapanese } from '../../lib/speech.js';
import { useAuth } from '../../lib/auth/AuthContext.jsx';
import { cn } from '../../lib/utils.js';

export default function SessionSettingsModal({ isOpen, onClose, onRequestExit }) {
  const { isDeveloper } = useAuth();
  const [showPronunciation, setShowPronunciation] = useState(true);
  const [readingMode, setReadingMode] = useState('japanese'); // 'japanese' | 'romaji'
  const [voiceSpeed, setVoiceSpeed] = useState(1.0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showDevOptions, setShowDevOptions] = useState(false);

  // Developer Toggles
  const [showFinishAndGrade, setShowFinishAndGrade] = useState(false);
  const [streamingEnabled, setStreamingEnabled] = useState(true);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedMode = window.localStorage?.getItem?.('kaiwa.reading_mode') || 'japanese';
      if (savedMode === 'off') {
        setShowPronunciation(false);
        setReadingMode('japanese');
      } else {
        setShowPronunciation(true);
        setReadingMode(savedMode === 'romaji' ? 'romaji' : 'japanese');
      }

      const storedSpeed = parseFloat(window.localStorage?.getItem?.('kaiwa.speech.rate') || '1.0');
      if (!isNaN(storedSpeed)) {
        setVoiceSpeed(storedSpeed);
      }

      const savedDevFlags = window.localStorage?.getItem?.('kaiwa.dev_flags');
      if (savedDevFlags) {
        try {
          const parsed = JSON.parse(savedDevFlags);
          if (typeof parsed.showFinishAndGrade === 'boolean') {
            setShowFinishAndGrade(parsed.showFinishAndGrade);
          }
          if (typeof parsed.streamingEnabled === 'boolean') {
            setStreamingEnabled(parsed.streamingEnabled);
          }
        } catch {
          // ignore
        }
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const effectiveReadingMode = !showPronunciation ? 'off' : readingMode;

  function handleTogglePronunciation(nextVal) {
    setShowPronunciation(nextVal);
    const targetMode = nextVal ? readingMode : 'off';
    broadcastReadingMode(targetMode);
  }

  function handleSelectReadingMode(modeId) {
    setReadingMode(modeId);
    if (showPronunciation) {
      broadcastReadingMode(modeId);
    }
  }

  function handleSelectSpeed(speed) {
    setVoiceSpeed(speed);
    if (typeof window !== 'undefined') {
      window.localStorage?.setItem?.('kaiwa.speech.rate', String(speed));
    }
  }

  function handleTestAudio() {
    setIsPlaying(true);
    speakJapanese('こんにちは！一緒に日本語を練習しましょう！');
    setTimeout(() => setIsPlaying(false), 2200);
  }

  function broadcastReadingMode(modeId) {
    if (typeof window !== 'undefined') {
      try {
        window.localStorage?.setItem?.('kaiwa.reading_mode', modeId);
        window.dispatchEvent(new CustomEvent('kaiwa:reading-mode-change', { detail: { mode: modeId } }));
        window.dispatchEvent(new CustomEvent('kaiwa:conversation-option-change', { detail: { option: 'readingMode', value: modeId } }));
      } catch (err) {
        console.warn('Failed to save reading mode:', err);
      }
    }
  }

  function handleToggleFinishAndGrade() {
    const nextVal = !showFinishAndGrade;
    setShowFinishAndGrade(nextVal);
    if (typeof window !== 'undefined') {
      try {
        const raw = window.localStorage?.getItem?.('kaiwa.dev_flags') || '{}';
        const parsed = JSON.parse(raw);
        parsed.showFinishAndGrade = nextVal;
        window.localStorage?.setItem?.('kaiwa.dev_flags', JSON.stringify(parsed));
        window.dispatchEvent(new CustomEvent('kaiwa:dev-flags-changed', { detail: { showFinishAndGrade: nextVal } }));
      } catch (err) {
        console.warn('Failed to save dev flags:', err);
      }
    }
  }

  function handleToggleStreaming() {
    const nextVal = !streamingEnabled;
    setStreamingEnabled(nextVal);
    if (typeof window !== 'undefined') {
      try {
        const raw = window.localStorage?.getItem?.('kaiwa.dev_flags') || '{}';
        const parsed = JSON.parse(raw);
        parsed.streamingEnabled = nextVal;
        window.localStorage?.setItem?.('kaiwa.dev_flags', JSON.stringify(parsed));
        window.dispatchEvent(new CustomEvent('kaiwa:conversation-option-change', { detail: { option: 'streamingEnabled', value: nextVal } }));
      } catch (err) {
        console.warn('Failed to save streaming option:', err);
      }
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="session-settings-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/70 backdrop-blur-xs animate-fade-in"
      onClick={onClose}
    >
      <div
        className="border-2 border-border w-full max-w-md bg-white p-6 shadow-modal animate-panel-in rounded-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b-2 border-border/10">
          <h2 id="session-settings-title" className="font-display text-xl font-black text-ink tracking-tight">
            Settings
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close settings"
            className="grid h-8 w-8 place-items-center rounded-lg border-2 border-transparent hover:border-border hover:bg-paper transition-colors text-ink cursor-pointer"
          >
            <IoCloseSharp className="text-xl" />
          </button>
        </div>

        {/* Master Toggle Row: Show pronunciation */}
        <div
          className="py-4 flex items-center justify-between border-b-2 border-border/10 cursor-pointer select-none"
          onClick={() => handleTogglePronunciation(!showPronunciation)}
        >
          <div>
            <span className="text-sm font-bold text-ink block">
              Show pronunciation
            </span>
            <span className="text-[11px] font-mono text-ink/50 block">
              Display furigana readings above Japanese text
            </span>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={showPronunciation}
            aria-label="Toggle pronunciation"
            onClick={(e) => {
              e.stopPropagation();
              handleTogglePronunciation(!showPronunciation);
            }}
            className={cn(
              'border-2 border-border h-7 w-12 p-0.5 rounded-full transition-colors relative shadow-xs shrink-0 cursor-pointer',
              showPronunciation ? 'bg-mustard' : 'bg-paper'
            )}
          >
            <span
              className={cn(
                'block h-5 w-5 rounded-full bg-ink transition-transform duration-200 ease-out shadow-xs',
                showPronunciation ? 'translate-x-5' : 'translate-x-0'
              )}
            />
          </button>
        </div>

        {/* Visual Cards (Romanized vs Japanese) */}
        <div
          className={cn(
            'py-4 border-b-2 border-border/10 transition-opacity duration-150',
            !showPronunciation && 'opacity-30 pointer-events-none'
          )}
        >
          <div className="grid grid-cols-2 gap-3">
            {/* Card 1: Romanized */}
            <button
              type="button"
              onClick={() => handleSelectReadingMode('romaji')}
              className={cn(
                'border-2 p-4 text-center rounded-xl transition-all flex flex-col items-center justify-center gap-1.5 focus:outline-none cursor-pointer',
                readingMode === 'romaji' && showPronunciation
                  ? 'border-border bg-mustard/20 shadow-nav ring-2 ring-ink ring-offset-1'
                  : 'border-border/30 bg-paper/60 text-ink hover:border-border hover:bg-paper'
              )}
            >
              <span className="font-mono text-xs text-ink/60 font-semibold tracking-wider">
                ni hon go
              </span>
              <span className="font-jp text-2xl font-black text-ink">
                日本語
              </span>
              <span className="text-xs font-bold text-ink/80 mt-1">
                Romanized
              </span>
            </button>

            {/* Card 2: Japanese */}
            <button
              type="button"
              onClick={() => handleSelectReadingMode('japanese')}
              className={cn(
                'border-2 p-4 text-center rounded-xl transition-all flex flex-col items-center justify-center gap-1.5 focus:outline-none cursor-pointer',
                readingMode === 'japanese' && showPronunciation
                  ? 'border-border bg-mustard/20 shadow-nav ring-2 ring-ink ring-offset-1'
                  : 'border-border/30 bg-paper/60 text-ink hover:border-border hover:bg-paper'
              )}
            >
              <span className="font-jp text-xs text-ink/60 font-medium tracking-widest">
                に ほん ご
              </span>
              <span className="font-jp text-2xl font-black text-ink">
                日本語
              </span>
              <span className="text-xs font-bold text-ink/80 mt-1">
                Japanese
              </span>
            </button>
          </div>

          {/* Minimal Live Dialogue Preview */}
          <div className="mt-3.5 p-2.5 bg-paper/80 border border-border/20 rounded-lg">
            <span className="block text-[10px] font-mono font-bold text-ink/50 uppercase tracking-wider mb-0.5">
              Live Dialogue Preview
            </span>
            <p className="font-jp text-sm font-bold text-ink leading-relaxed">
              <JapaneseText
                text="こんにちは！日本語[にほんご]の練習[れんしゅう]を始[はじ]めましょう！"
                readingMode={effectiveReadingMode}
              />
            </p>
          </div>
        </div>

        {/* Voice Speed Section */}
        <div className="py-4 border-b-2 border-border/10">
          <div className="flex items-center justify-between mb-2.5">
            <div>
              <span className="text-sm font-bold text-ink block">
                Voice Speed
              </span>
              <span className="text-[11px] font-mono text-ink/50 block">
                Adjust Japanese recitation speed
              </span>
            </div>
            <button
              type="button"
              onClick={handleTestAudio}
              className="border border-border bg-paper hover:bg-mustard text-ink px-2.5 py-1 rounded-md text-xs font-mono font-bold flex items-center gap-1.5 shadow-xs transition-all active:scale-95 cursor-pointer"
              aria-label="Test voice speed"
            >
              <IoVolumeHighSharp className={cn('text-sm', isPlaying && 'text-shu animate-bounce')} />
              <span>{isPlaying ? 'Speaking...' : 'Test Voice'}</span>
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {[
              { rate: 0.75, label: '0.75x', sub: 'Slow · ゆっくり' },
              { rate: 1.0, label: '1.0x', sub: 'Normal · ふつう' },
              { rate: 1.25, label: '1.25x', sub: 'Fast · はやい' },
            ].map((item) => (
              <button
                key={item.rate}
                type="button"
                onClick={() => handleSelectSpeed(item.rate)}
                className={cn(
                  'border-2 py-2 px-1 text-center rounded-lg transition-all flex flex-col items-center justify-center gap-0.5 focus:outline-none cursor-pointer',
                  voiceSpeed === item.rate
                    ? 'border-border bg-mustard text-ink shadow-xs ring-2 ring-ink ring-offset-1 font-bold'
                    : 'border-border/30 bg-paper/60 text-ink/80 hover:border-border hover:bg-paper'
                )}
              >
                <span className="font-mono text-xs font-black">{item.label}</span>
                <span className="text-[10px] text-ink/60 font-medium">{item.sub}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Protected Developer Options (Only if user has developer role) */}
        {isDeveloper && (
          <div className="pt-2 pb-4 border-b-2 border-border/10">
            <button
              type="button"
              onClick={() => setShowDevOptions(!showDevOptions)}
              className="w-full flex items-center justify-between text-xs font-mono font-bold text-ink/60 uppercase tracking-wider py-1.5 hover:text-ink transition-colors cursor-pointer"
            >
              <span>Developer Options</span>
              <span>{showDevOptions ? '−' : '+'}</span>
            </button>

            {showDevOptions && (
              <div className="mt-2.5 space-y-2 text-xs font-mono">
                <label className="flex items-center justify-between p-2 rounded-lg bg-paper border border-border/10 cursor-pointer">
                  <span className="font-bold text-ink">Token Streaming & Live Thinking</span>
                  <input
                    type="checkbox"
                    checked={streamingEnabled}
                    onChange={handleToggleStreaming}
                    className="accent-mustard h-4 w-4 rounded"
                  />
                </label>
                <label className="flex items-center justify-between p-2 rounded-lg bg-paper border border-border/10 cursor-pointer">
                  <span className="font-bold text-ink">Manual 'Finish & Grade' Button</span>
                  <input
                    type="checkbox"
                    checked={showFinishAndGrade}
                    onChange={handleToggleFinishAndGrade}
                    className="accent-mustard h-4 w-4 rounded"
                  />
                </label>
              </div>
            )}
          </div>
        )}

        {/* Footer Actions */}
        <div className="pt-4 flex items-center justify-between gap-3">
          {onRequestExit ? (
            <button
              type="button"
              onClick={() => {
                onClose();
                onRequestExit();
              }}
              className="text-shu hover:underline font-mono text-xs font-bold uppercase flex items-center gap-1 cursor-pointer"
            >
              <IoExitOutline /> Exit Session
            </button>
          ) : <div />}

          <button
            type="button"
            onClick={onClose}
            className="border-2 border-border bg-mustard text-ink px-6 py-2 rounded-lg font-mono text-sm font-black uppercase tracking-wider shadow-nav hover:bg-mustard/80 active:translate-y-0.5 transition-all cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
