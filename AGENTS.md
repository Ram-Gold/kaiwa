# AGENTS.md — Project Context for KAIwa

## What this project is
KAIwa is a fully local Japanese learning tutor (like Pingo) built for a capstone.
Core features:
- JLPT test reviewer, starting at N5 level
- "AI Kaiwa" — conversational practice powered by Ollama (local-first, with option for user-provided external AI API keys)
- Persistent memory: user identity, skill level, and N5 score persist across sessions

## Stack & Conventions
- Frontend: Flutter (Dart) — Cross-platform (iOS, Android, Desktop)
- AI Inference: Ollama (default local inference) or external AI services (via user-provided API keys)
- Storage: Persistent local database/storage (e.g., Isar, Hive, or SQLite/Drift)
- Commit style: Conventional Commits (feat:, fix:, docs:, chore:, refactor:, test:)
- Branching: main is always deployable; feature branches per task

## Coding conventions
- Prefer clear, small functions over cleverness
- All persistent user data (skill level, N5 score, profile) must be stored locally, never sent to a remote server
- Comment any AI-prompt-construction logic clearly, since prompt design is core to tutoring quality

## Things to avoid
- Avoid external cloud calls by default in the "AI Kaiwa" conversational feature unless the user has configured their own API keys
- Don't hardcode JLPT question content directly in UI components — keep content data-driven