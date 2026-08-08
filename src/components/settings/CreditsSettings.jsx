import { useState } from 'react';
import { IoSearchSharp, IoOpenOutline } from 'react-icons/io5';
import { cn } from '../../lib/utils.js';

const CREDITS_LIST = [
  {
    id: 'flyrank',
    name: 'flyrankAI',
    category: 'Capstone Project',
    url: 'https://flyrank.ai',
    description: 'KAIwa is developed and maintained as an official flyrankAI project — pioneering local-first AI tutoring and interactive Japanese practice.',
    isPrimary: true
  },
  {
    id: 'jlpt-vocab-api',
    name: 'JLPT Vocab API',
    category: 'JLPT & Dictionary API',
    url: 'https://jlpt-vocab-api.vercel.app',
    description: 'A RESTful API for JLPT vocabulary from N5 to N1.'
  },
  {
    id: 'sound-effect-lab',
    name: 'Sound Effect Lab (効果音ラボ)',
    category: 'Audio FX & Feedback',
    url: 'https://soundeffect-lab.info/',
    description: 'High-quality royalty-free sound effects used for grading evaluation audio and interactive UI feedback.'
  },
  {
    id: 'irasutoya',
    name: 'Irasutoya (いらすとや)',
    category: 'Illustrations & Stamps',
    url: 'https://www.irasutoya.com/',
    description: 'Iconic Japanese vector illustrations and traditional Hanko stamp assets.'
  },
  {
    id: 'google-fonts',
    name: 'Google Fonts',
    category: 'Typography System',
    url: 'https://fonts.google.com/',
    description: 'Space Mono, Noto Sans JP, Inter, and Outfit typography driving the visual design.'
  },
  {
    id: 'lucide',
    name: 'Lucide',
    category: 'Iconography',
    url: 'https://lucide.dev/',
    description: 'Open-source static icons used for interface actions and navigation.'
  },
  {
    id: 'lucide-animated',
    name: 'Lucide Animated',
    category: 'Motion Iconography',
    url: 'https://lucide-animated.com/',
    description: 'Motion-powered animated icons used for streak and XP indicators.'
  },
  {
    id: 'react-icons',
    name: 'React Icons & Material Symbols',
    category: 'Iconography',
    url: 'https://react-icons.github.io/react-icons/',
    description: 'Ionicons 5 and Google Material Symbols icons used throughout the interface.'
  },
  {
    id: 'web-speech',
    name: 'Web Speech API',
    category: 'Audio Engine',
    url: 'https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API',
    description: 'Native SpeechSynthesis and SpeechRecognition browser engines for Japanese pronunciation playback.'
  },
  {
    id: 'kuromoji',
    name: 'kuromoji.js',
    category: 'NLP & Tokenizer',
    url: 'https://github.com/takuyaa/kuromoji.js',
    description: 'Client-side Japanese morphological tokenizer used for phrase segmentation and learning feedback.'
  }
];

export default function CreditsSettings() {
  const [search, setSearch] = useState('');

  const filteredCredits = CREDITS_LIST.filter((item) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      item.name.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q) ||
      item.description.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap pb-2 border-b-2 border-ink/10">
        <div>
          <p className="label-mono text-correction">Attribution & Licenses</p>
          <h3 className="mt-1 font-display text-4xl leading-none">Credits</h3>
        </div>

        {/* Search bar */}
        <div className="relative w-full sm:w-56 mt-1">
          <input
            type="text"
            placeholder="Search credits..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full brutal-border bg-white py-1.5 pl-8 pr-3 font-mono text-xs font-bold outline-none placeholder:text-ink/40 shadow-nav"
          />
          <IoSearchSharp className="absolute left-2.5 top-2.5 text-ink/50 text-sm" />
        </div>
      </div>

      <p className="text-xs font-bold leading-5 text-ink/75">
        KAIwa is an official <strong className="text-ink">flyrankAI</strong> project. Special thanks to the amazing open-source projects, Japanese asset creators, and audio providers.
      </p>

      {/* Simplified Editorial Directory List */}
      <div className="space-y-2.5 mt-3">
        {filteredCredits.length > 0 ? (
          filteredCredits.map((item, index) => (
            <div
              key={item.id}
              className={cn(
                'brutal-border group bg-white p-3.5 shadow-nav transition-all hover:bg-paper/60',
                item.isPrimary && 'bg-mustard/15 border-l-4 border-l-mustard'
              )}
            >
              <div className="flex items-start gap-3">
                {/* Index number */}
                <span className="font-mono text-sm font-black text-ink/40 group-hover:text-shu pt-0.5 select-none">
                  {String(index + 1).padStart(2, '0')}
                </span>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-display text-lg leading-snug">
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-ink hover:text-shu hover:underline inline-flex items-center gap-1 transition-colors"
                      >
                        {item.name}
                        <IoOpenOutline className="text-xs opacity-60" />
                      </a>
                    </h4>
                    <span className={cn(
                      'label-mono px-2 py-0.5 text-[10px] text-ink brutal-border',
                      item.isPrimary ? 'bg-mustard font-black' : 'bg-paper'
                    )}>
                      {item.category}
                    </span>
                  </div>

                  <p className="mt-1 text-xs font-bold leading-relaxed text-ink/75">{item.description}</p>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="brutal-border bg-white p-6 text-center font-mono text-xs font-bold text-ink/50">
            No credits matching &quot;{search}&quot;.
          </div>
        )}
      </div>
    </div>
  );
}
