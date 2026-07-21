import { useEffect, useState } from 'react';
import ChatScreen from './components/chat/ChatScreen.jsx';
import DashboardShell from './components/dashboard/DashboardShell.jsx';
import SettingsScreen from './components/dashboard/SettingsScreen.jsx';
import { loadSettings, saveSettings } from './lib/settings.js';
import LandingPage from './components/landing/LandingPage.jsx';

function hasValidCredentials(config) {
  const provider = config?.provider || 'openrouter';
  const providerConfig = config?.[provider];
  if (provider === 'openrouter' || provider === 'openai') {
    return Boolean(providerConfig?.apiKey?.trim());
  }
  if (provider === 'ollama') {
    return Boolean(providerConfig?.baseUrl?.trim() && providerConfig?.model?.trim());
  }
  return false;
}

export default function App() {
  const [view, setView] = useState('landing');
  const [settings, setSettings] = useState({
    provider: 'openrouter',
    openrouter: { apiKey: '', model: 'openrouter/auto' },
    openai: { apiKey: '', model: 'gpt-4o-mini' },
    ollama: { baseUrl: 'http://localhost:11434', model: 'llama3.2' },
  });
  const [selectedPersonaId, setSelectedPersonaId] = useState('');
  const [dashboardNotice, setDashboardNotice] = useState('');

  useEffect(() => {
    setSettings(loadSettings());
  }, []);

  function openDashboard(notice = '') {
    setDashboardNotice(notice);
    setView('dashboard');
  }

  function openChat(personaId) {
    if (!hasValidCredentials(settings)) {
      openDashboard('Configure your AI settings and save credentials before opening a persona chat.');
      return;
    }

    setSelectedPersonaId(personaId);
    setDashboardNotice('');
    setView('chat');
  }

  function handleSaveSettings(updatedSettings) {
    saveSettings(updatedSettings);
    setSettings(updatedSettings);
    setView('dashboard');
  }

  if (view === 'settings') {
    return (
      <SettingsScreen
        settings={settings}
        onSave={handleSaveSettings}
        onCancel={() => setView('dashboard')}
      />
    );
  }

  if (view === 'chat') {
    return (
      <ChatScreen
        settings={settings}
        personaId={selectedPersonaId}
        onBackToDashboard={() => openDashboard()}
      />
    );
  }

  if (view === 'dashboard') {
    return (
      <DashboardShell
        settings={settings}
        notice={dashboardNotice}
        onOpenSettings={() => setView('settings')}
        onBackHome={() => setView('landing')}
        onSelectPersona={openChat}
      />
    );
  }

  return <LandingPage onEnter={() => openDashboard()} />;
}

