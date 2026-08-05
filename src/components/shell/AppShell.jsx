'use client';

import { usePathname } from 'next/navigation';

import AppSidebar from './AppSidebar.jsx';
import CompactNavigationMenu from './CompactNavigationMenu.jsx';
import ProgressRail from './ProgressRail.jsx';
import { cn } from '../../lib/utils.js';

export default function AppShell({ children }) {
  const pathname = usePathname();
  const isBriefing = pathname === '/briefing' || pathname.startsWith('/briefing/');

  return (
    <div
      className={cn(
        'grid min-h-screen bg-paper text-ink',
        isBriefing ? 'grid-cols-1' : 'lg:grid-cols-[17rem_minmax(0,1fr)_18rem]',
      )}
    >
      {isBriefing ? <CompactNavigationMenu /> : <AppSidebar />}
      <main className={cn('min-w-0 px-4 py-6 sm:px-6 lg:px-8 lg:py-10', isBriefing && 'lg:px-10')}>
        {children}
      </main>
      {isBriefing ? null : <ProgressRail />}
    </div>
  );
}
