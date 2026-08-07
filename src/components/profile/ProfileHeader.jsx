import { cn } from '../../lib/utils.js';

export default function ProfileHeader({ profile }) {
  return (
    <section aria-labelledby="profile-name" className="grid gap-4 sm:grid-cols-[auto_minmax(0,1fr)] sm:items-center lg:grid-cols-[auto_minmax(0,1fr)_auto]">
      <div className="brutal-border grid h-28 w-28 shrink-0 place-items-center rounded-full border-[7px] border-white bg-mustard font-display text-3xl shadow-shadow sm:h-36 sm:w-36 sm:text-4xl">
        {profile.avatarInitials}
      </div>

      <div className="min-w-0">
        <h1 id="profile-name" className="break-words font-display text-4xl leading-none sm:text-5xl">
          {profile.displayName}
        </h1>
        <p className="mt-2 text-sm font-bold text-ink/70 sm:text-base">Joined: {formatJoinedDate(profile.joinedAt)}</p>
        <p className="mt-3 font-mono text-xs font-black uppercase tracking-[0.13em] text-aizome">@{profile.username}</p>
      </div>

      <SocialLinks links={profile.socialLinks} />
    </section>
  );
}

function SocialLinks({ links }) {
  if (!links?.length) return null;

  return (
    <nav aria-label="Profile social links" className="flex flex-wrap gap-3 sm:col-span-2 sm:justify-end lg:col-span-1">
      {links.map((link) => (
        <a
          key={link.label}
          href={link.href}
          aria-label={link.label}
          className={cn(
            'brutal-border grid h-11 w-11 place-items-center rounded-full bg-white font-mono text-[10px] font-black uppercase shadow-nav transition-all',
            'hover:translate-x-[3px] hover:translate-y-[3px] hover:bg-mustard hover:shadow-none',
          )}
        >
          {link.shortLabel}
        </a>
      ))}
    </nav>
  );
}

function formatJoinedDate(joinedAt) {
  if (!joinedAt) return 'Unknown';

  const date = new Date(joinedAt);
  if (Number.isNaN(date.getTime())) return joinedAt;

  return new Intl.DateTimeFormat('en', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}
