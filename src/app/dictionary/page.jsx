'use client';

import { useState, useEffect, useMemo, useCallback, useRef, memo } from 'react';
import { IoSearchSharp, IoTrashOutline, IoVolumeHighSharp } from 'react-icons/io5';

import Badge from '../../components/ui/Badge.jsx';
import { DictionaryPopover } from '../../components/chat/JapaneseText.jsx';
import { cn } from '../../lib/utils.js';
import { useAuth } from '../../lib/auth/AuthContext.jsx';
import { getDictionaryWords, deleteDictionaryWord } from '../../lib/firebase/firestore.js';
import { speakJapanese } from '../../lib/speech.js';

const JLPT_FILTERS = ['ALL', 'N5', 'N4', 'N3', 'N2', 'N1'];
const SORT_OPTIONS = [
  { key: 'newest', label: 'Newest' },
  { key: 'alphabetical', label: 'A→Z' },
];

export default function DictionaryPage() {
  const { user } = useAuth();
  const [words, setWords] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [activeJlptFilter, setActiveJlptFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('newest');
  const [activePopoverEntry, setActivePopoverEntry] = useState(null);
  const [deletingTerm, setDeletingTerm] = useState(null);

  // Debounce search input so filtering doesn't re-run on every keystroke
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(searchQuery), 200);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch dictionary words on mount
  useEffect(() => {
    if (!user?.uid) {
      setIsLoading(false);
      return;
    }

    let isMounted = true;
    async function loadWords() {
      try {
        const fetchedWords = await getDictionaryWords(user.uid);
        if (isMounted) setWords(fetchedWords);
      } catch (err) {
        console.error('Failed to fetch dictionary words:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadWords();
    return () => { isMounted = false; };
  }, [user?.uid]);

  // Filter and sort using debounced query
  const filteredWords = useMemo(() => {
    let result = words;

    // Search filter — match term, reading, or meaning
    if (debouncedQuery.trim()) {
      const q = debouncedQuery.trim().toLowerCase();
      result = result.filter((w) =>
        w.term?.toLowerCase().includes(q) ||
        w.reading?.toLowerCase().includes(q) ||
        w.meaning?.toLowerCase().includes(q)
      );
    }

    // JLPT filter
    if (activeJlptFilter !== 'ALL') {
      result = result.filter((w) => w.jlpt === activeJlptFilter);
    }

    // Sort
    if (sortBy === 'alphabetical') {
      result = [...result].sort((a, b) => (a.term || '').localeCompare(b.term || '', 'ja'));
    }
    // 'newest' is the default order from Firestore (already sorted by savedAt desc)

    return result;
  }, [words, debouncedQuery, activeJlptFilter, sortBy]);

  // Stable callbacks to prevent unnecessary re-renders of memoized WordCard
  const handleDelete = useCallback(async (term) => {
    if (!user?.uid || !term) return;
    setDeletingTerm(term);

    // Optimistic removal
    setWords((prev) => prev.filter((w) => w.term !== term));

    try {
      await deleteDictionaryWord(user.uid, term);
    } catch (err) {
      console.error('Failed to delete dictionary word:', err);
      // Re-fetch on error to restore state
      const fetchedWords = await getDictionaryWords(user.uid);
      setWords(fetchedWords);
    } finally {
      setDeletingTerm(null);
    }
  }, [user?.uid]);

  const handleCardClick = useCallback((word) => {
    const entry = {
      term: word.term,
      reading: word.reading,
      meaning: word.meaning,
      jlpt: word.jlpt,
      examples: word.examples || [],
    };
    setActivePopoverEntry((current) => (current?.term === entry.term ? null : entry));
  }, []);

  if (!user) {
    return (
      <div className="mx-auto max-w-5xl">
        <header className="mb-6">
          <p className="label-mono text-correction">Personal vocabulary</p>
          <h1 className="mt-2 font-display text-4xl leading-none sm:text-5xl">My Dictionary</h1>
        </header>
        <div className="brutal-border rounded-2xl bg-white p-8 text-center shadow-nav">
          <h3 className="font-display text-2xl">Sign in to use your dictionary</h3>
          <p className="mt-2 font-mono text-xs font-bold text-ink/60">
            Your saved vocabulary is stored in your account. Please log in to access your dictionary.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl relative">
      {/* Dictionary Popover — Centered Modal */}
      {activePopoverEntry && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center bg-ink/40 p-4 backdrop-blur-sm"
          onClick={() => setActivePopoverEntry(null)}
        >
          <div onClick={(e) => e.stopPropagation()}>
            <DictionaryPopover
              entry={activePopoverEntry}
              onClose={() => setActivePopoverEntry(null)}
              showSaveButton={false}
              isSaved={true}
            />
          </div>
        </div>
      )}


      {/* Header */}
      <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="label-mono text-correction">Personal vocabulary</p>
          <h1 className="mt-2 font-display text-4xl leading-none sm:text-5xl">My Dictionary</h1>
        </div>
        <Badge tone="mustard">{words.length} {words.length === 1 ? 'word' : 'words'} saved</Badge>
      </header>

      {/* Search Bar */}
      <div className="brutal-border flex items-center gap-3 rounded-xl bg-white px-4 py-3 shadow-nav focus-within:ring-2 focus-within:ring-mustard transition-all">
        <IoSearchSharp className="text-lg text-ink/40 shrink-0" />
        <input
          type="text"
          placeholder="Search by word, reading, or meaning..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-transparent font-mono text-sm font-bold text-ink placeholder:text-ink/30 outline-none"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            className="font-mono text-xs font-black text-ink/40 hover:text-ink uppercase"
          >
            Clear
          </button>
        )}
      </div>

      {/* Filter & Sort Row */}
      <div className="mt-6 flex flex-wrap items-center gap-3">
        {/* JLPT Filter Pills */}
        {JLPT_FILTERS.map((filter) => (
          <button
            key={filter}
            type="button"
            onClick={() => setActiveJlptFilter(filter)}
            className={cn(
              'brutal-border rounded-xl px-4 py-3 font-mono text-sm font-black uppercase tracking-[0.12em] transition-all duration-150',
              activeJlptFilter === filter
                ? 'bg-correction text-paper translate-x-[2px] translate-y-[2px] shadow-none'
                : 'bg-white text-ink shadow-nav hover:-translate-y-1 hover:shadow-[5px_5px_0px_0px_#1C1C1C] hover:bg-mustard',
            )}
          >
            {filter}
          </button>
        ))}

        {/* Sort Toggle */}
        <div className="ml-auto flex items-center gap-1.5">
          {SORT_OPTIONS.map((option) => (
            <button
              key={option.key}
              type="button"
              onClick={() => setSortBy(option.key)}
              className={cn(
                'rounded-lg px-3 py-2 font-mono text-xs font-black uppercase tracking-wider transition-all',
                sortBy === option.key
                  ? 'bg-ink text-paper'
                  : 'bg-transparent text-ink/40 hover:text-ink hover:bg-ink/5',
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Word Cards Grid */}
      <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-label="Saved dictionary words">
        {isLoading ? (
          // Skeleton cards
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="brutal-border rounded-2xl bg-white p-5 shadow-nav animate-pulse">
              <div className="h-6 w-20 rounded bg-ink/10" />
              <div className="mt-2 h-4 w-32 rounded bg-ink/10" />
              <div className="mt-3 h-3 w-full rounded bg-ink/10" />
              <div className="mt-1 h-3 w-3/4 rounded bg-ink/10" />
            </div>
          ))
        ) : filteredWords.length > 0 ? (
          filteredWords.map((word) => (
            <WordCard
              key={word.term}
              word={word}
              isDeleting={deletingTerm === word.term}
              onDelete={handleDelete}
              onClick={handleCardClick}
            />
          ))
        ) : (
          <div className="sm:col-span-2 lg:col-span-3 brutal-border rounded-2xl bg-white p-8 text-center shadow-nav">
            {words.length === 0 ? (
              <>
                <h3 className="font-display text-2xl">No words saved yet</h3>
                <p className="mt-2 max-w-md mx-auto font-mono text-xs font-bold text-ink/60">
                  Tap on Japanese words during a roleplay to open the dictionary popover, then hit the bookmark icon to save them here.
                </p>
              </>
            ) : (
              <>
                <h3 className="font-display text-2xl">No matches found</h3>
                <p className="mt-2 font-mono text-xs font-bold text-ink/60">
                  Try a different search or filter.
                </p>
              </>
            )}
          </div>
        )}
      </section>
    </div>
  );
}

/**
 * WordCard — uses a <div> with role="button" as the outer wrapper
 * to avoid nesting <button> inside <button> (hydration error).
 * Memoized to skip re-renders when props haven't changed.
 */
const WordCard = memo(function WordCard({ word, isDeleting, onDelete, onClick }) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onClick(word)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick(word);
        }
      }}
      className={cn(
        'brutal-border rounded-2xl bg-white p-5 shadow-nav text-left transition-all duration-150 group cursor-pointer',
        'hover:-translate-y-1 hover:shadow-[5px_5px_0px_0px_#1C1C1C] hover:bg-mustard/10',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-mustard',
        isDeleting && 'opacity-50 pointer-events-none',
      )}
    >
      {/* Top row: term + JLPT badge + actions */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <span className="font-display text-2xl leading-none text-ink group-hover:text-indigo-600 transition-colors">
            {word.term}
          </span>
          {word.reading && (
            <p className="mt-1 font-mono text-xs font-bold text-shu">{word.reading}</p>
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {word.jlpt && (
            <span className="brutal-border bg-mustard px-2 py-0.5 font-mono text-[10px] font-black uppercase text-ink">
              {word.jlpt}
            </span>
          )}
          {/* Speak button */}
          <button
            type="button"
            aria-label="Listen to word"
            title="Listen pronunciation"
            onClick={(e) => {
              e.stopPropagation();
              speakJapanese(word.term);
            }}
            className="brutal-border grid h-7 w-7 place-items-center rounded-full bg-white text-ink transition-colors hover:bg-aizome hover:text-paper active:scale-95"
          >
            <IoVolumeHighSharp className="text-xs" />
          </button>
          {/* Delete button */}
          <button
            type="button"
            aria-label={`Delete ${word.term} from dictionary`}
            title="Remove from dictionary"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(word.term);
            }}
            className="brutal-border grid h-7 w-7 place-items-center rounded-full bg-white text-ink/40 transition-colors hover:bg-shu hover:text-paper active:scale-95"
          >
            <IoTrashOutline className="text-xs" />
          </button>
        </div>
      </div>

      {/* Meaning */}
      {word.meaning && (
        <p className="mt-3 text-xs font-bold leading-5 text-ink/70 line-clamp-2 border-t-2 border-ink/10 pt-2">
          {word.meaning}
        </p>
      )}

      {/* Example preview */}
      {word.examples?.length > 0 && (
        <p className="mt-2 text-[10px] font-mono font-bold text-ink/40 line-clamp-1 italic">
          Ex: {word.examples[0]}
        </p>
      )}
    </div>
  );
});
