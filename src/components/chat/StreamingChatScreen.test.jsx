/** @vitest-environment jsdom */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import StreamingChatScreen from './StreamingChatScreen.jsx';

// Mock AuthContext
vi.mock('../../lib/auth/AuthContext.jsx', () => ({
  useAuth: () => ({
    user: { uid: 'test-user' },
    profile: { role: 'DEVELOPER' },
  }),
}));

describe('StreamingChatScreen Component', () => {
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
  });

  it('renders streaming chat screen with input and send button', () => {
    render(<StreamingChatScreen initialPersonaId="sensei" />);

    expect(screen.getByPlaceholderText(/type your message in japanese/i)).toBeDefined();
    expect(screen.getByRole('button', { name: /send message/i })).toBeDefined();
  });

  it('allows typing and entering text in composer', async () => {
    render(<StreamingChatScreen initialPersonaId="sensei" />);

    const input = screen.getByPlaceholderText(/type your message in japanese/i);
    fireEvent.change(input, { target: { value: 'こんにちは！' } });
    expect(input.value).toBe('こんにちは！');
  });
});
