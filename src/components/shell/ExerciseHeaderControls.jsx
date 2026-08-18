'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { IoCloseSharp, IoSettingsSharp } from 'react-icons/io5';
import SessionSettingsModal from './SessionSettingsModal.jsx';
import { cn } from '../../lib/utils.js';

export default function ExerciseHeaderControls({ onRequestExit }) {
  const router = useRouter();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  function handleExitClick() {
    if (onRequestExit) {
      onRequestExit(() => router.push('/'));
    } else {
      router.push('/');
    }
  }

  return (
    <>
      <div className="fixed left-4 top-4 z-40 flex items-center gap-2 sm:left-6 sm:top-6" data-testid="exercise-header-controls">
        {/* Exit 'X' Button */}
        <button
          type="button"
          aria-label="Exit session"
          onClick={handleExitClick}
          className="brutal-border grid h-12 w-12 place-items-center bg-paper text-ink shadow-nav transition-all duration-150 ease-out hover:translate-x-boxShadowX hover:translate-y-boxShadowY hover:bg-shu hover:text-white hover:shadow-none"
        >
          <IoCloseSharp className="text-2xl" />
        </button>

        {/* Settings '⚙️' Button */}
        <button
          type="button"
          aria-label="Open session settings"
          onClick={() => setIsSettingsOpen(true)}
          className={cn(
            'brutal-border grid h-12 w-12 place-items-center bg-paper text-ink shadow-nav transition-all duration-150 ease-out hover:translate-x-boxShadowX hover:translate-y-boxShadowY hover:bg-mustard hover:text-ink hover:shadow-none',
            isSettingsOpen && 'translate-x-boxShadowX translate-y-boxShadowY bg-mustard shadow-none'
          )}
        >
          <IoSettingsSharp className="text-xl" />
        </button>
      </div>

      <SessionSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onRequestExit={handleExitClick}
      />
    </>
  );
}
