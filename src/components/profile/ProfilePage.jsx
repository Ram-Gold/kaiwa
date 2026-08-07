import AboutPanel from './AboutPanel.jsx';
import BadgeShelf from './BadgeShelf.jsx';
import ProfileHeader from './ProfileHeader.jsx';
import ProfileStats from './ProfileStats.jsx';

export default function ProfilePage({ profile }) {
  return (
    <div className="mx-auto max-w-6xl">
      <div className="grid gap-5">
        <ProfileHeader profile={profile} />

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_10rem] lg:items-start">
          <AboutPanel bio={profile.bio} />
          <ProfileStats stats={profile.stats} />
          <BadgeShelf badges={profile.badges} className="lg:col-span-2" />
        </div>
      </div>
    </div>
  );
}
