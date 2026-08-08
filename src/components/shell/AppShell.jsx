'use client';

import React from 'react';
import { usePathname } from 'next/navigation';

import AppSidebar from './AppSidebar.jsx';
import CompactNavigationMenu from './CompactNavigationMenu.jsx';
import GlobalSettingsModal from './GlobalSettingsModal.jsx';
import ApiGuard from './ApiGuard.jsx';
import ProgressRail from './ProgressRail.jsx';
import ProfileRail from '../profile/ProfileRail.jsx';
import { defaultProfile } from '../../data/profile.js';
import { cn } from '../../lib/utils.js';

export default function AppShell({ children }) {
  const pathname = usePathname();
  const isBriefing = pathname === '/briefing' || pathname.startsWith('/briefing/');
  const isChat = pathname === '/chat' || pathname.startsWith('/chat/');
  const isGrading = pathname === '/grading' || pathname.startsWith('/grading/');
  const isFriendsRoute = pathname === '/friends' || pathname.startsWith('/friends/');
  const isFocusRoute = isBriefing || isChat || isGrading;
  const isProfileRoute = pathname === '/profile' || pathname.startsWith('/profile/');
  const hasNoRightRail = isFocusRoute || isFriendsRoute;

  const [isSettingsOpen, setIsSettingsOpen] = React.useState(false);
  const isAuthRoute = pathname === '/login' || pathname === '/signup';

  React.useEffect(() => {
    function handleOpenSettings() {
      setIsSettingsOpen(true);
    }
    window.addEventListener('kaiwa:open-settings', handleOpenSettings);
    return () => window.removeEventListener('kaiwa:open-settings', handleOpenSettings);
  }, []);

  if (isAuthRoute) {
    return <>{children}</>;
  }

  return (
    <ApiGuard>
      <div
        className={cn(
          'grid min-h-screen bg-paper text-ink',
          isFocusRoute
            ? 'grid-cols-1'
            : isFriendsRoute
              ? 'lg:grid-cols-[17rem_minmax(0,1fr)]'
              : 'lg:grid-cols-[17rem_minmax(0,1fr)_18rem]',
        )}
      >
      {isFocusRoute ? <CompactNavigationMenu /> : <AppSidebar />}
      <main className={cn('min-w-0 px-4 py-6 sm:px-6 lg:px-8 lg:py-10', isBriefing && 'lg:px-10', (isChat || isGrading) && 'p-0 sm:p-0 lg:p-0')}>
        {children}
      </main>
      {hasNoRightRail ? null : isProfileRoute ? <ProfileRail profile={defaultProfile} /> : <ProgressRail />}
      {isSettingsOpen && <GlobalSettingsModal onClose={() => setIsSettingsOpen(false)} />}
      </div>
    </ApiGuard>
  );
}
