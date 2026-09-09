# State Shape Canonical Schema

This document defines the canonical raw state shape for `gameState` and its version history.

## Version History

### Version 1
- Initial schema definition. Contains base resources, car definitions, track definitions, team levels, best times, and basic session tracking.

## Canonical Schema (v1)

```javascript
{
  meta: {
    saveVersion: 1,
    createdAt: 0,          // epoch ms — first launch
    lastActiveTime: 0,     // epoch ms — used for offline progress calc
    totalPlayTimeMs: 0
  },
  economy: {
    credits: 0,
    lifetimeCreditsEarned: 0
  },
  cars: {
    kart: { owned: true,  engineLevel: 0, aeroLevel: 0, tyreLevel: 0 },
    f4:   { owned: false, engineLevel: 0, aeroLevel: 0, tyreLevel: 0 },
    f3:   { owned: false, engineLevel: 0, aeroLevel: 0, tyreLevel: 0 },
    f2:   { owned: false, engineLevel: 0, aeroLevel: 0, tyreLevel: 0 },
    f1:   { owned: false, engineLevel: 0, aeroLevel: 0, tyreLevel: 0 }
  },
  team: {                  
    pitCrewLevel: 0,
    driverLevel: 0,
    driverName: "Driver"
  },
  tracks: {
    karting:     { owned: true },
    buddh:       { owned: false },
    monza:       { owned: false },
    silverstone: { owned: false },
    spa:         { owned: false },
    monaco:      { owned: false }
  },
  session: {
    currentCarId: "kart",
    currentTrackId: "karting"
  },
  bestTimes: {
    // key = `${carId}:${trackId}`, value = milliseconds.
  },
  principals: {
    hiredIds: [],           
    activeId: null,
    automationEnabled: false
  },
  achievements: {
    unlockedIds: []
  },
  onboarding: {
    seenIds: []              
  },
  settings: {
    muted: false,
    volume: 0.8
  }
}
```
