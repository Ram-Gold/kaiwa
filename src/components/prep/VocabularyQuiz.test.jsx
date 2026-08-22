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

const mockSaveDictionaryWord = vi.fn().mockResolvedValue(true);
const mockGetDictionaryWords = vi.fn().mockResolvedValue([]);

vi.mock('../../lib/firebase/firestore.js', () => ({
  getLessonQuestions: vi.fn().mockResolvedValue([
    {
      id: 'q1',
      sentence: '<ruby>林檎<rt>りんご</rt></ruby>を___。',
      options: ['食べます', '行きます', '見ます', '飲みます'],
      correctIndex: 0,
      meaning: 'I eat apples.',
    },
  ]),
  incrementModuleProgress: vi.fn().mockResolvedValue(20),
  recordUserActivityStreak: vi.fn().mockResolvedValue(true),
  getDictionaryWords: (...args) => mockGetDictionaryWords(...args),
  saveDictionaryWord: (...args) => mockSaveDictionaryWord(...args),
}));

vi.mock('../../lib/jlptVocabApi.js', () => ({
  fetchJlptWordDefinition: vi.fn().mockResolvedValue({
    term: '林檎',
    reading: 'りんご',
    meanings: ['apple'],
    jlpt: 'N5',
    examples: [],
  }),
}));

vi.mock('canvas-confetti', () => ({
  default: vi.fn(),
}));

afterEach(() => {
  cleanup();
  mockPush.mockClear();
  mockSaveDictionaryWord.mockClear();
  mockGetDictionaryWords.mockClear();
});

import VocabularyQuiz from './VocabularyQuiz.jsx';

describe('VocabularyQuiz', () => {
  it('renders questions and allows answering', async () => {
    render(<VocabularyQuiz briefingId="basic-verbs" briefingTitle="Basic Verbs" />);

    await waitFor(() => {
      expect(screen.getByText(/林檎/i)).toBeInTheDocument();
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

  it('opens DictionaryPopover when clicking a word in the sentence and allows bookmarking', async () => {
    render(<VocabularyQuiz briefingId="basic-verbs" briefingTitle="Basic Verbs" />);

    await waitFor(() => {
      expect(screen.getByText(/林檎/i)).toBeInTheDocument();
    });

    // Click the ruby word
    const rubyWord = screen.getByTitle(/reading: りんご/i);
    await userEvent.click(rubyWord);

    // Verify DictionaryPopover opens with JLPT dictionary data
    await waitFor(() => {
      expect(screen.getByText(/jlpt dictionary/i)).toBeInTheDocument();
      expect(screen.getByText(/apple/i)).toBeInTheDocument();
    });

    // Click save/bookmark button
    const bookmarkBtn = screen.getByRole('button', { name: /save word to dictionary/i });
    await userEvent.click(bookmarkBtn);

    expect(mockSaveDictionaryWord).toHaveBeenCalledWith('test-user-123', expect.objectContaining({
      term: '林檎',
      source: 'basic-verbs',
    }));

    // Saved state
    expect(screen.getByRole('button', { name: /word saved to dictionary/i })).toBeInTheDocument();
  });
});
