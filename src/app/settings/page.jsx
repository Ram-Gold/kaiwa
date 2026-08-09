'use client';

import { useRouter } from 'next/navigation';
import GlobalSettingsModal from '../../components/shell/GlobalSettingsModal.jsx';

export default function SettingsPage() {
  const router = useRouter();

  return (
    <div className="relative min-h-[80vh]">
      <GlobalSettingsModal onClose={() => router.push('/')} />
    </div>
  );
}
