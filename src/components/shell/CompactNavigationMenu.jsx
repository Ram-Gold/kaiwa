'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

import LogoMark from '../ui/LogoMark.jsx';
import { cn } from '../../lib/utils.js';
import { NAV_ITEMS, NavItem } from './AppSidebar.jsx';

export default function CompactNavigationMenu() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed left-4 top-4 z-40 sm:left-6 sm:top-6">
      <button
        type="button"
        aria-label={isOpen ? 'Close navigation menu' : 'Open navigation menu'}
        aria-expanded={isOpen}
        onClick={() => setIsOpen((current) => !current)}
        className={cn(
          'brutal-border grid h-12 w-12 place-items-center bg-aizome text-paper shadow-nav transition-all duration-150 ease-out hover:translate-x-boxShadowX hover:translate-y-boxShadowY hover:bg-mustard hover:text-ink hover:shadow-none',
          isOpen && 'translate-x-boxShadowX translate-y-boxShadowY bg-mustard text-ink shadow-none',
        )}
      >
        <span className="sr-only">{isOpen ? 'Close' : 'Open'} navigation menu</span>
        <span className="flex flex-col gap-1.5" aria-hidden="true">
          <span className="block h-0.5 w-6 bg-current" />
          <span className="block h-0.5 w-6 bg-current" />
          <span className="block h-0.5 w-6 bg-current" />
        </span>
      </button>

      {isOpen ? (
        <div className="animate-panel-in mt-3 w-[min(19rem,calc(100vw-2rem))] brutal-border bg-aizome p-4 text-paper shadow-shadow">
          <Link href="/" className="group flex items-center gap-3" onClick={() => setIsOpen(false)}>
            <LogoMark className="brutal-border h-12 w-12 rotate-[-7deg] shadow-nav transition-transform group-hover:rotate-0" />
            <div>
              <p className="font-display text-3xl leading-none">Kaiwa</p>
              <p className="label-mono mt-1 text-mustard">Study notebook</p>
            </div>
          </Link>

          <nav className="mt-5 grid gap-2" aria-label="Primary navigation">
            {NAV_ITEMS.map(([label, href, Icon]) => {
              const isActive = href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`);

              return label === 'Settings' ? (
                <NavItem
                  key={label}
                  as="button"
                  label={label}
                  Icon={Icon}
                  className="brutal-border flex items-center gap-3 bg-paper px-4 py-3 text-left font-mono text-sm font-black uppercase tracking-[0.12em] text-ink shadow-nav transition-all hover:translate-x-[3px] hover:translate-y-[3px] hover:bg-mustard hover:shadow-none"
                  onClick={() => {
                    setIsOpen(false);
                    window.dispatchEvent(new Event('kaiwa:open-settings'));
                  }}
                />
              ) : (
                <NavItem
                  key={label}
                  active={isActive}
                  href={href}
                  label={label}
                  Icon={Icon}
                  className="brutal-border flex items-center gap-3 bg-paper px-4 py-3 font-mono text-sm font-black uppercase tracking-[0.12em] text-ink shadow-nav transition-all hover:translate-x-[3px] hover:translate-y-[3px] hover:bg-mustard hover:shadow-none"
                  onClick={() => setIsOpen(false)}
                />
              );
            })}
          </nav>
        </div>
      ) : null}

    </div>
  );
}
