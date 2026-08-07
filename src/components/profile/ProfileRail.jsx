import Badge from '../ui/Badge.jsx';
import Card from '../ui/Card.jsx';
import { cn } from '../../lib/utils.js';

export default function ProfileRail({ profile }) {
  return (
    <aside
      aria-label="Profile progress and community"
      className="border-t-2 border-border bg-paper px-4 py-6 sm:px-6 lg:sticky lg:top-0 lg:min-h-screen lg:border-l-2 lg:border-t-0 lg:px-5 lg:py-10"
    >
      <div className="grid gap-5">
        <StreakSummary streak={profile.streak} />
        <ConnectionsCard community={profile.community} />
      </div>
    </aside>
  );
}

function StreakSummary({ streak }) {
  return (
    <Card padding="md" className="min-h-48 bg-white">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="label-mono text-correction">Streak</p>
          <p className="mt-3 font-display text-5xl leading-none">{streak.current}</p>
          <p className="mt-2 font-mono text-xs font-black uppercase tracking-[0.13em] text-ink/65">days active</p>
        </div>
        <Badge tone="mustard" className="shrink-0">Best {streak.best}</Badge>
      </div>

      <div className="mt-5 grid grid-cols-7 gap-1.5" aria-label="Last seven days streak calendar">
        {streak.days.map((day) => (
          <div key={day.label} className="text-center">
            <div
              className={cn(
                'brutal-border mx-auto grid h-7 w-7 place-items-center font-mono text-[10px] font-black shadow-nav',
                day.active ? 'bg-moss text-paper' : 'bg-paper text-ink/45',
              )}
            >
              {day.active ? '✓' : '·'}
            </div>
            <p className="mt-1 font-mono text-[8px] font-black uppercase">{day.label}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}


function ConnectionsCard({ community }) {
  const followingList = community.followingList ?? [];
  const followerList = community.followerList ?? [];

  return (
    <Card padding="none" className="overflow-hidden bg-white">
      <div className="grid grid-cols-2 border-b-2 border-border text-center font-mono text-xs font-black uppercase tracking-[0.14em]">
        <div className="border-r-2 border-border bg-mustard px-3 py-4">
          <p>Following</p>
          <p className="mt-1 text-[10px] text-ink/60">{community.following}</p>
        </div>
        <div className="bg-paper px-3 py-4">
          <p>Followers</p>
          <p className="mt-1 text-[10px] text-ink/60">{community.followers}</p>
        </div>
      </div>

      <div className="grid gap-3 p-4" aria-label="Following preview">
        {followingList.slice(0, 3).map((person) => (
          <ConnectionRow key={person.id} person={person} />
        ))}
      </div>

      <div className="border-t-2 border-border bg-paper p-4">
        <p className="font-mono text-xs font-black uppercase tracking-[0.13em] text-ink/70">
          View {Math.max(0, community.following - followingList.length)} more following
        </p>
      </div>

      <div className="border-t-2 border-border p-4">
        <p className="label-mono text-aizome">Followers</p>
        <div className="mt-3 grid gap-3">
          {followerList.slice(0, 2).map((person) => (
            <ConnectionRow key={person.id} person={person} compact />
          ))}
        </div>
      </div>
    </Card>
  );
}

function ConnectionRow({ compact = false, person }) {
  return (
    <article className={cn('grid grid-cols-[2.75rem_minmax(0,1fr)] items-center gap-3', compact && 'grid-cols-[2.5rem_minmax(0,1fr)]')}>
      <div className={cn('brutal-border grid h-11 w-11 place-items-center rounded-full font-mono text-xs font-black shadow-nav', avatarToneClass(person.tone), compact && 'h-10 w-10')}>
        {person.initials}
      </div>
      <div className="min-w-0">
        <h3 className="truncate text-sm font-black leading-tight">{person.name}</h3>
        <p className="mt-1 font-mono text-[10px] font-black uppercase tracking-[0.11em] text-ink/50">{formatNumber(person.xp)} XP</p>
      </div>
    </article>
  );
}

function avatarToneClass(tone) {
  if (tone === 'correction') return 'bg-correction text-paper';
  if (tone === 'aizome') return 'bg-aizome text-paper';
  if (tone === 'moss') return 'bg-moss text-paper';
  return 'bg-mustard text-ink';
}

function formatNumber(value) {
  return new Intl.NumberFormat('en').format(value);
}
