import Link from 'next/link';

export default function Dashboard() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-gray-500 mt-2">Manage your JLPT studies and chat personas.</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="border rounded-2xl p-6 bg-white shadow-sm hover:shadow-md transition">
            <h3 className="font-bold text-lg mb-2 text-gray-900">Persona {i}</h3>
            <p className="text-gray-600 text-sm mb-6">Practice conversation tailored to N5 vocabulary with this AI persona.</p>
            <Link href={`/chat/persona-${i}`} className="inline-flex items-center text-blue-600 font-medium hover:text-blue-700 transition">
              Start Chat <span className="ml-2">&rarr;</span>
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
