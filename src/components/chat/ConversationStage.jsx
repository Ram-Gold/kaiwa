'use client';

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { IoBatteryFullSharp, IoBulbSharp, IoCellularSharp, IoCloseSharp, IoMicSharp, IoSendSharp, IoWifiSharp, IoVolumeHighSharp, IoLanguageSharp, IoGlobeOutline } from 'react-icons/io5';

import { cn } from '../../lib/utils.js';
import JapaneseText, { DictionaryPopover } from './JapaneseText.jsx';
import { speakJapanese } from '../../lib/speech.js';
import { translateJapaneseToEnglish } from '../../lib/translation.js';
import { toRomajiText } from '../../lib/japaneseText.js';

const FALLBACK_BRIEFING = {
  title: 'Kaiwa Practice',
  jpTitle: '会話練習',
  kind: 'roleplay',
  level: 'N5',
  accent: 'aizome',
  prep: ['もう一度お願いします', '少し考えてもいいですか', 'ありがとうございます'],
};

const ACCENT_THEME = {
  correction: {
    wash: 'from-correction/35 via-paper to-blush/40',
    phone: 'bg-[#4b3634]',
    glow: 'bg-correction',
    card: 'bg-correction text-paper',
  },
  mustard: {
    wash: 'from-mustard/45 via-paper to-soft-blue/35',
    phone: 'bg-[#3f443f]',
    glow: 'bg-mustard',
    card: 'bg-mustard text-ink',
  },
  moss: {
    wash: 'from-moss/35 via-paper to-soft-blue/35',
    phone: 'bg-[#34443b]',
    glow: 'bg-moss',
    card: 'bg-moss text-paper',
  },
  aizome: {
    wash: 'from-aizome/35 via-paper to-mustard/25',
    phone: 'bg-[#2f3d47]',
    glow: 'bg-aizome',
    card: 'bg-aizome text-paper',
  },
};

const EXTRA_CARDS = [
  '聞き取れませんでした',
  '英語でヒントをください',
  '自然な言い方は？',
];

const PHRASE_PRONUNCIATION_TOKENS = {
  '___ に行きたいです': [
    { kana: 'に', romaji: 'ni' },
    { kana: 'い', romaji: 'i' },
    { kana: 'き', romaji: 'ki' },
    { kana: 'た', romaji: 'ta' },
    { kana: 'い', romaji: 'i' },
    { kana: 'で', romaji: 'de' },
    { kana: 'す', romaji: 'su' },
  ],
  何番線ですか: [
    { kana: 'なん', romaji: 'nan' },
    { kana: 'ば', romaji: 'ba' },
    { kana: 'ん', romaji: 'n' },
    { kana: 'せ', romaji: 'se' },
    { kana: 'ん', romaji: 'n' },
    { kana: 'で', romaji: 'de' },
    { kana: 'す', romaji: 'su' },
    { kana: 'か', romaji: 'ka' },
  ],
  ありがとうございます: [
    { kana: 'あ', romaji: 'a' },
    { kana: 'り', romaji: 'ri' },
    { kana: 'が', romaji: 'ga' },
    { kana: 'と', romaji: 'to' },
    { kana: 'う', romaji: 'u' },
    { kana: 'ご', romaji: 'go' },
    { kana: 'ざ', romaji: 'za' },
    { kana: 'い', romaji: 'i' },
    { kana: 'ま', romaji: 'ma' },
    { kana: 'す', romaji: 'su' },
  ],
  聞き取れませんでした: [
    { kana: 'き', romaji: 'ki' },
    { kana: 'き', romaji: 'ki' },
    { kana: 'と', romaji: 'to' },
    { kana: 'れ', romaji: 're' },
    { kana: 'ま', romaji: 'ma' },
    { kana: 'せ', romaji: 'se' },
    { kana: 'ん', romaji: 'n' },
    { kana: 'で', romaji: 'de' },
    { kana: 'し', romaji: 'shi' },
    { kana: 'た', romaji: 'ta' },
  ],
  英語でヒントをください: [
    { kana: 'え', romaji: 'e' },
    { kana: 'い', romaji: 'i' },
    { kana: 'ご', romaji: 'go' },
    { kana: 'で', romaji: 'de' },
    { kana: 'ひ', romaji: 'hi' },
    { kana: 'ん', romaji: 'n' },
    { kana: 'と', romaji: 'to' },
    { kana: 'を', romaji: 'o' },
    { kana: 'く', romaji: 'ku' },
    { kana: 'だ', romaji: 'da' },
    { kana: 'さ', romaji: 'sa' },
    { kana: 'い', romaji: 'i' },
  ],
  '自然な言い方は？': [
    { kana: 'し', romaji: 'shi' },
    { kana: 'ぜ', romaji: 'ze' },
    { kana: 'ん', romaji: 'n' },
    { kana: 'な', romaji: 'na' },
    { kana: 'い', romaji: 'i' },
    { kana: 'い', romaji: 'i' },
    { kana: 'か', romaji: 'ka' },
    { kana: 'た', romaji: 'ta' },
    { kana: 'は', romaji: 'wa' },
  ],
};

const SPOKEN_READING_NORMALIZATIONS = [
  ['行きたい', 'いきたい'],
  ['何番線', 'なんばんせん'],
  ['自然な言い方', 'しぜんないいかた'],
  ['聞き取れませんでした', 'ききとれませんでした'],
  ['英語', 'えいご'],
];

const KANA_ROMAJI = {
  あ: 'a', い: 'i', う: 'u', え: 'e', お: 'o',
  か: 'ka', き: 'ki', く: 'ku', け: 'ke', こ: 'ko',
  が: 'ga', ぎ: 'gi', ぐ: 'gu', げ: 'ge', ご: 'go',
  さ: 'sa', し: 'shi', す: 'su', せ: 'se', そ: 'so',
  ざ: 'za', じ: 'ji', ず: 'zu', ぜ: 'ze', ぞ: 'zo',
  た: 'ta', ち: 'chi', つ: 'tsu', て: 'te', と: 'to',
  だ: 'da', ぢ: 'ji', づ: 'zu', で: 'de', ど: 'do',
  な: 'na', に: 'ni', ぬ: 'nu', ね: 'ne', の: 'no',
  は: 'ha', ひ: 'hi', ふ: 'fu', へ: 'he', ほ: 'ho',
  ば: 'ba', び: 'bi', ぶ: 'bu', べ: 'be', ぼ: 'bo',
  ぱ: 'pa', ぴ: 'pi', ぷ: 'pu', ぺ: 'pe', ぽ: 'po',
  ま: 'ma', み: 'mi', む: 'mu', め: 'me', も: 'mo',
  や: 'ya', ゆ: 'yu', よ: 'yo',
  ら: 'ra', り: 'ri', る: 'ru', れ: 're', ろ: 'ro',
  わ: 'wa', を: 'o', ん: 'n',
  ー: '-',
};

export default function ConversationStage({ briefing = FALLBACK_BRIEFING }) {
  const scenario = briefing ?? FALLBACK_BRIEFING;
  const theme = ACCENT_THEME[scenario.accent] ?? ACCENT_THEME.aizome;
  const initialCards = useMemo(() => buildCards(scenario), [scenario]);
  const [availableCards, setAvailableCards] = useState(initialCards);
  const [message, setMessage] = useState('');
  const [showCards, setShowCards] = useState(true);
  const [showMessages, setShowMessages] = useState(true);
  const [readingMode, setReadingMode] = useState('Furigana');
  const [selectedCardId, setSelectedCardId] = useState(null);
  const [recitationCard, setRecitationCard] = useState(null);
  const [recitationOverlayVisible, setRecitationOverlayVisible] = useState(false);
  const [returnTransition, setReturnTransition] = useState(null);
  const [recitationStatus, setRecitationStatus] = useState('idle');
  const [spokenTranscript, setSpokenTranscript] = useState('');
  const [recitationOrigin, setRecitationOrigin] = useState(null);
  const [expToast, setExpToast] = useState(null);
  const recognitionRef = useRef(null);
  const [showPhoneChrome, setShowPhoneChrome] = useState(true);
  const [notchStyle, setNotchStyle] = useState('dynamic-island');
  const [isTipOpen, setIsTipOpen] = useState(true);
  const [activeDictionaryEntry, setActiveDictionaryEntry] = useState(null);

  useEffect(() => {
    function handleOptionChange(event) {
      const { option, value } = event.detail ?? {};

      if (option === 'showCards') setShowCards(Boolean(value));
      if (option === 'showMessages') setShowMessages(Boolean(value));
      if (option === 'showPhoneChrome') setShowPhoneChrome(Boolean(value));
      if (option === 'readingMode') setReadingMode(value);
      if (option === 'notchStyle') setNotchStyle(value);
    }

    function handleShowDictionary(event) {
      const incoming = event.detail;
      setActiveDictionaryEntry((current) => (current?.term === incoming?.term ? null : incoming));
    }

    window.addEventListener('kaiwa:conversation-option-change', handleOptionChange);
    window.addEventListener('kaiwa:show-dictionary', handleShowDictionary);
    return () => {
      window.removeEventListener('kaiwa:conversation-option-change', handleOptionChange);
      window.removeEventListener('kaiwa:show-dictionary', handleShowDictionary);
    };
  }, []);

  useEffect(() => {
    return () => {
      recognitionRef.current?.stop?.();
    };
  }, []);

  function useCard(card, sourceElement) {
    if (selectedCardId) return;

    setRecitationOrigin(sourceElement?.getBoundingClientRect?.() ?? null);
    setSelectedCardId(card.id);
    setAvailableCards((currentCards) => currentCards.filter((currentCard) => currentCard.id !== card.id));
    setRecitationCard(card);
    setRecitationOverlayVisible(true);
    setReturnTransition(null);
    setSpokenTranscript('');
    setRecitationStatus('starting');
    startRecitation(card);
  }

  function startRecitation(card) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setRecitationStatus('unsupported');
      return;
    }

    recognitionRef.current?.stop?.();
    const recognition = new SpeechRecognition();
    recognition.lang = 'ja-JP';
    recognition.interimResults = true;
    recognition.continuous = true;

    recognition.onstart = () => setRecitationStatus('listening');
    recognition.onresult = (event) => {
      const transcript = Array.from(event.results ?? [])
        .map((result) => result?.[0]?.transcript ?? '')
        .join(' ');

      setSpokenTranscript(transcript);

      if (isCompleteRecitation(card, transcript)) {
        completeRecitation(card, { awardedExp: true });
      } else {
        setRecitationStatus('listening');
      }
    };
    recognition.onerror = () => setRecitationStatus('try-again');
    recognition.onend = () => {
      setRecitationStatus((current) => (current === 'starting' || current === 'listening' ? 'try-again' : current));
    };

    recognitionRef.current = recognition;
    recognition.start();
  }

  function completeRecitation(card, { awardedExp = false } = {}) {
    recognitionRef.current?.stop?.();
    recognitionRef.current = null;
    setMessage(card.phrase);
    setSelectedCardId(null);
    setRecitationOverlayVisible(false);
    window.setTimeout(() => setRecitationCard(null), 220);
    setRecitationStatus('idle');
    setSpokenTranscript('');
    setRecitationOrigin(null);

    if (awardedExp) {
      setExpToast('+10 EXP');
      window.setTimeout(() => setExpToast(null), 1800);
    }
  }

  function cancelRecitation(card) {
    if (returnTransition) return;

    recognitionRef.current?.stop?.();
    recognitionRef.current = null;
    setRecitationOverlayVisible(false);
    setAvailableCards((currentCards) => restoreCardInInitialOrder(currentCards, card, initialCards));
    setReturnTransition({ cardId: card.id, phase: 'measuring', destinationRect: null });
    setRecitationStatus('idle');
    setSpokenTranscript('');
  }

  function updateMeasuredReturn(cardId, patch) {
    setReturnTransition((current) => {
      if (!current || current.cardId !== cardId || current.phase !== 'measuring') {
        return current;
      }

      const next = { ...current, ...patch };
      return next.originRect && next.destination ? { ...next, phase: 'returning' } : next;
    });
  }

  function handleReturnOriginReady(cardId, originRect) {
    updateMeasuredReturn(cardId, { originRect });
  }

  function handleReturnDestinationReady(cardId, destination) {
    updateMeasuredReturn(cardId, { destination });
  }

  function completeReturnHandoff() {
    setReturnTransition((current) => (current ? { ...current, phase: 'handoff' } : current));
    setRecitationOverlayVisible(false);

    window.setTimeout(() => {
      setSelectedCardId(null);
      setRecitationCard(null);
      setReturnTransition(null);
      setRecitationOrigin(null);
    }, 220);
  }

  return (
    <div className="relative min-h-screen overflow-hidden">
      <ScenarioBackdrop scenario={scenario} theme={theme} />

      <div className="relative mx-auto min-h-screen max-w-6xl px-4 py-3 sm:px-6 lg:py-4">
        <section
          className={cn(
            'relative mx-auto mt-12 w-full max-w-[24.5rem] xl:mt-3 xl:-translate-y-2',
            returnTransition?.cardId ? 'z-50' : 'z-0',
          )}
          aria-label={`${scenario.title} conversation`}
        >
          {activeDictionaryEntry && (
            <div className="absolute right-full mr-6 top-8 z-50 hidden md:block">
              <DictionaryPopover entry={activeDictionaryEntry} onClose={() => setActiveDictionaryEntry(null)} />
            </div>
          )}

          {/* Mobile Overlay version */}
          {activeDictionaryEntry && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 md:hidden">
              <DictionaryPopover entry={activeDictionaryEntry} onClose={() => setActiveDictionaryEntry(null)} />
            </div>
          )}

          <TipButton isOpen={isTipOpen} setIsOpen={setIsTipOpen} theme={theme} />
          <div className="relative z-10">
            <PhoneFrame scenario={scenario} theme={theme} showMessages={showMessages} showPhoneChrome={showPhoneChrome} notchStyle={notchStyle} readingMode={readingMode} message={message} setMessage={setMessage} isTipOpen={isTipOpen} setIsTipOpen={setIsTipOpen} />
            {expToast ? <ExpToast text={expToast} /> : null}
          </div>
          {showCards ? (
            <CardHand
              cards={availableCards}
              onUseCard={useCard}
              selectedCardId={selectedCardId}
              returnTransition={returnTransition}
              onReturnDestinationReady={handleReturnDestinationReady}
              onReturnFlightComplete={completeReturnHandoff}
              theme={theme}
            />
          ) : null}
        </section>
      </div>

      {recitationCard ? (
        <button
          type="button"
          data-testid="recitation-backdrop"
          aria-label="Cancel recitation and return card"
          onClick={() => cancelRecitation(recitationCard)}
          className={cn(
            'fixed inset-0 z-30 bg-black/70 backdrop-blur-[2px] transition-opacity duration-200 ease-out',
            recitationOverlayVisible ? 'opacity-100' : 'pointer-events-none opacity-0'
          )}
        />
      ) : null}
      {recitationCard ? (
        <RecitationCardOverlay
          card={recitationCard}
          flightOrigin={recitationOrigin}
          onSkip={() => completeRecitation(recitationCard)}
          spokenTranscript={spokenTranscript}
          status={recitationStatus}
          theme={theme}
          isVisible={recitationOverlayVisible}
          returnTransition={returnTransition}
          onReturnOriginReady={handleReturnOriginReady}
        />
      ) : null}

      <div className="fixed bottom-6 left-6 z-20">
        <Link href="/grading" className="brutal-border bg-mustard text-ink px-5 py-3 font-mono text-sm font-black uppercase tracking-[0.1em] shadow-shadow transition-transform hover:-translate-y-1 active:scale-95 flex items-center gap-2">
          Finish & Grade
        </Link>
      </div>
    </div>
  );
}

function ScenarioBackdrop({ scenario, theme }) {
  return (
    <>
      {scenario.image ? (
        <img src={scenario.image} alt="" draggable="false" className="absolute inset-0 h-full w-full scale-105 object-cover opacity-30 blur-[1px]" />
      ) : null}
      <div className={cn('absolute inset-0 bg-gradient-to-br', theme.wash)} aria-hidden="true" />
      <div className="absolute inset-0 bg-paper/45" aria-hidden="true" />
    </>
  );
}

function PhoneFrame({ scenario, theme, showMessages, showPhoneChrome, notchStyle, readingMode, message, setMessage, isTipOpen, setIsTipOpen }) {
  return (
    <div className="relative mx-auto max-w-[24.5rem] text-ink">
      <div className="pointer-events-none absolute bottom-[-1.75rem] left-[12%] right-[12%] h-4 rounded-full bg-ink/25 blur-xl" aria-hidden="true" />
      <PhoneSideButtons />
      <div className="relative rounded-[3rem] border border-[#3d3140] bg-gradient-to-br from-[#050505] via-[#242024] to-[#120f12] p-3 shadow-[inset_0_0_0_2px_#050505,inset_0_0_0_5px_#262226,inset_0_0_0_7px_rgba(255,255,255,0.08),0_0_0_1px_#1C1C1C,0_1.1rem_2.6rem_rgba(28,28,28,0.28)]">
        <div className="min-h-[42rem] overflow-hidden rounded-[2.25rem] bg-[#fffefa] shadow-[inset_0_0_0_2px_rgba(255,255,255,0.9),inset_0_0_0_4px_rgba(0,0,0,0.08)]">
          {showPhoneChrome ? <PhoneStatusBar notchStyle={notchStyle} /> : null}
          {isTipOpen ? <TipNotification setIsTipOpen={setIsTipOpen} /> : null}
          <div className="relative mx-3 min-h-[31.75rem] overflow-hidden bg-[#fffefa] p-3">
            {showMessages ? <MessageThread readingMode={readingMode} scenario={scenario} theme={theme} /> : <HiddenMessages />}
          </div>

          <div className="px-3 pb-4">
            <Composer message={message} setMessage={setMessage} />
          </div>
        </div>
      </div>
    </div>
  );
}

function TipButton({ isOpen, setIsOpen, theme }) {
  return (
    <button
      type="button"
      aria-label="Open conversation tip"
      aria-expanded={isOpen}
      onClick={() => setIsOpen((current) => !current)}
      className={cn(
        'brutal-border absolute -right-20 top-6 z-30 inline-flex items-center gap-2 rounded-full px-3 py-2 font-mono text-xs font-black uppercase tracking-[0.1em] shadow-nav transition-transform hover:-translate-y-0.5 active:scale-95 max-sm:-right-3 max-sm:top-14 max-sm:px-2',
        theme.glow,
      )}
    >
      <IoBulbSharp />
      <span>Tip</span>
    </button>
  );
}

function TipNotification({ setIsTipOpen }) {
  return (
    <div className="animate-panel-in absolute left-6 right-6 top-14 z-20 grid grid-cols-[auto_1fr_auto] items-start gap-3 rounded-[1.15rem] border-2 border-border bg-white/95 p-3 text-ink shadow-nav backdrop-blur" role="status">
      <span className="brutal-border grid h-9 w-9 place-items-center rounded-full bg-mustard shadow-nav" aria-hidden="true">
        <IoBulbSharp />
      </span>
      <div>
        <p className="font-mono text-[10px] font-black uppercase tracking-[0.12em]">Practice tip</p>
        <p className="mt-1 text-sm font-black leading-5">Hover the hand, pick one card, then say it slowly.</p>
      </div>
      <button type="button" aria-label="Dismiss tip" onClick={() => setIsTipOpen(false)} className="grid h-7 w-7 place-items-center rounded-full border-2 border-border bg-white text-sm shadow-nav">
        <IoCloseSharp />
      </button>
    </div>
  );
}

function PhoneSideButtons() {
  const buttonClass = 'absolute z-0 w-1 rounded-full bg-gradient-to-r from-[#050505] via-[#383038] to-[#080808] shadow-[inset_1px_0_0_rgba(255,255,255,0.16),1px_1px_0_rgba(0,0,0,0.55)]';

  return (
    <>
      <span className={cn(buttonClass, '-left-1 top-28 h-7')} aria-hidden="true" />
      <span className={cn(buttonClass, '-left-1 top-40 h-12')} aria-hidden="true" />
      <span className={cn(buttonClass, '-left-1 top-56 h-12')} aria-hidden="true" />
      <span className={cn(buttonClass, '-right-1 top-48 h-16')} aria-hidden="true" />
    </>
  );
}

function PhoneStatusBar({ notchStyle }) {
  return (
    <div aria-label="Phone status bar" className="relative z-10 flex h-12 items-center justify-between px-6 pt-2 font-mono text-[11px] font-black text-ink">
      <span>9:41</span>
      <PhoneNotch notchStyle={notchStyle} />
      <div className="flex items-center gap-1.5 text-lg">
        <IoCellularSharp aria-label="Cellular signal" />
        <IoWifiSharp aria-label="Wifi" />
        <IoBatteryFullSharp aria-label="Battery" />
      </div>
    </div>
  );
}

function PhoneNotch({ notchStyle }) {
  const lens = <span className="absolute right-2 top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-[#12344a] ring-1 ring-[#1d5d85]" aria-hidden="true" />;

  if (notchStyle === 'samsung') {
    return <span aria-label="Samsung hole punch notch" className="absolute left-1/2 top-3 h-5 w-5 -translate-x-1/2 rounded-full bg-[#0a0a0a] shadow-[inset_0_-1px_0_rgba(255,255,255,0.16),0_1px_2px_rgba(0,0,0,0.35)]">{lens}</span>;
  }

  if (notchStyle === 'teardrop') {
    return <span aria-label="Tear drop notch" className="absolute left-1/2 top-0 h-8 w-7 -translate-x-1/2 rounded-b-full bg-[#0a0a0a] shadow-[inset_0_-1px_0_rgba(255,255,255,0.16),0_1px_2px_rgba(0,0,0,0.35)]">{lens}</span>;
  }

  return <span aria-label="Dynamic Island notch" className="absolute left-1/2 top-3 h-5 w-[4.6rem] -translate-x-1/2 rounded-full bg-[#0a0a0a] shadow-[inset_0_-1px_0_rgba(255,255,255,0.16),0_1px_2px_rgba(0,0,0,0.35)]">{lens}</span>;
}

function MessageThread({ readingMode, scenario, theme }) {
  return (
    <div className="flex min-h-[30.5rem] flex-col justify-end gap-4">
      <span className="sr-only">Reading mode: {readingMode}</span>
      <MessageBubble
        from="ai"
        theme={theme}
        text={`こんにちは。${scenario.jpTitle} の練習を始めましょう。`}
        initialSubtext={`Konnichiwa. Let’s start this scene.`}
      />

      <MessageBubble from="user" theme={theme} text="お願いします。" />

      <MessageBubble from="ai" theme={theme} thinking />
    </div>
  );
}

function MessageBubble({ text = '', initialSubtext, from, theme, thinking = false }) {
  const isUser = from === 'user';
  const [showRomaji, setShowRomaji] = useState(false);
  const [showTranslation, setShowTranslation] = useState(false);
  const [translationText, setTranslationText] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const romajiText = useMemo(() => (text ? toRomajiText(text) : ''), [text]);

  async function handleTranslate() {
    if (showTranslation) {
      setShowTranslation(false);
      return;
    }
    if (translationText) {
      setShowTranslation(true);
      return;
    }
    setIsTranslating(true);
    const res = await translateJapaneseToEnglish(text);
    setTranslationText(res);
    setShowTranslation(true);
    setIsTranslating(false);
  }

  function handleSpeak() {
    const active = speakJapanese(text);
    setIsPlaying(active);
  }

  return (
    <div className={cn('flex items-end gap-2', isUser ? 'justify-end' : 'justify-start')}>
      {!isUser ? (
        <span className="brutal-border grid h-9 w-9 shrink-0 place-items-center rounded-full bg-paper font-display text-xs shadow-nav" aria-hidden="true">
          会
        </span>
      ) : null}
      <div
        className={cn(
          'max-w-[85%] brutal-border px-4 py-3 shadow-nav',
          isUser ? cn(theme.card, 'rounded-br-none') : 'rounded-bl-none bg-white text-ink',
          thinking && 'min-w-20 text-center',
        )}
      >
        {thinking ? (
          <span className="typing-dots font-display text-2xl" aria-label="KAIwa is thinking">
            <span>·</span><span>·</span><span>·</span>
          </span>
        ) : (
          <>
            {isUser ? (
              <span className="block font-jp text-base font-black">{text}</span>
            ) : (
              <div>
                <span className="block font-jp text-base font-black">
                  <JapaneseText text={text} />
                </span>

                {showRomaji && (
                  <div className="animate-panel-in mt-2 brutal-border bg-mustard/30 p-2 text-xs font-mono font-black italic">
                    {romajiText}
                  </div>
                )}

                {showTranslation && (
                  <div className="animate-panel-in mt-2 brutal-border bg-paper p-2 text-xs font-bold leading-5">
                    <span className="label-mono block text-[9px] text-shu">English</span>
                    {translationText}
                  </div>
                )}

                {initialSubtext && !showRomaji && !showTranslation && (
                  <span className="mt-1 block text-xs font-bold text-ink/65">{initialSubtext}</span>
                )}

                {/* 3 Circular Action Icons */}
                <div className="mt-3 flex items-center gap-2 border-t-2 border-border/40 pt-2">
                  {/* 1. Speaker Icon */}
                  <button
                    type="button"
                    aria-label="Speak Japanese audio"
                    title="Speak Japanese (Web Speech API)"
                    onClick={handleSpeak}
                    className={cn(
                      'brutal-border grid h-7 w-7 place-items-center rounded-full bg-paper transition-all hover:bg-mustard active:scale-95',
                      isPlaying && 'bg-mustard'
                    )}
                  >
                    <IoVolumeHighSharp className="text-xs text-ink" />
                  </button>

                  {/* 2. Romaji Icon */}
                  <button
                    type="button"
                    aria-label="Toggle Romaji reading"
                    title="Toggle Romaji"
                    onClick={() => setShowRomaji(!showRomaji)}
                    className={cn(
                      'brutal-border grid h-7 w-7 place-items-center rounded-full bg-paper transition-all hover:bg-mustard active:scale-95',
                      showRomaji && 'bg-mustard'
                    )}
                  >
                    <IoLanguageSharp className="text-xs text-ink" />
                  </button>

                  {/* 3. Translate Icon */}
                  <button
                    type="button"
                    aria-label="Translate to English"
                    title="Translate with API"
                    disabled={isTranslating}
                    onClick={handleTranslate}
                    className={cn(
                      'brutal-border grid h-7 w-7 place-items-center rounded-full bg-paper transition-all hover:bg-mustard active:scale-95 disabled:opacity-50',
                      showTranslation && 'bg-mustard'
                    )}
                  >
                    <IoGlobeOutline className={cn("text-xs text-ink", isTranslating && "animate-spin")} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
      {isUser ? (
        <span className="brutal-border grid h-9 w-9 shrink-0 place-items-center rounded-full bg-ai font-display text-xs text-paper shadow-nav" aria-hidden="true">
          You
        </span>
      ) : null}
    </div>
  );
}

function HiddenMessages() {
  return (
    <div className="grid min-h-[30.5rem] place-items-center text-center">
      <div className="brutal-border bg-paper p-5 text-ink shadow-nav">
        <p className="font-display text-3xl leading-none">Messages hidden</p>
        <p className="mt-2 text-sm font-bold">Use option controls to bring the thread back.</p>
      </div>
    </div>
  );
}

function RecitationCardOverlay({ card, flightOrigin, onSkip, spokenTranscript, status, theme, isVisible = true, returnTransition, onReturnOriginReady }) {
  const [showRomaji, setShowRomaji] = useState(false);
  const statusCopy = {
    starting: 'Opening microphone…',
    listening: 'Listening now. Say it out loud.',
    'try-again': 'Try once more, slowly.',
    unsupported: 'Speech recognition is unavailable here. Tap the card to skip.',
    idle: 'Recite the card.',
  };
  const tone = getCardTone(card.toneIndex ?? 0);
  const tokens = getCardTokens(card);
  const matchedTokenCount = getMatchedTokenCount(tokens, spokenTranscript);
  const romajiText = getRomajiText(tokens);
  const cardRef = useRef(null);
  const [flightStyle, setFlightStyle] = useState(null);
  const isReturnMeasuring = returnTransition?.cardId === card.id && returnTransition.phase === 'measuring';
  const isReturningToHand = returnTransition?.cardId === card.id && returnTransition.phase === 'returning';

  useLayoutEffect(() => {
    if (!flightOrigin || !cardRef.current) {
      setFlightStyle(null);
      return;
    }

    const offset = getSharedElementOffset(flightOrigin, cardRef.current.getBoundingClientRect());
    setFlightStyle({
      '--shared-x': `${offset.x}px`,
      '--shared-y': `${offset.y}px`,
      '--shared-scale': offset.scale,
    });
  }, [flightOrigin]);

  useLayoutEffect(() => {
    if (!isReturnMeasuring || !cardRef.current) return;
    onReturnOriginReady?.(card.id, cardRef.current.getBoundingClientRect());
  }, [card.id, isReturnMeasuring, onReturnOriginReady]);

  return (
    <div
      className={cn(
        'pointer-events-none fixed inset-x-0 top-24 z-40 flex flex-col items-center px-4 transition-opacity duration-200 ease-out',
        isVisible && !isReturningToHand ? 'opacity-100' : 'opacity-0',
      )}
      aria-live="polite"
      aria-hidden={!isVisible}
    >
      <button
        type="button"
        aria-label={`Skip recitation for ${card.phrase}`}
        data-state="reciting"
        data-returning="false"
        onClick={onSkip}
        ref={cardRef}
        style={isReturningToHand ? undefined : flightStyle ?? undefined}
        className={cn(
          'pointer-events-auto relative h-72 w-56 origin-center transform-gpu brutal-border p-5 text-left shadow-shadow transition-[transform,box-shadow,opacity,filter] duration-200 ease-out will-change-transform hover:-translate-y-2 hover:scale-110 active:scale-105',
          isReturningToHand
            ? 'pointer-events-none opacity-0'
            : flightStyle
              ? 'animate-[shared-card-flight_420ms_cubic-bezier(.2,1,.2,1)_both]'
              : 'animate-[recitation-pop_360ms_cubic-bezier(.2,1.15,.2,1)_both]',
          isVisible && !isReturningToHand ? 'opacity-100 scale-100' : 'opacity-0 scale-95',
          tone,
        )}

      >
        <span data-testid="recitation-card-text" className="flex h-full flex-col items-start justify-start text-left font-jp text-3xl font-black leading-9">
          <PronunciationTokens phrase={card.phrase} matchedTokenCount={matchedTokenCount} />
          {showRomaji ? (
            <span data-testid="recitation-romaji" className="mt-2 font-mono text-xs font-black italic leading-4 text-current/75">
              {romajiText}
            </span>
          ) : null}
        </span>
        <span className={cn('absolute bottom-3 right-3 h-6 w-6 brutal-border shadow-nav', theme.glow)} aria-hidden="true" />
      </button>
      <div className="pointer-events-auto absolute left-[calc(50%+7.5rem)] top-9 z-50 flex max-w-56 flex-col gap-2">
        <button
          type="button"
          aria-label={`Speak phrase ${card.phrase}`}
          onClick={() => speakJapanese(card.phrase)}
          className="flex items-center gap-2 brutal-border bg-paper px-3 py-2 text-left text-ink shadow-shadow transition-transform hover:-translate-y-0.5 active:scale-95"
        >
          <IoVolumeHighSharp className="shrink-0 text-xl text-shu" aria-hidden="true" />
          <span className="line-clamp-2 font-jp text-sm font-black leading-5">{card.phrase}</span>
        </button>
        <button
          type="button"
          aria-label={`${showRomaji ? 'Hide' : 'Show'} romaji for ${card.phrase}`}
          onClick={() => setShowRomaji((current) => !current)}
          className="flex items-center gap-2 brutal-border bg-mustard px-3 py-2 text-left font-mono text-xs font-black uppercase tracking-[0.08em] text-ink shadow-shadow transition-transform hover:-translate-y-0.5 active:scale-95"
        >
          <IoLanguageSharp className="shrink-0 text-lg" aria-hidden="true" />
          Romaji
        </button>
      </div>
      <p className="mt-5 w-72 max-w-[80vw] brutal-border bg-paper px-3 py-2 text-center font-mono text-[10px] font-black uppercase tracking-[0.1em] text-ink shadow-nav">
        <span className="sr-only">Recite the card. </span>
        {statusCopy[status] ?? statusCopy.idle}
      </p>

    </div>
  );
}

function PronunciationTokens({ matchedTokenCount, phrase }) {
  const displayUnits = Array.from(phrase);

  return (
    <span className="inline flex-wrap">
      {displayUnits.map((unit, index) => {
        const isSpoken = index < matchedTokenCount;

        return (
          <span
            key={`${unit}-${index}`}
            data-spoken={isSpoken ? 'true' : 'false'}
            data-testid={`recitation-token-${index}`}
            className={cn(
              'inline rounded-sm px-0.5 transition-colors',
              isSpoken && 'bg-mustard text-ink ring-2 ring-ink',
            )}
          >
            {unit}
          </span>
        );
      })}
    </span>
  );
}

function ExpToast({ text }) {
  return (
    <div className="pointer-events-none absolute left-1/2 top-8 z-50 -translate-x-1/2 animate-[recitation-pop_300ms_ease-out_both] brutal-border bg-mustard px-4 py-2 font-display text-2xl text-ink shadow-shadow" role="status">
      {text}
    </div>
  );
}

function Composer({ message, setMessage }) {
  return (
    <div className="relative mt-4 grid grid-cols-[1fr_auto] gap-3">
      <div className="relative min-w-0 overflow-visible">
        <IoMicSharp className="pointer-events-none absolute left-4 top-1/2 z-10 -translate-y-1/2 text-xl text-ink/55" aria-hidden="true" />
        <label className="sr-only" htmlFor="conversation-message">Message text</label>
        <input
          id="conversation-message"
          aria-label="Message text"
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          placeholder="Type your message in Japanese..."
          className="brutal-border h-12 w-full min-w-0 bg-paper pl-12 pr-4 font-jp text-base font-black text-ink shadow-nav placeholder:font-sans placeholder:text-ink/45"
        />
      </div>
      <button
        type="button"
        aria-label="Send message"
        className="brutal-border grid h-12 w-12 place-items-center rounded-full bg-mustard text-xl text-ink shadow-nav transition-transform hover:-translate-y-0.5 active:scale-95"
      >
        <IoSendSharp />
      </button>
    </div>
  );
}

function CardHand({ cards, onUseCard, selectedCardId, returnTransition, onReturnDestinationReady, onReturnFlightComplete, theme }) {
  const isReturningToHand = Boolean(returnTransition?.cardId);

  if (cards.length === 0) {
    return (
      <div className="absolute -bottom-20 left-1/2 z-30 w-72 -translate-x-1/2 rotate-[-2deg] brutal-border bg-paper p-4 text-center shadow-shadow">
        <p className="font-display text-2xl leading-none">All cards used</p>
        <p className="mt-2 text-sm font-bold">New suggestions will arrive after the next response.</p>
      </div>
    );
  }

  return (
    <div
      data-returning={isReturningToHand ? 'true' : 'false'}
      className={cn(
        'pointer-events-none absolute -bottom-52 left-1/2 h-64 w-[38rem] max-w-[130vw] -translate-x-1/2',
        isReturningToHand ? 'z-50' : 'z-30',
        !isReturningToHand && 'group/hand',
      )}
      aria-label="Suggestion card hand"
    >
      {cards.slice(0, 5).map((card, index) => (
        <PhraseCard
          key={card.id}
          card={card}
          index={index}
          isSelected={selectedCardId === card.id && returnTransition?.cardId !== card.id}
          isReturnDestination={returnTransition?.cardId === card.id}
          returnPhase={returnTransition?.cardId === card.id ? returnTransition.phase : null}
          isReturningToHand={isReturningToHand}
          returnTransition={returnTransition}
          onReturnDestinationReady={onReturnDestinationReady}
          onReturnFlightComplete={onReturnFlightComplete}
          onUseCard={onUseCard}
          theme={theme}
          total={Math.min(cards.length, 5)}
        />
      ))}
    </div>
  );
}

function PhraseCard({ card, index, isSelected, isReturnDestination, returnPhase, isReturningToHand, returnTransition, onReturnDestinationReady, onReturnFlightComplete, onUseCard, theme, total }) {
  const slotRef = useRef(null);
  const cardRef = useRef(null);
  const offset = index - (total - 1) / 2;
  const rotation = offset * 6;
  const translateX = offset * 4.5;
  const spreadRotation = offset * 13;
  const spreadX = offset * 6.9;
  const spreadY = -2.2 + Math.abs(offset) * 0.9;
  const tone = getCardTone(card.toneIndex ?? index);
  const [deckReturnStyle, setDeckReturnStyle] = useState(null);

  useLayoutEffect(() => {
    if (!isReturnDestination || returnPhase !== 'measuring' || !slotRef.current || !cardRef.current) return;
    onReturnDestinationReady?.(card.id, {
      slotRect: slotRef.current.getBoundingClientRect(),
      cardRect: cardRef.current.getBoundingClientRect(),
      rotation,
    });
  }, [card.id, isReturnDestination, onReturnDestinationReady, returnPhase, rotation]);

  useLayoutEffect(() => {
    if (!isReturnDestination || returnPhase !== 'returning' || !returnTransition?.destination?.cardRect) {
      if (returnPhase !== 'handoff') {
        setDeckReturnStyle(null);
      }
      return undefined;
    }

    setDeckReturnStyle({
      opacity: 0,
      transform: 'translateY(-0.5rem) scale(0.96) rotate(0deg)',
      filter: 'blur(0)',
    });

    const frame = window.requestAnimationFrame(() => {
      setDeckReturnStyle({
        opacity: 1,
        transform: 'translateY(0) scale(1) rotate(0deg)',
        filter: 'blur(0)',
      });
    });

    return () => window.cancelAnimationFrame(frame);
  }, [isReturnDestination, returnPhase, returnTransition?.destination]);

  const interactiveCardMotion = !isReturnDestination
    ? 'hover:z-20 hover:-translate-y-24 hover:rotate-0 hover:scale-[1.15] hover:shadow-shadow focus-visible:z-20 focus-visible:-translate-y-24 focus-visible:rotate-0 focus-visible:scale-[1.15]'
    : '';

  return (
    <div
      ref={slotRef}
      className={cn(
        'absolute left-1/2 top-0 [transform:var(--rest-transform)] transition-transform duration-300 ease-out',
        !isReturningToHand && 'group-hover/hand:[transform:var(--spread-transform)] group-hover/hand:duration-500',
        isReturnDestination && returnPhase === 'returning' && 'animate-card-return-settle',
      )}
      style={{
        '--rest-transform': `translateX(calc(-50% + ${translateX}rem)) rotate(${rotation}deg)`,
        '--spread-transform': `translateX(calc(-50% + ${spreadX}rem)) translateY(${spreadY}rem) rotate(${spreadRotation}deg)`,
      }}
    >
      <button
        type="button"
        aria-label={`Practice phrase ${card.phrase}`}
        ref={cardRef}
        data-state={isSelected ? 'selected' : 'idle'}
        data-returning={isReturnDestination && returnPhase === 'returning' ? 'true' : 'false'}
        data-card-id={card.id}
        data-return-mode={isReturnDestination ? 'slot-settle' : undefined}
        data-testid={isReturnDestination ? 'return-destination-card' : undefined}
        onClick={(event) => onUseCard(card, event.currentTarget)}
        onTransitionEnd={(event) => {
          if (!isReturnDestination || returnPhase !== 'returning' || event.target !== event.currentTarget) return;
          if (event.propertyName !== 'transform') return;
          onReturnFlightComplete?.();
        }}
        disabled={isReturnDestination && returnPhase === 'measuring'}
        style={deckReturnStyle ?? undefined}
        className={cn(
          'pointer-events-auto h-64 w-48 origin-bottom transform-gpu brutal-border p-5 text-left shadow-nav transition-[transform,box-shadow,opacity,filter] duration-200 ease-out will-change-transform',
          interactiveCardMotion,
          isSelected && 'z-30 -translate-y-36 rotate-0 scale-[1.3] shadow-shadow duration-200',
          isReturnDestination && returnPhase === 'measuring' && 'opacity-0 pointer-events-none',
          isReturnDestination && returnPhase === 'returning' && 'opacity-100 pointer-events-none transition-[transform,opacity] duration-[260ms] [transition-timing-function:cubic-bezier(.2,1,.2,1)] will-change-[transform,opacity]',
          isReturnDestination && returnPhase === 'handoff' && 'opacity-100 duration-[80ms]',
          tone,
        )}
      >
        <span data-testid="return-card-face" className="relative block h-full w-full">
          <span data-testid={`phrase-card-text-${index}`} className="flex h-full items-start justify-start text-left font-jp text-2xl font-black leading-8">
            {card.phrase}
          </span>
          <span className={cn('absolute bottom-3 right-3 h-6 w-6 brutal-border shadow-nav', theme.glow)} aria-hidden="true" />
        </span>
      </button>
    </div>
  );
}

function restoreCardInInitialOrder(currentCards, card, initialCards) {
  if (currentCards.some((currentCard) => currentCard.id === card.id)) {
    return currentCards;
  }

  const order = new Map(initialCards.map((initialCard, index) => [initialCard.id, index]));
  return [...currentCards, card].sort((first, second) => (order.get(first.id) ?? 0) - (order.get(second.id) ?? 0));
}

function buildCards(briefing) {
  const phrases = [...(briefing.prep ?? []), ...EXTRA_CARDS];
  return phrases.map((phrase, index) => ({
    id: `${phrase}-${index}`,
    phrase,
    tokens: buildPronunciationTokens(phrase),
    toneIndex: index,
  }));
}

function getCardTone(index) {
  return index % 4 === 0 ? 'bg-correction text-paper' : index % 4 === 1 ? 'bg-mustard text-ink' : index % 4 === 2 ? 'bg-[#8DEB5E] text-ink' : 'bg-[#61CBE8] text-ink';
}

export function isCompleteRecitation(card, transcript) {
  const tokens = getCardTokens(card);
  const expected = normalizeSpokenJapanese(tokens.map((token) => token.kana).join(''));
  const spoken = normalizeSpokenJapanese(transcript);

  if (!expected || !spoken) {
    return false;
  }

  if (spoken.includes(expected)) {
    return true;
  }

  const matchedTokenCount = getMatchedTokenCount(tokens, transcript);
  return matchedTokenCount / tokens.length >= 0.8;
}

export function getSharedElementOffset(sourceRect, targetRect) {
  const sourceCenterX = sourceRect.left + sourceRect.width / 2;
  const sourceCenterY = sourceRect.top + sourceRect.height / 2;
  const targetCenterX = targetRect.left + targetRect.width / 2;
  const targetCenterY = targetRect.top + targetRect.height / 2;

  return {
    x: sourceCenterX - targetCenterX,
    y: sourceCenterY - targetCenterY,
    scale: sourceRect.width && targetRect.width ? sourceRect.width / targetRect.width : 1,
  };
}

export function getMatchedTokenCount(tokens, transcript) {
  if (!Array.isArray(tokens) || tokens.length === 0) {
    return 0;
  }

  const spoken = normalizeSpokenJapanese(transcript);
  let normalizedPrefix = '';
  let count = 0;

  for (const token of tokens) {
    normalizedPrefix += normalizeSpokenJapanese(token.kana);
    if (!spoken.startsWith(normalizedPrefix)) {
      break;
    }
    count += 1;
  }

  return count;
}

function getCardTokens(card) {
  return Array.isArray(card?.tokens) && card.tokens.length > 0
    ? card.tokens
    : buildPronunciationTokens(card?.phrase ?? '');
}

function getRomajiText(tokens) {
  return tokens
    .map((token) => token.romaji)
    .filter(Boolean)
    .join(' ');
}

export function buildPronunciationTokens(phrase) {
  const override = PHRASE_PRONUNCIATION_TOKENS[phrase];
  if (override) {
    return override;
  }

  const normalizedPhrase = normalizeSpokenJapanese(phrase);
  return Array.from(normalizedPhrase).map((kana) => ({
    kana,
    romaji: KANA_ROMAJI[kana] ?? toRomajiText(kana) ?? kana,
  }));
}

function normalizeSpokenJapanese(value) {
  const normalized = SPOKEN_READING_NORMALIZATIONS.reduce(
    (current, [term, reading]) => current.replaceAll(term, reading),
    String(value || '').normalize('NFKC'),
  );

  return katakanaToHiragana(normalized)
    .replace(/[_＿]+/g, '')
    .replace(/[\s。．、，,.!?！？「」『』（）()\[\]{}]/g, '')
    .trim();
}

function katakanaToHiragana(value) {
  return value.replace(/[ァ-ン]/g, (char) => String.fromCharCode(char.charCodeAt(0) - 0x60));
}
