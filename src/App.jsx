import { useEffect, useState } from 'react';
import ChatScreen from './components/chat/ChatScreen.jsx';
import DashboardShell from './components/dashboard/DashboardShell.jsx';
import { loadStoredApiKey } from './components/dashboard/ApiKeyCard.jsx';
import LandingPage from './components/landing/LandingPage.jsx';

export default function App() {
  const [view, setView] = useState('landing');
  const [apiKey, setApiKey] = useState('');
  const [selectedPersonaId, setSelectedPersonaId] = useState('');
  const [dashboardNotice, setDashboardNotice] = useState('');

  useEffect(() => {
    setApiKey(loadStoredApiKey());
  }, []);

  function openDashboard(notice = '') {
    setDashboardNotice(notice);
    setView('dashboard');
  }

  function openChat(personaId) {
    if (!apiKey) {
      openDashboard('Save your OpenRouter API key before opening a persona chat.');
      return;
    }

    setSelectedPersonaId(personaId);
    setDashboardNotice('');
    setView('chat');
  }

  if (view === 'chat') {
    return (
      <ChatScreen
        apiKey={apiKey}
        personaId={selectedPersonaId}
        onBackToDashboard={() => openDashboard()}
      />
    );
  }

  if (view === 'dashboard') {
    return (
      <DashboardShell
        apiKey={apiKey}
        notice={dashboardNotice}
        onApiKeySaved={setApiKey}
        onBackHome={() => setView('landing')}
        onSelectPersona={openChat}
      />
    );
  }

  return <LandingPage onEnter={() => openDashboard()} />;
}
