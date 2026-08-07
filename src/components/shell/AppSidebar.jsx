'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCallback, useRef } from 'react';
import { Drama } from 'lucide-react';
import { HistoryIcon } from '../ui/history.jsx';
import { HomeIcon } from '../ui/home.jsx';
import { SettingsIcon } from '../ui/settings.jsx';
import { UserIcon } from '../ui/user.jsx';

import LogoMark from '../ui/LogoMark.jsx';
import { cn } from '../../lib/utils.js';

export const NAV_ITEMS = [
  ['Home', '/', HomeIcon],
  ['Roleplay', '/roleplay', Drama],
  ['Past Practice', '/history', HistoryIcon],
  ['Profile', '/profile', UserIcon],
  ['Settings', '/dashboard', SettingsIcon],
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
        {NAV_ITEMS.map(([label, href, Icon]) => {
          const isActive = href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`);

          if (label === 'Settings') {
            return (
              <NavItem
                key={label}
                as="button"
                label={label}
                Icon={Icon}
                className="brutal-border flex whitespace-nowrap bg-paper px-4 py-3 text-left font-mono text-sm font-black uppercase tracking-[0.12em] text-ink shadow-nav transition-all hover:translate-x-[3px] hover:translate-y-[3px] hover:bg-mustard hover:shadow-none lg:w-full lg:items-center lg:gap-3"
                iconClassName="hidden shrink-0 lg:block"
                onClick={() => window.dispatchEvent(new Event('kaiwa:open-settings'))}
              />
            );
          }

          return (
            <NavItem
              key={label}
              href={href}
              label={label}
              Icon={Icon}
              active={isActive}
              className={cn(
                'brutal-border flex whitespace-nowrap bg-paper px-4 py-3 font-mono text-sm font-black uppercase tracking-[0.12em] text-ink shadow-nav transition-all hover:translate-x-[3px] hover:translate-y-[3px] hover:bg-mustard hover:shadow-none lg:w-full lg:items-center lg:gap-3',
                isActive && 'bg-mustard',
              )}
              iconClassName="hidden shrink-0 lg:block"
            />
          );
        })}
      </nav>


    </aside>
  );
}

function useIconPressAnimation() {
  const iconRef = useRef(null);

  const start = useCallback(() => {
    iconRef.current?.startAnimation?.();
  }, []);

  const stop = useCallback(() => {
    iconRef.current?.stopAnimation?.();
  }, []);

  return { iconRef, start, stop };
}

export function NavItem({
  active = false,
  as = 'link',
  className = '',
  href,
  iconClassName = '',
  Icon,
  label,
  onClick,
}) {
  const { iconRef, start, stop } = useIconPressAnimation();
  const sharedHandlers = {
    onBlur: stop,
    onKeyDown: (event) => {
      if (event.key === 'Enter' || event.key === ' ') start();
    },
    onKeyUp: (event) => {
      if (event.key === 'Enter' || event.key === ' ') stop();
    },
    onPointerCancel: stop,
    onPointerDown: start,
    onPointerLeave: stop,
    onPointerUp: stop,
  };

  const icon = <Icon ref={iconRef} aria-hidden="true" className={cn('shrink-0', iconClassName)} size={20} />;
  const content = (
    <>
      {icon}
      {label}
    </>
  );

  if (as === 'button') {
    return (
      <button type="button" onClick={onClick} className={className} {...sharedHandlers}>
        {content}
      </button>
    );
  }

  return (
    <Link href={href} aria-current={active ? 'page' : undefined} onClick={onClick} className={cn(className, active && 'bg-mustard')} {...sharedHandlers}>
      {content}
    </Link>
  );
}
