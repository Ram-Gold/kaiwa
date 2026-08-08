import { useState, useEffect } from 'react';
import Link from 'next/link';
import { IoSearchSharp, IoChevronForwardSharp, IoPersonAddSharp } from 'react-icons/io5';
import Badge from '../ui/Badge.jsx';
import Card from '../ui/Card.jsx';
import InviteFriendsModal from './InviteFriendsModal.jsx';
import { cn } from '../../lib/utils.js';

import { useAuth } from '../../lib/auth/AuthContext.jsx';
import { getFriends } from '../../lib/firebase/firestore.js';

export default function ProfileRail({ profile: fallbackProfile }) {
  const { user, profile: authProfile } = useAuth();
  const [friends, setFriends] = useState(null);

  useEffect(() => {
    let isMounted = true;
    async function loadFriends() {
      if (!user?.uid) return;
      const fetchedFriends = await getFriends(user.uid);
      if (isMounted) setFriends(fetchedFriends);
    }
    loadFriends();
    return () => { isMounted = false; };
  }, [user?.uid]);

  const mergedStreak = {
    current: authProfile?.stats?.currentStreak ?? fallbackProfile.streak?.current ?? 0,
    best: authProfile?.stats?.longestStreak ?? fallbackProfile.streak?.best ?? 0,
    days: authProfile?.stats?.days ?? fallbackProfile.streak?.days ?? []
  };

  const mergedCommunity = friends 
    ? { 
        ...fallbackProfile.community, 
        followingList: friends.map(f => ({
          id: f.friendUserId,
          name: f.displayName || 'Learner',
          xp: 0,
          initials: (f.displayName || 'L').charAt(0).toUpperCase(),
          tone: 'mustard'
        })), 
        following: friends.length, 
        followers: 0, 
        followerList: [] 
      } 
    : fallbackProfile.community;

  return (
    <aside
      aria-label="Profile progress and community"
      className="border-t-2 border-border bg-paper px-4 py-6 sm:px-6 lg:sticky lg:top-0 lg:min-h-screen lg:border-l-2 lg:border-t-0 lg:px-5 lg:py-10"
    >
      <div className="grid gap-5">
        <StreakSummary streak={mergedStreak} />
        <FriendsSection />
        <ConnectionsCard community={mergedCommunity} />
      </div>
    </aside>
  );
}

function FriendsSection() {
  const [showInviteModal, setShowInviteModal] = useState(false);

  return (
    <div className="space-y-2">
      <p className="label-mono text-correction px-1">Friends</p>
      
      <div className="space-y-2">
        {/* Find friends link button (Navigates to /friends/find) */}
        <Link
          href="/friends/find"
          className="w-full brutal-border bg-paper p-3 font-mono text-xs font-black uppercase tracking-[0.11em] text-ink shadow-nav hover:bg-mustard transition-all flex items-center justify-between group active:scale-95"
        >
          <div className="flex items-center gap-2">
            <IoSearchSharp className="text-sm text-ink/70 group-hover:text-ink" />
            <span>Find friends</span>
          </div>
          <IoChevronForwardSharp className="text-sm text-ink/60 group-hover:translate-x-0.5 transition-transform" />
        </Link>

        {/* Invite Friends button */}
        <button
          type="button"
          onClick={() => setShowInviteModal(true)}
          className="w-full brutal-border bg-mustard p-3 font-mono text-xs font-black uppercase tracking-[0.11em] text-ink shadow-nav hover:bg-shu hover:text-paper transition-all flex items-center justify-center gap-2 active:scale-95"
        >
          <IoPersonAddSharp className="text-sm" />
          <span>Invite Friends</span>
        </button>
      </div>

      {showInviteModal && <InviteFriendsModal onClose={() => setShowInviteModal(false)} />}
    </div>
  );
}



function StreakSummary({ streak }) {
  return (
    <Card padding="md" className="min-h-48 bg-white">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="label-mono text-correction">Streak</p>
          <p className="mt-3 font-display text-5xl leading-none">{streak.current}</p>
          <p className="mt-2 font-mono text-xs font-black uppercase tracking-[0.13em] text-ink/65">days active</p>
        </div>
        <Badge tone="mustard" className="shrink-0">Best {streak.best}</Badge>
      </div>

      <div className="mt-5 grid grid-cols-7 gap-1.5" aria-label="Last seven days streak calendar">
        {streak.days.map((day) => (
          <div key={day.label} className="text-center">
            <div
              className={cn(
                'brutal-border mx-auto grid h-7 w-7 place-items-center font-mono text-[10px] font-black shadow-nav',
                day.active ? 'bg-moss text-paper' : 'bg-paper text-ink/45',
              )}
            >
              {day.active ? '✓' : '·'}
            </div>
            <p className="mt-1 font-mono text-[8px] font-black uppercase">{day.label}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}


function ConnectionsCard({ community }) {
  const [activeTab, setActiveTab] = useState('following');
  const followingList = community.followingList ?? [];
  const followerList = community.followerList ?? [];

  return (
    <Card padding="none" className="overflow-hidden bg-white">
      <div className="grid grid-cols-2 border-b-2 border-border text-center font-mono text-xs font-black uppercase tracking-[0.14em]">
        <button
          type="button"
          onClick={() => setActiveTab('following')}
          className={cn(
            "border-r-2 border-border px-3 py-4 transition-colors",
            activeTab === 'following' ? "bg-mustard" : "bg-paper hover:bg-mustard/50"
          )}
        >
          <p>Following</p>
          <p className="mt-1 text-[10px] text-ink/60">{community.following}</p>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('followers')}
          className={cn(
            "px-3 py-4 transition-colors",
            activeTab === 'followers' ? "bg-mustard" : "bg-paper hover:bg-mustard/50"
          )}
        >
          <p>Followers</p>
          <p className="mt-1 text-[10px] text-ink/60">{community.followers}</p>
        </button>
      </div>

      {activeTab === 'following' ? (
        <>
          <div className="grid gap-3 p-4" aria-label="Following preview">
            {followingList.length > 0 ? (
              followingList.slice(0, 3).map((person) => (
                <ConnectionRow key={person.id} person={person} />
              ))
            ) : (
              <p className="text-center font-mono text-xs font-bold text-ink/50 py-4">No following yet.</p>
            )}
          </div>
          <div className="border-t-2 border-border bg-paper p-4">
            <p className="font-mono text-xs font-black uppercase tracking-[0.13em] text-ink/70">
              View {Math.max(0, community.following - followingList.length)} more following
            </p>
          </div>
        </>
      ) : (
        <>
          <div className="grid gap-3 p-4" aria-label="Followers preview">
            {followerList.length > 0 ? (
              followerList.slice(0, 3).map((person) => (
                <ConnectionRow key={person.id} person={person} />
              ))
            ) : (
              <p className="text-center font-mono text-xs font-bold text-ink/50 py-4">No followers yet.</p>
            )}
          </div>
          <div className="border-t-2 border-border bg-paper p-4">
            <p className="font-mono text-xs font-black uppercase tracking-[0.13em] text-ink/70">
              View {Math.max(0, community.followers - followerList.length)} more followers
            </p>
          </div>
        </>
      )}
    </Card>
  );
}

function ConnectionRow({ compact = false, person }) {
  return (
    <article className={cn('grid grid-cols-[2.75rem_minmax(0,1fr)] items-center gap-3', compact && 'grid-cols-[2.5rem_minmax(0,1fr)]')}>
      <div className={cn('brutal-border grid h-11 w-11 place-items-center rounded-full font-mono text-xs font-black shadow-nav', avatarToneClass(person.tone), compact && 'h-10 w-10')}>
        {person.initials}
      </div>
      <div className="min-w-0">
        <h3 className="truncate text-sm font-black leading-tight">{person.name}</h3>
        <p className="mt-1 font-mono text-[10px] font-black uppercase tracking-[0.11em] text-ink/50">{formatNumber(person.xp)} XP</p>
      </div>
    </article>
  );
}

function avatarToneClass(tone) {
  if (tone === 'correction') return 'bg-correction text-paper';
  if (tone === 'aizome') return 'bg-aizome text-paper';
  if (tone === 'moss') return 'bg-moss text-paper';
  return 'bg-mustard text-ink';
}

function formatNumber(value) {
  return new Intl.NumberFormat('en').format(value);
}
