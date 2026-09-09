import { EventBus } from "../utils/eventBus.js";
import { ACHIEVEMENTS } from "../config/achievements.config.js";
import { saveGame } from "../state/saveLoad.js";

let stateRef = null;

export function initAchievementSystem(state) {
  stateRef = state;

  // Bind event listeners for checking conditions
  EventBus.on("lap:completed", checkLapAchievements);
  EventBus.on("upgrade:purchased", checkUpgradeAchievements);
  EventBus.on("track:purchased", checkTrackAchievements);
  EventBus.on("car:purchased", checkCarAchievements);
  EventBus.on("pitstop:completed", checkPitstopAchievements);
  EventBus.on("credits:changed", checkEconomyAchievements);
}

function unlockAchievement(id) {
  if (stateRef.achievements.unlockedIds.includes(id)) return;

  stateRef.achievements.unlockedIds.push(id);
  saveGame(stateRef);

  EventBus.emit("achievement:unlocked", ACHIEVEMENTS[id]);
}

function checkLapAchievements() {
  if (!stateRef.achievements.unlockedIds.includes("first_lap")) {
    unlockAchievement("first_lap");
  }
}

function checkUpgradeAchievements() {
  if (!stateRef.achievements.unlockedIds.includes("first_upgrade")) {
    unlockAchievement("first_upgrade");
  }
}

function checkTrackAchievements() {
  if (!stateRef.achievements.unlockedIds.includes("track_owner")) {
    unlockAchievement("track_owner");
  }
}

function checkCarAchievements() {
  if (!stateRef.achievements.unlockedIds.includes("car_owner")) {
    unlockAchievement("car_owner");
  }
}

function checkPitstopAchievements({ rating }) {
  if (
    rating === "PERFECT" &&
    !stateRef.achievements.unlockedIds.includes("pitstop_perfect")
  ) {
    unlockAchievement("pitstop_perfect");
  }
}

function checkEconomyAchievements() {
  if (
    stateRef.economy.lifetimeCreditsEarned >= 1000000 &&
    !stateRef.achievements.unlockedIds.includes("rich")
  ) {
    unlockAchievement("rich");
  }
}
