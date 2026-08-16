/** @vitest-environment jsdom */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import GlobalSettingsModal from './GlobalSettingsModal';
import { isStreamingEnabled, setStreamingEnabled, STREAMING_STORAGE_KEY } from '../../lib/ai/config';

// Mock useRouter
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));

// Mock AuthContext
vi.mock('../../lib/auth/AuthContext.jsx', () => ({
  useAuth: () => ({
    user: { uid: 'test-user', email: 'test@kaiwa.dev' },
    profile: { role: 'DEVELOPER', userType: 'DEVELOPER' },
  }),
}));

// Mock firestore
vi.mock('../../lib/firebase/firestore.js', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    getUserLinks: vi.fn().mockResolvedValue([]),
    saveUserSettings: vi.fn().mockResolvedValue({}),
  };
});

describe('GlobalSettingsModal Streaming Toggle', () => {
  let store = {};

  beforeEach(() => {
    cleanup();
    store = {};
    const mockStorage = {
      getItem: (key) => store[key] ?? null,
      setItem: (key, val) => { store[key] = String(val); },
      removeItem: (key) => { delete store[key]; },
      clear: () => { store = {}; },
    };
    Object.defineProperty(window, 'localStorage', {
      value: mockStorage,
      writable: true,
      configurable: true,
    });
    setStreamingEnabled(false);
  });

  it('defaults streaming enabled setting to false', () => {
    expect(isStreamingEnabled()).toBe(false);
  });

  it('renders Streaming AI toggle in settings and toggles state when clicked', () => {
    render(<GlobalSettingsModal onClose={() => {}} />);

    // Click Roleplay category tab
    const roleplayTab = screen.getByRole('button', { name: /^roleplay$/i });
    fireEvent.click(roleplayTab);

    const streamToggle = screen.getByRole('button', { name: /stream ai responses/i });
    expect(streamToggle).toBeDefined();

    // Click to toggle ON
    fireEvent.click(streamToggle);
    expect(store[STREAMING_STORAGE_KEY]).toBe('true');
    expect(isStreamingEnabled()).toBe(true);

    // Click again to toggle OFF
    fireEvent.click(streamToggle);
    expect(store[STREAMING_STORAGE_KEY]).toBe('false');
    expect(isStreamingEnabled()).toBe(false);
  });
});
