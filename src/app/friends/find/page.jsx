'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  IoSearchSharp,
  IoCloseSharp,
  IoPersonAddSharp,
  IoChevronForwardSharp,
  IoCheckmarkSharp,
  IoSparklesSharp,
} from 'react-icons/io5';
import InviteFriendsModal from '../../../components/profile/InviteFriendsModal.jsx';
import { cn } from '../../../lib/utils.js';

const MOCK_RESULTS = [
  { id: 1, name: 'rielle', handle: '@rielle', initials: 'R', bg: 'bg-sky-400', isFollowing: false },
  { id: 2, name: 'Rielle', handle: '@X_rielley', initials: 'R', bg: 'bg-pink-400', isFollowing: true },
  { id: 3, name: 'Rielle', handle: '@Rielle669238', initials: 'R', bg: 'bg-amber-400', isFollowing: false },
  { id: 4, name: 'Rielle', handle: '@rielleization', initials: 'R', bg: 'bg-emerald-400', isFollowing: false },
  { id: 5, name: 'Rielle', handle: '@Rielle714900', initials: 'R', bg: 'bg-rose-400', isFollowing: false },
  { id: 6, name: 'Rielle', handle: '@myangelmariel', initials: 'R', bg: 'bg-indigo-400', isFollowing: false },
];

export default function FindFriendsPage() {
  const [searchQuery, setSearchQuery] = useState('Rielle');
  const [resultsList, setResultsList] = useState(MOCK_RESULTS);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  const filteredResults = resultsList.filter(
    (u) =>
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.handle.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleToggleFollow = (id) => {
    setResultsList((prev) =>
      prev.map((u) => (u.id === id ? { ...u, isFollowing: !u.isFollowing } : u))
    );
  };

  const handleInvite = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(window.location.origin + '/invite');
    }
    setToastMsg('Invite link copied to clipboard!');
    setTimeout(() => setToastMsg(''), 3000);
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6 text-ink">
      {toastMsg && (
        <div className="fixed top-6 right-6 z-50 brutal-border bg-mustard p-3 font-mono text-xs font-black uppercase text-ink shadow-nav animate-panel-in flex items-center gap-2">
          <IoSparklesSharp className="text-shu text-base" /> {toastMsg}
        </div>
      )}

      {/* Header */}
      <div>
        <h1 className="font-display text-4xl leading-none">Search for friends</h1>
      </div>

      {/* Search Input Bar */}
      <div className="relative">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search name or @username..."
          className="w-full brutal-border bg-white py-3 pl-10 pr-10 font-mono text-sm font-bold shadow-nav outline-none focus:bg-paper"
        />
        <IoSearchSharp className="absolute left-3.5 top-3.5 text-ink/60 text-lg" />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-3 text-ink/60 hover:text-ink text-lg"
          >
            <IoCloseSharp />
          </button>
        )}
      </div>

      <div className="border-b-2 border-ink/20 pt-1" />

      {/* 2-Column Layout */}
      <div className="grid gap-6 md:grid-cols-[1fr_18rem] items-start">
        {/* Left Column: Results List */}
        <div>
          <div className="flex items-center justify-between mb-3 font-mono text-xs font-black uppercase">
            <span>{filteredResults.length} results</span>
          </div>

          <div className="brutal-border bg-white divide-y-2 divide-ink shadow-nav overflow-hidden">
            {filteredResults.length > 0 ? (
              filteredResults.map((user) => (
                <div key={user.id} className="p-3.5 flex items-center justify-between gap-3 hover:bg-paper/40 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={cn("brutal-border h-11 w-11 shrink-0 rounded-full grid place-items-center font-mono font-black text-white text-lg shadow-nav", user.bg)}>
                      {user.initials}
                    </div>
                    <div className="min-w-0">
                      <p className="font-display text-lg leading-tight truncate">{user.name}</p>
                      <p className="font-mono text-xs text-ink/60 font-bold truncate">{user.handle}</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleToggleFollow(user.id)}
                    className={cn(
                      "brutal-border px-3.5 py-1.5 font-mono text-xs font-black uppercase tracking-wider shadow-nav transition-all active:scale-95 flex items-center gap-1.5 shrink-0",
                      user.isFollowing
                        ? "bg-paper text-ink/60 border-ink/40 shadow-none"
                        : "bg-sky-400 text-ink hover:bg-mustard"
                    )}
                  >
                    {user.isFollowing ? (
                      <>
                        <IoCheckmarkSharp className="text-sm text-emerald-600" /> FOLLOWING
                      </>
                    ) : (
                      <>
                        <IoPersonAddSharp className="text-xs" /> + FOLLOW
                      </>
                    )}
                  </button>
                </div>
              ))
            ) : (
              <div className="p-8 text-center font-mono text-xs font-bold text-ink/50">
                No friends found matching &quot;{searchQuery}&quot;.
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Other ways to connect */}
        <div>
          <h4 className="font-mono text-xs font-black uppercase mb-3 text-ink/70">Other ways to connect</h4>
          <div className="brutal-border bg-white p-4 shadow-nav space-y-3">
            <div className="flex items-start gap-3">
              <div className="brutal-border h-10 w-10 shrink-0 bg-mustard grid place-items-center font-mono font-black text-lg">
                💮
              </div>
              <div className="min-w-0">
                <h5 className="font-display text-base leading-snug">Invite friends</h5>
                <p className="text-xs font-bold text-ink/75 leading-relaxed mt-0.5">
                  Tell your friends it&apos;s free and fun to learn Japanese on KAIwa!
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowInviteModal(true)}
              className="w-full brutal-border bg-mustard p-2.5 font-mono text-xs font-black uppercase text-ink shadow-nav hover:bg-shu hover:text-paper transition-all flex items-center justify-between group active:scale-95"
            >
              <span>Copy Invite Link</span>
              <IoChevronForwardSharp className="group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        </div>
      </div>

      {showInviteModal && <InviteFriendsModal onClose={() => setShowInviteModal(false)} />}
    </div>
  );
}
