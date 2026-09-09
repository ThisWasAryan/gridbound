import { EventBus } from "../utils/eventBus.js";

let containerElement = null;

export function initAchievementView() {
  containerElement = document.createElement("div");
  containerElement.id = "achievement-toast-container";
  document.body.appendChild(containerElement);

  EventBus.on("achievement:unlocked", showAchievementToast);
}

function showAchievementToast(achievement) {
  const toast = document.createElement("div");
  toast.className = "achievement-toast";

  toast.innerHTML = `
        <div class="achievement-icon">${achievement.icon}</div>
        <div class="achievement-text">
            <h4>Achievement Unlocked!</h4>
            <div class="achievement-title">${achievement.title}</div>
            <div class="achievement-desc">${achievement.description}</div>
        </div>
    `;

  containerElement.appendChild(toast);

  // Trigger reflow for animation
  void toast.offsetWidth;
  toast.classList.add("show");

  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => toast.remove(), 500);
  }, 4000);
}
