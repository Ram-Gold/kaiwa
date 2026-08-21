import { describe, it, expect } from 'vitest';
import {
  getAIModelConfig,
  assembleSystemPrompt,
  isStreamingEnabled,
  setStreamingEnabled,
  STREAMING_STORAGE_KEY
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

  it('assembles complete system prompt with Japanese constraints', () => {
    const prompt = assembleSystemPrompt();
    expect(prompt).toContain('You are a Japanese conversation partner.');
    expect(prompt).toContain('CONVERSATION RULES');
    expect(prompt).toContain('<suggestions>');
  });
});

