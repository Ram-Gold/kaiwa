'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import confetti from 'canvas-confetti';
import { 
  Sparkles, 
  CheckCircle2, 
  Layers, 
  Flame, 
  ArrowRight,
  Info,
  Laptop,
  Check,
  Gift,
  RefreshCw
} from 'lucide-react';
import Badge from '../../components/ui/Badge.jsx';
import { cn } from '../../lib/utils.js';
import DailyQueue, { 
  DEFAULT_QUESTS,
  DEFAULT_TASKS,
  SpaciousOmamoriPrototype,
  SpaciousZenPrototype,
  SpaciousNeubrutalPrototype,
  ZenQueuePrototype,
  HankoQueuePrototype
} from '../../components/shell/DailyQueue.jsx';

export default function PrototypePage() {
  const [activeVariant, setActiveVariant] = useState('spacious-zen');
  const [quests, setQuests] = useState(DEFAULT_QUESTS);
  const [tasks, setTasks] = useState(DEFAULT_TASKS);
  const [activeTab, setActiveTab] = useState('interactive'); // 'interactive' | 'side-by-side' | 'specs'

  useEffect(() => {
    const saved = localStorage.getItem('kaiwa_daily_queue_variant');
    if (saved) setActiveVariant(saved);
  }, []);

  const handleSetVariant = (variantKey) => {
    setActiveVariant(variantKey);
    localStorage.setItem('kaiwa_daily_queue_variant', variantKey);
    window.dispatchEvent(
      new CustomEvent('kaiwa:queue-variant-change', { detail: { variant: variantKey } })
    );
  };

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

  const handleToggleTask = (taskId) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, done: !t.done } : t))
    );
  };

  const handleResetData = () => {
    setQuests(DEFAULT_QUESTS);
    setTasks(DEFAULT_TASKS);
  };

  const PROTOTYPES = [
    {
      id: 'spacious-zen',
      name: 'Spacious Zen Quests',
      jpName: '日課 · 禅クエスト',
      badge: 'Recommended',
      badgeTone: 'moss',
      tagline: 'Clean, spacious, simplified Daily Quests with crisp typography & no clutter',
      description:
        'A refined, airy design that simplifies the header down to "Daily Quests", gives generous width and breathing room to cards so XP badges never wrap awkwardly, and pairs English titles with subtle Japanese kana/kanji subtitles.',
      highlights: [
        'Simplified "Daily Quests" header (no clutter, no extra icons/levels)',
        'Spacious card separation with generous width (no XP wrap issues)',
        'Smooth 10px continuous progress bar with live percentage and ratio counters',
        'Direct interactive "Claim +XP" button with confetti celebration upon 100%',
      ],
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
        'Inspired by Japanese temple Omamori (御守) talismans. Combines live progression with authentic Japanese craftsmanship: wide margin spacing, inset pill progress bars, and tactile claimable reward seals (受/済).',
      highlights: [
        'Generous whitespace with clean breathing room',
        'Spacious inset progress capsule with centered live count (15 / 20 XP)',
        'Japanese Omamori / Hanko claimable reward milestone nodes',
        'Tactile interactive increments & confetti reward animations',
      ],
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
        'Emphasizes KAIwa’s bold neubrutalist personality with punchy 3D offset drop shadows, thick ink borders, tactile 鍛 (Forge) icon headers, and full-width claim banners.',
      highlights: [
        'Thick 2px ink borders with 3D drop-shadow tiles',
        'Distinct high-contrast progress blocks with bold numbers',
        'Full-width tactile claim banners for completed quests',
        'Energetic, arcade-style Japanese gamification vibe',
      ],
      component: (
        <SpaciousNeubrutalPrototype
          quests={quests}
          onClaim={handleClaimQuest}
          onIncrement={handleIncrementQuest}
        />
      ),
    },
    {
      id: 'zen',
      name: 'Zen Minimal Checklist',
      jpName: '日課 · 禅チェック',
      badge: 'Ultra Compact',
      badgeTone: 'paper',
      tagline: 'Ultra-compact single rail checklist for minimalists',
      description:
        'A lightweight, condensed checklist with single continuous progress rail for users who prefer minimal vertical space.',
      highlights: [
        'Tight ~180px vertical height',
        'Single 6px progress bar',
        'Interactive checkmark toggle',
      ],
      component: (
        <ZenQueuePrototype
          tasks={tasks}
          completedCount={tasks.filter((t) => t.done).length}
          totalCount={tasks.length}
          progressPercent={Math.round((tasks.filter((t) => t.done).length / tasks.length) * 100)}
          earnedXp={tasks.filter((t) => t.done).reduce((a, b) => a + b.xp, 0)}
          totalXp={tasks.reduce((a, b) => a + b.xp, 0)}
          onToggle={handleToggleTask}
        />
      ),
    },
  ];

  return (
    <div className="mx-auto max-w-5xl space-y-8 pb-16">
      {/* Hero Header */}
      <header className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="correction" className="rounded-md">
            PROTOTYPE LAB
          </Badge>
          <span className="font-mono text-xs font-bold text-ink/60">
            /prototype • Right Sidebar Daily Quests Redesign
          </span>
        </div>
        <h1 className="font-display text-4xl leading-tight sm:text-5xl">
          Spacious & Gamified Daily Quests
        </h1>
        <p className="max-w-2xl font-sans text-base text-ink/80">
          Explore refined, spacious design prototypes that combine Duolingo-style gamified progression with KAIwa’s distinct Japanese language tutoring identity (Omamori talismans, Hanko seals, and warm neubrutalism).
        </p>
      </header>

      {/* Global Control Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl brutal-border bg-white p-4 shadow-nav">
        <div className="flex items-center gap-3">
          <span className="font-mono text-xs font-black uppercase tracking-wider text-ink/70">
            Active Sidebar Variant:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {PROTOTYPES.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => handleSetVariant(p.id)}
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

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleResetData}
            className="flex items-center gap-1 rounded-lg border border-ink/30 bg-paper px-3 py-1.5 font-mono text-xs font-bold text-ink hover:bg-white transition-colors"
          >
            <RefreshCw className="h-3 w-3" />
            <span>Reset Demo Data</span>
          </button>
          <Link
            href="/"
            className="flex items-center gap-1 rounded-lg bg-mustard px-3 py-1.5 font-mono text-xs font-black text-ink shadow-nav hover:bg-correction hover:text-paper transition-all"
          >
            <span>Back to App</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>

      {/* View Switcher Tabs */}
      <div className="flex border-b-2 border-border gap-2">
        <button
          type="button"
          onClick={() => setActiveTab('interactive')}
          className={cn(
            'px-4 py-2.5 font-mono text-xs font-black uppercase tracking-wider border-b-2 -mb-[2px] transition-all',
            activeTab === 'interactive'
              ? 'border-ink bg-white rounded-t-lg'
              : 'border-transparent text-ink/60 hover:text-ink'
          )}
        >
          Interactive Preview & Sandbox
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('side-by-side')}
          className={cn(
            'px-4 py-2.5 font-mono text-xs font-black uppercase tracking-wider border-b-2 -mb-[2px] transition-all',
            activeTab === 'side-by-side'
              ? 'border-ink bg-white rounded-t-lg'
              : 'border-transparent text-ink/60 hover:text-ink'
          )}
        >
          Side-by-Side Comparison
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('specs')}
          className={cn(
            'px-4 py-2.5 font-mono text-xs font-black uppercase tracking-wider border-b-2 -mb-[2px] transition-all',
            activeTab === 'specs'
              ? 'border-ink bg-white rounded-t-lg'
              : 'border-transparent text-ink/60 hover:text-ink'
          )}
        >
          Design Spec Matrix
        </button>
      </div>

      {/* TAB 1: INTERACTIVE PREVIEW */}
      {activeTab === 'interactive' && (
        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          {/* Left Column: Details & Feature Breakdown */}
          <div className="space-y-6">
            {PROTOTYPES.map((p) => {
              const isCurrent = activeVariant === p.id;

              return (
                <div
                  key={p.id}
                  onClick={() => handleSetVariant(p.id)}
                  className={cn(
                    'cursor-pointer rounded-2xl brutal-border p-5 transition-all duration-200',
                    isCurrent
                      ? 'bg-white ring-4 ring-mustard shadow-brutal'
                      : 'bg-white/60 hover:bg-white shadow-nav opacity-85 hover:opacity-100'
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-display text-xl font-black text-ink">
                          {p.name}
                        </span>
                        <Badge tone={p.badgeTone} className="text-[9px] px-1.5 py-0.5">
                          {p.badge}
                        </Badge>
                      </div>
                      <p className="mt-1 text-xs font-bold text-aizome">
                        {p.tagline}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSetVariant(p.id);
                      }}
                      className={cn(
                        'flex items-center gap-1 rounded-lg px-2.5 py-1 font-mono text-xs font-black transition-all',
                        isCurrent
                          ? 'bg-moss text-paper'
                          : 'bg-paper text-ink hover:bg-mustard border border-ink/20'
                      )}
                    >
                      {isCurrent ? (
                        <>
                          <Check className="h-3.5 w-3.5" />
                          <span>Active</span>
                        </>
                      ) : (
                        <span>Select</span>
                      )}
                    </button>
                  </div>

                  <p className="mt-3 text-xs leading-relaxed text-ink/80">
                    {p.description}
                  </p>

                  <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {p.highlights.map((h, i) => (
                      <div key={i} className="flex items-start gap-1.5 text-[11px] text-ink/70">
                        <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-moss mt-0.5" />
                        <span>{h}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right Column: Simulated Sidebar Column */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Laptop className="h-4 w-4 text-ink/70" />
                <h3 className="font-mono text-xs font-black uppercase tracking-wider text-ink">
                  Simulated Right Sidebar
                </h3>
              </div>
              <Badge tone="paper" className="text-[10px]">
                Live Preview
              </Badge>
            </div>

            {/* Sidebar Mock Container */}
            <div className="brutal-border rounded-2xl bg-paper p-4 shadow-brutal space-y-4">
              {/* Simulated mini stats bar */}
              <div className="grid grid-cols-2 gap-2">
                <div className="brutal-border rounded-xl bg-white p-2.5 text-center shadow-nav">
                  <Flame className="mx-auto h-4 w-4 text-correction" />
                  <p className="font-display text-lg leading-tight mt-0.5">3</p>
                  <p className="font-mono text-[8px] font-black uppercase text-ink/50">
                    Streak
                  </p>
                </div>
                <div className="brutal-border rounded-xl bg-white p-2.5 text-center shadow-nav">
                  <Sparkles className="mx-auto h-4 w-4 text-aizome" />
                  <p className="font-display text-lg leading-tight mt-0.5">140</p>
                  <p className="font-mono text-[8px] font-black uppercase text-ink/50">
                    XP
                  </p>
                </div>
              </div>

              {/* The Live Active Prototype */}
              <div>
                <p className="mb-2 font-mono text-[10px] font-bold text-ink/50 uppercase tracking-wider">
                  Rendering: {PROTOTYPES.find((p) => p.id === activeVariant)?.name}
                </p>
                {PROTOTYPES.find((p) => p.id === activeVariant)?.component}
              </div>

              {/* Interactive Controls Guide */}
              <div className="rounded-xl bg-white/70 p-3 text-[11px] text-ink/70 border border-ink/10 space-y-1.5">
                <div className="flex items-center gap-1 font-bold text-ink">
                  <Info className="h-3.5 w-3.5 text-aizome" />
                  <span>Interactive Playground Tips</span>
                </div>
                <ul className="space-y-1 list-disc list-inside">
                  <li><strong>Click the icon tile</strong> on any quest to advance its progress live.</li>
                  <li><strong>Click the bouncy reward seal (受)</strong> to claim your XP reward with confetti!</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: SIDE-BY-SIDE COMPARISON */}
      {activeTab === 'side-by-side' && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {PROTOTYPES.slice(0, 3).map((p) => {
            const isCurrent = activeVariant === p.id;

            return (
              <div
                key={p.id}
                className={cn(
                  'flex flex-col justify-between rounded-2xl brutal-border bg-white p-4 shadow-nav transition-all',
                  isCurrent && 'ring-2 ring-mustard'
                )}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-display text-base leading-tight">
                        {p.name}
                      </h3>
                      <p className="font-jp text-[11px] font-bold text-ink/50">
                        {p.jpName}
                      </p>
                    </div>
                    {isCurrent && (
                      <Badge tone="moss" className="text-[10px] px-2 py-0.5">
                        Active
                      </Badge>
                    )}
                  </div>

                  <div className="rounded-xl bg-paper p-2 border border-ink/10">
                    {p.component}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-ink/10">
                  <button
                    type="button"
                    onClick={() => handleSetVariant(p.id)}
                    className={cn(
                      'w-full rounded-lg py-2 font-mono text-xs font-black transition-all',
                      isCurrent
                        ? 'bg-moss text-paper cursor-default'
                        : 'bg-mustard text-ink hover:bg-correction hover:text-paper shadow-nav'
                    )}
                  >
                    {isCurrent ? 'Currently Active' : `Switch to ${p.name}`}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TAB 3: DESIGN SPEC MATRIX */}
      {activeTab === 'specs' && (
        <div className="rounded-2xl brutal-border bg-white p-6 shadow-nav space-y-6 overflow-x-auto">
          <div>
            <h2 className="font-display text-2xl">Prototype Design Matrix</h2>
            <p className="font-sans text-xs text-ink/70 mt-1">
              Comparing Duolingo-inspired gamification vs KAIwa Japanese-native execution.
            </p>
          </div>

          <table className="w-full text-left font-sans text-xs border-collapse">
            <thead>
              <tr className="border-b-2 border-border font-mono font-black uppercase text-[11px] text-ink">
                <th className="py-3 px-3">Dimension</th>
                <th className="py-3 px-3">Duolingo Reference</th>
                <th className="py-3 px-3 text-mustard bg-ink/5 rounded-t font-black">Option 1: Spacious Omamori (Recommended)</th>
                <th className="py-3 px-3">Option 2: Spacious Zen Path</th>
                <th className="py-3 px-3">Option 3: Neubrutal Forge</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/20">
              <tr>
                <td className="py-3 px-3 font-bold text-ink">Spacing & Layout</td>
                <td className="py-3 px-3 text-ink/70">Dense dark pill rows</td>
                <td className="py-3 px-3 font-bold text-moss">Spacious 20px padding, airy open rhythm</td>
                <td className="py-3 px-3 text-ink/80">Segmented card rows with soft borders</td>
                <td className="py-3 px-3 text-ink/80">Thick neubrutal tiles with 3D drop shadows</td>
              </tr>
              <tr>
                <td className="py-3 px-3 font-bold text-ink">Reward Mechanism</td>
                <td className="py-3 px-3 text-ink/70">Generic Bronze/Silver/Gold chests</td>
                <td className="py-3 px-3 font-bold text-correction">Japanese Omamori Talismans & Hanko Stamps (受/済)</td>
                <td className="py-3 px-3 text-ink/80">Jade Blessing Gifts with XP badges</td>
                <td className="py-3 px-3 text-ink/80">Full-width Forge claim banners</td>
              </tr>
              <tr>
                <td className="py-3 px-3 font-bold text-ink">Progress Indicator</td>
                <td className="py-3 px-3 text-ink/70">Solid rounded bar with 0/20 text</td>
                <td className="py-3 px-3 font-bold text-ink">Brutal border pill with centered live ratio</td>
                <td className="py-3 px-3 text-ink/80">Subtle green continuous rail with % label</td>
                <td className="py-3 px-3 text-ink/80">High-contrast solid fill with mono numbers</td>
              </tr>
              <tr>
                <td className="py-3 px-3 font-bold text-ink">Identity & Theme</td>
                <td className="py-3 px-3 text-ink/70">Generic mobile game</td>
                <td className="py-3 px-3 font-bold text-aizome">KAIwa Japanese Language Tutor (Paper + Ink + Kanji)</td>
                <td className="py-3 px-3 text-ink/80">Zen Tea-house mastery flow</td>
                <td className="py-3 px-3 text-ink/80">Arcade training forge</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
