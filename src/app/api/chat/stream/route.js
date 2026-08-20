import { NextResponse } from 'next/server';

/**
 * ============================================================================
 * AI KAIWA TOKEN STREAMING API ROUTE (/api/chat/stream)
 * ============================================================================
 * 
 * Streams LLM responses token-by-token using Server-Sent Events (SSE).
 * Proxies requests across Anthropic Claude, OpenAI, Gemini, OpenRouter, and Ollama.
 * ============================================================================
 */

export async function POST(req) {
  try {
    const body = await req.json();
    const { provider, apiKey, payload, thinkingEnabled = false } = body;

    if (!provider || !payload) {
      return NextResponse.json(
        { error: 'Missing provider or payload' },
        { status: 400 }
      );
    }

    const normProvider = provider.toLowerCase();

    if (normProvider !== 'ollama' && normProvider !== 'lmstudio' && !apiKey) {
      return NextResponse.json(
        { error: 'Missing API key' },
        { status: 401 }
      );
    }

    let url = '';
    const headers = {
      'Content-Type': 'application/json',
    };

    const upstreamPayload = {
      ...payload,
      stream: true,
    };

    if (normProvider === 'anthropic' || normProvider === 'claude') {
      url = 'https://api.anthropic.com/v1/messages';
      headers['x-api-key'] = apiKey;
      headers['anthropic-version'] = '2023-06-01';
      headers['anthropic-beta'] = 'prompt-caching-2024-07-31';
      if (!upstreamPayload.max_tokens) {
        upstreamPayload.max_tokens = 4096;
      }
      if (typeof upstreamPayload.system === 'string') {
        upstreamPayload.system = [
          {
            type: 'text',
            text: upstreamPayload.system,
            cache_control: { type: 'ephemeral' },
          },
        ];
      }
    } else if (normProvider === 'openai') {
      url = 'https://api.openai.com/v1/chat/completions';
      headers['Authorization'] = `Bearer ${apiKey}`;
      if (!upstreamPayload.max_tokens) {
        upstreamPayload.max_tokens = 4096;
      }
    } else if (normProvider === 'openrouter') {
      url = 'https://openrouter.ai/api/v1/chat/completions';
      headers['Authorization'] = `Bearer ${apiKey}`;
      headers['HTTP-Referer'] = 'http://localhost:3000';
      headers['X-Title'] = 'KAIwa';
      if (!upstreamPayload.max_tokens) {
        upstreamPayload.max_tokens = 4096;
      }
    } else if (normProvider === 'gemini') {
      url = 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions';
      headers['Authorization'] = `Bearer ${apiKey}`;
    } else if (normProvider === 'deepseek') {
      url = 'https://api.deepseek.com/chat/completions';
      headers['Authorization'] = `Bearer ${apiKey}`;
    } else if (normProvider === 'groq') {
      url = 'https://api.groq.com/openai/v1/chat/completions';
      headers['Authorization'] = `Bearer ${apiKey}`;
    } else if (normProvider === 'ollama') {
      url = 'http://localhost:11434/api/chat';
    } else if (normProvider === 'lmstudio') {
      url = 'http://localhost:1234/v1/chat/completions';
    } else {
      return NextResponse.json(
        { error: `Unsupported provider: ${provider}` },
        { status: 400 }
      );
    }

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(upstreamPayload),
    });

    if (!response.ok) {
      let errText = '';
      try {
        errText = await response.text();
      } catch {
        errText = response.statusText;
      }
      return NextResponse.json(
        { error: `Upstream error (${response.status}): ${errText}` },
        { status: response.status }
      );
    }

    const upstreamStream = response.body;
    if (!upstreamStream) {
      return NextResponse.json(
        { error: 'No response body received from upstream provider' },
        { status: 502 }
      );
    }

    const textEncoder = new TextEncoder();
    const textDecoder = new TextDecoder();

    const transformStream = new TransformStream({
      start() {
        this.buffer = '';
      },
      transform(chunk, controller) {
        this.buffer += textDecoder.decode(chunk, { stream: true });
        const lines = this.buffer.split('\n');
        this.buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;

          // 1. Anthropic Claude stream framing
          if (normProvider === 'anthropic' || normProvider === 'claude') {
            if (trimmed.startsWith('data:')) {
              const dataStr = trimmed.replace(/^data:\s*/, '');
              try {
                const data = JSON.parse(dataStr);
                if (data.type === 'content_block_delta') {
                  // Only forward actual text content — silently discard thinking/reasoning tokens
                  const token = data.delta?.text || '';
                  if (token) {
                    controller.enqueue(
                      textEncoder.encode(`data: ${JSON.stringify({ token })}\n\n`)
                    );
                  }
                }
              } catch {
                // Ignore parse errors on keepalives or incomplete lines
              }
            }
          }
          // 2. Ollama stream framing (ndjson lines)
          else if (normProvider === 'ollama') {
            try {
              const data = JSON.parse(trimmed);
              // Only forward actual content — discard thinking tokens
              const token = data.message?.content || data.response;
              if (token) {
                controller.enqueue(
                  textEncoder.encode(`data: ${JSON.stringify({ token })}\n\n`)
                );
              }
            } catch {
              // Ignore partial JSON
            }
          }
          // 3. OpenAI / OpenRouter / Gemini / Groq SSE stream framing
          else {
            if (trimmed.startsWith('data:')) {
              const dataStr = trimmed.replace(/^data:\s*/, '');
              if (dataStr === '[DONE]') {
                continue;
              }
              try {
                const data = JSON.parse(dataStr);
                const delta = data.choices?.[0]?.delta;
                
                // Only forward actual content — discard reasoning_content/reasoning tokens
                const token = delta?.content;
                if (token) {
                  controller.enqueue(
                    textEncoder.encode(`data: ${JSON.stringify({ token })}\n\n`)
                  );
                }
              } catch {
                // Ignore partial JSON
              }
            }
          }
        }
      },
      flush(controller) {
        controller.enqueue(textEncoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`));
      },
    });

    const streamResponse = upstreamStream.pipeThrough(transformStream);

    return new Response(streamResponse, {
      status: 200,
      headers: {
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Streaming API error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', message: error.message },
      { status: 500 }
    );
  }
}
