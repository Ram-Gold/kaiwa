import '../index.css';
import AppShell from '../components/shell/AppShell.jsx';

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
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
