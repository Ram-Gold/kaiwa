import '../index.css';

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
      <body className="min-h-screen bg-paper text-ink antialiased">{children}</body>
    </html>
  );
}
