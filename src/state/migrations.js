export const CURRENT_SAVE_VERSION = 1;

const migrations = {
    // Add one entry per version bump, e.g.:
    // 2: (old) => ({ ...old, ... }),
};

/**
 * Migrates a raw state object to the current version.
 * @param {Object} rawState - The state to migrate.
 * @returns {Object} The migrated state.
 */
export function migrate(rawState) {
    let state = rawState;
    let version = state?.meta?.saveVersion ?? 0;
    while (migrations[version + 1]) {
        state = migrations[version + 1](state);
        version += 1;
    }
    state.meta = { ...state.meta, saveVersion: CURRENT_SAVE_VERSION };
    return state;
}
