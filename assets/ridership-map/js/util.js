export function keepInViewport(panel) {
  panel.style.left = '0';
  panel.style.right = 'auto';
  const rect = panel.getBoundingClientRect();
  if (rect.right > window.innerWidth - 8) {
    panel.style.left = 'auto';
    panel.style.right = '0';
  }
}
