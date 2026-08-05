import Link from 'next/link';
import Badge from '../components/ui/Badge.jsx';
import Button from '../components/ui/Button.jsx';
import Card from '../components/ui/Card.jsx';
import LogoMark from '../components/ui/LogoMark.jsx';
import StatCard from '../components/ui/StatCard.jsx';

const practiceModes = [
  ['Learn', 'JLPT N5 review cards, simple scoring, and repetition cues.'],
  ['Practice', 'AI Kaiwa roleplay with short, beginner-friendly Japanese replies.'],
  ['Configure', 'Ollama-first provider settings with optional user-owned API keys.'],
];

const sampleReplies = ['水をください', 'もう一度お願いします', 'おすすめは何ですか？'];

export default function Home() {
  return (
    <main className="screen-shell">
      <section className="grid items-center gap-8 py-8 lg:grid-cols-[1.05fr_0.95fr] lg:py-14">
        <div className="space-y-6">
          <div className="flex flex-wrap items-center gap-4">
            <LogoMark className="brutal-border h-24 w-24 rotate-[-8deg] shadow-shadow" />
            <Badge tone="mustard" tilt="left">Clean neubrutal prototype</Badge>
            <Badge tone="moss">Private by default</Badge>
          </div>

          <div className="max-w-4xl space-y-5">
            <p className="label-mono text-correction">AI Japanese conversation practice</p>
            <h1 className="font-display text-5xl leading-[0.95] tracking-tight sm:text-7xl lg:text-8xl">
              A crisp study notebook for Japanese practice.
            </h1>
            <p className="max-w-2xl text-lg font-bold leading-8 sm:text-xl">
              KAIwa combines JLPT review, local-first AI settings, and tactile conversation cards — bold ink, clean paper, and a correction-red mark built for study momentum.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button as={Link} href="/dashboard" size="lg">
              Open dashboard →
            </Button>
            <Button as={Link} href="/chat/sensei" variant="neutral" size="lg">
              Try Sensei chat
            </Button>
          </div>
        </div>

        <Card padding="md" className="notebook-panel relative">
          <div className="absolute -right-3 -top-4 rotate-3">
            <Badge tone="correction" tilt="right">Mock chat</Badge>
          </div>
          <div className="space-y-4 pt-2">
            <ChatMock name="先生" jp>
              こんにちは！今日は何を練習したいですか？
            </ChatMock>
            <ChatMock side="user" name="You">
              カフェで注文を練習したいです。
            </ChatMock>
            <div className="brutal-border bg-white p-4 shadow-shadow">
              <p className="label-mono text-aizome">Try replying</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {sampleReplies.map((reply) => (
                  <span key={reply} className="brutal-border bg-mustard px-3 py-2 font-mono text-xs font-black shadow-nav">
                    {reply}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </Card>
      </section>

      <section className="grid gap-4 py-8 md:grid-cols-3">
        <StatCard label="JLPT" value="N5" meta="First study track: beginner review and confidence building." />
        <StatCard accent="moss" label="Memory" value="Local" meta="Profile, level, and scores should persist on-device only." />
        <StatCard accent="correction" label="Mode" value="会話" meta="Conversation practice is the memorable product center." />
      </section>

      <section className="grid gap-4 py-8 md:grid-cols-3">
        {practiceModes.map(([title, text], index) => (
          <Card key={title} padding="md" lift="press" className={index === 1 ? 'md:-translate-y-4' : ''}>
            <Badge tone={index === 0 ? 'mustard' : index === 1 ? 'aizome' : 'moss'}>{title}</Badge>
            <h2 className="mt-5 font-display text-3xl">{title}</h2>
            <p className="mt-3 font-bold leading-7">{text}</p>
          </Card>
        ))}
      </section>
    </main>
  );
}

function ChatMock({ children, jp = false, name, side = 'ai' }) {
  const isUser = side === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <article className={`brutal-border max-w-[84%] px-4 py-3 shadow-shadow ${isUser ? 'bg-aizome text-paper' : 'bg-paper text-ink'}`}>
        <p className="font-mono text-[10px] font-black uppercase tracking-[0.18em] opacity-75">{name}</p>
        <p className={`mt-1 whitespace-pre-wrap ${jp ? 'japanese-text' : 'font-bold leading-7'}`}>{children}</p>
      </article>
    </div>
  );
}
