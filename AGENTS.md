# AGENTS.md — Project Context for KAIwa

## What this project is
KAIwa is a fully local Japanese learning tutor (like Pingo) built for a capstone.
Core features:
- JLPT test reviewer, starting at N5 level
- "AI Kaiwa" — conversational practice powered by Ollama (local-first, with option for user-provided external AI API keys)
- Persistent memory: user identity, skill level, and N5 score persist across sessions

## Stack & Conventions
- Frontend: React + Vite + Tailwind CSS — currently a PWA web application (migration to React Native planned in the future)
- AI Inference: Multiple providers (OpenRouter, OpenAI, or local Ollama) configured via user settings
- Storage: Persistent local browser storage (`localStorage`)
- Commit style: Conventional Commits (feat:, fix:, docs:, chore:, refactor:, test:)
- Branching: main is always deployable; feature branches per task

## Coding conventions
- Prefer clear, small functions over cleverness
- All persistent user data (skill level, N5 score, profile, and settings) must be stored locally, never sent to a remote server
- Comment any AI-prompt-construction logic clearly, since prompt design is core to tutoring quality

## Things to avoid
- Do not make external cloud calls if the user has selected a local provider (like Ollama). Ensure the selected provider config is respected.
- Don't hardcode JLPT question content directly in UI components — keep content data-driven