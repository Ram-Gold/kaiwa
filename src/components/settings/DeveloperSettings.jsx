'use client';

import React, { useState, useEffect } from 'react';
import {
  IoCodeSlashSharp,
  IoKeySharp,
  IoCheckmarkCircleSharp,
  IoRefreshSharp,
  IoWarningSharp,
  IoFlaskSharp,
  IoTerminalSharp,
  IoShieldCheckmarkSharp,
  IoPersonSharp,
} from 'react-icons/io5';
import { useAuth } from '../../lib/auth/AuthContext.jsx';
import { ROLES, PERMISSIONS, getUserRole, ROLE_PERMISSIONS } from '../../lib/auth/rbac.js';
import { PROVIDER_STORAGE_KEY } from '../dashboard/AiProviderSettingsCard.jsx';
import Button from '../ui/Button.jsx';
import { cn } from '../../lib/utils.js';

export default function DeveloperSettings() {
  const { user, profile } = useAuth();
  const currentRole = getUserRole(profile || user);
  const grantedPermissions = ROLE_PERMISSIONS[currentRole] || [];

  // Local simulator state for testing different roles
  const [simulatedRole, setSimulatedRole] = useState(currentRole);
  const [debugFlags, setDebugFlags] = useState({
    verboseLogs: false,
    mockAi: false,
    showDebugBanners: true,
  });
  const [activeProvider, setActiveProvider] = useState('ollama');
  const [actionStatus, setActionStatus] = useState('');
  const [isUpdatingTier, setIsUpdatingTier] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && window?.localStorage) {
      const savedSimRole = window.localStorage.getItem?.('kaiwa.dev.simulated_role');
      if (savedSimRole) setSimulatedRole(savedSimRole);

      const prov = window.localStorage.getItem?.(PROVIDER_STORAGE_KEY) || 'ollama';
      setActiveProvider(prov);

      const savedFlags = window.localStorage.getItem?.('kaiwa.dev.debug_flags');
      if (savedFlags) {
        try {
          setDebugFlags(JSON.parse(savedFlags));
        } catch {
          // fallback default
        }
      }
    }
  }, []);

  function handleSimulateRole(role) {
    setSimulatedRole(role);
    if (typeof window !== 'undefined' && window?.localStorage) {
      window.localStorage.setItem?.('kaiwa.dev.simulated_role', role);
      window.dispatchEvent(new Event('kaiwa:role-changed'));
    }
    setActionStatus(`Simulating role: ${role}`);
    setTimeout(() => setActionStatus(''), 3000);
  }

  function toggleDebugFlag(key) {
    setDebugFlags((prev) => {
      const updated = { ...prev, [key]: !prev[key] };
      if (typeof window !== 'undefined' && window?.localStorage) {
        window.localStorage.setItem?.('kaiwa.dev.debug_flags', JSON.stringify(updated));
      }
      return updated;
    });
  }

  async function handleSetBackendTier(tier) {
    if (!user?.uid) {
      setActionStatus('No active user logged in to sync backend tier.');
      return;
    }
    setIsUpdatingTier(true);
    setActionStatus('');
    try {
      const res = await fetch('/api/admin/set-tier', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.uid, tier }),
      });
      const data = await res.json();
      if (res.ok) {
        setActionStatus(`Successfully set backend tier to ${tier}! Reloading...`);
        setTimeout(() => window.location.reload(), 1500);
      } else {
        setActionStatus(`Error updating tier: ${data.error || 'Unknown error'}`);
      }
    } catch (err) {
      setActionStatus(`Failed to set backend tier: ${err.message}`);
    } finally {
      setIsUpdatingTier(false);
    }
  }

  return (
    <div className="animate-panel-in space-y-6 pb-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink/15 pb-4">
        <div>
          <span className="label-mono text-correction flex items-center gap-1.5 font-bold">
            <IoShieldCheckmarkSharp className="text-moss" /> Developer & Admin Controls
          </span>
          <h3 className="mt-1 font-display text-4xl leading-none">Developer Options</h3>
          <p className="mt-2 text-xs font-bold leading-5 opacity-75">
            Exclusive tools for developers and admins. Inspect roles, test RBAC permissions, debug AI services, and manage backend user tiers.
          </p>
        </div>
        <div className="brutal-border bg-mustard px-3 py-1.5 font-mono text-xs font-black uppercase text-ink shadow-nav flex items-center gap-1.5">
          <IoCodeSlashSharp className="text-base" /> DEV ROLE CONFIRMED
        </div>
      </div>

      {actionStatus && (
        <div className="brutal-border bg-aizome/15 border-l-4 border-l-aizome p-3 font-mono text-xs font-bold text-aizome flex items-center justify-between gap-2">
          <span>{actionStatus}</span>
          <button type="button" onClick={() => setActionStatus('')} className="text-ink/60 hover:text-ink">
            ✕
          </button>
        </div>
      )}

      {/* 1. Role & Permission Inspector */}
      <div className="brutal-border bg-white p-4 shadow-nav space-y-4">
        <div className="flex items-center justify-between border-b border-ink/10 pb-2">
          <label className="font-mono text-xs font-black uppercase tracking-[0.14em] text-ink flex items-center gap-1.5">
            <IoPersonSharp className="text-aizome" /> User Identity & Granted Permissions
          </label>
          <span className="font-mono text-[10px] font-bold text-moss uppercase tracking-wider">
            RBAC Active
          </span>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="brutal-border bg-paper p-3 font-mono text-xs space-y-1">
            <p className="font-black uppercase text-ink/60 text-[10px]">Current User Email</p>
            <p className="font-bold text-ink truncate">{user?.email || profile?.email || 'Ram (Local Default)'}</p>
          </div>
          <div className="brutal-border bg-paper p-3 font-mono text-xs space-y-1">
            <p className="font-black uppercase text-ink/60 text-[10px]">User UID</p>
            <p className="font-bold text-ink truncate font-mono text-[11px]">{user?.uid || 'ram-local-admin-uid'}</p>
          </div>
          <div className="brutal-border bg-paper p-3 font-mono text-xs space-y-1">
            <p className="font-black uppercase text-ink/60 text-[10px]">Assigned Role</p>
            <p className="font-black text-correction uppercase tracking-wider">{currentRole}</p>
          </div>
          <div className="brutal-border bg-paper p-3 font-mono text-xs space-y-1">
            <p className="font-black uppercase text-ink/60 text-[10px]">Active AI Provider</p>
            <p className="font-black text-aizome uppercase tracking-wider">{activeProvider}</p>
          </div>
        </div>

        <div>
          <p className="font-mono text-xs font-bold mb-2 uppercase tracking-wider">Granted Permissions Matrix:</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {Object.values(PERMISSIONS).map((permission) => {
              const isGranted = grantedPermissions.includes(permission);
              return (
                <div
                  key={permission}
                  className={cn(
                    'brutal-border px-3 py-2 font-mono text-xs font-bold flex items-center justify-between',
                    isGranted ? 'bg-moss/10 text-ink border-moss/40' : 'bg-paper text-ink/40 opacity-60'
                  )}
                >
                  <span className="text-[11px]">{permission}</span>
                  {isGranted ? (
                    <IoCheckmarkCircleSharp className="text-moss text-base shrink-0" />
                  ) : (
                    <span className="text-[10px] font-black uppercase text-ink/40">Denied</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 2. Role Switcher & Tier Simulator */}
      <div className="brutal-border bg-white p-4 shadow-nav space-y-4">
        <div className="flex items-center justify-between border-b border-ink/10 pb-2">
          <label className="font-mono text-xs font-black uppercase tracking-[0.14em] text-ink flex items-center gap-1.5">
            <IoFlaskSharp className="text-mustard" /> Role Simulator & Tier Manager
          </label>
          <span className="font-mono text-[10px] font-bold text-ink/50">Testing Tools</span>
        </div>

        <div>
          <p className="font-mono text-xs font-bold text-ink/75 mb-3 leading-relaxed">
            Switch your local testing role or persist custom user claims to Firebase Auth via set-tier endpoint.
          </p>

          <div className="space-y-3">
            {simulatedRole && simulatedRole !== ROLES.DEVELOPER && (
              <div className="brutal-border bg-mustard/20 border-l-4 border-l-mustard p-3 font-mono text-xs font-bold text-ink flex items-center justify-between gap-2">
                <span>
                  <strong>Active Simulation:</strong> Testing app UI as <u>{simulatedRole}</u> user. (Real Account: DEVELOPER)
                </span>
                <button
                  type="button"
                  onClick={() => handleSimulateRole(ROLES.DEVELOPER)}
                  className="brutal-border bg-mustard px-2 py-1 text-[10px] font-black uppercase text-ink shadow-nav hover:bg-paper shrink-0"
                >
                  Reset to Developer
                </button>
              </div>
            )}

            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="font-mono text-[11px] font-black uppercase text-ink/70">Simulate UI Role (Local Storage):</p>
                {simulatedRole && (
                  <button
                    type="button"
                    onClick={() => handleSimulateRole(ROLES.DEVELOPER)}
                    className="font-mono text-[10px] font-black uppercase text-correction underline hover:text-ink"
                  >
                    Reset to DEVELOPER
                  </button>
                )}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {Object.values(ROLES).map((role) => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => handleSimulateRole(role)}
                    className={cn(
                      'brutal-border px-3 py-2 font-mono text-xs font-black uppercase shadow-nav transition-all hover:bg-mustard',
                      simulatedRole === role ? 'bg-mustard text-ink ring-2 ring-ink ring-offset-1' : 'bg-paper text-ink'
                    )}
                  >
                    {role}
                  </button>
                ))}
              </div>
            </div>

            {user?.uid && (
              <div className="pt-2 border-t border-ink/10">
                <p className="font-mono text-[11px] font-black uppercase text-ink/70 mb-2">Persist Firebase Auth Tier:</p>
                <div className="flex flex-wrap gap-2">
                  {Object.values(ROLES).map((role) => (
                    <Button
                      key={role}
                      type="button"
                      variant="secondary"
                      disabled={isUpdatingTier}
                      onClick={() => handleSetBackendTier(role)}
                      className="text-xs px-3 py-1.5"
                    >
                      Set {role} in DB
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 3. Developer Debug Toggles */}
      <div className="brutal-border bg-white p-4 shadow-nav space-y-4">
        <div className="flex items-center justify-between border-b border-ink/10 pb-2">
          <label className="font-mono text-xs font-black uppercase tracking-[0.14em] text-ink flex items-center gap-1.5">
            <IoTerminalSharp className="text-shu" /> Debugging & Logging Flags
          </label>
          <span className="font-mono text-[10px] font-bold text-ink/50">Runtime Flags</span>
        </div>

        <div className="space-y-3">
          {[
            {
              key: 'verboseLogs',
              label: 'Verbose AI Prompt & Response Logging',
              desc: 'Log complete raw LLM system prompts and raw response payloads to developer console.',
            },
            {
              key: 'mockAi',
              label: 'Mock AI Response Mode',
              desc: 'Bypass API calls and return instant simulated Japanese responses for fast offline testing.',
            },
            {
              key: 'showDebugBanners',
              label: 'Show Developer Debug Overlay',
              desc: 'Display developer badge and quick context metadata banner in app footer.',
            },
          ].map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => toggleDebugFlag(item.key)}
              className={cn(
                'brutal-border w-full flex items-center justify-between gap-4 p-3 text-left shadow-nav transition-all hover:bg-mustard/40',
                debugFlags[item.key] ? 'bg-mustard/30' : 'bg-paper'
              )}
            >
              <div>
                <span className="block font-mono text-xs font-black uppercase">{item.label}</span>
                <span className="mt-0.5 block font-mono text-[11px] font-bold text-ink/65">{item.desc}</span>
              </div>
              <span className={cn(
                'grid h-6 w-6 shrink-0 place-items-center rounded-full border-2 border-border text-xs font-bold',
                debugFlags[item.key] ? 'bg-moss text-white border-moss' : 'bg-white text-ink/40'
              )}>
                {debugFlags[item.key] ? '✓' : ''}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* 4. System & Storage Inspector */}
      <div className="brutal-border bg-white p-4 shadow-nav space-y-4">
        <div className="flex items-center justify-between border-b border-ink/10 pb-2">
          <label className="font-mono text-xs font-black uppercase tracking-[0.14em] text-ink flex items-center gap-1.5">
            <IoKeySharp className="text-aizome" /> System Diagnostics & Storage
          </label>
          <span className="font-mono text-[10px] font-bold text-ink/50">Storage & State</span>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="brutal-border bg-paper p-3 text-center">
            <p className="font-mono text-[10px] font-black uppercase text-ink/60">App Version</p>
            <p className="font-mono text-sm font-black text-ink mt-1">v0.1.0-dev</p>
          </div>
          <div className="brutal-border bg-paper p-3 text-center">
            <p className="font-mono text-[10px] font-black uppercase text-ink/60">LocalStorage Keys</p>
            <p className="font-mono text-sm font-black text-ink mt-1">
              {typeof window !== 'undefined' && window?.localStorage ? window.localStorage.length : 0} keys
            </p>
          </div>
          <div className="brutal-border bg-paper p-3 text-center">
            <p className="font-mono text-[10px] font-black uppercase text-ink/60">Firebase Client</p>
            <p className="font-mono text-sm font-black text-moss mt-1">INITIALIZED</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 pt-2">
          <button
            type="button"
            onClick={() => {
              if (window.confirm('Reset local dev settings and reload?')) {
                window.localStorage.removeItem('kaiwa.dev.simulated_role');
                window.localStorage.removeItem('kaiwa.dev.debug_flags');
                window.location.reload();
              }
            }}
            className="brutal-border bg-paper px-3 py-1.5 font-mono text-xs font-bold text-ink shadow-nav hover:bg-mustard transition-all inline-flex items-center gap-1.5"
          >
            <IoRefreshSharp /> Reset Dev State
          </button>
        </div>
      </div>
    </div>
  );
}
