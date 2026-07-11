# AGENTS.md — Project Context for KAIwa

## What this project is
KAIwa is a fully local Japanese learning tutor (like Pingo) built for a capstone.
Core features:
- JLPT test reviewer, starting at N5 level
- "AI Kaiwa" — local conversational practice powered by LocalAI (no external API calls)
- Persistent memory: user identity, skill level, and N5 score persist across sessions

## Stack & Conventions
- Runtime: Node.js LTS
- AI inference: LocalAI (self-hosted, local-only — never call external LLM APIs for Kaiwa mode)
- Commit style: Conventional Commits (feat:, fix:, docs:, chore:, refactor:, test:)
- Branching: main is always deployable; feature branches per task

## Coding conventions
- Prefer clear, small functions over cleverness
- All persistent user data (skill level, N5 score, profile) must be stored locally, never sent to a remote server
- Comment any AI-prompt-construction logic clearly, since prompt design is core to tutoring quality

## Things to avoid
- No cloud LLM calls in the "AI Kaiwa" conversational feature — it must stay local via LocalAI
- Don't hardcode JLPT question content directly in UI components — keep content data-driven