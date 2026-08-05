'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Card from '../ui/Card.jsx';
import LogoMark from '../ui/LogoMark.jsx';
import { cn } from '../../lib/utils.js';

export const NAV_ITEMS = [
  ['Home', '/'],
  ['Roleplay', '/roleplay'],
  ['Past Practice', '/dashboard'],
  ['Profile', '/dashboard'],
  ['Settings', '/dashboard'],
];

export default function AppSidebar() {
  const pathname = usePathname();

  return (
    <aside className="border-b-2 border-border bg-aizome p-5 text-paper lg:sticky lg:top-0 lg:min-h-screen lg:border-b-0 lg:border-r-2">
      <Link href="/" className="group flex items-center gap-3">
        <LogoMark className="brutal-border h-16 w-16 rotate-[-7deg] shadow-shadow transition-transform group-hover:rotate-0" />
        <div>
          <p className="font-display text-4xl leading-none">Kaiwa</p>
          <p className="label-mono mt-1 text-mustard">Study notebook</p>
        </div>
      </Link>

      <nav className="mt-8 flex gap-2 overflow-x-auto pb-2 lg:flex-col lg:overflow-visible lg:pb-0" aria-label="Primary navigation">
        {NAV_ITEMS.map(([label, href]) => {
          const isActive = href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`);

          return (
            <Link
              key={label}
              href={href}
              aria-current={isActive ? 'page' : undefined}
              className={cn(
                'brutal-border whitespace-nowrap bg-paper px-4 py-3 font-mono text-sm font-black uppercase tracking-[0.12em] text-ink shadow-nav transition-all hover:translate-x-[3px] hover:translate-y-[3px] hover:bg-mustard hover:shadow-none lg:w-full',
                isActive && 'bg-mustard',
              )}
            >
              {label}
            </Link>
          );
        })}
      </nav>

      <Card padding="sm" className="mt-8 hidden bg-paper text-ink lg:block">
        <p className="label-mono text-correction">Local-first</p>
        <p className="mt-3 text-sm font-bold leading-6">
          Lessons, roleplay progress, streaks, and profile memory are designed to stay on this device.
        </p>
      </Card>
    </aside>
  );
}
