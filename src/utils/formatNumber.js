/**
 * Formats milliseconds into a readable mm:ss.mmm string.
 * @param {number} ms
 * @returns {string} Formatted time string.
 */
export function formatTime(ms) {
  if (!ms && ms !== 0) return "--:--.---";

  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const milliseconds = Math.floor(ms % 1000);

  const mStr = minutes.toString();
  const sStr = seconds.toString().padStart(2, "0");
  const msStr = milliseconds.toString().padStart(3, "0");

  return `${mStr}:${sStr}.${msStr}`;
}

/**
 * Formats a number of credits, e.g., 1,240 or 1.2M.
 * @param {number} credits
 * @returns {string} Formatted credits string.
 */
export function formatCredits(credits) {
  return new Intl.NumberFormat("en-US").format(Math.floor(credits)) + " CR";
}
