import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const body = await req.json();
    const { provider, apiKey, payload } = body;

    if (!provider || !payload) {
      return NextResponse.json(
        { error: 'Missing provider or payload' },
        { status: 400 }
      );
    }

    if (provider !== 'ollama' && !apiKey) {
      return NextResponse.json(
        { error: 'Missing API key' },
        { status: 401 }
      );
    }

    let url = '';
    let headers = {
      'Content-Type': 'application/json',
    };

    if (provider === 'ollama') {
      // Note: If Ollama is running on localhost, it might need to be accessible from where this server runs
      url = 'http://localhost:11434/api/chat';
    } else if (provider === 'openai') {
      url = 'https://api.openai.com/v1/chat/completions';
      headers['Authorization'] = `Bearer ${apiKey}`;
    } else if (provider === 'openrouter') {
      url = 'https://openrouter.ai/api/v1/chat/completions';
      headers['Authorization'] = `Bearer ${apiKey}`;
      headers['HTTP-Referer'] = 'http://localhost:3000';
      headers['X-Title'] = 'KAIwa';
    } else if (provider === 'gemini') {
      url = 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions';
      headers['Authorization'] = `Bearer ${apiKey}`;
    } else if (provider === 'claude') {
      url = 'https://api.anthropic.com/v1/messages';
      headers['x-api-key'] = apiKey;
      headers['anthropic-version'] = '2023-06-01';
      // We don't need 'dangerouslyAllowBrowser' here because this is a server-side request!
    } else {
      return NextResponse.json(
        { error: `Unsupported provider: ${provider}` },
        { status: 400 }
      );
    }

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    
    // We forward the exact status and data to the client
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('API Chat Error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', message: error.message },
      { status: 500 }
    );
  }
}
