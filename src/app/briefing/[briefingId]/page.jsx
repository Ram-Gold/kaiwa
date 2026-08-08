import Link from 'next/link';
import { notFound } from 'next/navigation';

import Badge from '../../../components/ui/Badge.jsx';
import Button from '../../../components/ui/Button.jsx';
import Card from '../../../components/ui/Card.jsx';
import { getBriefing, getBriefingIds } from '../../../lib/briefings.js';
import { getLessonById, getRoleplayById } from '../../../lib/firebase/firestore.js';
import { cn } from '../../../lib/utils.js';

const accentClasses = {
  correction: 'bg-correction text-paper',
  mustard: 'bg-mustard text-ink',
  moss: 'bg-moss text-paper',
  aizome: 'bg-aizome text-paper',
};

export function generateStaticParams() {
  return getBriefingIds().map((briefingId) => ({ briefingId }));
}

export async function generateMetadata({ params }) {
  const { briefingId } = await params;
  const briefing = getBriefing(briefingId);

  return {
    title: briefing ? `${briefing.title} Briefing - KAIwa` : 'Briefing - KAIwa',
  };
}

export default async function BriefingPage({ params }) {
  const { briefingId } = await params;
  let briefing = await getLessonById(briefingId);
  if (!briefing) {
    briefing = await getRoleplayById(briefingId);
  }
  if (!briefing) {
    briefing = getBriefing(briefingId);
  }

  if (!briefing) {
    notFound();
  }

  return (
    <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-6xl items-center py-6 lg:py-10">
      <div className="grid w-full gap-6 xl:grid-cols-[minmax(0,1fr)_20rem] xl:items-center">
        <Card padding="none" className="relative min-h-[34rem] overflow-hidden bg-white">
          {briefing.image ? (
            <img
              src={briefing.image}
              alt=""
              className="absolute inset-0 h-full w-full object-cover opacity-20"
              draggable="false"
            />
          ) : (
            <div className="absolute inset-0 notebook-panel opacity-90" aria-hidden="true" />
          )}
          <div className="absolute inset-0 bg-paper/70" aria-hidden="true" />
          <div className="absolute left-6 top-6 flex flex-wrap items-center gap-3">
            <Badge tone={briefing.accent}>{briefing.kind}</Badge>
            <span className="brutal-border bg-white px-3 py-2 font-mono text-xs font-black uppercase tracking-[0.14em] shadow-nav">
              {briefing.level} · {briefing.minutes}m
            </span>
          </div>

          <div className="relative grid min-h-[34rem] place-items-center px-6 py-24 text-center sm:px-10">
            <div className="max-w-2xl">
              <p className="label-mono text-correction">Briefing</p>
              <h1 className="mt-4 font-display text-5xl leading-none sm:text-6xl">{briefing.title}</h1>
              <p className="mt-3 font-jp text-2xl font-black text-aizome">{briefing.jpTitle}</p>
              <p className="mx-auto mt-6 max-w-xl text-lg font-bold leading-8">{briefing.summary}</p>
            </div>
          </div>

          <div className="absolute bottom-6 right-6 flex flex-wrap justify-end gap-3">
            <Button as={Link} href={briefing.startHref} size="lg">
              わかります →
            </Button>
          </div>
        </Card>

        <aside className="grid gap-4" aria-label="Conversation heads up and tips">
          <div>
            <p className="label-mono text-correction">Before conversation</p>
            <h2 className="mt-2 font-display text-4xl leading-none">Heads up & tips</h2>
          </div>

          <Card padding="md" className="bg-white">
            <h3 className="font-display text-2xl leading-none">Conversation mode</h3>
            <p className="mt-3 text-sm font-bold leading-6 text-ink/75">
              After this, KAIwa starts the session with this briefing attached as local context.
            </p>
          </Card>

          <Card padding="md" className="bg-white">
            <h3 className="font-display text-2xl leading-none">Tips</h3>
            <ul className="mt-4 space-y-3">
              {(briefing.headsUp || []).map((tip) => (
                <li key={tip} className="grid grid-cols-[1.6rem_1fr] gap-3 text-sm font-bold leading-6">
                  <span className={cn('brutal-border grid h-6 w-6 place-items-center text-xs font-black shadow-nav', accentClasses[briefing.accent || 'moss'])} aria-hidden="true">
                    !
                  </span>
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </Card>

          <Card padding="md" className="bg-white">
            <h3 className="font-display text-2xl leading-none">Useful phrases</h3>
            <div className="mt-4 flex flex-wrap gap-2">
              {(briefing.prep || []).map((phrase) => (
                <span key={phrase} className="brutal-border bg-paper px-3 py-2 font-jp text-sm font-black shadow-nav">
                  {phrase}
                </span>
              ))}
            </div>
          </Card>
        </aside>
      </div>
    </div>
  );
}
