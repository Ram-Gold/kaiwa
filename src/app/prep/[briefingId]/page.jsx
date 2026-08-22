import { notFound, redirect } from 'next/navigation';
import { getBriefing, getBriefingIds } from '../../../lib/briefings.js';
import VocabularyQuiz from '../../../components/prep/VocabularyQuiz.jsx';
import Card from '../../../components/ui/Card.jsx';
import Badge from '../../../components/ui/Badge.jsx';

export function generateStaticParams() {
  return getBriefingIds().map((briefingId) => ({ briefingId }));
}

export async function generateMetadata({ params }) {
  const { briefingId } = await params;
  const briefing = getBriefing(briefingId);

  return {
    title: briefing ? `${briefing.title.trim()} Prep - KAIwa` : 'Prep - KAIwa',
  };
}

export default async function PrepPage({ params }) {
  const { briefingId } = await params;
  const briefing = getBriefing(briefingId);

  if (!briefing) {
    notFound();
  }
  
  const nextHref = briefing.startHref || '/';

  return (
    <div className="min-h-screen bg-paper w-full flex flex-col">
      <VocabularyQuiz 
        briefingId={briefingId}
        briefingTitle={briefing.title}
        prepQuiz={briefing.prepQuiz} 
        nextHref={nextHref} 
      />
    </div>
  );
}
