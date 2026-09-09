# Decisions Log

### D-01 — 2026-09-09 — No framework, no build step
**Status:** Locked
**Decision:** Vanilla JavaScript with native ES6 modules. No React/Vue/Svelte, no bundler.
**Reasoning:** Built by an offline agent with no internet, iterated on across many sessions. Native modules need zero tooling, are directly debuggable in browser devtools, and remove build-config as a failure mode. Framework re-render cycles also fight against the frame-by-frame car-on-path animation this game centers on.
**Alternatives considered:** React + Vite (rejected — build-tooling risk offline, abstraction cost for AI-driven debugging). Svelte (same build-tooling concern).

### D-02 — 2026-09-09 — SVG Rendering
**Status:** Locked
**Decision:** SVG (real DOM elements) for the track, car, telemetry, and UI. A single `<canvas>` overlay used *only* for particle bursts.
**Reasoning:** SVG assets you hand-author load with zero conversion and are inspectable/CSS-animatable. Canvas is reserved for the one case (many short-lived particles) where DOM elements would genuinely be the wrong tool.
**Alternatives considered:** Canvas for everything (rejected — harder to build and debug UI and paths manually).

### D-03 — 2026-09-09 — Minimal State Shape
**Status:** Locked
**Decision:** One in-memory plain object (`gameState`) holding only raw, minimal data (levels, flags, timestamps, best times). All display/derived values are computed by pure functions on demand — never cached in state. No class instances anywhere in state; plain serializable objects only.
**Reasoning:** Eliminates an entire category of "stale cached value" bugs. Plain objects mean `JSON.stringify(state)` always works for saving and for debug dumps.

### D-04 — 2026-09-09 — Upgrade Scope
**Status:** Assumed (flag for confirmation)
**Decision:** Engine / Aero / Tyres are **per-car** (each Formula tier levels these up independently, starting from 0 when purchased). Pit Crew and Driver are **global / team-wide**, shared across whichever car is active.
**Reasoning:** Inferred from GDD §15 (garage shows per-car "upgrade levels") and the "Team Principal manages the team" framing (§23–25), which implies pit crew/driver belong to the operation, not the car.

### D-05 — 2026-09-09 — Persistence
**Status:** Locked
**Decision:** `localStorage`, JSON, tagged with `meta.saveVersion`, passed through a migration chain on load before use.
**Reasoning:** The state shape *will* change repeatedly as the project is built across sessions. Versioning from day one is far cheaper than retrofitting it after several saves already exist in the wild.

### D-06 — 2026-09-09 — Audio
**Status:** Locked
**Decision:** Synthesized via the Web Audio API (oscillators, short filtered noise bursts, gain envelopes). No audio files.
**Reasoning:** No internet needed to source/license files; fully self-contained; every sound is a few tunable numbers; fits the arcade-toy tone.

### D-07 — 2026-09-09 — Fonts
**Status:** Locked
**Decision:** System font stacks only (`-apple-system, "Segoe UI", Roboto, sans-serif` for UI; `ui-monospace, "SF Mono", Consolas, "Courier New", monospace` reserved for *live numeric readouts only*). No webfonts, no CDN font links.
**Reasoning:** Zero dependency, zero offline risk. Monospace is used functionally (fixed-width digits prevent jitter on updating numbers).

### D-08 — 2026-09-09 — Game loop
**Status:** Locked
**Decision:** `requestAnimationFrame` drives continuous animation (car-on-path position, ticking telemetry). A separate coarser tick (~4–10 times/sec, accumulated inside the rAF loop or a `setInterval`) drives discrete simulation: automated lap completion, autosave checks.
**Reasoning:** Keeps animation smooth without coupling it to simulation-step rate, and vice versa.

### D-09 — 2026-09-09 — Fast-automation handling
**Status:** Assumed (flag for confirmation)
**Decision:** Animated lap duration has a floor (~1.5–2s minimum). Laps completed faster than that (heavy automation, offline progress) are not individually animated — they resolve as a single batched result (`+14 laps · +38,200 CR`).
**Reasoning:** Keeps the "watching the car drive" moment meaningful even at high automation instead of it degenerating into a blur or requiring absurd animation speeds.

### D-10 — 2026-09-09 — Testing
**Status:** Locked
**Decision:** No test framework/dependency. A lightweight runtime state-validator plus the manual checklist in `tests/manual-test-checklist.md` instead.
**Reasoning:** Matches project scope; avoids adding tooling dependency for a small, short-lived, single-player static site.

### D-11 — 2026-09-09 — Version control
**Status:** Locked
**Decision:** Git, initialized at project start. One commit per completed build phase, commit message matching the CHANGELOG entry for that phase.
**Reasoning:** Since sessions don't share memory, git history is the actual safety net if a later session breaks something — you can diff or revert to the last working phase.
