import Card from '../ui/Card.jsx';
import Sticker from '../ui/Sticker.jsx';

const steps = [
  ['1', 'Paste your key', 'Your OpenRouter key stays in browser localStorage.'],
  ['2', 'Pick a persona', 'Choose Sensei, Crush, or Idol from one shared data file.'],
  ['3', 'Practice', 'Type in Japanese or tap suggested replies from the model.'],
];

export default function HowItWorks() {
  return (
    <section id="how" className="py-10">
      <div className="mb-5 flex items-center justify-between gap-4">
        <h2 className="font-display text-4xl sm:text-5xl">How it works</h2>
        <Sticker color="bg-moss text-paper">3 steps</Sticker>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {steps.map(([number, title, text]) => (
          <Card key={number} className="p-5">
            <div className="mb-5 grid h-12 w-12 place-items-center rounded-base border-[3px] border-border bg-shu font-display text-2xl text-paper shadow-shadow">
              {number}
            </div>
            <h3 className="font-display text-2xl">{title}</h3>
            <p className="mt-3 font-semibold leading-7">{text}</p>
          </Card>
        ))}
      </div>
    </section>
  );
}
