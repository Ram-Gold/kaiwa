import React, { useEffect, useState } from 'react';
import Button from '../ui/Button.jsx';
import Card from '../ui/Card.jsx';
import { useAuth } from '../../lib/auth/AuthContext';
import { saveAiProviderSettings } from '../../lib/firebase/firestore';

export const PROVIDER_STORAGE_KEY = 'kaiwa.ai.provider';
export const API_KEYS_STORAGE_PREFIX = 'kaiwa.ai.apiKey.';
export const OPENROUTER_MODEL_STORAGE_KEY = 'kaiwa.ai.openRouterModel';
export const GEMINI_MODEL_STORAGE_KEY = 'kaiwa.ai.geminiModel';
export const MISTRAL_MODEL_STORAGE_KEY = 'kaiwa.ai.mistralModel';

export function loadStoredProvider() {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') return 'ollama';
  return localStorage.getItem(PROVIDER_STORAGE_KEY) || 'ollama';
}

export function loadStoredApiKeys() {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    return { openai: '', gemini: '', claude: '', openrouter: '', mistral: '' };
  }
  return {
    openai: localStorage.getItem(`${API_KEYS_STORAGE_PREFIX}openai`) || '',
    gemini: localStorage.getItem(`${API_KEYS_STORAGE_PREFIX}gemini`) || '',
    claude: localStorage.getItem(`${API_KEYS_STORAGE_PREFIX}claude`) || '',
    openrouter: localStorage.getItem(`${API_KEYS_STORAGE_PREFIX}openrouter`) || '',
    mistral: localStorage.getItem(`${API_KEYS_STORAGE_PREFIX}mistral`) || '',
  };
}

export function loadStoredOpenRouterModel() {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    return 'google/gemini-2.0-flash-lite-preview-02-05:free';
  }
  return localStorage.getItem(OPENROUTER_MODEL_STORAGE_KEY) || 'google/gemini-2.0-flash-lite-preview-02-05:free';
}

export function loadStoredGeminiModel() {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    return 'gemini-2.0-flash';
  }
  return localStorage.getItem(GEMINI_MODEL_STORAGE_KEY) || 'gemini-2.0-flash';
}

export function loadStoredMistralModel() {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    return 'mistral-large-latest';
  }
  return localStorage.getItem(MISTRAL_MODEL_STORAGE_KEY) || 'mistral-large-latest';
}

export default function AiProviderSettingsCard({
  provider,
  apiKeys,
  openRouterModel,
  onSettingsSaved,
}) {
  const { user } = useAuth();
  const [draftProvider, setDraftProvider] = useState(provider);
  const [draftKey, setDraftKey] = useState('');
  const [draftModel, setDraftModel] = useState(openRouterModel || '');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Synchronize draft provider and key from props on initial load/change
  useEffect(() => {
    setDraftProvider(provider);
  }, [provider]);

  useEffect(() => {
    if (openRouterModel) setDraftModel(openRouterModel);
  }, [openRouterModel]);

  // Load key specifically when draftProvider or apiKeys change
  useEffect(() => {
    if (draftProvider === 'ollama') {
      setDraftKey('');
      setDraftModel('');
    } else {
      setDraftKey(apiKeys[draftProvider] || '');
      if (draftProvider === 'gemini') {
        setDraftModel(typeof window !== 'undefined' ? localStorage.getItem(GEMINI_MODEL_STORAGE_KEY) || 'gemini-2.0-flash' : 'gemini-2.0-flash');
      } else if (draftProvider === 'mistral') {
        setDraftModel(typeof window !== 'undefined' ? localStorage.getItem(MISTRAL_MODEL_STORAGE_KEY) || 'mistral-large-latest' : 'mistral-large-latest');
      } else if (draftProvider === 'openrouter') {
        setDraftModel(typeof window !== 'undefined' ? localStorage.getItem(OPENROUTER_MODEL_STORAGE_KEY) || 'google/gemini-2.0-flash-lite-preview-02-05:free' : 'google/gemini-2.0-flash-lite-preview-02-05:free');
      }
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
    if (prov === 'openrouter' && !cleanKey.startsWith('sk-or-')) {
      return 'Invalid key format';
    }
    if (prov === 'gemini' && !cleanKey.startsWith('AIza') && !cleanKey.startsWith('AQ')) {
      return 'Invalid key format';
    }
    if (prov === 'claude' && !cleanKey.startsWith('sk-ant-')) {
      return 'Invalid key format';
    }
    if (prov === 'mistral' && !cleanKey) {
      return 'API key required';
    }
    return '';
  };

  // Compute validation error live
  const validationError = getValidationError(draftProvider, draftKey);
  const isSaveDisabled = Boolean(validationError);

  async function handleSave(event) {
    event.preventDefault();
    if (isSaveDisabled) return;

    const cleanKey = draftKey.trim();
    const cleanModel = draftModel.trim() || (draftProvider === 'gemini' ? 'gemini-2.0-flash' : draftProvider === 'mistral' ? 'mistral-large-latest' : 'google/gemini-2.0-flash-lite-preview-02-05:free');

    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(PROVIDER_STORAGE_KEY, draftProvider);
      if (draftProvider === 'openrouter') {
        window.localStorage.setItem(OPENROUTER_MODEL_STORAGE_KEY, cleanModel);
      } else if (draftProvider === 'gemini') {
        window.localStorage.setItem(GEMINI_MODEL_STORAGE_KEY, cleanModel);
      } else if (draftProvider === 'mistral') {
        window.localStorage.setItem(MISTRAL_MODEL_STORAGE_KEY, cleanModel);
      }
      if (draftProvider !== 'ollama') {
        window.localStorage.setItem(`${API_KEYS_STORAGE_PREFIX}${draftProvider}`, cleanKey);
      }
    }

    if (user) {
      // If we had a way to save the model to firestore, we would do it here.
      // But for now, we'll rely on the existing saveAiProviderSettings which takes provider and key.
      await saveAiProviderSettings(user.uid, draftProvider, cleanKey);
    }

    // Prepare updated API keys object for parent callback
    const updatedKeys = { ...apiKeys };
    if (draftProvider !== 'ollama') {
      updatedKeys[draftProvider] = cleanKey;
    }

    setSuccess('Settings saved successfully!');
    setError('');

    // Trigger parent callback to update App-level state
    onSettingsSaved(draftProvider, updatedKeys, cleanModel);
  }

  function handleClearKey() {
    if (draftProvider === 'ollama') return;

    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem(`${API_KEYS_STORAGE_PREFIX}${draftProvider}`);
    }
    setDraftKey('');
    setSuccess('');

    const updatedKeys = {
      ...apiKeys,
      [draftProvider]: '',
    };
    onSettingsSaved(draftProvider, updatedKeys, draftModel);
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
            <option value="openrouter">OpenRouter</option>
            <option value="gemini">Gemini</option>
            <option value="claude">Claude</option>
            <option value="mistral">Mistral AI</option>
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
                  : draftProvider === 'openrouter'
                  ? 'sk-or-v1-...'
                  : draftProvider === 'gemini'
                  ? 'AIzaSy... / AQ...'
                  : draftProvider === 'mistral'
                  ? 'Enter Mistral API Key'
                  : 'sk-ant-...'
              }
              autoComplete="off"
              aria-describedby={validationError ? 'api-key-error' : undefined}
              className="brutal-border mt-2 w-full bg-paper px-4 py-3 font-mono text-sm font-bold shadow-shadow"
            />
          </div>
        )}

        {['openrouter', 'gemini', 'mistral'].includes(draftProvider) && (
          <div>
            <label htmlFor="model-input" className="label-mono block font-bold">
              Model
            </label>
              {draftProvider === 'mistral' ? (
                <select
                  id="model-input"
                  value={draftModel}
                  onChange={(e) => {
                    setDraftModel(e.target.value);
                    setSuccess('');
                  }}
                  className="brutal-border mt-2 w-full bg-paper px-4 py-3 font-mono text-sm font-bold shadow-shadow"
                >
                  <option value="codestral-latest">Codestral</option>
                  <option value="ministral-14b-latest">Ministral 14b</option>
                  <option value="ministral-3b-latest">Ministral 3b</option>
                  <option value="ministral-8b-latest">Ministral 8b</option>
                  <option value="mistral-large-latest">Mistral Large</option>
                  <option value="mistral-medium-latest">Mistral Medium</option>
                  <option value="mistral-small-latest">Mistral Small</option>
                  <optgroup label="More">
                    <option value="labs-leanstral-1-5-1">Labs Leanstral 1 5 1</option>
                    <option value="glm-5-2">Glm 5 2</option>
                  </optgroup>
                  <optgroup label="Legacy">
                    <option value="mistral-medium-2505">Mistral Medium 2505</option>
                    <option value="mistral-medium-2508">Mistral Medium 2508</option>
                    <option value="devstral-2512">Devstral 2512</option>
                  </optgroup>
                </select>
              ) : (
                <input
                  id="model-input"
                  type="text"
                  value={draftModel}
                  onChange={(e) => {
                    setDraftModel(e.target.value);
                    setSuccess('');
                  }}
                  placeholder={draftProvider === 'openrouter' ? "e.g. google/gemini-2.0-flash-lite-preview-02-05:free" : "e.g. gemini-2.0-flash"}
                  autoComplete="off"
                  className="brutal-border mt-2 w-full bg-paper px-4 py-3 font-mono text-sm font-bold shadow-shadow"
                />
              )}
            <p className="mt-2 text-xs text-shu">
              Leave blank to use the default recommended free model.
            </p>
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
          <div className="fixed bottom-6 right-6 z-50 animate-fade-in-up rounded-base brutal-border bg-moss px-6 py-4 shadow-brutal">
            <p
              role="status"
              aria-live="polite"
              className="font-mono text-sm font-black text-paper"
            >
              {success}
            </p>
          </div>
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
