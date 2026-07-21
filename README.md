# Kaiwa 🇯🇵

Kaiwa (会話, “conversation”) is a local-first Japanese conversation-practice
capstone app. Users roleplay with AI personas through their chosen AI provider
(OpenRouter, OpenAI, or local Ollama), stored client-side in the browser. Currently,
the application is built as a Progressive Web App (PWA), with plans to target React Native
in the future.

## Current v1 scope

- React + Vite + Tailwind CSS (PWA)
- No backend server, user accounts, or database
- AI requests are made directly from the browser (or local server for Ollama)
- Credentials and settings are stored in browser `localStorage`
- Chat history is kept only in component state and resets on refresh
- Personas: Sensei, Crush, Idol

## Setup

```bash
npm install
npm run dev
```

To build for production:

```bash
npm run build
```

## Important privacy note

This v1 is local-first in the sense that it has no hosted backend and does not
persist chat history. Cloud-based AI requests (OpenRouter/OpenAI) are still external network calls
made with the user-provided key. Credentials are saved in browser `localStorage`, not
encrypted.


## License

See [LICENSE](./LICENSE).
