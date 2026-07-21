import { useMemo, useState } from 'react';
import { sendMessage, translateMessage } from '../../lib/openrouter.js';
import { getPersonaById } from '../../prompts/personas.js';
import Button from '../ui/Button.jsx';
import ChatBubble from './ChatBubble.jsx';
import SuggestionChips from './SuggestionChips.jsx';

let messageCounter = 0;

export default function ChatScreen({ apiKey, personaId, onBackToDashboard }) {
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
      const reply = await sendMessage(apiKey, persona, historyForApi, cleanMessage);
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
            'Something went wrong while contacting OpenRouter. Try again.',
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

  async function translateAiMessage(message) {
    if (!message?.id || translatingIds[message.id]) {
      return;
    }

    setTranslatingIds((current) => ({ ...current, [message.id]: true }));

    try {
      const english = await translateMessage(apiKey, message.content);
      setTranslations((current) => ({ ...current, [message.id]: english }));
    } catch (error) {
      setTranslations((current) => ({
        ...current,
        [message.id]:
          error?.userMessage ||
          'Could not translate this message. Check your key and try again.',
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
    <main className="screen-shell flex min-h-screen flex-col">
      <header className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="label-mono text-shu">Roleplay chat</p>
          <h1 className="font-display text-4xl sm:text-6xl">
            {persona.icon} {persona.name} <span className="text-shu">{persona.jp}</span>
          </h1>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
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
