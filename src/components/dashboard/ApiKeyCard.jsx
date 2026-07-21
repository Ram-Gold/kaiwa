import { useEffect, useState } from 'react';
import Button from '../ui/Button.jsx';
import Card from '../ui/Card.jsx';

export const API_KEY_STORAGE_KEY = 'kaiwa.openrouter.apiKey';

export function loadStoredApiKey() {
  return localStorage.getItem(API_KEY_STORAGE_KEY) || '';
}

export default function ApiKeyCard({ apiKey, onApiKeySaved }) {
  const [draftKey, setDraftKey] = useState(apiKey);
  const [error, setError] = useState('');

  useEffect(() => {
    setDraftKey(apiKey);
  }, [apiKey]);

  const isConnected = Boolean(apiKey);

  function saveKey(event) {
    event.preventDefault();
    const cleanKey = draftKey.trim();

    if (!cleanKey.startsWith('sk-or-')) {
      setError('OpenRouter keys usually start with sk-or-. Check the key and try again.');
      return;
    }

    localStorage.setItem(API_KEY_STORAGE_KEY, cleanKey);
    setError('');
    onApiKeySaved(cleanKey);
  }

  function clearKey() {
    localStorage.removeItem(API_KEY_STORAGE_KEY);
    setDraftKey('');
    setError('');
    onApiKeySaved('');
  }

  return (
    <Card className="p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="label-mono text-shu">Connect your AI</p>
          <h2 className="mt-2 font-display text-3xl">OpenRouter key</h2>
        </div>
        {isConnected && (
          <span className="brutal-border bg-moss px-3 py-2 font-mono text-xs font-black uppercase tracking-[0.16em] text-paper">
            ✓ Connected
          </span>
        )}
      </div>

      <p className="mt-4 rounded-base border-l-[6px] border-shu bg-white/60 p-3 text-sm font-bold leading-6">
        Local-only disclaimer: this key is saved in your browser localStorage so
        the app can call OpenRouter directly. It is not encrypted. Do not use a
        key you are uncomfortable storing in this browser.
      </p>

      <form className="mt-5 space-y-3" onSubmit={saveKey}>
        <label className="block">
          <span className="label-mono">API key</span>
          <input
            value={draftKey}
            onChange={(event) => setDraftKey(event.target.value)}
            placeholder="sk-or-..."
            autoComplete="off"
            className="brutal-border mt-2 w-full bg-paper px-4 py-3 font-mono text-sm font-bold shadow-shadow"
          />
        </label>

        {error && <p className="font-mono text-sm font-black text-shu">{error}</p>}

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button type="submit">Save key</Button>
          {isConnected && (
            <Button type="button" variant="ghost" onClick={clearKey}>
              Remove key
            </Button>
          )}
        </div>
      </form>
    </Card>
  );
}
