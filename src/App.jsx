import { useEffect, useState } from 'react';
import ChatScreen from './components/chat/ChatScreen.jsx';
import DashboardShell from './components/dashboard/DashboardShell.jsx';
import {
  loadStoredProvider,
  loadStoredApiKeys,
} from './components/dashboard/AiProviderSettingsCard.jsx';
import LandingPage from './components/landing/LandingPage.jsx';

export default function App() {
  const [view, setView] = useState('landing');
  const [provider, setProvider] = useState('ollama');
  const [apiKeys, setApiKeys] = useState({
    openai: '',
    gemini: '',
    claude: '',
  });
  const [selectedPersonaId, setSelectedPersonaId] = useState('');
  const [dashboardNotice, setDashboardNotice] = useState('');

  useEffect(() => {
    setProvider(loadStoredProvider());
    setApiKeys(loadStoredApiKeys());
  }, []);

  function openDashboard(notice = '') {
    setDashboardNotice(notice);
    setView('dashboard');
  }

  function openChat(personaId) {
    if (provider !== 'ollama' && !apiKeys[provider]) {
      const displayProvider =
        provider === 'openai' ? 'OpenAI' : provider === 'gemini' ? 'Gemini' : 'Claude';
      openDashboard(`Save your ${displayProvider} API key before opening a persona chat.`);
      return;
    }

    setSelectedPersonaId(personaId);
    setDashboardNotice('');
    setView('chat');
  }

  function handleSettingsSaved(newProvider, newKeys) {
    setProvider(newProvider);
    setApiKeys(newKeys);
  }

  if (view === 'chat') {
    return (
      <ChatScreen
        provider={provider}
        apiKey={apiKeys[provider] || ''}
        personaId={selectedPersonaId}
        onBackToDashboard={() => openDashboard()}
      />
    );
  }

  if (view === 'dashboard') {
    return (
      <DashboardShell
        provider={provider}
        apiKeys={apiKeys}
        notice={dashboardNotice}
        onSettingsSaved={handleSettingsSaved}
        onBackHome={() => setView('landing')}
        onSelectPersona={openChat}
      />
    );
  }

  return <LandingPage onEnter={() => openDashboard()} />;
}
