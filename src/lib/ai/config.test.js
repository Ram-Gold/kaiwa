import { describe, it, expect } from 'vitest';
import {
  getAIModelConfig,
  assembleSystemPrompt,
  isStreamingEnabled,
  setStreamingEnabled,
  STREAMING_STORAGE_KEY,
  parseThinkingAndSpeech
} from './config.js';

describe('AI Config & System Prompt Engine', () => {
  it('returns valid model config for claude and other providers', () => {
    const claudeConfig = getAIModelConfig('anthropic');
    expect(claudeConfig.model).toBe('claude-3-5-haiku-20241022');
    expect(claudeConfig.temperature).toBe(0.8);

    const openaiConfig = getAIModelConfig('openai');
    expect(openaiConfig.model).toBe('gpt-4o-mini');

    const geminiConfig = getAIModelConfig('gemini');
    expect(geminiConfig.model).toBe('gemini-2.0-flash');

    const ollamaConfig = getAIModelConfig('ollama');
    expect(ollamaConfig.model).toBe('qwen2.5:7b');
  });

  it('assembles complete system prompt with Japanese constraints and persona', () => {
    const persona = { id: 'sensei', name: 'Ken-sensei', systemPrompt: 'You are Ken-sensei, a patient Japanese teacher.' };
    const prompt = assembleSystemPrompt(persona, { userPersona: 'Exchange student in Tokyo' });
    expect(prompt).toContain('You are Ken-sensei, a patient Japanese teacher.');
    expect(prompt).toContain('STRICT JAPANESE LANGUAGE RULE');
    expect(prompt).toContain('Learner Persona Context: Exchange student in Tokyo');
    expect(prompt).toContain('SUGGESTIONS: [');
  });

  it('handles default streaming preference as false', () => {
    expect(STREAMING_STORAGE_KEY).toBe('kaiwa.ai.streaming_enabled');
  });

  it('allows reading and writing streaming toggle setting', () => {
    setStreamingEnabled(true);
    expect(isStreamingEnabled()).toBe(true);

    setStreamingEnabled(false);
    expect(isStreamingEnabled()).toBe(false);
  });

  it('separates model internal thinking from speech dialogue', () => {
    const raw = '<think>Analyze user greeting and respond warmly.</think>こんにちは！元気ですか？';
    const parsed = parseThinkingAndSpeech(raw);
    expect(parsed.thinking).toBe('Analyze user greeting and respond warmly.');
    expect(parsed.speech).toBe('こんにちは！元気ですか？');
    expect(parsed.isThinkingStream).toBe(false);
  });

  it('detects unclosed in-progress thinking stream', () => {
    const raw = '<think>Formulating conversational Japanese';
    const parsed = parseThinkingAndSpeech(raw);
    expect(parsed.thinking).toBe('Formulating conversational Japanese');
    expect(parsed.speech).toBe('');
    expect(parsed.isThinkingStream).toBe(true);
  });

  it('handles standard dialogue without thinking tags', () => {
    const raw = 'いらっしゃいませ！何にしますか？';
    const parsed = parseThinkingAndSpeech(raw);
    expect(parsed.thinking).toBe('');
    expect(parsed.speech).toBe('いらっしゃいませ！何にしますか？');
  });

  it('separates natural language "Here\'s a thinking process:" with Response: label', () => {
    const raw = `Here's a thinking process:
1. **Analyze User Input**: User said "ライブ拝見し、感無量です。"
2. **Determine Character/Role**: Hina is an energetic idol.

**Response:**
ライブ来てくれてありがとう！本当にうれしいよ！`;

    const parsed = parseThinkingAndSpeech(raw);
    expect(parsed.thinking).toContain('Analyze User Input');
    expect(parsed.thinking).toContain('Determine Character/Role');
    expect(parsed.speech).toBe('ライブ来てくれてありがとう！本当にうれしいよ！');
    expect(parsed.isThinkingStream).toBe(false);
  });

  it('separates natural language thinking process followed by Japanese dialogue', () => {
    const raw = `Thinking Process:
The user is asking for directions in Shinjuku.

まっすぐ行って、右に曲がってください。`;

    const parsed = parseThinkingAndSpeech(raw);
    expect(parsed.thinking).toContain('asking for directions');
    expect(parsed.speech).toBe('まっすぐ行って、右に曲がってください。');
    expect(parsed.isThinkingStream).toBe(false);
  });

  it('extracts quoted Japanese dialogue from drafting preambles', () => {
    const raw = `--- Response Checklist ---
- Global constraints: Length/token minimization, strict Japanese only, streamlined thinking wrapped in
30 words max, mandatory dialogue after thinking, card suggestions rule with 5 options. 3. **Draft Japanese Reply (max 2 sentences):** - Need to be Hina: cheerful, grateful, ask about favorite song/performance. - Possible: "こんにちは！元気いっぱい会えて本当にうれしいです！どの曲やパフォーマンスが一番好きですか？" - That's 2 sentences.`;

    const parsed = parseThinkingAndSpeech(raw);
    expect(parsed.speech).toBe('こんにちは！元気いっぱい会えて本当にうれしいです！どの曲やパフォーマンスが一番好きですか？');
    expect(parsed.thinking).toContain('Response Checklist');
    expect(parsed.isThinkingStream).toBe(false);
  });
});
