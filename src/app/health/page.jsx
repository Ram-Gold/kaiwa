export const dynamic = 'force-dynamic';

export default async function HealthCheck() {
  // Fetch placeholder data as required by assignment
  const res = await fetch('https://jsonplaceholder.typicode.com/posts/1', { cache: 'no-store' });
  const data = await res.json();

  return (
    <div className="max-w-2xl">
      <h1 className="text-3xl font-bold mb-6">System Health</h1>
      
      <div className="p-6 border rounded-2xl bg-emerald-50 border-emerald-100 text-emerald-900 mb-8 flex items-center gap-4">
        <div className="h-4 w-4 bg-emerald-500 rounded-full animate-pulse"></div>
        <div>
          <h2 className="font-bold">All systems operational</h2>
          <p className="text-sm text-emerald-700">The application is running and able to reach external services.</p>
        </div>
      </div>
      
      <div className="border rounded-2xl overflow-hidden bg-white shadow-sm">
        <div className="border-b p-4 bg-gray-50">
          <h2 className="text-lg font-semibold">External API Connectivity Test</h2>
          <p className="text-sm text-gray-500">Fetched from JSONPlaceholder API</p>
        </div>
        <div className="p-0">
          <pre className="bg-gray-900 text-gray-100 p-6 overflow-x-auto text-sm font-mono m-0">
            {JSON.stringify(data, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
}
