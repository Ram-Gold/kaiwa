'use client';

import { useRef, useState } from 'react';
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
  IoWifiSharp,
  IoArrowDownSharp,
  IoArrowForwardSharp,
  IoCloseSharp,
} from 'react-icons/io5';

import Badge from '../ui/Badge.jsx';
import Button from '../ui/Button.jsx';

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
    { label: 'Overall', value: 80, color: 'bg-ink', note: 'Completed the goal: ask where to go and confirm the platform.' },
    { label: 'Fluency', value: 75, color: 'bg-blush', note: 'A few pauses before key nouns, but the flow stayed understandable.' },
    { label: 'Grammar', value: 80, color: 'bg-soft-blue', note: 'Good sentence endings. Review particles に and で.', modal: 'grammar' },
    { label: 'Vocabulary', value: 72, color: 'bg-mustard', note: 'Strong N5 basics; station-specific words need review.', modal: 'vocabulary' },
    { label: 'Engagement', value: 85, color: 'bg-correction', note: 'You responded politely and kept the conversation moving.' },
    { label: 'Relevance', value: 88, color: 'bg-moss', note: 'Replies matched the roleplay goal without drifting off-topic.' },
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

  async function handleQueueWeakVocabulary() {
    setQueueStatus('saving');

    try {
      await saveWeakVocabularyToSrs(REVIEW.weakVocabulary);
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
        <header className="mb-12 flex flex-col items-center text-center">
          <div className="relative mb-6">
            <img src={tier.stamp} alt={`${tier.label} stamp`} className="mx-auto h-48 w-48 animate-stamp-slam object-contain drop-shadow-xl" draggable="false" />
            <div className="absolute -bottom-4 left-1/2 -translate-x-1/2">
              <VoiceLineButton tier={tier} />
            </div>
          </div>
          <p className="label-mono text-correction mt-4">Grading & Review Scorecard</p>
          <h1 className="mt-3 font-display text-5xl leading-none sm:text-7xl">Nice Job</h1>
          <p className="mt-3 font-display text-3xl text-ink">Score: {REVIEW.overall}%</p>
          <p className="mx-auto mt-3 max-w-2xl text-lg font-bold leading-8 text-ink/75">
            AI-style grading based on goal completion, fluency, grammar, vocabulary, engagement, and relevance.
          </p>
        </header>

        <section className="grid gap-8 lg:grid-cols-[1fr_minmax(20rem,28rem)] xl:items-start">
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

        <footer className="mt-12 flex flex-col gap-3 pb-16 sm:flex-row sm:items-center sm:justify-center">
          <Button as={Link} href="/roleplay" variant="secondary">
            Practice another roleplay
          </Button>
          <Button as={Link} href="/">
            Return home
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
  return (
    <article className="brutal-border bg-white p-5 shadow-shadow transition-transform duration-200 ease-out hover:-translate-y-1 flex flex-col justify-between h-48 relative group">
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
        className="brutal-border inline-flex items-center gap-2 bg-aizome px-4 py-3 font-black text-paper shadow-nav transition-all duration-150 ease-out hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-none"
      >
        <IoVolumeHighSharp aria-hidden="true" /> Play score voice
      </button>
      <audio ref={audioRef} src={tier.voice} preload="metadata" onEnded={() => setStatus('idle')} />
      <p className="mt-2 text-sm font-bold text-ink/60" role="status">
        {status === 'playing' ? 'Playing matching voice line…' : status === 'blocked' ? 'Tap again if your browser blocked audio.' : 'Voice line corresponds to this score.'}
      </p>
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
    <section id="grammar" className="brutal-border bg-white p-5 shadow-shadow scroll-mt-6" aria-labelledby="mistake-analysis-title">
      <div className="flex items-center gap-3 pr-12">
        <span className="grid h-10 w-10 place-items-center brutal-border bg-correction text-paper shadow-nav">
          <IoRefreshSharp aria-hidden="true" />
        </span>
        <div>
          <p className="label-mono text-correction">Detailed mistake analysis</p>
          <h2 id="mistake-analysis-title" className="font-display text-3xl leading-none">Grammar suggestions</h2>
        </div>
      </div>

      <div className="mt-5 space-y-4">
        {mistakes.map((mistake) => (
          <article key={mistake.title} className="brutal-border bg-paper p-4 shadow-nav">
            <p className="font-black">{mistake.title}</p>
            <div className="mt-3 grid gap-3 text-sm font-bold leading-6">
              <p><span className="text-correction">Try again:</span> {mistake.original}</p>
              <p><span className="text-moss">Better:</span> {mistake.corrected}</p>
              <p className="text-ink/65">{mistake.why}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function WeakVocabularyPanel({ words, status, onQueue }) {
  return (
    <section id="vocabulary" className="brutal-border bg-mustard p-5 shadow-shadow scroll-mt-6" aria-labelledby="weak-vocab-title">
      <div className="flex items-center gap-3 pr-12">
        <span className="grid h-10 w-10 place-items-center brutal-border bg-white shadow-nav">
          <IoBookSharp aria-hidden="true" />
        </span>
        <div>
          <p className="label-mono">Local SRS queue</p>
          <h2 id="weak-vocab-title" className="font-display text-3xl leading-none">Weak vocabulary</h2>
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
        {status === 'saving' ? 'Saving locally…' : status === 'saved' ? 'Saved to local SRS' : 'Add weak words to SRS'}
      </button>
      <p className="mt-3 text-sm font-bold leading-6 text-ink/70" role="status">
        {status === 'error' ? 'IndexedDB was unavailable in this browser session.' : 'Stored locally in IndexedDB; nothing is sent to a server.'}
      </p>
    </section>
  );
}

function getTier(score) {
  return SCORE_TIERS.find((tier) => score >= tier.min) ?? SCORE_TIERS[SCORE_TIERS.length - 1];
}

function SuggestionsOverlay({ type, onClose, mistakes, words, queueStatus, onQueue }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6" role="dialog" aria-modal="true" aria-label={`${type} suggestions`}>
      <div className="absolute inset-0 bg-paper/40 backdrop-blur-[2px]" aria-hidden="true" onClick={onClose} />
      <div className="animate-panel-in relative w-full max-w-2xl max-h-[90vh] flex flex-col">
        <button type="button" aria-label="Close" onClick={onClose} className="absolute right-5 top-5 brutal-border grid h-10 w-10 place-items-center rounded-full bg-white text-lg shadow-nav transition-transform hover:-translate-y-0.5 active:scale-95 z-10">
          <IoCloseSharp />
        </button>
        <div className="overflow-y-auto rounded-3xl shadow-2xl">
          {type === 'grammar' ? (
            <MistakeAnalysis mistakes={mistakes} />
          ) : (
            <WeakVocabularyPanel words={words} status={queueStatus} onQueue={onQueue} />
          )}
        </div>
      </div>
    </div>
  );
}

function saveWeakVocabularyToSrs(words) {
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
        store.put({ ...word, reviewedAt, dueAt: reviewedAt, source: word.source ?? REVIEW.scenario });
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
