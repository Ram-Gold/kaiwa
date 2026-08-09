import { ROLEPLAY_PERSONAS } from '../../prompts/personas.js';
import Card from '../ui/Card.jsx';

const accentClasses = {
  moss: 'bg-moss text-paper',
  shu: 'bg-shu text-paper',
  ai: 'bg-ai text-paper',
  mustard: 'bg-mustard text-ink',
  correction: 'bg-correction text-paper',
  aizome: 'bg-aizome text-paper',
};

export default function PersonaGrid({ onSelectPersona }) {
  return (
    <section>
      <div className="mb-4">
        <p className="label-mono text-shu">Choose roleplay</p>
        <h2 className="mt-2 font-display text-4xl">Personas</h2>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {ROLEPLAY_PERSONAS.map((persona) => (
          <Card
            key={persona.id}
            as="button"
            surface="none"
            className={`group p-5 text-left transition-all hover:translate-x-boxShadowX hover:translate-y-boxShadowY hover:shadow-none ${accentClasses[persona.accent]}`}
            onClick={() => onSelectPersona(persona.id)}
          >
            <div className="flex items-start justify-between gap-3">
              <span className="text-5xl" aria-hidden="true">
                {persona.icon}
              </span>
              <span className="brutal-border bg-paper px-2 py-1 font-mono text-xs font-black uppercase tracking-[0.15em] text-ink">
                {persona.jp}
              </span>
            </div>
            <h3 className="mt-5 font-display text-3xl">{persona.name}</h3>
            <p className="mt-2 font-bold leading-7">{persona.tagline}</p>
            <p className="mt-5 font-mono text-xs font-black uppercase tracking-[0.16em] opacity-80">
              Open chat →
            </p>
          </Card>
        ))}
      </div>
    </section>
  );
}
