import Button from '../ui/Button.jsx';
import Card from '../ui/Card.jsx';

export default function AiConnectionCard({ settings, onOpenSettings }) {
  const provider = settings?.provider || 'openrouter';
  const config = settings?.[provider];

  let isConfigured = false;
  let providerLabel = '';
  let modelLabel = '';

  if (provider === 'openrouter') {
    isConfigured = Boolean(config?.apiKey);
    providerLabel = 'OpenRouter';
    modelLabel = config?.model || 'openrouter/auto';
  } else if (provider === 'openai') {
    isConfigured = Boolean(config?.apiKey);
    providerLabel = 'OpenAI';
    modelLabel = config?.model || 'gpt-4o-mini';
  } else if (provider === 'ollama') {
    isConfigured = Boolean(config?.baseUrl && config?.model);
    providerLabel = 'Ollama (Local)';
    modelLabel = config?.model || 'llama3.2';
  }

  return (
    <Card className="p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="label-mono text-shu">Connect your AI</p>
          <h2 className="mt-2 font-display text-3xl">{providerLabel}</h2>
        </div>
        {isConfigured ? (
          <span className="brutal-border bg-moss px-3 py-2 font-mono text-xs font-black uppercase tracking-[0.16em] text-paper">
            ✓ Configured
          </span>
        ) : (
          <span className="brutal-border bg-shu px-3 py-2 font-mono text-xs font-black uppercase tracking-[0.16em] text-paper">
            ✗ Missing Setup
          </span>
        )}
      </div>

      <div className="mt-4 rounded-base border-l-[6px] border-shu bg-white/60 p-3 text-sm font-bold leading-6">
        {isConfigured ? (
          <div>
            <p><strong>Model:</strong> <code>{modelLabel}</code></p>
            {provider === 'ollama' ? (
              <p className="text-xs text-ink/70 mt-1">Connecting to local server at {config?.baseUrl}</p>
            ) : (
              <p className="text-xs text-ink/70 mt-1">Direct-to-API requests over HTTPS</p>
            )}
          </div>
        ) : (
          <p>Please configure your AI provider credentials and selected model in Settings to begin practicing conversation.</p>
        )}
      </div>

      <div className="mt-5 flex">
        <Button onClick={onOpenSettings} variant="primary">
          Configure Settings
        </Button>
      </div>
    </Card>
  );
}
