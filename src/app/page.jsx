'use client';

import { useState, useEffect } from 'react';

import NeubrutalCard from '../components/ui/NeubrutalCard.jsx';
import CardSkeleton from '../components/ui/CardSkeleton.jsx';
import { useAuth } from '../lib/auth/AuthContext.jsx';
import { getUserModuleProgress, getLessons } from '../lib/firebase/firestore.js';

const staticLessons = [
  { id: 'basic-verbs', title: 'Basic Verbs', jp: '基本動詞', category: 'Beginner', minutes: 15, tone: 'aizome', href: '/prep/basic-verbs' },
  { id: 'idol-cheki', title: 'Idol Cheki', jp: 'ライブ後の一言', category: 'Memes', minutes: 6, tone: 'correction', href: '/briefing/idol-cheki' },
];

export default function Home() {
  const { user } = useAuth();
  const [lessons, setLessons] = useState(staticLessons);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        const [firestoreLessons, progressMap] = await Promise.all([
          getLessons(),
          getUserModuleProgress(user?.uid),
        ]);

        if (isMounted) {
          const merged = firestoreLessons.map(lesson => {
            const rawProgress = progressMap[lesson.id]?.progress;
            const completions = progressMap[lesson.id]?.completionsCount;
            let progress = 0;
            if (typeof completions === 'number') {
              progress = Math.min(completions * 20, 100);
            } else if (typeof rawProgress === 'number') {
              progress = rawProgress;
            }
            return {
              ...lesson,
              progress,
            };
          });
          setLessons(merged.length > 0 ? merged : staticLessons);
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

  return (
    <div className="mx-auto max-w-5xl">
      <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="label-mono text-correction">Lesson module</p>
          <h1 className="mt-2 font-display text-4xl leading-none sm:text-5xl">Today’s study board</h1>
        </div>
      </header>

      <section className="grid gap-5 md:grid-cols-2" aria-label="Lesson cards">
        {isLoading ? (
          <CardSkeleton count={2} />
        ) : lessons.length > 0 ? (
          lessons.map((lesson) => (
            <LessonCard key={lesson.id || lesson.title} lesson={lesson} />
          ))
        ) : (
          <div className="md:col-span-2 brutal-border rounded-2xl bg-white p-8 text-center shadow-nav">
            <h3 className="font-display text-2xl">No lessons found</h3>
          </div>
        )}
      </section>
    </div>
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
      japaneseText={lesson.jp || lesson.jpTitle}
      romajiOrMeaning={meaningText}
      progress={lesson.progress ?? 0}
      showProgress={true}
    />
  );
}

