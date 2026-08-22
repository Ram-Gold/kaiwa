'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import confetti from 'canvas-confetti';
import { 
  Sparkles, 
  Layers, 
  ArrowRight, 
  Laptop, 
  Check, 
  RefreshCw,
  BookOpen,
  Target,
  MousePointer
} from 'lucide-react';
import Badge from '../../components/ui/Badge.jsx';
import { cn } from '../../lib/utils.js';
import DailyQueue, { 
  DEFAULT_QUESTS, 
  DEFAULT_TASKS, 
  SpaciousOmamoriPrototype, 
  SpaciousZenPrototype, 
  SpaciousNeubrutalPrototype 
} from '../../components/shell/DailyQueue.jsx';
import HoverCardPrototypes from '../../components/prototype/HoverCardPrototypes.jsx';

export default function PrototypePage() {
  const [activeStudioTab, setActiveStudioTab] = useState('hover-card'); // 'hover-card' | 'daily-quests'
  const [activeVariant, setActiveVariant] = useState('spacious-zen');
  const [quests, setQuests] = useState(DEFAULT_QUESTS);
  const [tasks, setTasks] = useState(DEFAULT_TASKS);

  const handleClaimQuest = (questId, e) => {
    if (typeof confetti === 'function') {
      const rect = e?.currentTarget?.getBoundingClientRect();
      const originX = rect ? (rect.left + rect.width / 2) / window.innerWidth : 0.5;
      const originY = rect ? (rect.top + rect.height / 2) / window.innerHeight : 0.5;

      confetti({
        particleCount: 50,
        spread: 70,
        origin: { x: originX, y: originY },
        colors: ['#F2C14E', '#4A7A63', '#D6432B', '#2F4858', '#FAF7F0'],
      });
    }

    setQuests((prev) =>
      prev.map((q) => (q.id === questId ? { ...q, claimed: true } : q))
    );
  };

  const handleIncrementQuest = (questId) => {
    setQuests((prev) =>
      prev.map((q) => {
        if (q.id === questId) {
          const nextVal = q.current < q.target ? q.current + 1 : 0;
          return { ...q, current: nextVal, claimed: nextVal < q.target ? false : q.claimed };
        }
        return q;
      })
    );
  };

  const handleResetData = () => {
    setQuests(DEFAULT_QUESTS);
    setTasks(DEFAULT_TASKS);
  };

  const QUEST_PROTOTYPES = [
    {
      id: 'spacious-zen',
      name: 'Spacious Zen Quests',
      jpName: '日課 · 禅クエスト',
      badge: 'Recommended',
      badgeTone: 'moss',
      tagline: 'Clean, spacious, simplified Daily Quests with crisp typography & no clutter',
      description:
        'A refined, airy design that simplifies the header down to "Daily Quests", gives generous width and breathing room to cards so XP badges never wrap awkwardly.',
      component: (
        <SpaciousZenPrototype
          quests={quests}
          onClaim={handleClaimQuest}
          onIncrement={handleIncrementQuest}
        />
      ),
    },
    {
      id: 'spacious-omamori',
      name: 'Spacious Omamori Quests',
      jpName: '御守 · 日課修行',
      badge: 'Talisman Seal',
      badgeTone: 'mustard',
      tagline: 'Spacious layout with Japanese shrine talismans & live ratio capsules',
      description:
        'Inspired by Japanese temple Omamori (御守) talismans. Combines live progression with authentic Japanese craftsmanship.',
      component: (
        <SpaciousOmamoriPrototype
          quests={quests}
          onClaim={handleClaimQuest}
          onIncrement={handleIncrementQuest}
        />
      ),
    },
    {
      id: 'spacious-neubrutal',
      name: 'Tactile Neubrutal Forge',
      jpName: '鍛錬 · ネオブルータル',
      badge: 'High Impact',
      badgeTone: 'correction',
      tagline: 'Bold 3D ink borders, tactile button stamps, and high contrast',
      description:
        'Emphasizes KAIwa’s bold neubrutalist personality with punchy 3D offset drop shadows.',
      component: (
        <SpaciousNeubrutalPrototype
          quests={quests}
          onClaim={handleClaimQuest}
          onIncrement={handleIncrementQuest}
        />
      ),
    },
  ];

  return (
    <div className="mx-auto max-w-5xl space-y-8 pb-16">
      <header className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="correction" className="rounded-md">
              PROTOTYPE LAB
            </Badge>
            <span className="font-mono text-xs font-bold text-ink/60">
              /prototype • UI/UX Design Studio
            </span>
          </div>

          <Link
            href="/"
            className="flex items-center gap-1 rounded-lg bg-paper border-2 border-black px-3 py-1.5 font-mono text-xs font-black text-ink shadow-[0_2px_0_0_#1C1C1C] hover:bg-mustard transition-all"
          >
            <span>Back to App</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <h1 className="font-display text-4xl leading-tight sm:text-5xl">
          KAIwa Prototype Studio
        </h1>
        <p className="max-w-2xl font-sans text-base text-ink/80">
          Interactive design playground to prototype, compare, and validate UI patterns before integrating them into main user flows.
        </p>

        {/* Primary Studio Feature Tabs */}
        <div className="pt-2 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setActiveStudioTab('hover-card')}
            className={cn(
              'flex items-center gap-2 rounded-xl px-4 py-2.5 font-mono text-xs font-black transition-all border-2',
              activeStudioTab === 'hover-card'
                ? 'border-black bg-mustard text-ink shadow-[0_4px_0_0_#1C1C1C]'
                : 'border-black/20 bg-white text-ink/70 hover:bg-paper'
            )}
          >
            <MousePointer className="h-4 w-4" />
            <span>Dictionary Hover Card Prototypes</span>
            <Badge tone="moss" className="text-[10px] ml-1">Active Prototype</Badge>
          </button>

          <button
            type="button"
            onClick={() => setActiveStudioTab('daily-quests')}
            className={cn(
              'flex items-center gap-2 rounded-xl px-4 py-2.5 font-mono text-xs font-black transition-all border-2',
              activeStudioTab === 'daily-quests'
                ? 'border-black bg-mustard text-ink shadow-[0_4px_0_0_#1C1C1C]'
                : 'border-black/20 bg-white text-ink/70 hover:bg-paper'
            )}
          >
            <Target className="h-4 w-4" />
            <span>Daily Quests Sidebar Prototypes</span>
          </button>
        </div>
      </header>

      {/* ---------------------------------------------------- */}
      {/* 1. DICTIONARY HOVER CARD PROTOTYPES                  */}
      {/* ---------------------------------------------------- */}
      {activeStudioTab === 'hover-card' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <HoverCardPrototypes />
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* 2. DAILY QUESTS PROTOTYPES                          */}
      {/* ---------------------------------------------------- */}
      {activeStudioTab === 'daily-quests' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl brutal-border bg-white p-4 shadow-nav">
            <div className="flex items-center gap-3">
              <span className="font-mono text-xs font-black uppercase tracking-wider text-ink/70">
                Active Sidebar Variant:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {QUEST_PROTOTYPES.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setActiveVariant(p.id)}
                    className={cn(
                      'rounded-lg px-3 py-1.5 font-mono text-xs font-black transition-all',
                      activeVariant === p.id
                        ? 'bg-ink text-paper shadow-none'
                        : 'bg-paper text-ink hover:bg-mustard border border-ink/20'
                    )}
                  >
                    {p.name} {activeVariant === p.id && '✓'}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={handleResetData}
              className="flex items-center gap-1 rounded-lg border border-ink/30 bg-paper px-3 py-1.5 font-mono text-xs font-bold text-ink hover:bg-white transition-colors"
            >
              <RefreshCw className="h-3 w-3" />
              <span>Reset Demo Data</span>
            </button>
          </div>

          <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="space-y-4">
              {QUEST_PROTOTYPES.map((p) => {
                const isCurrent = activeVariant === p.id;
                return (
                  <div
                    key={p.id}
                    onClick={() => setActiveVariant(p.id)}
                    className={cn(
                      'cursor-pointer rounded-2xl brutal-border p-5 transition-all',
                      isCurrent ? 'bg-white ring-4 ring-mustard shadow-brutal' : 'bg-white/60 shadow-nav'
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="font-display text-xl font-black">{p.name}</h3>
                      <Badge tone={p.badgeTone}>{p.badge}</Badge>
                    </div>
                    <p className="mt-1 text-xs font-bold text-aizome">{p.tagline}</p>
                    <p className="mt-2 text-xs text-ink/80">{p.description}</p>
                  </div>
                );
              })}
            </div>

            <div className="brutal-border rounded-2xl bg-paper p-4 shadow-brutal space-y-4">
              <div className="flex items-center gap-2">
                <Laptop className="h-4 w-4 text-ink/70" />
                <h3 className="font-mono text-xs font-black uppercase tracking-wider text-ink">
                  Simulated Right Sidebar
                </h3>
              </div>
              <div>{QUEST_PROTOTYPES.find((p) => p.id === activeVariant)?.component}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
