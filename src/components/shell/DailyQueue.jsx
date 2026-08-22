'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import confetti from 'canvas-confetti';
import { 
  Zap, 
  Target, 
  Clock, 
  Check, 
  Sparkles, 
  Gift, 
  ChevronRight, 
  Flame, 
  BookOpen, 
  MessageSquare, 
  Layers,
  Award,
  CircleDot
} from 'lucide-react';
import Card from '../ui/Card.jsx';
import Badge from '../ui/Badge.jsx';
import { cn } from '../../lib/utils.js';
import { useAuth } from '../../lib/auth/AuthContext.jsx';
import {
  getTodayDateKey,
  get24HourCycleRemaining,
  loadUserDailyState,
  saveUserDailyState,
  resolveIcon,
} from '../../lib/dailyQuests.js';
import { QUEST_POOL, TASK_POOL } from '../../data/dailyQuestsDataset.js';

export { QUEST_POOL, TASK_POOL };

export const DEFAULT_QUESTS = [
  {
    id: 'quest-xp-20',
    title: 'Earn 20 XP in lessons',
    jpTitle: '20 XP 獲得',
    category: 'XP',
    current: 15,
    target: 20,
    unit: 'XP',
    rewardXp: 20,
    rewardLabel: '御守',
    rewardName: 'Fortune Talisman',
    claimed: false,
    color: 'mustard',
    icon: Zap,
    href: '/#lessons',
  },
  {
    id: 'quest-chat-2',
    title: 'Complete 2 Kaiwa chats',
    jpTitle: '会話を2回達成',
    category: 'Kaiwa',
    current: 1,
    target: 2,
    unit: 'chats',
    rewardXp: 30,
    rewardLabel: '判子',
    rewardName: 'Mastery Hanko',
    claimed: false,
    color: 'moss',
    icon: Target,
    href: '/chat',
  },
  {
    id: 'quest-time-15',
    title: 'Spend 15 mins learning',
    jpTitle: '15分間学習する',
    category: 'Time',
    current: 15,
    target: 15,
    unit: 'mins',
    rewardXp: 25,
    rewardLabel: '吉',
    rewardName: 'Daily Blessing',
    claimed: false,
    color: 'correction',
    icon: Clock,
    href: '/briefing/ordering-food',
  },
];

export const DEFAULT_TASKS = [
  {
    id: 'task-review-n5',
    title: 'Review 5 N5 phrases',
    jpLabel: '復習',
    category: 'Review',
    xp: 10,
    done: true,
    href: '/#lessons',
    icon: BookOpen,
  },
  {
    id: 'task-complete-chat',
    title: 'Complete 1 Kaiwa chat',
    jpLabel: '会話',
    category: 'Kaiwa',
    xp: 25,
    done: false,
    href: '/chat',
    icon: MessageSquare,
  },
  {
    id: 'task-ordering-food',
    title: 'Practice Ordering Food',
    jpLabel: 'ロールプレイ',
    category: 'Roleplay',
    xp: 20,
    done: false,
    href: '/briefing/ordering-food',
    icon: Layers,
  },
  {
    id: 'task-daily-streak',
    title: 'Daily 10-min streak',
    jpLabel: '日課',
    category: 'Time',
    xp: 15,
    done: false,
    href: '/',
    icon: Clock,
  },
];

/**
 * DailyQueue component supporting:
 * - 'spacious-omamori' (Spacious & Minimalist Japanese Shrine Talisman Quests) [Recommended]
 * - 'spacious-zen' (Airy Zen Garden Mastery Path)
 * - 'spacious-neubrutal' (Spacious Tactile Neubrutal Forge with Hanko Stamps)
 * - 'zen' (Ultra-compact minimal checklist)
 * - 'hanko' (Compact Hanko grid)
 */
export default function DailyQueue({
  variant = 'spacious-zen',
  initialQuests = null,
  initialTasks = null,
  userId: customUserId = null,
  onQuestClaim,
  className = '',
}) {
  const { user } = useAuth ? useAuth() : {};
  const effectiveUserId = customUserId || user?.uid || 'guest';
  const [currentDateKey, setCurrentDateKey] = useState(() => getTodayDateKey());
  const [timeLeft, setTimeLeft] = useState(() => get24HourCycleRemaining());

  const [quests, setQuests] = useState(() => {
    if (initialQuests) return initialQuests;
    const state = loadUserDailyState(effectiveUserId, currentDateKey);
    return state.quests;
  });

  const [tasks, setTasks] = useState(() => {
    if (initialTasks) return initialTasks;
    const state = loadUserDailyState(effectiveUserId, currentDateKey);
    return state.tasks;
  });

  const [selectedVariant, setSelectedVariant] = useState(variant);

  // Sync when initialQuests or initialTasks change
  useEffect(() => {
    if (initialQuests) {
      setQuests(initialQuests);
    }
  }, [initialQuests]);

  useEffect(() => {
    if (initialTasks) {
      setTasks(initialTasks);
    }
  }, [initialTasks]);

  // Sync state if user changes and no explicit initialQuests passed
  useEffect(() => {
    if (!initialQuests && !initialTasks) {
      const state = loadUserDailyState(effectiveUserId, currentDateKey);
      setQuests(state.quests);
      setTasks(state.tasks);
    }
  }, [effectiveUserId, currentDateKey, initialQuests, initialTasks]);

  // 24-hour live countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      const remaining = get24HourCycleRemaining();
      setTimeLeft(remaining);

      // If midnight passed and dateKey changed, auto-refresh randomized daily quests
      const today = getTodayDateKey();
      if (today !== currentDateKey) {
        setCurrentDateKey(today);
        if (!initialQuests && !initialTasks) {
          const freshState = loadUserDailyState(effectiveUserId, today);
          setQuests(freshState.quests);
          setTasks(freshState.tasks);
        }
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [effectiveUserId, currentDateKey, initialQuests, initialTasks]);

  useEffect(() => {
    if (variant) {
      setSelectedVariant(variant);
    } else if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('kaiwa_daily_queue_variant');
      if (saved) setSelectedVariant(saved);
    }
  }, [variant]);

  useEffect(() => {
    const handleVariantChange = (e) => {
      if (e.detail?.variant) {
        setSelectedVariant(e.detail.variant);
      }
    };
    window.addEventListener('kaiwa:queue-variant-change', handleVariantChange);
    return () => window.removeEventListener('kaiwa:queue-variant-change', handleVariantChange);
  }, []);

  const triggerCelebration = (e) => {
    if (typeof confetti === 'function') {
      const rect = e?.currentTarget?.getBoundingClientRect();
      const originX = rect ? (rect.left + rect.width / 2) / window.innerWidth : 0.8;
      const originY = rect ? (rect.top + rect.height / 2) / window.innerHeight : 0.4;

      confetti({
        particleCount: 40,
        spread: 60,
        origin: { x: originX, y: originY },
        colors: ['#F2C14E', '#4A7A63', '#D6432B', '#2F4858', '#FAF7F0'],
      });
    }
  };

  const handleClaimQuest = (questId, e) => {
    triggerCelebration(e);
    setQuests((prev) => {
      const updated = prev.map((q) => (q.id === questId ? { ...q, claimed: true } : q));
      saveUserDailyState(effectiveUserId, { dateKey: currentDateKey, quests: updated, tasks });
      return updated;
    });
    if (onQuestClaim) onQuestClaim(questId);
  };

  const handleIncrementQuest = (questId) => {
    setQuests((prev) => {
      const updated = prev.map((q) => {
        if (q.id === questId) {
          const nextVal = q.current < q.target ? q.current + 1 : 0;
          return { ...q, current: nextVal, claimed: nextVal < q.target ? false : q.claimed };
        }
        return q;
      });
      saveUserDailyState(effectiveUserId, { dateKey: currentDateKey, quests: updated, tasks });
      return updated;
    });
  };

  const handleToggleTask = (taskId) => {
    setTasks((prev) => {
      const updated = prev.map((t) => (t.id === taskId ? { ...t, done: !t.done } : t));
      saveUserDailyState(effectiveUserId, { dateKey: currentDateKey, quests, tasks: updated });
      return updated;
    });
  };

  // Render variant
  switch (selectedVariant) {
    case 'spacious-zen':
      return (
        <SpaciousZenPrototype
          quests={quests}
          timeLeft={timeLeft}
          onClaim={handleClaimQuest}
          onIncrement={handleIncrementQuest}
          className={className}
        />
      );
    case 'spacious-neubrutal':
      return (
        <SpaciousNeubrutalPrototype
          quests={quests}
          timeLeft={timeLeft}
          onClaim={handleClaimQuest}
          onIncrement={handleIncrementQuest}
          className={className}
        />
      );
    case 'zen':
      return (
        <ZenQueuePrototype
          tasks={tasks}
          timeLeft={timeLeft}
          completedCount={tasks.filter((t) => t.done).length}
          totalCount={tasks.length}
          progressPercent={tasks.length > 0 ? Math.round((tasks.filter((t) => t.done).length / tasks.length) * 100) : 0}
          earnedXp={tasks.filter((t) => t.done).reduce((a, b) => a + (b.xp || 0), 0)}
          totalXp={tasks.reduce((a, b) => a + (b.xp || 0), 0)}
          onToggle={handleToggleTask}
          className={className}
        />
      );
    case 'hanko':
      return (
        <HankoQueuePrototype
          tasks={tasks}
          timeLeft={timeLeft}
          completedCount={tasks.filter((t) => t.done).length}
          totalCount={tasks.length}
          progressPercent={tasks.length > 0 ? Math.round((tasks.filter((t) => t.done).length / tasks.length) * 100) : 0}
          earnedXp={tasks.filter((t) => t.done).reduce((a, b) => a + (b.xp || 0), 0)}
          totalXp={tasks.reduce((a, b) => a + (b.xp || 0), 0)}
          onToggle={handleToggleTask}
          className={className}
        />
      );
    case 'spacious-omamori':
      return (
        <SpaciousOmamoriPrototype
          quests={quests}
          timeLeft={timeLeft}
          onClaim={handleClaimQuest}
          onIncrement={handleIncrementQuest}
          className={className}
        />
      );
    default:
      return (
        <SpaciousZenPrototype
          quests={quests}
          timeLeft={timeLeft}
          onClaim={handleClaimQuest}
          onIncrement={handleIncrementQuest}
          className={className}
        />
      );
  }
}

/* =========================================================================
   PROTOTYPE A: "SPACIOUS OMAMORI QUESTS" (御守 · Shrine Talismans)
   Spacious, minimal, warm paper layout with Japanese Omamori blessing rewards
   ========================================================================= */
export function SpaciousOmamoriPrototype({
  quests = [],
  timeLeft,
  onClaim,
  onIncrement,
  className = '',
}) {
  const completedCount = quests.filter((q) => q.current >= q.target).length;

  return (
    <div
      className={cn(
        'brutal-border rounded-2xl bg-white p-5 shadow-nav space-y-5 transition-all duration-200',
        className
      )}
    >
      {/* Spacious Header with 24-Hour Timer */}
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <span className="flex h-5 items-center justify-center rounded bg-ink px-1.5 font-jp text-[10px] font-bold text-paper">
              御守
            </span>
            <h3 className="font-display text-base tracking-tight text-ink">
              Daily Quests
            </h3>
          </div>
          <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-ink/50">
            今日の修行 · {completedCount}/{quests.length} Ready
          </p>
        </div>

        <div className="flex flex-col items-end gap-0.5">
          <div
            title="Quests reset every 24 hours"
            className="inline-flex items-center gap-1 rounded-full border border-ink/20 bg-paper px-2 py-0.5 font-mono text-[10px] font-black text-ink/75 shadow-xs"
          >
            <Clock className="h-3 w-3 text-correction animate-pulse" />
            <span>{timeLeft?.formatted || '24h Timer'}</span>
          </div>
          <span className="font-mono text-[8px] font-black tracking-widest text-ink/40 uppercase">
            24H CYCLE
          </span>
        </div>
      </div>

      {/* Spacious Quest Rows */}
      <div className="space-y-4">
        {quests.map((quest) => {
          const Icon = resolveIcon(quest.icon || quest.iconName, Zap);
          const isComplete = quest.current >= quest.target;
          const pct = Math.min(Math.round((quest.current / quest.target) * 100), 100);

          return (
            <div
              key={quest.id}
              className="group relative flex items-center gap-3.5"
            >
              {/* Left Aesthetic Icon Tile */}
              <button
                type="button"
                onClick={() => onIncrement && onIncrement(quest.id)}
                title="Click to test progress increment"
                className={cn(
                  'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border-2 border-ink transition-all duration-200 select-none shadow-[2px_2px_0px_0px_#1C1C1C] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none',
                  quest.color === 'mustard' && 'bg-mustard text-ink',
                  quest.color === 'moss' && 'bg-moss text-paper',
                  quest.color === 'correction' && 'bg-correction text-paper',
                  quest.color === 'aizome' && 'bg-aizome text-paper'
                )}
              >
                <Icon className="h-5 w-5 stroke-[2.5]" />
              </button>

              {/* Middle: Title & Spacious Inset Progress Capsule */}
              <div className="min-w-0 flex-1 space-y-1.5">
                <div className="flex items-center justify-between">
                  <p className="truncate text-xs font-black tracking-tight text-ink">
                    {quest.title}
                  </p>
                  <span className="font-mono text-[10px] font-bold text-ink/50">
                    +{quest.rewardXp} XP
                  </span>
                </div>

                {/* Spacious Inset Pill Bar with Centered Counter */}
                <div className="relative flex h-5.5 w-full items-center overflow-hidden rounded-full border-2 border-ink bg-paper shadow-[1px_1px_0px_0px_#1C1C1C]">
                  <div
                    className={cn(
                      'h-full rounded-full transition-all duration-500 ease-out',
                      isComplete ? 'bg-moss' : 'bg-mustard'
                    )}
                    style={{ width: `${pct}%` }}
                  />
                  {/* Centered Ratio Text */}
                  <span
                    className={cn(
                      'pointer-events-none absolute inset-0 flex items-center justify-center font-mono text-[10px] font-black tracking-widest uppercase',
                      pct > 55 && !isComplete ? 'text-ink' : pct === 100 ? 'text-paper' : 'text-ink/80'
                    )}
                  >
                    {quest.current} / {quest.target} {quest.unit}
                  </span>
                </div>
              </div>

              {/* Right: Japanese Omamori / Hanko Reward Node */}
              <div className="shrink-0 pl-1">
                {quest.claimed ? (
                  <div className="flex h-10 w-9 items-center justify-center rounded-lg border-2 border-moss bg-[#F0FDF4] font-jp text-xs font-black text-moss shadow-[1px_1px_0px_0px_#4A7A63]">
                    済
                  </div>
                ) : isComplete ? (
                  <button
                    type="button"
                    onClick={(e) => onClaim && onClaim(quest.id, e)}
                    className="group/btn flex h-10 w-9 flex-col items-center justify-center rounded-lg border-2 border-ink bg-mustard font-jp text-[11px] font-black text-ink shadow-[2px_2px_0px_0px_#1C1C1C] hover:bg-correction hover:text-paper transition-all animate-bounce"
                    title="Click to claim reward!"
                  >
                    <Sparkles className="h-3 w-3" />
                    <span>受</span>
                  </button>
                ) : (
                  <div
                    className="flex h-10 w-9 flex-col items-center justify-center rounded-lg border-2 border-ink/30 bg-paper/60 font-jp text-[10px] font-bold text-ink/40 shadow-sm"
                    title={`Unlocks at ${quest.target} ${quest.unit}`}
                  >
                    <span className="text-[11px]">{quest.rewardLabel}</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Spacious Footer Hint */}
      <div className="flex items-center justify-between border-t-2 border-ink/10 pt-3 text-[11px] font-mono text-ink/60">
        <span>Daily Reward Chest</span>
        <span className="font-black text-ink">
          {completedCount === quests.length && quests.length > 0 ? '✨ All Blessings Claimed' : 'Complete all to unlock bonus'}
        </span>
      </div>
    </div>
  );
}

/* =========================================================================
   PROTOTYPE B: "SPACIOUS ZEN PROTOTYPE" (日課 · Spacious Zen Quests)
   All Daily Quests in a single unified box with spacious rows & dividers
   ========================================================================= */
export function SpaciousZenPrototype({
  quests = [],
  timeLeft,
  onClaim,
  onIncrement,
  className = '',
}) {
  const completedCount = quests.filter((q) => q.current >= q.target).length;

  return (
    <div
      className={cn(
        'brutal-border rounded-2xl bg-white p-5 shadow-nav space-y-4 transition-all duration-200',
        className
      )}
    >
      {/* Unified Card Header with 24-Hour Timer */}
      <div className="flex items-center justify-between border-b border-ink/10 pb-3">
        <div>
          <h3 className="font-display text-lg tracking-tight text-ink">
            Daily Quests
          </h3>
          <span className="font-mono text-xs font-black uppercase tracking-wider text-ink/50">
            {completedCount} / {quests.length} Done
          </span>
        </div>

        <div
          title="24-hour countdown timer"
          className="inline-flex items-center gap-1.5 rounded-lg border border-ink/20 bg-paper px-2.5 py-1 font-mono text-xs font-black text-ink/80 shadow-xs"
        >
          <Clock className="h-3.5 w-3.5 text-correction animate-pulse" />
          <span>{timeLeft?.formatted || '24h Timer'}</span>
        </div>
      </div>

      {/* Spacious Quest Rows inside the Single Box */}
      <div className="space-y-4 divide-y divide-ink/10">
        {quests.map((quest, index) => {
          const isComplete = quest.current >= quest.target;
          const pct = Math.min(Math.round((quest.current / quest.target) * 100), 100);

          return (
            <div
              key={quest.id}
              className={cn(
                'space-y-2.5',
                index > 0 && 'pt-4'
              )}
            >
              {/* Top Row: Title on left, XP / Claim on right */}
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <h4 className="text-sm font-black leading-snug text-ink">
                    {quest.title}
                  </h4>
                </div>

                {/* Right: +XP Badge / Claim Button */}
                <div className="shrink-0">
                  {quest.claimed ? (
                    <span className="inline-flex items-center gap-1 rounded-lg border border-moss/30 bg-[#F0FDF4] px-2.5 py-1 font-mono text-xs font-black text-moss whitespace-nowrap">
                      <Check className="h-3.5 w-3.5 stroke-[3]" />
                      <span>Claimed</span>
                    </span>
                  ) : isComplete ? (
                    <button
                      type="button"
                      onClick={(e) => onClaim && onClaim(quest.id, e)}
                      className="inline-flex items-center gap-1.5 rounded-lg border-2 border-ink bg-mustard px-2.5 py-1 font-mono text-xs font-black text-ink shadow-nav hover:bg-correction hover:text-paper transition-all active:scale-95 animate-pulse whitespace-nowrap"
                      title="Click to claim reward!"
                    >
                      <Gift className="h-3.5 w-3.5" />
                      <span>Claim +{quest.rewardXp} XP</span>
                    </button>
                  ) : (
                    <span className="inline-block whitespace-nowrap font-mono text-xs font-black text-ink/70">
                      +{quest.rewardXp} XP
                    </span>
                  )}
                </div>
              </div>

              {/* Spacious Progress Bar */}
              <div className="space-y-1.5">
                <div
                  onClick={() => onIncrement && onIncrement(quest.id)}
                  className="relative h-2.5 w-full cursor-pointer overflow-hidden rounded-full border border-ink/20 bg-paper transition-all hover:border-ink"
                  title="Click to advance progress"
                >
                  <div
                    className={cn(
                      'h-full rounded-full transition-all duration-500 ease-out',
                      isComplete ? 'bg-moss' : 'bg-aizome'
                    )}
                    style={{ width: `${pct}%` }}
                  />
                </div>

                {/* Bottom Status Row */}
                <div className="flex items-center justify-between font-mono text-[11px] font-bold text-ink/50">
                  <span>{pct}% complete</span>
                  <span className="text-ink font-black">
                    {quest.current} / {quest.target} {quest.unit || ''}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* =========================================================================
   PROTOTYPE C: "SPACIOUS NEUBRUTAL FORGE" (鍛錬 · Tactile Stamp Forge)
   Thick offset ink borders, tactile button stamps, high contrast
   ========================================================================= */
export function SpaciousNeubrutalPrototype({
  quests = [],
  timeLeft,
  onClaim,
  onIncrement,
  className = '',
}) {
  return (
    <div
      className={cn(
        'brutal-border rounded-2xl bg-white p-5 shadow-brutal space-y-4',
        className
      )}
    >
      <div className="flex items-center justify-between border-b-2 border-ink pb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg border-2 border-ink bg-mustard font-display text-sm font-black shadow-nav">
            鍛
          </div>
          <div>
            <h3 className="font-display text-base">Daily Quests</h3>
            <p className="font-mono text-[9px] font-black uppercase text-correction">
              Tanren · Forge Your Skills
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 rounded-lg border-2 border-ink bg-paper px-2 py-1 font-mono text-[10px] font-black text-ink shadow-[1px_1px_0px_0px_#1C1C1C]">
          <Clock className="h-3 w-3 text-correction" />
          <span>{timeLeft?.formatted || '24h'}</span>
        </div>
      </div>

      <div className="space-y-3.5">
        {quests.map((quest) => {
          const isComplete = quest.current >= quest.target;
          const pct = Math.min(Math.round((quest.current / quest.target) * 100), 100);

          return (
            <div
              key={quest.id}
              className="rounded-xl border-2 border-ink bg-paper p-3 shadow-nav space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-ink">{quest.title}</span>
                <span className="rounded bg-white px-1.5 py-0.5 border border-ink font-mono text-[9px] font-black">
                  +{quest.rewardXp} XP
                </span>
              </div>

              {/* Progress capsule */}
              <div
                onClick={() => onIncrement && onIncrement(quest.id)}
                className="relative flex h-6 w-full cursor-pointer items-center overflow-hidden rounded-md border-2 border-ink bg-white"
                title="Click to advance"
              >
                <div
                  className={cn(
                    'h-full transition-all duration-300',
                    isComplete ? 'bg-moss' : 'bg-mustard'
                  )}
                  style={{ width: `${pct}%` }}
                />
                <span className="absolute inset-0 flex items-center justify-center font-mono text-[10px] font-black text-ink">
                  {quest.current} / {quest.target} {quest.unit || ''}
                </span>
              </div>

              {/* Claim button if ready */}
              {isComplete && !quest.claimed && (
                <button
                  type="button"
                  onClick={(e) => onClaim && onClaim(quest.id, e)}
                  className="w-full rounded-md border-2 border-ink bg-correction py-1.5 font-mono text-xs font-black uppercase text-paper shadow-nav hover:bg-mustard hover:text-ink transition-all active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
                >
                  Claim +{quest.rewardXp} XP Reward
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* =========================================================================
   COMPACT PROTOTYPE: ZEN MINIMALIST (日課 · Compact Checklist)
   ========================================================================= */
export function ZenQueuePrototype({
  tasks = [],
  timeLeft,
  completedCount,
  totalCount,
  progressPercent,
  earnedXp,
  totalXp,
  onToggle,
  className = '',
}) {
  const isAllComplete = completedCount === totalCount && totalCount > 0;

  return (
    <div
      className={cn(
        'brutal-border rounded-xl bg-white p-3.5 shadow-nav transition-all duration-200',
        className
      )}
    >
      <div className="flex items-center justify-between gap-2 pb-2.5">
        <div className="flex items-center gap-1.5">
          <span className="inline-flex items-center justify-center rounded bg-ink px-1.5 py-0.5 font-jp text-[10px] font-bold text-paper">
            日課
          </span>
          <span className="font-mono text-xs font-black uppercase tracking-wider text-ink">
            Daily Queue
          </span>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 font-mono text-[10px] font-black text-correction bg-paper border border-ink/20 px-1.5 py-0.5 rounded">
            <Clock className="h-2.5 w-2.5" />
            <span>{timeLeft?.formattedDigital || timeLeft?.formatted}</span>
          </div>
          <span className="font-mono text-xs font-black text-ink/70">
            <span className={cn(completedCount > 0 && 'text-moss')}>{completedCount}</span>
            <span className="text-ink/30">/</span>
            <span>{totalCount}</span>
          </span>
        </div>
      </div>

      <div className="relative mb-3 h-1.5 w-full overflow-hidden rounded-full bg-paper border border-ink/20">
        <div
          className={cn(
            'h-full rounded-full transition-all duration-400 ease-out',
            isAllComplete ? 'bg-moss' : 'bg-mustard'
          )}
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      <div className="space-y-1.5" role="list" aria-label="Daily tasks">
        {tasks.map((task) => (
          <div
            key={task.id}
            onClick={() => onToggle && onToggle(task.id)}
            role="checkbox"
            aria-checked={task.done}
            tabIndex={0}
            className={cn(
              'group flex cursor-pointer items-center justify-between gap-2 rounded-lg p-1.5 transition-all duration-150 select-none outline-none focus-visible:ring-2 focus-visible:ring-mustard',
              task.done
                ? 'bg-paper/40 text-ink/50'
                : 'hover:bg-paper active:scale-[0.98]'
            )}
          >
            <div className="flex min-w-0 items-center gap-2.5">
              <div
                className={cn(
                  'flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded border-2 border-ink transition-all duration-150',
                  task.done
                    ? 'border-moss bg-moss text-paper shadow-none'
                    : 'bg-white group-hover:border-ink shadow-[1px_1px_0px_0px_#1C1C1C]'
                )}
              >
                {task.done && <Check className="h-3 w-3 stroke-[3]" />}
              </div>
              <span
                className={cn(
                  'block truncate text-xs font-bold leading-tight transition-all',
                  task.done && 'line-through decoration-ink/40'
                )}
              >
                {task.title}
              </span>
            </div>

            <span
              className={cn(
                'shrink-0 rounded px-1.5 py-0.5 font-mono text-[9px] font-black uppercase tracking-wider',
                task.done
                  ? 'bg-moss/10 text-moss font-bold'
                  : 'bg-paper text-ink/70 border border-ink/10'
              )}
            >
              +{task.xp} XP
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* =========================================================================
   COMPACT PROTOTYPE: NEUBRUTAL HANKO (判子 · Stamp Grid)
   ========================================================================= */
export function HankoQueuePrototype({
  tasks = [],
  timeLeft,
  completedCount,
  totalCount,
  progressPercent,
  earnedXp,
  totalXp,
  onToggle,
  className = '',
}) {
  return (
    <div
      className={cn(
        'brutal-border rounded-xl bg-white p-3.5 shadow-nav space-y-3',
        className
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-correction bg-paper font-jp text-[10px] font-black text-correction shadow-[1px_1px_0px_#D6432B]">
            済
          </div>
          <div>
            <h3 className="font-display text-sm leading-none">今日の課題</h3>
            <p className="font-mono text-[9px] font-bold tracking-widest text-ink/50 uppercase">
              Daily Mission
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="font-mono text-[9px] font-black text-ink/70 bg-paper border border-ink/20 px-1.5 py-0.5 rounded shadow-xs">
            ⏱️ {timeLeft?.formattedDigital || timeLeft?.formatted}
          </span>
          <div className="flex items-center gap-1">
            {tasks.map((t, idx) => (
              <div
                key={idx}
                className={cn(
                  'h-3.5 w-2 rounded-xs border border-ink transition-colors',
                  t.done ? 'bg-moss' : 'bg-paper'
                )}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-1.5">
        {tasks.map((task) => (
          <div
            key={task.id}
            onClick={() => onToggle && onToggle(task.id)}
            role="checkbox"
            aria-checked={task.done}
            tabIndex={0}
            className={cn(
              'group flex cursor-pointer items-center justify-between gap-2 rounded-lg border-2 border-ink p-2 transition-all duration-150 select-none shadow-[2px_2px_0px_0px_#1C1C1C] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none',
              task.done ? 'bg-[#F0FDF4] border-moss/80' : 'bg-paper hover:bg-mustard/20'
            )}
          >
            <div className="flex items-center gap-2 min-w-0">
              <span
                className={cn(
                  'flex h-6 w-6 shrink-0 items-center justify-center rounded border border-ink font-jp text-xs font-black transition-colors',
                  task.done
                    ? 'border-moss bg-moss text-paper'
                    : 'bg-white text-ink group-hover:bg-mustard'
                )}
              >
                {task.done ? '済' : (task.jpLabel || '課').slice(0, 1)}
              </span>

              <div className="min-w-0 truncate">
                <p
                  className={cn(
                    'truncate text-xs font-bold leading-tight',
                    task.done && 'text-ink/60 line-through'
                  )}
                >
                  {task.title}
                </p>
                <p className="font-mono text-[9px] text-ink/40">
                  {task.category}
                </p>
              </div>
            </div>

            <span
              className={cn(
                'shrink-0 rounded px-1.5 py-0.5 font-mono text-[10px] font-black',
                task.done ? 'text-moss' : 'text-correction'
              )}
            >
              +{task.xp}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
