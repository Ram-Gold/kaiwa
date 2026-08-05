import Badge from './Badge.jsx';
import Card from './Card.jsx';

export default function StatCard({ accent = 'mustard', label, meta, value }) {
  return (
    <Card padding="md" className="relative overflow-hidden">
      <div
        className={`absolute right-[-18px] top-[-18px] h-20 w-20 rotate-12 brutal-border ${accentClass(accent)}`}
        aria-hidden="true"
      />
      <Badge tone={accent === 'correction' ? 'correction' : accent === 'moss' ? 'moss' : 'mustard'}>
        {label}
      </Badge>
      <p className="mt-5 font-display text-5xl leading-none sm:text-6xl">{value}</p>
      {meta && <p className="mt-3 max-w-xs font-semibold leading-6">{meta}</p>}
    </Card>
  );
}

function accentClass(accent) {
  if (accent === 'correction') return 'bg-correction';
  if (accent === 'moss') return 'bg-moss';
  if (accent === 'aizome') return 'bg-aizome';
  return 'bg-mustard';
}
