'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { PROVIDER_STORAGE_KEY, API_KEYS_STORAGE_PREFIX } from '../dashboard/AiProviderSettingsCard.jsx';
import GlobalSettingsModal from './GlobalSettingsModal.jsx';
import Button from '../ui/Button.jsx';
import { IoWarningSharp } from 'react-icons/io5';

// Set to true to bypass the lock screen entirely for testing
const FORCE_UNLOCK = true;

export default function ApiGuard({ children }) {
  const pathname = usePathname();
  const [isLocked, setIsLocked] = useState(false);
  const [showSetup, setShowSetup] = useState(false);
  
  // Guard Home (/) and Roleplay (/roleplay)
  const isGuardedRoute = pathname === '/' || pathname === '/roleplay' || pathname.startsWith('/roleplay/');

  useEffect(() => {
    function checkKeys() {
      if (FORCE_UNLOCK) {
        setIsLocked(false);
        return;
      }
      
      const provider = localStorage.getItem(PROVIDER_STORAGE_KEY) || 'ollama';
      if (provider === 'ollama' || provider === 'lmstudio') {
        setIsLocked(false);
        setShowSetup(false);
        return;
      }

      const key = localStorage.getItem(`${API_KEYS_STORAGE_PREFIX}${provider}`);
      if (!key || !key.trim()) {
        setIsLocked(true);
      } else {
        setIsLocked(false);
        setShowSetup(false);
      }
    }

    checkKeys();
    window.addEventListener('kaiwa:provider-updated', checkKeys);
    return () => window.removeEventListener('kaiwa:provider-updated', checkKeys);
  }, [pathname]);

  if (isLocked && isGuardedRoute) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-aizome p-5 text-paper">
        <div className="brutal-border max-w-md bg-white p-8 text-center text-ink shadow-shadow">
          <IoWarningSharp className="mx-auto h-16 w-16 text-shu" />
          <h2 className="mt-4 font-display text-3xl">Setup Required</h2>
          <p className="mt-3 font-bold leading-6">
            You need to configure an AI provider (Ollama or a Cloud API Key) to access the home and roleplay features.
          </p>
          <Button className="mt-6 w-full" onClick={() => setShowSetup(true)}>
            Open Setup
          </Button>
        </div>
        {showSetup && <GlobalSettingsModal onClose={null} />}
      </div>
    );
  }

  return children;
}
