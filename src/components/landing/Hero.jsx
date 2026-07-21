import Button from '../ui/Button.jsx';
import Card from '../ui/Card.jsx';
import HankoStamp from '../ui/HankoStamp.jsx';
import Sticker from '../ui/Sticker.jsx';

export default function Hero({ onEnter }) {
  return (
    <section className="grid items-center gap-8 py-8 lg:grid-cols-[1.05fr_0.95fr] lg:py-16">
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <HankoStamp />
          <Sticker>Local-first capstone</Sticker>
        </div>

        <div className="space-y-4">
          <p className="label-mono text-shu">AI Japanese conversation practice</p>
          <h1 className="font-display text-5xl leading-[0.95] tracking-tight sm:text-7xl lg:text-8xl">
            Practice Japanese without the boring script.
          </h1>
          <p className="max-w-2xl text-lg font-semibold leading-8 sm:text-xl">
            Kaiwa lets you roleplay with a teacher, crush, or idol persona using
            your own OpenRouter key. No accounts, no backend, no stored chat
            history for v1.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button onClick={onEnter}>Open dashboard</Button>
          <a
            href="#how"
            className="brutal-border inline-flex items-center justify-center bg-paper px-4 py-3 font-mono text-sm font-black uppercase tracking-[0.12em] shadow-shadow transition-all hover:translate-x-boxShadowX hover:translate-y-boxShadowY hover:shadow-none"
          >
            See how it works
          </a>
        </div>
      </div>

      <Card className="relative p-4 sm:p-6">
        <div className="absolute -right-3 -top-4 rotate-6">
          <Sticker color="bg-shu text-paper">Mock chat</Sticker>
        </div>
        <div className="space-y-4">
          <ChatMock side="ai" name="先生">
            こんにちは！今日は何について話しましょうか？
          </ChatMock>
          <ChatMock side="user" name="You">
            日本語でカフェの注文を練習したいです。
          </ChatMock>
          <ChatMock side="ai" name="先生">
            いいですね。「コーヒーを一つください」と言えます。何を注文しますか？
          </ChatMock>
          <div className="flex flex-wrap gap-2 pt-2">
            {['水をください', 'おすすめは何ですか？', 'これを一つください'].map(
              (suggestion) => (
                <span
                  key={suggestion}
                  className="brutal-border bg-mustard px-3 py-2 font-mono text-xs font-bold"
                >
                  {suggestion}
                </span>
              ),
            )}
          </div>
        </div>
      </Card>
    </section>
  );
}

function ChatMock({ children, side, name }) {
  const isUser = side === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`brutal-border max-w-[82%] px-4 py-3 shadow-shadow ${
          isUser ? 'bg-ai text-paper' : 'bg-paper'
        }`}
      >
        <p className="font-mono text-[10px] font-black uppercase tracking-[0.18em] opacity-70">
          {name}
        </p>
        <p className="mt-1 font-semibold">{children}</p>
      </div>
    </div>
  );
}
