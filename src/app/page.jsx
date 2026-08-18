'use client';

import Link from 'next/link';
import { useMemo, useState, useEffect } from 'react';

import Badge from '../components/ui/Badge.jsx';
import Button from '../components/ui/Button.jsx';
import Card from '../components/ui/Card.jsx';
import NeubrutalCard from '../components/ui/NeubrutalCard.jsx';
import CardSkeleton from '../components/ui/CardSkeleton.jsx';
import { cn } from '../lib/utils.js';
import { useAuth } from '../lib/auth/AuthContext.jsx';
import { getUserModuleProgress, getLessons, getCategories } from '../lib/firebase/firestore.js';

const staticLessons = [
  { id: 'introduction', title: 'Introduction', jp: 'はじめまして', category: 'Beginner', minutes: 8, tone: 'moss', href: '/briefing/introduction' },
  { id: 'common-phrases', title: 'Common Phrases', jp: 'よく使う表現', category: 'Beginner', minutes: 12, tone: 'mustard', href: '/briefing/common-phrases' },
  { id: 'likes-dislikes', title: 'Likes & Dislikes', jp: '好き・嫌い', category: 'Life', minutes: 10, tone: 'correction', href: '/briefing/likes-dislikes' },
  { id: 'basic-verbs', title: 'Basic Verbs', jp: '基本動詞', category: 'Beginner', minutes: 15, tone: 'aizome', href: '/briefing/basic-verbs' },
  { id: 'simple-sentences', title: 'Simple Sentences', jp: '簡単な文', category: 'Life', minutes: 14, tone: 'mustard', href: '/briefing/simple-sentences' },
  { id: 'personal-info', title: 'Personal Info', jp: '自己紹介', category: 'Life', minutes: 9, tone: 'moss', href: '/briefing/personal-info' },
  { id: 'ordering-food', title: 'Ordering Food', jp: '注文する', category: 'Food', minutes: 11, tone: 'correction', href: '/briefing/ordering-food' },
  { id: 'meme-replies', title: 'Meme Replies', jp: 'ネット表現', category: 'Memes', minutes: 7, tone: 'aizome', href: '/briefing/meme-replies' },
];

export default function Home() {
  const { user } = useAuth();
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [lessons, setLessons] = useState([]);
  const [globalCategories, setGlobalCategories] = useState(['Beginner', 'Food', 'Memes', 'Life']);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        const [firestoreLessons, progressMap, categoriesArray] = await Promise.all([
          getLessons(),
          user?.uid ? getUserModuleProgress(user.uid) : Promise.resolve({}),
          getCategories()
        ]);

        if (isMounted) {
          const merged = firestoreLessons.map(lesson => ({
            ...lesson,
            progress: progressMap[lesson.id]?.progress || 0
          }));
          setLessons(merged);
          setGlobalCategories(categoriesArray);
        }
      } catch (err) {
        console.error('Failed to fetch lessons from Firestore:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadData();
    return () => { isMounted = false; };
  }, [user?.uid]);

  const filters = useMemo(() => {
    const dynamicCategories = Array.from(
      new Set(lessons.map((l) => l.category).filter(Boolean))
    );
    const preferredOrder = globalCategories;
    const sorted = [
      ...preferredOrder.filter((cat) => dynamicCategories.includes(cat)),
      ...dynamicCategories.filter((cat) => !preferredOrder.includes(cat)),
    ];
    return ['ALL', ...(sorted.length > 0 ? sorted : preferredOrder)];
  }, [lessons, globalCategories]);

  const visibleLessons = useMemo(() => {
    if (activeFilter === 'ALL') return lessons;
    return lessons.filter((lesson) => lesson.category === activeFilter);
  }, [activeFilter, lessons]);

  return (
    <div className="mx-auto max-w-5xl">
      <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="label-mono text-correction">Lesson module</p>
          <h1 className="mt-2 font-display text-4xl leading-none sm:text-5xl">Today’s study board</h1>
        </div>
      </header>

      <CustomLessonCard />

      <div className="mt-6 flex flex-wrap gap-3" aria-label="Lesson filters">
        {filters.map((filter) => (
          <button
            key={filter}
            type="button"
            onClick={() => setActiveFilter(filter)}
            className={cn(
              'brutal-border rounded-xl px-4 py-3 font-mono text-sm font-black uppercase tracking-[0.12em] transition-all duration-150',
              activeFilter === filter
                ? 'bg-correction text-paper translate-x-[2px] translate-y-[2px] shadow-none'
                : 'bg-white text-ink shadow-nav hover:-translate-y-1 hover:shadow-[5px_5px_0px_0px_#1C1C1C] hover:bg-mustard',
            )}
          >
            {filter}
          </button>
        ))}
      </div>

      <section className="mt-8 grid gap-5 md:grid-cols-2" aria-label="Lesson cards">
        {isLoading ? (
          <CardSkeleton count={4} />
        ) : visibleLessons.length > 0 ? (
          visibleLessons.map((lesson) => (
            <LessonCard key={lesson.id || lesson.title} lesson={lesson} />
          ))
        ) : (
          <div className="md:col-span-2 brutal-border rounded-2xl bg-white p-8 text-center shadow-nav">
            <h3 className="font-display text-2xl">No lessons found</h3>
            <p className="mt-2 font-mono text-xs font-bold text-ink/60">
              The Firestore `/lessons` collection is currently empty. Add documents to Firestore to display lessons here for everyone!
            </p>
          </div>
        )}
      </section>
    </div>
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
        <Button as={Link} href="/briefing/custom-lesson" size="lg">
          Start
        </Button>
      </div>
    </Card>
  );
}

function LessonCard({ lesson }) {
  const levelLabel = lesson.level || 'N5';
  const categoryLabel = (lesson.category || 'BEGINNER').toUpperCase();
  const meaningText = lesson.meaning || lesson.romaji || (lesson.level ? `${levelLabel}` : '');

  return (
    <NeubrutalCard
      id={lesson.id || `lesson-${lesson.title}`}
      href={lesson.href}
      category={categoryLabel}
      categoryColor="bg-nbYellow text-black"
      level={levelLabel}
      levelColor="bg-nbGreen text-black"
      title={lesson.title}
      japaneseText={lesson.jp}
      romajiOrMeaning={meaningText}
      progress={lesson.progress ?? 0}
      showProgress={true}
    />
  );
}
