import Badge from '../ui/Badge.jsx';
import Card from '../ui/Card.jsx';
import { cn } from '../../lib/utils.js';

const STREAK_DAYS = [
  ['Mon', true],
  ['Tue', true],
  ['Wed', true],
  ['Thu', true],
  ['Fri', true],
  ['Sat', false],
  ['Sun', false],
];

const LEVEL_ROWS = [
  { label: '0-99 XP', name: 'Kana Rookie', points: 0 },
  { label: '100-249 XP', name: 'N5 Starter', points: 100 },
  { label: '250-499 XP', name: 'Phrase Builder', points: 250 },
  { label: '500+ XP', name: 'Kaiwa Regular', points: 500 },
];

const TASKS = [
  ['Review 5 phrases', '5 XP', true],
  ['Finish 1 lesson', '20 XP', false],
  ['Complete roleplay', '30 XP', false],
  ['Practice 10 minutes', '15 XP', false],
];

const currentPoints = 286;

export default function ProgressRail({ compact = false }) {
  return (
    <aside
      aria-label={compact ? 'Daily progress menu' : 'Daily progress rail'}
      className={cn(
        'bg-paper px-4 py-6 sm:px-6 lg:px-5 lg:py-10',
        compact ? 'border-0' : 'border-t-2 border-border lg:sticky lg:top-0 lg:min-h-screen lg:border-l-2 lg:border-t-0',
      )}
    >
      <div className="grid gap-5">
        <MiniStatsBar />
        <StreakCard />
        <LevelCard />
        <TaskCard />
      </div>
    </aside>
  );
}

function MiniStatsBar() {
  return (
    <div className="grid grid-cols-3 gap-3">
      <MiniStat icon="🔥" value="12" label="streak" tone="correction" />
      <MiniStat icon="◆" value="286" label="xp" tone="aizome" />
      <MiniStat icon="♥" value="5" label="focus" tone="moss" />
    </div>
  );
}

function MiniStat({ icon, label, tone, value }) {
  const toneClass = tone === 'correction' ? 'text-correction' : tone === 'aizome' ? 'text-aizome' : 'text-moss';

  return (
    <div className="brutal-border bg-white p-3 text-center shadow-nav">
      <p className={cn('text-xl font-black leading-none', toneClass)}>{icon}</p>
      <p className="mt-1 font-display text-xl leading-none">{value}</p>
      <p className="mt-1 font-mono text-[9px] font-black uppercase tracking-[0.12em] text-ink/60">{label}</p>
    </div>
  );
}

function StreakCard() {
  return (
    <Card padding="md" className="bg-white">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="label-mono text-correction">Streak</p>
          <p className="mt-2 font-display text-4xl leading-none">12 days</p>
        </div>
        <span className="brutal-border bg-mustard px-3 py-2 font-mono text-xs font-black uppercase tracking-[0.14em] shadow-nav">
          Best 18
        </span>
      </div>

      <div className="mt-5 grid grid-cols-7 gap-2.5" aria-label="Last seven days streak calendar">
        {STREAK_DAYS.map(([day, active]) => (
          <div key={day} className="text-center">
            <div className={cn('brutal-border mx-auto grid h-8 w-8 place-items-center font-mono text-[10px] font-black shadow-nav', active ? 'bg-moss text-paper' : 'bg-paper text-ink')}>
              {active ? '✓' : '·'}
            </div>
            <p className="mt-1 font-mono text-[9px] font-black uppercase">{day}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}

function LevelCard() {
  const currentLevel = LEVEL_ROWS[2];
  const nextLevel = LEVEL_ROWS[3];
  const progress = Math.round(((currentPoints - currentLevel.points) / (nextLevel.points - currentLevel.points)) * 100);

  return (
    <Card padding="md" className="bg-white">
      <p className="label-mono text-aizome">Level</p>
      <div className="mt-3 brutal-border bg-mustard p-4 text-center shadow-nav">
        <p className="font-display text-3xl">{currentLevel.name}</p>
        <p className="mt-1 font-mono text-xs font-black uppercase tracking-[0.12em]">
          {currentPoints} XP · {nextLevel.points - currentPoints} until {nextLevel.name}
        </p>
      </div>
      <div className="mt-4">
        <SegmentedProgress value={progress} segments={10} />
      </div>
      <div className="mt-4 flex items-center justify-between font-mono text-[10px] font-black uppercase tracking-[0.12em] text-ink/65">
        <span>{currentLevel.name}</span>
        <span>{nextLevel.name}</span>
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

function SegmentedProgress({ segments, value }) {
  const filled = Math.round((Math.max(0, Math.min(100, value)) / 100) * segments);

  return (
    <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${segments}, minmax(0, 1fr))` }}>
      {Array.from({ length: segments }, (_, index) => (
        <span key={index} className={cn('h-4 brutal-border shadow-nav', index < filled ? 'bg-moss' : 'bg-paper')} aria-hidden="true" />
      ))}
    </div>
  );
}
