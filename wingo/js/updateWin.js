import { formatMoney, getResultMeta } from './gameConfig.js';

function clearTypeClasses(element) {
  if (!element) return;
  Array.from(element.classList)
    .filter((name) => /^type\d+$/.test(name))
    .forEach((name) => element.classList.remove(name));
}

export function hideWinDialog(elements) {
  if (!elements?.winDialog) return;
  elements.winDialog.style.display = 'none';
  document.body.classList.remove('van-overflow-hidden');
}

export function showWinDialog(elements, payload) {
  if (!elements?.winDialog || !payload) return;
  const meta = getResultMeta(payload.resultNumber, payload.resultColor, payload.resultSize);
  const winBody = elements.winDialog.querySelector('.WinningTip__C-body');
  if (winBody) {
    winBody.style.backgroundImage = "url('/wingo/assets/png/missningBg-c1f02bcd.png')";
    winBody.style.backgroundSize = 'cover';
    winBody.style.backgroundPosition = 'center';
  }

  if (elements.winDetail) {
    elements.winDetail.textContent = `Period: ${payload.issueNumber}`;
  }
  if (elements.winSmallBig) {
    elements.winSmallBig.textContent = meta.size;
  }
  if (elements.winningNum) {
    elements.winningNum.textContent = String(meta.number);
  }
  if (elements.winColor) {
    elements.winColor.textContent = meta.colorText;
  }
  if (elements.winBonus) {
    elements.winBonus.textContent = formatMoney(payload.winAmount);
  }

  if (elements.colorType) {
    clearTypeClasses(elements.colorType);
    elements.colorType.classList.add(meta.typeClass);
  }

  elements.winDialog.style.display = '';
  document.body.classList.add('van-overflow-hidden');
}
