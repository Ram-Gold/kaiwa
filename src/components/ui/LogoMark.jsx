import { cn } from '../../lib/utils.js';

export default function LogoMark({ className = '', label = 'KAIwa logo' }) {
  return (
    <span
      aria-label={label}
      role="img"
      className={cn('inline-grid shrink-0 place-items-center overflow-hidden rounded-base', className)}
    >
      <img
        src="/icon.png"
        alt=""
        className="h-full w-full object-cover"
        draggable="false"
      />
    </span>
  );
}
