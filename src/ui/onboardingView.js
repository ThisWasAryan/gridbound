import { EventBus } from "../utils/eventBus.js";

let stateRef = null;
let overlayElement = null;

const TUTORIALS = {
  start_lap: {
    id: "start_lap",
    title: "Welcome to Gridbound!",
    message:
      "Click the START LAP button to send your kart around the track. When it crosses the finish line, you will earn Credits!",
    targetSelector: "#start-lap-btn",
  },
  first_upgrade: {
    id: "first_upgrade",
    title: "Upgrade Available",
    message:
      "You have enough credits to upgrade! Check the Upgrades tab to increase your performance and reduce your lap times.",
  },
  pitstop_intro: {
    id: "pitstop_intro",
    title: "Pit Stop Required!",
    message:
      "Your tyres are degrading! Click quickly in the pit stop minigame to swap your tyres and get back on track.",
  },
};

export function initOnboardingView(state) {
  stateRef = state;

  const helpBtn = document.createElement("button");
  helpBtn.id = "help-btn";
  helpBtn.innerHTML = "?";
  helpBtn.title = "How to Play";
  document.body.appendChild(helpBtn);

  helpBtn.addEventListener("click", showHelpModal);

  overlayElement = document.createElement("div");
  overlayElement.id = "onboarding-overlay";
  overlayElement.className = "hidden";
  document.body.appendChild(overlayElement);

  // Use a lightweight check to trigger tutorials
  EventBus.on("credits:changed", checkEconomyTutorials);
  EventBus.on("pitstop:requested", () => triggerTutorial("pitstop_intro"));

  // Initial check (delay slightly so UI has time to render)
  setTimeout(() => {
    if (!stateRef.onboarding.seenIds.includes("start_lap")) {
      triggerTutorial("start_lap");
    }
  }, 500);
}

function checkEconomyTutorials({ total }) {
  if (!stateRef.onboarding.seenIds.includes("first_upgrade") && total >= 150) {
    triggerTutorial("first_upgrade");
  }
}

function triggerTutorial(tutorialId) {
  if (stateRef.onboarding.seenIds.includes(tutorialId)) return;

  const tut = TUTORIALS[tutorialId];
  if (!tut) return;

  stateRef.onboarding.seenIds.push(tutorialId);

  overlayElement.innerHTML = `
        <div class="tutorial-modal">
            <h3>${tut.title}</h3>
            <p>${tut.message}</p>
            <button class="primary-btn" id="tutorial-ok-btn">GOT IT</button>
        </div>
    `;
  overlayElement.classList.remove("hidden");

  if (tut.targetSelector) {
    const target = document.querySelector(tut.targetSelector);
    if (target) target.classList.add("tutorial-highlight");
  }

  document.getElementById("tutorial-ok-btn").addEventListener("click", () => {
    overlayElement.classList.add("hidden");
    document
      .querySelectorAll(".tutorial-highlight")
      .forEach((el) => el.classList.remove("tutorial-highlight"));
  });
}

function showHelpModal() {
  overlayElement.innerHTML = `
        <div class="tutorial-modal help-modal">
            <h2>How to Play</h2>
            <div class="help-content" style="text-align: left; margin: 15px 0;">
                <p><strong>1. Race:</strong> Click START LAP to race around the track and earn credits.</p>
                <p><strong>2. Upgrade:</strong> Spend credits on Engine, Aero, and Tyres to go faster.</p>
                <p><strong>3. Pit Stops:</strong> Occasionally you will need to pit. React quickly to minimize time lost!</p>
                <p><strong>4. Expand:</strong> Buy new tracks and cars to earn massive credit multipliers.</p>
            </div>
            <button class="primary-btn" id="help-close-btn">CLOSE</button>
        </div>
    `;
  overlayElement.classList.remove("hidden");

  document.getElementById("help-close-btn").addEventListener("click", () => {
    overlayElement.classList.add("hidden");
  });
}
