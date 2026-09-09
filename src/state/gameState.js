/**
 * Returns a fresh, default game state object.
 * @returns {Object} The default game state.
 */
export function getInitialState() {
  return {
    meta: {
      saveVersion: 1,
      createdAt: Date.now(),
      lastActiveTime: Date.now(),
      totalPlayTimeMs: 0,
    },
    economy: {
      credits: 0,
      lifetimeCreditsEarned: 0,
    },
    cars: {
      kart: { owned: true, engineLevel: 0, aeroLevel: 0, tyreLevel: 0 },
      f4: { owned: false, engineLevel: 0, aeroLevel: 0, tyreLevel: 0 },
      f3: { owned: false, engineLevel: 0, aeroLevel: 0, tyreLevel: 0 },
      f2: { owned: false, engineLevel: 0, aeroLevel: 0, tyreLevel: 0 },
      f1: { owned: false, engineLevel: 0, aeroLevel: 0, tyreLevel: 0 },
    },
    team: {
      pitCrewLevel: 0,
      driverLevel: 0,
      driverName: "Driver",
    },
    tracks: {
      karting: { owned: true },
      buddh: { owned: false },
      monza: { owned: false },
      silverstone: { owned: false },
      spa: { owned: false },
      monaco: { owned: false },
    },
    session: {
      currentCarId: "kart",
      currentTrackId: "karting",
    },
    bestTimes: {},
    principals: {
      hiredIds: [],
      activeId: null,
      automationEnabled: false,
    },
    achievements: {
      unlockedIds: [],
    },
    onboarding: {
      seenIds: [],
    },
    settings: {
      muted: false,
      volume: 0.8,
    },
  };
}
