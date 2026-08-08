import FlameIcon from '../icons/FlameIcon.jsx';
import ZapIcon from '../icons/ZapIcon.jsx';
import Badge from '../ui/Badge.jsx';
import Card from '../ui/Card.jsx';
import { cn } from '../../lib/utils.js';

import { useAuth } from '../../lib/auth/AuthContext.jsx';


const TASKS = [
  ['Review 5 phrases', '5 XP', true],
  ['Finish 1 lesson', '20 XP', false],
  ['Complete roleplay', '30 XP', false],
  ['Practice 10 minutes', '15 XP', false],
];


export default function ProgressRail({ compact = false }) {
  const { profile } = useAuth();
  const currentStreak = profile?.stats?.currentStreak ?? 0;
  const longestStreak = profile?.stats?.longestStreak ?? 0;
  const xp = profile?.stats?.xp ?? 0;
  const days = profile?.stats?.days ?? [
    { label: 'Mon', active: false },
    { label: 'Tue', active: false },
    { label: 'Wed', active: false },
    { label: 'Thu', active: false },
    { label: 'Fri', active: false },
    { label: 'Sat', active: false },
    { label: 'Sun', active: false }
  ];

  return (
    <aside
      aria-label={compact ? 'Daily progress menu' : 'Daily progress rail'}
      className={cn(
        'bg-paper px-4 py-6 sm:px-6 lg:px-5 lg:py-10',
        compact ? 'border-0' : 'border-t-2 border-border lg:sticky lg:top-0 lg:min-h-screen lg:border-l-2 lg:border-t-0',
      )}
    >
      <div className="grid gap-5">
        <MiniStatsBar currentStreak={currentStreak} xp={xp} />
        <StreakCard currentStreak={currentStreak} longestStreak={longestStreak} days={days} />
        <TaskCard />
      </div>
    </aside>
  );
}

function MiniStatsBar({ currentStreak, xp }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <MiniStat icon={FlameIcon} value={currentStreak} label="streak" tone="correction" />
      <MiniStat icon={ZapIcon} value={xp} label="xp" tone="aizome" />
    </div>
  );
}

function MiniStat({ icon: Icon, label, tone, value }) {
  const toneClass = tone === 'correction' ? 'text-correction' : 'text-aizome';

  return (
    <div className="brutal-border bg-white p-3 text-center shadow-nav">
      <div className="grid place-items-center">
        <Icon aria-hidden="true" className={cn('block', toneClass)} size={24} />
      </div>
      <p className="mt-1 font-display text-xl leading-none">{value}</p>
      <p className="mt-1 font-mono text-[9px] font-black uppercase tracking-[0.12em] text-ink/60">{label}</p>
    </div>
  );
}

function StreakCard({ currentStreak, longestStreak, days }) {
  return (
    <Card padding="md" className="bg-white">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="label-mono text-correction">Streak</p>
          <p className="mt-2 font-display text-4xl leading-none">{currentStreak} days</p>
        </div>
        <span className="brutal-border bg-mustard px-3 py-2 font-mono text-xs font-black uppercase tracking-[0.14em] shadow-nav">
          Best {longestStreak}
        </span>
      </div>

      <div className="mt-5 grid grid-cols-7 gap-2.5" aria-label="Last seven days streak calendar">
        {days.map((day) => (
          <div key={day.label} className="text-center">
            <div className={cn('brutal-border mx-auto grid h-8 w-8 place-items-center font-mono text-[10px] font-black shadow-nav', day.active ? 'bg-moss text-paper' : 'bg-paper text-ink')}>
              {day.active ? '✓' : '·'}
            </div>
            <p className="mt-1 font-mono text-[9px] font-black uppercase">{day.label}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}


function TaskCard() {
  const completed = TASKS.filter(([, , done]) => done).length;

  return (
    <Card padding="md" className="bg-white">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="label-mono text-correction">Tasks</p>
          <h2 className="mt-2 font-display text-3xl">Daily queue</h2>
        </div>
        <Badge tone="moss">{completed} / {TASKS.length}</Badge>
      </div>
      <div className="mt-5 space-y-4">
        {TASKS.map(([task, xp, done]) => (
          <label key={task} className="grid cursor-pointer grid-cols-[2rem_1fr] gap-x-3 gap-y-2">
            <span className={cn('brutal-border row-span-2 grid h-8 w-8 place-items-center bg-white font-mono text-xs font-black shadow-nav', done && 'bg-moss text-paper')} aria-hidden="true">
              {done ? '✓' : '⚡'}
            </span>
            <span className="min-w-0 font-bold leading-5">{task}</span>
            <span className="brutal-border h-4 overflow-hidden bg-paper shadow-nav">
              <span className={cn('block h-full', done ? 'w-full bg-moss' : 'w-1/3 bg-mustard')} />
            </span>
            <span className="sr-only">{xp}</span>
          </label>
        ))}
      </div>
    </Card>
  );
}

