'use client';

import { useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import {
  IoBatteryFullSharp,
  IoBookSharp,
  IoCellularSharp,
  IoCheckmarkCircleSharp,
  IoMicSharp,
  IoPlaySharp,
  IoRefreshSharp,
  IoSchoolSharp,
  IoVolumeHighSharp,
  IoVolumeMediumSharp,
  IoWifiSharp,
  IoArrowDownSharp,
  IoArrowForwardSharp,
  IoCloseSharp,
} from 'react-icons/io5';

import Badge from '../ui/Badge.jsx';
import Button from '../ui/Button.jsx';
import { useAuth } from '../../lib/auth/AuthContext.jsx';
import { saveSrsWord, logPracticeSession } from '../../lib/firebase/firestore.js';

const SCORE_TIERS = [
  {
    min: 90,
    label: 'Excellent',
    jpLabel: 'たいへんよくできました',
    description: 'You scored very high.',
    stamp: '/assets/grading/stamp_english1.png',
    voice: '/assets/grading/sfx/_Excellent_ .mp3',
  },
  {
    min: 80,
    label: 'Very Good',
    jpLabel: 'よくできました',
    description: 'You scored very good.',
    stamp: '/assets/grading/stamp_english2.png',
    voice: '/assets/grading/sfx/_Good_ .mp3',
  },
  {
    min: 70,
    label: 'Good',
    jpLabel: 'できました',
    description: 'You scored fairly.',
    stamp: '/assets/grading/stamp_english3.png',
    voice: '/assets/grading/sfx/_Well done_ .mp3',
  },
  {
    min: 50,
    label: 'Average',
    jpLabel: 'もうすこし',
    description: 'You scored average.',
    stamp: '/assets/grading/stamp_english4.png',
    voice: '/assets/grading/sfx/_Another breath._ .mp3',
  },
  {
    min: 0,
    label: 'Needs Practice',
    jpLabel: 'がんばりましょう',
    description: 'You scored poorly.',
    stamp: '/assets/grading/stamp_english5.png',
    voice: "/assets/grading/sfx/_Let's do our best._ .mp3",
  },
];

const DEFAULT_REVIEW = {
  mode: 'Roleplay',
  scenario: 'Train Station',
  learnerRole: 'Tourist',
  aiRole: 'Ticket Seller',
  duration: '05:00',
  overall: 80,
  overallCritique: 'You effectively communicated your destination to the station staff, confirmed the platform number, and maintained polite Japanese phrasing throughout.',
  scenarioMilestones: [
    { title: 'State destination details', goal: 'State your destination clearly in Japanese (e.g. 渋谷駅に行きたいです)', accomplished: true, critique: 'Used 渋谷駅に行きたいです accurately.' },
    { title: 'Confirm train platform number', goal: 'Ask for or confirm the train platform number (何番線ですか / 二番線ですね)', accomplished: true, critique: 'Repeat-confirmed 二番線ですね after the clerk instructions.' },
    { title: 'Polite conversation etiquette', goal: 'Use natural polite confirmation and closing etiquette (ありがとうございます)', accomplished: true, critique: 'Used ありがとうございます politely at closure.' },
  ],
  metrics: [
    { label: 'Overall', value: 80, color: 'bg-ink', note: 'Completed key scenario goals: destination and platform confirmation.', modal: 'overall' },
    { label: 'Grammar', value: 80, color: 'bg-soft-blue', note: 'Good sentence endings. Review destination particles に and で.', modal: 'grammar' },
    { label: 'Vocabulary', value: 72, color: 'bg-mustard', note: 'Strong N5 basics; station-specific words need review.', modal: 'vocabulary' },
    { label: 'Engagement', value: 85, color: 'bg-correction', note: 'You responded politely and kept the conversation moving.', modal: 'engagement' },
    { label: 'Relevance', value: 88, color: 'bg-moss', note: 'Replies matched the roleplay goal without drifting off-topic.', modal: 'relevance' },
  ],
  weakVocabulary: [
    { term: '何番線', reading: 'なんばんせん', meaning: 'which platform / track number', source: 'Train Station roleplay' },
    { term: '乗り換え', reading: 'のりかえ', meaning: 'transfer', source: 'Train Station roleplay' },
    { term: '改札', reading: 'かいさつ', meaning: 'ticket gate', source: 'Train Station roleplay' },
  ],
  mistakes: [
    {
      title: 'Particle choice',
      original: '渋谷駅で行きたいです。',
      corrected: '渋谷駅に行きたいです。',
      why: 'Use に for destination with 行きます. で marks where an action happens.',
    },
    {
      title: 'Natural confirmation',
      original: '二番線ですか？ありがとう。',
      corrected: '二番線ですね。ありがとうございます。',
      why: 'ですね confirms what you heard and sounds more natural before thanking someone.',
    },
  ],
  transcript: [
    { speaker: 'KAIwa', text: 'こんにちは。どちらまで行きますか。' },
    { speaker: 'You', text: '渋谷駅に行きたいです。' },
    { speaker: 'KAIwa', text: '二番線です。山手線に乗ってください。' },
    { speaker: 'You', text: '二番線ですね。ありがとうございます。' },
  ],
};

export default function GradingScorecard() {
  const [review, setReview] = useState(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const saved = window.localStorage.getItem('kaiwa.last_grading_session');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed && typeof parsed.overall === 'number') {
            return parsed;
          }
        }
      } catch (e) {}
    }
    return DEFAULT_REVIEW;
  });

  const tier = getTier(review.overall);
  const [queueStatus, setQueueStatus] = useState('idle');
  const [activeModal, setActiveModal] = useState(null);
  const { user } = useAuth();
  const hasLogged = useRef(false);

  useEffect(() => {
    if (!hasLogged.current && review) {
      hasLogged.current = true;
      const scenarioName = typeof review.scenario === 'object' ? review.scenario.title : (review.scenario || 'Practice');
      const sessionPayload = {
        id: `session-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        type: review.mode || 'Roleplay',
        title: `${scenarioName} Roleplay`,
        scenario: scenarioName,
        score: review.overall,
        grade: tier.label,
        duration: review.duration || '05:00',
        summary: review.overallCritique || 'Completed roleplay scenario practice.',
        transcript: review.transcript || [],
        report: review,
        date: new Date().toISOString(),
      };

      // Save to localStorage for local / guest history
      if (typeof window !== 'undefined' && window.localStorage) {
        try {
          const existing = JSON.parse(window.localStorage.getItem('kaiwa.local_history') || '[]');
          const exists = existing.some(item => item.id === sessionPayload.id);
          if (!exists) {
            window.localStorage.setItem('kaiwa.local_history', JSON.stringify([sessionPayload, ...existing]));
          }
        } catch (e) {
          console.error('Error saving to local history:', e);
        }
      }

      // Save to Firebase Firestore if logged in
      if (user) {
        logPracticeSession(user.uid, sessionPayload).catch(err => console.error('Failed to log practice to Firestore:', err));
      }
    }
  }, [user, review, tier]);

  async function handleQueueWeakVocabulary() {
    setQueueStatus('saving');

    try {
      await saveWeakVocabularyToSrs(review.weakVocabulary || [], user?.uid);
      setQueueStatus('saved');
    } catch {
      setQueueStatus('error');
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-paper px-4 py-8 text-ink sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute left-[-8rem] top-16 h-80 w-80 rounded-full bg-mustard/30 blur-3xl" aria-hidden="true" />
      <div className="pointer-events-none absolute bottom-[-10rem] right-[-8rem] h-96 w-96 rounded-full bg-soft-blue/40 blur-3xl" aria-hidden="true" />

      <div className="relative mx-auto max-w-7xl">
        <header className="brutal-border bg-mustard p-8 shadow-shadow flex flex-col md:flex-row items-center justify-between gap-6 mb-10">
          <div className="flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
            <div className="relative shrink-0">
              <img
                src={tier.stamp}
                alt={`${tier.label} stamp`}
                className="h-36 w-36 sm:h-44 sm:w-44 animate-stamp-slam object-contain drop-shadow-xl"
                draggable="false"
              />
            </div>
            <div>
              <span className="label-mono bg-white px-3 py-1 brutal-border text-xs inline-block">
                {review.scenario || 'Roleplay'} Roleplay
              </span>
              <h1 className="font-display text-4xl sm:text-5xl mt-3 text-ink">Grading Report</h1>
              <p className="mt-2 text-sm font-bold text-ink/80 max-w-md leading-relaxed">
                Evaluated on core learning criteria. Click any card to open detailed AI feedback.
              </p>
            </div>
          </div>
          <div className="brutal-border bg-white p-6 shadow-nav text-center shrink-0 min-w-[11rem] flex flex-col items-center">
            <p className="font-mono text-xs font-black uppercase text-ink/60">Overall Score</p>
            <p className="font-display text-6xl text-ink mt-1">{review.overall}%</p>
            <VoiceLineButton tier={tier} />
          </div>
        </header>

        <section className="grid gap-8 lg:grid-cols-[1fr_24rem] xl:items-start">
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2" aria-label="Score breakdown">
              {(review.metrics || DEFAULT_REVIEW.metrics).map((metric) => (
                <MetricCard key={metric.label} metric={metric} onOpen={() => metric.modal && setActiveModal(metric.modal)} />
              ))}
            </div>
          </div>

          <aside className="space-y-5">
            <ConversationHistory review={review} />
          </aside>
        </section>

        <footer className="mt-12 flex flex-col gap-4 pb-16 sm:flex-row sm:items-center sm:justify-center">
          <Button as={Link} href="/roleplay" variant="secondary">
            Practice more Roleplay
          </Button>
          <Button as={Link} href="/">
            Return Home
          </Button>
        </footer>
      </div>

      {activeModal && (
        <SuggestionsOverlay 
          type={activeModal} 
          onClose={() => setActiveModal(null)} 
          review={review}
          mistakes={review.mistakes || []} 
          words={review.weakVocabulary || []} 
          queueStatus={queueStatus} 
          onQueue={handleQueueWeakVocabulary} 
        />
      )}
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
        aria-label={`Open ${metric.label} detailed AI insights`}
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
        <div className={`h-full ${metric.color}`} style={{ width: `${metric.value}%` }} />
      </div>
    </article>
  );
}

function VoiceLineButton({ tier }) {
  const audioRef = useRef(null);
  const [status, setStatus] = useState('idle');

  function playVoiceLine() {
    if (!audioRef.current) return;
    audioRef.current.currentTime = 0;
    audioRef.current
      .play()
      .then(() => setStatus('playing'))
      .catch(() => setStatus('blocked'));
  }

  return (
    <div className="mt-4">
      <button
        type="button"
        onClick={playVoiceLine}
        className="brutal-border flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-black uppercase tracking-wider text-ink shadow-nav transition-all hover:-translate-y-0.5 active:scale-95"
      >
        <IoVolumeMediumSharp className="text-base text-aizome" />
        <span>{status === 'playing' ? 'Playing sfx…' : 'Play voice'}</span>
      </button>
      <audio ref={audioRef} src={tier.voice} preload="auto" onEnded={() => setStatus('idle')} />
    </div>
  );
}

function ConversationHistory({ review }) {
  return (
    <article className="relative mx-auto w-full max-w-[25rem] text-ink h-[40rem] flex flex-col brutal-border bg-[#fffefa] shadow-shadow" aria-label="Conversation history">
      <div className="border-b-2 border-ink/10 px-5 py-4 text-center bg-paper relative z-10">
        <p className="font-mono text-xs font-black uppercase tracking-[0.12em] text-ink/50">You: {review.learnerRole || 'Learner'}</p>
        <h2 className="mt-1 font-display text-2xl leading-none">{review.aiRole || 'KAIwa Sensei'}</h2>
        <span className="mt-2 inline-flex rounded-full bg-ink/10 px-3 py-1 font-mono text-xs font-black">{review.duration || '05:00'}</span>
      </div>

      <div className="flex-1 overflow-y-auto space-y-4 px-4 py-5 bg-[#fffefa]">
        {(review.transcript || []).map((message, idx) => (
          <div key={`${message.speaker}-${idx}`} className={message.speaker === 'You' ? 'flex justify-end' : 'flex justify-start'}>
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

function MistakeAnalysis({ mistakes }) {
  const hasMistakes = mistakes && mistakes.length > 0;

  return (
    <section id="grammar" className="brutal-border bg-white p-6 shadow-shadow" aria-labelledby="mistake-analysis-title">
      <div className="flex items-center gap-3 pr-12">
        <span className="grid h-10 w-10 place-items-center brutal-border bg-soft-blue text-ink shadow-nav">
          <IoRefreshSharp className="text-xl" aria-hidden="true" />
        </span>
        <div>
          <p className="label-mono text-aizome">Detailed Grammar Analysis</p>
          <h2 id="mistake-analysis-title" className="font-display text-3xl leading-none">Grammar Suggestions</h2>
        </div>
      </div>

      {!hasMistakes ? (
        <div className="mt-6 brutal-border bg-moss/10 p-6 shadow-nav flex flex-col items-center text-center space-y-3">
          <span className="grid h-12 w-12 place-items-center brutal-border bg-moss text-white text-2xl shadow-nav">✓</span>
          <h3 className="font-display text-2xl text-ink">No Grammar Mistakes Found!</h3>
          <p className="font-bold text-sm text-ink/75 max-w-md">
            Your particles, verb endings, and polite expressions were accurate and natural throughout the practice session. Excellent work!
          </p>
        </div>
      ) : (
        <div className="mt-6 space-y-5">
          {mistakes.map((mistake, idx) => (
            <article key={mistake.title || idx} className="brutal-border bg-paper p-5 shadow-nav space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-ink/10 pb-3">
                <div className="flex items-center gap-2">
                  <span className="brutal-border bg-correction text-white font-mono text-xs font-black px-2 py-0.5 shadow-sm">#{idx + 1}</span>
                  <span className="font-display text-xl text-ink leading-none">{mistake.title}</span>
                </div>
                <span className="brutal-border bg-soft-blue px-2.5 py-1 font-mono text-[10px] font-black uppercase text-ink shadow-sm">Grammar Tip</span>
              </div>

              {/* Clean Neobrutalist Transformation Bar */}
              <div className="bg-white p-3.5 font-jp flex flex-wrap items-center gap-3 text-sm brutal-border shadow-nav">
                <div className="flex items-center gap-2 bg-correction/15 px-3 py-1.5 brutal-border">
                  <span className="font-mono text-[10px] font-black text-correction uppercase tracking-wider">Try again:</span>
                  <span className="line-through text-correction font-black">{mistake.original}</span>
                </div>
                <span className="text-ink font-black text-xl">→</span>
                <div className="flex items-center gap-2 bg-moss/20 px-3 py-1.5 brutal-border">
                  <span className="font-mono text-[10px] font-black text-moss uppercase tracking-wider">Recommend:</span>
                  <span className="text-moss font-black">{mistake.corrected}</span>
                </div>
              </div>

              {/* Clean Neobrutalist Explanation Box */}
              <div className="bg-white p-4 font-sans text-sm font-bold text-ink/85 leading-relaxed brutal-border shadow-nav">
                <span className="font-mono text-xs font-black uppercase text-aizome block mb-1">Why (Grammar Rule):</span>
                {mistake.why}
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function WeakVocabularyPanel({ words, status, onQueue }) {
  const count = words?.length || 0;

  return (
    <section id="vocabulary" className="brutal-border bg-mustard p-6 shadow-shadow" aria-labelledby="weak-vocab-title">
      <div className="flex items-center gap-3 pr-12 mb-6">
        <span className="grid h-10 w-10 place-items-center brutal-border bg-white shadow-nav">
          <IoBookSharp className="text-xl text-ink" aria-hidden="true" />
        </span>
        <div>
          <p className="label-mono text-ink/70">SRS Flashcard Queue</p>
          <h2 id="weak-vocab-title" className="font-display text-3xl leading-none text-ink">Weak Vocabulary</h2>
        </div>
      </div>

      <div className="space-y-4 my-6">
        {(words || []).map((word, idx) => (
          <article key={word.term || idx} className="brutal-border bg-white p-5 shadow-nav space-y-3">
            <div className="flex items-baseline justify-between gap-3 border-b-2 border-ink/10 pb-3">
              <div className="flex items-baseline gap-2.5">
                <p className="font-jp text-2xl font-black text-ink">{word.term}</p>
                <p className="font-mono text-xs font-black uppercase text-aizome">[{word.reading}]</p>
              </div>
              <span className="font-mono text-[10px] font-black uppercase bg-mustard/20 px-2.5 py-1 brutal-border text-ink shrink-0">
                {word.source || 'Roleplay'}
              </span>
            </div>
            <p className="text-sm font-black text-ink/80 my-2">{word.meaning}</p>
            {word.reason && (
              <p className="text-xs font-bold text-ink/75 leading-relaxed bg-paper p-3 brutal-border mt-3">
                <span className="font-mono font-black text-ink/60 uppercase text-[10px] block mb-1">AI SRS Recommendation:</span>
                {word.reason}
              </p>
            )}
          </article>
        ))}
      </div>

      <div className="mt-8 space-y-4">
        <button
          type="button"
          onClick={onQueue}
          disabled={status === 'saving'}
          className={`brutal-border flex w-full items-center justify-center gap-2 px-5 py-4 font-black shadow-shadow transition-all duration-150 ease-out hover:translate-x-1 hover:translate-y-1 hover:shadow-nav disabled:cursor-wait disabled:opacity-70 ${
            status === 'saved' ? 'bg-moss text-white' : 'bg-aizome text-paper'
          }`}
        >
          {status === 'saved' ? <IoCheckmarkCircleSharp className="text-xl" /> : <IoSchoolSharp className="text-xl" />}
          {status === 'saving'
            ? 'Syncing to SRS Deck…'
            : status === 'saved'
            ? `✓ Added ${count} Words to SRS Deck!`
            : `Add ${count} Weak Words to SRS Deck`}
        </button>

        {status === 'saved' && (
          <div className="brutal-border bg-white p-4 text-center shadow-nav my-2">
            <p className="font-mono text-xs font-bold text-moss">
              ✓ Successfully synced to your Spaced Repetition Flashcard Deck (Firestore & Local DB).
            </p>
            <Link href="/roleplay" className="mt-2.5 inline-flex items-center gap-1 font-mono text-xs font-black text-aizome underline hover:text-ink">
              Practice another roleplay scenario →
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}

function getTier(score) {
  return SCORE_TIERS.find((tier) => score >= tier.min) ?? SCORE_TIERS[SCORE_TIERS.length - 1];
}

function SuggestionsOverlay({ type, onClose, review, mistakes, words, queueStatus, onQueue }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6" role="dialog" aria-modal="true" aria-label={`${type} details`}>
      <div className="absolute inset-0 bg-ink/70 backdrop-blur-sm" aria-hidden="true" onClick={onClose} />
      <div className="animate-panel-in relative w-full max-w-2xl max-h-[90vh] flex flex-col">
        <button type="button" aria-label="Close" onClick={onClose} className="absolute right-5 top-5 brutal-border grid h-10 w-10 place-items-center rounded-full bg-white text-lg shadow-nav transition-transform hover:-translate-y-0.5 active:scale-95 z-10">
          <IoCloseSharp />
        </button>
        <div className="overflow-y-auto bg-paper brutal-border shadow-shadow flex-1">
          {type === 'grammar' && <MistakeAnalysis mistakes={mistakes || []} />}
          {type === 'vocabulary' && <WeakVocabularyPanel words={words || []} status={queueStatus} onQueue={onQueue} />}
          {type === 'overall' && <OverallAnalysisPanel review={review} />}
          {type === 'engagement' && <EngagementAnalysisPanel review={review} />}
          {type === 'relevance' && <RelevanceAnalysisPanel review={review} />}
        </div>
      </div>
    </div>
  );
}

function OverallAnalysisPanel({ review }) {
  const scenarioTitle = review?.scenario || 'Train Station';
  const score = review?.overall ?? 80;
  const passed = score >= 60;
  const milestones = review?.scenarioMilestones || [
    { title: 'State destination details', goal: 'State your destination clearly in Japanese (e.g. 渋谷駅に行きたいです)', accomplished: true, critique: 'Used 渋谷駅に行きたいです correctly.' },
    { title: 'Confirm train platform number', goal: 'Ask for or confirm the train platform number (何番線ですか / 二番線ですね)', accomplished: true, critique: 'Repeat-confirmed 二番線ですね.' },
    { title: 'Polite conversation etiquette', goal: 'Use natural polite confirmation and closing etiquette (ありがとうございます)', accomplished: true, critique: 'Used ありがとうございます at closure.' },
  ];

  return (
    <section className="brutal-border bg-white p-6 shadow-shadow" aria-labelledby="overall-title">
      <div className="flex items-center gap-3 pr-12">
        <span className="grid h-10 w-10 place-items-center brutal-border bg-ink text-paper shadow-nav">
          <IoCheckmarkCircleSharp className="text-2xl text-mustard" aria-hidden="true" />
        </span>
        <div>
          <p className="label-mono text-ink/60">Comprehensive Performance</p>
          <h2 id="overall-title" className="font-display text-3xl leading-none">Overall Performance</h2>
        </div>
      </div>

      <div className="mt-6 space-y-4">
        {/* Scenario Objective Header & Score */}
        <div className="brutal-border bg-mustard/20 p-4 shadow-nav flex items-center justify-between gap-4">
          <div>
            <p className="font-mono text-xs font-black uppercase text-ink/70">Scenario Objective</p>
            <p className="mt-1 font-display text-xl text-ink">{scenarioTitle} Roleplay</p>
          </div>
          <div className={`brutal-border px-3 py-1.5 font-mono text-xs font-black uppercase text-white shadow-nav shrink-0 ${passed ? 'bg-moss' : 'bg-correction'}`}>
            {passed ? `PASSED (${score}%)` : `NEEDS PRACTICE (${score}%)`}
          </div>
        </div>

        {/* AI Tutor Overall Critique */}
        {review?.overallCritique && (
          <div className="brutal-border bg-paper p-4 shadow-nav">
            <p className="font-mono text-xs font-black uppercase text-ink/70">AI Tutor Feedback</p>
            <p className="mt-2 text-sm font-bold text-ink/85 leading-relaxed">
              "{review.overallCritique}"
            </p>
          </div>
        )}

        {/* Scenario Milestones Accomplished & AI Critiques */}
        <div className="brutal-border bg-paper p-4 shadow-nav space-y-3">
          <p className="font-mono text-xs font-black uppercase text-ink/70">Scenario Milestones Accomplished:</p>
          <div className="space-y-3">
            {milestones.map((m, idx) => (
              <div key={idx} className="brutal-border bg-white p-3.5 font-mono text-xs shadow-nav flex items-start gap-3">
                {m.accomplished !== false ? (
                  <IoCheckmarkCircleSharp className="text-moss text-xl shrink-0 mt-0.5" />
                ) : (
                  <IoCloseSharp className="text-correction text-xl shrink-0 mt-0.5" />
                )}
                <div className="space-y-1 w-full">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-black text-ink text-sm">{m.title}</p>
                    <span className={`px-2 py-0.5 text-[10px] font-black uppercase brutal-border shrink-0 ${m.accomplished !== false ? 'bg-moss/20 text-moss' : 'bg-correction/20 text-correction'}`}>
                      {m.accomplished !== false ? 'Accomplished' : 'Missed'}
                    </span>
                  </div>
                  {m.goal && <p className="font-bold text-ink/60 text-[11px]">Goal: {m.goal}</p>}
                  <p className="font-bold text-ink/80 text-xs leading-relaxed pt-1 bg-paper/60 p-2.5 brutal-border">
                    <span className="font-mono font-black text-ink/60 block text-[10px] uppercase mb-0.5">AI Critique:</span>
                    {m.critique || (m.accomplished !== false ? 'Goal accomplished effectively during roleplay.' : 'Goal was not reached during this practice session.')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function EngagementAnalysisPanel({ review }) {
  const engagementMetric = review?.metrics?.find(m => m.label === 'Engagement');
  const engagementData = review?.engagementAnalysis || {
    politenessFeedback: engagementMetric?.note || 'You maintained an exceptionally polite, warm, and appropriate tone throughout your roleplay conversation.',
    markers: [
      { marker: 'ね (Ne)', usage: 'Natural confirmation marker' },
      { marker: 'ありがとうございます', usage: 'Polite appreciative closing' }
    ]
  };

  const markersList = engagementData.markers || [
    { marker: 'ね (Ne)', usage: 'Natural confirmation marker' },
    { marker: 'ありがとうございます', usage: 'Polite appreciative closing' }
  ];

  return (
    <section className="brutal-border bg-white p-6 shadow-shadow" aria-labelledby="engagement-title">
      <div className="flex items-center gap-3 pr-12">
        <span className="grid h-10 w-10 place-items-center brutal-border bg-correction text-white shadow-nav">
          <IoSchoolSharp className="text-xl" aria-hidden="true" />
        </span>
        <div>
          <p className="label-mono text-correction">Tone & Connection</p>
          <h2 id="engagement-title" className="font-display text-3xl leading-none">Engagement Metrics</h2>
        </div>
      </div>

      <div className="mt-6 space-y-5">
        <div className="brutal-border bg-paper p-5 shadow-nav">
          <p className="font-mono text-xs font-black uppercase text-ink/70">AI Tutor Feedback on Politeness</p>
          <p className="mt-2 text-sm font-bold text-ink/85 leading-relaxed">
            "{engagementData.politenessFeedback || engagementMetric?.note || 'You maintained an exceptionally polite, warm, and appropriate tone throughout your roleplay conversation.'}"
          </p>
        </div>

        <div className="brutal-border bg-paper p-5 shadow-nav space-y-3">
          <p className="font-mono text-xs font-black uppercase text-ink/70">Conversational Markers (あいづち):</p>
          <div className="grid gap-3 font-mono text-xs">
            {markersList.map((m, idx) => (
              <div key={idx} className="brutal-border bg-white p-3.5 font-bold shadow-nav flex items-center justify-between gap-3">
                <span className="text-moss font-black text-sm shrink-0">✓ {m.marker}</span>
                <span className="text-ink/75 font-sans font-bold text-right">{m.usage}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function RelevanceAnalysisPanel({ review }) {
  const relevanceMetric = review?.metrics?.find(m => m.label === 'Relevance');
  const relevanceData = review?.relevanceAnalysis || {
    relevanceFeedback: relevanceMetric?.note || 'Your responses were highly relevant and directly addressed the roleplay prompts without off-topic drift.',
    offTopicLines: []
  };

  const offTopicLines = relevanceData.offTopicLines || [];
  const hasOffTopic = offTopicLines.length > 0;

  return (
    <section className="brutal-border bg-white p-6 shadow-shadow" aria-labelledby="relevance-title">
      <div className="flex items-center gap-3 pr-12">
        <span className="grid h-10 w-10 place-items-center brutal-border bg-moss text-white shadow-nav">
          <IoBookSharp className="text-xl" aria-hidden="true" />
        </span>
        <div>
          <p className="label-mono text-moss">Context & Task Alignment</p>
          <h2 id="relevance-title" className="font-display text-3xl leading-none">Relevance Score</h2>
        </div>
      </div>

      <div className="mt-6 space-y-5">
        <div className="brutal-border bg-paper p-5 shadow-nav">
          <p className="font-mono text-xs font-black uppercase text-ink/70">AI Tutor Advice on Relevance</p>
          <p className="mt-2 text-sm font-bold text-ink/85 leading-relaxed">
            "{relevanceData.relevanceFeedback || relevanceMetric?.note || 'Your responses were highly relevant and directly addressed the roleplay prompts without off-topic drift.'}"
          </p>
        </div>

        {!hasOffTopic ? (
          <div className="brutal-border bg-moss/10 p-5 shadow-nav flex flex-col items-center text-center space-y-2">
            <span className="grid h-10 w-10 place-items-center brutal-border bg-moss text-white text-xl shadow-sm">✓</span>
            <p className="font-display text-xl text-ink">100% Context Aligned!</p>
            <p className="font-bold text-xs text-ink/75 max-w-sm">
              All of your responses directly addressed the scenario prompts with zero off-topic or mismatched context lines.
            </p>
          </div>
        ) : (
          <div className="brutal-border bg-paper p-5 shadow-nav space-y-4">
            <p className="font-mono text-xs font-black uppercase text-ink/70">Off-Topic / Context Mismatches Identified:</p>
            <div className="space-y-3 font-jp text-xs">
              {offTopicLines.map((item, idx) => (
                <div key={idx} className="brutal-border bg-white p-4 shadow-nav space-y-2">
                  <div className="flex items-center gap-2 border-b border-ink/10 pb-2">
                    <span className="brutal-border bg-correction text-white font-mono text-[10px] font-black px-2 py-0.5">Off-Topic</span>
                    <p className="font-mono text-[11px] font-black text-ink/60 uppercase">Context Mismatch #{idx + 1}</p>
                  </div>
                  {item.prompt && (
                    <p className="font-bold text-ink/70">
                      <span className="font-mono font-black uppercase text-[10px] text-ink/50 block">AI Character Prompt:</span>
                      「{item.prompt}」
                    </p>
                  )}
                  <div className="bg-correction/10 p-2.5 brutal-border">
                    <span className="font-mono font-black text-correction uppercase text-[10px] block mb-0.5">Your Response:</span>
                    <span className="font-black text-ink">「{item.studentReply}」</span>
                  </div>
                  <div className="bg-paper p-2.5 brutal-border font-sans font-bold text-ink/80 text-xs">
                    <span className="font-mono font-black text-aizome uppercase text-[10px] block mb-0.5">Why It Was Off-Topic:</span>
                    {item.whyWrong}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function saveWeakVocabularyToSrs(words, userId) {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const existing = JSON.parse(window.localStorage.getItem('kaiwa.local_srs_words') || '[]');
      const wordMap = new Map(existing.map(w => [w.term, w]));
      words.forEach(w => {
        wordMap.set(w.term, { ...w, addedAt: new Date().toISOString() });
      });
      window.localStorage.setItem('kaiwa.local_srs_words', JSON.stringify(Array.from(wordMap.values())));
    } catch (e) {}
  }

  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      resolve();
      return;
    }

    const request = window.indexedDB.open('kaiwa-local-srs', 1);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains('weakVocabulary')) {
        db.createObjectStore('weakVocabulary', { keyPath: 'term' });
      }
    };

    request.onerror = () => resolve(); // Graceful fallback to localStorage

    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction('weakVocabulary', 'readwrite');
      const store = transaction.objectStore('weakVocabulary');
      const reviewedAt = new Date().toISOString();

      words.forEach((word) => {
        const wordData = { ...word, reviewedAt, dueAt: reviewedAt, source: word.source ?? 'Roleplay' };
        store.put(wordData);
        if (userId) {
          saveSrsWord(userId, wordData).catch(console.error);
        }
      });

      transaction.oncomplete = () => {
        db.close();
        resolve();
      };
      transaction.onerror = () => {
        db.close();
        resolve();
      };
    };
  });
}
