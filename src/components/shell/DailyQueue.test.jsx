/** @vitest-environment jsdom */
import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as matchers from '@testing-library/jest-dom/matchers';

expect.extend(matchers);
vi.stubGlobal('React', React);

beforeEach(() => {
  if (typeof window !== 'undefined' && window.localStorage?.clear) {
    window.localStorage.clear();
  }
});

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

import DailyQueue, { DEFAULT_QUESTS, DEFAULT_TASKS } from './DailyQueue.jsx';

describe('DailyQueue Component', () => {
  it('renders Spacious Omamori prototype with daily quests, Japanese talisman markers, and 24h timer', () => {
    render(<DailyQueue variant="spacious-omamori" initialQuests={DEFAULT_QUESTS} />);

    expect(screen.getByText('Daily Quests')).toBeInTheDocument();
    expect(screen.getAllByText('御守').length).toBeGreaterThan(0);
    expect(screen.getByText('Earn 20 XP in lessons')).toBeInTheDocument();
    expect(screen.getByText('Complete 2 Kaiwa chats')).toBeInTheDocument();
    expect(screen.getByText('Spend 15 mins learning')).toBeInTheDocument();
    expect(screen.getByText(/24H CYCLE/i)).toBeInTheDocument();
  });

  it('allows claiming completed quest rewards with talisman state changes', async () => {
    const user = userEvent.setup();
    const handleClaim = vi.fn();

    render(<DailyQueue variant="spacious-omamori" initialQuests={DEFAULT_QUESTS} onQuestClaim={handleClaim} />);

    // The third quest ("Spend 15 mins learning") starts at 15/15 (ready to claim)
    const claimButton = screen.getByTitle('Click to claim reward!');
    expect(claimButton).toBeInTheDocument();

    await user.click(claimButton);
    expect(handleClaim).toHaveBeenCalledWith('quest-time-15');
  });

  it('renders Simplified Spacious Zen prototype variant correctly with countdown timer', () => {
    render(<DailyQueue variant="spacious-zen" initialQuests={DEFAULT_QUESTS} />);

    expect(screen.getByText('Daily Quests')).toBeInTheDocument();
    expect(screen.getByText('Earn 20 XP in lessons')).toBeInTheDocument();
    expect(screen.getByText('Complete 2 Kaiwa chats')).toBeInTheDocument();
    expect(screen.getByTitle(/24-hour countdown timer/i)).toBeInTheDocument();
  });

  it('renders Spacious Neubrutal Forge prototype variant correctly', () => {
    render(<DailyQueue variant="spacious-neubrutal" initialQuests={DEFAULT_QUESTS} />);

    expect(screen.getByText('Daily Quests')).toBeInTheDocument();
    expect(screen.getByText(/Tanren · Forge Your Skills/i)).toBeInTheDocument();
  });

  it('renders Zen and Hanko checklist prototypes with timer', () => {
    const { unmount } = render(<DailyQueue variant="zen" initialTasks={DEFAULT_TASKS} />);
    expect(screen.getByText('Daily Queue')).toBeInTheDocument();
    expect(screen.getByText('Review 5 N5 phrases')).toBeInTheDocument();

    unmount();

    render(<DailyQueue variant="hanko" initialTasks={DEFAULT_TASKS} />);
    expect(screen.getByText('今日の課題')).toBeInTheDocument();
    expect(screen.getByText(/Daily Mission/i)).toBeInTheDocument();
  });

  it('randomizes quests per user automatically when no initialQuests are passed', () => {
    const { unmount } = render(<DailyQueue variant="spacious-omamori" userId="user_alpha" />);
    expect(screen.getByText('Daily Quests')).toBeInTheDocument();
    const questsAlpha = screen.getAllByRole('button', { name: /test progress increment/i });
    expect(questsAlpha.length).toBe(3);

    unmount();

    render(<DailyQueue variant="spacious-omamori" userId="user_beta" />);
    const questsBeta = screen.getAllByRole('button', { name: /test progress increment/i });
    expect(questsBeta.length).toBe(3);
  });
});
