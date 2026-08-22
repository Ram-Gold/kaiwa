'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { X, Sparkles, Check, ArrowRight, HelpCircle } from 'lucide-react';
import JapaneseText, { DictionaryPopover } from '../chat/JapaneseText.jsx';
import ExitConfirmationModal from '../shell/ExitConfirmationModal.jsx';
import { cn } from '../../lib/utils.js';
import { useAuth } from '../../lib/auth/AuthContext.jsx';
import { getLessonQuestions, incrementModuleProgress, recordUserActivityStreak, getDictionaryWords, saveDictionaryWord } from '../../lib/firebase/firestore.js';
import confetti from 'canvas-confetti';

const FALLBACK_QUIZ = [
  {
    id: 'f1',
    sentence: '<ruby>林檎<rt>りんご</rt></ruby>を___。',
    options: ['<ruby>食<rt>た</rt></ruby>べます', '<ruby>行<rt>い</rt></ruby>きます', '<ruby>見<rt>み</rt></ruby>ます', '<ruby>飲<rt>の</rt></ruby>みます'],
    correctIndex: 0,
    meaning: 'I eat apples.',
  },
  {
    id: 'f2',
    sentence: '<ruby>映画<rt>えいが</rt></ruby>を___。',
    options: ['<ruby>行<rt>い</rt></ruby>きます', '<ruby>食<rt>た</rt></ruby>べます', '<ruby>見<rt>み</rt></ruby>ました', '<ruby>飲<rt>の</rt></ruby>みます'],
    correctIndex: 2,
    meaning: 'I watched a movie.',
  },
];

function shuffleArray(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function processAndShuffleQuestions(rawQuestions) {
  if (!rawQuestions || rawQuestions.length === 0) return [];

  const shuffledQuestions = shuffleArray(rawQuestions);

  return shuffledQuestions.map((q) => {
    const originalOptions = q.options || [];
    const correctOptionValue = originalOptions[q.correctIndex ?? 0];

    const shuffledOptions = shuffleArray(originalOptions);
    const newCorrectIndex = shuffledOptions.indexOf(correctOptionValue);

    return {
      ...q,
      options: shuffledOptions,
      correctIndex: newCorrectIndex !== -1 ? newCorrectIndex : 0,
    };
  });
}

export default function VocabularyQuiz({ briefingId, briefingTitle = 'Basic Verbs', prepQuiz, nextHref = '/' }) {
  const router = useRouter();
  const { user } = useAuth();
  
  const [quizQuestions, setQuizQuestions] = useState([]);
  const [initialTotalCount, setInitialTotalCount] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState(null);
  const [isExiting, setIsExiting] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [xpEarned, setXpEarned] = useState(0);
  const [masteryProgress, setMasteryProgress] = useState(0);
  const [isExitModalOpen, setIsExitModalOpen] = useState(false);
  const [activeDictionaryEntry, setActiveDictionaryEntry] = useState(null);
  const [savedDictionaryTerms, setSavedDictionaryTerms] = useState(() => new Set());

  useEffect(() => {
    let isMounted = true;
    async function loadQuestions() {
      setIsLoading(true);
      try {
        const questionsFromDb = await getLessonQuestions(briefingId);
        if (isMounted) {
          let pool = FALLBACK_QUIZ;
          if (questionsFromDb && questionsFromDb.length > 0) {
            pool = questionsFromDb;
          } else if (prepQuiz && prepQuiz.length > 0) {
            pool = prepQuiz;
          }
          const randomized = processAndShuffleQuestions(pool);
          setQuizQuestions(randomized);
          setInitialTotalCount(randomized.length);
          setCorrectCount(0);
        }
      } catch (err) {
        console.error('Failed to load questions from Firebase:', err);
        if (isMounted) {
          const fallbackPool = (prepQuiz && prepQuiz.length > 0) ? prepQuiz : FALLBACK_QUIZ;
          const randomized = processAndShuffleQuestions(fallbackPool);
          setQuizQuestions(randomized);
          setInitialTotalCount(randomized.length);
          setCorrectCount(0);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadQuestions();
    return () => { isMounted = false; };
  }, [briefingId, prepQuiz]);

  useEffect(() => {
    if (!user?.uid) return;
    let isMounted = true;
    getDictionaryWords(user.uid)
      .then((words) => {
        if (isMounted && words && Array.isArray(words)) {
          setSavedDictionaryTerms(new Set(words.map((w) => w.term)));
        }
      })
      .catch((err) => console.error('Failed to load dictionary words:', err));
    return () => { isMounted = false; };
  }, [user?.uid]);

  useEffect(() => {
    function handleShowDictionary(event) {
      const incoming = event.detail;
      setActiveDictionaryEntry((current) => (current?.term === incoming?.term ? null : incoming));
    }

    window.addEventListener('kaiwa:show-dictionary', handleShowDictionary);
    return () => {
      window.removeEventListener('kaiwa:show-dictionary', handleShowDictionary);
    };
  }, []);

  const handleSaveToDictionary = useCallback((wordData) => {
    if (!user?.uid || !wordData?.term) return;
    saveDictionaryWord(user.uid, { ...wordData, source: 'basic-verbs' }).catch(console.error);
    setSavedDictionaryTerms((prev) => new Set(prev).add(wordData.term));
  }, [user?.uid]);

  const currentQuestion = quizQuestions[currentIndex];

  const handleSelect = useCallback((index) => {
    if (isSubmitted || !currentQuestion || isExiting) return;
    
    setSelectedAnswer(index);
    setIsSubmitted(true);
    setIsExiting(false);
    const correct = index === currentQuestion.correctIndex;
    setIsCorrect(correct);
    
    if (correct) {
      setCorrectCount(prev => prev + 1);
      confetti({
        particleCount: 45,
        spread: 60,
        origin: { y: 0.65 }
      });
      const earned = currentQuestion.isReview ? 5 : 10;
      setXpEarned(prev => prev + earned);
    } else {
      const originalOptions = currentQuestion.options || [];
      const correctOptionValue = originalOptions[currentQuestion.correctIndex ?? 0];
      const reshuffledOptions = shuffleArray(originalOptions);
      const newCorrectIndex = reshuffledOptions.indexOf(correctOptionValue);

      const reviewQuestion = {
        ...currentQuestion,
        options: reshuffledOptions,
        correctIndex: newCorrectIndex !== -1 ? newCorrectIndex : 0,
        isReview: true,
      };

      setQuizQuestions(prev => [...prev, reviewQuestion]);
    }
  }, [isSubmitted, currentQuestion, isExiting]);

  const handleNext = useCallback(() => {
    if (!isSubmitted || isExiting) return;

    setIsExiting(true);
    setTimeout(() => {
      if (currentIndex < quizQuestions.length - 1) {
        setCurrentIndex(prev => prev + 1);
        setSelectedAnswer(null);
        setIsSubmitted(false);
        setIsCorrect(null);
        setIsExiting(false);
      } else {
        setCompleted(true);
        setIsExiting(false);
        confetti({
          particleCount: 160,
          spread: 85,
          origin: { y: 0.6 }
        });

        if (briefingId) {
          incrementModuleProgress(user?.uid, briefingId, 20)
            .then((newVal) => {
              setMasteryProgress(newVal);
            })
            .catch((err) => {
              console.error('Failed to increment module progress:', err);
            });
        }

        if (user?.uid) {
          recordUserActivityStreak(user.uid, xpEarned || 20).catch(err => console.error('Failed to update streak:', err));
        }
      }
    }, 250);
  }, [isSubmitted, isExiting, currentIndex, quizQuestions.length, briefingId, user?.uid, xpEarned]);

  useEffect(() => {
    function handleKeyDown(e) {
      if (completed || isLoading) return;

      if (!isSubmitted) {
        if (e.key === '1') handleSelect(0);
        else if (e.key === '2') handleSelect(1);
        else if (e.key === '3') handleSelect(2);
        else if (e.key === '4') handleSelect(3);
      } else {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleNext();
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [completed, isLoading, isSubmitted, handleSelect, handleNext]);

  const handleExit = () => {
    if (completed) {
      router.push('/');
    } else {
      setIsExitModalOpen(true);
    }
  };

  const handleConfirmExit = () => {
    setIsExitModalOpen(false);
    router.push('/');
  };

  const handleCancelExit = () => {
    setIsExitModalOpen(false);
  };

  const handleContinue = () => {
    router.push(nextHref);
  };

  const isHomeExit = nextHref === '/' || briefingId === 'basic-verbs';
  const totalTarget = initialTotalCount || quizQuestions.length;

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[70vh] p-6 max-w-xl mx-auto w-full">
        <div className="flex items-center gap-3 mb-6">
          <span className="relative flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-mustard opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-mustard"></span>
          </span>
          <span className="font-mono text-sm font-black uppercase text-ink/70 tracking-wider">
            Loading Lesson...
          </span>
        </div>
        <div className="w-full bg-slate-100 border-2 border-black h-4 rounded-full overflow-hidden p-0.5 shadow-sm">
          <div className="bg-mustard h-full rounded-full w-1/3 animate-pulse" />
        </div>
      </div>
    );
  }

  if (completed) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[85vh] p-6 max-w-lg mx-auto w-full text-center animate-in fade-in zoom-in duration-300">
        <div className="relative mb-6">
          <div className="grid h-28 w-28 place-items-center rounded-3xl bg-moss text-white shadow-[0_6px_0_0_#2b483a] border-2 border-black">
            <Check className="h-14 w-14 stroke-[3.5]" />
          </div>
          <span className="absolute -top-2 -right-2 bg-mustard text-ink text-xs font-black px-2.5 py-1 rounded-full border-2 border-black shadow-sm uppercase font-mono">
            +50 XP
          </span>
        </div>

        <h2 className="font-display text-4xl sm:text-5xl font-black mb-2 text-ink">
          Lesson Complete
        </h2>
        <p className="text-base font-bold text-ink/70 mb-6">
          You mastered all <span className="text-ink font-black">{totalTarget} verbs</span> in this session!
        </p>

        <div className="w-full p-5 border-2 border-black bg-white rounded-2xl shadow-[0_4px_0_0_#1C1C1C] space-y-3 mb-8 text-left">
          <div className="flex justify-between items-center text-xs font-mono font-black uppercase text-ink">
            <span>Basic Verbs Mastery</span>
            <span className="text-mustard font-black text-sm bg-ink px-2 py-0.5 rounded-md text-white">
              {masteryProgress}%
            </span>
          </div>

          <meter
            min="0"
            max="100"
            low="39"
            high="79"
            optimum="100"
            value={masteryProgress}
            className="kaiwa-meter w-full block h-4"
          >
            {masteryProgress}%
          </meter>

          <div className="flex justify-between items-center text-xs font-mono font-bold text-ink/70">
            <span>Session Progress</span>
            <span className="font-black text-ink">{Math.min(Math.round(masteryProgress / 20), 5)} / 5 Sessions</span>
          </div>

          <p className="text-[11px] font-mono text-center text-ink/60 bg-paper py-1 rounded-lg border border-ink/10">
            {masteryProgress >= 100 
              ? '100% Mastery Achieved!' 
              : `Complete ${5 - Math.min(Math.round(masteryProgress / 20), 5)} more sessions to reach 100%`}
          </p>
        </div>

        <button
          type="button"
          onClick={handleContinue}
          className="w-full sm:w-auto min-w-[200px] bg-moss text-white font-black text-base px-8 py-4 rounded-2xl border-2 border-black shadow-[0_5px_0_0_#2b483a] hover:brightness-105 active:translate-y-1 active:shadow-none transition-all uppercase tracking-wide flex items-center justify-center gap-2"
        >
          <span>{isHomeExit ? 'Return Home' : 'Start Roleplay'}</span>
          <ArrowRight className="w-5 h-5 stroke-[3]" />
        </button>
      </div>
    );
  }

  if (!currentQuestion) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh] p-6 text-center">
        <p className="font-bold text-ink/70 mb-4">No questions found.</p>
        <button
          type="button"
          onClick={handleExit}
          className="inline-flex items-center gap-2 bg-black text-white px-6 py-2.5 rounded-xl font-mono text-xs font-bold"
        >
          <span>Return Home</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>
    );
  }

  const options = currentQuestion.options || [];

  return (
    <div className="flex-1 flex flex-col justify-between min-h-screen bg-paper select-none">
      <header className="w-full max-w-4xl mx-auto px-4 sm:px-8 py-4 sm:py-6 flex items-center gap-4 sm:gap-6">
        <button
          type="button"
          onClick={handleExit}
          aria-label="Exit quiz"
          className="h-10 w-10 shrink-0 grid place-items-center rounded-xl border-2 border-black bg-white text-ink/70 hover:text-ink hover:bg-slate-50 active:translate-y-0.5 shadow-sm transition-all"
        >
          <X className="h-5 w-5 stroke-[2.5]" />
        </button>

        <div className="flex-1 flex flex-col gap-1">
          <meter
            min="0"
            max={totalTarget}
            value={correctCount}
            className="kaiwa-meter w-full block h-3.5"
          >
            {correctCount} of {totalTarget}
          </meter>
        </div>

        <div className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl border-2 border-black bg-white shadow-sm font-mono text-xs font-black text-ink">
          <Sparkles className="h-3.5 w-3.5 text-mustard fill-mustard" />
          <span>+{xpEarned} XP</span>
        </div>
      </header>

      <main className="w-full max-w-2xl mx-auto px-4 sm:px-6 flex-1 flex flex-col justify-center py-4 sm:py-8 pb-36">
        <div className="flex items-center justify-between mb-4">
          <h1 className="font-display text-xl sm:text-2xl font-black text-ink">
            Select the correct verb
          </h1>
        </div>

        <div className="relative mb-8 rounded-3xl border-2 border-black bg-white p-6 sm:p-8 shadow-[0_5px_0_0_#1C1C1C] text-center">
          <div className="font-jp text-3xl sm:text-4xl font-black leading-[2.4] flex flex-wrap items-center justify-center gap-1">
            {isSubmitted ? (
              currentQuestion.sentence.split('___').map((part, i, arr) => (
                <span key={i} className="inline-flex items-baseline">
                  <JapaneseText text={part} enableDictionary={true} />
                  {i < arr.length - 1 && (
                    <span className={cn(
                      "inline-flex items-baseline px-1 font-black",
                      isCorrect ? "text-moss" : "text-correction line-through"
                    )}>
                      <JapaneseText 
                        text={isCorrect 
                          ? options[currentQuestion.correctIndex] 
                          : options[selectedAnswer]} 
                        enableDictionary={true} 
                      />
                    </span>
                  )}
                </span>
              ))
            ) : (
              <JapaneseText text={currentQuestion.sentence} enableDictionary={true} />
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
          {options.map((option, idx) => {
            const isSelected = selectedAnswer === idx;
            const isThisCorrect = idx === currentQuestion.correctIndex;
            
            let buttonStyle = "bg-white text-ink border-black hover:bg-slate-50 hover:border-black shadow-[0_4px_0_0_#1C1C1C] active:translate-y-1 active:shadow-none";

            if (isSubmitted) {
              if (isThisCorrect) {
                buttonStyle = "bg-moss text-white border-black shadow-[0_4px_0_0_#2b483a] ring-2 ring-moss";
              } else if (isSelected && !isCorrect) {
                buttonStyle = "bg-red-50 text-correction border-correction shadow-[0_4px_0_0_#D6432B]";
              } else {
                buttonStyle = "bg-white/60 text-ink/40 border-black/30 opacity-50 shadow-none pointer-events-none";
              }
            }

            return (
              <button
                key={idx}
                type="button"
                disabled={isSubmitted || isExiting}
                onClick={() => handleSelect(idx)}
                className={cn(
                  "relative flex items-center justify-between p-5 rounded-2xl border-2 text-left transition-all duration-150 group font-bold min-h-[4.5rem]",
                  buttonStyle
                )}
              >
                <div className="flex items-center gap-3">
                  <span className={cn(
                    "h-6 w-6 shrink-0 rounded-lg border flex items-center justify-center font-mono text-xs font-black transition-colors",
                    isSubmitted && isThisCorrect 
                      ? "border-white/40 bg-white/20 text-white" 
                      : "border-black/20 bg-paper text-ink/60 group-hover:border-black"
                  )}>
                    {idx + 1}
                  </span>

                  <span className="font-jp text-xl sm:text-2xl font-bold">
                    <JapaneseText text={option} enableDictionary={false} />
                  </span>
                </div>

                {isSubmitted && isThisCorrect && (
                  <span className="h-6 w-6 rounded-full bg-white text-moss grid place-items-center font-black text-xs shrink-0">
                    <Check className="h-4 w-4 stroke-[3]" />
                  </span>
                )}
                {isSubmitted && isSelected && !isCorrect && (
                  <span className="h-6 w-6 rounded-full bg-correction text-white grid place-items-center font-black text-xs shrink-0">
                    <X className="h-4 w-4 stroke-[3]" />
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </main>

      {/* Floating Bottom Feedback Drawer with Slide Up / Slide Down Animation */}
      <footer
        className={cn(
          "fixed bottom-0 inset-x-0 z-30 w-full border-t-2 py-4 sm:py-5 px-4 sm:px-8 shadow-2xl transition-all duration-300 ease-out transform",
          isSubmitted && !isExiting
            ? "translate-y-0 opacity-100"
            : "translate-y-full opacity-0 pointer-events-none",
          isCorrect
            ? "border-moss bg-[#d7ffb8] text-emerald-950"
            : "border-correction bg-[#ffdfe0] text-rose-950"
        )}
      >
        <div className="max-w-3xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            {isCorrect ? (
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-moss text-white border-2 border-emerald-950 font-black text-lg">
                  <Check className="h-5 w-5 stroke-[3]" />
                </div>
                <div>
                  <h3 className="font-display text-lg sm:text-xl font-black text-emerald-950">
                    {currentQuestion?.isReview ? 'Mistake Cleared' : 'Correct!'}
                  </h3>
                  <p className="text-xs font-bold text-emerald-900">
                    {currentQuestion?.isReview ? '+5 XP awarded' : '+10 XP awarded'}
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-correction text-white border-2 border-rose-950 font-black text-lg">
                  <X className="h-5 w-5 stroke-[3]" />
                </div>
                <div>
                  <h3 className="font-display text-lg sm:text-xl font-black text-rose-950">
                    Mistake, you can try again later
                  </h3>
                  <p className="text-xs font-bold text-rose-900">
                    This verb will reappear before the lesson finishes
                  </p>
                </div>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={handleNext}
            className={cn(
              "w-full sm:w-auto min-w-[160px] font-black text-sm px-6 py-3.5 rounded-xl border-2 border-black transition-all flex items-center justify-center gap-2 uppercase tracking-wider font-mono",
              isCorrect 
                ? "bg-moss text-white shadow-[0_4px_0_0_#243d31] hover:brightness-105 active:translate-y-1 active:shadow-none"
                : "bg-correction text-white shadow-[0_4px_0_0_#8f2818] hover:brightness-105 active:translate-y-1 active:shadow-none"
            )}
          >
            <span>{currentIndex === quizQuestions.length - 1 ? 'Finish Lesson' : 'Continue'}</span>
            <ArrowRight className="h-4 w-4 stroke-[3]" />
          </button>
        </div>
      </footer>
      <ExitConfirmationModal
        isOpen={isExitModalOpen}
        onConfirm={handleConfirmExit}
        onCancel={handleCancelExit}
      />
      {activeDictionaryEntry && (
        <>
          <div
            className="fixed inset-0 z-[90]"
            onClick={() => setActiveDictionaryEntry(null)}
          />
          <DictionaryPopover
            entry={activeDictionaryEntry}
            onClose={() => setActiveDictionaryEntry(null)}
            onSave={handleSaveToDictionary}
            isSaved={savedDictionaryTerms.has(activeDictionaryEntry?.term)}
          />
        </>
      )}
    </div>
  );
}
