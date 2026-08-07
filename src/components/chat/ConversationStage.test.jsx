/** @vitest-environment jsdom */
import React from 'react';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import * as matchers from '@testing-library/jest-dom/matchers';

expect.extend(matchers);
vi.stubGlobal('React', React);

afterEach(() => {
  cleanup();
});

import ConversationStage, { buildPronunciationTokens, getMatchedTokenCount, getSharedElementOffset, isCompleteRecitation } from './ConversationStage.jsx';

const briefing = {
  title: 'Train Station',
  jpTitle: '駅で迷った時',
  kind: 'roleplay',
  level: 'N5',
  accent: 'mustard',
  image: '/assets/bg_eki_homedoor_train_open.jpg',
  prep: ['___ に行きたいです', '何番線ですか', 'ありがとうございます'],
};

describe('pronunciation token matching', () => {
  it('does not crash when a hot-reloaded card has no tokens yet', () => {
    expect(getMatchedTokenCount(undefined, 'ありが')).toBe(0);
  });

  it('builds kana and romaji tokens for kanji-heavy suggestion cards', () => {
    expect(buildPronunciationTokens('自然な言い方は？').map((token) => `${token.kana}-${token.romaji}`)).toEqual([
      'し-shi',
      'ぜ-ze',
      'ん-n',
      'な-na',
      'い-i',
      'い-i',
      'か-ka',
      'た-ta',
      'は-wa',
    ]);
  });

  it('accepts mostly matched speech instead of requiring every token exactly', () => {
    const card = { phrase: 'ありがとうございます', tokens: buildPronunciationTokens('ありがとうございます') };

    expect(isCompleteRecitation(card, 'ありがとうござい')).toBe(true);
  });
});

describe('shared element card flight', () => {
  it('calculates the transform needed to fly from clicked card position to centered card position', () => {
    expect(
      getSharedElementOffset(
        { left: 20, top: 100, width: 100, height: 200 },
        { left: 120, top: 300, width: 200, height: 400 },
      ),
    ).toEqual({ x: -150, y: -300, scale: 0.5 });
  });
});

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
    expect(screen.getByRole('button', { name: /practice phrase ___ に行きたいです/i })).toHaveTextContent('___ に行きたいです');
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

  it('keeps hand cards visually strict without hover prompts', async () => {
    render(<ConversationStage briefing={briefing} />);

    const card = screen.getByRole('button', { name: /practice phrase ___ に行きたいです/i });

    await userEvent.hover(card);

    expect(screen.getByTestId('phrase-card-text-0')).toHaveTextContent('___ に行きたいです');
    expect(screen.queryByLabelText(/speaker prompt for ___ に行きたいです/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/microphone ready for ___ に行きたいです/i)).not.toBeInTheDocument();
  });

  it('centers a selected card for recitation instead of immediately filling the composer', async () => {
    render(<ConversationStage briefing={briefing} />);

    const card = screen.getByRole('button', { name: /practice phrase ___ に行きたいです/i });
    await userEvent.click(card);

    expect(screen.getByLabelText(/message text/i)).toHaveValue('');
    expect(screen.queryByRole('button', { name: /practice phrase ___ に行きたいです/i })).not.toBeInTheDocument();
    expect(screen.getByTestId('recitation-backdrop')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /skip recitation for ___ に行きたいです/i })).toHaveAttribute('data-state', 'reciting');
    expect(screen.getByRole('button', { name: /speak phrase ___ に行きたいです/i })).toHaveTextContent('___ に行きたいです');
    expect(screen.getByText(/recite the card/i)).toBeInTheDocument();
  });

  it('keeps kanji visible on the centered recitation card', async () => {
    render(<ConversationStage briefing={briefing} />);

    await userEvent.click(screen.getByRole('button', { name: /practice phrase 何番線ですか/i }));

    expect(screen.getByTestId('recitation-card-text')).toHaveTextContent('何番線ですか');
    expect(screen.getByRole('button', { name: /speak phrase 何番線ですか/i })).toHaveTextContent('何番線ですか');
  });

  it('speaks the written card phrase when the speaker prompt is clicked', async () => {
    const speak = vi.fn();
    window.speechSynthesis = { speaking: false, cancel: vi.fn(), speak };
    window.SpeechSynthesisUtterance = vi.fn(function MockUtterance(text) {
      this.text = text;
    });

    render(<ConversationStage briefing={briefing} />);

    await userEvent.click(screen.getByRole('button', { name: /practice phrase 何番線ですか/i }));
    await userEvent.click(screen.getByRole('button', { name: /speak phrase 何番線ですか/i }));

    expect(speak).toHaveBeenCalledTimes(1);
    expect(speak.mock.calls[0][0].text).toBe('何番線ですか');

    delete window.speechSynthesis;
    delete window.SpeechSynthesisUtterance;
  });

  it('toggles romaji directly under the Japanese text inside the centered card', async () => {
    render(<ConversationStage briefing={briefing} />);

    await userEvent.click(screen.getByRole('button', { name: /practice phrase 何番線ですか/i }));

    expect(screen.queryByTestId('recitation-romaji')).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /show romaji for 何番線ですか/i }));

    const cardText = screen.getByTestId('recitation-card-text');
    expect(cardText).toContainElement(screen.getByTestId('recitation-romaji'));
    expect(screen.getByTestId('recitation-romaji')).toHaveTextContent('nan ba n se n de su ka');
  });

  it('keeps speech recognition continuous so the learner has more time to speak', async () => {
    let recognitionInstance;
    class MockSpeechRecognition {
      constructor() {
        recognitionInstance = this;
      }
      start = vi.fn();
      stop = vi.fn();
    }
    window.SpeechRecognition = MockSpeechRecognition;

    render(<ConversationStage briefing={briefing} />);

    await userEvent.click(screen.getByRole('button', { name: /practice phrase ありがとうございます/i }));

    expect(recognitionInstance.continuous).toBe(true);

    delete window.SpeechRecognition;
  });

  it('highlights the Japanese and romaji tokens that match the interim speech transcript', async () => {
    let recognitionInstance;
    class MockSpeechRecognition {
      constructor() {
        recognitionInstance = this;
      }
      start = vi.fn();
      stop = vi.fn();
    }
    window.SpeechRecognition = MockSpeechRecognition;

    render(<ConversationStage briefing={briefing} />);

    await userEvent.click(screen.getByRole('button', { name: /practice phrase ありがとうございます/i }));

    act(() => {
      recognitionInstance.onresult({
        results: [[{ transcript: 'ありが' }]],
      });
    });

    expect(screen.getByTestId('recitation-token-0')).toHaveAttribute('data-spoken', 'true');
    expect(screen.getByTestId('recitation-token-1')).toHaveAttribute('data-spoken', 'true');
    expect(screen.getByTestId('recitation-token-2')).toHaveAttribute('data-spoken', 'true');
    expect(screen.getByTestId('recitation-token-3')).toHaveAttribute('data-spoken', 'false');
    expect(screen.getByTestId('recitation-token-4')).toHaveAttribute('data-spoken', 'false');
    expect(screen.queryByText('a')).not.toBeInTheDocument();
    expect(screen.queryByText('ri')).not.toBeInTheDocument();
    expect(screen.queryByText('ga')).not.toBeInTheDocument();

    delete window.SpeechRecognition;
  });

  it('cancels recitation when clicking outside and returns the card to the hand', async () => {
    render(<ConversationStage briefing={briefing} />);

    await userEvent.click(screen.getByRole('button', { name: /practice phrase ___ に行きたいです/i }));
    await userEvent.click(screen.getByTestId('recitation-backdrop'));

    expect(screen.getByLabelText(/message text/i)).toHaveValue('');
    expect(screen.queryByRole('button', { name: /skip recitation for ___ に行きたいです/i })).not.toBeInTheDocument();

    const returnDestination = screen.getByTestId('return-destination-card');
    expect(returnDestination).toHaveAttribute('data-card-id', '___ に行きたいです-0');
    expect(returnDestination).toHaveAttribute('data-returning', 'true');
    expect(returnDestination).toHaveClass('opacity-100', 'pointer-events-none', 'duration-[420ms]', '[transition-timing-function:cubic-bezier(.77,0,.175,1)]');
    expect(screen.getByLabelText(/Train Station conversation/i)).toHaveClass('z-50');

    fireEvent.transitionEnd(returnDestination, { propertyName: 'transform' });

    await waitFor(() => {
      expect(screen.queryByRole('button', { name: /skip recitation for ___ に行きたいです/i })).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: /practice phrase ___ に行きたいです/i })).toBeInTheDocument();
    });
  });

  it('keeps the recitation backdrop mounted long enough to fade back out smoothly', async () => {
    render(<ConversationStage briefing={briefing} />);

    await userEvent.click(screen.getByRole('button', { name: /practice phrase ___ に行きたいです/i }));
    await userEvent.click(screen.getByTestId('recitation-backdrop'));

    const backdrop = screen.getByTestId('recitation-backdrop');
    expect(backdrop).toHaveClass('opacity-0');

    const returningCard = screen.getByTestId('return-destination-card');
    await waitFor(() => {
      expect(returningCard).toHaveAttribute('data-returning', 'true');
    });
    fireEvent.transitionEnd(returningCard, { propertyName: 'transform' });

    await waitFor(() => {
      expect(screen.getByTestId('recitation-backdrop')).toHaveClass('opacity-0');
    });

    await new Promise((resolve) => setTimeout(resolve, 120));
    expect(screen.getByTestId('recitation-backdrop')).toBeInTheDocument();

    await new Promise((resolve) => setTimeout(resolve, 160));
    expect(screen.queryByTestId('recitation-backdrop')).not.toBeInTheDocument();
  });

  it('returns edge cards to the resting deck slot angle instead of the hover spread angle', async () => {
    render(<ConversationStage briefing={briefing} />);

    await userEvent.click(screen.getByRole('button', { name: /practice phrase 英語でヒントをください/i }));
    await userEvent.click(screen.getByTestId('recitation-backdrop'));

    const hand = screen.getByLabelText(/suggestion card hand/i);
    expect(hand).toHaveAttribute('data-returning', 'true');
    expect(hand).toHaveClass('z-50');

    const returnDestination = screen.getByTestId('return-destination-card');
    expect(returnDestination).toHaveAttribute('data-card-id', '英語でヒントをください-4');
    expect(returnDestination).toHaveClass('opacity-100', 'pointer-events-none');
    expect(returnDestination).not.toHaveClass('hover:-translate-y-24');
    expect(returnDestination.parentElement?.getAttribute('style')).toContain('rotate(12deg)');
    expect(screen.getByLabelText(/Train Station conversation/i)).toHaveClass('z-50');

    await waitFor(() => {
      expect(returnDestination.getAttribute('style')).toContain('rotate(0deg)');
      expect(returnDestination.getAttribute('style')).toContain('blur(0)');
      expect(returnDestination.getAttribute('style')).not.toContain('blur(2px)');
    });
  });

  it('skips recitation when clicking the centered card again and still fills the composer', async () => {
    render(<ConversationStage briefing={briefing} />);

    await userEvent.click(screen.getByRole('button', { name: /practice phrase ___ に行きたいです/i }));
    await userEvent.click(screen.getByRole('button', { name: /skip recitation for ___ に行きたいです/i }));

    expect(screen.getByLabelText(/message text/i)).toHaveValue('___ に行きたいです');
    await waitFor(() => {
      expect(screen.queryByRole('button', { name: /skip recitation for ___ に行きたいです/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /practice phrase ___ に行きたいです/i })).not.toBeInTheDocument();
    });
  });

  it('awards exp, removes the card, and fills the composer when speech recognition matches', async () => {
    let recognitionInstance;
    class MockSpeechRecognition {
      constructor() {
        recognitionInstance = this;
      }
      start = vi.fn();
      stop = vi.fn();
    }
    window.SpeechRecognition = MockSpeechRecognition;

    render(<ConversationStage briefing={briefing} />);

    await userEvent.click(screen.getByRole('button', { name: /practice phrase ___ に行きたいです/i }));

    act(() => {
      recognitionInstance.onresult({
        results: [[{ transcript: 'に行きたいです' }]],
      });
    });

    await waitFor(() => {
      expect(screen.getByLabelText(/message text/i)).toHaveValue('___ に行きたいです');
    });
    expect(screen.getByText(/\+10 exp/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /practice phrase ___ に行きたいです/i })).not.toBeInTheDocument();

    delete window.SpeechRecognition;
  });
});
