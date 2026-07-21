import { useState } from 'react';
import Button from '../ui/Button.jsx';
import Card from '../ui/Card.jsx';
import HankoStamp from '../ui/HankoStamp.jsx';

export default function SettingsScreen({ settings, onSave, onCancel }) {
  const [provider, setProvider] = useState(settings.provider);
  const [openrouterKey, setOpenrouterKey] = useState(settings.openrouter.apiKey);
  const [openrouterModel, setOpenrouterModel] = useState(settings.openrouter.model);
  const [openaiKey, setOpenaiKey] = useState(settings.openai.apiKey);
  const [openaiModel, setOpenaiModel] = useState(settings.openai.model);
  const [ollamaUrl, setOllamaUrl] = useState(settings.ollama.baseUrl);
  const [ollamaModel, setOllamaModel] = useState(settings.ollama.model);

  const [error, setError] = useState('');

  function handleSubmit(e) {
    e.preventDefault();
    setError('');

    // Quick validation
    if (provider === 'openrouter') {
      const cleanKey = openrouterKey.trim();
      if (!cleanKey) {
        setError('OpenRouter API key is required.');
        return;
      }
      if (!cleanKey.startsWith('sk-or-')) {
        setError('OpenRouter keys usually start with sk-or-. Check the key and try again.');
        return;
      }
    } else if (provider === 'openai') {
      const cleanKey = openaiKey.trim();
      if (!cleanKey) {
        setError('OpenAI API key is required.');
        return;
      }
      if (!cleanKey.startsWith('sk-')) {
        setError('OpenAI keys usually start with sk-. Check the key and try again.');
        return;
      }
    } else if (provider === 'ollama') {
      if (!ollamaUrl.trim()) {
        setError('Ollama Base URL is required.');
        return;
      }
      if (!ollamaModel.trim()) {
        setError('Ollama Model name is required.');
        return;
      }
    }

    const updatedSettings = {
      provider,
      openrouter: {
        apiKey: openrouterKey.trim(),
        model: openrouterModel.trim() || 'openrouter/auto',
      },
      openai: {
        apiKey: openaiKey.trim(),
        model: openaiModel.trim() || 'gpt-4o-mini',
      },
      ollama: {
        baseUrl: ollamaUrl.trim(),
        model: ollamaModel.trim() || 'llama3.2',
      },
    };

    onSave(updatedSettings);
  }

  const providersList = [
    { id: 'openrouter', name: 'OpenRouter', desc: 'Auto-routing external model API' },
    { id: 'openai', name: 'OpenAI', desc: 'Direct connection to GPT-4o-mini & GPT-4o' },
    { id: 'ollama', name: 'Ollama (Local)', desc: 'Run open-weights models completely offline' },
  ];

  return (
    <main className="screen-shell">
      <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <HankoStamp className="h-16 w-16 text-xl" />
          <div>
            <p className="label-mono text-shu">Settings</p>
            <h1 className="font-display text-4xl sm:text-5xl">AI Settings</h1>
          </div>
        </div>
        <Button variant="ghost" onClick={onCancel}>
          Back
        </Button>
      </header>

      <Card className="p-6 max-w-2xl mx-auto">
        <h2 className="font-display text-2xl mb-4">Choose AI Provider</h2>
        <div className="grid gap-3 mb-6 sm:grid-cols-3">
          {providersList.map((p) => {
            const isSelected = provider === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  setProvider(p.id);
                  setError('');
                }}
                className={`brutal-border p-4 text-left shadow-shadow transition-all hover:translate-x-boxShadowX hover:translate-y-boxShadowY hover:shadow-none ${
                  isSelected ? 'bg-mustard text-ink font-bold' : 'bg-white text-ink font-semibold'
                }`}
              >
                <div className="font-display text-lg">{p.name}</div>
                <div className="text-xs font-semibold mt-1 opacity-80">{p.desc}</div>
              </button>
            );
          })}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {provider === 'openrouter' && (
            <>
              <label className="block">
                <span className="label-mono text-shu">OpenRouter API Key</span>
                <input
                  type="password"
                  value={openrouterKey}
                  onChange={(e) => setOpenrouterKey(e.target.value)}
                  placeholder="sk-or-..."
                  autoComplete="off"
                  className="brutal-border mt-2 w-full bg-paper px-4 py-3 font-mono text-sm font-bold shadow-shadow animate-panel-in"
                />
              </label>
              <label className="block">
                <span className="label-mono text-shu">Model Name</span>
                <input
                  type="text"
                  value={openrouterModel}
                  onChange={(e) => setOpenrouterModel(e.target.value)}
                  placeholder="openrouter/auto"
                  className="brutal-border mt-2 w-full bg-paper px-4 py-3 font-mono text-sm font-bold shadow-shadow animate-panel-in"
                />
                <span className="text-xs font-semibold text-ink/70 mt-1 block">
                  Defaults to <code>openrouter/auto</code>. You can also specify models like <code>google/gemini-2.5-flash</code>.
                </span>
              </label>
            </>
          )}

          {provider === 'openai' && (
            <>
              <label className="block">
                <span className="label-mono text-shu">OpenAI API Key</span>
                <input
                  type="password"
                  value={openaiKey}
                  onChange={(e) => setOpenaiKey(e.target.value)}
                  placeholder="sk-..."
                  autoComplete="off"
                  className="brutal-border mt-2 w-full bg-paper px-4 py-3 font-mono text-sm font-bold shadow-shadow animate-panel-in"
                />
              </label>
              <label className="block">
                <span className="label-mono text-shu">Model Name</span>
                <input
                  type="text"
                  value={openaiModel}
                  onChange={(e) => setOpenaiModel(e.target.value)}
                  placeholder="gpt-4o-mini"
                  className="brutal-border mt-2 w-full bg-paper px-4 py-3 font-mono text-sm font-bold shadow-shadow animate-panel-in"
                />
                <span className="text-xs font-semibold text-ink/70 mt-1 block">
                  Defaults to <code>gpt-4o-mini</code>. You can also use <code>gpt-4o</code>.
                </span>
              </label>
            </>
          )}

          {provider === 'ollama' && (
            <>
              <label className="block">
                <span className="label-mono text-shu">Ollama Base URL</span>
                <input
                  type="text"
                  value={ollamaUrl}
                  onChange={(e) => setOllamaUrl(e.target.value)}
                  placeholder="http://localhost:11434"
                  className="brutal-border mt-2 w-full bg-paper px-4 py-3 font-mono text-sm font-bold shadow-shadow animate-panel-in"
                />
              </label>
              <label className="block">
                <span className="label-mono text-shu">Model Name</span>
                <input
                  type="text"
                  value={ollamaModel}
                  onChange={(e) => setOllamaModel(e.target.value)}
                  placeholder="llama3.2"
                  className="brutal-border mt-2 w-full bg-paper px-4 py-3 font-mono text-sm font-bold shadow-shadow animate-panel-in"
                />
                <span className="text-xs font-semibold text-ink/70 mt-1 block">
                  Ensure the model is already downloaded locally using <code>ollama pull &lt;model-name&gt;</code>.
                </span>
              </label>
            </>
          )}

          {error && (
            <p className="font-mono text-sm font-black text-shu mt-2">{error}</p>
          )}

          <div className="flex flex-col gap-3 sm:flex-row pt-4">
            <Button type="submit" variant="primary">
              Save Settings
            </Button>
            <Button type="button" variant="ghost" onClick={onCancel}>
              Cancel
            </Button>
          </div>
        </form>
      </Card>
    </main>
  );
}
