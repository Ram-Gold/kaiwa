import { useEffect, useState } from 'react';
import Button from '../ui/Button.jsx';
import Card from '../ui/Card.jsx';

export const PROVIDER_STORAGE_KEY = 'kaiwa.ai.provider';
export const API_KEYS_STORAGE_PREFIX = 'kaiwa.ai.apiKey.';

export function loadStoredProvider() {
  return localStorage.getItem(PROVIDER_STORAGE_KEY) || 'ollama';
}

export function loadStoredApiKeys() {
  return {
    openai: localStorage.getItem(`${API_KEYS_STORAGE_PREFIX}openai`) || '',
    gemini: localStorage.getItem(`${API_KEYS_STORAGE_PREFIX}gemini`) || '',
    claude: localStorage.getItem(`${API_KEYS_STORAGE_PREFIX}claude`) || '',
  };
}

export default function AiProviderSettingsCard({
  provider,
  apiKeys,
  onSettingsSaved,
}) {
  const [draftProvider, setDraftProvider] = useState(provider);
  const [draftKey, setDraftKey] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Synchronize draft provider and key from props on initial load/change
  useEffect(() => {
    setDraftProvider(provider);
  }, [provider]);

  // Load key specifically when draftProvider or apiKeys change
  useEffect(() => {
    if (draftProvider === 'ollama') {
      setDraftKey('');
    } else {
      setDraftKey(apiKeys[draftProvider] || '');
    }
    // Clear notifications on provider switch
    setError('');
    setSuccess('');
  }, [draftProvider, apiKeys]);

  // Live validation function
  const getValidationError = (prov, key) => {
    if (prov === 'ollama') {
      return '';
    }
    const cleanKey = key.trim();
    if (!cleanKey) {
      return 'API key required';
    }
    if (prov === 'openai' && !cleanKey.startsWith('sk-')) {
      return 'Invalid key format';
    }
    if (prov === 'gemini' && !cleanKey.startsWith('AIza') && !cleanKey.startsWith('AQ')) {
      return 'Invalid key format';
    }
    if (prov === 'claude' && !cleanKey.startsWith('sk-ant-')) {
      return 'Invalid key format';
    }
    return '';
  };

  // Compute validation error live
  const validationError = getValidationError(draftProvider, draftKey);
  const isSaveDisabled = Boolean(validationError);

  function handleSave(event) {
    event.preventDefault();
    if (isSaveDisabled) return;

    const cleanKey = draftKey.trim();

    // Persist to localStorage
    localStorage.setItem(PROVIDER_STORAGE_KEY, draftProvider);
    if (draftProvider !== 'ollama') {
      localStorage.setItem(`${API_KEYS_STORAGE_PREFIX}${draftProvider}`, cleanKey);
    }

    // Prepare updated API keys object for parent callback
    const updatedKeys = { ...apiKeys };
    if (draftProvider !== 'ollama') {
      updatedKeys[draftProvider] = cleanKey;
    }

    setSuccess('Settings saved successfully!');
    setError('');

    // Trigger parent callback to update App-level state
    onSettingsSaved(draftProvider, updatedKeys);
  }

  function handleClearKey() {
    if (draftProvider === 'ollama') return;

    localStorage.removeItem(`${API_KEYS_STORAGE_PREFIX}${draftProvider}`);
    setDraftKey('');
    setSuccess('');

    const updatedKeys = {
      ...apiKeys,
      [draftProvider]: '',
    };
    onSettingsSaved(draftProvider, updatedKeys);
  }

  const isConnected = draftProvider === 'ollama' || Boolean(apiKeys[draftProvider]);

  return (
    <Card className="p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="label-mono text-shu">Connect your AI</p>
          <h2 className="mt-2 font-display text-3xl">Provider settings</h2>
        </div>
        {isConnected && (
          <span className="brutal-border bg-moss px-3 py-2 font-mono text-xs font-black uppercase tracking-[0.16em] text-paper">
            ✓ Configured
          </span>
        )}
      </div>

      <p className="mt-4 rounded-base border-l-[6px] border-shu bg-white/60 p-3 text-sm font-bold leading-6">
        Local-first notice: Ollama runs completely offline in your environment.
        External keys are saved securely in your browser localStorage and are
        never sent to any intermediary server.
      </p>

      <form className="mt-5 space-y-4" onSubmit={handleSave}>
        <div>
          <label htmlFor="ai-provider-select" className="label-mono block font-bold">
            Select Provider
          </label>
          <select
            id="ai-provider-select"
            value={draftProvider}
            onChange={(e) => {
              setDraftProvider(e.target.value);
              setSuccess('');
            }}
            className="brutal-border mt-2 w-full bg-paper px-4 py-3 font-mono text-sm font-bold shadow-shadow"
          >
            <option value="ollama">Ollama (Local)</option>
            <option value="openai">OpenAI</option>
            <option value="gemini">Gemini</option>
            <option value="claude">Claude</option>
          </select>
        </div>

        {draftProvider !== 'ollama' && (
          <div>
            <label htmlFor="api-key-input" className="label-mono block font-bold">
              API Key
            </label>
            <input
              id="api-key-input"
              type="text"
              value={draftKey}
              onChange={(e) => {
                setDraftKey(e.target.value);
                setSuccess('');
              }}
              placeholder={
                draftProvider === 'openai'
                  ? 'sk-...'
                  : draftProvider === 'gemini'
                  ? 'AIzaSy... / AQ...'
                  : 'sk-ant-...'
              }
              autoComplete="off"
              aria-describedby={validationError ? 'api-key-error' : undefined}
              className="brutal-border mt-2 w-full bg-paper px-4 py-3 font-mono text-sm font-bold shadow-shadow"
            />
          </div>
        )}

        {validationError && (
          <p
            id="api-key-error"
            role="alert"
            className="font-mono text-sm font-black text-shu"
          >
            {validationError}
          </p>
        )}

        {success && (
          <p
            role="status"
            aria-live="polite"
            className="font-mono text-sm font-black text-moss"
          >
            {success}
          </p>
        )}

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button type="submit" disabled={isSaveDisabled}>
            Save settings
          </Button>
          {draftProvider !== 'ollama' && apiKeys[draftProvider] && (
            <Button type="button" variant="ghost" onClick={handleClearKey}>
              Remove key
            </Button>
          )}
        </div>
      </form>
    </Card>
  );
}
