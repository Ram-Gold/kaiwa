'use client';

import AboutPanel from './AboutPanel.jsx';
import BadgeShelf from './BadgeShelf.jsx';
import ProfileHeader from './ProfileHeader.jsx';
import ProfileStats from './ProfileStats.jsx';
import { useEffect, useState } from 'react';
import { useAuth } from '../../lib/auth/AuthContext.jsx';
import { getUserLinks, getUserBadges, getFriends } from '../../lib/firebase/firestore.js';

export default function ProfilePage({ profile: fallbackProfile }) {
  const { user, profile: authProfile } = useAuth();
  const [subData, setSubData] = useState({ links: null, badges: null, friends: null });

  useEffect(() => {
    let isMounted = true;
    async function loadSubcollections() {
      if (!user?.uid) return;
      const [fetchedLinks, fetchedBadges, fetchedFriends] = await Promise.all([
        getUserLinks(user.uid),
        getUserBadges(user.uid),
        getFriends(user.uid)
      ]);
      if (isMounted) {
        setSubData({
          links: fetchedLinks.map(l => ({ label: l.title, href: l.url, shortLabel: l.title.substring(0, 3) })),
          badges: fetchedBadges,
          friends: fetchedFriends
        });
      }
    }
    loadSubcollections();
    return () => { isMounted = false; };
  }, [user?.uid]);

  // Merge auth profile or user details over fallback profile
  const displayProfile = {
    ...fallbackProfile,
    ...(authProfile || {}),
    displayName: authProfile?.displayName || user?.displayName || fallbackProfile?.displayName || 'Learner',
    bio: authProfile?.bio || authProfile?.aboutMe || fallbackProfile?.bio,
    avatarInitials: (authProfile?.displayName || user?.displayName || fallbackProfile?.displayName || 'L')
      .split(' ')
      .map((n) => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase(),
    socialLinks: subData.links || fallbackProfile?.socialLinks,
    badges: subData.badges || fallbackProfile?.badges,
    community: subData.friends ? { ...fallbackProfile?.community, followingList: subData.friends } : fallbackProfile?.community,
  };

  return (
    <div className="mx-auto max-w-6xl">
      <div className="grid gap-5">
        <ProfileHeader profile={displayProfile} />

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_10rem] lg:items-start">
          <AboutPanel bio={displayProfile.bio} />
          <ProfileStats stats={displayProfile.stats} />
          <BadgeShelf badges={displayProfile.badges} className="lg:col-span-2" />
        </div>
      </div>
    </div>
  );
}
