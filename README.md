# Kaiwa 🇯🇵

Kaiwa (会話, “conversation”) is a local-first Japanese conversation-practice
capstone app. Users roleplay with AI personas through their own OpenRouter API
key, stored client-side in the browser.

## Current v1 scope

- React + Vite + Tailwind CSS
- No backend server, user accounts, or database
- OpenRouter requests are made directly from the browser
- API key is stored in `localStorage` with an in-app disclaimer
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

Optional: choose a specific OpenRouter model by setting:

```bash
VITE_OPENROUTER_MODEL=openrouter/auto
```

## Important privacy note

This v1 is local-first in the sense that it has no hosted backend and does not
persist chat history. OpenRouter chat requests are still external network calls
made with the user-provided key. The key is saved in browser `localStorage`, not
encrypted.

## License

See [LICENSE](./LICENSE).
