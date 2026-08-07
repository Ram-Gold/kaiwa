'use client';

import Badge from '../ui/Badge.jsx';


export default function HistorySessionDetail({ session, onBack }) {
  return (
    <div className="min-h-screen bg-paper px-4 py-6 text-ink sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-10">
          <button
            type="button"
            onClick={onBack}
            className="font-mono text-xs font-black uppercase tracking-[0.14em] text-ink/65 transition-colors hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink"
          >
            Back to Past Practice
          </button>
        </header>

        <section className="mb-10 text-center">
          <p className="label-mono text-correction">Past Practice</p>
          <div className="mt-3 flex justify-center">
            <Badge tone={session.type === 'Roleplay' ? 'aizome' : 'moss'}>{session.type}</Badge>
          </div>
          <h1 className="mt-4 font-display text-5xl leading-none sm:text-7xl">{session.title}</h1>
          <p className="mt-4 font-display text-3xl leading-none">Score: {session.score}%</p>
          <p className="mt-3 text-sm font-bold text-ink/65 sm:text-base">
            Completed {session.date} · {session.duration}
          </p>
        </section>

        <section className="grid gap-8 lg:grid-cols-[1fr_minmax(20rem,28rem)] xl:items-start">
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2" aria-label="Historical score breakdown">
              {session.metrics.map((metric) => (
                <MetricCard key={metric.label} metric={metric} />
              ))}
            </div>
          </div>

          <aside className="space-y-5">
            <ConversationHistory session={session} />
          </aside>
        </section>

      </div>
    </div>
  );
}

function MetricCard({ metric }) {
  return (
    <article className="brutal-border flex h-48 flex-col justify-between bg-white p-5 shadow-shadow transition-transform duration-200 ease-out hover:-translate-y-1">
      <div className="flex items-start justify-between gap-3">
        <div className="pr-2">
          <p className="font-display text-2xl leading-none">{metric.label}</p>
          <p className="mt-2 line-clamp-2 text-sm font-bold leading-5 text-ink/65">{metric.note}</p>
        </div>
        <span className="shrink-0 font-display text-4xl leading-none">{metric.value}</span>
      </div>
      <div className="mt-4 h-4 overflow-hidden rounded-full border-2 border-ink bg-ink/10" aria-label={`${metric.label} score ${metric.value}%`}>
        <div className={`h-full ${metric.color}`} style={{ width: `${metric.value}%` }} />
      </div>
    </article>
  );
}

function ConversationHistory({ session }) {
  return (
    <article className="relative mx-auto flex h-[40rem] w-full max-w-[25rem] flex-col brutal-border bg-[#fffefa] text-ink shadow-shadow" aria-label="Conversation history">
      <div className="relative z-10 border-b-2 border-ink/10 bg-paper px-5 py-4 text-center">
        <p className="font-mono text-xs font-black uppercase tracking-[0.12em] text-ink/50">You: {session.learnerRole}</p>
        <h2 className="mt-1 font-display text-2xl leading-none">{session.aiRole}</h2>
        <span className="mt-2 inline-flex rounded-full bg-ink/10 px-3 py-1 font-mono text-xs font-black">{session.duration}</span>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto bg-[#fffefa] px-4 py-5">
        {session.transcript.map((message, index) => (
          <div key={`${message.speaker}-${index}`} className={message.speaker === 'You' ? 'flex justify-end' : 'flex justify-start'}>
            <div className={`max-w-[85%] rounded-2xl border-2 border-ink px-4 py-3 shadow-nav ${message.speaker === 'You' ? 'bg-aizome text-white' : 'bg-white text-ink'}`}>
              <p className="mb-1 font-mono text-[0.65rem] font-black uppercase tracking-[0.12em] opacity-70">{message.speaker}</p>
              <p className="font-jp text-sm font-black leading-6">{message.text}</p>
            </div>
          </div>
        ))}
      </div>
    </article>
  );
}

