'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { IoCheckmarkSharp, IoCloseSharp, IoTrashSharp, IoSearchSharp } from 'react-icons/io5';
import { cn } from '../../lib/utils.js';
import Button from '../ui/Button.jsx';
import { PROVIDER_STORAGE_KEY, API_KEYS_STORAGE_PREFIX, OPENROUTER_MODEL_STORAGE_KEY, GEMINI_MODEL_STORAGE_KEY, MISTRAL_MODEL_STORAGE_KEY } from '../dashboard/AiProviderSettingsCard.jsx';
import CreditsSettingsView from '../settings/CreditsSettings.jsx';
import ProfileSettings from '../settings/ProfileSettings.jsx';
import SubscriptionSettings from '../settings/SubscriptionSettings.jsx';
import DeveloperSettings from '../settings/DeveloperSettings.jsx';
import ConfirmChangesModal from '../settings/ConfirmChangesModal.jsx';
import { useAuth } from '../../lib/auth/AuthContext.jsx';
import { saveUserSettings } from '../../lib/firebase/firestore.js';
import { PERMISSIONS, hasPermission } from '../../lib/auth/rbac.js';
import { isStreamingEnabled, setStreamingEnabled } from '../../lib/ai/config.js';

const CHAT_NOTCH_STYLES = [
  { id: 'dynamic-island', label: 'Dynamic Island' },
  { id: 'samsung', label: 'Samsung hole punch' },
  { id: 'teardrop', label: 'Tear drop' },
];

function getLocalStorage() {
  if (typeof window === 'undefined') return null;
  return window.localStorage ?? null;
}

const API_PROVIDERS = [
  { id: 'ollama', name: 'Ollama (Local)' },
  { id: 'lmstudio', name: 'LM Studio (Local API)' },
  { id: 'openai', name: 'OpenAI' },
  { id: 'anthropic', name: 'Anthropic (Claude)' },
  { id: 'gemini', name: 'Google Gemini' },
  { id: 'openrouter', name: 'OpenRouter' },
  { id: 'deepseek', name: 'DeepSeek' },
  { id: 'groq', name: 'Groq' },
  { id: 'together', name: 'Together AI' },
  { id: 'mistral', name: 'Mistral AI' },
  { id: 'perplexity', name: 'Perplexity AI' },
  { id: 'fireworks', name: 'Fireworks AI' },
  { id: 'cohere', name: 'Cohere' },
  { id: 'deepinfra', name: 'DeepInfra' },
  { id: 'siliconflow', name: 'SiliconFlow' },
  { id: 'xai', name: 'xAI (Grok)' },
  { id: 'novita', name: 'Novita AI' },
];

export default function GlobalSettingsModal({ onClose }) {
  const [category, setCategory] = useState('Profile Settings');
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

  const categories = useMemo(() => {
    const base = [
      'Profile Settings',
      'Subscription',
      'API Providers',
      'Engines (TTS/STT)',
      'About me & Privacy',
      'Roleplay',
      'Display',
      'Credits',
    ];
    if (canAccessDevOptions) {
      return [...base, 'Developer Options'];
    }
    return base;
  }, [canAccessDevOptions]);

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Settings overlay">
      <div 
        className="absolute inset-0 bg-paper/40 backdrop-blur-[2px] cursor-pointer" 
        aria-hidden="true" 
        onClick={onClose || undefined} 
      />
      <section className="animate-panel-in relative mx-auto mt-[5vh] w-[min(52rem,calc(100vw-2rem))] h-[650px] max-h-[90vh] brutal-border bg-white p-5 text-ink shadow-shadow overflow-hidden flex flex-col">
        <div className="flex items-start justify-between gap-6 shrink-0">
          <div>
            <p className="label-mono text-correction">Web BYOK Settings</p>
            <h2 className="mt-2 font-display text-4xl leading-none sm:text-5xl">Settings Board</h2>
          </div>
          {onClose && (
            <button type="button" aria-label="Close settings" onClick={onClose} className="brutal-border grid h-10 w-10 place-items-center rounded-full bg-white text-lg shadow-nav transition-transform hover:-translate-y-0.5 active:scale-95">
              <IoCloseSharp />
            </button>
          )}
        </div>

        <div className="mt-4 flex flex-col md:flex-row gap-4 flex-1 min-h-0 overflow-hidden">
          <nav className="w-full md:w-52 shrink-0 overflow-y-auto pr-1 flex flex-col gap-2 max-md:max-h-36 max-md:flex-row max-md:overflow-x-auto max-md:pb-2" aria-label="Settings categories">
            {categories.map((item) => (
              <button
                key={item}
                type="button"
                aria-current={category === item ? 'page' : undefined}
                onClick={() => setCategory(item)}
                className={cn(
                  'brutal-border px-3 py-3 text-left font-mono text-xs font-black uppercase tracking-[0.12em] transition-all duration-150 shrink-0',
                  category === item
                    ? 'bg-mustard translate-x-[2px] translate-y-[2px] shadow-none'
                    : 'bg-white shadow-nav hover:-translate-y-1 hover:shadow-[5px_5px_0px_0px_#1C1C1C] hover:bg-mustard',
                  item === 'Developer Options' && 'border-l-4 border-l-correction'
                )}
              >
                {item}
              </button>
            ))}
          </nav>

          <section className="flex-1 brutal-border bg-paper p-4 md:p-6 shadow-nav overflow-y-auto min-h-0" aria-label={`${category} settings`}>
            {category === 'Profile Settings' && <ProfileSettings />}
            {category === 'Subscription' && <SubscriptionSettings />}
            {category === 'API Providers' && <ApiProvidersSettings />}
            {category === 'Engines (TTS/STT)' && <EnginesSettings />}
            {category === 'About me & Privacy' && <PrivacySettings />}
            {category === 'Roleplay' && <RoleplaySettings />}
            {category === 'Display' && <DisplaySettings />}
            {category === 'Credits' && <CreditsSettings />}
            {category === 'Developer Options' && (
              canAccessDevOptions ? (
                <DeveloperSettings />
              ) : (
                <div className="brutal-border bg-white p-6 shadow-nav text-center font-mono space-y-2">
                  <h3 className="text-xl font-black text-shu uppercase">Access Restricted</h3>
                  <p className="text-xs font-bold text-ink/75">
                    Developer Options are only accessible to accounts with the Developer role.
                  </p>
                </div>
              )
            )}
          </section>
        </div>
      </section>
    </div>
  );
}

export function ApiProvidersSettings() {
  const [provider, setProvider] = useState('ollama');
  const [search, setSearch] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [apiKeys, setApiKeys] = useState({});
  const [draftKey, setDraftKey] = useState('');
  const [draftModel, setDraftModel] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  useEffect(() => {
    const storage = getLocalStorage();
    const storedProvider = storage?.getItem?.(PROVIDER_STORAGE_KEY) || 'ollama';
    setProvider(storedProvider);
    
    // Set initial search value to the current provider's name
    const currentProv = API_PROVIDERS.find(p => p.id === storedProvider);
    if (currentProv) {
      setSearch(currentProv.name);
    }

    const keys = {};
    API_PROVIDERS.forEach(p => {
      if (p.id !== 'ollama' && p.id !== 'lmstudio') {
        keys[p.id] = storage?.getItem?.(`${API_KEYS_STORAGE_PREFIX}${p.id}`) || '';
      }
    });
    setApiKeys(keys);

    const storedModel = storage?.getItem?.(OPENROUTER_MODEL_STORAGE_KEY) || 'google/gemini-2.0-flash-lite-preview-02-05:free';
    setDraftModel(storedModel);
  }, []);

  // Update draftModel when provider changes
  useEffect(() => {
    const storage = getLocalStorage();
    if (provider === 'gemini') {
      setDraftModel(storage?.getItem?.(GEMINI_MODEL_STORAGE_KEY) || 'gemini-2.0-flash');
    } else if (provider === 'mistral') {
      setDraftModel(storage?.getItem?.(MISTRAL_MODEL_STORAGE_KEY) || 'mistral-large-latest');
    } else if (provider === 'openrouter') {
      setDraftModel(storage?.getItem?.(OPENROUTER_MODEL_STORAGE_KEY) || 'google/gemini-2.0-flash-lite-preview-02-05:free');
    } else {
      setDraftModel('');
    }
  }, [provider]);

  useEffect(() => {
    setDraftKey(apiKeys[provider] || '');
    setSuccessMsg('');
  }, [provider, apiKeys]);

  const filteredProviders = useMemo(() => {
    const currentName = API_PROVIDERS.find(p => p.id === provider)?.name || '';
    if (search === currentName || !search.trim()) {
      return API_PROVIDERS;
    }
    return API_PROVIDERS.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));
  }, [search, provider]);

  function executeSave() {
    setIsConfirmOpen(false);
    const storage = getLocalStorage();
    storage?.setItem?.(PROVIDER_STORAGE_KEY, provider);
    if (provider !== 'ollama' && provider !== 'lmstudio') {
      storage?.setItem?.(`${API_KEYS_STORAGE_PREFIX}${provider}`, draftKey.trim());
      setApiKeys(prev => ({ ...prev, [provider]: draftKey.trim() }));
    }
    
    
    const cleanModel = draftModel.trim() || (provider === 'gemini' ? 'gemini-2.0-flash' : provider === 'mistral' ? 'mistral-large-latest' : 'google/gemini-2.0-flash-lite-preview-02-05:free');
    if (provider === 'openrouter') {
      storage?.setItem?.(OPENROUTER_MODEL_STORAGE_KEY, cleanModel);
    } else if (provider === 'gemini') {
      storage?.setItem?.(GEMINI_MODEL_STORAGE_KEY, cleanModel);
    } else if (provider === 'mistral') {
      storage?.setItem?.(MISTRAL_MODEL_STORAGE_KEY, cleanModel);
    }
    
    setSuccessMsg('Settings saved successfully!');
    // Trigger global event so ApiGuard can re-check
    window.dispatchEvent(new Event('kaiwa:provider-updated'));
  }

  const isLocal = provider === 'ollama' || provider === 'lmstudio';

  return (
    <div>
      <div className="mb-4">
        <p className="label-mono text-correction">Bring Your Own Key</p>
        <h3 className="mt-2 font-display text-4xl leading-none">API Providers</h3>
      </div>
      <p className="mt-4 rounded-base border-l-[6px] border-shu bg-white/60 p-3 text-sm font-bold leading-6">
        Select an AI provider. External keys are saved securely in your browser localStorage and are never sent to any intermediary server.
      </p>

      <div className="mt-5 space-y-4">
        <div className="relative">
          <label className="label-mono block font-bold">Select Provider</label>
          <div className="mt-2 brutal-border bg-white shadow-shadow relative">
            <div className="flex items-center gap-2 p-2">
              <IoSearchSharp className="text-ink/50" />
              <input
                type="text"
                placeholder="Search providers..."
                className="w-full bg-transparent text-sm font-bold outline-none"
                value={search}
                onFocus={() => setIsDropdownOpen(true)}
                onBlur={() => setTimeout(() => setIsDropdownOpen(false), 200)}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setIsDropdownOpen(true);
                }}
              />
            </div>
            
            {isDropdownOpen && (
              <div className="absolute left-[-2px] right-[-2px] top-full z-20 mt-1 max-h-40 overflow-y-auto brutal-border bg-white shadow-shadow">
                {filteredProviders.length > 0 ? (
                  filteredProviders.map(p => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        setProvider(p.id);
                        setSearch(p.name);
                        setIsDropdownOpen(false);
                      }}
                      className={cn(
                        'w-full text-left px-3 py-2 font-mono text-sm font-bold transition-colors hover:bg-mustard cursor-pointer',
                        provider === p.id && 'bg-mustard'
                      )}
                    >
                      {p.name} {apiKeys[p.id] ? '✓' : ''}
                    </button>
                  ))
                ) : (
                  <div className="px-3 py-2 font-mono text-sm font-bold text-ink/50">
                    No providers found
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div>
          <label className="label-mono block font-bold">
            {isLocal ? 'API Key Status' : `API Key for ${API_PROVIDERS.find(p => p.id === provider)?.name}`}
          </label>
          <input
            type={isLocal ? "text" : "password"}
            value={isLocal ? 'No key required (Local)' : draftKey}
            disabled={isLocal}
            onChange={(e) => { setDraftKey(e.target.value); setSuccessMsg(''); }}
            placeholder={isLocal ? 'No API key required for local engines' : 'Enter API key...'}
            className={cn(
              "brutal-border mt-2 w-full px-4 py-3 font-mono text-sm font-bold shadow-shadow transition-colors duration-200",
              isLocal ? "bg-paper/50 text-ink/40 cursor-not-allowed select-none" : "bg-white text-ink"
            )}
          />
        </div>

        {['openrouter', 'gemini', 'mistral'].includes(provider) && (
          <div>
            <label className="label-mono block font-bold">Model</label>
            {provider === 'mistral' ? (
              <select
                value={draftModel}
                onChange={(e) => { setDraftModel(e.target.value); setSuccessMsg(''); }}
                className="brutal-border mt-2 w-full bg-white px-4 py-3 font-mono text-sm font-bold text-ink shadow-shadow"
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
                type="text"
                value={draftModel}
                onChange={(e) => { setDraftModel(e.target.value); setSuccessMsg(''); }}
                placeholder={provider === 'openrouter' ? "e.g. google/gemini-2.0-flash-lite-preview-02-05:free" : "e.g. gemini-2.0-flash"}
                autoComplete="off"
                className="brutal-border mt-2 w-full bg-white px-4 py-3 font-mono text-sm font-bold text-ink shadow-shadow"
              />
            )}
            <p className="mt-2 text-xs text-shu font-bold">
              Leave blank to use the default recommended free model.
            </p>
          </div>
        )}

        {successMsg && <p className="font-mono text-sm font-black text-moss">{successMsg}</p>}

        <div>
          <Button type="button" onClick={() => setIsConfirmOpen(true)} disabled={!isLocal && !draftKey.trim()}>
            Save Provider & Key
          </Button>
        </div>
      </div>

      {/* Confirmation Modal */}
      <ConfirmChangesModal
        isOpen={isConfirmOpen}
        onConfirm={executeSave}
        onCancel={() => setIsConfirmOpen(false)}
        title="Confirm Changes"
        message={`Are you sure you want to save the settings for ${API_PROVIDERS.find(p => p.id === provider)?.name || provider}?`}
      />
    </div>
  );
}

export function EnginesSettings() {
  const [tts, setTts] = useState('web');
  const [stt, setStt] = useState('web');
  const [speechRate, setSpeechRate] = useState(1.0);
  const { user } = useAuth();

  useEffect(() => {
    const storage = getLocalStorage();
    const savedRate = parseFloat(storage?.getItem?.('kaiwa.speech.rate') || '1.0');
    if (!isNaN(savedRate)) {
      setSpeechRate(savedRate);
    }
  }, []);

  function handleRateChange(newRate) {
    const rateVal = parseFloat(newRate);
    setSpeechRate(rateVal);
    getLocalStorage()?.setItem?.('kaiwa.speech.rate', rateVal.toString());
    if (user) {
      saveUserSettings(user.uid, { speechRate: rateVal }).catch(console.error);
    }
  }

  function testSpeech() {
    import('../../lib/speech.js').then(({ speakJapanese }) => {
      speakJapanese('こんにちは。音声スピードのテストです。');
    });
  }

  return (
    <div>
      <div className="mb-4">
        <p className="label-mono text-correction">Audio Services</p>
        <h3 className="mt-2 font-display text-4xl leading-none">Engines (TTS/STT)</h3>
      </div>
      
      <div className="grid gap-5 mt-5">
        <div className="brutal-border bg-white p-4 shadow-nav">
          <p className="font-mono text-xs font-black uppercase tracking-[0.12em]">Text-to-Speech (TTS)</p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {[
              { id: 'web', label: 'Web Speech API' },
              { id: 'voicevox', label: 'VOICEVOX (Desktop)' }
            ].map((engine) => (
              <button
                key={engine.id}
                type="button"
                onClick={() => setTts(engine.id)}
                className={cn(
                  'brutal-border px-3 py-2 font-mono text-xs font-black uppercase tracking-[0.12em] shadow-nav transition-all hover:bg-mustard',
                  tts === engine.id ? 'bg-soft-blue text-ink' : 'bg-paper text-ink',
                )}
              >
                {engine.label}
              </button>
            ))}
          </div>

          {/* Web Speech Speed Rate Controls */}
          <div className="mt-4 border-t-2 border-border/40 pt-3">
            <div className="flex items-center justify-between">
              <label className="font-mono text-xs font-black uppercase tracking-[0.12em]">Speech / STT Speed Rate</label>
              <span className="font-mono text-xs font-black text-shu">{speechRate.toFixed(2)}x</span>
            </div>
            
            <div className="mt-3 flex items-center gap-3">
              <input
                type="range"
                min="0.5"
                max="2.0"
                step="0.05"
                value={speechRate}
                onChange={(e) => handleRateChange(e.target.value)}
                className="w-full h-2 bg-paper brutal-border accent-mustard cursor-pointer"
              />
              <Button type="button" variant="secondary" className="text-xs px-3 py-1 shrink-0" onClick={testSpeech}>
                Test Audio
              </Button>
            </div>

            <div className="mt-3 flex gap-2">
              {[0.75, 1.0, 1.25, 1.5].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => handleRateChange(preset)}
                  className={cn(
                    'brutal-border px-2 py-1 font-mono text-xs font-bold shadow-nav transition-all hover:bg-mustard',
                    speechRate === preset ? 'bg-mustard text-ink' : 'bg-white text-ink'
                  )}
                >
                  {preset}x
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="brutal-border bg-white p-4 shadow-nav">
          <p className="font-mono text-xs font-black uppercase tracking-[0.12em]">Speech-to-Text (STT)</p>
          <div className="mt-3 grid grid-cols-1 gap-2">
            {[
              { id: 'web', label: 'Web SpeechRecognition API' },
            ].map((engine) => (
              <button
                key={engine.id}
                type="button"
                onClick={() => setStt(engine.id)}
                className={cn(
                  'brutal-border px-3 py-2 font-mono text-xs font-black uppercase tracking-[0.12em] shadow-nav transition-all hover:bg-mustard',
                  stt === engine.id ? 'bg-soft-blue text-ink' : 'bg-paper text-ink',
                )}
              >
                {engine.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function PrivacySettings() {
  const [persona, setPersona] = useState('');
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    const storage = getLocalStorage();
    setPersona(storage?.getItem?.('kaiwa.user.persona') || '');
  }, []);

  function savePersona() {
    getLocalStorage()?.setItem?.('kaiwa.user.persona', persona);
    if (user) {
      saveUserSettings(user.uid, { persona }).catch(console.error);
    }
  }

  function handleConfirmPurge() {
    setIsConfirmOpen(false);
    getLocalStorage()?.clear?.();
    window.location.reload();
  }

  return (
    <div>
      <div className="mb-4">
        <p className="label-mono text-correction">User Context & Data</p>
        <h3 className="mt-2 font-display text-4xl leading-none">About me & Privacy</h3>
      </div>
      
      <div className="mt-5 space-y-6">
        <div>
          <label className="label-mono block font-bold">User Persona Context for AI</label>
          <textarea
            value={persona}
            onChange={(e) => setPersona(e.target.value)}
            onBlur={savePersona}
            placeholder="E.g., I am an exchange student in Tokyo studying software engineering..."
            className="brutal-border mt-2 w-full h-32 resize-none bg-white px-4 py-3 font-mono text-sm font-bold shadow-shadow"
          />
          <p className="mt-1 text-xs font-bold opacity-60">This helps the AI tailor scenarios to your background.</p>
        </div>

        <div className="brutal-border bg-white p-4 shadow-nav border-shu border-2">
          <p className="font-mono text-xs font-black uppercase tracking-[0.12em] text-shu">Danger Zone</p>
          <p className="mt-2 text-sm font-bold">Clear all locally stored API keys, learning progress, and logs.</p>
          <Button type="button" onClick={() => setIsConfirmOpen(true)} className="mt-3 bg-shu text-white hover:bg-red-700 hover:text-white">
            <IoTrashSharp className="inline mr-2" />
            Purge local memory
          </Button>
        </div>
      </div>

      <ConfirmChangesModal
        isOpen={isConfirmOpen}
        onConfirm={handleConfirmPurge}
        onCancel={() => setIsConfirmOpen(false)}
        title="Confirm Changes"
        message="Are you sure you want to delete all locally stored API keys, learning progress, and logs?"
      />
    </div>
  );
}

export function RoleplaySettings() {
  const [showCards, setShowCards] = useState(true);
  const [showMessages, setShowMessages] = useState(true);
  const [showPhoneChrome, setShowPhoneChrome] = useState(true);
  const [streaming, setStreaming] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    setStreaming(isStreamingEnabled());
  }, []);

  function updateOption(option, value) {
    window.dispatchEvent(new CustomEvent('kaiwa:conversation-option-change', { detail: { option, value } }));
    if (user) {
      saveUserSettings(user.uid, { display: { [option]: value } }).catch(console.error);
    }
  }

  function toggleStreaming() {
    const nextValue = !streaming;
    setStreaming(nextValue);
    setStreamingEnabled(nextValue);
    if (user) {
      saveUserSettings(user.uid, { streamingEnabled: nextValue }).catch(console.error);
    }
  }

  function toggleCards() {
    const nextValue = !showCards;
    setShowCards(nextValue);
    updateOption('showCards', nextValue);
  }

  function toggleMessages() {
    const nextValue = !showMessages;
    setShowMessages(nextValue);
    updateOption('showMessages', nextValue);
  }

  function togglePhoneChrome() {
    const nextValue = !showPhoneChrome;
    setShowPhoneChrome(nextValue);
    updateOption('showPhoneChrome', nextValue);
  }

  return (
    <div>
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <p className="label-mono text-correction">Scenario settings</p>
          <h3 className="mt-2 font-display text-4xl leading-none">Roleplay</h3>
        </div>
      </div>

      <div className="grid gap-3 mt-5">
        <RoleplaySettingToggle 
          active={streaming} 
          onClick={toggleStreaming} 
          label="Stream AI responses" 
          description="Stream Japanese conversation token-by-token across all roles (default: off)." 
        />
        <RoleplaySettingToggle active={showCards} onClick={toggleCards} label="Suggestion cards" description="Show the held-card phrase fan during practice." />
        <RoleplaySettingToggle active={showMessages} onClick={toggleMessages} label="Messages" description="Show or hide the conversation bubbles inside the phone." />
        <RoleplaySettingToggle active={showPhoneChrome} onClick={togglePhoneChrome} label="Phone chrome" description="Show time, wifi, cellular, battery, and notch." />
      </div>
    </div>
  );
}

export function DisplaySettings() {
  const [showPronunciation, setShowPronunciation] = useState(true);
  const [readingMode, setReadingMode] = useState('japanese');
  const [voiceSpeed, setVoiceSpeed] = useState(1.0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [notchStyle, setNotchStyle] = useState('dynamic-island');
  const { user } = useAuth();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedMode = window.localStorage?.getItem?.('kaiwa.reading_mode') || 'japanese';
      if (savedMode === 'off') {
        setShowPronunciation(false);
        setReadingMode('japanese');
      } else {
        setShowPronunciation(true);
        setReadingMode(savedMode === 'romaji' ? 'romaji' : 'japanese');
      }

      const storedSpeed = parseFloat(window.localStorage?.getItem?.('kaiwa.speech.rate') || '1.0');
      if (!isNaN(storedSpeed)) {
        setVoiceSpeed(storedSpeed);
      }
    }
  }, []);

  function updateOption(option, value) {
    window.dispatchEvent(new CustomEvent('kaiwa:conversation-option-change', { detail: { option, value } }));
    if (user) {
      saveUserSettings(user.uid, { display: { [option]: value } }).catch(console.error);
    }
  }

  function handleTogglePronunciation(nextVal) {
    setShowPronunciation(nextVal);
    const targetMode = nextVal ? readingMode : 'off';
    if (typeof window !== 'undefined') {
      window.localStorage?.setItem?.('kaiwa.reading_mode', targetMode);
      window.dispatchEvent(new CustomEvent('kaiwa:reading-mode-change', { detail: { mode: targetMode } }));
    }
    updateOption('readingMode', targetMode);
  }

  function handleSelectReadingMode(mode) {
    setReadingMode(mode);
    if (showPronunciation) {
      if (typeof window !== 'undefined') {
        window.localStorage?.setItem?.('kaiwa.reading_mode', mode);
        window.dispatchEvent(new CustomEvent('kaiwa:reading-mode-change', { detail: { mode } }));
      }
      updateOption('readingMode', mode);
    }
  }

  function handleSelectSpeed(speed) {
    setVoiceSpeed(speed);
    if (typeof window !== 'undefined') {
      window.localStorage?.setItem?.('kaiwa.speech.rate', String(speed));
    }
  }

  function handleTestAudio() {
    setIsPlaying(true);
    import('../../lib/speech.js').then(({ speakJapanese }) => {
      speakJapanese('こんにちは！一緒に日本語を練習しましょう！');
      setTimeout(() => setIsPlaying(false), 2200);
    });
  }

  function chooseNotchStyle(style) {
    setNotchStyle(style);
    updateOption('notchStyle', style);
  }

  return (
    <div>
      <div className="mb-4">
        <p className="label-mono text-correction">Visual & audio settings</p>
        <h3 className="mt-2 font-display text-4xl leading-none">Display & Sound</h3>
      </div>

      <div className="mt-5 space-y-4">
        {/* Pronunciation Card */}
        <div className="brutal-border bg-white p-4 shadow-nav">
          <div
            className="flex items-center justify-between cursor-pointer select-none pb-3 border-b-2 border-border/10"
            onClick={() => handleTogglePronunciation(!showPronunciation)}
          >
            <div>
              <p className="font-mono text-xs font-black uppercase tracking-[0.12em]">Show pronunciation</p>
              <p className="text-xs font-mono text-ink/50 mt-0.5">Display furigana readings above Japanese text</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={showPronunciation}
              aria-label="Toggle pronunciation"
              onClick={(e) => {
                e.stopPropagation();
                handleTogglePronunciation(!showPronunciation);
              }}
              className={cn(
                'border-2 border-border h-7 w-12 p-0.5 rounded-full transition-colors relative shadow-xs shrink-0 cursor-pointer',
                showPronunciation ? 'bg-mustard' : 'bg-paper'
              )}
            >
              <span
                className={cn(
                  'block h-5 w-5 rounded-full bg-ink transition-transform duration-200 ease-out shadow-xs',
                  showPronunciation ? 'translate-x-5' : 'translate-x-0'
                )}
              />
            </button>
          </div>

          <div className={cn('grid grid-cols-2 gap-3 pt-3 transition-opacity', !showPronunciation && 'opacity-30 pointer-events-none')}>
            <button
              type="button"
              onClick={() => handleSelectReadingMode('romaji')}
              className={cn(
                'border-2 p-3 text-center rounded-xl transition-all flex flex-col items-center justify-center gap-1 focus:outline-none cursor-pointer',
                readingMode === 'romaji' && showPronunciation
                  ? 'border-border bg-mustard/20 shadow-nav ring-2 ring-ink ring-offset-1 font-bold'
                  : 'border-border/30 bg-paper/60 text-ink hover:border-border hover:bg-paper'
              )}
            >
              <span className="font-mono text-[11px] text-ink/60 font-semibold tracking-wider">ni hon go</span>
              <span className="font-jp text-2xl font-black text-ink">日本語</span>
              <span className="text-xs font-bold text-ink mt-0.5">Romanized</span>
            </button>

            <button
              type="button"
              onClick={() => handleSelectReadingMode('japanese')}
              className={cn(
                'border-2 p-3 text-center rounded-xl transition-all flex flex-col items-center justify-center gap-1 focus:outline-none cursor-pointer',
                readingMode === 'japanese' && showPronunciation
                  ? 'border-border bg-mustard/20 shadow-nav ring-2 ring-ink ring-offset-1 font-bold'
                  : 'border-border/30 bg-paper/60 text-ink hover:border-border hover:bg-paper'
              )}
            >
              <span className="font-jp text-[11px] text-ink/60 font-medium tracking-widest">に ほん ご</span>
              <span className="font-jp text-2xl font-black text-ink">日本語</span>
              <span className="text-xs font-bold text-ink mt-0.5">Japanese</span>
            </button>
          </div>
        </div>

        {/* Voice Speed */}
        <div className="brutal-border bg-white p-4 shadow-nav">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="font-mono text-xs font-black uppercase tracking-[0.12em]">Voice Speed</p>
              <p className="text-xs font-mono text-ink/50 mt-0.5">Adjust Japanese speech rate</p>
            </div>
            <button
              type="button"
              onClick={handleTestAudio}
              className="border border-border bg-paper hover:bg-mustard text-ink px-2.5 py-1 rounded-md text-xs font-mono font-bold flex items-center gap-1.5 shadow-xs transition-all active:scale-95 cursor-pointer"
            >
              <IoVolumeHighSharp className={cn('text-sm', isPlaying && 'text-shu animate-bounce')} />
              <span>{isPlaying ? 'Speaking...' : 'Test Voice'}</span>
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {[
              { rate: 0.75, label: '0.75x', sub: 'Slow · ゆっくり' },
              { rate: 1.0, label: '1.0x', sub: 'Normal · ふつう' },
              { rate: 1.25, label: '1.25x', sub: 'Fast · はやい' },
            ].map((item) => (
              <button
                key={item.rate}
                type="button"
                onClick={() => handleSelectSpeed(item.rate)}
                className={cn(
                  'border-2 py-2 px-1 text-center rounded-lg transition-all flex flex-col items-center justify-center gap-0.5 focus:outline-none cursor-pointer',
                  voiceSpeed === item.rate
                    ? 'border-border bg-mustard text-ink shadow-xs ring-2 ring-ink ring-offset-1 font-bold'
                    : 'border-border/30 bg-paper/60 text-ink/80 hover:border-border hover:bg-paper'
                )}
              >
                <span className="font-mono text-xs font-black">{item.label}</span>
                <span className="text-[10px] text-ink/60 font-medium">{item.sub}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Phone notch */}
        <div className="brutal-border bg-white p-4 shadow-nav">
          <p className="font-mono text-xs font-black uppercase tracking-[0.12em]">Phone notch</p>
          <div className="mt-3 grid grid-cols-3 gap-2">
            {CHAT_NOTCH_STYLES.map((style) => (
              <button
                key={style.id}
                type="button"
                onClick={() => chooseNotchStyle(style.id)}
                className={cn(
                  'brutal-border px-2 py-2 font-mono text-[10px] font-black uppercase leading-4 tracking-[0.08em] shadow-nav transition-all hover:bg-mustard cursor-pointer',
                  notchStyle === style.id ? 'bg-mustard text-ink' : 'bg-paper text-ink',
                )}
              >
                {style.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function RoleplaySettingToggle({ active, label, description, onClick }) {
  return (
    <button type="button" onClick={onClick} className={cn('brutal-border flex items-center justify-between gap-4 bg-white p-3 text-left shadow-nav transition-all hover:bg-mustard', active && 'bg-mustard')}>
      <span>
        <span className="block font-mono text-xs font-black uppercase tracking-[0.12em]">{label}</span>
        <span className="mt-1 block text-sm font-bold leading-5 text-ink/65">{description}</span>
      </span>
      <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full border-2 border-border bg-white text-xs">{active ? <IoCheckmarkSharp /> : null}</span>
    </button>
  );
}

function CreditsSettings() {
  return <CreditsSettingsView />;
}
