export function createNumberPopup(text, x, y, color = "#F5F7FA") {
  const popup = document.createElement("div");
  popup.textContent = text;
  popup.className = "number-popup";
  popup.style.left = `${x}px`;
  popup.style.top = `${y}px`;
  popup.style.color = color;
  popup.style.position = "fixed"; /* fixed so it works regardless of scroll */

  document.body.appendChild(popup);

  // Trigger animation on next frame
  requestAnimationFrame(() => {
    popup.classList.add("animate");
  });

  // Remove element after animation
  popup.addEventListener("animationend", () => popup.remove());
  // Fallback removal in case animationend doesn't fire
  setTimeout(() => {
    if (popup.parentNode) popup.remove();
  }, 1500);
}
