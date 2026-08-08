'use client';

import Link from 'next/link';
import { useMemo, useState, useEffect } from 'react';

import Badge from '../../components/ui/Badge.jsx';
import Button from '../../components/ui/Button.jsx';
import Card from '../../components/ui/Card.jsx';
import { cn } from '../../lib/utils.js';
import { getRoleplays } from '../../lib/firebase/firestore.js';

const filters = ['ALL', 'Beginner', 'Fun', 'Expert', 'Intermediate'];

export default function RoleplayPage() {
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [scenarios, setScenarios] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        const firestoreRoleplays = await getRoleplays();
        if (isMounted) {
          const mappedScenarios = firestoreRoleplays.map(r => ({
            ...r,
            subtitle: r.jpTitle,
            difficulty: r.level,
            bg: r.image,
            tone: r.accent,
          }));
          setScenarios(mappedScenarios);
        }
      } catch (err) {
        console.error('Failed to fetch roleplays from Firestore:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadData();
    return () => { isMounted = false; };
  }, []);

  const visibleScenarios = useMemo(() => {
    if (activeFilter === 'ALL') return scenarios;
    return scenarios.filter((scenario) => scenario.category === activeFilter);
  }, [activeFilter, scenarios]);

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
        {isLoading ? (
          <div className="md:col-span-2 py-12 text-center font-mono text-sm font-bold text-ink/50">
            Loading roleplays from Firestore...
          </div>
        ) : visibleScenarios.length > 0 ? (
          visibleScenarios.map((scenario) => (
            <ScenarioCard key={scenario.id || scenario.title} scenario={scenario} />
          ))
        ) : (
          <div className="md:col-span-2 brutal-border bg-white p-8 text-center shadow-nav">
            <h3 className="font-display text-2xl">No roleplays found</h3>
            <p className="mt-2 font-mono text-xs font-bold text-ink/60">
              The Firestore `/roleplays` collection is currently empty. Add documents to Firestore to display roleplays here!
            </p>
          </div>
        )}
      </section>

      <section className="mt-8 brutal-border bg-aizome p-5 text-paper shadow-shadow sm:flex sm:items-center sm:justify-between sm:gap-6" aria-label="Completed roleplay review">
        <div>
          <p className="label-mono text-mustard">Finished a session?</p>
          <h2 className="mt-2 font-display text-3xl leading-none">See your grading & review</h2>
          <p className="mt-2 max-w-2xl font-bold leading-7 text-paper/80">Review your score, conversation history, grammar suggestions, and weak vocabulary after a roleplay.</p>
        </div>
        <Button as={Link} href="/grading" size="lg" className="mt-5 shrink-0 bg-mustard text-ink sm:mt-0">
          View grading →
        </Button>
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
            className="absolute inset-0 h-full w-full scale-100 object-cover opacity-10 transition-[opacity,transform] duration-500 ease-out group-hover:scale-[1.03] group-hover:opacity-30 group-focus-visible:scale-[1.03] group-focus-visible:opacity-30"
            draggable="false"
          />
        ) : (
          <>
            <div className="absolute inset-0 notebook-panel opacity-80 transition-opacity duration-500 ease-out group-hover:opacity-100" aria-hidden="true" />
            <div className="absolute inset-0 bg-paper/70 transition-colors duration-500 ease-out group-hover:bg-paper/35" aria-hidden="true" />
          </>
        )}

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
