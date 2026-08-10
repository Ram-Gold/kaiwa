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

const REVIEW = {
  mode: 'Roleplay',
  scenario: 'Train Station',
  learnerRole: 'Tourist',
  aiRole: 'Ticket Seller',
  duration: '05:00',
  overall: 80,
  metrics: [
    { label: 'Overall', value: 80, color: 'bg-ink', note: 'Completed the goal: ask where to go and confirm the platform.', modal: 'overall' },
    { label: 'Grammar', value: 80, color: 'bg-soft-blue', note: 'Good sentence endings. Review particles に and で.', modal: 'grammar' },
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
  const tier = getTier(REVIEW.overall);
  const [queueStatus, setQueueStatus] = useState('idle');
  const [activeModal, setActiveModal] = useState(null);
  const { user } = useAuth();
  const hasLogged = useRef(false);

  useEffect(() => {
    if (user && !hasLogged.current) {
      hasLogged.current = true;
      logPracticeSession(user.uid, {
        score: REVIEW.overall,
        xpGained: 50, // Hardcoded for demo
        duration: 120 // Hardcoded for demo
      }).catch(err => console.error('Failed to log practice:', err));
    }
  }, [user]);

  async function handleQueueWeakVocabulary() {
    setQueueStatus('saving');

    try {
      await saveWeakVocabularyToSrs(REVIEW.weakVocabulary, user?.uid);
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
                {REVIEW.scenario} Roleplay
              </span>
              <h1 className="font-display text-4xl sm:text-5xl mt-3 text-ink">Grading Report</h1>
              <p className="mt-2 text-sm font-bold text-ink/80 max-w-md leading-relaxed">
                Evaluated on 5 core learning criteria. Click any card to open detailed AI feedback.
              </p>
            </div>
          </div>
          <div className="brutal-border bg-white p-6 shadow-nav text-center shrink-0 min-w-[11rem] flex flex-col items-center">
            <p className="font-mono text-xs font-black uppercase text-ink/60">Overall Score</p>
            <p className="font-display text-6xl text-ink mt-1">{REVIEW.overall}%</p>
            <VoiceLineButton tier={tier} />
          </div>
        </header>

        <section className="grid gap-8 lg:grid-cols-[1fr_24rem] xl:items-start">
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2" aria-label="Score breakdown">
              {REVIEW.metrics.map((metric) => (
                <MetricCard key={metric.label} metric={metric} onOpen={() => metric.modal && setActiveModal(metric.modal)} />
              ))}
            </div>
          </div>

          <aside className="space-y-5">
            <ConversationHistory review={REVIEW} />
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
          mistakes={REVIEW.mistakes} 
          words={REVIEW.weakVocabulary} 
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
      {metric.modal ? (
        <button type="button" onClick={onOpen} className="absolute inset-0 z-10 w-full cursor-pointer opacity-0" aria-label={`Open ${metric.label} suggestions`}></button>
      ) : null}
      <div className="flex items-start justify-between gap-3 relative z-20 pointer-events-none">
        <div className="pr-2">
          <p className="font-display text-2xl leading-none flex items-center gap-2">
            {metric.label}
            {metric.modal && <IoArrowForwardSharp className="text-xl text-ink/50 group-hover:text-ink transition-colors" aria-hidden="true" />}
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
        <p className="font-mono text-xs font-black uppercase tracking-[0.12em] text-ink/50">You: {review.learnerRole}</p>
        <h2 className="mt-1 font-display text-2xl leading-none">{review.aiRole}</h2>
        <span className="mt-2 inline-flex rounded-full bg-ink/10 px-3 py-1 font-mono text-xs font-black">{review.duration}</span>
      </div>

      <div className="flex-1 overflow-y-auto space-y-4 px-4 py-5 bg-[#fffefa]">
        {review.transcript.map((message, idx) => (
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

      <div className="mt-6 space-y-5">
        {mistakes.map((mistake, idx) => (
          <article key={mistake.title || idx} className="brutal-border bg-paper p-5 shadow-nav space-y-4">
            <div className="flex items-center justify-between border-b-2 border-ink/15 pb-3">
              <span className="font-display text-xl text-ink">{mistake.title}</span>
              <span className="brutal-border bg-soft-blue px-2.5 py-0.5 font-mono text-[10px] font-black uppercase tracking-wider text-ink shadow-sm">
                Grammar Tip
              </span>
            </div>

            <div className="space-y-3 font-jp">
              <div className="flex flex-col sm:flex-row sm:items-baseline gap-2 rounded-xl bg-correction/10 p-3.5 border-l-4 border-correction">
                <span className="font-mono text-xs font-black uppercase text-correction shrink-0">Try again:</span>
                <span className="text-base font-bold text-ink leading-relaxed">{mistake.original}</span>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-baseline gap-2 rounded-xl bg-moss/10 p-3.5 border-l-4 border-moss">
                <span className="font-mono text-xs font-black uppercase text-moss shrink-0">Recommended:</span>
                <span className="text-base font-black text-ink leading-relaxed">{mistake.corrected}</span>
              </div>

              <div className="mt-2 rounded-xl bg-white p-4 brutal-border font-sans text-sm font-bold text-ink/80 leading-relaxed shadow-sm">
                <span className="font-mono text-xs font-black uppercase text-ink/50 block mb-1">Explanation</span>
                {mistake.why}
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function WeakVocabularyPanel({ words, status, onQueue }) {
  return (
    <section id="vocabulary" className="brutal-border bg-mustard p-6 shadow-shadow" aria-labelledby="weak-vocab-title">
      <div className="flex items-center gap-3 pr-12">
        <span className="grid h-10 w-10 place-items-center brutal-border bg-white shadow-nav">
          <IoBookSharp className="text-xl" aria-hidden="true" />
        </span>
        <div>
          <p className="label-mono text-ink">SRS Flashcard Queue</p>
          <h2 id="weak-vocab-title" className="font-display text-3xl leading-none">Weak Vocabulary</h2>
        </div>
      </div>

      <div className="mt-5 space-y-3">
        {words.map((word) => (
          <article key={word.term} className="brutal-border bg-white p-4 shadow-nav">
            <div className="flex items-baseline justify-between gap-3">
              <p className="font-jp text-2xl font-black">{word.term}</p>
              <p className="font-mono text-xs font-black uppercase tracking-[0.12em] text-aizome">{word.reading}</p>
            </div>
            <p className="mt-1 text-sm font-bold text-ink/65">{word.meaning}</p>
          </article>
        ))}
      </div>

      <button
        type="button"
        onClick={onQueue}
        disabled={status === 'saving'}
        className="mt-5 brutal-border flex w-full items-center justify-center gap-2 bg-aizome px-5 py-4 font-black text-paper shadow-shadow transition-all duration-150 ease-out hover:translate-x-1 hover:translate-y-1 hover:shadow-nav disabled:cursor-wait disabled:opacity-70"
      >
        {status === 'saved' ? <IoCheckmarkCircleSharp aria-hidden="true" /> : <IoSchoolSharp aria-hidden="true" />}
        {status === 'saving' ? 'Saving to SRS…' : status === 'saved' ? 'Saved to SRS Deck' : 'Add weak words to SRS Deck'}
      </button>
      <p className="mt-3 text-sm font-bold leading-6 text-ink/80 text-center" role="status">
        Saved to your SRS flashcard deck for daily spaced repetition practice.
      </p>
    </section>
  );
}

function getTier(score) {
  return SCORE_TIERS.find((tier) => score >= tier.min) ?? SCORE_TIERS[SCORE_TIERS.length - 1];
}

function SuggestionsOverlay({ type, onClose, mistakes, words, queueStatus, onQueue }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6" role="dialog" aria-modal="true" aria-label={`${type} details`}>
      <div className="absolute inset-0 bg-ink/70 backdrop-blur-sm" aria-hidden="true" onClick={onClose} />
      <div className="animate-panel-in relative w-full max-w-2xl max-h-[90vh] flex flex-col">
        <button type="button" aria-label="Close" onClick={onClose} className="absolute right-5 top-5 brutal-border grid h-10 w-10 place-items-center rounded-full bg-white text-lg shadow-nav transition-transform hover:-translate-y-0.5 active:scale-95 z-10">
          <IoCloseSharp />
        </button>
        <div className="overflow-y-auto rounded-3xl shadow-2xl bg-white">
          {type === 'grammar' && <MistakeAnalysis mistakes={mistakes} />}
          {type === 'vocabulary' && <WeakVocabularyPanel words={words} status={queueStatus} onQueue={onQueue} />}
          {type === 'overall' && <OverallAnalysisPanel />}
          {type === 'engagement' && <EngagementAnalysisPanel />}
          {type === 'relevance' && <RelevanceAnalysisPanel />}
        </div>
      </div>
    </div>
  );
}

function OverallAnalysisPanel() {
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
        <div className="brutal-border bg-mustard/20 p-4 shadow-nav flex items-center justify-between gap-4">
          <div>
            <p className="font-mono text-xs font-black uppercase text-ink/70">Scenario Objective</p>
            <p className="mt-1 font-display text-xl text-ink">Train Station Ticket Purchase</p>
          </div>
          <div className="brutal-border bg-moss px-3 py-1.5 font-mono text-xs font-black uppercase text-white shadow-nav shrink-0">
            PASSED (80%)
          </div>
        </div>

        <div className="brutal-border bg-paper p-4 shadow-nav space-y-3">
          <p className="font-mono text-xs font-black uppercase text-ink/70">Scenario Milestones Accomplished:</p>
          <div className="space-y-2">
            {[
              { title: 'Asked for destination details', detail: 'Used 渋谷駅に行きたいです correctly.' },
              { title: 'Confirmed train platform number', detail: 'Repeat-confirmed 二番線ですね.' },
              { title: 'Maintained polite conversation etiquette', detail: 'Used ありがとうございます at closure.' },
            ].map((m, idx) => (
              <div key={idx} className="brutal-border bg-white p-3 font-mono text-xs shadow-nav flex items-start gap-3">
                <IoCheckmarkCircleSharp className="text-moss text-lg shrink-0 mt-0.5" />
                <div>
                  <p className="font-black text-ink">{m.title}</p>
                  <p className="font-bold text-ink/65 mt-0.5">{m.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function EngagementAnalysisPanel() {
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

      <div className="mt-6 space-y-4">
        <div className="brutal-border bg-paper p-4 shadow-nav">
          <p className="font-mono text-xs font-black uppercase text-ink/70">AI Tutor Feedback on Politeness</p>
          <p className="mt-2 text-sm font-bold text-ink/85 leading-relaxed">
            "You maintained an exceptionally polite, warm, and appropriate tone throughout your roleplay conversation with the station staff."
          </p>
        </div>

        <div className="brutal-border bg-paper p-4 shadow-nav space-y-3">
          <p className="font-mono text-xs font-black uppercase text-ink/70">Conversational Markers (あいづち):</p>
          <div className="grid gap-2 sm:grid-cols-2 font-mono text-xs">
            <div className="brutal-border bg-white p-3 font-bold shadow-nav">
              <span className="text-moss font-black">✓ ね (Ne)</span>: Natural confirmation marker
            </div>
            <div className="brutal-border bg-white p-3 font-bold shadow-nav">
              <span className="text-moss font-black">✓ ありがとうございます</span>: Polite appreciative closing
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function RelevanceAnalysisPanel() {
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

      <div className="mt-6 space-y-4">
        <div className="brutal-border bg-paper p-4 shadow-nav">
          <p className="font-mono text-xs font-black uppercase text-ink/70">AI Tutor Feedback on Relevance</p>
          <p className="mt-2 text-sm font-bold text-ink/85 leading-relaxed">
            "Your responses were highly relevant and directly addressed the ticket seller's prompts without any off-topic drift."
          </p>
        </div>

        <div className="brutal-border bg-paper p-4 shadow-nav space-y-2">
          <p className="font-mono text-xs font-black uppercase text-ink/70">Context Alignment Highlights:</p>
          <div className="space-y-2 font-mono text-xs">
            <div className="brutal-border bg-white p-3 font-bold shadow-nav">
              <p className="font-black text-ink">AI Question: 「どちらまで行きますか。」</p>
              <p className="text-moss mt-1 font-black">Learner Answer: 「渋谷駅に行きたいです。」 (100% relevant)</p>
            </div>
            <div className="brutal-border bg-white p-3 font-bold shadow-nav">
              <p className="font-black text-ink">AI Statement: 「二番線です。」</p>
              <p className="text-moss mt-1 font-black">Learner Confirmation: 「二番線ですね。」 (100% relevant)</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function saveWeakVocabularyToSrs(words, userId) {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB unavailable'));
      return;
    }

    const request = window.indexedDB.open('kaiwa-local-srs', 1);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains('weakVocabulary')) {
        db.createObjectStore('weakVocabulary', { keyPath: 'term' });
      }
    };

    request.onerror = () => reject(request.error ?? new Error('Could not open IndexedDB'));

    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction('weakVocabulary', 'readwrite');
      const store = transaction.objectStore('weakVocabulary');
      const reviewedAt = new Date().toISOString();

      words.forEach((word) => {
        const wordData = { ...word, reviewedAt, dueAt: reviewedAt, source: word.source ?? REVIEW.scenario };
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
        reject(transaction.error ?? new Error('Could not save vocabulary'));
      };
    };
  });
}

export { REVIEW, SCORE_TIERS, saveWeakVocabularyToSrs };
