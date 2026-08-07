import Card from '../ui/Card.jsx';
import { cn } from '../../lib/utils.js';

export default function AboutPanel({ bio, className = '' }) {
  return (
    <section aria-labelledby="about-heading" className={cn('grid gap-y-4 lg:grid-rows-[auto_18rem]', className)}>
      <h2 id="about-heading" className="font-display text-3xl leading-none">
        About Me
      </h2>
      <Card padding="lg" className="notebook-panel min-h-72 lg:h-full lg:min-h-0">
        <p className="max-w-3xl text-sm font-semibold leading-7 text-ink/75 sm:text-base">{bio}</p>
      </Card>
    </section>
  );
}
