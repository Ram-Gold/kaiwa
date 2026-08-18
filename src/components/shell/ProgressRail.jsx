import FlameIcon from '../icons/FlameIcon.jsx';
import ZapIcon from '../icons/ZapIcon.jsx';
import DailyQueue from './DailyQueue.jsx';
import { cn } from '../../lib/utils.js';
import { useAuth } from '../../lib/auth/AuthContext.jsx';
import { getStreakStatus } from '../../lib/firebase/firestore.js';

export default function ProgressRail({ compact = false, queueVariant }) {
  const { profile } = useAuth();
  const streakInfo = getStreakStatus(profile?.stats);
  const currentStreak = streakInfo.currentStreak;
  const xp = profile?.stats?.xp ?? 0;

  return (
    <aside
      aria-label={compact ? 'Daily progress menu' : 'Daily progress rail'}
      className={cn(
        'bg-paper px-4 py-6 sm:px-6 lg:px-5 lg:py-10',
        compact ? 'border-0' : 'border-t-2 border-border lg:sticky lg:top-0 lg:min-h-screen lg:border-0',
      )}
    >
      <div className="grid gap-5">
        <MiniStatsBar currentStreak={currentStreak} xp={xp} />
        <DailyQueue variant={queueVariant} />
      </div>
    </aside>
  );
}

export function MiniStatsBar({ currentStreak, xp }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <MiniStat icon={FlameIcon} value={currentStreak} label="streak" tone="correction" />
      <MiniStat icon={ZapIcon} value={xp} label="xp" tone="aizome" />
    </div>
  );
}

export function MiniStat({ icon: Icon, label, tone, value }) {
  const toneClass = tone === 'correction' ? 'text-correction' : 'text-aizome';

  return (
    <div className="brutal-border rounded-xl bg-white p-3 text-center shadow-nav">
      <div className="grid place-items-center">
        <Icon aria-hidden="true" className={cn('block', toneClass)} size={24} />
      </div>
      <p className="mt-1 font-display text-xl leading-none">{value}</p>
      <p className="mt-1 font-mono text-[9px] font-black uppercase tracking-[0.12em] text-ink/60">{label}</p>
    </div>
  );
}


