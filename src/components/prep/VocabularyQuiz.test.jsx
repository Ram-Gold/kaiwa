/** @vitest-environment jsdom */
import React from 'react';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import * as matchers from '@testing-library/jest-dom/matchers';

expect.extend(matchers);
vi.stubGlobal('React', React);

const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

vi.mock('../../lib/auth/AuthContext.jsx', () => ({
  useAuth: () => ({
    user: { uid: 'test-user-123' },
  }),
}));

vi.mock('../../lib/firebase/firestore.js', () => ({
  getLessonQuestions: vi.fn().mockResolvedValue([
    {
      id: 'q1',
      sentence: '林檎を___。',
      options: ['食べます', '行きます', '見ます', '飲みます'],
      correctIndex: 0,
      meaning: 'I eat apples.',
    },
  ]),
  incrementModuleProgress: vi.fn().mockResolvedValue(20),
  recordUserActivityStreak: vi.fn().mockResolvedValue(true),
}));

vi.mock('canvas-confetti', () => ({
  default: vi.fn(),
}));

afterEach(() => {
  cleanup();
  mockPush.mockClear();
});

import VocabularyQuiz from './VocabularyQuiz.jsx';

describe('VocabularyQuiz', () => {
  it('renders questions and allows answering', async () => {
    render(<VocabularyQuiz briefingId="basic-verbs" briefingTitle="Basic Verbs" />);

    await waitFor(() => {
      expect(screen.getByText(/林檎を___。/i)).toBeInTheDocument();
    });

    const optionNumber1 = screen.getByText('1').closest('button');
    await userEvent.click(optionNumber1);

    // Footer banner appears with either success or mistake feedback and Continue button
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /finish lesson|continue/i })).toBeInTheDocument();
    });
  });

  it('opens ExitConfirmationModal when clicking exit button and stays on Keep Practicing', async () => {
    render(<VocabularyQuiz briefingId="basic-verbs" briefingTitle="Basic Verbs" />);

    await waitFor(() => {
      expect(screen.getByLabelText(/exit quiz/i)).toBeInTheDocument();
    });

    // Click exit button
    await userEvent.click(screen.getByLabelText(/exit quiz/i));

    // Verify modal is displayed with warning
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /exit exercise\?/i })).toBeInTheDocument();
    expect(screen.getByText(/leaving now will cancel your session/i)).toBeInTheDocument();

    // Click Keep Practicing
    await userEvent.click(screen.getByRole('button', { name: /keep practicing/i }));

    // Modal should close without navigating
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('navigates home when confirming exit in ExitConfirmationModal', async () => {
    render(<VocabularyQuiz briefingId="basic-verbs" briefingTitle="Basic Verbs" />);

    await waitFor(() => {
      expect(screen.getByLabelText(/exit quiz/i)).toBeInTheDocument();
    });

    // Click exit button
    await userEvent.click(screen.getByLabelText(/exit quiz/i));

    // Click Leave & Cancel
    await userEvent.click(screen.getByRole('button', { name: /leave & cancel/i }));

    // Should navigate home
    expect(mockPush).toHaveBeenCalledWith('/');
  });
});
