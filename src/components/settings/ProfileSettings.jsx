import { useState, useEffect, useMemo } from 'react';
import { IoPersonSharp, IoAddSharp, IoTrashSharp, IoLinkSharp, IoCheckmarkSharp, IoSparklesSharp } from 'react-icons/io5';
import { cn } from '../../lib/utils.js';
import { useAuth } from '../../lib/auth/AuthContext';
import { 
  updateProfile, 
  getUserLinks, 
  addProfileLink, 
  updateProfileLink, 
  removeProfileLink 
} from '../../lib/firebase/firestore';

const STORAGE_KEY = 'kaiwa.user.profile';

export const DEFAULT_PROFILE = {
  name: 'Ram',
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
    return JSON.parse(raw);
  } catch {
    return DEFAULT_PROFILE;
  }
}

/**
 * Modular hook for Profile State & Actions.
 * Easily connects to backend API endpoints (e.g. fetchProfile, saveProfile).
 */
export function useProfileState(onSaveCallback) {
  const { user, profile } = useAuth();
  const [savedProfile, setSavedProfile] = useState(DEFAULT_PROFILE);
  const [draft, setDraft] = useState(DEFAULT_PROFILE);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');

  useEffect(() => {
    let isMounted = true;
    async function loadProfile() {
      if (user && profile) {
        // Fetch links from subcollection
        const userLinks = await getUserLinks(user.uid);
        if (isMounted) {
          const fullProfile = { ...profile, links: userLinks };
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
    // Only compare relevant editable fields
    return draft.name !== savedProfile.name || 
           draft.aboutMe !== savedProfile.aboutMe || 
           JSON.stringify(draft.links) !== JSON.stringify(savedProfile.links);
  }, [savedProfile, draft]);

  function setName(name) {
    setDraft((prev) => ({ ...prev, name }));
    setSaveSuccessMsg('');
  }

  function setAboutMe(aboutMe) {
    setDraft((prev) => ({ ...prev, aboutMe }));
    setSaveSuccessMsg('');
  }

  function addLink(title = 'New Link', url = 'https://') {
    const newLink = { id: `temp_${Date.now()}`, title, url };
    setDraft((prev) => ({ ...prev, links: [...prev.links, newLink] }));
    setSaveSuccessMsg('');
  }

  function updateLink(id, field, value) {
    setDraft((prev) => ({
      ...prev,
      links: prev.links.map((link) => (link.id === id ? { ...link, [field]: value } : link))
    }));
    setSaveSuccessMsg('');
  }

  function removeLink(id) {
    setDraft((prev) => ({
      ...prev,
      links: prev.links.filter((link) => link.id !== id)
    }));
    setSaveSuccessMsg('');
  }

  function cancelChanges() {
    setDraft(savedProfile);
    setSaveSuccessMsg('');
  }

  async function saveChanges() {
    setSavedProfile(draft);
    
    if (user) {
      // Update core profile fields
      await updateProfile(user.uid, {
        displayName: draft.name,
        bio: draft.aboutMe,
      });

      // Diff links to sync with subcollection
      const savedLinks = savedProfile.links || [];
      const draftLinks = draft.links || [];

      // 1. Remove deleted links
      const draftIds = new Set(draftLinks.map(l => l.id));
      const removedLinks = savedLinks.filter(l => !draftIds.has(l.id));
      for (const link of removedLinks) {
        if (link.id && !link.id.startsWith('temp_')) {
          await removeProfileLink(user.uid, link.id);
        }
      }

      // 2. Add or Update links
      for (const link of draftLinks) {
        if (link.id && link.id.startsWith('temp_')) {
          // New link
          await addProfileLink(user.uid, { title: link.title, url: link.url, order: 0 });
        } else {
          // Existing link, check if changed
          const orig = savedLinks.find(l => l.id === link.id);
          if (orig && (orig.title !== link.title || orig.url !== link.url)) {
            await updateProfileLink(user.uid, link.id, { title: link.title, url: link.url });
          }
        }
      }
      
      // Refresh the draft with freshly fetched links to replace temp IDs
      const freshLinks = await getUserLinks(user.uid);
      setDraft((prev) => ({ ...prev, links: freshLinks }));
      setSavedProfile((prev) => ({ ...prev, links: freshLinks }));
    }

    // Always keep local storage updated as fallback
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
    }
    
    if (onSaveCallback) {
      onSaveCallback(draft);
    }
    setSaveSuccessMsg('Profile saved successfully!');
    setTimeout(() => setSaveSuccessMsg(''), 3000);
  }

  return {
    savedProfile,
    draft,
    isDirty,
    saveSuccessMsg,
    setName,
    setAboutMe,
    addLink,
    updateLink,
    removeLink,
    cancelChanges,
    saveChanges
  };
}

export default function ProfileSettings({ onSaveProfile }) {
  const {
    draft,
    isDirty,
    saveSuccessMsg,
    setName,
    setAboutMe,
    addLink,
    updateLink,
    removeLink,
    cancelChanges,
    saveChanges
  } = useProfileState(onSaveProfile);

  return (
    <div className="animate-panel-in space-y-5 relative pb-12">
      {/* Header */}
      <div>
        <span className="label-mono text-correction">User Profile</span>
        <h3 className="mt-1 font-display text-4xl leading-none">Profile Settings</h3>
        <p className="mt-2 text-xs font-bold leading-5 opacity-75">
          Update your public display name, bio context, and personal web links.
        </p>
      </div>

      {saveSuccessMsg && (
        <div className="brutal-border bg-moss/15 border-l-4 border-l-moss p-3 font-mono text-xs font-bold text-moss flex items-center gap-2">
          <IoCheckmarkSharp className="text-base shrink-0" />
          {saveSuccessMsg}
        </div>
      )}

      {/* 1. Name Card */}
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

      {/* 2. About Me Card */}
      <div className="brutal-border bg-white p-4 shadow-nav space-y-3">
        <div className="flex items-center justify-between border-b border-ink/10 pb-2">
          <label className="font-mono text-xs font-black uppercase tracking-[0.14em] text-ink flex items-center gap-1.5">
            <IoSparklesSharp className="text-mustard" /> About Me
          </label>
          <span className="font-mono text-[10px] font-bold text-ink/50">{draft.aboutMe.length} chars</span>
        </div>
        <textarea
          rows={3}
          value={draft.aboutMe}
          onChange={(e) => setAboutMe(e.target.value)}
          placeholder="Tell us about yourself, your Japanese learning goals..."
          className="brutal-border w-full bg-paper px-3 py-2 font-mono text-xs font-bold shadow-shadow outline-none resize-none focus:bg-white leading-relaxed"
        />
      </div>

      {/* 3. Links Card */}
      <div className="brutal-border bg-white p-4 shadow-nav space-y-3">
        <div className="flex items-center justify-between border-b border-ink/10 pb-2">
          <label className="font-mono text-xs font-black uppercase tracking-[0.14em] text-ink flex items-center gap-1.5">
            <IoLinkSharp className="text-aizome" /> Social & Web Links
          </label>
          <button
            type="button"
            onClick={() => addLink()}
            className="brutal-border bg-mustard px-2.5 py-1 font-mono text-[10px] font-black uppercase text-ink shadow-nav hover:bg-paper transition-all inline-flex items-center gap-1"
          >
            <IoAddSharp className="text-sm" /> Add Link
          </button>
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
                className="brutal-border grid h-7 w-7 place-items-center bg-white text-shu hover:bg-shu hover:text-white transition-colors shrink-0"
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

      {/* Floating Action Bar (Shows when dirty) */}
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
              className="brutal-border bg-white px-3 py-1.5 font-mono text-xs font-black uppercase text-ink shadow-nav hover:bg-paper transition-all"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={saveChanges}
              className="brutal-border bg-mustard px-4 py-1.5 font-mono text-xs font-black uppercase text-ink shadow-nav hover:bg-paper transition-all"
            >
              Save Changes
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
