'use client';

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import {
  IoArrowBackSharp,
  IoCheckmarkCircleSharp,
  IoChevronForwardSharp,
  IoHomeSharp,
  IoRibbonSharp,
  IoSchoolSharp,
  IoSparklesSharp,
  IoVolumeHighSharp,
} from 'react-icons/io5';

const variants = [
  {
    name: 'Report Card',
    axis: 'Structured study feedback with clear score breakdowns',
  },
  {
    name: 'Stamp Reveal',
    axis: 'Big stamp-first grading moment with playful motion',
  },
  {
    name: 'Sensei Review',
    axis: 'Conversation-coach debrief with next-step guidance',
  },
];

const gradeTiers = [
  {
    id: 'excellent',
    label: 'Excellent',
    jp: 'たいへんよくできました',
    score: 96,
    summary: 'You scored very high.',
    stamp: '/assets/grading/stamp_english1.png',
    voice: '/assets/grading/sfx/_Excellent_ .mp3',
    tone: 'bg-mustard',
  },
  {
    id: 'very-good',
    label: 'Very Good',
    jp: 'よくできました',
    score: 88,
    summary: 'You scored very good.',
    stamp: '/assets/grading/stamp_english2.png',
    voice: '/assets/grading/sfx/_Good_ .mp3',
    tone: 'bg-soft-blue',
  },
  {
    id: 'good',
    label: 'Good',
    jp: 'できました',
    score: 76,
    summary: 'You scored fairly.',
    stamp: '/assets/grading/stamp_english3.png',
    voice: '/assets/grading/sfx/_Well done_ .mp3',
    tone: 'bg-moss text-paper',
  },
  {
    id: 'average',
    label: 'Average',
    jp: 'もうすこし',
    score: 62,
    summary: 'You scored average.',
    stamp: '/assets/grading/stamp_english4.png',
    voice: '/assets/grading/sfx/_Another breath._ .mp3',
    tone: 'bg-blush',
  },
  {
    id: 'poor',
    label: 'Needs Practice',
    jp: 'がんばりましょう',
    score: 38,
    summary: 'You scored poorly.',
    stamp: '/assets/grading/stamp_english5.png',
    voice: "/assets/grading/sfx/_Let's do our best._ .mp3",
    tone: 'bg-correction text-paper',
  },
];

const scoreBreakdown = [
  { label: 'Response fit', value: 92, note: 'Answered station questions naturally' },
  { label: 'Vocabulary', value: 86, note: 'Used N5 travel phrases correctly' },
  { label: 'Grammar', value: 78, note: 'Particle slips: で / に' },
  { label: 'Confidence', value: 90, note: 'Quick replies, few pauses' },
];

const transcriptHighlights = [
  { speaker: 'Sensei', text: 'どこへ行きたいですか。', tag: 'Prompt' },
  { speaker: 'You', text: '渋谷駅へ行きたいです。', tag: '+ fit' },
  { speaker: 'Sensei', text: '二番線です。', tag: 'Listening' },
  { speaker: 'You', text: 'ありがとうございます。', tag: '+ polite' },
];

export default function GradingScorecardPrototypePage() {
  const initialVariant = getInitialVariant();
  const [active, setActive] = useState(initialVariant);
  const [remountKey, setRemountKey] = useState(0);
  const pickerRef = useRef(null);
  const highlightRef = useRef(null);
  const itemRefs = useRef([]);

  const setVariant = useCallback((index) => {
    if (index < 0 || index >= variants.length) return;
    setActive(index);
    setRemountKey((key) => key + 1);

    const url = new URL(window.location.href);
    url.searchParams.set('v', String(index + 1));
    window.history.replaceState(null, '', url);
  }, []);

  const replay = useCallback(() => {
    setRemountKey((key) => key + 1);
  }, []);

  useLayoutEffect(() => {
    const activeItem = itemRefs.current[active];
    if (!activeItem || !highlightRef.current) return;
    highlightRef.current.style.width = `${activeItem.offsetWidth}px`;
    highlightRef.current.style.transform = `translateX(${activeItem.offsetLeft}px)`;
  }, [active]);

  useEffect(() => {
    const moveHighlight = () => {
      const activeItem = itemRefs.current[active];
      if (!activeItem || !highlightRef.current) return;
      highlightRef.current.style.width = `${activeItem.offsetWidth}px`;
      highlightRef.current.style.transform = `translateX(${activeItem.offsetLeft}px)`;
    };

    const onKeyDown = (event) => {
      const target = event.target;
      if (/^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName) || target.isContentEditable) return;
      if (event.metaKey || event.ctrlKey || event.altKey) return;

      const number = Number.parseInt(event.key, 10);
      if (number >= 1 && number <= variants.length) setVariant(number - 1);
      else if (event.key === 'ArrowRight') setVariant((active + 1) % variants.length);
      else if (event.key === 'ArrowLeft') setVariant((active - 1 + variants.length) % variants.length);
      else if (event.key === 'r' || event.key === 'R') replay();
    };

    window.addEventListener('resize', moveHighlight);
    document.addEventListener('keydown', onKeyDown);
    moveHighlight();

    const readyFrame = window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => pickerRef.current?.setAttribute('data-ready', ''));
    });

    return () => {
      window.cancelAnimationFrame(readyFrame);
      window.removeEventListener('resize', moveHighlight);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [active, replay, setVariant]);

  const VariantComponent = [ReportCardVariant, StampRevealVariant, SenseiReviewVariant][active];

  return (
    <>
      <main className="min-h-screen bg-paper text-ink">
        <VariantComponent key={`${active}-${remountKey}`} />
      </main>

      <nav ref={pickerRef} className="proto-picker" aria-label="Prototype variants">
        <span ref={highlightRef} className="proto-picker-highlight" aria-hidden="true"></span>
        {variants.map((variant, index) => (
          <button
            key={variant.name}
            ref={(node) => {
              itemRefs.current[index] = node;
            }}
            type="button"
            className="proto-picker-item"
            data-active={active === index ? '' : undefined}
            aria-current={active === index ? 'true' : undefined}
            onClick={() => setVariant(index)}
          >
            {variant.name}
          </button>
        ))}
        <span className="proto-picker-divider" aria-hidden="true"></span>
        <button type="button" className="proto-picker-item proto-picker-replay" aria-label="Replay animation (R)" onClick={replay}>
          ↻
        </button>
      </nav>

      <style jsx global>{`
        .proto-picker {
          position: fixed;
          bottom: 24px;
          left: 50%;
          transform: translateX(-50%);
          z-index: 2147483647;
          display: flex;
          align-items: center;
          gap: 2px;
          padding: 4px;
          border-radius: 999px;
          background: rgba(10, 10, 10, 0.82);
          -webkit-backdrop-filter: blur(12px) saturate(1.4);
          backdrop-filter: blur(12px) saturate(1.4);
          box-shadow:
            0 0 0 1px rgba(255, 255, 255, 0.08) inset,
            0 8px 24px rgba(0, 0, 0, 0.24),
            0 2px 6px rgba(0, 0, 0, 0.12);
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
          font-size: 13px;
          line-height: 1;
          -webkit-font-smoothing: antialiased;
          user-select: none;
          -webkit-user-select: none;
        }

        .proto-picker-highlight {
          position: absolute;
          top: 4px;
          left: 0;
          height: 28px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.12);
          will-change: transform;
        }

        /* The slide is enabled only after first paint (data-ready), so load doesn't animate. */
        .proto-picker[data-ready] .proto-picker-highlight {
          transition:
            transform 250ms cubic-bezier(0.23, 1, 0.32, 1),
            width 250ms cubic-bezier(0.23, 1, 0.32, 1);
        }

        @media (prefers-reduced-motion: reduce) {
          .proto-picker[data-ready] .proto-picker-highlight { transition: none; }
        }

        .proto-picker-item {
          position: relative; /* sits above the highlight */
          display: flex;
          align-items: center;
          height: 28px;
          padding: 0 12px;
          border: 0;
          border-radius: 999px;
          background: transparent;
          color: rgba(255, 255, 255, 0.55);
          font: inherit;
          cursor: pointer;
          transition: color 150ms ease-out;
        }

        .proto-picker-item:hover {
          color: rgba(255, 255, 255, 0.85);
        }

        .proto-picker-item:active {
          transform: scale(0.97);
        }

        .proto-picker-item:focus-visible {
          outline: 2px solid rgba(255, 255, 255, 0.4);
          outline-offset: 2px;
        }

        .proto-picker-item[data-active] {
          color: #fff;
        }

        .proto-picker-divider {
          width: 1px;
          height: 16px;
          margin: 0 4px;
          background: rgba(255, 255, 255, 0.12);
        }

        .proto-picker-replay {
          padding: 0 10px;
          font-size: 14px;
        }

        .proto-picker[data-position="top"] {
          bottom: auto;
          top: 24px;
        }
      `}</style>
    </>
  );
}

function ReportCardVariant() {
  const [screen, setScreen] = useState('grading');
  const [selectedTierId, setSelectedTierId] = useState('very-good');
  const tier = gradeTiers.find((item) => item.id === selectedTierId) ?? gradeTiers[1];

  if (screen === 'complete') {
    return <CompletionContext variant="report" onViewGrading={() => setScreen('grading')} />;
  }

  return (
    <PrototypeShell eyebrow="Roleplay complete" title="Train Station Report Card" onBack={() => setScreen('complete')}>
      <section className="grid gap-6 xl:grid-cols-[1fr_22rem]">
        <article className="brutal-border notebook-panel relative overflow-hidden bg-white p-6 shadow-shadow sm:p-8">
          <div className="absolute right-4 top-4 rotate-6 rounded-full border-2 border-ink bg-mustard px-4 py-2 font-mono text-xs font-black uppercase tracking-[0.14em] shadow-nav">
            JLPT N5
          </div>
          <div className="grid gap-6 lg:grid-cols-[15rem_1fr] lg:items-start">
            <GradeStamp tier={tier} className="mx-auto max-w-56 animate-stamp-pop lg:mx-0" />
            <div>
              <p className="label-mono text-correction">Final grade</p>
              <div className="mt-3 flex flex-wrap items-end gap-4">
                <h2 className="font-display text-6xl leading-none sm:text-7xl">{tier.score}</h2>
                <div className="pb-2">
                  <p className="font-display text-3xl leading-none">{tier.label}</p>
                  <p className="font-jp text-xl font-black text-aizome">{tier.jp}</p>
                </div>
              </div>
              <p className="mt-5 max-w-2xl text-lg font-bold leading-8">{tier.summary} You handled the ticket-gate scenario with polite answers and strong listening recovery.</p>
              <VoiceButton tier={tier} />
            </div>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {scoreBreakdown.map((item) => (
              <ScoreMeter key={item.label} item={item} />
            ))}
          </div>
        </article>

        <aside className="space-y-4">
          <div className="brutal-border bg-mustard p-5 shadow-shadow">
            <p className="label-mono">Try another score</p>
            <div className="mt-4 grid gap-2">
              {gradeTiers.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelectedTierId(item.id)}
                  className={`brutal-border flex items-center justify-between bg-white px-4 py-3 text-left font-black shadow-nav transition-all duration-150 ease-out hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-none ${
                    item.id === selectedTierId ? 'bg-ink text-paper' : ''
                  }`}
                >
                  <span>{item.label}</span>
                  <span>{item.score}</span>
                </button>
              ))}
            </div>
          </div>

          <NextPracticeCard />
        </aside>
      </section>
    </PrototypeShell>
  );
}

function StampRevealVariant() {
  const [screen, setScreen] = useState('grading');
  const [selectedTierId, setSelectedTierId] = useState('excellent');
  const tier = gradeTiers.find((item) => item.id === selectedTierId) ?? gradeTiers[0];

  if (screen === 'complete') {
    return <CompletionContext variant="stamp" onViewGrading={() => setScreen('grading')} />;
  }

  return (
    <PrototypeShell eyebrow="Stamp ceremony" title="Your KAIwa score is ready" onBack={() => setScreen('complete')}>
      <section className="relative overflow-hidden brutal-border bg-[#fff8df] p-5 shadow-shadow sm:p-8">
        <div className="absolute -left-16 top-10 h-44 w-44 rotate-12 brutal-border bg-soft-blue shadow-nav" aria-hidden="true" />
        <div className="absolute -right-10 bottom-14 h-36 w-36 -rotate-12 brutal-border bg-blush shadow-nav" aria-hidden="true" />

        <div className="relative grid gap-8 xl:grid-cols-[1fr_20rem] xl:items-center">
          <div className="min-h-[34rem] rounded-[2rem] border-[3px] border-ink bg-paper p-6 shadow-[12px_12px_0_#1C1C1C] sm:p-8">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <span className="brutal-border bg-correction px-4 py-2 font-mono text-xs font-black uppercase tracking-[0.16em] text-paper shadow-nav">Result unlocked</span>
              <span className="font-mono text-sm font-black">Roleplay · Train Station</span>
            </div>

            <div className="grid min-h-[28rem] place-items-center text-center">
              <div>
                <GradeStamp tier={tier} className="mx-auto w-[min(25rem,78vw)] animate-stamp-slam" />
                <div className="mx-auto -mt-8 max-w-xl brutal-border bg-white p-5 shadow-shadow sm:-mt-12">
                  <p className="font-display text-6xl leading-none sm:text-8xl">{tier.score}%</p>
                  <p className="mt-2 font-display text-3xl leading-none text-correction sm:text-5xl">{tier.label}</p>
                  <p className="mt-3 font-jp text-2xl font-black text-aizome">{tier.jp}</p>
                  <p className="mt-3 font-bold leading-7">{tier.summary} Tap the voice line to hear the matching result callout.</p>
                  <VoiceButton tier={tier} centered />
                </div>
              </div>
            </div>
          </div>

          <aside className="space-y-4">
            <div className="brutal-border bg-white p-5 shadow-shadow">
              <p className="label-mono text-correction">Stamp shelf</p>
              <div className="mt-4 grid grid-cols-2 gap-3 xl:grid-cols-1">
                {gradeTiers.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSelectedTierId(item.id)}
                    className={`brutal-border flex items-center gap-3 bg-paper p-3 text-left shadow-nav transition-all duration-150 ease-out hover:-translate-y-1 ${
                      item.id === selectedTierId ? 'bg-mustard' : ''
                    }`}
                  >
                    <img src={item.stamp} alt="" className="h-14 w-14 object-contain" draggable="false" />
                    <span className="font-black leading-tight">{item.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <button type="button" className="brutal-border flex w-full items-center justify-between bg-aizome px-5 py-4 font-black text-paper shadow-shadow transition-all duration-150 ease-out hover:translate-x-1 hover:translate-y-1 hover:shadow-nav">
              Continue practice <IoChevronForwardSharp aria-hidden="true" />
            </button>
          </aside>
        </div>
      </section>
    </PrototypeShell>
  );
}

function SenseiReviewVariant() {
  const [screen, setScreen] = useState('grading');
  const [selectedTierId, setSelectedTierId] = useState('good');
  const tier = gradeTiers.find((item) => item.id === selectedTierId) ?? gradeTiers[2];

  if (screen === 'complete') {
    return <CompletionContext variant="sensei" onViewGrading={() => setScreen('grading')} />;
  }

  return (
    <PrototypeShell eyebrow="Sensei review" title="Conversation debrief" onBack={() => setScreen('complete')}>
      <section className="grid gap-6 xl:grid-cols-[22rem_1fr]">
        <aside className="brutal-border sticky top-6 self-start bg-aizome p-5 text-paper shadow-shadow">
          <div className="brutal-border bg-paper p-4 text-ink shadow-nav">
            <GradeStamp tier={tier} className="mx-auto h-48 w-48 animate-stamp-pop object-contain" />
            <p className="mt-2 text-center font-display text-5xl leading-none">{tier.score}</p>
            <p className="text-center font-display text-3xl leading-none text-correction">{tier.label}</p>
            <p className="mt-2 text-center font-jp text-lg font-black text-aizome">{tier.jp}</p>
          </div>
          <VoiceButton tier={tier} dark centered />
          <div className="mt-5 grid gap-2">
            {gradeTiers.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setSelectedTierId(item.id)}
                className={`brutal-border flex items-center justify-between px-3 py-2 font-mono text-xs font-black uppercase tracking-[0.12em] shadow-nav transition-all duration-150 ease-out hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-none ${
                  item.id === selectedTierId ? 'bg-mustard text-ink' : 'bg-paper text-ink'
                }`}
              >
                <span>{item.label}</span>
                <span>{item.score}</span>
              </button>
            ))}
          </div>
        </aside>

        <div className="space-y-5">
          <article className="brutal-border bg-white p-6 shadow-shadow">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="label-mono text-correction">Teacher notes</p>
                <h2 className="mt-2 font-display text-4xl leading-none">You stayed understandable.</h2>
              </div>
              <span className="brutal-border bg-mustard px-4 py-2 font-mono text-xs font-black uppercase tracking-[0.14em] shadow-nav">4 min review</span>
            </div>
            <p className="mt-4 max-w-3xl text-lg font-bold leading-8">
              Your strongest move was asking for the platform number politely. Next, tighten particles and practice one recovery phrase when you miss a word.
            </p>
          </article>

          <section className="grid gap-5 lg:grid-cols-2">
            <div className="brutal-border bg-paper p-5 shadow-shadow">
              <p className="label-mono text-aizome">Transcript highlights</p>
              <div className="mt-4 space-y-3">
                {transcriptHighlights.map((line) => (
                  <div key={`${line.speaker}-${line.text}`} className="brutal-border bg-white p-4 shadow-nav">
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <span className="font-mono text-xs font-black uppercase tracking-[0.14em] text-correction">{line.speaker}</span>
                      <span className="rounded-full bg-mustard px-3 py-1 font-mono text-[0.65rem] font-black uppercase tracking-[0.12em]">{line.tag}</span>
                    </div>
                    <p className="font-jp text-xl font-black">{line.text}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="brutal-border bg-white p-5 shadow-shadow">
              <p className="label-mono text-moss">Next drills</p>
              <div className="mt-4 space-y-3">
                {[
                  ['Particle tune-up', 'Practice に vs で with station phrases.'],
                  ['Shadow reply', 'Repeat “もう一度お願いします” until it is automatic.'],
                  ['Speed round', 'Answer 5 station prompts under 4 seconds.'],
                ].map(([title, body], index) => (
                  <div key={title} className="flex gap-3">
                    <span className="grid h-9 w-9 shrink-0 place-items-center brutal-border bg-mustard font-display shadow-nav">{index + 1}</span>
                    <div>
                      <p className="font-black">{title}</p>
                      <p className="text-sm font-bold leading-6 text-ink/70">{body}</p>
                    </div>
                  </div>
                ))}
              </div>
              <button type="button" className="mt-5 brutal-border flex w-full items-center justify-center gap-2 bg-correction px-5 py-4 font-black text-paper shadow-shadow transition-all duration-150 ease-out hover:translate-x-1 hover:translate-y-1 hover:shadow-nav">
                Start focused drill <IoChevronForwardSharp aria-hidden="true" />
              </button>
            </div>
          </section>
        </div>
      </section>
    </PrototypeShell>
  );
}

function CompletionContext({ onViewGrading, variant }) {
  const isStudy = variant === 'report';

  return (
    <div className="min-h-screen pb-28">
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col px-4 py-6 sm:px-6 lg:px-8">
        <header className="flex items-center justify-between gap-4">
          <div>
            <p className="label-mono text-correction">{isStudy ? 'Study board' : 'Roleplay'} complete</p>
            <h1 className="mt-2 font-display text-4xl leading-none sm:text-6xl">{isStudy ? 'N5 review finished' : 'Train Station cleared'}</h1>
          </div>
          <span className="brutal-border bg-white px-4 py-3 font-mono text-xs font-black uppercase tracking-[0.14em] shadow-nav">Session saved locally</span>
        </header>

        <section className="mt-8 grid flex-1 gap-6 lg:grid-cols-[1fr_22rem] lg:items-stretch">
          <article className="brutal-border notebook-panel relative overflow-hidden bg-white p-6 shadow-shadow sm:p-8">
            <img
              src="/assets/backgrounds/bg_eki_homedoor_train_open.jpg"
              alt=""
              className="absolute inset-0 h-full w-full object-cover opacity-20"
              draggable="false"
            />
            <div className="absolute inset-0 bg-paper/60" aria-hidden="true" />
            <div className="relative flex h-full min-h-[28rem] flex-col justify-between">
              <div>
                <span className="brutal-border inline-flex bg-mustard px-4 py-2 font-mono text-xs font-black uppercase tracking-[0.14em] shadow-nav">8 min practice</span>
                <h2 className="mt-6 max-w-3xl font-display text-5xl leading-none sm:text-7xl">Nice work. Your result card is ready.</h2>
                <p className="mt-5 max-w-2xl text-xl font-bold leading-9">Open grading to see your stamp, score breakdown, teacher notes, and a voice line that matches your score tier.</p>
              </div>
              <div className="mt-8 grid gap-3 sm:grid-cols-3">
                {['14 replies', '4 hints used', '2 new phrases'].map((stat) => (
                  <div key={stat} className="brutal-border bg-white p-4 font-black shadow-nav">{stat}</div>
                ))}
              </div>
            </div>
          </article>

          <aside className="brutal-border bg-aizome p-5 text-paper shadow-shadow">
            <IoCheckmarkCircleSharp className="text-6xl text-mustard" aria-hidden="true" />
            <h2 className="mt-4 font-display text-4xl leading-none">Session complete</h2>
            <p className="mt-3 font-bold leading-7 text-paper/80">This prototype includes the bottom page button you asked for. In production it would route to the grading screen after each study board task or roleplay.</p>
          </aside>
        </section>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t-2 border-ink bg-paper/95 px-4 py-4 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-mono text-xs font-black uppercase tracking-[0.14em] text-correction">Ready for feedback</p>
            <p className="font-black">See how well you did and what to practice next.</p>
          </div>
          <button type="button" onClick={onViewGrading} className="brutal-border inline-flex items-center justify-center gap-2 bg-correction px-6 py-4 font-black text-paper shadow-shadow transition-all duration-150 ease-out hover:translate-x-1 hover:translate-y-1 hover:shadow-nav">
            View grading <IoChevronForwardSharp aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
}

function PrototypeShell({ eyebrow, title, children, onBack }) {
  return (
    <div className="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="label-mono text-correction">{eyebrow}</p>
            <h1 className="mt-2 font-display text-4xl leading-none sm:text-6xl">{title}</h1>
          </div>
          <div className="flex flex-wrap gap-3">
            <button type="button" onClick={onBack} className="brutal-border inline-flex items-center gap-2 bg-white px-4 py-3 font-black shadow-nav transition-all duration-150 ease-out hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-none">
              <IoArrowBackSharp aria-hidden="true" /> Roleplay page
            </button>
            <button type="button" className="brutal-border inline-flex items-center gap-2 bg-mustard px-4 py-3 font-black shadow-nav transition-all duration-150 ease-out hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-none">
              <IoHomeSharp aria-hidden="true" /> Home
            </button>
          </div>
        </header>
        {children}
      </div>
    </div>
  );
}

function GradeStamp({ tier, className = '' }) {
  return <img src={tier.stamp} alt={`${tier.label} stamp`} className={`object-contain ${className}`} draggable="false" />;
}

function VoiceButton({ tier, centered = false, dark = false }) {
  const audioRef = useRef(null);
  const [status, setStatus] = useState('idle');

  const playVoice = () => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = 0;
    audioRef.current.play().then(() => setStatus('playing')).catch(() => setStatus('blocked'));
  };

  return (
    <div className={`mt-5 ${centered ? 'flex flex-col items-center' : ''}`}>
      <button
        type="button"
        onClick={playVoice}
        className={`brutal-border inline-flex items-center gap-2 px-5 py-3 font-black shadow-shadow transition-all duration-150 ease-out hover:translate-x-1 hover:translate-y-1 hover:shadow-nav ${
          dark ? 'bg-paper text-ink' : 'bg-aizome text-paper'
        }`}
      >
        <IoVolumeHighSharp aria-hidden="true" /> Play “{tier.label}” voice
      </button>
      <audio ref={audioRef} src={tier.voice} onEnded={() => setStatus('idle')} preload="metadata" />
      <p className={`mt-2 text-sm font-bold ${dark ? 'text-paper/80' : 'text-ink/60'}`}>
        {status === 'playing' ? 'Playing matching score voice…' : status === 'blocked' ? 'Browser blocked audio; tap again.' : 'Voice line changes with score tier.'}
      </p>
    </div>
  );
}

function ScoreMeter({ item }) {
  return (
    <div className="brutal-border bg-white p-4 shadow-nav">
      <div className="flex items-center justify-between gap-3">
        <p className="font-black">{item.label}</p>
        <span className="font-mono text-sm font-black">{item.value}%</span>
      </div>
      <div className="mt-3 h-4 brutal-border overflow-hidden bg-paper">
        <div className="h-full bg-correction" style={{ width: `${item.value}%` }} />
      </div>
      <p className="mt-3 text-sm font-bold leading-6 text-ink/65">{item.note}</p>
    </div>
  );
}

function NextPracticeCard() {
  return (
    <div className="brutal-border bg-white p-5 shadow-shadow">
      <p className="label-mono text-moss">Recommended next</p>
      <div className="mt-4 space-y-3">
        <div className="flex items-center gap-3">
          <IoSchoolSharp className="text-3xl text-aizome" aria-hidden="true" />
          <div>
            <p className="font-black">Particle mini drill</p>
            <p className="text-sm font-bold text-ink/65">に / で station practice</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <IoRibbonSharp className="text-3xl text-correction" aria-hidden="true" />
          <div>
            <p className="font-black">Unlock next roleplay</p>
            <p className="text-sm font-bold text-ink/65">Convenience Store N5</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <IoSparklesSharp className="text-3xl text-moss" aria-hidden="true" />
          <div>
            <p className="font-black">Save to memory</p>
            <p className="text-sm font-bold text-ink/65">Local-only score history</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function getInitialVariant() {
  if (typeof window === 'undefined') return 0;
  const value = Number.parseInt(new URLSearchParams(window.location.search).get('v') ?? '1', 10);
  if (Number.isNaN(value)) return 0;
  return Math.min(Math.max(value - 1, 0), variants.length - 1);
}
