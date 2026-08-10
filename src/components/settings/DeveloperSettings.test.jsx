/** @vitest-environment jsdom */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import GlobalSettingsModal from '../shell/GlobalSettingsModal';
import DeveloperSettings from './DeveloperSettings';
import { useAuth } from '../../lib/auth/AuthContext';

// Mock useAuth
vi.mock('../../lib/auth/AuthContext', async () => {
  const actual = await vi.importActual('../../lib/auth/AuthContext');
  return {
    ...actual,
    useAuth: vi.fn(),
  };
});

describe('Developer Access & Settings', () => {
  beforeEach(() => {
    cleanup();
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.clear();
    }
  });

  it('renders Developer Options category for DEVELOPER role', () => {
    vi.mocked(useAuth).mockReturnValue({
      user: { uid: 'dev-uid', email: 'ram@kaiwa.dev' },
      profile: { userType: 'DEVELOPER', tier: 'DEVELOPER' },
      role: 'DEVELOPER',
      hasPermission: () => true,
      isDeveloper: true,
    });

    render(<GlobalSettingsModal onClose={() => {}} />);

    expect(screen.getByText('Developer Options')).toBeDefined();
  });

  it('hides Developer Options category for FREE role', () => {
    vi.mocked(useAuth).mockReturnValue({
      user: { uid: 'free-uid', email: 'user@example.com' },
      profile: { userType: 'FREE', tier: 'FREE' },
      role: 'FREE',
      hasPermission: () => false,
      isDeveloper: false,
    });

    render(<GlobalSettingsModal onClose={() => {}} />);

    expect(screen.queryByText('Developer Options')).toBeNull();
  });

  it('renders DeveloperSettings panel with role inspector and testing tools', () => {
    vi.mocked(useAuth).mockReturnValue({
      user: { uid: 'ram-dev-123', email: 'ram@kaiwa.dev' },
      profile: { userType: 'DEVELOPER', tier: 'DEVELOPER' },
      role: 'DEVELOPER',
      hasPermission: () => true,
      isDeveloper: true,
    });

    render(<DeveloperSettings />);

    expect(screen.getAllByText('Developer Options').length).toBeGreaterThan(0);
    expect(screen.getByText('DEV ROLE CONFIRMED')).toBeDefined();
    expect(screen.getByText('VIEW_DEVELOPER_OPTIONS')).toBeDefined();
    expect(screen.getByText('Verbose AI Prompt & Response Logging')).toBeDefined();
  });

  it('retains Developer Options button for real DEVELOPER even when role simulation is set to PRO', () => {
    const mockStorage = {
      getItem: (key) => (key === 'kaiwa.dev.simulated_role' ? 'PRO' : null),
      setItem: () => {},
    };
    Object.defineProperty(window, 'localStorage', { value: mockStorage, writable: true, configurable: true });

    vi.mocked(useAuth).mockReturnValue({
      user: { uid: 'dev-uid', email: 'ram@kaiwa.dev' },
      profile: { userType: 'DEVELOPER', tier: 'DEVELOPER' },
      role: 'DEVELOPER',
      hasPermission: (target, perm) => {
        if (target?.userType === 'DEVELOPER' || target === 'DEVELOPER') return true;
        return false;
      },
      isDeveloper: true,
    });

    render(<GlobalSettingsModal onClose={() => {}} />);

    expect(screen.getByText('Developer Options')).toBeDefined();
  });
});
