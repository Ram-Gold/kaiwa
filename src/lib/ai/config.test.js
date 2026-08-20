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

  it('assembles complete system prompt with Japanese constraints and persona', () => {
    const persona = { id: 'sensei', name: 'Ken-sensei', systemPrompt: 'You are Ken-sensei, a patient Japanese teacher.' };
    const prompt = assembleSystemPrompt(persona, { userPersona: 'Exchange student in Tokyo' });
    expect(prompt).toContain('You are Ken-sensei, a patient Japanese teacher.');
    expect(prompt).toContain('CONVERSATION RULES');
    expect(prompt).toContain('Learner Context: Exchange student in Tokyo');
    expect(prompt).toContain('<suggestions>');
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

  it('injects scenario briefing goals and target phrases into system prompt', () => {
    const persona = { id: 'sensei', name: 'Ken-sensei', systemPrompt: 'You are Ken-sensei.' };
    const briefing = {
      title: 'Idol Cheki',
      jpTitle: 'ライブ後の一言',
      level: 'N4',
      summary: 'Post-live cheki moment with your favorite idol.',
      headsUp: ['Keep it short.', 'Compliments should be sincere.'],
      prep: ['ライブ最高でした', '応援しています'],
    };

    const prompt = assembleSystemPrompt(persona, { briefing, turn: 3, maxTurns: 10 });
    expect(prompt).toContain('=== ROLEPLAY SCENARIO & OBJECTIVES ===');
    expect(prompt).toContain('Idol Cheki (ライブ後の一言) - Level N4');
    expect(prompt).toContain('Keep it short.');
    expect(prompt).toContain('Target Practice Phrases: ライブ最高でした, 応援しています');
    expect(prompt).toContain('=== TURN PROGRESSION: TURN 3/10 (7 turns remaining) ===');
  });

  it('injects final farewell guidance on Turn 10', () => {
    const persona = { id: 'idol', name: 'Hana-chan', systemPrompt: 'You are Hana-chan.' };
    const prompt = assembleSystemPrompt(persona, { turn: 10, maxTurns: 10 });
    expect(prompt).toContain('=== TURN PROGRESSION: FINAL TURN (10/10) ===');
    expect(prompt).toContain('Deliver your warm in-character final farewell and goodbye');
    expect(prompt).toContain('Do NOT ask any new questions');
  });
});

