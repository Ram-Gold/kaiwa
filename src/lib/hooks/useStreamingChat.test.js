/** @vitest-environment jsdom */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useStreamingChat } from './useStreamingChat';

describe('useStreamingChat Hook', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('initializes with default empty state', () => {
    const { result } = renderHook(() => useStreamingChat({ personaId: 'sensei' }));

    expect(result.current.messages).toEqual([]);
    expect(result.current.isThinking).toBe(false);
    expect(result.current.isStreaming).toBe(false);
    expect(result.current.error).toBe(null);
  });

  it('handles streaming tokens and accumulates assistant response', async () => {
    const ssePayload = [
      'data: {"token":"<dialogue>"}\n\n',
      'data: {"token":"こんにちは、"}\n\n',
      'data: {"token":"元気ですか？"}\n\n',
      'data: {"token":"</dialogue>"}\n\n',
      'data: {"done":true}\n\n',
    ].join('');

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode(ssePayload));
        controller.close();
      },
    });

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      body: stream,
    });

    const { result } = renderHook(() => useStreamingChat({ personaId: 'sensei', provider: 'ollama' }));

    await act(async () => {
      await result.current.sendMessage('おはよう');
    });

    expect(result.current.messages.length).toBe(2);
    expect(result.current.messages[0].role).toBe('user');
    expect(result.current.messages[0].content).toBe('おはよう');

    expect(result.current.messages[1].role).toBe('assistant');
    expect(result.current.messages[1].content).toContain('こんにちは、元気ですか？');
    expect(result.current.isStreaming).toBe(false);
    expect(result.current.isThinking).toBe(false);
  });

  it('aborts stream on stop() and preserves partial generated text', async () => {
    let cancelCalled = false;
    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode('data: {"token":"<dialogue>"}\n\n'));
        controller.enqueue(encoder.encode('data: {"token":"初めま"}\n\n'));
      },
      cancel() {
        cancelCalled = true;
      },
    });

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      body: stream,
    });

    const { result } = renderHook(() => useStreamingChat({ personaId: 'sensei', provider: 'ollama' }));

    let sendPromise;
    act(() => {
      sendPromise = result.current.sendMessage('こんにちは');
    });

    // Wait a tick for stream reading to start
    await new Promise((r) => setTimeout(r, 20));

    act(() => {
      result.current.stop();
    });

    await act(async () => {
      try {
        await sendPromise;
      } catch {
        // Abort error expected
      }
    });

    expect(result.current.isStreaming).toBe(false);
    expect(result.current.isThinking).toBe(false);
    expect(result.current.messages.length).toBe(2);
    expect(result.current.messages[1].role).toBe('assistant');
    expect(result.current.messages[1].content).toContain('初めま');
  });
});
