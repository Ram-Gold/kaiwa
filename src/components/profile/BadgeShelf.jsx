import Card from '../ui/Card.jsx';
import { cn } from '../../lib/utils.js';

const TOTAL_BADGE_SLOTS = 6;

export default function BadgeShelf({ badges, className = '' }) {
  const emptySlots = Math.max(0, TOTAL_BADGE_SLOTS - badges.length);

  return (
    <section aria-labelledby="badges-heading" className={cn('grid', className)}>
      <Card padding="lg" className="bg-white">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="label-mono text-moss">Achievement shelf</p>
            <h2 id="badges-heading" className="mt-2 font-display text-3xl leading-none">
              Badges
            </h2>
          </div>
          <a href="#badges-heading" className="font-mono text-xs font-black uppercase tracking-[0.14em] underline decoration-4 underline-offset-4 hover:text-correction sm:text-sm">
            View All
          </a>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
          {badges.map((badge) => (
            <BadgeCard key={badge.id} badge={badge} />
          ))}
          {Array.from({ length: emptySlots }, (_, index) => (
            <div key={index} className="brutal-border grid aspect-square min-h-32 place-items-center bg-ink/10 p-3 text-center shadow-nav" aria-label="Locked badge slot">
              <span className="font-mono text-[10px] font-black uppercase tracking-[0.14em] text-ink/35">Locked</span>
            </div>
          ))}
        </div>
      </Card>
    </section>
  );
}

function BadgeCard({ badge }) {
  return (
    <article className="brutal-border grid aspect-square min-h-32 grid-rows-[auto_1fr_auto] place-items-center bg-paper p-3 text-center shadow-nav">
      <h3 className="text-sm font-black leading-tight">{badge.title}</h3>
      <div className={cn('grid h-12 w-12 place-items-center rounded-full text-3xl', badgeToneClass(badge.tone))} aria-hidden="true">
        {badge.icon}
      </div>
      <p className="text-[11px] font-bold leading-tight text-ink/70">{badge.description}</p>
    </article>
  );
}

function badgeToneClass(tone) {
  if (tone === 'correction') return 'bg-correction text-paper';
  if (tone === 'aizome') return 'bg-aizome text-paper';
  if (tone === 'moss') return 'bg-moss text-paper';
  return 'bg-mustard text-ink';
}
