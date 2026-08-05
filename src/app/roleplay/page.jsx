'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';

import Badge from '../../components/ui/Badge.jsx';
import Button from '../../components/ui/Button.jsx';
import Card from '../../components/ui/Card.jsx';
import { cn } from '../../lib/utils.js';

const filters = ['ALL', 'Beginner', 'Fun', 'Expert', 'Intermediate'];

const scenarios = [
  {
    title: 'Train Station',
    subtitle: '駅で迷った時',
    category: 'Beginner',
    difficulty: 'N5',
    minutes: 8,
    bg: '/assets/bg_eki_homedoor_train_open.jpg',
    href: '/briefing/train-station',
    tone: 'mustard',
  },
  {
    title: 'Idol Cheki',
    subtitle: 'ライブ後の一言',
    category: 'Fun',
    difficulty: 'N4',
    minutes: 6,
    bg: '/assets/bg_music_live_stage.jpg',
    href: '/briefing/idol-cheki',
    tone: 'correction',
  },
  {
    title: 'Colleague Hiroen',
    subtitle: '同僚と雑談',
    category: 'Intermediate',
    difficulty: 'N3',
    minutes: 12,
    bg: '/assets/bg_ryokan_hiroen.jpg',
    href: '/briefing/colleague-hiroen',
    tone: 'aizome',
  },
  {
    title: 'Convenience Store',
    subtitle: 'コンビニ会話',
    category: 'Beginner',
    difficulty: 'N5',
    minutes: 7,
    bg: null,
    href: '/briefing/convenience-store',
    tone: 'moss',
  },
  {
    title: 'Job Interview',
    subtitle: '面接の練習',
    category: 'Expert',
    difficulty: 'N2',
    minutes: 15,
    bg: null,
    href: '/briefing/job-interview',
    tone: 'correction',
  },
  {
    title: 'Teacher Teaching',
    subtitle: '先生に質問する',
    category: 'Beginner',
    difficulty: 'N5',
    minutes: 10,
    bg: '/assets/bg_school_room_back.jpg',
    href: '/briefing/teacher-teaching',
    tone: 'mustard',
  },
];

export default function RoleplayPage() {
  const [activeFilter, setActiveFilter] = useState('ALL');
  const visibleScenarios = useMemo(() => {
    if (activeFilter === 'ALL') return scenarios;
    return scenarios.filter((scenario) => scenario.category === activeFilter);
  }, [activeFilter]);

  return (
    <div className="mx-auto max-w-5xl">
      <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="label-mono text-correction">Role play scenario</p>
          <h1 className="mt-2 font-display text-4xl leading-none sm:text-5xl">Pick your situation</h1>
        </div>
        <Badge tone="aizome">AI Kaiwa</Badge>
      </header>

      <CustomRoleplayCard />

      <div className="mt-6 flex flex-wrap gap-3" aria-label="Roleplay filters">
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

      <section className="mt-8 grid gap-5 md:grid-cols-2" aria-label="Roleplay scenario cards">
        {visibleScenarios.map((scenario) => (
          <ScenarioCard key={scenario.title} scenario={scenario} />
        ))}
      </section>
    </div>
  );
}

function CustomRoleplayCard() {
  return (
    <Card padding="lg" className="notebook-panel relative overflow-hidden">
      <div className="absolute right-[-2rem] top-[-2rem] h-28 w-28 rotate-12 brutal-border bg-correction" aria-hidden="true" />
      <div className="relative grid gap-5 sm:grid-cols-[1fr_auto] sm:items-center">
        <div>
          <Badge tone="mustard">Custom roleplay</Badge>
          <h2 className="mt-4 font-display text-4xl leading-none">Create your own scene</h2>
          <p className="mt-3 max-w-xl font-bold leading-7">
            Describe a situation — ordering, apologizing, small talk, interviews — and KAIwa turns it into guided conversation practice.
          </p>
        </div>
        <Button as={Link} href="/briefing/custom-roleplay" size="lg">
          Start
        </Button>
      </div>
    </Card>
  );
}

function ScenarioCard({ scenario }) {
  return (
    <Card as="article" padding="none" lift="press" className="group min-h-44 overflow-hidden bg-white">
      <Link href={scenario.href} className="relative flex min-h-44 h-full flex-col p-5 text-ink">
        {scenario.bg ? (
          <img
            src={scenario.bg}
            alt=""
            className="absolute inset-0 h-full w-full scale-100 object-cover opacity-20 transition-[opacity,transform] duration-500 ease-out group-hover:scale-[1.03] group-hover:opacity-45 group-focus-visible:scale-[1.03] group-focus-visible:opacity-45"
            draggable="false"
          />
        ) : (
          <div className="absolute inset-0 notebook-panel opacity-80 transition-opacity duration-500 ease-out group-hover:opacity-100" aria-hidden="true" />
        )}
        <div className="absolute inset-0 bg-paper/70 transition-colors duration-500 ease-out group-hover:bg-paper/35" aria-hidden="true" />

        <div className="relative flex items-start justify-between gap-4">
          <Badge tone={scenario.tone}>{scenario.category}</Badge>
          <span className="brutal-border bg-white px-2 py-1 font-mono text-xs font-black uppercase tracking-[0.12em] shadow-nav">
            {scenario.minutes}m
          </span>
        </div>

        <div className="relative flex flex-1 flex-col justify-end py-4 text-left">
          <div className="min-h-[4.5rem]">
            <h2 className="font-display text-3xl leading-none transition-transform duration-300 ease-out group-hover:-translate-y-1 group-focus-visible:-translate-y-1 sm:text-4xl">
              {scenario.title}
            </h2>
            <p className="mt-1 h-7 translate-y-1 font-jp text-lg font-bold text-aizome opacity-0 transition-all duration-300 ease-out group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:translate-y-0 group-focus-visible:opacity-100">
              {scenario.subtitle}
            </p>
          </div>
        </div>

        <div className="relative flex items-center justify-between gap-3">
          <span className="font-mono text-xs font-black uppercase tracking-[0.12em]">{scenario.difficulty}</span>
          <span className="border-2 border-transparent px-3 py-2 font-mono text-xs font-black uppercase tracking-[0.12em] text-correction transition-[background-color,border-color,color,box-shadow,transform] duration-300 ease-out group-hover:translate-x-boxShadowX group-hover:translate-y-boxShadowY group-hover:border-border group-hover:bg-correction group-hover:text-paper group-hover:shadow-nav group-focus-visible:translate-x-boxShadowX group-focus-visible:translate-y-boxShadowY group-focus-visible:border-border group-focus-visible:bg-correction group-focus-visible:text-paper group-focus-visible:shadow-nav">
            Start →
          </span>
        </div>
      </Link>
    </Card>
  );
}
