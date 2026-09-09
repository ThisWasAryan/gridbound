import { loadGame, saveGame } from "./state/saveLoad.js";
import { initDebugPanel } from "./debug/debugPanel.js";
import { initRender } from "./ui/render.js";
import { startGameLoop } from "./systems/gameLoop.js";
import { initEconomySystem } from "./systems/economySystem.js";
import { initPitStopSystem } from "./systems/pitStopSystem.js";
import { initAchievementSystem } from "./systems/achievementSystem.js";
import { initPrincipalSystem } from "./systems/principalSystem.js";

let gameState;

/**
 * Initializes the application.
 */
function init() {
  console.log("Initializing FORMULA INCREMENTAL...");

  // Load and migrate state
  gameState = loadGame();

  // Save state immediately to ensure meta format is stored
  saveGame(gameState);

  // Initialize debug panel
  initDebugPanel(gameState);

  // Initialize systems
  initEconomySystem(gameState);
  initPitStopSystem(gameState);
  initAchievementSystem(gameState);
  initPrincipalSystem(gameState);

  // Initialize rendering
  initRender(gameState);

  // Start game loop
  startGameLoop(gameState);

  console.log("Game initialized successfully.");
}

// Boot the game
init();
