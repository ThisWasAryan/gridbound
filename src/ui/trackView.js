import { CARS_CONFIG } from "../config/cars.config.js";
import { TRACKS_CONFIG } from "../config/tracks.config.js";
import { EventBus } from "../utils/eventBus.js";

let containerElement;
let trackElement;
let racelinePath;
let carGroup;

let stateRef;

/**
 * Initializes the track view and injects the SVGs.
 * @param {HTMLElement} container
 * @param {Object} state
 */
export async function initTrackView(container, state) {
  containerElement = container;
  stateRef = state;

  // Clear container
  containerElement.innerHTML = "";

  // Create track name overlay
  const trackNameOverlay = document.createElement("div");
  trackNameOverlay.id = "track-name-overlay";
  trackNameOverlay.className = "track-name-overlay";
  containerElement.appendChild(trackNameOverlay);

  // Create track image/svg container
  trackElement = document.createElement("div");
  trackElement.className = "track-container";
  containerElement.appendChild(trackElement);

  await loadTrackAndCar(
    state.session.currentTrackId,
    state.session.currentCarId,
  );

  // Listen to lap progress
  EventBus.on("lap:progress", handleLapProgress);
  EventBus.on("lap:completed", handleLapCompleted);
  EventBus.on("track:switched", handleTrackSwitched);
  EventBus.on("car:switched", handleCarSwitched);
}

function handleTrackSwitched() {
  loadTrackAndCar(
    stateRef.session.currentTrackId,
    stateRef.session.currentCarId,
  );
}

function handleCarSwitched() {
  loadTrackAndCar(
    stateRef.session.currentTrackId,
    stateRef.session.currentCarId,
  );
}

/**
 * Loads the track and car SVGs and sets up references.
 */
async function loadTrackAndCar(trackId, carId) {
  const trackDef = TRACKS_CONFIG[trackId];
  const carDef = CARS_CONFIG[carId];

  // Load track SVG (simulate fetching)
  // For local static, we can fetch the SVG text and inject it so we can access paths.
  try {
    const trackRes = await fetch(trackDef.svgPath);
    const trackSvg = await trackRes.text();
    trackElement.innerHTML = trackSvg;

    // Find raceline
    racelinePath = trackElement.querySelector("#raceline");

    // Load Car SVG
    const carRes = await fetch(carDef.svgPath);
    const carSvgText = await carRes.text();

    // Create a group for the car to move along the track
    carGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
    carGroup.id = "active-car";
    carGroup.innerHTML = carSvgText;

    // Offset the nested SVG to center it correctly on the path
    const innerSvg = carGroup.querySelector("svg");
    if (innerSvg) {
      const width = parseFloat(innerSvg.getAttribute("width") || "30");
      const height = parseFloat(innerSvg.getAttribute("height") || "30");
      innerSvg.setAttribute("x", -width / 2);
      innerSvg.setAttribute("y", -height / 2);
    }

    // Append car to the track SVG
    const svgElement = trackElement.querySelector("svg");
    
    // Add start grid indicator if raceline exists
    if (racelinePath) {
        const startPoint = racelinePath.getPointAtLength(0);
        const startIndicator = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        startIndicator.setAttribute("cx", startPoint.x);
        startIndicator.setAttribute("cy", startPoint.y);
        startIndicator.setAttribute("r", 8);
        startIndicator.setAttribute("fill", "#00ffaa");
        startIndicator.setAttribute("stroke", "#14161b");
        startIndicator.setAttribute("stroke-width", 2);
        svgElement.appendChild(startIndicator);
    }
    
    svgElement.appendChild(carGroup);
    
    // Update track name
    const trackNameOverlay = document.getElementById("track-name-overlay");
    if (trackNameOverlay) {
        trackNameOverlay.textContent = trackDef.name;
    }

    // Initial positioning
    updateCarPosition(0);
  } catch (e) {
    console.error("Failed to load SVGs:", e);
  }
}

function handleLapProgress({ progress }) {
  updateCarPosition(progress);
}

function handleLapCompleted() {
  updateCarPosition(0);
}

/**
 * Updates the visual car position on the track.
 * @param {number} progress - 0.0 to 1.0
 */
function updateCarPosition(progress) {
  if (!racelinePath || !carGroup) return;

  const length = racelinePath.getTotalLength();
  // Wrap around gracefully just in case it hits > 1
  const p = Math.max(0, Math.min(1, progress));

  const point = racelinePath.getPointAtLength(length * p);

  // Calculate rotation using a point slightly ahead
  const delta = 0.5; // pixels
  let nextPoint = racelinePath.getPointAtLength(
    Math.min(length, length * p + delta),
  );

  // Handle edge case at exactly 1.0 (end of path)
  if (length * p + delta > length) {
    // Look backwards to calculate slope instead
    const prevPoint = racelinePath.getPointAtLength(length * p - delta);
    nextPoint = point;
    const angle =
      (Math.atan2(nextPoint.y - prevPoint.y, nextPoint.x - prevPoint.x) * 180) /
      Math.PI;
    carGroup.setAttribute(
      "transform",
      `translate(${point.x}, ${point.y}) rotate(${angle})`,
    );
    return;
  }

  const angle =
    (Math.atan2(nextPoint.y - point.y, nextPoint.x - point.x) * 180) / Math.PI;

  carGroup.setAttribute(
    "transform",
    `translate(${point.x}, ${point.y}) rotate(${angle})`,
  );
}
