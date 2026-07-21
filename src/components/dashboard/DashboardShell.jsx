import AiProviderSettingsCard from './AiProviderSettingsCard.jsx';
import PersonaGrid from './PersonaGrid.jsx';
import Button from '../ui/Button.jsx';
import HankoStamp from '../ui/HankoStamp.jsx';

export default function DashboardShell({
  provider,
  apiKeys,
  notice,
  onSettingsSaved,
  onBackHome,
  onSelectPersona,
}) {
  return (
    <main className="screen-shell">
      <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <HankoStamp className="h-16 w-16 text-xl" />
          <div>
            <p className="label-mono text-shu">Kaiwa dashboard</p>
            <h1 className="font-display text-4xl sm:text-5xl">会話 starts here</h1>
          </div>
        </div>
        <Button variant="ghost" onClick={onBackHome}>
          Home
        </Button>
      </header>

      {notice && (
        <div className="brutal-border mb-5 bg-mustard p-4 font-mono text-sm font-black shadow-shadow">
          {notice}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <AiProviderSettingsCard
          provider={provider}
          apiKeys={apiKeys}
          onSettingsSaved={onSettingsSaved}
        />
        <div className="brutal-border bg-white/50 p-5 shadow-shadow">
          <p className="label-mono text-shu">Status</p>
          <h2 className="mt-2 font-display text-3xl">V1 scope</h2>
          <ul className="mt-4 space-y-3 font-semibold leading-7">
            <li>✓ AI settings saved only in this browser.</li>
            <li>✓ Conversations reset when the page refreshes.</li>
            <li>✓ No accounts, database, or backend server.</li>
          </ul>
        </div>
      </div>

      <div className="mt-8">
        <PersonaGrid onSelectPersona={onSelectPersona} />
      </div>
    </main>
  );
}
