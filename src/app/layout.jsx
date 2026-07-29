import '../index.css';
import Link from 'next/link';

export const metadata = {
  title: 'KAIwa - Japanese Tutor',
  description: 'AI-powered local Japanese language tutor.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="antialiased bg-gray-50 text-gray-900 min-h-screen flex flex-col">
        <nav className="w-full p-4 border-b bg-white shadow-sm flex justify-between items-center">
          <Link href="/" className="font-bold text-xl text-blue-600 tracking-tight">KAIwa</Link>
          <div className="flex gap-6 font-medium text-sm">
            <Link href="/dashboard" className="text-gray-600 hover:text-gray-900 transition">Dashboard</Link>
            <Link href="/health" className="text-gray-600 hover:text-gray-900 transition">Health Check</Link>
          </div>
        </nav>
        <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </body>
    </html>
  );
}
