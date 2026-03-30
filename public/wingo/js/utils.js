import { resolveGameFromLabel } from './gameConfig.js';

export function getGameFromItemElement(item) {
  const text = item?.textContent || '';
  return resolveGameFromLabel(text.replace(/\n/g, ' '));
}

export function setActiveGameItem(items, activeItem) {
  (items || []).forEach((item) => item.classList.remove('active'));
  if (activeItem) {
    activeItem.classList.add('active');
  }
}

