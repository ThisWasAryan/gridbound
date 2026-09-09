# Gridbound

Gridbound is a minimalist, browser-based incremental racing game. Players start at the karting level and progressively upgrade their vehicles, manage economy, and hire team personnel to climb the ranks of motorsport up to the Formula 1 tier.
<img width="1919" height="960" alt="image" src="https://github.com/user-attachments/assets/3f2f5d4c-1a96-4fbd-a9be-5b058fbbee27" />

## Live Deployment

Play the game online: [Gridbound on GitHub Pages](https://thiswasaryan.github.io/gridbound/)

## Key Features

* **Progressive Tiers:** Advance through multiple motorsport disciplines, including Karting, Formula 4, Formula 3, Formula 2, and Formula 1.
* **Vehicle Upgrades:** Enhance Engine, Aerodynamics, and Tyres independently for each class to improve performance and revenue generation.
* **Interactive Minigames:** Participate in active gameplay elements like the Pit Stop minigame to maximize efficiency and maintain optimal racing conditions.
* **Automation:** Hire Team Principals at higher tiers (Formula 2 and above) to automate laps and pit stops, transitioning the gameplay from active clicking to strategic management.
* **Dynamic Economy:** Manage race earnings to afford new vehicles, tracks, and upgrades.
* **Responsive Design:** Fully playable on both desktop and mobile devices with a layout that adapts to different screen sizes.
* **Theme Support:** Includes both Light and Dark modes with persistent user preferences.
* **Local Storage Save System:** Game progress is automatically saved to the browser's local storage, allowing players to resume their career at any time.

## Architecture

The application is built using vanilla HTML, CSS, and JavaScript without external frameworks, emphasizing performance and lightweight execution.

* **State Management:** A centralized `gameState` object handles economy, upgrades, settings, and unlock progress.
* **Event System:** Components communicate via a custom EventBus, ensuring decoupled architecture between the UI, game loop, and economy systems.
* **Modular UI:** The interface is divided into self-contained rendering modules (e.g., Track View, Shop View, Telemetry View).

## Local Development

To run the project locally, serve the directory using any static file server. For example, using Python:

```bash
python3 -m http.server 8080
```

Then navigate to `http://localhost:8080` in your web browser.

## Author

Developed by Aryan Raj.
