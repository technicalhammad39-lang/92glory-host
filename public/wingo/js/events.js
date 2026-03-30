export function getPopupClassSuffix(betType, selection) {
  if (betType === 'COLOR') {
    if (selection === 'RED') return '10';
    if (selection === 'GREEN') return '11';
    if (selection === 'VIOLET') return '12';
  }
  if (betType === 'SIZE') {
    return selection === 'BIG' ? '13' : '14';
  }
  return String(selection);
}

export function openOverlay(elements) {
  if (elements?.overlay) {
    elements.overlay.style.display = '';
  }
  if (elements?.dialogDiv) {
    elements.dialogDiv.style.display = '';
  }
  document.body.classList.add('van-overflow-hidden');
}

export function closeOverlay(elements) {
  if (elements?.overlay) {
    elements.overlay.style.display = 'none';
  }
  if (elements?.dialogDiv) {
    elements.dialogDiv.style.display = 'none';
  }
  document.body.classList.remove('van-overflow-hidden');
}

export function showToast(toastElement, textElement, message) {
  if (!toastElement) return;
  if (textElement && message) {
    textElement.textContent = message;
  }
  toastElement.style.display = '';
  window.setTimeout(() => {
    toastElement.style.display = 'none';
  }, 2000);
}

