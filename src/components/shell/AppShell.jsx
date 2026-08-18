'use client';

import React from 'react';
import { usePathname } from 'next/navigation';

import AppSidebar from './AppSidebar.jsx';
import CompactNavigationMenu from './CompactNavigationMenu.jsx';
import ExerciseHeaderControls from './ExerciseHeaderControls.jsx';
import GlobalSettingsModal from './GlobalSettingsModal.jsx';
import ExitConfirmationModal from './ExitConfirmationModal.jsx';
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
  const isExerciseRoute = isBriefing || isChat;
  const isFocusRoute = isBriefing || isChat || isGrading;
  const isProfileRoute = pathname === '/profile' || pathname.startsWith('/profile/');
  const isSettingsRoute = pathname === '/settings' || pathname.startsWith('/settings/');
  const hasNoRightRail = isFocusRoute || isFriendsRoute || isSettingsRoute;

  const [isSettingsOpen, setIsSettingsOpen] = React.useState(false);
  const [pendingExitAction, setPendingExitAction] = React.useState(null);
  const isAuthRoute = pathname === '/login' || pathname === '/signup';

  React.useEffect(() => {
    function handleOpenSettings() {
      setIsSettingsOpen(true);
    }
    window.addEventListener('kaiwa:open-settings', handleOpenSettings);
    return () => window.removeEventListener('kaiwa:open-settings', handleOpenSettings);
  }, []);

  React.useEffect(() => {
    if (!isExerciseRoute) return;
    function handleBeforeUnload(event) {
      event.preventDefault();
      event.returnValue = '';
      return '';
    }
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isExerciseRoute]);

  const handleRequestExit = (action) => {
    if (isExerciseRoute) {
      setPendingExitAction(() => action);
    } else {
      action();
    }
  };

  const handleConfirmExit = () => {
    const action = pendingExitAction;
    setPendingExitAction(null);
    if (action) action();
  };

  const handleCancelExit = () => {
    setPendingExitAction(null);
  };

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
            : isFriendsRoute || isSettingsRoute
              ? 'lg:grid-cols-[16.5rem_minmax(0,1fr)]'
              : 'lg:grid-cols-[16.5rem_minmax(0,1fr)_20.5rem] xl:grid-cols-[17rem_minmax(0,1fr)_21.5rem]',
        )}
      >
        {isExerciseRoute ? (
          <ExerciseHeaderControls onRequestExit={handleRequestExit} />
        ) : isFocusRoute ? (
          <CompactNavigationMenu onRequestExit={undefined} />
        ) : (
          <AppSidebar onRequestExit={undefined} />
        )}
        <main className={cn('min-w-0 px-4 py-6 sm:px-6 lg:px-8 lg:py-10', isBriefing && 'lg:px-10', (isChat || isGrading) && 'p-0 sm:p-0 lg:p-0')}>
          {children}
        </main>
        {hasNoRightRail ? null : isProfileRoute ? <ProfileRail profile={defaultProfile} /> : <ProgressRail />}
        {isSettingsOpen && pathname !== '/settings' && <GlobalSettingsModal onClose={() => setIsSettingsOpen(false)} />}
        <ExitConfirmationModal
          isOpen={Boolean(pendingExitAction)}
          onConfirm={handleConfirmExit}
          onCancel={handleCancelExit}
        />
      </div>
    </ApiGuard>
  );
}
