/** @vitest-environment jsdom */
import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import * as matchers from '@testing-library/jest-dom/matchers';

expect.extend(matchers);
vi.stubGlobal('React', React);

afterEach(() => {
  cleanup();
});

let mockPathname = '/';
let mockIsDeveloper = false;

vi.mock('next/navigation', () => ({
  usePathname: () => mockPathname,
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }),
}));

vi.mock('../../lib/auth/AuthContext.jsx', () => ({
  useAuth: () => ({
    user: { uid: 'test-user', email: 'test@example.com' },
    isDeveloper: mockIsDeveloper,
    logout: vi.fn(),
  }),
}));

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

import AppShell from './AppShell.jsx';

describe('AppShell', () => {
  it('renders Exit button and Session Settings button on briefing and chat exercise pages', () => {
    mockPathname = '/briefing/train-station';

    render(
      <AppShell>
        <main>Briefing content</main>
      </AppShell>,
    );

    expect(screen.queryByLabelText(/daily progress rail/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/daily progress menu/i)).not.toBeInTheDocument();
    expect(screen.queryByRole('complementary')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /exit session/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /open session settings/i })).toBeInTheDocument();
    expect(screen.getByText(/Briefing content/i)).toBeInTheDocument();
  });

  it('opens Session Settings modal with Furigana reading modes during an exercise', async () => {
    mockPathname = '/chat/sensei';

    render(
      <AppShell>
        <main>Conversation content</main>
      </AppShell>,
    );

    expect(screen.queryByLabelText(/daily progress rail/i)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /exit session/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /open session settings/i })).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /open session settings/i }));

    expect(screen.getByRole('dialog', { name: /settings/i })).toBeInTheDocument();
    expect(screen.getByText(/Show Pronunciation/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /japanese/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /romanized/i })).toBeInTheDocument();

    // Dev Tools are hidden for non-developers
    expect(screen.queryByRole('button', { name: /developer options/i })).not.toBeInTheDocument();

    // Click Romanized mode
    await userEvent.click(screen.getByRole('button', { name: /romanized/i }));

    // Close session settings
    await userEvent.click(screen.getByRole('button', { name: /close settings/i }));
    expect(screen.queryByRole('dialog', { name: /settings/i })).not.toBeInTheDocument();
  });

  it('shows Developer Options in Settings when user is a developer', async () => {
    mockPathname = '/chat/sensei';
    mockIsDeveloper = true;

    render(
      <AppShell>
        <main>Conversation content</main>
      </AppShell>,
    );

    await userEvent.click(screen.getByRole('button', { name: /open session settings/i }));

    expect(screen.getByRole('dialog', { name: /settings/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /developer options/i })).toBeInTheDocument();

    // Toggle Developer Options
    await userEvent.click(screen.getByRole('button', { name: /developer options/i }));
    expect(screen.getByText(/Token Streaming & Live Thinking/i)).toBeInTheDocument();
    expect(screen.getByText(/Manual 'Finish & Grade' Button/i)).toBeInTheDocument();

    mockIsDeveloper = false; // Reset
  });

  it('prompts user confirmation when clicking Exit button during an active exercise', async () => {
    mockPathname = '/chat/sensei';

    render(
      <AppShell>
        <main>Conversation content</main>
      </AppShell>,
    );

    // Click Exit 'X' button
    await userEvent.click(screen.getByRole('button', { name: /exit session/i }));

    // Exit confirmation modal should appear
    expect(screen.getByRole('dialog', { name: /exit exercise\?/i })).toBeInTheDocument();
    expect(screen.getByText(/leaving now will cancel your session/i)).toBeInTheDocument();

    // Click Keep Practicing to stay
    await userEvent.click(screen.getByRole('button', { name: /keep practicing/i }));
    expect(screen.queryByRole('dialog', { name: /exit exercise\?/i })).not.toBeInTheDocument();
  });
});
