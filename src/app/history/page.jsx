'use client';

import { useEffect, useState } from 'react';
import HistoryLedger from '../../components/history/HistoryLedger.jsx';
import { useAuth } from '../../lib/auth/AuthContext.jsx';
import { fetchPracticeHistory } from '../../lib/firebase/firestore.js';

export default function HistoryPage() {
  const { user, loading: authLoading } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadHistory() {
      if (!user) {
        setSessions([]);
        setLoading(false);
        return;
      }
      try {
        const result = await fetchPracticeHistory(user.uid, 50); // Fetch up to 50 for now
        setSessions(result.docs);
      } catch (error) {
        console.error('Error fetching practice history:', error);
      } finally {
        setLoading(false);
      }
    }

    if (!authLoading) {
      loadHistory();
    }
  }, [user, authLoading]);

  if (authLoading || loading) {
    return (
      <div className="mx-auto flex max-w-7xl items-center justify-center px-4 py-32 sm:px-6 lg:px-8">
        <div className="flex animate-pulse items-center gap-3 font-mono text-sm font-black uppercase tracking-[0.14em] text-ink/60">
          <span className="h-4 w-4 rounded-full bg-mustard"></span>
          Loading history...
        </div>
      </div>
    );
  }

  return <HistoryLedger sessions={sessions} />;
}
