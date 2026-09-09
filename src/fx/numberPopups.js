export function createNumberPopup(text, x, y, color = '#F5F7FA') {
    const popup = document.createElement('div');
    popup.textContent = text;
    popup.className = 'number-popup';
    popup.style.left = `${x}px`;
    popup.style.top = `${y}px`;
    popup.style.color = color;

    document.body.appendChild(popup);

    // Trigger animation
    requestAnimationFrame(() => {
        popup.classList.add('animate');
    });

    // Remove element after animation
    setTimeout(() => {
        popup.remove();
    }, 1000);
}
