'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import Badge from '../components/ui/Badge.jsx';
import Button from '../components/ui/Button.jsx';
import Card from '../components/ui/Card.jsx';
import LogoMark from '../components/ui/LogoMark.jsx';
import { cn } from '../lib/utils.js';

const navItems = [
  ['Home', '/'],
  ['Roleplay', '/dashboard'],
  ['Past Practice', '/dashboard'],
  ['Profile', '/dashboard'],
  ['Settings', '/dashboard'],
];

const filters = ['ALL', 'Beginner', 'Food', 'Memes', 'Life'];

const lessons = [
  {
    title: 'Introduction',
    jp: 'はじめまして',
    category: 'Beginner',
    minutes: 8,
    progress: 100,
    tone: 'moss',
  },
  {
    title: 'Common Phrases',
    jp: 'よく使う表現',
    category: 'Beginner',
    minutes: 12,
    progress: 68,
    tone: 'mustard',
  },
  {
    title: 'Likes & Dislikes',
    jp: '好き・嫌い',
    category: 'Life',
    minutes: 10,
    progress: 42,
    tone: 'correction',
  },
  {
    title: 'Basic Verbs',
    jp: '基本動詞',
    category: 'Beginner',
    minutes: 15,
    progress: 25,
    tone: 'aizome',
  },
  {
    title: 'Simple Sentences',
    jp: '簡単な文',
    category: 'Life',
    minutes: 14,
    progress: 0,
    tone: 'mustard',
  },
  {
    title: 'Personal Info',
    jp: '自己紹介',
    category: 'Life',
    minutes: 9,
    progress: 0,
    tone: 'moss',
  },
  {
    title: 'Ordering Food',
    jp: '注文する',
    category: 'Food',
    minutes: 11,
    progress: 18,
    tone: 'correction',
  },
  {
    title: 'Meme Replies',
    jp: 'ネット表現',
    category: 'Memes',
    minutes: 7,
    progress: 0,
    tone: 'aizome',
  },
];

const streakDays = [
  ['Mon', true],
  ['Tue', true],
  ['Wed', true],
  ['Thu', true],
  ['Fri', true],
  ['Sat', false],
  ['Sun', false],
];

const levelRows = [
  { label: '0-99 XP', name: 'Kana Rookie', points: 0 },
  { label: '100-249 XP', name: 'N5 Starter', points: 100 },
  { label: '250-499 XP', name: 'Phrase Builder', points: 250 },
  { label: '500+ XP', name: 'Kaiwa Regular', points: 500 },
];

const tasks = [
  ['Review 5 phrases', '5 XP', true],
  ['Finish 1 lesson', '20 XP', false],
  ['Roleplay café order', '30 XP', false],
  ['Practice 10 minutes', '15 XP', false],
];

const currentPoints = 286;

export default function Home() {
  const [activeFilter, setActiveFilter] = useState('ALL');
  const visibleLessons = useMemo(() => {
    if (activeFilter === 'ALL') return lessons;
    return lessons.filter((lesson) => lesson.category === activeFilter);
  }, [activeFilter]);

  return (
    <main className="min-h-screen bg-paper text-ink">
      <div className="grid min-h-screen lg:grid-cols-[17rem_minmax(0,1fr)_18rem]">
        <HomeSidebar />

        <section className="min-w-0 px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
          <div className="mx-auto max-w-5xl">
            <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="label-mono text-correction">Lesson module</p>
                <h1 className="mt-2 font-display text-4xl leading-none sm:text-5xl">Today’s study board</h1>
              </div>
              <Badge tone="moss">Local progress</Badge>
            </header>

            <CustomLessonCard />

            <div className="mt-6 flex flex-wrap gap-3" aria-label="Lesson filters">
              {filters.map((filter) => (
                <button
                  key={filter}
                  type="button"
                  onClick={() => setActiveFilter(filter)}
                  className={cn(
                    'brutal-border px-4 py-3 font-mono text-sm font-black uppercase tracking-[0.12em] shadow-nav transition-all hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-none',
                    activeFilter === filter ? 'bg-correction text-paper' : 'bg-white text-ink hover:bg-mustard',
                  )}
                >
                  {filter}
                </button>
              ))}
            </div>

            <section className="mt-8 grid gap-5 md:grid-cols-2" aria-label="Lesson cards">
              {visibleLessons.map((lesson) => (
                <LessonCard key={lesson.title} lesson={lesson} />
              ))}
            </section>
          </div>
        </section>

        <ProgressRail />
      </div>
    </main>
  );
}

function HomeSidebar() {
  return (
    <aside className="border-b-2 border-border bg-aizome p-5 text-paper lg:sticky lg:top-0 lg:min-h-screen lg:border-b-0 lg:border-r-2">
      <Link href="/" className="group flex items-center gap-3">
        <LogoMark className="brutal-border h-16 w-16 rotate-[-7deg] shadow-shadow transition-transform group-hover:rotate-0" />
        <div>
          <p className="font-display text-4xl leading-none">Kaiwa</p>
          <p className="label-mono mt-1 text-mustard">Study home</p>
        </div>
      </Link>

      <nav className="mt-8 flex gap-2 overflow-x-auto pb-2 lg:flex-col lg:overflow-visible lg:pb-0" aria-label="Primary navigation">
        {navItems.map(([label, href], index) => (
          <Link
            key={label}
            href={href}
            className={cn(
              'brutal-border whitespace-nowrap bg-paper px-4 py-3 font-mono text-sm font-black uppercase tracking-[0.12em] text-ink shadow-nav transition-all hover:translate-x-[3px] hover:translate-y-[3px] hover:bg-mustard hover:shadow-none lg:w-full',
              index === 0 && 'bg-mustard',
            )}
          >
            {label}
          </Link>
        ))}
      </nav>

      <Card padding="sm" className="mt-8 hidden bg-paper text-ink lg:block">
        <p className="label-mono text-correction">Saved locally</p>
        <p className="mt-3 text-sm font-bold leading-6">
          Scores, streaks, and lesson state are represented as local app data for the capstone build.
        </p>
      </Card>
    </aside>
  );
}

function CustomLessonCard() {
  return (
    <Card padding="lg" className="notebook-panel relative overflow-hidden">
      <div className="absolute right-[-2rem] top-[-2rem] h-28 w-28 rotate-12 brutal-border bg-correction" aria-hidden="true" />
      <div className="relative grid gap-5 sm:grid-cols-[1fr_auto] sm:items-center">
        <div>
          <Badge tone="mustard">Custom lesson</Badge>
          <h2 className="mt-4 font-display text-4xl leading-none">Build your own practice</h2>
          <p className="mt-3 max-w-xl font-bold leading-7">
            Pick a topic, difficulty, or scenario and turn it into a short guided Japanese session.
          </p>
        </div>
        <Button as={Link} href="/chat/sensei" size="lg">
          Start
        </Button>
      </div>
    </Card>
  );
}

function LessonCard({ lesson }) {
  return (
    <Card as="article" padding="md" lift="press" className="group min-h-36 overflow-hidden">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Badge tone={lesson.tone}>{lesson.category}</Badge>
          <h3 className="mt-5 font-display text-3xl leading-none">{lesson.title}</h3>
          <p className="mt-2 font-jp text-lg font-bold text-aizome">{lesson.jp}</p>
        </div>
        <span className="brutal-border bg-paper px-2 py-1 font-mono text-xs font-black shadow-nav">
          {lesson.minutes}m
        </span>
      </div>
      <div className="mt-5">
        <div className="mb-2 flex items-center justify-between font-mono text-xs font-black uppercase tracking-[0.12em]">
          <span>Progress</span>
          <span>{lesson.progress}%</span>
        </div>
        <SegmentedProgress value={lesson.progress} segments={8} />
      </div>
    </Card>
  );
}

function ProgressRail() {
  return (
    <aside className="border-t-2 border-border bg-paper px-4 py-6 sm:px-6 lg:sticky lg:top-0 lg:min-h-screen lg:border-l-2 lg:border-t-0 lg:px-5 lg:py-10">
      <div className="grid gap-5">
        <TrophyStreakCard />
        <TrophyLevelCard />
        <TaskCard />
      </div>
    </aside>
  );
}

function TrophyStreakCard() {
  return (
    <Card padding="md" className="bg-white">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="label-mono text-correction">Streak</p>
          <p className="mt-2 font-display text-5xl leading-none">12</p>
          <p className="mt-1 font-mono text-xs font-black uppercase tracking-[0.12em]">days</p>
        </div>
        <span className="brutal-border bg-mustard px-3 py-2 font-mono text-xs font-black uppercase tracking-[0.14em] shadow-nav">
          Best 18
        </span>
      </div>

      <div className="mt-5 grid grid-cols-7 gap-1.5" aria-label="Last seven days streak calendar">
        {streakDays.map(([day, active]) => (
          <div key={day} className="text-center">
            <div
              className={cn(
                'brutal-border mx-auto grid h-8 w-8 place-items-center font-mono text-[10px] font-black shadow-nav',
                active ? 'bg-moss text-paper' : 'bg-paper text-ink',
              )}
            >
              {active ? '✓' : '·'}
            </div>
            <p className="mt-1 font-mono text-[9px] font-black uppercase">{day}</p>
          </div>
        ))}
      </div>

      <details className="mt-5 brutal-border bg-paper p-3 shadow-nav" open>
        <summary className="cursor-pointer font-mono text-xs font-black uppercase tracking-[0.12em]">
          How streaks work
        </summary>
        <p className="mt-2 text-sm font-bold leading-6">
          Finish one lesson or roleplay each day to keep your streak alive.
        </p>
      </details>
    </Card>
  );
}

function TrophyLevelCard() {
  const currentLevel = levelRows[2];
  const nextLevel = levelRows[3];
  const progress = Math.round(((currentPoints - currentLevel.points) / (nextLevel.points - currentLevel.points)) * 100);

  return (
    <Card padding="md" className="bg-white">
      <p className="label-mono text-aizome">Level</p>
      <div className="mt-3 brutal-border bg-mustard p-4 text-center shadow-nav">
        <p className="font-display text-3xl">{currentLevel.name}</p>
        <p className="mt-1 font-mono text-xs font-black uppercase tracking-[0.12em]">
          {currentPoints} XP · {nextLevel.points - currentPoints} until {nextLevel.name}
        </p>
      </div>

      <div className="mt-4">
        <SegmentedProgress value={progress} segments={10} />
      </div>

      <div className="mt-5 space-y-2">
        {levelRows.map((level) => (
          <div
            key={level.name}
            className={cn(
              'brutal-border flex items-center justify-between gap-3 px-3 py-2 font-mono text-xs font-black shadow-nav',
              level.name === currentLevel.name ? 'bg-correction text-paper' : 'bg-paper text-ink',
            )}
          >
            <span>{level.label}</span>
            <span>{level.name}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}

function TaskCard() {
  return (
    <Card padding="md" className="bg-white">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="label-mono text-correction">Tasks</p>
          <h2 className="mt-2 font-display text-3xl">Daily queue</h2>
        </div>
        <Badge tone="moss">1 / 4</Badge>
      </div>
      <div className="mt-5 space-y-3">
        {tasks.map(([task, xp, done]) => (
          <label key={task} className="brutal-border flex cursor-pointer items-center gap-3 bg-paper p-3 shadow-nav transition-all hover:bg-mustard">
            <span
              className={cn(
                'brutal-border grid h-6 w-6 place-items-center bg-white font-mono text-xs font-black shadow-nav',
                done && 'bg-moss text-paper',
              )}
              aria-hidden="true"
            >
              {done ? '✓' : ''}
            </span>
            <span className="min-w-0 flex-1 font-bold leading-5">{task}</span>
            <span className="font-mono text-xs font-black uppercase tracking-[0.12em]">{xp}</span>
          </label>
        ))}
      </div>
    </Card>
  );
}

function SegmentedProgress({ segments, value }) {
  const filled = Math.round((Math.max(0, Math.min(100, value)) / 100) * segments);

  return (
    <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${segments}, minmax(0, 1fr))` }}>
      {Array.from({ length: segments }, (_, index) => (
        <span
          key={index}
          className={cn('h-4 brutal-border shadow-nav', index < filled ? 'bg-moss' : 'bg-paper')}
          aria-hidden="true"
        />
      ))}
    </div>
  );
}
