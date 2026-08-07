'use client';

import { useMemo, useState } from 'react';

import Badge from '../ui/Badge.jsx';
import Card from '../ui/Card.jsx';
import HistorySessionDetail from './HistorySessionDetail.jsx';
import { cn } from '../../lib/utils.js';

export default function HistoryLedger({ sessions }) {
  const [sessionId, setSessionId] = useState(null);
  const selectedSession = useMemo(() => sessions.find((session) => session.id === sessionId) ?? null, [sessionId, sessions]);

  if (selectedSession) {
    return <HistorySessionDetail session={selectedSession} sessions={sessions} onBack={() => setSessionId(null)} />;
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <header className="mb-6">
        <h1 className="font-display text-4xl leading-none sm:text-5xl">Past Practice</h1>
      </header>

      <section>
        <Card padding="none" className="overflow-hidden bg-white">
          <div className="grid grid-cols-[7rem_7.5rem_minmax(0,1fr)_5rem] gap-3 border-b-2 border-border bg-paper px-4 py-3 font-mono text-[10px] font-black uppercase tracking-[0.14em] text-ink/55 sm:grid-cols-[8rem_10rem_minmax(0,1fr)_6rem] sm:gap-4">
            <span>Date</span>
            <span>Type</span>
            <span>Session</span>
            <span className="text-right">Score</span>
          </div>
          <div className="divide-y-2 divide-border">
            {sessions.map((session) => (
              <button
                key={session.id}
                type="button"
                onClick={() => setSessionId(session.id)}
                className="w-full text-left transition-colors hover:bg-mustard/10 focus-visible:relative focus-visible:z-10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-ink"
                aria-label={`Open saved ${session.type.toLowerCase()} record for ${session.title}`}
              >
                <div className="grid grid-cols-[7rem_7.5rem_minmax(0,1fr)_5rem] items-center gap-3 px-4 py-4 sm:grid-cols-[8rem_10rem_minmax(0,1fr)_6rem] sm:gap-4">
                  <div>
                    <p className="font-mono text-[10px] font-black uppercase tracking-[0.12em] text-ink/55">{session.date}</p>
                    <p className="mt-1 text-sm font-bold text-ink/70">{session.duration}</p>
                  </div>
                  <div>
                    <Badge tone={session.type === 'Roleplay' ? 'aizome' : 'moss'}>{session.type}</Badge>
                  </div>
                  <div>
                    <h2 className="font-display text-xl leading-none sm:text-2xl">{session.title}</h2>
                    <p className="mt-2 hidden text-sm font-semibold leading-6 text-ink/70 sm:block">{session.summary}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-display text-3xl leading-none sm:text-4xl">{session.score}%</p>
                    <p className={cn('mt-2 font-mono text-[10px] font-black uppercase tracking-[0.14em]', scoreTone(session.score))}>{session.grade}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </Card>
      </section>
    </div>
  );
}

function scoreTone(score) {
  if (score >= 90) return 'text-correction';
  if (score >= 80) return 'text-aizome';
  if (score >= 70) return 'text-moss';
  return 'text-ink';
}
