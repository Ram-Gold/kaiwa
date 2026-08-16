import { describe, it, expect, vi } from 'vitest';
import { POST } from './route.js';

describe('Streaming Chat API Route (/api/chat/stream)', () => {
  it('returns 400 when missing provider or payload', async () => {
    const req = new Request('http://localhost/api/chat/stream', {
      method: 'POST',
      body: JSON.stringify({}),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('Missing');
  });

  it('returns 401 when missing API key for non-ollama providers', async () => {
    const req = new Request('http://localhost/api/chat/stream', {
      method: 'POST',
      body: JSON.stringify({
        provider: 'anthropic',
        payload: { messages: [{ role: 'user', content: 'こんにちは' }] },
      }),
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it('handles unsupported provider with 400', async () => {
    const req = new Request('http://localhost/api/chat/stream', {
      method: 'POST',
      body: JSON.stringify({
        provider: 'unknown-provider',
        apiKey: 'dummy-key',
        payload: { messages: [] },
      }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('Unsupported provider');
  });

  it('streams response chunks from mock upstream', async () => {
    // Mock global fetch
    const originalFetch = global.fetch;
    const sseChunks = [
      'event: content_block_delta\ndata: {"type":"content_block_delta","delta":{"type":"text_delta","text":"こん"}}\n\n',
      'event: content_block_delta\ndata: {"type":"content_block_delta","delta":{"type":"text_delta","text":"にちは"}}\n\n',
      'event: message_stop\ndata: {"type":"message_stop"}\n\n',
    ];

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      start(controller) {
        for (const chunk of sseChunks) {
          controller.enqueue(encoder.encode(chunk));
        }
        controller.close();
      },
    });

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      body: stream,
    });

    try {
      const req = new Request('http://localhost/api/chat/stream', {
        method: 'POST',
        body: JSON.stringify({
          provider: 'anthropic',
          apiKey: 'test-key',
          payload: {
            model: 'claude-3-5-haiku-20241022',
            messages: [{ role: 'user', content: 'Hi' }],
          },
        }),
      });

      const res = await POST(req);
      expect(res.status).toBe(200);
      expect(res.headers.get('Content-Type')).toContain('text/event-stream');

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let text = '';
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        text += decoder.decode(value);
      }

      expect(text).toContain('data: {"token":"こん"}');
      expect(text).toContain('data: {"token":"にちは"}');
      expect(text).toContain('data: {"done":true}');
    } finally {
      global.fetch = originalFetch;
    }
  });
});
