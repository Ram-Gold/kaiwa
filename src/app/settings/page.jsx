'use client';

import React, { useState, useEffect } from 'react';
import { 
  IoPersonCircleSharp, 
  IoHardwareChipSharp, 
  IoMicSharp, 
  IoEyeSharp, 
  IoShieldCheckmarkSharp, 
  IoKeySharp,
  IoCodeWorkingSharp,
  IoCardSharp
} from 'react-icons/io5';
import { cn } from '../../lib/utils.js';
import ProfileSettings from '../../components/settings/ProfileSettings.jsx';
import SubscriptionSettings from '../../components/settings/SubscriptionSettings.jsx';
import DeveloperSettings from '../../components/settings/DeveloperSettings.jsx';
import CreditsSettingsView from '../../components/settings/CreditsSettings.jsx';
import { 
  ApiProvidersSettings, 
  EnginesSettings, 
  PrivacySettings, 
  RoleplaySettings, 
  DisplaySettings 
} from '../../components/shell/GlobalSettingsModal.jsx';
import { useAuth } from '../../lib/auth/AuthContext.jsx';
import { hasPermission, PERMISSIONS } from '../../lib/auth/rbac.js';

function getLocalStorage() {
  if (typeof window === 'undefined') return null;
  return window.localStorage ?? null;
}

export default function SettingsPage() {
  const { user, profile } = useAuth();
  const [simulatedRole, setSimulatedRole] = useState(null);

  useEffect(() => {
    const storage = getLocalStorage();
    if (storage) {
      setSimulatedRole(storage.getItem?.('kaiwa.dev.simulated_role') || null);
      const handleRoleChange = () => {
        setSimulatedRole(storage.getItem?.('kaiwa.dev.simulated_role') || null);
      };
      window.addEventListener('kaiwa:role-changed', handleRoleChange);
      return () => window.removeEventListener('kaiwa:role-changed', handleRoleChange);
    }
  }, []);

  const realUserOrProfile = profile || user;
  const isRealDeveloper = hasPermission(realUserOrProfile, PERMISSIONS.VIEW_DEVELOPER_OPTIONS);
  const activeUserOrProfile = simulatedRole || realUserOrProfile;
  const canAccessDevOptions = isRealDeveloper || hasPermission(activeUserOrProfile, PERMISSIONS.VIEW_DEVELOPER_OPTIONS);

  const categories = [
    { id: 'profile', label: 'Profile Settings', icon: IoPersonCircleSharp, component: ProfileSettings },
    { id: 'subscription', label: 'Subscription', icon: IoCardSharp, component: SubscriptionSettings },
    { id: 'api', label: 'API Providers', icon: IoKeySharp, component: ApiProvidersSettings },
    { id: 'engines', label: 'Engines (TTS/STT)', icon: IoMicSharp, component: EnginesSettings },
    { id: 'privacy', label: 'About me & Privacy', icon: IoShieldCheckmarkSharp, component: PrivacySettings },
    { id: 'roleplay', label: 'Roleplay', icon: IoHardwareChipSharp, component: RoleplaySettings },
    { id: 'display', label: 'Display & Sound', icon: IoEyeSharp, component: DisplaySettings },
    { id: 'credits', label: 'Credits', icon: IoCardSharp, component: CreditsSettingsView },
  ];

  if (canAccessDevOptions) {
    categories.push({ id: 'dev', label: 'Developer Options', icon: IoCodeWorkingSharp, component: DeveloperSettings });
  }

  const [activeTab, setActiveTab] = useState(categories[0].id);

  // If the active tab was dev but we lost access, fallback to first tab
  useEffect(() => {
    if (!categories.find(c => c.id === activeTab)) {
      setActiveTab(categories[0].id);
    }
  }, [activeTab, categories]);

  const ActiveComponent = categories.find(c => c.id === activeTab)?.component || ProfileSettings;

  return (
    <div className="font-sans text-ink flex flex-col h-full max-w-6xl mx-auto">
      <header className="mb-8">
        <h1 className="font-display text-4xl md:text-5xl">Settings</h1>
        <p className="font-mono text-sm font-bold text-shu mt-2">Manage your KAIwa experience</p>
      </header>

      <div className="flex flex-col md:flex-row gap-8 flex-1">
        <aside className="w-full md:w-64 shrink-0">
          <nav className="flex flex-col gap-2">
            {categories.map(category => (
              <button
                key={category.id}
                onClick={() => setActiveTab(category.id)}
                className={cn(
                  'flex w-full items-center gap-3 rounded-xl px-4 py-3 font-mono text-sm font-black uppercase tracking-[0.12em] transition-all duration-150 text-left brutal-border',
                  activeTab === category.id 
                    ? 'bg-mustard text-ink translate-x-[2px] translate-y-[2px] shadow-none' 
                    : 'bg-white text-ink shadow-nav hover:-translate-y-1 hover:shadow-[5px_5px_0px_0px_#1C1C1C] hover:bg-mustard',
                  category.id === 'dev' && (activeTab === category.id ? 'border-l-[6px] border-l-correction' : 'hover:border-l-correction')
                )}
              >
                <category.icon className="text-xl shrink-0" />
                <span className="text-left">{category.label}</span>
              </button>
            ))}
          </nav>
        </aside>

        <main className="flex-1 bg-white brutal-border rounded-[28px] [corner-smoothing:100%] [-webkit-corner-smoothing:100%] p-6 md:p-8 shadow-nav min-h-[500px]">
          <ActiveComponent />
        </main>
      </div>
    </div>
  );
}
