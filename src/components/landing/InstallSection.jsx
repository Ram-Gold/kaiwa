import Card from '../ui/Card.jsx';

export default function InstallSection() {
  return (
    <section className="py-10">
      <Card
        surface="none"
        className="grid gap-5 bg-ink p-5 text-paper md:grid-cols-[1fr_auto] md:items-center"
      >
        <div>
          <p className="label-mono text-mustard">Run locally</p>
          <h2 className="mt-2 font-display text-3xl sm:text-4xl">Install, run, demo.</h2>
          <p className="mt-3 max-w-2xl font-semibold leading-7">
            This is a static client app. Install dependencies, start Vite, paste
            your own OpenRouter key, and roleplay.
          </p>
        </div>
        <pre className="overflow-x-auto rounded-base border-[3px] border-paper bg-paper p-4 font-mono text-sm font-black text-ink shadow-[6px_6px_0_#D6432B]">
          npm install{'\n'}npm run dev
        </pre>
      </Card>
    </section>
  );
}
