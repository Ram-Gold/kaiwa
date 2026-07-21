import Card from '../ui/Card.jsx';

const features = [
  ['No backend', 'The browser calls OpenRouter directly. This keeps v1 small and demoable.'],
  ['Roleplay-first', 'Personas define tone, safety boundaries, and suggested Japanese replies.'],
  ['Mobile-first', 'The layout is designed to work at 375px before desktop polish.'],
  ['Neobrutalist UI', 'Thick borders, hard shadows, warm paper, and the 会話 hanko motif.'],
];

export default function Features() {
  return (
    <section className="py-10">
      <h2 className="mb-5 font-display text-4xl sm:text-5xl">Built for a capstone demo</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        {features.map(([title, body]) => (
          <Card
            key={title}
            className="p-5"
          >
            <p className="label-mono text-shu">Feature</p>
            <h3 className="mt-2 font-display text-2xl">{title}</h3>
            <p className="mt-3 font-semibold leading-7">{body}</p>
          </Card>
        ))}
      </div>
    </section>
  );
}
