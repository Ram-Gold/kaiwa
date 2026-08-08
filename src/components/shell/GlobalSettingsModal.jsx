'use client';

import { useEffect, useState, useMemo } from 'react';
import { IoCheckmarkSharp, IoCloseSharp, IoTrashSharp, IoSearchSharp } from 'react-icons/io5';
import { cn } from '../../lib/utils.js';
import Button from '../ui/Button.jsx';
import { PROVIDER_STORAGE_KEY, API_KEYS_STORAGE_PREFIX } from '../dashboard/AiProviderSettingsCard.jsx';
import CreditsSettingsView from '../settings/CreditsSettings.jsx';
import ProfileSettings from '../settings/ProfileSettings.jsx';
import SubscriptionSettings from '../settings/SubscriptionSettings.jsx';

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

        <div className="mt-5 grid gap-4 md:grid-cols-[12rem_minmax(0,1fr)] overflow-y-auto flex-1 pb-4">
          <nav className="grid content-start gap-2 overflow-y-auto pr-2 pb-4" aria-label="Settings categories">
            {['Profile Settings', 'Subscription', 'API Providers', 'Engines (TTS/STT)', 'About me & Privacy', 'Roleplay', 'Display', 'Credits'].map((item) => (
              <button
                key={item}
                type="button"
                aria-current={category === item ? 'page' : undefined}
                onClick={() => setCategory(item)}
                className={cn(
                  'brutal-border bg-white px-3 py-3 text-left font-mono text-xs font-black uppercase tracking-[0.12em] shadow-nav transition-all hover:bg-mustard',
                  category === item && 'bg-mustard',
                )}
              >
                {item}
              </button>
            ))}
          </nav>

          <section className="brutal-border bg-paper p-4 shadow-nav overflow-visible" aria-label={`${category} settings`}>
            {category === 'Profile Settings' && <ProfileSettings />}
            {category === 'Subscription' && <SubscriptionSettings />}
            {category === 'API Providers' && <ApiProvidersSettings />}
            {category === 'Engines (TTS/STT)' && <EnginesSettings />}
            {category === 'About me & Privacy' && <PrivacySettings />}
            {category === 'Roleplay' && <RoleplaySettings />}
            {category === 'Display' && <DisplaySettings />}
            {category === 'Credits' && <CreditsSettings />}
          </section>
        </div>
      </section>
    </div>
  );
}

function ApiProvidersSettings() {
  const [provider, setProvider] = useState('ollama');
  const [search, setSearch] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [apiKeys, setApiKeys] = useState({});
  const [draftKey, setDraftKey] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

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
  }, []);

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

  function handleSave() {
    const storage = getLocalStorage();
    storage?.setItem?.(PROVIDER_STORAGE_KEY, provider);
    if (provider !== 'ollama' && provider !== 'lmstudio') {
      storage?.setItem?.(`${API_KEYS_STORAGE_PREFIX}${provider}`, draftKey.trim());
      setApiKeys(prev => ({ ...prev, [provider]: draftKey.trim() }));
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
                        'w-full text-left px-3 py-2 font-mono text-sm font-bold transition-colors hover:bg-mustard',
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

        {successMsg && <p className="font-mono text-sm font-black text-moss">{successMsg}</p>}

        <div>
          <Button type="button" onClick={handleSave} disabled={!isLocal && !draftKey.trim()}>
            Save Provider & Key
          </Button>
        </div>
      </div>
    </div>
  );
}

function EnginesSettings() {
  const [tts, setTts] = useState('web');
  const [stt, setStt] = useState('web');
  const [speechRate, setSpeechRate] = useState(1.0);

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

function PrivacySettings() {
  const [persona, setPersona] = useState('');

  useEffect(() => {
    const storage = getLocalStorage();
    setPersona(storage?.getItem?.('kaiwa.user.persona') || '');
  }, []);

  function savePersona() {
    getLocalStorage()?.setItem?.('kaiwa.user.persona', persona);
  }

  function purgeData() {
    if (window.confirm("Are you sure? This will delete all keys, settings, and progress.")) {
      getLocalStorage()?.clear?.();
      window.location.reload();
    }
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
          <Button type="button" onClick={purgeData} className="mt-3 bg-shu text-white hover:bg-red-700 hover:text-white">
            <IoTrashSharp className="inline mr-2" />
            Purge local memory
          </Button>
        </div>
      </div>
    </div>
  );
}

function RoleplaySettings() {
  const [showCards, setShowCards] = useState(true);
  const [showMessages, setShowMessages] = useState(true);
  const [showPhoneChrome, setShowPhoneChrome] = useState(true);

  function updateOption(option, value) {
    window.dispatchEvent(new CustomEvent('kaiwa:conversation-option-change', { detail: { option, value } }));
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
        <RoleplaySettingToggle active={showCards} onClick={toggleCards} label="Suggestion cards" description="Show the held-card phrase fan during practice." />
        <RoleplaySettingToggle active={showMessages} onClick={toggleMessages} label="Messages" description="Show or hide the conversation bubbles inside the phone." />
        <RoleplaySettingToggle active={showPhoneChrome} onClick={togglePhoneChrome} label="Phone chrome" description="Show time, wifi, cellular, battery, and notch." />
      </div>
    </div>
  );
}

function DisplaySettings() {
  const [readingMode, setReadingMode] = useState('Furigana');
  const [notchStyle, setNotchStyle] = useState('dynamic-island');

  function updateOption(option, value) {
    window.dispatchEvent(new CustomEvent('kaiwa:conversation-option-change', { detail: { option, value } }));
  }

  function chooseReadingMode(mode) {
    setReadingMode(mode);
    updateOption('readingMode', mode);
  }

  function chooseNotchStyle(style) {
    setNotchStyle(style);
    updateOption('notchStyle', style);
  }

  return (
    <div>
      <div className="mb-4">
        <p className="label-mono text-correction">Visual settings</p>
        <h3 className="mt-2 font-display text-4xl leading-none">Display</h3>
      </div>
      <div className="mt-5 grid gap-3 lg:grid-cols-2">
        <div className="brutal-border bg-white p-3 shadow-nav">
          <p className="font-mono text-xs font-black uppercase tracking-[0.12em]">Reading mode</p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {['Furigana', 'Romaji'].map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => chooseReadingMode(mode)}
                className={cn(
                  'brutal-border px-3 py-2 font-mono text-xs font-black uppercase tracking-[0.12em] shadow-nav transition-all hover:bg-mustard',
                  readingMode === mode ? 'bg-soft-blue text-ink' : 'bg-paper text-ink',
                )}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>

        <div className="brutal-border bg-white p-3 shadow-nav">
          <p className="font-mono text-xs font-black uppercase tracking-[0.12em]">Phone notch</p>
          <div className="mt-3 grid grid-cols-3 gap-2">
            {CHAT_NOTCH_STYLES.map((style) => (
              <button
                key={style.id}
                type="button"
                onClick={() => chooseNotchStyle(style.id)}
                className={cn(
                  'brutal-border px-2 py-2 font-mono text-[10px] font-black uppercase leading-4 tracking-[0.08em] shadow-nav transition-all hover:bg-mustard',
                  notchStyle === style.id ? 'bg-soft-blue text-ink' : 'bg-paper text-ink',
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
