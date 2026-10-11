import { CARS_CONFIG } from "../config/cars.config.js";
import { TRACKS_CONFIG } from "../config/tracks.config.js";
import { EventBus } from "../utils/eventBus.js";

let containerElement;
let trackElement;
let racelinePath;
let carGroup;
let prevAngle = null;

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
  EventBus.on("lap:aborted", handleLapCompleted);
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

const svgCache = {};

async function fetchSvg(path) {
  if (svgCache[path]) return svgCache[path];
  const res = await fetch(path);
  const text = await res.text();
  svgCache[path] = text;
  return text;
}

/**
 * Loads the track and car SVGs and sets up references.
 */
async function loadTrackAndCar(trackId, carId) {
  const trackDef = TRACKS_CONFIG[trackId];
  const carDef = CARS_CONFIG[carId];

  // Show loading skeleton for track
  trackElement.innerHTML = `
      <div style="display:flex; justify-content:center; align-items:center; height:100%; opacity:0.5; min-height: 200px;">
          <div style="width: 40px; height: 40px; border: 4px solid var(--text-muted); border-top-color: var(--accent-primary); border-radius: 50%; animation: spin 1s linear infinite;"></div>
      </div>
      <style>@keyframes spin { to { transform: rotate(360deg); } }</style>
  `;

  // Load track SVG
  try {
    const trackSvg = await fetchSvg(trackDef.svgPath);
    trackElement.innerHTML = trackSvg;

    // Find raceline
    racelinePath = trackElement.querySelector("#raceline");
    computeTrackCurvatureMap();

    // Load Car SVG
    const carSvgText = await fetchSvg(carDef.svgPath);

    // Create a group for the car to move along the track
    carGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
    carGroup.id = "active-car";
    carGroup.innerHTML = carSvgText;

    // Offset and scale the nested SVG to center it precisely on the raceline
    const innerSvg = carGroup.querySelector("svg");
    if (innerSvg) {
      // Scale car to fit naturally within race ribbon (~26-30px length, ~13-15px width)
      const baseW = parseFloat(innerSvg.getAttribute("width") || "30");
      const baseH = parseFloat(innerSvg.getAttribute("height") || "15");
      const targetW = 28;
      const targetH = Math.round(targetW * (baseH / baseW));
      innerSvg.setAttribute("width", targetW);
      innerSvg.setAttribute("height", targetH);
      innerSvg.setAttribute("x", -targetW / 2);
      innerSvg.setAttribute("y", -targetH / 2);
    }

    // Append car to the track SVG
    const svgElement = trackElement.querySelector("svg");
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

let timeNodes = [0];
let distNodes = [0];

function computeTrackCurvatureMap() {
  if (!racelinePath) return;
  const numSamples = 200;
  const length = racelinePath.getTotalLength();
  timeNodes = [0];
  distNodes = [0];
  let totalT = 0;

  for (let i = 1; i <= numSamples; i++) {
    const dist = (i / numSamples) * length;
    const p0 = racelinePath.getPointAtLength(Math.max(0, dist - 5));
    const p1 = racelinePath.getPointAtLength(dist);
    const p2 = racelinePath.getPointAtLength(Math.min(length, dist + 5));

    const a1 = Math.atan2(p1.y - p0.y, p1.x - p0.x);
    const a2 = Math.atan2(p2.y - p1.y, p2.x - p1.x);
    let diff = Math.abs(a2 - a1);
    if (diff > Math.PI) diff = 2 * Math.PI - diff;

    const speed = 1 / (1 + diff * 12);
    const timeSpent = 1 / speed;
    totalT += timeSpent;
    timeNodes.push(totalT);
    distNodes.push(i / numSamples);
  }

  for (let i = 0; i < timeNodes.length; i++) {
    timeNodes[i] /= totalT;
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
  const pClamped = Math.max(0, Math.min(1, progress));

  let distProgress = pClamped;
  if (timeNodes.length > 1) {
    for (let i = 0; i < timeNodes.length - 1; i++) {
      if (pClamped >= timeNodes[i] && pClamped <= timeNodes[i + 1]) {
        const tRatio = (pClamped - timeNodes[i]) / (timeNodes[i + 1] - timeNodes[i]);
        distProgress = distNodes[i] + tRatio * (distNodes[i + 1] - distNodes[i]);
        break;
      }
    }
  }

  const p = Math.max(0, Math.min(1, distProgress));
  const point = racelinePath.getPointAtLength(length * p);

  const delta = 1.5;
  const currentDist = length * p;
  const pA = racelinePath.getPointAtLength(Math.max(0, currentDist - delta));
  const pB = racelinePath.getPointAtLength(Math.min(length, currentDist + delta));
  const angle = (Math.atan2(pB.y - pA.y, pB.x - pA.x) * 180) / Math.PI;

  carGroup.setAttribute(
    "transform",
    `translate(${point.x}, ${point.y}) rotate(${angle})`
  );
}