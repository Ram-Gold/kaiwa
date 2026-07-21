# KAIwa Development Workflow & Round Comparison

This document provides a comparison of the technical implementation, correctness, accessibility, and edge-case handling between Round 1 (Vague Plan) and Round 2 (Precise Implementation), along with styling corrections applied to ensure complete Neobrutalist design compliance.

---

## 1. Comparison Matrix

| Metric | Round 1 (Vague Plan) | Round 2 (Precise Implementation) |
| :--- | :--- | :--- |
| **Correctness** | Shared a single API key field; switching providers would overwrite or lose credentials. Relied on a deprecated OpenRouter client. | Separate, dedicated storage keys per provider (`kaiwa.ai.apiKey.*`). Structured custom adapters for OpenAI, Claude, Gemini, and local Ollama. |
| **Accessibility** | Basic form fields without explicit association or role descriptors. Errors were not announced to screen readers. | Full accessibility compliance: `<label htmlFor>`, dynamic `aria-describedby` linking, `role="alert"` for errors, and `role="status"` for success notifications. |
| **Edge Case Handling** | Standard browser validation on submit only. No checks on API key formatting. Tests crashed under Node v25+ due to native `localStorage` locks. | Live inline validation with key prefix checks (`sk-`, `AIza`/`AQ`, `sk-ant-`). Prevented saving on active errors. Custom mock for test safety. |
| **Review & Refactoring** | Spent ~10 minutes aligning state logic, cleaning up unused screens, and purging `openrouter.js`. | Spent ~5 minutes correcting neobrutalist styling details (focus outlines and disabled-hover transitions). |

---

## 2. Technical Breakdown

### Correctness Comparison
- **Round 1 (Vague)**: The plan did not detail how the prompt-construction would change per LLM provider. Since Claude requires the system prompt as a top-level JSON field rather than a role inside the message array, the app would fail when contacting Anthropic.
- **Round 2 (Precise)**: Created a unified [ai.js](file:///home/ram/Projects/Cross-platform/KAIwa/src/lib/ai.js) client that parses history and handles provider-specific JSON request formatting (e.g. system key inside Claude payloads, message lists for Gemini compatibility mode, and local server calls for Ollama).

### Accessibility Comparison
- **Round 1 (Vague)**: Missing ARIA attributes for inputs. Screen readers would fail to describe error states or save actions dynamically.
- **Round 2 (Precise)**: Used specific labels linked directly with input IDs. Added `aria-describedby="api-key-error"` so screen readers speak the validation error text immediately when focusing the invalid key field. Error messages use `role="alert"` and success messages use `role="status" aria-live="polite"` for automatic assistive announcements.

### Edge Case Handling Comparison
- **Round 1 (Vague)**: No checks were performed on key inputs prior to sending. An invalid key would send a request to the server, resulting in a network error screen.
- **Round 2 (Precise)**: Implemented live prefix checkers. If a user tries to save an OpenAI key that doesn't start with `sk-`, the validation prevents form submission. To support modern testing environments, a manual mock for `window.localStorage` was added to [setup.js](file:///home/ram/Projects/Cross-platform/KAIwa/src/test/setup.js) to resolve lock errors on Node v25+.

---

## 3. Neobrutalism Styling Corrections

To maintain KAIwa's strict Japanese Neobrutalist styling, we identified and corrected two styling gaps:

### A. Disabled Buttons Static State
- **Issue**: Standard Neobrutalist buttons translate/slide on hover to simulate clicking. However, when the "Save settings" button was `disabled`, it still translated on hover, giving a confusing interactive signal.
- **Fix**: Modified [Button.jsx](file:///home/ram/Projects/Cross-platform/KAIwa/src/components/ui/Button.jsx) variants to prefix all hover translation classes with `enabled:` (e.g. `enabled:hover:translate-x-boxShadowX`). Now, disabled buttons remain completely flat and static.

### B. Focus Outlines on Select Dropdown
- **Issue**: Focusing on the `<select>` dropdown displayed the browser's default soft blue outline, which broke the neobrutalist aesthetic.
- **Fix**: Added `select:focus-visible` to [index.css](file:///home/ram/Projects/Cross-platform/KAIwa/src/index.css)'s focus rule. Now, focusing on the provider select dropdown shows the signature thick, mustard-colored outline matching all other text inputs and buttons:
```css
button:focus-visible,
a:focus-visible,
input:focus-visible,
select:focus-visible,
textarea:focus-visible {
  outline: 4px solid var(--main);
  outline-offset: 3px;
}
```
