import Button from '../ui/Button.jsx';
import Card from '../ui/Card.jsx';
import Features from './Features.jsx';
import Hero from './Hero.jsx';
import HowItWorks from './HowItWorks.jsx';
import InstallSection from './InstallSection.jsx';

export default function LandingPage({ onEnter }) {
  return (
    <main className="screen-shell">
      <Hero onEnter={onEnter} />
      <HowItWorks />
      <Features />
      <InstallSection />
      <section className="py-10">
        <Card className="p-5 sm:p-8">
          <p className="label-mono text-shu">Dashboard teaser</p>
          <div className="mt-3 grid gap-5 md:grid-cols-[1fr_auto] md:items-center">
            <div>
              <h2 className="font-display text-4xl">Ready to connect your AI?</h2>
              <p className="mt-3 font-semibold leading-7">
                Save a browser-local key, select a persona, and open the chat screen.
              </p>
            </div>
            <Button onClick={onEnter} variant="secondary">
              Go to dashboard
            </Button>
          </div>
        </Card>
      </section>
    </main>
  );
}
