/** @vitest-environment jsdom */
import { describe, it, expect, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import StreamingChatMessages from './StreamingChatMessages.jsx';

describe('StreamingChatMessages Component', () => {
  const mockPersona = { id: 'sensei', name: 'Ken-sensei', jp: '先生' };

  beforeEach(() => {
    cleanup();
  });

  it('renders empty conversation prompt when no messages', () => {
    render(
      <StreamingChatMessages
        messages={[]}
        persona={mockPersona}
        isThinking={false}
        isStreaming={false}
      />
    );

    expect(screen.getByText(/start your conversation/i)).toBeDefined();
  });

  it('renders messages correctly', () => {
    const messages = [
      { id: '1', role: 'user', content: 'こんにちは' },
      { id: '2', role: 'assistant', content: 'はい、元気ですか？' },
    ];

    render(
      <StreamingChatMessages
        messages={messages}
        persona={mockPersona}
        isThinking={false}
        isStreaming={false}
      />
    );

    expect(screen.getByTestId('user-message')).toBeDefined();
    expect(screen.getByTestId('assistant-message')).toBeDefined();
    expect(screen.getByText('こんにちは')).toBeDefined();
    expect(screen.getByTestId('assistant-message').textContent).toContain('はい、元気ですか？');
  });

  it('renders thinking state indicator when isThinking is true', () => {
    render(
      <StreamingChatMessages
        messages={[{ id: '1', role: 'user', content: 'テスト' }]}
        persona={mockPersona}
        isThinking={true}
        isStreaming={true}
      />
    );

    expect(screen.getByTestId('thinking-indicator')).toBeDefined();
  });
});
