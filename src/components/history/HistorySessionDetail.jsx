'use client';

import { useState } from 'react';
import { IoArrowForwardSharp, IoCloseSharp, IoCheckmarkCircleSharp, IoBookSharp, IoChatbubbleEllipsesSharp, IoOptionsSharp, IoRefreshSharp } from 'react-icons/io5';
import Badge from '../ui/Badge.jsx';

const DEFAULT_METRICS = [
  { label: 'Overall', value: 80, color: 'bg-ink', note: 'Completed key scenario goals.', modal: 'overall' },
  { label: 'Grammar', value: 80, color: 'bg-soft-blue', note: 'Good polite sentence endings.', modal: 'grammar' },
  { label: 'Vocabulary', value: 75, color: 'bg-mustard', note: 'Essential N5 words used.', modal: 'vocabulary' },
  { label: 'Engagement', value: 85, color: 'bg-correction', note: 'Responded politely.', modal: 'engagement' },
  { label: 'Relevance', value: 88, color: 'bg-moss', note: 'Replies matched the scenario.', modal: 'relevance' },
];

export default function HistorySessionDetail({ session, onBack }) {
  const [activeModal, setActiveModal] = useState(null);
  const report = session?.report || {};
  const metrics = (session?.metrics || report?.metrics || DEFAULT_METRICS).map(m => ({
    ...m,
    modal: m.modal || m.label?.toLowerCase()
  }));
  const transcript = session?.transcript || report?.transcript || [];
  const milestones = report?.scenarioMilestones || [];
  const mistakes = session?.mistakes || report?.mistakes || [];
  const weakVocab = report?.weakVocabulary || [];

  return (
    <div className="min-h-screen bg-paper px-4 py-6 text-ink sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8">
          <button
            type="button"
            onClick={onBack}
            className="font-mono text-xs font-black uppercase tracking-[0.14em] text-ink/65 transition-colors hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink cursor-pointer"
          >
            ← Back to Past Practice
          </button>
        </header>

        <section className="mb-10 text-center">
          <p className="label-mono text-correction">Past Practice Report</p>
          <div className="mt-3 flex justify-center">
            <Badge tone={session?.type === 'Roleplay' ? 'aizome' : 'moss'}>{session?.type || 'Roleplay'}</Badge>
          </div>
          <h1 className="mt-4 font-display text-5xl leading-none sm:text-7xl">{session?.title || session?.scenario || 'Roleplay Practice'}</h1>
          <p className="mt-4 font-display text-3xl leading-none">Score: {session?.score ?? 80}%</p>
          <p className="mt-3 text-sm font-bold text-ink/65 sm:text-base">
            Completed {session?.date ? String(session.date).slice(0, 10) : 'Recently'} · {session?.duration || '05:00'}
          </p>
        </section>

        <section className="grid gap-8 lg:grid-cols-[1fr_minmax(20rem,28rem)] xl:items-start">
          <div className="space-y-8">
            {/* Score Metrics Grid */}
            <div className="grid gap-4 sm:grid-cols-2" aria-label="Historical score breakdown">
              {metrics.map((metric, idx) => (
                <MetricCard key={metric.label || idx} metric={metric} onOpen={() => setActiveModal(metric.modal)} />
              ))}
            </div>
          </div>

          {/* Right Column: Chat History */}
          <aside className="space-y-5">
            <ConversationHistory session={session} transcript={transcript} />
          </aside>
        </section>

        {/* Modal Popup Overlay */}
        {activeModal && (
          <HistoryOverlay 
            type={activeModal} 
            onClose={() => setActiveModal(null)} 
            session={session}
            report={report}
            milestones={milestones}
            mistakes={mistakes} 
            words={weakVocab} 
          />
        )}
      </div>
    </div>
  );
}

function HistoryOverlay({ type, onClose, session, report, milestones, mistakes, words }) {
  const engagement = report?.engagementAnalysis;
  const relevance = report?.relevanceAnalysis;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6" role="dialog" aria-modal="true" aria-label={`${type} detailed insights`}>
      <div className="absolute inset-0 bg-ink/70 backdrop-blur-sm" aria-hidden="true" onClick={onClose} />
      <div className="animate-panel-in relative w-full max-w-2xl max-h-[90vh] flex flex-col">
        <button 
          type="button" 
          aria-label="Close modal" 
          onClick={onClose} 
          className="absolute right-5 top-5 brutal-border grid h-10 w-10 place-items-center rounded-full bg-white text-lg shadow-nav transition-transform hover:-translate-y-0.5 active:scale-95 z-10 cursor-pointer"
        >
          <IoCloseSharp />
        </button>

        <div className="overflow-y-auto rounded-3xl shadow-2xl bg-white p-6 brutal-border space-y-6">
          {/* Overall Modal Content */}
          {type === 'overall' && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 border-b-2 border-ink/10 pb-4">
                <span className="grid h-10 w-10 place-items-center brutal-border bg-ink text-paper shadow-nav">
                  <IoCheckmarkCircleSharp className="text-2xl text-mustard" />
                </span>
                <div>
                  <p className="label-mono text-ink/60">Comprehensive Evaluation</p>
                  <h2 className="font-display text-3xl leading-none">Overall Insights</h2>
                </div>
              </div>
              {(session?.summary || report?.overallCritique) && (
                <div className="brutal-border bg-paper p-4 shadow-nav">
                  <p className="font-mono text-xs font-black uppercase text-ink/70">AI Tutor Feedback</p>
                  <p className="mt-2 text-sm font-bold text-ink/85 leading-relaxed">
                    "{session?.summary || report?.overallCritique}"
                  </p>
                </div>
              )}
              {milestones.length > 0 && (
                <div className="space-y-3">
                  <p className="font-mono text-xs font-black uppercase text-ink/70">Scenario Milestones Accomplished:</p>
                  {milestones.map((m, idx) => (
                    <div key={idx} className="brutal-border bg-paper p-4 font-mono text-xs shadow-nav flex items-start gap-3">
                      <span className={`text-base font-black px-2 py-0.5 brutal-border ${m.accomplished !== false ? 'bg-moss text-white' : 'bg-correction text-white'}`}>
                        {m.accomplished !== false ? '✓' : '✗'}
                      </span>
                      <div className="space-y-1 w-full">
                        <p className="font-black text-ink text-sm">{m.title}</p>
                        {m.goal && <p className="font-bold text-ink/60 text-[11px]">Goal: {m.goal}</p>}
                        {m.critique && (
                          <p className="font-bold text-ink/80 text-xs leading-relaxed pt-1 bg-white p-2.5 brutal-border mt-1">
                            <span className="font-mono font-black text-ink/60 block text-[10px] uppercase mb-0.5">AI Critique:</span>
                            {m.critique}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Grammar Modal Content */}
          {type === 'grammar' && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 border-b-2 border-ink/10 pb-4">
                <span className="grid h-10 w-10 place-items-center brutal-border bg-soft-blue text-ink shadow-nav">
                  <IoRefreshSharp className="text-xl" />
                </span>
                <div>
                  <p className="label-mono text-aizome">AI Grammar Analysis</p>
                  <h2 className="font-display text-3xl leading-none">Grammar Suggestions</h2>
                </div>
              </div>
              {mistakes.length === 0 ? (
                <div className="brutal-border bg-paper p-6 text-center shadow-nav font-bold text-ink/70">
                  ✓ Perfect grammar! No particle or phrasing errors detected.
                </div>
              ) : (
                <div className="space-y-4">
                  {mistakes.map((mistake, idx) => (
                    <div key={idx} className="brutal-border bg-paper p-5 shadow-nav space-y-3">
                      <div className="flex justify-between items-center border-b-2 border-ink/10 pb-2">
                        <span className="font-display text-lg text-ink font-bold">{mistake.title}</span>
                        <span className="brutal-border bg-soft-blue px-2 py-0.5 font-mono text-[10px] font-black uppercase">Tip</span>
                      </div>
                      <div className="bg-white p-3 font-jp flex flex-wrap items-center gap-3 text-sm brutal-border shadow-nav">
                        <div className="flex items-center gap-2 bg-correction/15 px-3 py-1.5 brutal-border">
                          <span className="font-mono text-[10px] font-black text-correction uppercase">Try again:</span>
                          <span className="line-through text-correction font-black">{mistake.original}</span>
                        </div>
                        <span className="text-ink font-black text-xl">→</span>
                        <div className="flex items-center gap-2 bg-moss/20 px-3 py-1.5 brutal-border">
                          <span className="font-mono text-[10px] font-black text-moss uppercase">Recommend:</span>
                          <span className="text-moss font-black">{mistake.corrected}</span>
                        </div>
                      </div>
                      <div className="bg-white p-3.5 font-sans text-xs font-bold text-ink/85 leading-relaxed brutal-border shadow-nav">
                        <span className="font-mono font-black text-ink/60 uppercase text-[10px] block mb-1">Why:</span>
                        {mistake.why}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Vocabulary Modal Content */}
          {type === 'vocabulary' && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 border-b-2 border-ink/10 pb-4">
                <span className="grid h-10 w-10 place-items-center brutal-border bg-mustard text-ink shadow-nav">
                  <IoBookSharp className="text-xl" />
                </span>
                <div>
                  <p className="label-mono text-ink/70">Flagged Words & SRS</p>
                  <h2 className="font-display text-3xl leading-none">Vocabulary Analysis</h2>
                </div>
              </div>
              {words.length === 0 ? (
                <div className="brutal-border bg-paper p-6 text-center shadow-nav font-bold text-ink/70">
                  ✓ Great vocabulary usage! No weak terms flagged for SRS deck practice.
                </div>
              ) : (
                <div className="space-y-3">
                  {words.map((word, idx) => (
                    <div key={idx} className="brutal-border bg-paper p-4 shadow-nav space-y-2">
                      <div className="flex justify-between items-baseline border-b border-ink/10 pb-2">
                        <p className="font-jp text-xl font-black text-ink">{word.term} <span className="font-mono text-xs text-aizome">[{word.reading}]</span></p>
                        <span className="font-mono text-[10px] font-black uppercase bg-mustard/20 px-2 py-0.5 brutal-border">{word.source || 'Roleplay'}</span>
                      </div>
                      <p className="text-xs font-black text-ink/80">{word.meaning}</p>
                      {word.reason && (
                        <p className="text-xs font-bold text-ink/70 leading-relaxed bg-white p-2.5 brutal-border mt-1">
                          <span className="font-mono font-black text-ink/60 uppercase text-[10px] block mb-0.5">AI SRS Reason:</span>
                          {word.reason}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Engagement Modal Content */}
          {type === 'engagement' && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 border-b-2 border-ink/10 pb-4">
                <span className="grid h-10 w-10 place-items-center brutal-border bg-correction text-white shadow-nav">
                  <IoChatbubbleEllipsesSharp className="text-xl" />
                </span>
                <div>
                  <p className="label-mono text-correction">Conversational Tone & Etiquette</p>
                  <h2 className="font-display text-3xl leading-none">Engagement Feedback</h2>
                </div>
              </div>
              <p className="text-sm font-bold text-ink/85 leading-relaxed bg-paper p-4 brutal-border">
                {engagement?.politenessFeedback || 'You maintained an exceptionally polite, warm, and appropriate tone throughout your roleplay conversation.'}
              </p>
              {engagement?.markers && engagement.markers.length > 0 && (
                <div className="space-y-2">
                  <p className="font-mono text-[10px] font-black uppercase text-ink/60">Conversational Markers (あいづち):</p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {engagement.markers.map((m, idx) => (
                      <div key={idx} className="brutal-border bg-paper p-3 font-mono text-xs shadow-nav">
                        <span className="font-bold text-ink">{m.marker}</span>: {m.usage}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Relevance Modal Content */}
          {type === 'relevance' && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 border-b-2 border-ink/10 pb-4">
                <span className="grid h-10 w-10 place-items-center brutal-border bg-moss text-white shadow-nav">
                  <IoOptionsSharp className="text-xl" />
                </span>
                <div>
                  <p className="label-mono text-moss">Context Alignment</p>
                  <h2 className="font-display text-3xl leading-none">Relevance Feedback</h2>
                </div>
              </div>
              <p className="text-sm font-bold text-ink/85 leading-relaxed bg-paper p-4 brutal-border">
                {relevance?.relevanceFeedback || 'Your responses were highly relevant and directly addressed the roleplay prompts without off-topic drift.'}
              </p>
              {relevance?.offTopicLines && relevance.offTopicLines.length > 0 ? (
                <div className="space-y-3">
                  <p className="font-mono text-[10px] font-black uppercase text-correction">Context Mismatches Detected:</p>
                  {relevance.offTopicLines.map((line, idx) => (
                    <div key={idx} className="brutal-border bg-paper p-4 text-xs space-y-2 shadow-nav">
                      <p className="font-mono font-bold text-ink/60">Prompt: "{line.prompt}"</p>
                      <p className="font-black text-correction">Your Reply: "{line.studentReply}"</p>
                      <p className="font-bold text-ink/80 bg-white p-2.5 brutal-border">Why: {line.whyWrong}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="brutal-border bg-paper p-4 text-center shadow-nav font-mono text-xs font-black text-moss uppercase">
                  ✓ 100% Context Aligned! No off-topic replies detected.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function MetricCard({ metric, onOpen }) {
  const isFullWidth = metric.label === 'Overall';
  return (
    <article className={`brutal-border bg-white p-5 shadow-shadow transition-transform duration-200 ease-out hover:-translate-y-1 flex flex-col justify-between h-48 relative group ${isFullWidth ? 'sm:col-span-2' : ''}`}>
      <button 
        type="button" 
        onClick={onOpen} 
        className="absolute inset-0 z-10 w-full cursor-pointer opacity-0 focus-visible:opacity-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-ink" 
        aria-label={`Open ${metric.label} detailed AI insights popup`}
      />
      <div className="flex items-start justify-between gap-3 relative z-20 pointer-events-none">
        <div className="pr-2">
          <p className="font-display text-2xl leading-none flex items-center gap-2">
            {metric.label}
            <IoArrowForwardSharp className="text-xl text-ink/50 group-hover:text-ink group-hover:translate-x-1 transition-all" aria-hidden="true" />
          </p>
          <p className="mt-2 text-sm font-bold leading-5 text-ink/65 line-clamp-2">{metric.note}</p>
        </div>
        <span className="font-display text-4xl leading-none shrink-0">{metric.value}</span>
      </div>
      <div className="mt-4 h-4 overflow-hidden rounded-full border-2 border-ink bg-ink/10 relative z-20 pointer-events-none" aria-label={`${metric.label} score ${metric.value}%`}>
        <div className={`h-full ${metric.color || 'bg-ink'}`} style={{ width: `${metric.value}%` }} />
      </div>
    </article>
  );
}

function ConversationHistory({ session, transcript }) {
  const learnerRole = session?.learnerRole || session?.report?.learnerRole || 'Learner';
  const aiRole = session?.aiRole || session?.report?.aiRole || 'KAIwa Sensei';

  return (
    <article className="relative mx-auto flex h-[40rem] w-full max-w-[25rem] flex-col brutal-border bg-[#fffefa] text-ink shadow-shadow" aria-label="Conversation history">
      <div className="relative z-10 border-b-2 border-ink/10 bg-paper px-5 py-4 text-center">
        <p className="font-mono text-xs font-black uppercase tracking-[0.12em] text-ink/50">You: {learnerRole}</p>
        <h2 className="mt-1 font-display text-2xl leading-none">{aiRole}</h2>
        <span className="mt-2 inline-flex rounded-full bg-ink/10 px-3 py-1 font-mono text-xs font-black">{session?.duration || '05:00'}</span>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto bg-[#fffefa] px-4 py-5">
        {(transcript || []).map((message, index) => (
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

