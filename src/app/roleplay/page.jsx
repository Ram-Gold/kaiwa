'use client';

import Link from 'next/link';
import { useMemo, useState, useEffect } from 'react';

import Badge from '../../components/ui/Badge.jsx';
import Button from '../../components/ui/Button.jsx';
import Card from '../../components/ui/Card.jsx';
import NeubrutalCard from '../../components/ui/NeubrutalCard.jsx';
import CardSkeleton from '../../components/ui/CardSkeleton.jsx';
import { cn } from '../../lib/utils.js';
import { getRoleplays, getCategories } from '../../lib/firebase/firestore.js';

export default function RoleplayPage() {
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [scenarios, setScenarios] = useState([]);
  const [globalCategories, setGlobalCategories] = useState(['Beginner', 'Food', 'Memes', 'Life']);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        const [firestoreRoleplays, categoriesArray] = await Promise.all([
          getRoleplays(),
          getCategories()
        ]);
        
        if (isMounted) {
          const mappedScenarios = firestoreRoleplays.map(r => ({
            ...r,
            subtitle: r.jpTitle,
            difficulty: r.level,
            bg: r.image,
            tone: r.accent,
          }));
          setScenarios(mappedScenarios);
          setGlobalCategories(categoriesArray);
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

  const filters = useMemo(() => {
    const dynamicCategories = Array.from(
      new Set(scenarios.map((s) => s.category).filter(Boolean))
    );
    const preferredOrder = globalCategories;
    const sorted = [
      ...preferredOrder.filter((cat) => dynamicCategories.includes(cat)),
      ...dynamicCategories.filter((cat) => !preferredOrder.includes(cat)),
    ];
    return ['ALL', ...(sorted.length > 0 ? sorted : preferredOrder)];
  }, [scenarios, globalCategories]);

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
              'brutal-border rounded-xl px-4 py-3 font-mono text-sm font-black uppercase tracking-[0.12em] shadow-nav transition-all hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-none',
              activeFilter === filter ? 'bg-correction text-paper' : 'bg-white text-ink hover:bg-mustard',
            )}
          >
            {filter}
          </button>
        ))}
      </div>

      <section className="mt-8 grid gap-5 md:grid-cols-2" aria-label="Roleplay scenario cards">
        {isLoading ? (
          <CardSkeleton count={4} />
        ) : visibleScenarios.length > 0 ? (
          visibleScenarios.map((scenario) => (
            <ScenarioCard key={scenario.id || scenario.title} scenario={scenario} />
          ))
        ) : (
          <div className="md:col-span-2 brutal-border rounded-2xl bg-white p-8 text-center shadow-nav">
            <h3 className="font-display text-2xl">No roleplays found</h3>
            <p className="mt-2 font-mono text-xs font-bold text-ink/60">
              The Firestore `/roleplays` collection is currently empty. Add documents to Firestore to display roleplays here!
            </p>
          </div>
        )}
      </section>

      <section className="mt-8 brutal-border rounded-2xl bg-aizome p-5 text-paper shadow-shadow sm:flex sm:items-center sm:justify-between sm:gap-6" aria-label="Completed roleplay review">
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
  const levelLabel = scenario.level || scenario.difficulty || 'N5';
  const categoryLabel = (scenario.category || 'ROLEPLAY').toUpperCase();
  const meaningText = scenario.meaning || scenario.romaji || (levelLabel ? `${levelLabel}` : '');

  return (
    <NeubrutalCard
      id={scenario.id || `scenario-${scenario.title}`}
      href={scenario.href || scenario.startHref}
      category={categoryLabel}
      categoryColor="bg-nbYellow text-black"
      level={levelLabel}
      levelColor="bg-nbGreen text-black"
      title={scenario.title}
      japaneseText={scenario.subtitle || scenario.jpTitle || ''}
      romajiOrMeaning={meaningText}
      showProgress={false}
      footerContent={
        <div className="space-y-1.5 pt-3 border-t-2 border-slate-100 flex items-center justify-between font-mono text-xs font-bold text-slate-700">
          <span className="uppercase tracking-wider">JLPT {levelLabel}</span>
          <span className="text-black font-black group-hover:text-indigo-600 group-hover:translate-x-1 transition-all duration-200 flex items-center gap-1">
            Start roleplay <span aria-hidden="true">&rarr;</span>
          </span>
        </div>
      }
    />
  );
}
