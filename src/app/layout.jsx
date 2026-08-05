import '../index.css';
import Link from 'next/link';
import Badge from '../components/ui/Badge.jsx';
import Button from '../components/ui/Button.jsx';
import LogoMark from '../components/ui/LogoMark.jsx';

export const metadata = {
  title: 'KAIwa - Japanese Tutor',
  description: 'Local-first Japanese language tutor for JLPT and AI Kaiwa practice.',
  icons: {
    icon: '/icon.png',
    shortcut: '/icon.png',
    apple: '/icon.png',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-paper text-ink antialiased">
        <div className="flex min-h-screen flex-col">
          <nav className="sticky top-0 z-40 border-b-2 border-border bg-paper/95 backdrop-blur">
            <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
              <Link href="/" className="group inline-flex items-center gap-3">
                <LogoMark className="brutal-border h-12 w-12 rotate-[-7deg] shadow-nav transition-transform group-hover:rotate-0" />
                <span>
                  <span className="block font-display text-2xl leading-none tracking-tight">KAIwa</span>
                  <span className="label-mono block text-[9px] text-aizome">Local study notebook</span>
                </span>
              </Link>

              <div className="hidden items-center gap-2 sm:flex">
                <Badge tone="moss">Local-first</Badge>
                <Button as={Link} href="/dashboard" variant="ghost" size="sm">
                  Dashboard
                </Button>
                <Button as={Link} href="/health" variant="neutral" size="sm">
                  Health
                </Button>
              </div>

              <Button as={Link} href="/dashboard" variant="secondary" size="sm" className="sm:hidden">
                Open
              </Button>
            </div>
          </nav>

          <main className="flex-1">{children}</main>
        </div>
      </body>
    </html>
  );
}
