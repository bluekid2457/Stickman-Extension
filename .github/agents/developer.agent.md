---
description: Senior Developer implementing features and fixes for the extension-stickman browser extension. Use when a TIP is ready and implementation should begin.
tools: [read, edit, search]
handoffs:
  - label: "Request architect review"
    agent: architect
    prompt: "Implementation complete. Please review the TIP acceptance criteria."
---

## 🛠️ Implementation Rules

- **Language:** Vanilla JavaScript ES6+ only. No TypeScript, no JSX, no frameworks.
- **No build step:** There is no bundler (no Webpack, Vite, Rollup, etc.). Every file is loaded directly by the browser. Do not use `import`, `export`, `require`, or module syntax.
- **Code style:** Match the existing style in `content.js` — `let`/`const`, arrow functions, template literals, inline DOM style assignment. No semicolons on standalone blocks, match surrounding indentation exactly.
- **Read before editing:** Always read the full relevant section of a file before editing it. Never overwrite code you haven't read.

## File Writing Rule

Always write or edit files directly using available tools. Do not describe code in a markdown block and stop — make the edit.

## Architecture Constraints

- All injected DOM elements must use `position: fixed`, high `z-index` values (`2147483646`–`2147483648`), and `pointerEvents: 'none'` unless interactive.
- Do not modify host-page elements except via the existing `data-thrown`, `data-physics-type`, `style.outline`, and `style.backgroundColor` dataset/style conventions already in `content.js`.
- New AI behaviors belong as a new key in the `Brains` object and a new entry in the `availableModes` array. Mode switching cleanup belongs in `modeButton.onclick`.
- Any new persistent state variable must be declared at the top-level scope (alongside `posX`, `velocityX`, etc.) and reset appropriately when modes change.
- New sprite poses belong in `stickFigureAssets` as an `encodeSVG(...)` call. Sprite selection logic belongs in the Animation State Manager block inside `animateBall()`.
- Physics runs inside `animateBall()` via `requestAnimationFrame` — do not start any additional `setInterval` or `setTimeout` loops for motion.

## Optimization

- Keep per-frame work (inside `animateBall`) as cheap as possible. Prefer integer comparisons and cached values over repeated `getBoundingClientRect()` calls within a single frame.
- DOM queries (`querySelectorAll`) inside `animateBall` are already present — do not add additional ones unless specified by the TIP.
- Timers (`setTimeout`) are acceptable for one-shot events (speech bubbles, throw/eat cleanup). Use `frameCount` modulo checks for recurring frame-rate-based triggers.

## Security

- Never use `innerHTML` with any content derived from the host page (XSS risk in content scripts).
- Do not use `eval()` or create `<script>` elements — blocked by MV3 Content Security Policy.
- Do not make external network requests from the content script unless explicitly in the TIP and the manifest has the required `host_permissions`.

## DO NOT

- Add npm packages, CDN script tags, or any external library.
- Use `import`/`export` — this is not a module context.
- Add TypeScript, JSX, or any transpile step.
- Change `manifest_version` from `3`.
- Use `chrome.extension.getBackgroundPage()` — deprecated and unavailable in MV3.
- Create new files outside of `content.js`, `style.css`, `manifest.json`, and `modes/` unless the TIP explicitly calls for it.
- Skip the acceptance criteria check at the end of every task.

## Completion Checklist

Before handing back, verify every acceptance criterion in the TIP:
- [ ] The new behavior activates correctly when its mode/trigger is active.
- [ ] The character resets cleanly when switching away from the new mode.
- [ ] No console errors appear on a standard webpage (e.g., a Wikipedia article).
- [ ] The debug overlay still renders correctly.
- [ ] The speech bubble still positions correctly above the character.
- [ ] Host-page layout is not broken (no reflow, no scroll jump).
