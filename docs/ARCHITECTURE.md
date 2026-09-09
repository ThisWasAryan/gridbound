# Architecture

The FORMULA INCREMENTAL web toy is built using a purely functional, zero-tooling Vanilla JS architecture.

## Overview

The game follows an explicit separation of concerns:
- **Configuration (`config/`)**: Static balance data, formulas, and definitions.
- **State (`state/`)**: Holds the canonical, minimal `gameState` object. Handles reading/writing from `localStorage` via a versioned migration chain.
- **Systems (`systems/`)**: Pure functions that compute derived values (e.g., lap times, profit) and execute game logic. They take `state` and `config` as input, mutate the state, and emit events. They NEVER access the DOM.
- **UI (`ui/`)**: Re-renders components based on state changes and events. Never mutates state directly.
- **Audio/FX (`audio/`, `fx/`)**: Self-contained modules that listen to game events and produce visual/audio feedback ("game juice").

## Data Flow

`User Interaction` -> `ui/*` -> calls -> `systems/*` -> mutates -> `state/gameState` -> emits -> `utils/eventBus` -> triggers -> `ui/*` & `fx/*` & `audio/*`

See [DECISIONS.md](./DECISIONS.md) for rationale on technical choices.
