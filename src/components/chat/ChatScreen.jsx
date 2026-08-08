import { useMemo, useState, useEffect } from 'react';
import { sendMessage, translateMessage } from '../../lib/ai.js';
import { getPersonaById } from '../../prompts/personas.js';
import Button from '../ui/Button.jsx';
import ChatBubble from './ChatBubble.jsx';
import SuggestionChips from './SuggestionChips.jsx';
import { DictionaryPopover } from './JapaneseText.jsx';
import { useAuth } from '../../lib/auth/AuthContext';
import { saveChatSession } from '../../lib/firebase/firestore';

let messageCounter = 0;

export default function ChatScreen({ provider, apiKey, personaId, onBackToDashboard }) {
  const persona = useMemo(() => getPersonaById(personaId), [personaId]);
  const [messages, setMessages] = useState(() => [
    createMessage('assistant', getOpeningLine(persona)),
  ]);
  const [input, setInput] = useState('');
  const [isOptionsOpen, setIsOptionsOpen] = useState(true);
  const [suggestions, setSuggestions] = useState([
    'こんにちは！',
    '今日は日本語を練習したいです。',
    'ゆっくり話してください。',
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [translations, setTranslations] = useState({});
  const [translatingIds, setTranslatingIds] = useState({});
  const [activeDictionaryEntry, setActiveDictionaryEntry] = useState(null);
  
  const { user } = useAuth();
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    function handleShowDictionary(event) {
      const incoming = event.detail;
      setActiveDictionaryEntry((current) => (current?.term === incoming?.term ? null : incoming));
    }
    window.addEventListener('kaiwa:show-dictionary', handleShowDictionary);
    return () => window.removeEventListener('kaiwa:show-dictionary', handleShowDictionary);
  }, []);

  async function submitMessage(messageText) {
    const cleanMessage = messageText.trim();
    if (!cleanMessage || isLoading) {
      return;
    }

    const historyForApi = messages.filter((message) =>
      ['user', 'assistant'].includes(message.role),
    );
    const userMessage = createMessage('user', cleanMessage);

    setMessages((current) => [...current, userMessage]);
    setInput('');
    setSuggestions([]);
    setIsLoading(true);

    try {
      const reply = await sendMessage(provider, apiKey, persona, historyForApi, cleanMessage);
      setMessages((current) => [
        ...current,
        createMessage('assistant', reply.text),
      ]);
      setSuggestions(reply.suggestions);
    } catch (error) {
      setMessages((current) => [
        ...current,
        {
          id: `error-${Date.now()}`,
          role: 'error',
          content:
            error?.userMessage ||
            'Something went wrong while contacting the AI provider. Try again.',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }

  function handleSubmit(event) {
    event.preventDefault();
    submitMessage(input);
  }

  function resetConversation() {
    setMessages([createMessage('assistant', getOpeningLine(persona))]);
    setInput('');
    setTranslations({});
    setTranslatingIds({});
    setSuggestions([
      'こんにちは！',
      '今日は日本語を練習したいです。',
      'ゆっくり話してください。',
    ]);
  }

  async function handleSaveSession() {
    if (!user || messages.length <= 1) return;
    try {
      setIsSaving(true);
      await saveChatSession(user.uid, {
        title: persona?.name || 'Free Chat',
        type: persona?.id === 'sensei' ? 'Lesson' : 'Roleplay',
        learnerRole: 'Learner',
        aiRole: persona?.name || 'AI',
        score: 0,
        grade: 'Unrated',
        duration: '00:00',
        summary: 'Saved conversation',
        corrections: [],
        tags: [],
        metrics: [],
        transcript: messages.map(m => ({ speaker: m.role === 'assistant' ? 'KAIwa' : 'You', text: m.content })),
      });
      alert('Session saved to History!');
    } catch (err) {
      console.error(err);
      alert('Failed to save session.');
    } finally {
      setIsSaving(false);
    }
  }

  async function translateAiMessage(message) {
    if (!message?.id || translatingIds[message.id]) {
      return;
    }

    setTranslatingIds((current) => ({ ...current, [message.id]: true }));

    try {
      const english = await translateMessage(provider, apiKey, message.content);
      setTranslations((current) => ({ ...current, [message.id]: english }));
    } catch (error) {
      setTranslations((current) => ({
        ...current,
        [message.id]:
          error?.userMessage ||
          'Could not translate this message. Check your settings and try again.',
      }));
    } finally {
      setTranslatingIds((current) => ({ ...current, [message.id]: false }));
    }
  }

  if (!persona) {
    return (
      <main className="screen-shell">
        <div className="brutal-border bg-shu p-5 font-bold text-paper shadow-shadow">
          <p className="label-mono mb-2 text-paper opacity-80">Error</p>
          Persona not found.
        </div>
        <Button className="mt-5" onClick={onBackToDashboard}>
          Back to dashboard
        </Button>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-4xl relative">
      {activeDictionaryEntry && (
        <div className="absolute right-full mr-6 top-8 z-50 hidden md:block">
          <DictionaryPopover entry={activeDictionaryEntry} onClose={() => setActiveDictionaryEntry(null)} />
        </div>
      )}

      {/* Mobile Overlay version */}
      {activeDictionaryEntry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 md:hidden">
          <DictionaryPopover entry={activeDictionaryEntry} onClose={() => setActiveDictionaryEntry(null)} />
        </div>
      )}

      <header className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="label-mono text-shu">Roleplay chat</p>
          <h1 className="font-display text-4xl sm:text-6xl">
            {persona.icon} {persona.name} <span className="text-shu">{persona.jp}</span>
          </h1>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          {user && messages.length > 1 && (
            <Button variant="ghost" onClick={handleSaveSession} disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save Session'}
            </Button>
          )}
          <Button variant="ghost" onClick={resetConversation}>
            Reset conversation
          </Button>
          <Button variant="secondary" onClick={onBackToDashboard}>
            Dashboard
          </Button>
        </div>
      </header>

      <section className="brutal-border flex min-h-[58vh] flex-1 flex-col bg-white/60 p-3 shadow-shadow sm:p-5">
        <div className="flex-1 space-y-4 overflow-y-auto pr-1">
          {messages.map((message, index) => (
            <ChatBubble
              key={message.id || `${message.role}-${index}`}
              isTranslating={Boolean(translatingIds[message.id])}
              message={message}
              onPickSuggestion={submitMessage}
              onTranslate={message.role === 'assistant' ? translateAiMessage : undefined}
              persona={persona}
              translation={translations[message.id]}
            />
          ))}

          {isLoading && (
            <div className="flex animate-message-in justify-start">
              <div className="brutal-border grid h-11 w-11 shrink-0 place-items-center rounded-full bg-mustard font-display text-sm text-ink shadow-shadow">
                {persona.icon}
              </div>
              <div className="brutal-border max-w-[72%] bg-paper px-4 py-3 font-mono text-sm font-black shadow-shadow">
                <span className="typing-dots" aria-hidden="true">
                  <span>.</span>
                  <span>.</span>
                  <span>.</span>
                </span>
              </div>
            </div>
          )}
        </div>

        <form className="mt-5 space-y-3" onSubmit={handleSubmit}>
          {isOptionsOpen && suggestions.length > 0 && (
            <div className="flex justify-end">
              <div className="animate-panel-in flex max-w-[90vw] flex-col items-end gap-2 sm:max-w-md">
                <p className="label-mono text-ai">Reply options</p>
                <SuggestionChips
                  disabled={isLoading}
                  suggestions={suggestions}
                  onPickSuggestion={submitMessage}
                />
              </div>
            </div>
          )}
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="label-mono text-ai">
              Reply options: {isOptionsOpen ? 'shown' : 'hidden'}
            </p>
            <button
              type="button"
              onClick={() => setIsOptionsOpen((prev) => !prev)}
              className="brutal-border w-fit bg-paper px-3 py-2 font-mono text-xs font-black uppercase tracking-[0.14em] shadow-shadow transition-all hover:translate-x-boxShadowX hover:translate-y-boxShadowY hover:shadow-none hover:bg-mustard"
            >
              {isOptionsOpen ? 'Hide options' : 'Show options'}
            </button>
          </div>
          <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
            <textarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="日本語で入力してください..."
              rows={2}
              disabled={isLoading}
              className="brutal-border w-full resize-none bg-paper px-4 py-3 font-semibold shadow-shadow disabled:opacity-50"
            />
            <button
              type="submit"
              aria-label="Send message"
              title="Send message"
              disabled={isLoading || !input.trim()}
              className="brutal-border grid h-14 w-full place-items-center bg-shu text-2xl text-paper shadow-shadow transition-all hover:translate-x-boxShadowX hover:translate-y-boxShadowY hover:shadow-none disabled:cursor-not-allowed disabled:opacity-50 sm:w-16"
            >
              ➤
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}

function createMessage(role, content) {
  messageCounter += 1;
  return {
    id: `${role}-${Date.now()}-${messageCounter}`,
    role,
    content,
  };
}

function getOpeningLine(persona) {
  if (!persona) {
    return 'こんにちは！会話を始めましょう。';
  }

  if (persona.id === 'sensei') {
    return 'こんにちは！今日は何を練習したいですか？';
  }

  if (persona.id === 'crush') {
    return 'やっほー。今日、少し日本語で話さない？';
  }

  return 'こんにちは〜！来てくれてありがとう。今日は何の話をする？';
}
