import React, { useState, useEffect, useMemo } from 'react';
import { IoPersonSharp, IoAddSharp, IoTrashSharp, IoLinkSharp, IoCheckmarkSharp, IoLogoGithub, IoCameraSharp } from 'react-icons/io5';
import { cn } from '../../lib/utils.js';
import { useAuth } from '../../lib/auth/AuthContext';
import { 
  updateProfile, 
  getUserLinks, 
  addProfileLink, 
  updateProfileLink, 
  removeProfileLink 
} from '../../lib/firebase/firestore';
import ConfirmChangesModal from './ConfirmChangesModal.jsx';

const STORAGE_KEY = 'kaiwa.user.profile';

export const AVATAR_TONES = [
  { id: 'mustard', label: 'Mustard Yellow', bgClass: 'bg-mustard text-ink' },
  { id: 'aizome', label: 'Aizome Blue', bgClass: 'bg-aizome text-paper' },
  { id: 'shu', label: 'Shu Red', bgClass: 'bg-shu text-paper' },
  { id: 'moss', label: 'Moss Green', bgClass: 'bg-moss text-paper' },
  { id: 'correction', label: 'Correction Purple', bgClass: 'bg-correction text-paper' },
];

export const DEFAULT_PROFILE = {
  name: 'Ram',
  avatarTone: 'mustard',
  avatarUrl: '',
  userType: 'DEVELOPER',
  tier: 'DEVELOPER',
  aboutMe: 'Lead Developer & Admin of KAIwa. Building local-first cross-platform Japanese learning tools with AI.',
  links: [
    { id: '1', title: 'GitHub', url: 'https://github.com' },
    { id: '2', title: 'Portfolio', url: 'https://kaiwa.local' },
  ]
};

function getLocalStorageProfile() {
  if (typeof window === 'undefined') return DEFAULT_PROFILE;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_PROFILE;
    return { ...DEFAULT_PROFILE, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_PROFILE;
  }
}

export function useProfileState(onSaveCallback) {
  const { user, profile } = useAuth();
  const [savedProfile, setSavedProfile] = useState(DEFAULT_PROFILE);
  const [draft, setDraft] = useState(DEFAULT_PROFILE);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');

  useEffect(() => {
    let isMounted = true;
    async function loadProfile() {
      if (user && profile) {
        const userLinks = await getUserLinks(user.uid);
        if (isMounted) {
          const fullProfile = { 
            ...DEFAULT_PROFILE,
            ...profile, 
            name: profile.displayName || profile.name || DEFAULT_PROFILE.name,
            aboutMe: profile.bio || profile.aboutMe || DEFAULT_PROFILE.aboutMe,
            avatarTone: profile.avatarTone || DEFAULT_PROFILE.avatarTone,
            avatarUrl: profile.photoURL || profile.avatarUrl || '',
            links: userLinks?.length ? userLinks : (profile?.createdAt ? [] : DEFAULT_PROFILE.links) 
          };
          setSavedProfile(fullProfile);
          setDraft(fullProfile);
        }
      } else {
        if (isMounted) {
          const loaded = getLocalStorageProfile();
          setSavedProfile(loaded);
          setDraft(loaded);
        }
      }
    }
    loadProfile();
    return () => { isMounted = false; };
  }, [user, profile]);

  const isDirty = useMemo(() => {
    return draft.name !== savedProfile.name || 
           draft.avatarTone !== savedProfile.avatarTone ||
           draft.avatarUrl !== savedProfile.avatarUrl ||
           draft.aboutMe !== savedProfile.aboutMe || 
           JSON.stringify(draft.links) !== JSON.stringify(savedProfile.links);
  }, [savedProfile, draft]);

  function setName(name) {
    setDraft((prev) => ({ ...prev, name }));
    setSaveSuccessMsg('');
  }

  function setAvatarTone(avatarTone) {
    setDraft((prev) => ({ ...prev, avatarTone }));
    setSaveSuccessMsg('');
  }

  function setAvatarUrl(avatarUrl) {
    setDraft((prev) => ({ ...prev, avatarUrl }));
    setSaveSuccessMsg('');
  }

  function setAboutMe(aboutMe) {
    setDraft((prev) => ({ ...prev, aboutMe }));
    setSaveSuccessMsg('');
  }

  function addLink() {
    const newLink = {
      id: `temp_${Date.now()}`,
      title: 'New Link',
      url: 'https://'
    };
    setDraft((prev) => ({ ...prev, links: [...prev.links, newLink] }));
  }

  function addGithubLink() {
    const githubLink = {
      id: `temp_${Date.now()}`,
      title: 'GitHub',
      url: 'https://github.com/'
    };
    setDraft((prev) => ({ ...prev, links: [...prev.links, githubLink] }));
  }

  function updateLink(id, field, value) {
    setDraft((prev) => ({
      ...prev,
      links: prev.links.map(l => l.id === id ? { ...l, [field]: value } : l)
    }));
  }

  function removeLink(id) {
    setDraft((prev) => ({
      ...prev,
      links: prev.links.filter(l => l.id !== id)
    }));
  }

  function cancelChanges() {
    setDraft(savedProfile);
    setSaveSuccessMsg('');
  }

  async function saveChanges() {
    setSavedProfile(draft);
    
    if (user) {
      await updateProfile(user.uid, {
        displayName: draft.name,
        name: draft.name,
        avatarTone: draft.avatarTone,
        photoURL: draft.avatarUrl,
        avatarUrl: draft.avatarUrl,
        bio: draft.aboutMe,
        aboutMe: draft.aboutMe,
      });

      const currentLinks = await getUserLinks(user.uid);
      const currentMap = new Map(currentLinks.map(l => [l.id, l]));

      for (const link of draft.links) {
        if (link.id.startsWith('temp_')) {
          await addProfileLink(user.uid, { title: link.title, url: link.url });
        } else if (currentMap.has(link.id)) {
          const original = currentMap.get(link.id);
          if (original.title !== link.title || original.url !== link.url) {
            await updateProfileLink(user.uid, link.id, { title: link.title, url: link.url });
          }
        }
      }

      for (const original of currentLinks) {
        if (!draft.links.some(l => l.id === original.id)) {
          await removeProfileLink(user.uid, original.id);
        }
      }
      
      const freshLinks = await getUserLinks(user.uid);
      setDraft((prev) => ({ ...prev, links: freshLinks }));
      setSavedProfile((prev) => ({ ...prev, links: freshLinks }));
    }

    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
      window.dispatchEvent(new Event('kaiwa:profile-updated'));
    }
    
    if (onSaveCallback) {
      onSaveCallback(draft);
    }
    setSaveSuccessMsg('Profile & settings saved successfully!');
    setTimeout(() => setSaveSuccessMsg(''), 3000);
  }

  return {
    savedProfile,
    draft,
    isDirty,
    saveSuccessMsg,
    setName,
    setAvatarTone,
    setAvatarUrl,
    setAboutMe,
    addLink,
    addGithubLink,
    updateLink,
    removeLink,
    cancelChanges,
    saveChanges
  };
}

export default function ProfileSettings({ onSaveProfile }) {
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const {
    draft,
    isDirty,
    saveSuccessMsg,
    setName,
    setAvatarTone,
    setAvatarUrl,
    setAboutMe,
    addLink,
    addGithubLink,
    updateLink,
    removeLink,
    cancelChanges,
    saveChanges
  } = useProfileState(onSaveProfile);

  const selectedToneObj = AVATAR_TONES.find(t => t.id === (draft.avatarTone || 'mustard')) || AVATAR_TONES[0];
  const userInitials = (draft.name || 'Ram').charAt(0).toUpperCase();

  function handleConfirmSave() {
    setIsConfirmOpen(false);
    saveChanges();
  }

  return (
    <div className="animate-panel-in space-y-5 relative pb-12">
      {/* Header */}
      <div>
        <span className="label-mono text-correction">User Profile</span>
        <h3 className="mt-1 font-display text-4xl leading-none">Profile Settings</h3>
        <p className="mt-2 text-xs font-bold leading-5 opacity-75">
          Update your public profile picture, display name, about me context for AI, and GitHub/social links.
        </p>
      </div>

      {saveSuccessMsg && (
        <div className="brutal-border bg-moss/15 border-l-4 border-l-moss p-3 font-mono text-xs font-bold text-moss flex items-center gap-2">
          <IoCheckmarkSharp className="text-base shrink-0" />
          {saveSuccessMsg}
        </div>
      )}

      {/* 1. Profile Picture / Avatar Card */}
      <div className="brutal-border bg-white p-4 shadow-nav space-y-4">
        <div className="flex items-center justify-between border-b border-ink/10 pb-2">
          <label className="font-mono text-xs font-black uppercase tracking-[0.14em] text-ink flex items-center gap-1.5">
            <IoCameraSharp className="text-aizome" /> Profile Picture & Avatar
          </label>
          <span className="font-mono text-[10px] font-bold text-ink/50">Customizable</span>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="relative shrink-0">
            {draft.avatarUrl ? (
              <img 
                src={draft.avatarUrl} 
                alt="Profile Avatar" 
                className="brutal-border h-20 w-20 rounded-full object-cover shadow-nav"
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
              />
            ) : (
              <div className={cn('brutal-border grid h-20 w-20 place-items-center rounded-full font-mono text-2xl font-black shadow-nav', selectedToneObj.bgClass)}>
                {userInitials}
              </div>
            )}
          </div>

          <div className="w-full space-y-3">
            <div>
              <p className="font-mono text-xs font-bold mb-1.5">Avatar Color Tone</p>
              <div className="flex flex-wrap gap-2">
                {AVATAR_TONES.map((tone) => (
                  <button
                    key={tone.id}
                    type="button"
                    onClick={() => setAvatarTone(tone.id)}
                    className={cn(
                      'brutal-border px-2.5 py-1 font-mono text-[10px] font-black uppercase shadow-nav transition-all hover:scale-105 cursor-pointer',
                      tone.bgClass,
                      (draft.avatarTone || 'mustard') === tone.id && 'ring-2 ring-ink ring-offset-2'
                    )}
                  >
                    {tone.label.split(' ')[0]}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="font-mono text-xs font-bold mb-1">Image URL (Optional)</p>
              <input
                type="url"
                value={draft.avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                placeholder="https://example.com/avatar.jpg"
                className="brutal-border w-full bg-paper px-3 py-1.5 font-mono text-xs font-bold outline-none focus:bg-white"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 2. Display Name Card */}
      <div className="brutal-border bg-white p-4 shadow-nav space-y-3">
        <div className="flex items-center justify-between border-b border-ink/10 pb-2">
          <label className="font-mono text-xs font-black uppercase tracking-[0.14em] text-ink flex items-center gap-1.5">
            <IoPersonSharp className="text-shu" /> Display Name
          </label>
          <span className="font-mono text-[10px] font-bold text-ink/50">Required</span>
        </div>
        <input
          type="text"
          value={draft.name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter your display name..."
          className="brutal-border w-full bg-paper px-3 py-2 font-mono text-sm font-bold shadow-shadow outline-none focus:bg-white"
        />
      </div>

      {/* 3. Bio / About Me */}
      <div className="brutal-border bg-white p-4 shadow-nav space-y-3">
        <div className="flex items-center justify-between border-b border-ink/10 pb-2">
          <label className="font-mono text-xs font-black uppercase tracking-[0.14em] text-ink">
            About Me / Bio
          </label>
          <span className="font-mono text-[10px] font-bold text-ink/50">{draft.aboutMe?.length || 0} chars</span>
        </div>
        <textarea
          rows={3}
          value={draft.aboutMe}
          onChange={(e) => setAboutMe(e.target.value)}
          placeholder="Tell us about yourself, your background, and your Japanese learning goals..."
          className="brutal-border w-full bg-paper px-3 py-2 font-mono text-xs font-bold shadow-shadow outline-none resize-none focus:bg-white leading-relaxed"
        />
        <p className="font-mono text-[10px] font-bold text-ink/60">
          This "About Me" information is included in your AI tutor conversations so responses adapt to you.
        </p>
      </div>

      {/* 4. Profile Links */}
      <div className="brutal-border bg-white p-4 shadow-nav space-y-3">
        <div className="flex items-center justify-between border-b border-ink/10 pb-2">
          <label className="font-mono text-xs font-black uppercase tracking-[0.14em] text-ink flex items-center gap-1.5">
            <IoLinkSharp className="text-aizome" /> GitHub & Personal Links
          </label>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={addGithubLink}
              className="brutal-border bg-aizome px-2.5 py-1 font-mono text-[10px] font-black uppercase text-paper shadow-nav hover:bg-mustard hover:text-ink transition-all inline-flex items-center gap-1 cursor-pointer"
            >
              <IoLogoGithub className="text-sm" /> Add GitHub
            </button>
            <button
              type="button"
              onClick={addLink}
              className="brutal-border bg-mustard px-2.5 py-1 font-mono text-[10px] font-black uppercase text-ink shadow-nav hover:bg-paper transition-all inline-flex items-center gap-1 cursor-pointer"
            >
              <IoAddSharp className="text-sm" /> Add Link
            </button>
          </div>
        </div>

        <div className="space-y-2">
          {draft.links.map((link) => (
            <div key={link.id} className="brutal-border bg-paper p-2.5 shadow-nav flex items-center gap-2 flex-wrap sm:flex-nowrap">
              <input
                type="text"
                value={link.title}
                onChange={(e) => updateLink(link.id, 'title', e.target.value)}
                placeholder="Title (e.g. GitHub)"
                className="brutal-border w-32 bg-white px-2 py-1 font-mono text-xs font-bold outline-none"
              />
              <input
                type="url"
                value={link.url}
                onChange={(e) => updateLink(link.id, 'url', e.target.value)}
                placeholder="https://..."
                className="brutal-border flex-1 min-w-[150px] bg-white px-2 py-1 font-mono text-xs font-bold outline-none"
              />
              <button
                type="button"
                onClick={() => removeLink(link.id)}
                aria-label="Remove link"
                className="brutal-border grid h-7 w-7 place-items-center bg-white text-shu hover:bg-shu hover:text-white transition-colors shrink-0 cursor-pointer"
              >
                <IoTrashSharp className="text-xs" />
              </button>
            </div>
          ))}
          {draft.links.length === 0 && (
            <p className="font-mono text-xs font-bold text-ink/50 text-center py-2">No links added yet.</p>
          )}
        </div>
      </div>

      {/* Floating Action Bar */}
      {isDirty && (
        <div className="animate-panel-in brutal-border bg-ink p-3 text-paper shadow-shadow flex items-center justify-between gap-3 flex-wrap sticky bottom-0 z-30">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-mustard animate-pulse" />
            <span className="font-mono text-xs font-bold text-mustard uppercase tracking-wider">Unsaved Changes</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={cancelChanges}
              className="brutal-border bg-white px-3 py-1.5 font-mono text-xs font-black uppercase text-ink shadow-nav hover:bg-paper transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => setIsConfirmOpen(true)}
              className="brutal-border bg-mustard px-4 py-1.5 font-mono text-xs font-black uppercase text-ink shadow-nav hover:bg-paper transition-all cursor-pointer"
            >
              Save Changes
            </button>
          </div>
        </div>
      )}

      {/* User Confirmation Modal */}
      <ConfirmChangesModal
        isOpen={isConfirmOpen}
        onConfirm={handleConfirmSave}
        onCancel={() => setIsConfirmOpen(false)}
        title="Confirm Changes"
        message="Are you sure you want to save these profile changes?"
      />
    </div>
  );
}
