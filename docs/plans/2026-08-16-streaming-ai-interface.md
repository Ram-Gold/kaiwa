# Streaming AI Interface Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement a production-grade, token-by-token streaming AI interface for KAIwa's central Japanese conversational practice ("AI Kaiwa"), configurable via a global Settings toggle (off by default, applying across all roles/personas), featuring server-side streaming via AI SDK / SSE, client-side streaming consumption, abort control (stop button), smart auto-scroll with pinned/unpinned states, smooth thinking-to-token handoffs, and conversation state persistence.

**Architecture:** A unified server-side streaming API route (`/api/chat/stream`) using Vercel AI SDK / SSE streams, consumed by a streaming chat client with a global settings toggle (`kaiwa.ai.streaming_enabled`, default: false). When enabled, all roles (Sensei, Idol, Station attendant, Store clerk, Interviewer, etc.) across both `ConversationStage` and `ChatScreen` stream responses token-by-token with stop controls, thinking handoffs, and auto-scroll pinning.

**Tech Stack:** Next.js 16 (App Router), Vercel AI SDK (`ai`, `@ai-sdk/anthropic`), React 19, Motion (`motion/react`), Vitest & React Testing Library.

---

### Task 1: Create Centralized Model Configuration & Prompt Module

**Files:**
- Create: `src/lib/ai/config.js`
- Test: `src/lib/ai/config.test.js`

**Step 1: Write the failing test**

```javascript
import { describe, it, expect } from 'vitest';
import { getAIModelConfig, assembleSystemPrompt } from './config.js';

describe('AI Config & System Prompt Engine', () => {
  it('returns valid model config for Claude and other providers', () => {
    const config = getAIModelConfig('claude');
    expect(config.model).toBe('claude-3-5-haiku-20241022');
    expect(config.temperature).toBe(0.8);
  });

  it('assembles complete system prompt with Japanese constraints and persona', () => {
    const persona = { id: 'sensei', systemPrompt: 'You are Ken-sensei.' };
    const prompt = assembleSystemPrompt(persona, { userPersona: 'Beginner student' });
    expect(prompt).toContain('You are Ken-sensei.');
    expect(prompt).toContain('STRICT JAPANESE LANGUAGE RULE');
    expect(prompt).toContain('Learner Persona Context: Beginner student');
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/ai/config.test.js`
Expected: FAIL with "Cannot find module './config.js'"

**Step 3: Write minimal implementation**

Create `src/lib/ai/config.js` with:
- Model defaults for `claude`, `openai`, `gemini`, `openrouter`, `ollama`.
- `assembleSystemPrompt(persona, userContext)` assembling persona system prompt, strict Japanese language rules, token minimization, and JSON suggestions output contracts.

**Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/ai/config.test.js`
Expected: PASS

**Step 5: Commit**

```bash
git add src/lib/ai/config.js src/lib/ai/config.test.js
git commit -m "feat(ai): add centralized AI model configuration and prompt builder"
```

---

### Task 2: Create Server-Side Token Streaming API Route (`/api/chat/stream`)

**Files:**
- Create: `src/app/api/chat/stream/route.js`
- Test: `src/app/api/chat/stream/route.test.js`

**Step 1: Write the failing test**

```javascript
import { describe, it, expect, vi } from 'vitest';
import { POST } from './route.js';

describe('Streaming Chat API Route', () => {
  it('returns 400 when missing provider or payload', async () => {
    const req = new Request('http://localhost/api/chat/stream', {
      method: 'POST',
      body: JSON.stringify({}),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/app/api/chat/stream/route.test.js`
Expected: FAIL with "Cannot find module './route.js'"

**Step 3: Write minimal implementation**

Install Vercel AI SDK dependencies if needed (`ai`, `@ai-sdk/anthropic`) or build robust Web ReadableStream/SSE server handler supporting Claude & multi-provider text streaming with header `Content-Type: text/event-stream`.

**Step 4: Run test to verify it passes**

Run: `npx vitest run src/app/api/chat/stream/route.test.js`
Expected: PASS

**Step 5: Commit**

```bash
git add src/app/api/chat/stream/route.js src/app/api/chat/stream/route.test.js package.json
git commit -m "feat(api): create streaming SSE route handler for token-by-token responses"
```

---

### Task 3: Create Custom Streaming Chat Hook with Abort Control & State Persistence (`useStreamingChat`)

**Files:**
- Create: `src/lib/hooks/useStreamingChat.js`
- Test: `src/lib/hooks/useStreamingChat.test.js`

**Step 1: Write the failing test**

```javascript
import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useStreamingChat } from './useStreamingChat.js';

describe('useStreamingChat Hook', () => {
  it('initializes with default empty messages state and stop handler', () => {
    const { result } = renderHook(() => useStreamingChat({ personaId: 'test-persona' }));
    expect(result.current.messages).toEqual([]);
    expect(result.current.isThinking).toBe(false);
    expect(result.current.isStreaming).toBe(false);
    expect(typeof result.current.stop).toBe('function');
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/hooks/useStreamingChat.test.js`
Expected: FAIL with "Cannot find module './useStreamingChat.js'"

**Step 3: Write minimal implementation**

Implement `useStreamingChat` hook with:
- State variables: `messages`, `input`, `setInput`, `status` ('idle' | 'thinking' | 'streaming' | 'error'), `suggestions`, `error`.
- `sendMessage(text)` function using `fetch` with `AbortController`.
- Reads SSE chunks (`ReadableStream` / `getReader()`) using `TextDecoder`.
- Handoff logic: sets `status = 'thinking'` before stream connection, switches to `status = 'streaming'` on arrival of first text chunk, updating assistant message content token-by-token.
- `stop()` method aborting `AbortController`, persisting partial assistant message, re-enabling input field for follow-up turns.
- LocalStorage persistence key `kaiwa.chat_history.<personaId>`.

**Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/hooks/useStreamingChat.test.js`
Expected: PASS

**Step 5: Commit**

```bash
git add src/lib/hooks/useStreamingChat.js src/lib/hooks/useStreamingChat.test.js
git commit -m "feat(chat): implement useStreamingChat hook with abort control and token stream parsing"
```

---

### Task 4: Create Robust Auto-Scroll Container & Streaming Message Bubbles

**Files:**
- Create: `src/components/chat/StreamingChatMessages.jsx`
- Create: `src/components/chat/StreamingChatBubble.jsx`
- Test: `src/components/chat/StreamingChatMessages.test.jsx`

**Step 1: Write the failing test**

```javascript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import StreamingChatMessages from './StreamingChatMessages.jsx';

describe('StreamingChatMessages Component', () => {
  it('renders messages and shows thinking indicator during thinking phase', () => {
    render(
      <StreamingChatMessages
        messages={[{ id: '1', role: 'user', content: 'こんにちは' }]}
        status="thinking"
      />
    );
    expect(screen.getByText('こんにちは')).toBeInTheDocument();
    expect(screen.getByTestId('thinking-indicator')).toBeInTheDocument();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/chat/StreamingChatMessages.test.jsx`
Expected: FAIL with "Cannot find module './StreamingChatMessages.jsx'"

**Step 3: Write minimal implementation**

Implement `StreamingChatMessages` & `StreamingChatBubble`:
- Auto-scroll mechanics:
  - Tracks `isAtBottom` using `onScroll` event listener.
  - Automatically scrolls to bottom on message content update ONLY IF `isAtBottom === true`.
  - Floating "Jump to bottom" button appears when `!isAtBottom && isStreaming`.
- Handoff animation: Thinking indicator smoothly transforms into token stream without visual layout flicker.
- Safe Japanese text rendering with dictionary popover integration.

**Step 4: Run test to verify it passes**

Run: `npx vitest run src/components/chat/StreamingChatMessages.test.jsx`
Expected: PASS

**Step 5: Commit**

```bash
git add src/components/chat/StreamingChatMessages.jsx src/components/chat/StreamingChatBubble.jsx src/components/chat/StreamingChatMessages.test.jsx
git commit -m "feat(ui): add StreamingChatMessages with smart auto-scroll pinning and seamless thinking handoff"
```

---

### Task 5: Assemble Full Streaming Interface Screen with Stop/Regenerate Controls & Phone-Width Styling

**Files:**
- Modify: `src/components/chat/ChatScreen.jsx` (or create `StreamingChatScreen.jsx`)
- Create: `src/app/chat/streaming/page.jsx`
- Test: `src/components/chat/StreamingChatScreen.test.jsx`

**Step 1: Write the failing test**

```javascript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import StreamingChatScreen from './StreamingChatScreen.jsx';

describe('StreamingChatScreen Component', () => {
  it('renders chat header, message history, input bar and action buttons', () => {
    render(<StreamingChatScreen personaId="mariko" provider="claude" />);
    expect(screen.getByPlaceholderText(/メッセージを入力/i)).toBeInTheDocument();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/chat/StreamingChatScreen.test.jsx`
Expected: FAIL with "Cannot find module './StreamingChatScreen.jsx'"

**Step 3: Write minimal implementation**

- Connect `useStreamingChat` hook with `StreamingChatMessages` and input bar.
- Add Stop button during active stream (`status === 'streaming'`), transforming seamlessly back to Send button when idle/stopped.
- Add phone-width container formatting (`max-w-xl mx-auto h-[100dvh] flex flex-col`).
- Create dedicated route `/chat/streaming` for instant preview and reviewer testing.

**Step 4: Run test to verify it passes**

Run: `npx vitest run src/components/chat/StreamingChatScreen.test.jsx`
Expected: PASS

**Step 5: Commit**

```bash
git add src/components/chat/StreamingChatScreen.jsx src/app/chat/streaming/page.jsx src/components/chat/StreamingChatScreen.test.jsx
git commit -m "feat(chat): assemble full streaming AI Kaiwa interface with mobile layout and stop controls"
```

---

### Task 6: Final Integration Verification & Build Check

**Step 1: Run complete unit test suite**

Run: `npm test`
Expected: All tests pass cleanly.

**Step 2: Execute Next.js build verification**

Run: `npm run build`
Expected: Production build completes without lint or build errors.
