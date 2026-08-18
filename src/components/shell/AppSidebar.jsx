'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Fragment, useCallback, useRef } from 'react';
import { Drama } from 'lucide-react';
import { HistoryIcon } from '../ui/history.jsx';
import { HomeIcon } from '../ui/home.jsx';
import { SettingsIcon } from '../ui/settings.jsx';
import { UserIcon } from '../ui/user.jsx';

import LogoMark from '../ui/LogoMark.jsx';
import { cn } from '../../lib/utils.js';
import { useAuth } from '../../lib/auth/AuthContext.jsx';

export const NAV_ITEMS = [
  ['Home', '/', HomeIcon],
  ['Roleplay', '/roleplay', Drama],
  ['Past Practice', '/history', HistoryIcon],
  ['Profile', '/profile', UserIcon],
  ['Settings', '/settings', SettingsIcon],
];

export default function AppSidebar({ onRequestExit }) {
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useAuth();

  const handleLogout = async () => {
    await logout(); // Signs out of Firebase — clears the auth session
    router.push('/login');
  };

  const handleNavClick = (e, targetHref) => {
    if (onRequestExit) {
      e.preventDefault();
      onRequestExit(() => router.push(targetHref));
    }
  };

  return (
    <aside className="border-b-2 border-border/20 bg-transparent p-5 text-ink lg:sticky lg:top-0 lg:min-h-screen lg:border-b-0 lg:border-r-2 lg:border-border/40 lg:px-6">
      <Link
        href="/"
        className="group flex items-center gap-3"
        onClick={(e) => handleNavClick(e, '/')}
      >
        <LogoMark className="brutal-border rounded-2xl h-14 w-14 rotate-[-7deg] shadow-shadow transition-transform group-hover:rotate-0" />
        <div>
          <p className="font-display text-3xl leading-none text-ink">Kaiwa</p>
          <p className="label-mono mt-1 text-ink/60 font-bold">Study notebook</p>
        </div>
      </Link>

      <nav className="mt-8 flex gap-2 overflow-x-auto pb-2 lg:flex-col lg:overflow-visible lg:pb-0" aria-label="Primary navigation">
        {NAV_ITEMS.map(([label, href, Icon]) => {
          const isActive = href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`);

          if (label === 'Settings') {
            return (
              <Fragment key={label}>
                <div className="my-3 border-t-2 border-border/20 hidden lg:block" />
                <NavItem
                  as="button"
                  label={label}
                  Icon={null}
                  className="flex whitespace-nowrap rounded-xl bg-transparent px-4 py-2.5 text-left font-mono text-sm font-black uppercase tracking-[0.12em] text-ink/70 transition-colors hover:text-mustard hover:bg-black/5 lg:w-full lg:items-center justify-center lg:justify-start"
                  onClick={() => {
                    const action = () => router.push('/settings');
                    if (onRequestExit) onRequestExit(action);
                    else action();
                  }}
                />
                <NavItem
                  as="button"
                  label="Log Out"
                  Icon={null}
                  className="flex whitespace-nowrap rounded-xl bg-transparent px-4 py-2.5 text-left font-mono text-sm font-black uppercase tracking-[0.12em] text-ink/70 transition-colors hover:text-shu hover:bg-black/5 lg:w-full lg:items-center justify-center lg:justify-start"
                  onClick={() => {
                    const action = () => handleLogout();
                    if (onRequestExit) onRequestExit(action);
                    else action();
                  }}
                />
              </Fragment>
            );
          }

          return (
            <NavItem
              key={label}
              href={href}
              label={label}
              Icon={Icon}
              active={isActive}
              onClick={(e) => handleNavClick(e, href)}
              className={cn(
                'flex whitespace-nowrap rounded-xl px-4 py-3 font-mono text-sm font-black uppercase tracking-[0.12em] transition-all lg:w-full lg:items-center lg:gap-3',
                isActive
                  ? 'brutal-border bg-mustard text-ink shadow-nav'
                  : 'border-2 border-transparent text-ink/70 hover:border-border/30 hover:bg-black/5 hover:text-ink',
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

  const icon = Icon ? <Icon ref={iconRef} aria-hidden="true" className={cn('shrink-0', iconClassName)} size={20} /> : null;
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
