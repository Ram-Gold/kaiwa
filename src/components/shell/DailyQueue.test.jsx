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

vi.mock('canvas-confetti', () => ({
  default: vi.fn(),
}));

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

import DailyQueue, { DEFAULT_QUESTS } from './DailyQueue.jsx';

describe('DailyQueue Component', () => {
  it('renders Spacious Omamori prototype by default with quests and Japanese talisman markers', () => {
    render(<DailyQueue variant="spacious-omamori" />);

    expect(screen.getByText('Daily Quests')).toBeInTheDocument();
    expect(screen.getAllByText('御守').length).toBeGreaterThan(0);
    expect(screen.getByText('Earn 20 XP in lessons')).toBeInTheDocument();
    expect(screen.getByText('Complete 2 Kaiwa chats')).toBeInTheDocument();
    expect(screen.getByText('Spend 15 mins learning')).toBeInTheDocument();
  });

  it('allows claiming completed quest rewards with talisman state changes', async () => {
    const user = userEvent.setup();
    const handleClaim = vi.fn();

    render(<DailyQueue variant="spacious-omamori" onQuestClaim={handleClaim} />);

    // The third quest ("Spend 15 mins learning") starts at 15/15 (ready to claim)
    const claimButton = screen.getByTitle('Click to claim reward!');
    expect(claimButton).toBeInTheDocument();

    await user.click(claimButton);
    expect(handleClaim).toHaveBeenCalledWith('quest-time');
  });

  it('renders Simplified Spacious Zen prototype variant correctly', () => {
    render(<DailyQueue variant="spacious-zen" />);

    expect(screen.getByText('Daily Quests')).toBeInTheDocument();
    expect(screen.getByText('Earn 20 XP in lessons')).toBeInTheDocument();
    expect(screen.getByText('Complete 2 Kaiwa chats')).toBeInTheDocument();
  });

  it('renders Spacious Neubrutal Forge prototype variant correctly', () => {
    render(<DailyQueue variant="spacious-neubrutal" />);

    expect(screen.getByText('Daily Quests')).toBeInTheDocument();
    expect(screen.getByText(/Tanren · Forge Your Skills/i)).toBeInTheDocument();
  });
});
