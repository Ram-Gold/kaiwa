import Link from 'next/link';

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-4">
        Master Japanese with <span className="text-blue-600">KAIwa</span>
      </h1>
      <p className="text-lg md:text-xl text-gray-600 mb-8 max-w-2xl">
        A fully local AI-powered tutor for your JLPT preparation. 
        Practice natural conversations and level up your skills.
      </p>
      <Link href="/dashboard" className="bg-blue-600 text-white px-8 py-3 rounded-full font-semibold hover:bg-blue-700 transition shadow-lg hover:shadow-xl">
        Go to Dashboard
      </Link>
    </div>
  );
}
