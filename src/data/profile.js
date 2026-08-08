export const defaultProfile = {
  displayName: 'Ram',
  username: 'ram',
  userType: 'DEVELOPER',
  tier: 'DEVELOPER',
  joinedAt: 'August 7, 202X',

  bio:
    'Lead Developer & Admin of KAIwa. Building local-first cross-platform Japanese learning tools with AI.',
  avatarInitials: 'RAM',

  socialLinks: [
    { label: 'GitHub', href: '#', shortLabel: 'GH' },
    { label: 'Portfolio', href: '#', shortLabel: 'WWW' },
  ],
  stats: [
    { label: 'Total Streak', value: '10', accent: 'correction' },
    { label: 'Total XP', value: '1245', accent: 'aizome' },
  ],
  community: {
    followers: 128,
    following: 42,
    followingList: [
      { id: 'dianna', name: 'Dianna', xp: 933327, initials: 'DI', tone: 'correction' },
      { id: 'elder-wright', name: 'Elder Wright', xp: 303757, initials: 'EW', tone: 'aizome' },
      { id: 'sebastian-helzer', name: 'Sebastian Helzer', xp: 116441, initials: 'SH', tone: 'moss' },
    ],
    followerList: [
      { id: 'hana', name: 'Hana Mori', xp: 84220, initials: 'HM', tone: 'mustard' },
      { id: 'ren', name: 'Ren Sato', xp: 53104, initials: 'RS', tone: 'aizome' },
    ],
  },
  badges: [
    {
      id: 'donator',
      title: 'Donator Badge',
      icon: '♥',
      description: 'Thank you for your support',
      tone: 'correction',
    },
    {
      id: 'xp-1000',
      title: '1000 XP',
      icon: '✨',
      description: 'Reached 1000 XP',
      tone: 'mustard',
    },
    {
      id: 'contributor',
      title: 'Contributor',
      icon: '🐙',
      description: 'Thanks for contributing',
      tone: 'aizome',
    },
  ],
  streak: {
    current: 10,
    best: 18,
    days: [
      { label: 'Mon', active: true },
      { label: 'Tue', active: true },
      { label: 'Wed', active: true },
      { label: 'Thu', active: true },
      { label: 'Fri', active: true },
      { label: 'Sat', active: false },
      { label: 'Sun', active: false },
    ],
  },
};
