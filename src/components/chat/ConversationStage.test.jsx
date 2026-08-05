/** @vitest-environment jsdom */
import React from 'react';
import { act, cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import * as matchers from '@testing-library/jest-dom/matchers';

expect.extend(matchers);
vi.stubGlobal('React', React);

afterEach(() => {
  cleanup();
});

import ConversationStage from './ConversationStage.jsx';

const briefing = {
  title: 'Train Station',
  jpTitle: '駅で迷った時',
  kind: 'roleplay',
  level: 'N5',
  accent: 'mustard',
  image: '/assets/bg_eki_homedoor_train_open.jpg',
  prep: ['___ に行きたいです', '何番線ですか', 'ありがとうございます'],
};

describe('ConversationStage', () => {
  it('renders phrase-only cards and real phone chrome without the old header block', () => {
    render(<ConversationStage briefing={briefing} />);

    expect(screen.queryByText(/Latency state/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Listening/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Lesson · N5/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Card 1/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Scenario phrase/i)).not.toBeInTheDocument();
    expect(screen.getByLabelText(/phone status bar/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/wifi/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/battery/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/dynamic island notch/i)).toBeInTheDocument();
    expect(screen.getByTestId('phrase-card-text-0')).toHaveClass('items-start');
    expect(screen.getByRole('button', { name: /use phrase ___ に行きたいです/i })).toHaveTextContent('___ に行きたいです');
  });

  it('responds to sidebar option changes for phone chrome and notch choices', () => {
    render(<ConversationStage briefing={briefing} />);

    expect(screen.getByLabelText(/phone status bar/i)).toBeInTheDocument();

    act(() => {
      window.dispatchEvent(new CustomEvent('kaiwa:conversation-option-change', { detail: { option: 'showPhoneChrome', value: false } }));
    });

    expect(screen.queryByLabelText(/phone status bar/i)).not.toBeInTheDocument();

    act(() => {
      window.dispatchEvent(new CustomEvent('kaiwa:conversation-option-change', { detail: { option: 'showPhoneChrome', value: true } }));
      window.dispatchEvent(new CustomEvent('kaiwa:conversation-option-change', { detail: { option: 'notchStyle', value: 'samsung' } }));
    });

    expect(screen.getByLabelText(/phone status bar/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/samsung hole punch notch/i)).toBeInTheDocument();
  });

  it('selects a suggestion card first, then removes it after the selection animation', async () => {
    render(<ConversationStage briefing={briefing} />);

    const card = screen.getByRole('button', { name: /use phrase ___ に行きたいです/i });
    await userEvent.click(card);

    expect(screen.getByLabelText(/message text/i)).toHaveValue('___ に行きたいです');
    expect(card).toHaveAttribute('data-state', 'selected');

    await waitFor(() => {
      expect(screen.queryByRole('button', { name: /use phrase ___ に行きたいです/i })).not.toBeInTheDocument();
    });
  });
});
