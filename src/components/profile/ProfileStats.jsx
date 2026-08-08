import { useMemo } from 'react';
import FlameIcon from '../icons/FlameIcon.jsx';
import ZapIcon from '../icons/ZapIcon.jsx';
import { cn } from '../../lib/utils.js';

const STAT_ICONS = {
  'Total Streak': FlameIcon,
  'Total XP': ZapIcon,
};

export default function ProfileStats({ stats, className = '' }) {
  const statsArray = useMemo(() => {
    if (Array.isArray(stats)) return stats;
    if (stats && typeof stats === 'object') {
      return [
        { label: 'Total Streak', value: stats.currentStreak ?? stats.streak ?? 0, accent: 'correction' },
        { label: 'Total XP', value: stats.xp ?? 0, accent: 'aizome' },
      ];
    }
    return [
      { label: 'Total Streak', value: 0, accent: 'correction' },
      { label: 'Total XP', value: 0, accent: 'aizome' },
    ];
  }, [stats]);

  return (
    <section aria-labelledby="stats-heading" className={cn('grid gap-y-4 lg:grid-rows-[auto_18rem]', className)}>
      <h2 id="stats-heading" className="font-display text-3xl leading-none">
        Statistics
      </h2>

      <div className="grid min-h-72 gap-3 sm:grid-cols-2 lg:h-full lg:min-h-0 lg:grid-cols-1 lg:grid-rows-2">
        {statsArray.map((stat) => {
          const Icon = STAT_ICONS[stat.label];

          return (
            <article key={stat.label} className="brutal-border grid min-h-28 place-items-center bg-white p-4 text-center shadow-shadow lg:min-h-0">
              <div className="grid justify-items-center gap-2">
                {Icon ? <Icon aria-hidden="true" className={cn('text-ink', accentIconClass(stat.accent))} size={28} /> : null}
                <p className={cn('font-display text-4xl leading-none', accentTextClass(stat.accent))}>{stat.value}</p>
                <p className="font-mono text-[10px] font-black uppercase tracking-[0.12em] text-ink/65">{stat.label}</p>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function accentTextClass(accent) {
  if (accent === 'correction') return 'text-correction';
  if (accent === 'aizome') return 'text-aizome';
  if (accent === 'moss') return 'text-moss';
  return 'text-ink';
}

function accentIconClass(accent) {
  if (accent === 'correction') return 'text-correction';
  if (accent === 'aizome') return 'text-aizome';
  if (accent === 'moss') return 'text-moss';
  return 'text-ink';
}
