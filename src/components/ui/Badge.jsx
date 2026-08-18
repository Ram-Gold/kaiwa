import { cva } from 'class-variance-authority';
import { cn } from '../../lib/utils.js';

const badgeVariants = cva(
  'brutal-border rounded-lg inline-flex w-fit items-center gap-1.5 px-3 py-1.5 font-mono text-xs font-black uppercase tracking-[0.16em] shadow-nav',
  {
    variants: {
      tone: {
        correction: 'bg-correction text-paper',
        mustard: 'bg-mustard text-ink',
        moss: 'bg-moss text-paper',
        aizome: 'bg-aizome text-paper',
        paper: 'bg-paper text-ink',
        white: 'bg-white text-ink',
        ink: 'bg-ink text-paper',
      },
      tilt: {
        none: '',
        left: 'rotate-[-2deg]',
        right: 'rotate-[2deg]',
      },
    },
    defaultVariants: {
      tone: 'mustard',
      tilt: 'none',
    },
  },
);

export default function Badge({ children, className = '', tone, tilt, ...props }) {
  return (
    <span className={cn(badgeVariants({ tone, tilt }), className)} {...props}>
      {children}
    </span>
  );
}
